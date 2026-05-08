// import moment, { Moment } from "moment";
// import {
//     FUND_TYPE,
//     INVOICE_CATEGORY,
//     INVOICE_TO_TYPE,
//     PLACEMENT_TYPE
// } from "../../common/constant";

// import {
//     FNC_STATUS_TYPE,
//     FUND_SOURCE_TYPE,
//     INCONT_STATUS_TYPE,
//     FAMILY_OR_THIRD_PARTY_TOPUP_STATUS,
//     VAT_CONFIG_STATUS,
//     BLOCK_BEDS_TYPE,
//     NOTIFY_TYPE,
//     RESIDENT_STATUS,
//     DATA_MIGRATION_TO_DATE,
//     FUND_SOURCE_TYPE_LABEL,
//     RESPITE_STATUS_TYPE,
// } from "../../common/constant/app";

// import { generateUid, getLabelByValue, getRespiteStatusForPeriod, notifyEntity, showAlert } from "../helpers";
// import { FUND_SOURCE_STATUS_TYPE_LIST, INVOICE_TO_TYPE_LIST } from "../../common/data/option";
// import { ILaAndICBModel } from "../../common/interface";
// import showNotification from "../../components/extras/showNotification";

// interface OverlapResult {
//     overlapStart: Moment;
//     overlapEnd: Moment;
//     days: number;
// }

// interface CreateInvoiceParams {
//     formData: any;
//     residentData: any;
//     invoiceModel: any;
//     fundSource: any;
//     fncStatus: any;
//     incontStatus: any;
//     fundType: any;
//     localAuthorityList: any[];
//     localICBList: any[];
//     vatList: any[];
//     fNCDetails: any;
//     billingFormula: any;
//     isShowBlockBednotify: boolean
// }

// // ======================= HELPER FUNCTIONS =======================

// const safeMoment = (d: any): Moment | null => {
//     if (!d) return null;
//     const m = moment(d);
//     return m.isValid() ? m : null;
// };

// const getOverlap = (invoiceStart: Moment, invoiceEnd: Moment, start: any, end: any): OverlapResult | null => {
//     const s = safeMoment(start);
//     const e = safeMoment(end);
//     if (!s || !e) return null;

//     const overlapStart = moment.max(invoiceStart, s);
//     const overlapEnd = moment.min(invoiceEnd, e);

//     if (overlapEnd.isBefore(overlapStart)) return null;

//     const days = overlapEnd.diff(overlapStart, "days") + 1;
//     if (days <= 0) return null;

//     return { overlapStart, overlapEnd, days };
// };

// const evalFormula = (
//     formula: string | undefined,
//     weekPrice: number,
//     days: number,
//     isMonthPattern: boolean
// ): number => {
//     try {
//         if (!formula || !isMonthPattern) {
//             return +(weekPrice / 7 * days).toFixed(2);
//         }

//         const updated = formula.replace(/weekPrice/g, String(weekPrice));
//         return +Function(`"use strict"; return (${updated})`)().toFixed(2);

//     } catch (err) {
//         return +(weekPrice / 7 * days).toFixed(2);
//     }
// };

// const getVatAmount = (amount: number, vatRate: number): number => {
//     try {
//         return +((amount * vatRate) / (100 + vatRate)).toFixed(2);
//     } catch {
//         return 0;
//     }
// };

// const sortVatConfigs = (vatConfigs: any[]) =>
//     [...vatConfigs]
//         .filter(v => +v.status === VAT_CONFIG_STATUS.ACTIVE)
//         .sort(
//             (a, b) =>
//                 moment(a.vatEffectiveDate).valueOf() -
//                 moment(b.vatEffectiveDate).valueOf()
//         );


// const splitByVat = (start: Moment, end: Moment, vatConfigList: any[]) => {
//     const vats = vatConfigList
//         .filter(v => v.status == 1)
//         .sort((a: any, b: any) => moment(a.vatEffectiveDate).valueOf() - moment(b.vatEffectiveDate).valueOf());

//     const result: any[] = [];
//     let currentFrom = start.clone();

//     for (let i = 0; i < vats.length; i++) {
//         const vat = vats[i];
//         const eff = moment(vat.vatEffectiveDate);

//         // Skip if VAT starts after request end
//         if (eff.isAfter(end)) continue;

//         // Case 1: VAT effective is after our currentFrom → we need a null VAT block
//         if (eff.isAfter(currentFrom)) {
//             result.push({
//                 from: currentFrom,
//                 to: eff.clone().subtract(1, "day"),
//                 vat: null
//             });
//         }

//         // Determine the end of this VAT segment (next VAT - 1 day OR request end)
//         const nextVat = vats[i + 1];
//         let toDate = end.clone();

//         if (nextVat) {
//             const nextEff = moment(nextVat.vatEffectiveDate);
//             if (nextEff.isSameOrBefore(end)) {
//                 toDate = nextEff.clone().subtract(1, "day");
//             }
//         }

//         result.push({
//             from: eff.clone(),
//             to: toDate.clone(),
//             vat
//         });

//         currentFrom = toDate.clone().add(1, "day");
//     }

//     // No VAT present inside the range
//     if (result.length === 0) {
//         result.push({
//             from: start,
//             to: end,
//             vat: null
//         });
//     }

//     return result;
// };


// const getVatForDate = (date: string, vatConfigList: any[]) => {
//     const curr = moment(date, "YYYY-MM-DD");
//     let match = null;

//     vatConfigList.forEach(v => {
//         if (curr.isSameOrAfter(moment(v.vatEffectiveDate, "YYYY-MM-DD"))) {
//             match = v;
//         }
//     });

//     return match;
// };



// // ======================= MAIN FUNCTION =======================

// export const createInvoiceDataByDate = (params: CreateInvoiceParams) => {
//     try {
//         const {
//             formData,
//             residentData,
//             invoiceModel,
//             fundSource,
//             fncStatus,
//             incontStatus,
//             fundType,
//             localAuthorityList,
//             localICBList,
//             vatList,
//             fNCDetails,
//             billingFormula,
//             isShowBlockBednotify = true
//         } = params;

//         if (!formData?.sDate || !formData?.eDate) return [];

//         const invoiceStart = safeMoment(formData.sDate)!;
//         const invoiceEnd = safeMoment(formData.eDate)!;
//         const rows: any[] = [];

//         // ---------------- Setup Grouping ----------------

//         const laIds = localAuthorityList.map(_ => _.id);
//         const icbIds = localICBList.map(_ => _.id);
//         const fncIds = [fNCDetails?.id].filter(Boolean);


//         const respiteCurrentInfoStatus = getRespiteStatusForPeriod(
//             residentData?.admission?.respiteStatusList,
//             formData?.sDate,
//             formData?.eDate
//         );


//         const groupedItems: Record<string, any[]> = Object.fromEntries([
//             ...fncIds.map(id => [`${INVOICE_TO_TYPE.FNC}_${id}`, []]),
//             ...laIds.map(id => [`${INVOICE_TO_TYPE.LA}_${id}`, []]),
//             ...icbIds.map(id => [`${INVOICE_TO_TYPE.CHC}_${id}`, []]),
//             [`${INVOICE_TO_TYPE.PRIVATE}`, []],
//             [`${INVOICE_TO_TYPE.FAMILY_TOPUP}`, []],
//             [`${INVOICE_TO_TYPE.THIRD_PARTY_TOPUP}`, []],
//             [`${INVOICE_TO_TYPE.CLIENT_CONTRIBUTION}`, []],
//             [`${INVOICE_TO_TYPE.INCONT}`, []],
//             // [`${INVOICE_TO_TYPE.FNC}`, []],
//         ]);

//         // Helper to push final rows into invoice output
//         const pushRow = (
//             invoiceTo: number,
//             vatTotal: number,
//             subTotal: number,
//             totalPrice: number,
//             fundTypeId = "",
//             items: any[] = []
//         ) => {
//             rows.push({
//                 ...invoiceModel,
//                 fundSource,
//                 fncStatus,
//                 incontStatus,
//                 fundType,
//                 sDate: formData.sDate,
//                 eDate: formData.eDate,
//                 roomId: residentData?.roomId,
//                 bedId: residentData?.bedId,
//                 residentId: residentData?.id,
//                 invoiceTo,
//                 totalPrice: +totalPrice.toFixed(2),
//                 fundTypeId,
//                 subTotal,
//                 vatTotal,
//                 items,
//             });
//         };


//         // ======================= PROCESS FUNDS =======================

//         for (const fund of residentData?.fundDetails ?? []) {

//             const isMigration = (+residentData?.admission?.residentStatus !== RESIDENT_STATUS.LIVING && moment(residentData?.admission?.admissionDate).isSameOrBefore(DATA_MIGRATION_TO_DATE) && moment(residentData?.admission?.dateDischargeAndRip).isSameOrBefore(DATA_MIGRATION_TO_DATE) || invoiceEnd.isSameOrBefore(DATA_MIGRATION_TO_DATE))
//             if (isMigration) continue;


//             const fundOverlap = getOverlap(invoiceStart, invoiceEnd, fund.sDate, fund.eDate);
//             if (!fundOverlap) continue;

//             // ================= VAT CONFIG ======================
//             const isLA = +fund.fundSource === FUND_SOURCE_TYPE.LOCAL_AUTHORITY;
//             const isCHC = +fund.fundSource === FUND_SOURCE_TYPE.CHC;
//             const entityList = isLA ? localAuthorityList : isCHC ? localICBList : [];
//             const entityId = isLA ? fund.nameOfLa : fund.nameIbc;

//             let fundVatConfigList: any[] = [];
//             let entity: ILaAndICBModel | any;
//             if (entityList && entityId) {
//                 entity = entityList.find((e: any) => e.id === entityId);
//                 fundVatConfigList = sortVatConfigs(entity?.vatConfigList ?? []);
//             }





//             // ==============================================================

//             const pushItem = (
//                 key: number,
//                 weekPrice: number,
//                 overlap: OverlapResult,
//                 entityId: string,
//                 vatRate: number,
//                 vatId: string
//             ) => {
//                 groupedItems[key]?.push({
//                     id: generateUid(),
//                     category: INVOICE_CATEGORY.BED,
//                     qty: 1,
//                     weekPrice,
//                     amount: +(weekPrice / 7 * overlap.days).toFixed(2),
//                     vatRate,
//                     vatId,
//                     entityId,
//                     period: {
//                         from: overlap.overlapStart.format("YYYY-MM-DD"),
//                         to: overlap.overlapEnd.format("YYYY-MM-DD")
//                     }
//                 });
//             };


//             if (+fund.fundType === FUND_TYPE.PARTIAL) {
//                 const clientContributionSdate = moment(fund.clientContributionSdate);
//                 const ccOverlapEnd = moment.min(invoiceEnd, moment(fund.eDate));
//                 if (ccOverlapEnd.isBefore(clientContributionSdate)) continue;



//                 const ccoverlapStart = moment.max(invoiceStart, moment(fund.clientContributionSdate));
//                 const ccoverlap: any = getOverlap(ccoverlapStart, ccOverlapEnd, formData.sDate, formData.eDate);
//                 const isMonthStart = ccoverlap.overlapStart.isSame(ccoverlap.overlapStart.clone().startOf('month'), 'day');
//                 const isMonthEnd = ccoverlap.overlapEnd.isSame(ccoverlap.overlapEnd.clone().endOf('month'), 'day');
//                 if (!ccoverlap) continue;

//                 const clientPrice = +fund.clientContribution || 0;
//                 if (clientPrice > 0 && ccoverlap.days > 0) {

//                     const formula = (PLACEMENT_TYPE.PERMANENT === +residentData.admission.typeOfPlacement || +respiteCurrentInfoStatus?.status === RESPITE_STATUS_TYPE.EXTENDED_WITH_PERMANENT)
//                         ? billingFormula?.ccBillingFormula
//                         : undefined;

//                     const total = evalFormula(formula, clientPrice, ccoverlap.days, (isMonthStart && isMonthEnd));
//                     pushItem(INVOICE_TO_TYPE.CLIENT_CONTRIBUTION, clientPrice, ccoverlap, '', 0, '');
//                     groupedItems[INVOICE_TO_TYPE.CLIENT_CONTRIBUTION].slice(-1)[0].amount = total;
//                 }

//             }

//             if (+fund.familyTopupStatus === FAMILY_OR_THIRD_PARTY_TOPUP_STATUS.YES) {
//                 const familyTopupEffectiveDate = moment(fund.familyTopupEffectiveDate);
//                 const ftuOverlapEnd = moment.min(invoiceEnd, moment(fund.eDate));
//                 if (ftuOverlapEnd.isBefore(familyTopupEffectiveDate)) continue;

//                 const familyTopupoverlapStart = moment.max(invoiceStart, moment(fund.familyTopupEffectiveDate));
//                 const familyTopupoverlap: any = getOverlap(familyTopupoverlapStart, ftuOverlapEnd, formData.sDate, formData.eDate);
//                 const isMonthStart = familyTopupoverlap.overlapStart.isSame(familyTopupoverlap.overlapStart.clone().startOf('month'), 'day');
//                 const isMonthEnd = familyTopupoverlap.overlapEnd.isSame(familyTopupoverlap.overlapEnd.clone().endOf('month'), 'day');
//                 if (!familyTopupoverlap) continue;

//                 const familyTopupPrice = +fund.familyTopupPrice || 0;
//                 if (familyTopupPrice > 0 && familyTopupoverlap.days > 0) {

//                     const formula = (PLACEMENT_TYPE.PERMANENT === +residentData.admission.typeOfPlacement || +respiteCurrentInfoStatus?.status === RESPITE_STATUS_TYPE.EXTENDED_WITH_PERMANENT)
//                         ? billingFormula?.familyTopupPattern
//                         : undefined;

//                     const total = evalFormula(formula, familyTopupPrice, familyTopupoverlap.days, (isMonthStart && isMonthEnd));
//                     pushItem(INVOICE_TO_TYPE.FAMILY_TOPUP, familyTopupPrice, familyTopupoverlap, '', 0, '');
//                     groupedItems[INVOICE_TO_TYPE.FAMILY_TOPUP].slice(-1)[0].amount = total;
//                 }

//             };

//             if (+fund.thirdPartyTopupStatus === FAMILY_OR_THIRD_PARTY_TOPUP_STATUS.YES) {
//                 const thirdPartyTopupEffectiveDate = moment(fund.thirdPartyTopupEffectiveDate);
//                 const tpuOverlapEnd = moment.min(invoiceEnd, moment(fund.eDate));
//                 if (tpuOverlapEnd.isBefore(thirdPartyTopupEffectiveDate)) continue;

//                 const thirdTopupoverlapStart = moment.max(invoiceStart, moment(fund.thirdPartyTopupEffectiveDate));
//                 const thirdPartyTopupoverlap: any = getOverlap(thirdTopupoverlapStart, tpuOverlapEnd, formData.sDate, formData.eDate);
//                 const isMonthStart = thirdPartyTopupoverlap.overlapStart.isSame(thirdPartyTopupoverlap.overlapStart.clone().startOf('month'), 'day');
//                 const isMonthEnd = thirdPartyTopupoverlap.overlapEnd.isSame(thirdPartyTopupoverlap.overlapEnd.clone().endOf('month'), 'day');
//                 if (!thirdPartyTopupoverlap) continue;

//                 const thirdPartyTopupPrice = +fund.thirdPartyTopupPrice || 0;
//                 if (thirdPartyTopupPrice > 0 && thirdPartyTopupoverlap.days > 0) {
//                     const total = evalFormula('', thirdPartyTopupPrice, thirdPartyTopupoverlap.days, (isMonthStart && isMonthEnd));
//                     pushItem(INVOICE_TO_TYPE.THIRD_PARTY_TOPUP, thirdPartyTopupPrice, thirdPartyTopupoverlap, fund.nameOfLa, 0, '');
//                     groupedItems[INVOICE_TO_TYPE.THIRD_PARTY_TOPUP].slice(-1)[0].amount = total;
//                 }

//             }

//             if (+fund.fundSource === FUND_SOURCE_TYPE.JOINT_FUNDNG) {
//                 const jointFundOverLap = getOverlap(invoiceStart, invoiceEnd, fund.sDate, fund.eDate);
//                 if (!jointFundOverLap) continue;

//                 const { overlapStart, overlapEnd } = jointFundOverLap;
//                 const isFullMonth =
//                     overlapStart.isSame(overlapStart.clone().startOf('month'), 'day') &&
//                     overlapEnd.isSame(overlapEnd.clone().endOf('month'), 'day');

//                 const getVatConfigs = (list: any[], id: string) => {
//                     const entity = list?.find((e: any) => e.id === id);
//                     return sortVatConfigs(entity?.vatConfigList ?? []);
//                 };

//                 const buildSegmentItem = (
//                     segment: any,
//                     roomPrice: number,
//                     entityId: string,
//                     invoiceToKey: string
//                 ) => {
//                     const segStart = moment.max(overlapStart, moment(segment.from));
//                     const segDays = segment.to.diff(segStart, 'days') + 1;
//                     if (segDays <= 0) return;

//                     const vat = segment.vat ? vatList.find((v: any) => v.id === segment.vat.vatId) : null;
//                     const basePrice = evalFormula('', +roomPrice, segDays, isFullMonth);
//                     const totalPrice = +(basePrice * (1 + (vat?.rate ?? 0) / 100)).toFixed(2);

//                     groupedItems[invoiceToKey].push({
//                         id: generateUid(),
//                         category: INVOICE_CATEGORY.BED,
//                         qty: 1,
//                         weekPrice: roomPrice,
//                         amount: totalPrice,
//                         vatId: vat?.id ?? '',
//                         vatRate: vat?.rate ?? 0,
//                         period: {
//                             from: segStart.format('YYYY-MM-DD'),
//                             to: segment.to.format('YYYY-MM-DD'),
//                         },
//                         entityId,
//                     });
//                 };

//                 const laVatConfigs = getVatConfigs(localAuthorityList, fund.nameOfLa);
//                 const icbVatConfigs = getVatConfigs(localICBList, fund.nameIbc);

//                 splitByVat(overlapStart, overlapEnd, laVatConfigs).forEach((seg) =>
//                     buildSegmentItem(seg, fund.jfLaRoomPrice, fund.nameOfLa, `${INVOICE_TO_TYPE.LA}_${fund.nameOfLa}`)
//                 );

//                 splitByVat(overlapStart, overlapEnd, icbVatConfigs).forEach((seg) =>
//                     buildSegmentItem(seg, fund.jfIcbRoomPrice, fund.nameOfLa, `${INVOICE_TO_TYPE.CHC}_${fund.nameIbc}`)
//                 );
//             }


//             // ====================== ROOM PRICE ======================

//             for (const rp of residentData?.roomPrice ?? []) {

//                 if (+fund?.blockBedStatus === BLOCK_BEDS_TYPE.YES) {
//                     if (isShowBlockBednotify) {
//                         showNotification(
//                             "No Invoice Generated",
//                             `There are no block bed invoices available for the selected date range (${moment(invoiceStart).format("DD/MM/YYYY")} - ${moment(invoiceEnd).format("DD/MM/YYYY")}).`,
//                             "danger"
//                         );
//                     }
//                     continue;
//                 }

//                 if (+fund.fundSource === FUND_SOURCE_TYPE.JOINT_FUNDNG) {
//                     continue;
//                 }

//                 const roomOverlap = getOverlap(invoiceStart, invoiceEnd, rp.sDate, rp.eDate);
//                 if (!roomOverlap) {
//                     continue;
//                 }

//                 const overlapStart = moment.max(fundOverlap.overlapStart, roomOverlap.overlapStart);
//                 const overlapEnd = moment.min(fundOverlap.overlapEnd, roomOverlap.overlapEnd);

//                 if (overlapEnd.isBefore(overlapStart)) continue;



//                 const vatSegments = splitByVat(overlapStart, overlapEnd, fundVatConfigList);




//                 for (const segment of vatSegments) {
//                     const roomVatSegments = moment.max(overlapStart, moment(segment.from));


//                     const segDays = segment.to.diff(roomVatSegments, "days") + 1;
//                     // const segDays = segment.to.diff(segment.from, "days") + 1;
//                     if (segDays <= 0) continue;

//                     const segmentVatObj = segment.vat
//                         ? vatList.find((v: any) => v.id === segment.vat.vatId)
//                         : null;

//                     const vatRate = Number(segmentVatObj?.rate ?? 0);

//                     // const baseWeekPrice =
//                     //     +fund.fundSource !== FUND_SOURCE_TYPE.LOCAL_AUTHORITY
//                     //         ? +rp.perWeek
//                     //         : +rp.perWeek - +fund.clientContribution;



//                     const contributionInfo = Array.isArray(rp?.laOrContributionInfo)
//                         ? rp.laOrContributionInfo
//                         : [];
//                     // Find price range index
//                     const contribution = contributionInfo?.find(({ sDate, eDate }: any) => {
//                         const start = moment(sDate);
//                         const end = moment(eDate);
//                         const fundStart = moment(fund.sDate);
//                         const fundEnd = moment(fund.eDate);

//                         if (!start.isValid() || !end.isValid() || !fundStart.isValid() || !fundEnd.isValid()) {
//                             return false;
//                         }

//                         // 🔥 overlap check
//                         return (
//                             fundEnd.isSameOrAfter(start) &&
//                             fundStart.isSameOrBefore(end)
//                         );
//                     });




//                     const isPartialFunding =
//                         fund?.fundType === FUND_TYPE.PARTIAL
//                     const baseWeekPrice = !isPartialFunding ? +rp.perWeek : +contribution?.perWeek ? +contribution?.perWeek : 0;


//                     if (baseWeekPrice <= 0) continue;

//                     const isMonthStart = segment.from.isSame(segment.from.clone().startOf("month"), "day");
//                     const isMonthEnd = segment.to.isSame(segment.to.clone().endOf("month"), "day");

//                     const formula =
//                         +fund.fundSource === FUND_SOURCE_TYPE.PRIVATE &&
//                             (+residentData.admission.typeOfPlacement === PLACEMENT_TYPE.PERMANENT || +respiteCurrentInfoStatus?.status === RESPITE_STATUS_TYPE.EXTENDED_WITH_PERMANENT)
//                             ? billingFormula?.privateBillingFormula
//                             : undefined;

//                     const basePrice = evalFormula(formula, baseWeekPrice, segDays, isMonthStart && isMonthEnd);
//                     const totalPrice = +(basePrice * (1 + vatRate / 100)).toFixed(2);
//                     // const totalPrice = +(basePrice).toFixed(2);

//                     const key = entityId ? `${fund.fundSource}_${entityId}` : `${fund.fundSource}`;

//                     groupedItems[key]?.push({
//                         id: generateUid(),
//                         category: INVOICE_CATEGORY.BED,
//                         qty: 1,
//                         weekPrice: baseWeekPrice,
//                         amount: totalPrice,
//                         vatRate,
//                         vatId: segmentVatObj?.id ?? "",
//                         period: {
//                             from: roomVatSegments.format("YYYY-MM-DD"),
//                             to: segment.to.format("YYYY-MM-DD"),
//                         },
//                         entityId
//                     });
//                 }
//             }

//             // ====================== FNC SECTION ======================

//             if (+fund.fncStatus === FNC_STATUS_TYPE.YES && fNCDetails?.priceInfo?.length) {
//                 let FNCVatConfigList: any[] = [];
//                 if (fNCDetails) {
//                     FNCVatConfigList = sortVatConfigs(fNCDetails?.vatConfigList ?? []);
//                 };
//                 const fncRows = [];
//                 for (const rp of fNCDetails.priceInfo) {
//                     const fncStartDate = moment(fund.fncSdate);
//                     if (moment(rp.eDate).isBefore(fncStartDate)) continue;
//                     const overlapStart = moment.max(invoiceStart, moment(fund.fncSdate));
//                     const overlapEnd = moment.min(invoiceEnd, moment(fund.eDate));




//                     const overlap = getOverlap(overlapStart, overlapEnd, rp.sDate, overlapEnd);

//                     if (!overlap) continue;

//                     const price = +rp.perWeek;
//                     if (!price) continue;

//                     const vatFNCSegments = splitByVat(overlap.overlapStart, overlap.overlapEnd, FNCVatConfigList);

//                     for (const segmentFNC of vatFNCSegments) {
//                         const vatSegments = moment.max(overlap.overlapStart, moment(segmentFNC.from));
//                         const segDays = segmentFNC.to.diff(vatSegments, "days") + 1;
//                         if (segDays <= 0) continue;

//                         const fncVat = segmentFNC.vat
//                             ? vatList.find((v: any) => v.id === segmentFNC.vat.vatId)
//                             : null;

//                         const base = +(price / 7 * segDays).toFixed(2);
//                         const total = +(base * (1 + Number(fncVat?.rate ?? 0) / 100)).toFixed(2);
//                         // const total = base;
//                         const key = `${INVOICE_TO_TYPE.FNC}_${fNCDetails.id}`
//                         groupedItems[key].push({
//                             id: generateUid(),
//                             category: INVOICE_CATEGORY.BED,
//                             qty: 1,
//                             weekPrice: price,
//                             amount: total,
//                             vatId: fncVat?.id ?? "",
//                             vatRate: fncVat?.rate ?? 0,
//                             // period: {
//                             //     from: overlap.overlapStart.format("YYYY-MM-DD"),
//                             //     to: overlap.overlapEnd.format("YYYY-MM-DD")
//                             // }
//                             period: {
//                                 from: vatSegments.format("YYYY-MM-DD"),
//                                 to: segmentFNC.to.format("YYYY-MM-DD"),
//                             },
//                             entityId: fNCDetails?.id
//                         });
//                     }
//                 }

//                 // if (fncRows.length) {
//                 //     const total = fncRows.reduce((s, i) => s + i.amount, 0);
//                 //     const vat = fncRows.reduce((s, i) => s + getVatAmount(i.amount, i.vatRate), 0);
//                 //     pushRow(INVOICE_TO_TYPE.FNC, vat, +(total - vat).toFixed(2), total, fNCDetails.id, fncRows);
//                 // }
//             }

//             // ==================== INCONT SECTION ====================

//             if (+fund.incontStatus === INCONT_STATUS_TYPE.YES) {
//                 for (const inc of fund.incontDetails ?? []) {
//                     const overlap = getOverlap(invoiceStart, invoiceEnd, inc.sDate, inc.eDate);
//                     if (!overlap) continue;

//                     const price = +inc.perWeek;
//                     if (!price) continue;

//                     const amount = +(price / 7 * overlap.days).toFixed(2);
//                     groupedItems[INVOICE_TO_TYPE.INCONT].push({
//                         id: generateUid(),
//                         category: INVOICE_CATEGORY.BED,
//                         qty: 1,
//                         weekPrice: price,
//                         amount,
//                         vatRate: 0,
//                         vatId: "",
//                         period: {
//                             from: overlap.overlapStart.format("YYYY-MM-DD"),
//                             to: overlap.overlapEnd.format("YYYY-MM-DD")
//                         },
//                         entityId: fNCDetails?.id
//                     });
//                 }
//             }
//         }

//         // =====================================================
//         // FINAL AGGREGATED ROWS
//         // =====================================================

//         for (const [key, items] of Object.entries(groupedItems)) {
//             if (!items.length) continue;

//             const invoiceTo = +key.split("_")[0];
//             const entityId = items[0]?.entityId ?? "";

//             const totalAmount = items.reduce((s, i) => s + i.amount, 0);
//             const vatTotal = items.reduce((s, i) => s + getVatAmount(i.amount, i.vatRate), 0);

//             const subTotal = +(totalAmount - vatTotal).toFixed(2);

//             const cleanedItems = items.map(({ entityId, ...x }) => ({ ...x, vatAmount: getVatAmount(x.amount, x.vatRate) }));

//             pushRow(invoiceTo, vatTotal, subTotal, totalAmount, entityId, cleanedItems);
//         }

//         return rows;

//     } catch (err) {
//         console.error("❌ createInvoiceDataByDate error:", err);
//         return [];
//     }
// };


import moment, { Moment } from "moment";
import {
    FUND_TYPE,
    INVOICE_CATEGORY,
    INVOICE_TO_TYPE,
    PLACEMENT_TYPE
} from "../../common/constant";

import {
    FNC_STATUS_TYPE,
    FUND_SOURCE_TYPE,
    INCONT_STATUS_TYPE,
    FAMILY_OR_THIRD_PARTY_TOPUP_STATUS,
    VAT_CONFIG_STATUS,
    BLOCK_BEDS_TYPE,
    RESIDENT_STATUS,
    DATA_MIGRATION_TO_DATE,
    RESPITE_STATUS_TYPE,
} from "../../common/constant/app";

import { generateUid, getRespiteStatusForPeriod, showAlert } from "../helpers";
import { ILaAndICBModel } from "../../common/interface";
import showNotification from "../../components/extras/showNotification";

// ======================= TYPES =======================

interface OverlapResult {
    overlapStart: Moment;
    overlapEnd: Moment;
    days: number;
}

interface CreateInvoiceParams {
    formData: any;
    residentData: any;
    invoiceModel: any;
    fundSource: any;
    fncStatus: any;
    incontStatus: any;
    fundType: any;
    localAuthorityList: any[];
    localICBList: any[];
    vatList: any[];
    fNCDetails: any;
    billingFormula: any;
    isShowBlockBednotify: boolean;
}

// ======================= HELPERS =======================

const safeMoment = (d: any): Moment | null => {
    if (!d) return null;
    const m = moment(d);
    return m.isValid() ? m : null;
};

const getOverlap = (
    invoiceStart: Moment,
    invoiceEnd: Moment,
    start: any,
    end: any
): OverlapResult | null => {
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

const evalFormula = (
    formula: string | undefined,
    weekPrice: number,
    days: number,
    isMonthPattern: boolean
): number => {
    try {
        if (!formula || !isMonthPattern) return +(weekPrice / 7 * days).toFixed(2);
        const updated = formula.replace(/weekPrice/g, String(weekPrice));
        return +Function(`"use strict"; return (${updated})`)().toFixed(2);
    } catch {
        return +(weekPrice / 7 * days).toFixed(2);
    }
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
        .sort((a, b) => moment(a.vatEffectiveDate).valueOf() - moment(b.vatEffectiveDate).valueOf());

const splitByVat = (start: Moment, end: Moment, vatConfigList: any[]) => {
    const vats = [...vatConfigList]
        .filter(v => v.status == 1)
        .sort((a, b) => moment(a.vatEffectiveDate).valueOf() - moment(b.vatEffectiveDate).valueOf());

    const result: any[] = [];
    let currentFrom = start.clone();

    for (let i = 0; i < vats.length; i++) {
        const vat = vats[i];
        const eff = moment(vat.vatEffectiveDate);
        if (eff.isAfter(end)) continue;

        if (eff.isAfter(currentFrom)) {
            result.push({ from: currentFrom, to: eff.clone().subtract(1, "day"), vat: null });
        }

        const nextEff = vats[i + 1] ? moment(vats[i + 1].vatEffectiveDate) : null;
        const toDate = nextEff?.isSameOrBefore(end) ? nextEff.clone().subtract(1, "day") : end.clone();

        result.push({ from: eff.clone(), to: toDate.clone(), vat });
        currentFrom = toDate.clone().add(1, "day");
    }

    if (!result.length) result.push({ from: start, to: end, vat: null });

    return result;
};

const getEntityVatConfigs = (list: any[], id: string) => {
    const entity = list?.find((e: any) => e.id === id);
    return sortVatConfigs(entity?.vatConfigList ?? []);
};

const isFullMonthRange = (start: Moment, end: Moment) =>
    start.isSame(start.clone().startOf("month"), "day") &&
    end.isSame(end.clone().endOf("month"), "day");

// ======================= MAIN FUNCTION =======================

export const createInvoiceDataByDate = (params: CreateInvoiceParams) => {
    try {
        const {
            formData,
            residentData,
            invoiceModel,
            fundSource,
            fncStatus,
            incontStatus,
            fundType,
            localAuthorityList,
            localICBList,
            vatList,
            fNCDetails,
            billingFormula,
            isShowBlockBednotify = true,
        } = params;

        if (!formData?.sDate || !formData?.eDate) return [];

        const invoiceStart = safeMoment(formData.sDate)!;
        const invoiceEnd = safeMoment(formData.eDate)!;
        const rows: any[] = [];

        // ---------------- Grouping Setup ----------------

        const respiteCurrentInfoStatus = getRespiteStatusForPeriod(
            residentData?.admission?.respiteStatusList,
            formData?.sDate,
            formData?.eDate
        );

        const isPermanentOrExtended =
            +residentData.admission.typeOfPlacement === PLACEMENT_TYPE.PERMANENT ||
            +respiteCurrentInfoStatus?.status === RESPITE_STATUS_TYPE.EXTENDED_WITH_PERMANENT;

        const groupedItems: Record<string, any[]> = Object.fromEntries([
            ...([fNCDetails?.id].filter(Boolean).map(id => [`${INVOICE_TO_TYPE.FNC}_${id}`, []])),
            ...localAuthorityList.map(({ id }) => [`${INVOICE_TO_TYPE.LA}_${id}`, []]),
            ...localICBList.map(({ id }) => [`${INVOICE_TO_TYPE.CHC}_${id}`, []]),
            [INVOICE_TO_TYPE.PRIVATE, []],
            [INVOICE_TO_TYPE.FAMILY_TOPUP, []],
            [INVOICE_TO_TYPE.THIRD_PARTY_TOPUP, []],
            [INVOICE_TO_TYPE.CLIENT_CONTRIBUTION, []],
            [INVOICE_TO_TYPE.INCONT, []],
        ]);

        const pushRow = (
            invoiceTo: number,
            vatTotal: number,
            subTotal: number,
            totalPrice: number,
            fundTypeId = "",
            items: any[] = []
        ) => {
            rows.push({
                ...invoiceModel,
                fundSource, fncStatus, incontStatus, fundType,
                sDate: formData.sDate,
                eDate: formData.eDate,
                roomId: residentData?.roomId,
                bedId: residentData?.bedId,
                residentId: residentData?.id,
                invoiceTo,
                totalPrice: +totalPrice.toFixed(2),
                fundTypeId,
                subTotal,
                vatTotal,
                items,
            });
        };

        // ---- Shared item builder for VAT segments ----
        const buildVatSegmentItems = (
            segments: any[],
            rangeStart: Moment,
            weekPrice: number,
            entityId: string,
            targetKey: string | number,
            overrideDailyCalc = false
        ) => {
            for (const segment of segments) {
                const segStart = moment.max(rangeStart, moment(segment.from));
                const segDays = segment.to.diff(segStart, "days") + 1;
                if (segDays <= 0) continue;

                const vat = segment.vat ? vatList.find((v: any) => v.id === segment.vat.vatId) : null;
                const vatRate = Number(vat?.rate ?? 0);

                const basePrice = overrideDailyCalc
                    ? +(weekPrice / 7 * segDays).toFixed(2)
                    : evalFormula("", weekPrice, segDays, isFullMonthRange(rangeStart, segment.to));

                const totalPrice = +(basePrice * (1 + vatRate / 100)).toFixed(2);

                groupedItems[targetKey]?.push({
                    id: generateUid(),
                    category: INVOICE_CATEGORY.BED,
                    qty: 1,
                    weekPrice,
                    amount: totalPrice,
                    vatId: vat?.id ?? "",
                    vatRate,
                    period: {
                        from: segStart.format("YYYY-MM-DD"),
                        to: segment.to.format("YYYY-MM-DD"),
                    },
                    entityId,
                });
            }
        };

        // ---- Topup helper (client contribution / family / third-party) ----
        const processTopup = (opts: {
            effectiveDate: any;
            price: number;
            fundEDate: any;
            invoiceToType: number;
            entityId?: string;
            formula?: string;
        }) => {
            const { effectiveDate, price, fundEDate, invoiceToType, entityId = "", formula } = opts;
            if (!price || price <= 0) return;

            const effectiveMoment = moment(effectiveDate);
            const overlapEnd = moment.min(invoiceEnd, moment(fundEDate));
            if (overlapEnd.isBefore(effectiveMoment)) return;

            const overlapStart = moment.max(invoiceStart, effectiveMoment);
            const overlap = getOverlap(overlapStart, overlapEnd, formData.sDate, formData.eDate);
            if (!overlap || overlap.days <= 0) return;

            const isFullMonth = isFullMonthRange(overlap.overlapStart, overlap.overlapEnd);
            const total = evalFormula(formula, price, overlap.days, isFullMonth);

            groupedItems[invoiceToType]?.push({
                id: generateUid(),
                category: INVOICE_CATEGORY.BED,
                qty: 1,
                weekPrice: price,
                amount: total,
                vatRate: 0,
                vatId: "",
                period: {
                    from: overlap.overlapStart.format("YYYY-MM-DD"),
                    to: overlap.overlapEnd.format("YYYY-MM-DD"),
                },
                entityId,
            });
        };

        // ======================= PROCESS FUNDS =======================

        for (const fund of residentData?.fundDetails ?? []) {

            const isMigration =
                (+residentData?.admission?.residentStatus !== RESIDENT_STATUS.LIVING &&
                    moment(residentData?.admission?.admissionDate).isSameOrBefore(DATA_MIGRATION_TO_DATE) &&
                    moment(residentData?.admission?.dateDischargeAndRip).isSameOrBefore(DATA_MIGRATION_TO_DATE)) ||
                invoiceEnd.isSameOrBefore(DATA_MIGRATION_TO_DATE);
            if (isMigration) continue;

            const fundOverlap = getOverlap(invoiceStart, invoiceEnd, fund.sDate, fund.eDate);
            if (!fundOverlap) continue;

            // ---- Entity / VAT config for LA & CHC ----
            const isLA = +fund.fundSource === FUND_SOURCE_TYPE.LOCAL_AUTHORITY;
            const isCHC = +fund.fundSource === FUND_SOURCE_TYPE.CHC;
            const entityList = isLA ? localAuthorityList : isCHC ? localICBList : [];
            const entityId = isLA ? fund.nameOfLa : fund.nameIbc;
            const fundVatConfigList = entityId
                ? sortVatConfigs(entityList.find((e: any) => e.id === entityId)?.vatConfigList ?? [])
                : [];

            // ---- Client Contribution ----
            if (+fund.fundType === FUND_TYPE.PARTIAL) {
                processTopup({
                    effectiveDate: fund.clientContributionSdate,
                    price: +fund.clientContribution || 0,
                    fundEDate: fund.eDate,
                    invoiceToType: INVOICE_TO_TYPE.CLIENT_CONTRIBUTION,
                    formula: isPermanentOrExtended ? billingFormula?.ccBillingFormula : undefined,
                });
            }

            // ---- Family Topup ----
            if (+fund.familyTopupStatus === FAMILY_OR_THIRD_PARTY_TOPUP_STATUS.YES) {
                processTopup({
                    effectiveDate: fund.familyTopupEffectiveDate,
                    price: +fund.familyTopupPrice || 0,
                    fundEDate: fund.eDate,
                    invoiceToType: INVOICE_TO_TYPE.FAMILY_TOPUP,
                    formula: isPermanentOrExtended ? billingFormula?.familyTopupPattern : undefined,
                });
            }

            // ---- Third Party Topup ----
            if (+fund.thirdPartyTopupStatus === FAMILY_OR_THIRD_PARTY_TOPUP_STATUS.YES) {
                processTopup({
                    effectiveDate: fund.thirdPartyTopupEffectiveDate,
                    price: +fund.thirdPartyTopupPrice || 0,
                    fundEDate: fund.eDate,
                    invoiceToType: INVOICE_TO_TYPE.THIRD_PARTY_TOPUP,
                    entityId: fund.nameOfLa,
                });
            }

            // ---- Joint Funding ----
            if (+fund.fundSource === FUND_SOURCE_TYPE.JOINT_FUNDNG) {
                const jointOverlap = getOverlap(invoiceStart, invoiceEnd, fund.sDate, fund.eDate);
                if (!jointOverlap) continue;

                const { overlapStart, overlapEnd } = jointOverlap;

                buildVatSegmentItems(
                    splitByVat(overlapStart, overlapEnd, getEntityVatConfigs(localAuthorityList, fund.nameOfLa)),
                    overlapStart, fund.jfLaRoomPrice, fund.nameOfLa,
                    `${INVOICE_TO_TYPE.LA}_${fund.nameOfLa}`
                );

                buildVatSegmentItems(
                    splitByVat(overlapStart, overlapEnd, getEntityVatConfigs(localICBList, fund.nameIbc)),
                    overlapStart, fund.jfIcbRoomPrice, fund.nameIbc, // ⚠️ was fund.nameOfLa — likely bug fix
                    `${INVOICE_TO_TYPE.CHC}_${fund.nameIbc}`
                );

                continue; // joint funding doesn't go through room price loop
            }

            // ---- Room Price ----
            for (const rp of residentData?.roomPrice ?? []) {
                if (+fund?.blockBedStatus === BLOCK_BEDS_TYPE.YES) {
                    if (isShowBlockBednotify) {
                        showNotification(
                            "No Invoice Generated",
                            `There are no block bed invoices for the selected date range (${invoiceStart.format("DD/MM/YYYY")} - ${invoiceEnd.format("DD/MM/YYYY")}).`,
                            "danger"
                        );
                    }
                    continue;
                }

                const roomOverlap = getOverlap(invoiceStart, invoiceEnd, rp.sDate, rp.eDate);
                if (!roomOverlap) continue;

                const segStart = moment.max(fundOverlap.overlapStart, roomOverlap.overlapStart);
                const segEnd = moment.min(fundOverlap.overlapEnd, roomOverlap.overlapEnd);
                if (segEnd.isBefore(segStart)) continue;

                const contributionInfo: any[] = Array.isArray(rp?.laOrContributionInfo)
                    ? rp.laOrContributionInfo
                    : [];

                const contribution = contributionInfo.find(({ sDate, eDate }: any) => {
                    const s = moment(sDate), e = moment(eDate);
                    const fs = moment(fund.sDate), fe = moment(fund.eDate);
                    return s.isValid() && e.isValid() && fs.isValid() && fe.isValid() &&
                        fe.isSameOrAfter(s) && fs.isSameOrBefore(e);
                });

                const isPartialFunding = fund?.fundType === FUND_TYPE.PARTIAL;
                const baseWeekPrice = isPartialFunding
                    ? (+contribution?.perWeek || 0)
                    : +rp.perWeek;
                if (baseWeekPrice <= 0) continue;

                const formula =
                    +fund.fundSource === FUND_SOURCE_TYPE.PRIVATE && isPermanentOrExtended
                        ? billingFormula?.privateBillingFormula
                        : undefined;

                const key = entityId ? `${fund.fundSource}_${entityId}` : `${fund.fundSource}`;

                for (const segment of splitByVat(segStart, segEnd, fundVatConfigList)) {
                    const vatSegStart = moment.max(segStart, moment(segment.from));
                    const segDays = segment.to.diff(vatSegStart, "days") + 1;
                    if (segDays <= 0) continue;

                    const vat = segment.vat ? vatList.find((v: any) => v.id === segment.vat.vatId) : null;
                    const vatRate = Number(vat?.rate ?? 0);
                    const isFullMonth = isFullMonthRange(segment.from, segment.to);
                    const basePrice = evalFormula(formula, baseWeekPrice, segDays, isFullMonth);
                    const totalPrice = +(basePrice * (1 + vatRate / 100)).toFixed(2);

                    groupedItems[key]?.push({
                        id: generateUid(),
                        category: INVOICE_CATEGORY.BED,
                        qty: 1,
                        weekPrice: baseWeekPrice,
                        amount: totalPrice,
                        vatRate,
                        vatId: vat?.id ?? "",
                        period: {
                            from: vatSegStart.format("YYYY-MM-DD"),
                            to: segment.to.format("YYYY-MM-DD"),
                        },
                        entityId,
                    });
                }
            }

            // ---- FNC ----
            if (+fund.fncStatus === FNC_STATUS_TYPE.YES && fNCDetails?.priceInfo?.length) {
                const fncVatConfigs = sortVatConfigs(fNCDetails?.vatConfigList ?? []);
                const fncKey = `${INVOICE_TO_TYPE.FNC}_${fNCDetails.id}`;
                const fncEnd = moment.min(invoiceEnd, moment(fund.eDate));

                for (const rp of fNCDetails.priceInfo) {
                    const overlap = getOverlap(invoiceStart, fncEnd, rp.sDate, rp.eDate);
                    if (!overlap) continue;

                    const price = +rp.perWeek;
                    if (!price) continue;

                    buildVatSegmentItems(
                        splitByVat(overlap.overlapStart, overlap.overlapEnd, fncVatConfigs),
                        overlap.overlapStart, price, fNCDetails.id, fncKey,
                        true // use simple daily calc (no formula)
                    );
                }
            }

            // ---- Incontinence ----
            if (+fund.incontStatus === INCONT_STATUS_TYPE.YES) {
                for (const inc of fund.incontDetails ?? []) {
                    const overlap = getOverlap(invoiceStart, invoiceEnd, inc.sDate, inc.eDate);
                    if (!overlap) continue;

                    const price = +inc.perWeek;
                    if (!price) continue;

                    groupedItems[INVOICE_TO_TYPE.INCONT].push({
                        id: generateUid(),
                        category: INVOICE_CATEGORY.BED,
                        qty: 1,
                        weekPrice: price,
                        amount: +(price / 7 * overlap.days).toFixed(2),
                        vatRate: 0,
                        vatId: "",
                        period: {
                            from: overlap.overlapStart.format("YYYY-MM-DD"),
                            to: overlap.overlapEnd.format("YYYY-MM-DD"),
                        },
                        entityId: fNCDetails?.id,
                    });
                }
            }
        }

        // ======================= FINAL ROWS =======================

        for (const [key, items] of Object.entries(groupedItems)) {
            if (!items.length) continue;

            const invoiceTo = +key.split("_")[0];
            const entityId = items[0]?.entityId ?? "";
            const totalAmount = items.reduce((s, i) => s + i.amount, 0);
            const vatTotal = items.reduce((s, i) => s + getVatAmount(i.amount, i.vatRate), 0);
            const subTotal = +(totalAmount - vatTotal).toFixed(2);
            const cleanedItems = items.map(({ entityId: _, ...x }) => ({
                ...x,
                vatAmount: getVatAmount(x.amount, x.vatRate),
            }));

            pushRow(invoiceTo, vatTotal, subTotal, totalAmount, entityId, cleanedItems);
        }

        return rows;

    } catch (err) {
        console.error("❌ createInvoiceDataByDate error:", err);
        return [];
    }
};