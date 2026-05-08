import { Moment } from "moment";
import { INVOICE_CATEGORY, INVOICE_TYPE, VAT_CONFIG_STATUS } from "../../common/constant";
import { IInvoiceModel, ILaAndICBModel } from "../../common/interface";
import { generateUid, getActiveFundBlockBed } from "../helpers";
import moment from "moment";
import { IVatConfig } from "../../common/interface/laAndICB";

interface OverlapResult {
    overlapStart: Moment;
    overlapEnd: Moment;
    days: number;
}


interface ArrearsItem {
    vatRate: number;
    id: string;
    description: string;
    weekPrice: number;
    oldweekPrice?: number;
    amount: number;
    vatId: string;
    qty: number;
    category: number;
    period: { from: string; to: string };
    diffAmount: number;
    subTotal: number;
}
const m = (v: any): Moment => moment(v, "YYYY-MM-DD");

interface InvoiceRow {
    startDate: string;
    endDate: string;
    totalPrice: number;
    arrearsDiff: number;
    arrearsTotalPrice: number;
    invoiceTo: number;
    originalInvoice: IInvoiceModel;
    arrearsItems: ArrearsItem[];
}

// ======================= HELPER FUNCTIONS =======================

const safeMoment = (d: any): Moment | null => {
    if (!d) return null;
    const m = moment(d);
    return m.isValid() ? m : null;
};


const getOverlap = (invoiceStart: Moment, invoiceEnd: Moment, start: any, end: any): OverlapResult | null => {
    const s = safeMoment(start);
    const e = safeMoment(end);
    if (!s || !e) return null;

    const overlapStart = moment.max(invoiceStart, s);
    const overlapEnd = moment.min(invoiceEnd, e);

    if (overlapEnd.isBefore(overlapStart)) return null;

    const days = overlapEnd.diff(overlapStart, "days") + 1;
    if (days <= 0) return null;

    return { overlapStart, overlapEnd, days };
};


const splitVat = (start: Moment, end: Moment, list: IVatConfig[]) => {
    const active = list
        .filter(v => +v.status === VAT_CONFIG_STATUS.ACTIVE)
        .sort((a, b) => m(a.vatEffectiveDate).valueOf() - m(b.vatEffectiveDate).valueOf());

    if (!active.length)
        return [{ from: start, to: end, vat: null }];

    let segments: any[] = [];
    let cursor = start.clone();

    active.forEach((v, i) => {
        const eff = m(v.vatEffectiveDate);
        if (eff.isAfter(end)) return;

        if (eff.isAfter(cursor)) {
            segments.push({ from: cursor.clone(), to: eff.clone().subtract(1, "day"), vat: null });
        }

        const next = active[i + 1];
        const segEnd = next
            ? m(next.vatEffectiveDate).clone().subtract(1, "day")
            : end.clone();

        segments.push({ from: eff, to: segEnd, vat: v });
        cursor = segEnd.clone().add(1, "day");
    });

    if (cursor.isSameOrBefore(end))
        segments.push({ from: cursor.clone(), to: end.clone(), vat: null });

    return segments;
};

const calcTotals = (
    weekPrice: number,
    days: number,
    vatRate: number,
    formula: string | null,
    applyFormula: boolean
) => {
    let base = (weekPrice / 7) * days;

    if (applyFormula && formula) {
        try {
            const expr = formula.replace(/weekPrice/g, weekPrice.toString());
            // eslint-disable-next-line no-new-func
            base = Function(`"use strict";return (${expr})`)();
        } catch {
            base = (weekPrice / 7) * days;
        }
    }

    base = +base.toFixed(2);
    const total = +(base * (1 + vatRate / 100)).toFixed(2);
    return { base, total };
};


export function checkArrearsAndCreditBlockBedInvoice({
    invoiceList,
    isCredit,
    laOrICBfundDetails,
    vatList,
}: {
    invoiceList: IInvoiceModel[];
    isCredit: boolean;
    laOrICBfundDetails?: ILaAndICBModel;
    vatList: any[];
}): any {

    if (!invoiceList?.length || !laOrICBfundDetails?.blockBeds?.length) return [];



    const rows: InvoiceRow[] = [];

    for (const invoice of invoiceList.filter(i => i.type === INVOICE_TYPE.BLOCK_BED)) {
        if (!invoice) continue;
        const invoiceStart = m(invoice.sDate);
        const invoiceEnd = m(invoice.eDate);

        const arrearsItems: ArrearsItem[] = [];

        for (const item of invoice.items) {
            const itemStart = m(item.period.from);
            const itemEnd = m(item.period.to);

            // const fundOverlap = getOverlap(invoiceStart, invoiceEnd, activeBlockBedInfo.sDate, activeBlockBedInfo.eDate);



            for (const [blockBedIndex, blockBed] of laOrICBfundDetails?.blockBeds.entries()) {
                const blockBedSDate = m(blockBed.sDate);
                const blockBedEDate = m(blockBed.eDate);

                const blockBedOverlap = getOverlap(itemStart, itemEnd, blockBedSDate, blockBedEDate);
                if (!blockBedOverlap) continue;



                const ovStart = moment.max(blockBedOverlap.overlapStart, blockBedOverlap.overlapStart);
                const ovEnd = moment.min(blockBedOverlap.overlapEnd, blockBedOverlap.overlapEnd);
                if (ovEnd.isBefore(ovStart)) continue;
                const segments = splitVat(ovStart, ovEnd, laOrICBfundDetails?.vatConfigList || []);

                for (const seg of segments) {


                    const segStart = moment.max(blockBedOverlap.overlapStart, seg.from);

                    const segEnd = seg.to;
                    const segDays = segEnd.diff(segStart, "days") + 1;
                    const itemDays = itemEnd.diff(itemStart, "days") + 1;
                                 if (segDays <= 0) continue;

                    const vatConfig = seg.vat
                        ? vatList.find(v => v.id === seg.vat.vatId)
                        : null;

                    const vatRate = vatConfig ? Number(vatConfig.rate) : 0;

                    const isMonthStart = segStart.isSame(segStart.clone().startOf("month"), "day");
                    const isMonthEnd = segEnd.isSame(segEnd.clone().endOf("month"), "day");
                    const isBeforeInvoicEndAndBlockBedEndDate = blockBedEDate.isBefore(invoiceEnd);

                    // isBeforeInvoicEndAndBlockBedEndDate?itemDays:segDays
                    const weekPrice = Number(blockBed.perWeek);
                    if (!weekPrice) continue;
                    const exp = calcTotals(
                        weekPrice,
                        segDays,
                        vatRate,
                        null,
                        isMonthStart && isMonthEnd
                    ).total;

                    const billed = calcTotals(
                        item.weekPrice,
                        isBeforeInvoicEndAndBlockBedEndDate && isCredit && item.weekPrice >= weekPrice ? itemDays : segDays,
                        +item.vatRate,
                        null,
                        isMonthStart && isMonthEnd
                    ).total;

                    const creditApply = (invoice.creditApply || []).reduce((s, a) => s + Number(a.amount || 0), 0);
                    const arrearsApply = (invoice.arrearsApply || []).reduce((s, a) => s + Number(a.amount || 0), 0);

                    const paid = billed - (!isCredit ? creditApply : arrearsApply);

                    // const diff =
                    //     isSameInvoicEndAndBlockBedEndDate
                    //         ? exp - paid
                    //         : Math.abs(exp - Number(item.amount));

                    // const diff = Math.abs(exp - Number(item.amount));
                    const diff = exp - paid
                    // ignore invalid differences
                    // if (!(isCredit && diff < 0 || !isCredit && diff > 0)) continue;
                    // For credit note → only negative diff


                    // FILTERING LOGIC (IMPORTANT FIX)
                    if (isCredit) {
                        // credit = refund = diff must be negative
                        if (diff >= 0) continue;
                    } else {
                        // arrears = extra charge = diff must be positive
                        if (diff <= 0) continue;
                    }


                    arrearsItems.push({
                        vatRate: item.vatRate,
                        id: generateUid(),
                        description: "",
                        weekPrice: +(weekPrice - item.weekPrice).toFixed(2),
                        oldweekPrice: +item.weekPrice.toFixed(2),
                        amount: !isCredit ? +diff.toFixed(2) : exp,
                        vatId: item.vatId,
                        qty: 1,
                        category: INVOICE_CATEGORY.BED,
                        period: {
                            from: segStart.format("YYYY-MM-DD"),
                            to: segEnd.format("YYYY-MM-DD")
                        },
                        diffAmount: +diff.toFixed(2),
                        subTotal: +(exp - billed).toFixed(2)
                    });



                }

            }


        }

        if (!arrearsItems.length) continue;

        const totalDiff = arrearsItems.reduce((s, it) => s + it.diffAmount, 0);
        const creditApply = (invoice.creditApply || []).reduce((s, a) => s + +a.amount, 0);
        const final = isCredit ? Math.abs(totalDiff) - creditApply : totalDiff;
        if (final <= 0) continue;

        rows.push({
            startDate: invoiceStart.format("YYYY-MM-DD"),
            endDate: invoiceEnd.format("YYYY-MM-DD"),
            totalPrice: invoice.totalPrice,
            arrearsDiff: final,
            arrearsTotalPrice: arrearsItems.reduce((s, it) => s + it.amount, 0),
            invoiceTo: +invoice.invoiceTo,
            originalInvoice: invoice,
            arrearsItems
        });
        // };




    };

    return rows;




}