import moment from "moment";
import { Moment } from "moment";
import { BLOCK_BEDS_STATUS, INVOICE_CATEGORY, INVOICE_TO_TYPE, INVOICE_TYPE, VAT_CONFIG_STATUS } from "../../common/constant";
import { generateUid, getActiveFundBlockBed } from "../helpers";
import { invoiceModel } from "../../common/model/invoice";












interface OverlapResult {
    overlapStart: Moment;
    overlapEnd: Moment;
    days: number;
}
interface CreateInvoiceParams {
    formData: any;
    fundType: any;
    laOrICBfundDetails: any;
    // localICBList: any[];
    vatList: any[];
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



const getVatAmount = (amount: number, vatRate: number): number => {
    try {
        return +((amount * vatRate) / (100 + vatRate)).toFixed(2);
    } catch {
        return 0;
    }
};

const sortVatConfigs = (vatConfigs: any[]) =>
    [...vatConfigs]
        .filter(v => +v.status === VAT_CONFIG_STATUS.ACTIVE)
        .sort(
            (a, b) =>
                moment(a.vatEffectiveDate).valueOf() -
                moment(b.vatEffectiveDate).valueOf()
        );


const splitByVat = (start: Moment, end: Moment, vatConfigList: any[]) => {
    const vats = vatConfigList
        .filter(v => v.status == 1)
        .sort((a: any, b: any) => moment(a.vatEffectiveDate).valueOf() - moment(b.vatEffectiveDate).valueOf());

    const result: any[] = [];
    let currentFrom = start.clone();

    for (let i = 0; i < vats.length; i++) {
        const vat = vats[i];
        const eff = moment(vat.vatEffectiveDate);

        // Skip if VAT starts after request end
        if (eff.isAfter(end)) continue;

        // Case 1: VAT effective is after our currentFrom → we need a null VAT block
        if (eff.isAfter(currentFrom)) {
            result.push({
                from: currentFrom,
                to: eff.clone().subtract(1, "day"),
                vat: null
            });
        }

        // Determine the end of this VAT segment (next VAT - 1 day OR request end)
        const nextVat = vats[i + 1];
        let toDate = end.clone();

        if (nextVat) {
            const nextEff = moment(nextVat.vatEffectiveDate);
            if (nextEff.isSameOrBefore(end)) {
                toDate = nextEff.clone().subtract(1, "day");
            }
        }

        result.push({
            from: eff.clone(),
            to: toDate.clone(),
            vat
        });

        currentFrom = toDate.clone().add(1, "day");
    }

    // No VAT present inside the range
    if (result.length === 0) {
        result.push({
            from: start,
            to: end,
            vat: null
        });
    }

    return result;
};


const getVatForDate = (date: string, vatConfigList: any[]) => {
    const curr = moment(date, "YYYY-MM-DD");
    let match = null;

    vatConfigList.forEach(v => {
        if (curr.isSameOrAfter(moment(v.vatEffectiveDate, "YYYY-MM-DD"))) {
            match = v;
        }
    });

    return match;
};



export const createBlockBedInvoiceByDate = (params: CreateInvoiceParams) => {
    try {
        const {
            formData,
            fundType,
            laOrICBfundDetails,
            // localICBList,
            vatList,
        } = params;


        let groupedItems: any = []


        // Helper to push final rows into invoice output
        const pushRow = (
            invoiceTo: number,
            vatTotal: number,
            subTotal: number,
            totalPrice: number,
            fundTypeId = "",
            items: any[] = [],
            residentData?: { roomId: string, bedId: string, residentId: string }
        ) => {
            rows.push({
                ...invoiceModel,
                // fundSource,
                // fncStatus,
                // incontStatus,
                type: INVOICE_TYPE.BLOCK_BED,
                fundType,
                sDate: formData.sDate,
                eDate: formData.eDate,
                roomId: residentData?.roomId ?? '',
                bedId: residentData?.bedId ?? '',
                residentId: residentData?.residentId ?? '',
                invoiceTo,
                totalPrice: +totalPrice.toFixed(2),
                fundTypeId,
                subTotal,
                vatTotal,
                items,
            });
        };
        if (!formData?.sDate || !formData?.eDate) return [];

        const invoiceStart = safeMoment(formData.sDate)!;
        const invoiceEnd = safeMoment(formData.eDate)!;
        const rows: any[] = [];


        let laOrIcbVatConfigList: any[] = [];
        if (laOrICBfundDetails) {
            laOrIcbVatConfigList = sortVatConfigs(laOrICBfundDetails?.vatConfigList ?? []);
        };
        let blockBedHistory: any = []
        let noOfBlockBed = 0

        for (const [index, activeBlockBedInfo] of laOrICBfundDetails?.blockBeds.entries()) {

            blockBedHistory = laOrICBfundDetails.blockBedHistory.filter(({ blockBedId, status }: any) => blockBedId === activeBlockBedInfo.id && status === BLOCK_BEDS_STATUS.ACTIVE);



            const fundOverlap = getOverlap(invoiceStart, invoiceEnd, activeBlockBedInfo.sDate, activeBlockBedInfo.eDate);
            noOfBlockBed = (activeBlockBedInfo.noOfBlockBed - blockBedHistory?.length)

            if (!fundOverlap) continue;

            const price = +activeBlockBedInfo.perWeek;
            if (!price) continue;

            const vatFNCSegments = splitByVat(fundOverlap.overlapStart, fundOverlap.overlapEnd, laOrIcbVatConfigList);

            for (const [index, segmentFNC] of vatFNCSegments.entries()) {


                const vatSegments = moment.max(fundOverlap.overlapStart, moment(segmentFNC.from));

                const segDays = segmentFNC.to.diff(vatSegments, "days") + 1;

                if (segDays <= 0) continue;

                const fncVat = segmentFNC.vat
                    ? vatList.find((v: any) => v.id === segmentFNC.vat.vatId)
                    : null;

                const base = +(price / 7 * segDays).toFixed(2);


                const total = +(base * (1 + Number(fncVat?.rate ?? 0) / 100)).toFixed(2);
                groupedItems.push({
                    id: generateUid(),
                    category: INVOICE_CATEGORY.BED,
                    qty: 1,
                    weekPrice: price,
                    amount: total,
                    vatId: fncVat?.id ?? "",
                    vatRate: fncVat?.rate ?? 0,
                    // period: {
                    //     from: overlap.overlapStart.format("YYYY-MM-DD"),
                    //     to: overlap.overlapEnd.format("YYYY-MM-DD")
                    // }
                    period: {
                        from: vatSegments.format("YYYY-MM-DD"),
                        to: segmentFNC.to.format("YYYY-MM-DD"),
                    },
                });

                // pushItem(INVOICE_TO_TYPE.LA, price, fundOverlap, laOrICBfundDetails.id, 0, '');
                // groupedItems[INVOICE_TO_TYPE.THIRD_PARTY_TOPUP].slice(-1)[0].amount = total;
            }

        }



        const entityId = laOrICBfundDetails?.id ?? "";
        const totalAmount = groupedItems.reduce((s: number, i: { amount: number }) => s + i.amount, 0);
        const vatTotal = groupedItems.reduce((s: number, i: { amount: number, vatRate: number }) => s + getVatAmount(i.amount, i.vatRate), 0);

        const subTotal = +(totalAmount - vatTotal).toFixed(2);
        for (const [index, blockBed] of blockBedHistory.entries()) {
            const residentDetails = {
                roomId: blockBed.residentData?.roomId,
                bedId: blockBed.residentData?.bedId,
                residentId: blockBed.residentData?.id,
            };
            pushRow(fundType, vatTotal, subTotal, totalAmount, entityId, groupedItems, residentDetails);
        }

        for (let i = 0; i < noOfBlockBed; i++) {
            pushRow(fundType, vatTotal, subTotal, totalAmount, entityId, groupedItems);
        }



        return rows




    }

    catch (err) {
        console.error("❌ createInvoiceDataByDate error:", err);
        return [];
    }

};
