import moment from "moment";
import { CREDIT_STATUS, CREDIT_TYPE, INVOICE_TYPE } from "../../common/constant";
import { generateUid, getMinMaxDatesFromList, priceFormat } from "../helpers";
import { IInvoiceModel, IInvoiceItem } from "../../common/interface";

/* ============================================================
   INTERFACES & UTILITIES
============================================================ */
export interface IPeriod {
    from: string;
    to: string;
}

const ROUND = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const EPS_MATCH = 0.02; // tolerance when comparing two currency numbers (2 pence)

/* ============================================================
   DESCRIPTION BUILDER
============================================================ */
function generateDescription(
  type: number,
  invoiceCode: string,
  oldPrice: number,
  newPrice: number,
  diffPrice: number,
  period: IPeriod,
  vatDiff?: number // eg: 15 for VAT increase/decrease
): string {
  const range = `${moment(period.from).format("DD MMM YYYY")} to ${moment(period.to).format("DD MMM YYYY")}`;

  // ----------------------------
  // PRICE ARREARS (PRICE INCREASE)
  // ----------------------------
  if (type === INVOICE_TYPE.ARREARS) {
    return `Ref ${invoiceCode}: Weekly price increased from ${priceFormat(
      oldPrice
    )} to ${priceFormat(newPrice)} — Additional charge for the period (${range})`;
  }

  // ----------------------------
  // PRICE CREDIT (PRICE DECREASE)
  // ----------------------------
  if (type === INVOICE_TYPE.CREDIT) {
    return `Ref ${invoiceCode}: Weekly price reduced from ${priceFormat(
      oldPrice
    )} to ${priceFormat(newPrice)} — Credit for the period (${range})`;
  }

  // ----------------------------
  // VAT ARREARS (VAT INCREASE)
  // ----------------------------
  if (type === INVOICE_TYPE.VAT_ARREARS) {
    return `Ref ${invoiceCode}: VAT rate increased by ${vatDiff ?? ""}% — Additional VAT charge for the period (${range})`;
  }

  // ----------------------------
  // VAT CREDIT (VAT DECREASE)
  // ----------------------------
  if (type === INVOICE_TYPE.VAT_CREDIT) {
    return `Ref ${invoiceCode}: VAT rate reduced by ${vatDiff ?? ""}% — VAT credit for the period (${range})`;
  }

  // ----------------------------
  // FALLBACK
  // ----------------------------
  return `Ref ${invoiceCode}: Adjustment for the period (${range})`;
}


/* ============================================================
   HELPERS: final price/vat from original + history
============================================================ */
function getFinalWeeklyPrice(period: IPeriod, original: IInvoiceModel, history: IInvoiceModel[]): number {
    let finalPrice = 0;

    const orig = (original.items || []).find(o =>
        moment(o.period.from).isSameOrBefore(period.from) &&
        moment(o.period.to).isSameOrAfter(period.to)
    );
    if (orig) finalPrice = orig.weekPrice;

    (history || []).forEach(inv => {
        if (inv.type === INVOICE_TYPE.ARREARS) {
            (inv.items || []).forEach(item => {
                const match =
                    moment(item.period.from).isSameOrBefore(period.from) &&
                    moment(item.period.to).isSameOrAfter(period.to);
                if (match) finalPrice += (item.weekPrice ?? 0);
            });
        }
    });

    return finalPrice;
}

function getFinalVatRate(period: IPeriod, original: IInvoiceModel, history: IInvoiceModel[]): number {
    let vat = 0;

    const orig = (original.items || []).find(o =>
        moment(o.period.from).isSameOrBefore(period.from) &&
        moment(o.period.to).isSameOrAfter(period.to)
    );
    if (orig) vat = orig.vatRate ?? 0;

    (history || []).forEach(inv => {
        if (inv.type === INVOICE_TYPE.VAT_ARREARS) {
            (inv.items || []).forEach(item => {
                const match =
                    moment(item.period.from).isSameOrBefore(period.from) &&
                    moment(item.period.to).isSameOrAfter(period.to);
                if (match) vat += (item.vatRate ?? 0); // stored as diff
            });
        }
    });

    return vat;
}

/* ============================================================
   DUPLICATE / MATCH CHECKS (rounding tolerant)
============================================================ */
function nearlyEqual(a: number, b: number, eps = EPS_MATCH) {
    return Math.abs(a - b) <= eps;
}

function isPeriodAlreadyCredited(period: IPeriod, history: IInvoiceModel[], expectedAmount: number | null, expectedVat: number | null): boolean {
    const pStart = moment(period.from);
    const pEnd = moment(period.to);

    return (history || []).some(inv =>
        (inv.type === CREDIT_TYPE.ADJUSTMENT_CREDIT || inv.type === CREDIT_TYPE.VAT_ADJUSTMENT_CREDIT) &&
        (inv.items || []).some(item => {
            const iStart = moment(item.period.from);
            const iEnd = moment(item.period.to);

            const dateMatch = iStart.isSameOrBefore(pStart) && iEnd.isSameOrAfter(pEnd);
            if (!dateMatch) return false;

            const amountMatch = expectedAmount != null
                ? nearlyEqual(Number(item.amount ?? 0), Number(Math.abs(expectedAmount)))
                : true;

            const vatMatch = expectedVat != null
                ? nearlyEqual(Number(item.vatAmount ?? 0), Number(Math.abs(expectedVat)))
                : true;

            return amountMatch && vatMatch;
        })
    );
}

function isVatPeriodAlreadyAdjusted(period: IPeriod, history: IInvoiceModel[], expectedVat: number | null): boolean {
    const pStart = moment(period.from);
    const pEnd = moment(period.to);

    return (history || []).some(inv =>
        inv.type === INVOICE_TYPE.VAT_ARREARS &&
        (inv.items || []).some(item => {
            const iStart = moment(item.period.from);
            const iEnd = moment(item.period.to);



            const fullCover = iStart.isSameOrBefore(pStart) && iEnd.isSameOrAfter(pEnd);
                      
            if (!fullCover) return false;

            if (expectedVat != null && !nearlyEqual(Number(item.vatAmount ?? 0), Number(Math.abs(expectedVat)))) {
                return false;
            }
            return true;
        })
    );
}

function getEffectiveVatRate(
  period: IPeriod,
  original: IInvoiceModel,
  history: IInvoiceModel[]
): number {

  let vat = 0;

  // 1️⃣ Original VAT
  const orig = (original.items || []).find(o =>
    moment(o.period.from).isSameOrBefore(period.from) &&
    moment(o.period.to).isSameOrAfter(period.to)
  );

  if (orig) vat = Number(orig.vatRate || 0);

  // 2️⃣ Apply VAT deltas from history
  (history || []).forEach(inv => {

    // VAT increase
    if (inv.type === INVOICE_TYPE.VAT_ARREARS) {
      (inv.items || []).forEach(item => {
        const match =
          moment(item.period.from).isSameOrBefore(period.from) &&
          moment(item.period.to).isSameOrAfter(period.to);

        if (match) {
          vat += Number(item.vatRate || 0);
        }
      });
    }

    // VAT decrease
    if (inv.type === INVOICE_TYPE.VAT_CREDIT) {
      (inv.items || []).forEach(item => {
        const match =
          moment(item.period.from).isSameOrBefore(period.from) &&
          moment(item.period.to).isSameOrAfter(period.to);

        if (match) {
          vat -= Number(item.vatRate || 0);
        }
      });
    }
  });

  return Math.max(0, ROUND(vat));
}


function isVatCreditAlreadyExists(
  period: IPeriod,
  history: IInvoiceModel[],
  expectedVatAmount: number
): boolean {

  return (history || []).some(inv =>
    inv.type === INVOICE_TYPE.VAT_CREDIT &&
    (inv.items || []).some(item => {

      const cover =
        moment(item.period.from).isSameOrBefore(period.from) &&
        moment(item.period.to).isSameOrAfter(period.to);

      if (!cover) return false;

      return nearlyEqual(
        Math.abs(Number(item.vatAmount || 0)),
        Math.abs(expectedVatAmount)
      );
    })
  );
}


/* ============================================================
   NEW HELPER: check if ORIGINAL period is fully covered by UPDATED items (day-by-day)
   This prevents false "full credit" when original is split into multiple updated items.
============================================================ */
function isPeriodFullyCovered(origFrom: string, origTo: string, updatedItems: IInvoiceItem[]): boolean {
    const daysSet = new Set<string>();
    const s = moment(origFrom);
    const e = moment(origTo);

    for (let d = s.clone(); d.isSameOrBefore(e); d.add(1, "day")) {
        daysSet.add(d.format("YYYY-MM-DD"));
    }

    (updatedItems || []).forEach(it => {
        const us = moment(it.period.from);
        const ue = moment(it.period.to);
        for (let d = us.clone(); d.isSameOrBefore(ue); d.add(1, "day")) {
            daysSet.delete(d.format("YYYY-MM-DD"));
            if (daysSet.size === 0) return;
        }
    });

    return daysSet.size === 0;
}

/* ============================================================
   MAIN ENGINE (FINAL)
============================================================ */
export function checkArrearsAndCreditOfInvoice(
    original: IInvoiceModel,
    updatedInv: IInvoiceModel,
    invoiceHistory: IInvoiceModel[]
): IInvoiceModel | null {

    const diffItems: IInvoiceItem[] = [];
    let totalVatDiffSigned = 0;

    // -------------------------
    // STEP 0: Handle removed days (partial/full credit)
    // We must credit only the DAYS from original that are not covered by updated.
    // Strategy: iterate original items and compute intersection with updated coverage.
    // If any original days are uncovered, create credit item(s) for those uncovered ranges.
    // -------------------------
    const updatedItems = updatedInv?.items ?? [];

    // Build a map of covered days from updated items to speed checks
    const coveredDays = new Set<string>();
    updatedItems.forEach(it => {
        const us = moment(it.period.from);
        const ue = moment(it.period.to);
        for (let d = us.clone(); d.isSameOrBefore(ue); d.add(1, "day")) {
            coveredDays.add(d.format("YYYY-MM-DD"));
        }
    });

    // For each original item, find days not covered -> group contiguous uncovered days into ranges -> credit them
    for (const origItem of (original.items || [])) {
        const oFrom = moment(origItem.period.from);
        const oTo = moment(origItem.period.to);

        // collect uncovered days
        const uncovered: string[] = [];
        for (let d = oFrom.clone(); d.isSameOrBefore(oTo); d.add(1, "day")) {
            const k = d.format("YYYY-MM-DD");
            if (!coveredDays.has(k)) uncovered.push(k);
        }

        if (uncovered.length === 0) continue;

        // group contiguous uncovered days into ranges
        let rangeStart = uncovered[0];
        let prev = uncovered[0];

        const pushRange = (fromKey: string, toKey: string) => {
            const from = moment(fromKey).format("YYYY-MM-DD");
            const to = moment(toKey).format("YYYY-MM-DD");
            const days = moment(to).diff(moment(from), "days") + 1;
            const daily = (origItem.weekPrice ?? 0) / 7;
            const base = ROUND(daily * days);
            const vatAmt = ROUND((base * (origItem.vatRate ?? 0)) / 100);

            // 🔐 DUPLICATE CHECK (CRITICAL)
            const alreadyCredited = isPeriodAlreadyCredited(
                { from, to },
                invoiceHistory,
                base,
                vatAmt
            );
            if (alreadyCredited) return;

            diffItems.push({
                id: generateUid(),
                category: origItem.category,
                qty: origItem.qty,
                weekPrice: origItem.weekPrice,
                amount: -Math.abs(base),        // credit is negative
                vatRate: origItem.vatRate ?? 0,
                vatId: origItem.vatId ?? "",
                vatAmount: -Math.abs(vatAmt),   // VAT credit negative
                period: { from, to },
                description: generateDescription(INVOICE_TYPE.CREDIT, original.code, origItem.weekPrice, 0, -origItem.weekPrice, { from, to })
            });

            totalVatDiffSigned -= vatAmt;
        };

        for (let i = 1; i < uncovered.length; i++) {
            const curr = uncovered[i];
            const diffDays = moment(curr).diff(moment(prev), "days");
            if (diffDays === 1) {
                // contiguous
                prev = curr;
            } else {
                // break range
                pushRange(rangeStart, prev);
                rangeStart = curr;
                prev = curr;
            }
        }
        // push final range
        pushRange(rangeStart, prev);
    }

    // -------------------------
    // STEP 1: Existing UPDATED items (smart comparisons)
    // For every updated item, compare with original+history to produce arrears / vat adjustments / merged lines
    // -------------------------
    for (const newItem of updatedItems) {
        const period = newItem.period;

        // compute effective old values considering history
        const oldPrice = getFinalWeeklyPrice(period, original, invoiceHistory);
        // const oldVat = getFinalVatRate(period, original, invoiceHistory);
        const oldVat = getEffectiveVatRate(period, original, invoiceHistory);


        const newPrice = newItem.weekPrice ?? 0;
        const newVat = Number(newItem.vatRate ?? oldVat);
      
        const days = moment(period.to).diff(moment(period.from), "days") + 1;
        if (days <= 0) continue;

        const dailyOld = oldPrice / 7;
        const dailyNew = newPrice / 7;

        const oldBase = ROUND(dailyOld * days);
        const newBase = ROUND(dailyNew * days);

        const baseDiffSigned = ROUND(newBase - oldBase); // + => arrears; - => credit
        const baseDiffAbs = Math.abs(baseDiffSigned);

        const vatUpliftSigned = ROUND((oldBase * (newVat - oldVat)) / 100); // signed
        const vatOnBaseDiffSigned = ROUND(Math.sign(baseDiffSigned) * (baseDiffAbs * newVat / 100));

        const priceChanged = baseDiffSigned !== 0;
        const vatChanged = oldVat !== newVat;

        if (!priceChanged && !vatChanged) continue;

        // -- VAT uplift item (only if VAT changed)
        if (vatChanged && vatUpliftSigned !== 0) {
            // const alreadyVat =
           const alreadyVat  = vatUpliftSigned < 0? isVatCreditAlreadyExists(period, invoiceHistory, Math.abs(vatUpliftSigned)): isVatPeriodAlreadyAdjusted(period, invoiceHistory, Math.abs(vatUpliftSigned));
            
            if (!alreadyVat) {
                diffItems.push({
                    id: generateUid(),
                    category: newItem.category,
                    qty: newItem.qty ?? 1,
                    weekPrice: 0,
                    amount: 0,
                    vatRate: Math.abs(newVat - oldVat), // store delta
                    vatId: newItem.vatId ?? "",
                    period,
                    vatAmount: (vatUpliftSigned),
                    description: generateDescription(vatUpliftSigned < 0 ? INVOICE_TYPE.VAT_CREDIT : INVOICE_TYPE.VAT_ARREARS, original.code, oldPrice, newPrice, 0, period,Math.abs(newVat - oldVat))
                });
                totalVatDiffSigned += vatUpliftSigned;
            }
        }

        // -- Merged price diff (when price changed) -> base + VAT at newVat
        if (priceChanged && baseDiffAbs !== 0) {
            const expectedBase = baseDiffAbs;
            const expectedVat = Math.abs(vatOnBaseDiffSigned);

            const alreadyApplied = isPeriodAlreadyCredited(period, invoiceHistory, expectedBase, expectedVat);
            if (!alreadyApplied) {
                diffItems.push({
                    id: generateUid(),
                    category: newItem.category,
                    qty: newItem.qty ?? 1,
                    weekPrice: Math.abs(newPrice - oldPrice),
                    amount: baseDiffSigned,            // keep signed amount (positive for arrears, negative for credit)
                    vatRate: newVat,
                    vatId: newItem.vatId ?? "",
                    vatAmount: Math.sign(baseDiffSigned) * expectedVat,
                    period,
                    description: generateDescription(baseDiffSigned < 0 ? INVOICE_TYPE.CREDIT : INVOICE_TYPE.ARREARS, original.code, oldPrice, newPrice, newPrice - oldPrice, period)
                });
                totalVatDiffSigned += vatOnBaseDiffSigned;
            }
        }
    }

    // -------------------------
    // STEP 2: Totals & Type decision
    // -------------------------
    if (diffItems.length === 0) return null;

    // signed sums
    const subTotalSigned = ROUND(diffItems.reduce((s, i) => s + (i.amount ?? 0), 0));
    const vatTotalSigned = ROUND(totalVatDiffSigned);

    const signedTotal = ROUND(subTotalSigned + vatTotalSigned);

    // UI display values always positive
    const subTotal = ROUND(Math.abs(subTotalSigned));
    const vatTotal = ROUND(Math.abs(vatTotalSigned));
    const total = ROUND(Math.abs(signedTotal));

    // invoice type
    let type: number = INVOICE_TYPE.ARREARS;
    if (signedTotal < 0) type = INVOICE_TYPE.CREDIT;
    else if (subTotalSigned === 0 && vatTotalSigned !== 0) type = INVOICE_TYPE.VAT_ARREARS;

    // prepare return object (clone original minimally)
    const base: Partial<IInvoiceModel> = { ...original };
    delete (base as any).id;
    delete (base as any).code;
    delete (base as any).created;
    delete (base as any).updated;
    delete (base as any).seq;
    delete (base as any).creditApply;
    delete (base as any).arrearsApply;
    delete (base as any).payedInfo;
    delete (base as any).status;
    delete (base as any).parentInvoiceId;

    const { minDate, maxDate } = getMinMaxDatesFromList(diffItems)

    // ensure each diffItem stores absolute vat/amount for DB shapes if you prefer that representation,
    // but we keep sign in amount & vatAmount so total sign is preserved in signed sums.
    return {
        ...(base as IInvoiceModel),
        type,
        items: diffItems,
        subTotal,
        vatTotal,
        totalPrice: total,
        parentInvoiceId: original.id,
        sDate:minDate,
        eDate:maxDate,
        balanceDue:total,
        invoiceDate:moment().format("YYYY-MM-DD")
    };
}
