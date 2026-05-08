import { useMemo } from "react";
import moment, { Moment } from "moment";
import {
  INVOICE_CATEGORY,
  INVOICE_TO_TYPE,
  INVOICE_TYPE,
  RESIDENT_STATUS_TYPE,
  VAT_CONFIG_STATUS
} from "../../common/constant";
import {
  FAMILY_OR_THIRD_PARTY_TOPUP_STATUS,
  FNC_STATUS_TYPE,
  FUND_TYPE,
  PLACEMENT_TYPE
} from "../../common/constant/app";
import { generateUid } from "../../helpers/helpers";

/* ---------------- Types ---------------- */

interface Period {
  from: string;
  to: string;
}

interface InvoiceItem {
  id: string;
  weekPrice: number;
  amount: number;
  vatRate: number;
  vatId: string;
  qty: number;
  category: number;
  period: Period;
}

interface Invoice {
  id: string;
  type: number;
  invoiceTo: number;
  sDate: string;
  eDate: string;
  items: InvoiceItem[];
  totalPrice: number;
  creditApply?: { amount: number }[];
  arrearsApply?: { amount: number }[];
  fundSource?: number;
  fundTypeId?: string;
  [key: string]: any;
}

interface Fund {
  sDate: string;
  eDate: string;
  familyTopupStatus?: number;
  familyTopupPrice?: number;
  familyTopupEffectiveDate?: string;
  nameOfLa?: string;
  nameIbc?: string;
  fundSource?: number;
}

interface RoomPrice {
  sDate: string;
  eDate: string;
  perWeek: number;
}

interface VatConfig {
  id?: string;
  vatId?: string;
  vatEffectiveDate: string;
  status: number;
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

interface InvoiceRow {
  startDate: string;
  endDate: string;
  totalPrice: number;
  arrearsDiff: number;
  arrearsTotalPrice: number;
  invoiceTo: number;
  originalInvoice: Invoice;
  arrearsItems: ArrearsItem[];
}

/* ---------------- Helpers ---------------- */

const m = (v: any): Moment => moment(v, "YYYY-MM-DD");

const getOverlap = (a1: Moment, a2: Moment, b1: Moment, b2: Moment) => {
  const start = moment.max(a1, b1);
  const end = moment.min(a2, b2);
  const days = end.diff(start, "days") + 1;
  return days > 0 ? { start, end, days } : null;
};

const calcTotals = (
  weekPrice: number,
  days: number,
  vatRate: number,
  formula: string | null,
  invoiceTo: number,
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

const splitVat = (start: Moment, end: Moment, list: VatConfig[]) => {
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

/* ---------------- Main Hook ---------------- */

export function useInvoiceCheckArrearsAndCredit({
  invoiceList,
  residentData,
  isCredit,
  billingFormula,
  localAuthorityList,
  localICBList,
  vatList,
  validFNC,
  fNCDetails,
  isOpen = false
}: {
  invoiceList: Invoice[];
  residentData: any;
  isCredit: boolean;
  billingFormula: any;
  localAuthorityList: any[];
  localICBList: any[];
  vatList: any[];
  validFNC: any[],
  fNCDetails: any,
  isOpen: boolean
}): InvoiceRow[] {
  return useMemo(() => {
    if (!invoiceList?.length || !residentData?.roomPrice?.length) return [];

    const residentStatus = +residentData?.admission?.residentStatus;
    const dischargeDate = residentData?.admission?.dateDischargeAndRip;

    const rows: InvoiceRow[] = [];

    for (const invoice of invoiceList.filter(i => i.type === INVOICE_TYPE.NORMAL)) {
      if (!invoice) continue;
      const invoiceStart = m(invoice.sDate);
      const invoiceEnd = m(invoice.eDate);
      //  const invoiceEnd = +residentStatus === RESIDENT_STATUS_TYPE.ACTIVE ? m(invoice.eDate) : m(dischargeDate);
      const isBeforeInvoicEndResidentIsRIPOrLeft = m(dischargeDate).isBefore(invoiceEnd);
      const arrearsItems: ArrearsItem[] = [];

      for (const item of invoice.items) {
        const itemStart = m(item.period.from);
        // const itemEnd =
        //   residentStatus === RESIDENT_STATUS_TYPE.ACTIVE
        //     ? m(item.period.to)
        //     : m(dischargeDate);
        const itemEnd = m(item.period.to)
        for (const fund of residentData.fundDetails || []) {
          const fundStart = m(fund.sDate);
          const fundEnd = m(fund.eDate);

          const fundOverlap = getOverlap(itemStart, itemEnd, fundStart, fundEnd);
          if (!fundOverlap) continue;

          /* ---------------- FAMILY TOPUP ---------------- */
          if (
            +fund.familyTopupStatus === FAMILY_OR_THIRD_PARTY_TOPUP_STATUS.YES &&
            +invoice.invoiceTo === INVOICE_TO_TYPE.FAMILY_TOPUP
          ) {
            const eff = m(fund.familyTopupEffectiveDate);
            if (invoiceEnd.isBefore(eff)) continue;

            const ftStart = moment.max(invoiceStart, eff);
            const ftOverlap = getOverlap(ftStart, invoiceEnd, fundOverlap.start, fundOverlap.end);
            if (!ftOverlap) continue;

            const isMS = ftOverlap.start.isSame(ftOverlap.start.clone().startOf("month"), "day");
            const isME = ftOverlap.end.isSame(ftOverlap.end.clone().endOf("month"), "day");

            const familyPrice = +fund.familyTopupPrice || 0;
            if (familyPrice <= 0) continue;

            const formula =
              +residentData.admission?.typeOfPlacement === PLACEMENT_TYPE.PERMANENT
                ? billingFormula?.familyTopupPattern
                : null;

            const exp = calcTotals(familyPrice, ftOverlap.days, 0, formula, invoice.invoiceTo, isMS && isME).total;
            const billed = calcTotals(item.weekPrice, ftOverlap.days, 0, formula, invoice.invoiceTo, isMS && isME).total;

            const creditApply = (invoice.creditApply || []).reduce((s, a) => s + +a.amount, 0);
            const arrApply = (invoice.arrearsApply || []).reduce((s, a) => s + +a.amount, 0);

            const paid = billed - (!isCredit ? creditApply : arrApply);
            const diff =
              residentStatus === RESIDENT_STATUS_TYPE.ACTIVE
                ? exp - paid
                : Math.abs(exp - item.amount);

            if (!(isCredit && diff < 0 || !isCredit && diff > 0)) continue;

            arrearsItems.push({
              vatRate: item.vatRate,
              id: generateUid(),
              description: "",
              weekPrice: +(familyPrice - item.weekPrice).toFixed(2),
              amount: !isCredit ? +diff.toFixed(2) : exp,
              vatId: item.vatId,
              qty: 1,
              category: INVOICE_CATEGORY.BED,
              period: {
                from: ftOverlap.start.format("YYYY-MM-DD"),
                to: ftOverlap.end.format("YYYY-MM-DD")
              },
              diffAmount: +diff.toFixed(2),
              subTotal: +(exp - billed).toFixed(2)
            });

            continue;
          }

          /* ---------------- Third Party TOPUP ---------------- */
          if (
            +fund.thirdPartyTopupStatus === FAMILY_OR_THIRD_PARTY_TOPUP_STATUS.YES &&
            +invoice.invoiceTo === INVOICE_TO_TYPE.THIRD_PARTY_TOPUP
          ) {
            const eff = m(fund.thirdPartyTopupEffectiveDate);
            if (invoiceEnd.isBefore(eff)) continue;

            const ftStart = moment.max(invoiceStart, eff);
            const ftOverlap = getOverlap(ftStart, invoiceEnd, fundOverlap.start, fundOverlap.end);
            if (!ftOverlap) continue;

            const isMS = ftOverlap.start.isSame(ftOverlap.start.clone().startOf("month"), "day");
            const isME = ftOverlap.end.isSame(ftOverlap.end.clone().endOf("month"), "day");

            const thirdPartyTopupPrice = +fund.thirdPartyTopupPrice || 0;
            if (thirdPartyTopupPrice <= 0) continue;

            const exp = calcTotals(thirdPartyTopupPrice, ftOverlap.days, 0, '', invoice.invoiceTo, isMS && isME).total;
            const billed = calcTotals(item.weekPrice, ftOverlap.days, 0, '', invoice.invoiceTo, isMS && isME).total;

            const creditApply = (invoice.creditApply || []).reduce((s, a) => s + +a.amount, 0);
            const arrApply = (invoice.arrearsApply || []).reduce((s, a) => s + +a.amount, 0);

            const paid = billed - (!isCredit ? creditApply : arrApply);
            const diff =
              residentStatus === RESIDENT_STATUS_TYPE.ACTIVE
                ? exp - paid
                : Math.abs(exp - item.amount);

            if (!(isCredit && diff < 0 || !isCredit && diff > 0)) continue;

            arrearsItems.push({
              vatRate: item.vatRate,
              id: generateUid(),
              description: "",
              weekPrice: +(thirdPartyTopupPrice - item.weekPrice).toFixed(2),
              amount: !isCredit ? +diff.toFixed(2) : exp,
              vatId: item.vatId,
              qty: 1,
              category: INVOICE_CATEGORY.BED,
              period: {
                from: ftOverlap.start.format("YYYY-MM-DD"),
                to: ftOverlap.end.format("YYYY-MM-DD")
              },
              diffAmount: +diff.toFixed(2),
              subTotal: +(exp - billed).toFixed(2)
            });

            continue;
          };


          /* ---------------- Client  ---------------- */
          if (
            +fund.fundType === FUND_TYPE.PARTIAL &&
            +invoice.invoiceTo === INVOICE_TO_TYPE.CLIENT_CONTRIBUTION
          ) {
            const eff = m(fund.clientContributionSdate);
            if (invoiceEnd.isBefore(eff)) continue;

            const ftStart = moment.max(invoiceStart, eff);
            const ftOverlap = getOverlap(ftStart, invoiceEnd, fundOverlap.start, fundOverlap.end);
            if (!ftOverlap) continue;

            const isMS = ftOverlap.start.isSame(ftOverlap.start.clone().startOf("month"), "day");
            const isME = ftOverlap.end.isSame(ftOverlap.end.clone().endOf("month"), "day");

            const clientContributionPrice = +fund.clientContribution || 0;
            if (clientContributionPrice <= 0) continue;

            const exp = calcTotals(clientContributionPrice, ftOverlap.days, 0, '', invoice.invoiceTo, isMS && isME).total;
            const billed = calcTotals(item.weekPrice, ftOverlap.days, 0, '', invoice.invoiceTo, isMS && isME).total;

            const creditApply = (invoice.creditApply || []).reduce((s, a) => s + +a.amount, 0);
            const arrApply = (invoice.arrearsApply || []).reduce((s, a) => s + +a.amount, 0);

            const paid = billed - (!isCredit ? creditApply : arrApply);
            const diff =
              residentStatus === RESIDENT_STATUS_TYPE.ACTIVE
                ? exp - paid
                : Math.abs(exp - item.amount);

            if (!(isCredit && diff < 0 || !isCredit && diff > 0)) continue;

            arrearsItems.push({
              vatRate: item.vatRate,
              id: generateUid(),
              description: "",
              weekPrice: +(clientContributionPrice - item.weekPrice).toFixed(2),
              amount: !isCredit ? +diff.toFixed(2) : exp,
              vatId: item.vatId,
              qty: 1,
              category: INVOICE_CATEGORY.BED,
              period: {
                from: ftOverlap.start.format("YYYY-MM-DD"),
                to: ftOverlap.end.format("YYYY-MM-DD")
              },
              diffAmount: +diff.toFixed(2),
              subTotal: +(exp - billed).toFixed(2)
            });

            continue;
          };



          /* ---------------- FNC  ---------------- */
          if (
            Number(fund.fncStatus) === FNC_STATUS_TYPE.YES &&
            Array.isArray(fNCDetails?.priceInfo) &&
            Number(invoice.invoiceTo) === INVOICE_TO_TYPE.FNC
          ) {

            for (const [fncIndex, fncRp] of fNCDetails.priceInfo.entries()) {
              const fncStart = m(fncRp.sDate);
              const fncEnd = m(fncRp.eDate);

              const fncOverlap = getOverlap(invoiceStart, invoiceEnd, fncStart, fncEnd);
              if (!fncOverlap) continue;

              // Actual overlap inside both fund & fnc
              const ovStart = moment.max(fncOverlap.start, fundOverlap.start);
              const ovEnd = moment.min(fncOverlap.end, fundOverlap.end);

              if (ovEnd.isBefore(ovStart)) continue;

              const segments = splitVat(ovStart, ovEnd, fNCDetails?.vatConfigList || []);

              for (const seg of segments) {
                const segStart = moment.max(ovStart, seg.from);
                const segEnd = seg.to;
                const segDays = segEnd.diff(segStart, "days") + 1;

                if (segDays <= 0) continue;

                const vatConfig = seg.vat
                  ? vatList.find(v => v.id === seg.vat.vatId)
                  : null;

                const vatRate = vatConfig ? Number(vatConfig.rate) : 0;

                const isMonthStart = segStart.isSame(segStart.clone().startOf("month"), "day");
                const isMonthEnd = segEnd.isSame(segEnd.clone().endOf("month"), "day");

                const weekPrice = Number(fncRp.perWeek);
                if (!weekPrice) continue;


                const exp = calcTotals(
                  weekPrice,
                  segDays,
                  vatRate,
                  null,
                  invoice.invoiceTo,
                  isMonthStart && isMonthEnd
                ).total;

                const billed = calcTotals(
                  item.weekPrice,
                  segDays,
                  item.vatRate,
                  null,
                  invoice.invoiceTo,
                  isMonthStart && isMonthEnd
                ).total;


                const creditApply = (invoice.creditApply || []).reduce((s, a) => s + Number(a.amount || 0), 0);
                const arrearsApply = (invoice.arrearsApply || []).reduce((s, a) => s + Number(a.amount || 0), 0);

                const paid = billed - (!isCredit ? creditApply : arrearsApply);

                const diff =
                  Number(residentStatus) === RESIDENT_STATUS_TYPE.ACTIVE
                    ? exp - paid
                    : Math.abs(exp - Number(item.amount));
                // ignore invalid differences
                if (!(isCredit && diff < 0 || !isCredit && diff > 0)) continue;

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


          /* ---------------- FUND VAT SPLIT ---------------- */
          const fundSource = Number(invoice.fundSource ?? 0);

          const isLA = fundSource === INVOICE_TO_TYPE.LA;
          const isCHC = fundSource === INVOICE_TO_TYPE.CHC;

          const entities = isLA ? localAuthorityList : isCHC ? localICBList : [];
          const entityId = isLA ? fund.nameOfLa : fund.nameIbc;

          const entity = entities.find((e: any) => e.id === entityId);
          const vatConfigs = entity?.vatConfigList || [];

          if (entityId !== invoice.fundTypeId) continue;

          for (const rp of residentData.roomPrice) {
            if (invoice.invoiceTo === INVOICE_TO_TYPE.FNC) continue;
            const roomStart = m(rp.sDate);
            // const roomEnd = m(rp.eDate);
            const roomEnd =
              residentStatus === RESIDENT_STATUS_TYPE.ACTIVE
                ? m(rp.eDate)
                : m(dischargeDate);
            const roomOverlap = getOverlap(invoiceStart, invoiceEnd, roomStart, roomEnd);

            if (!roomOverlap) continue;

            const ovStart = moment.max(roomOverlap.start, fundOverlap.start);
            const ovEnd = moment.min(roomOverlap.end, fundOverlap.end);

            if (ovEnd.isBefore(ovStart)) continue;

            const segments = splitVat(ovStart, ovEnd, vatConfigs);

            for (const seg of segments) {
              const segStart = moment.max(ovStart, seg.from);
              const segEnd = seg.to;
              const segDays = segEnd.diff(segStart, "days") + 1;
              const itemDays = itemEnd.diff(itemStart, "days") + 1;
             
              if (segDays <= 0) continue;

              const vat = seg.vat
                ? vatList.find(v => v.id === seg.vat.vatId)
                : null;

              const vatRate = vat ? +vat.rate : 0;


              const isMS = segStart.isSame(segStart.clone().startOf("month"), "day");
              const isME = segEnd.isSame(segEnd.clone().endOf("month"), "day");

              const invoiceTo = (+invoice?.invoiceTo || 0) as any;

              const weekPrice =
                [INVOICE_TO_TYPE.LA, INVOICE_TO_TYPE.PRIVATE, INVOICE_TO_TYPE.CHC].includes(invoiceTo)
                  ? +rp.perWeek
                  : 0;

              if (!weekPrice) continue;
              
              
            

              const exp = calcTotals(weekPrice, segDays, vatRate, null, invoice.invoiceTo, isMS && isME).total;
              
              // const billed = calcTotals(item.weekPrice, segDays, vatRate, null, invoice.invoiceTo, isMS && isME).total;
              const billed = calcTotals(item.weekPrice,
                isBeforeInvoicEndResidentIsRIPOrLeft&& isCredit && item.weekPrice >= weekPrice ? itemDays : segDays,
                item.vatRate,
                null, invoice.invoiceTo,
                isMS && isME).total;
                 


              // isBeforeInvoicEndAndBlockBedEndDate && isCredit && item.weekPrice >= weekPrice ? itemDays : segDays,
              const creditApply = (invoice.creditApply || []).reduce((s, a) => s + +a.amount, 0);
              const arrApply = (invoice.arrearsApply || []).reduce((s, a) => s + +a.amount, 0);

              const paid = billed - (!isCredit ? creditApply : arrApply);
              // const diff =
              //   residentStatus === RESIDENT_STATUS_TYPE.ACTIVE
              //     ? exp - paid
              //     : Math.abs(exp - item.amount);

              const diff = (exp - paid)
              if (!(isCredit && diff < 0 || !isCredit && diff > 0)) continue;

              arrearsItems.push({
                vatRate: item.vatRate,
                id: generateUid(),
                description: "",
                weekPrice: +(weekPrice - item.weekPrice).toFixed(2),
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
        invoiceTo: invoice.invoiceTo,
        originalInvoice: invoice,
        arrearsItems
      });
    };


    return rows;
  }, [
    invoiceList,
    residentData,
    isCredit,
    billingFormula,
    localAuthorityList,
    localICBList,
    vatList
  ]);
}


