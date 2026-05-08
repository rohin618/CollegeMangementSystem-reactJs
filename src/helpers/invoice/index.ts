import { IInvoiceModel } from "../../common/interface";
import { IInvoiceDiscount } from "../../common/interface/invoice";

type PlainObject = Record<string, any>;

function isPlainObject(value: unknown): value is PlainObject {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function deepMergeObject(
  original: PlainObject,
  update: PlainObject
): PlainObject {
  const result: PlainObject = { ...original };

  Object.keys(update).forEach((key) => {
    const updateValue = update[key];
    const originalValue = original[key];

    // Ignore empty updates
    if (
      updateValue === undefined ||
      updateValue === null ||
      updateValue === ""
    ) {
      return;
    }

    // Replace arrays completely
    if (Array.isArray(updateValue)) {
      result[key] = updateValue;
      return;
    }

    // Deep merge plain objects only
    if (isPlainObject(updateValue) && isPlainObject(originalValue)) {
      result[key] = deepMergeObject(originalValue, updateValue);
      return;
    }

    // Primitive override
    result[key] = updateValue;
  });

  return result;
}


export function mergeInvoice(
  original: IInvoiceModel,
  update: Partial<IInvoiceModel>
): IInvoiceModel {
  return deepMergeObject(
    original as PlainObject,
    update as PlainObject
  ) as IInvoiceModel;
}


/** Sum of IInvoiceModel.discounts[].amount on a single invoice */
export function getInvoiceDiscountTotal(inv: any): number {
  const discounts: IInvoiceDiscount[] = inv?.discounts ?? [];
  return discounts.reduce((s, d) => s + (Number(d.amount) || 0), 0);
}

/**
 * Open balance for a single invoice — discount-aware.
 * ✅ Prefers stored balanceDue (set at save time as (discountedSubTotal + discountedVAT));
 *    falls back to live calculation for legacy invoices without balanceDue field.
 */
// export function getInvoiceOpenBalance(inv: any): number {
// 	const paid    = (inv?.payedInfo   ?? []).reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0);
// 	const credits = (inv?.creditApply ?? []).reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0);

// 	if (inv?.balanceDue != null) {
// 		// ✅ balanceDue = (discountedSubTotal + discountedVAT) — saved on create/update
// 		return Math.max(Number(inv.balanceDue) - paid - credits, 0);
// 	}

// 	// Legacy fallback — invoices saved before discount feature had no balanceDue field
// 	return Math.max(Number(inv.totalPrice || 0) - getInvoiceDiscountTotal(inv) - paid - credits, 0);
// }

//  */
export function getInvoiceOpenBalance(invoice: IInvoiceModel): number {
  if (!invoice) return 0;

  const paid = (invoice.payedInfo ?? []).reduce((s: number, { amount }: any) => s + (Number(amount) || 0), 0);
  const credits = (invoice.creditApply ?? []).reduce((s: number, { amount }: any) => s + (Number(amount) || 0), 0);

  if (invoice.balanceDue != null) {
    // ✅ balanceDue = (discountedSubTotal + discountedVAT) — pre-VAT discount baked in
    return Math.max(Number(invoice.balanceDue) - paid - credits, 0);
  }

  // Legacy fallback — invoices saved before discount feature
  const discountTotal = getInvoiceDiscountTotal(invoice);
  const subTotal = Number(invoice?.subTotal || 0);
  const vatTotal = Number(invoice?.vatTotal || 0);

  if (subTotal > 0 && discountTotal > 0) {
    const discountedSubTotal = Math.max(subTotal - discountTotal, 0);
    const discountRatio = subTotal > 0 ? discountedSubTotal / subTotal : 1;
    const discountedVat = +(vatTotal * discountRatio).toFixed(2);
    return Math.max((discountedSubTotal + discountedVat) - paid - credits, 0);
  }

  return Math.max(Number(invoice.totalPrice || 0) - discountTotal - paid - credits, 0);
  // return invoice.totalPrice;
}

export function getInvoicePayedAmount(invoice: any): number {
  if (!invoice) return 0;

  const paid = (invoice.payedInfo ?? []).reduce((s: number, { amount }: any) => s + (Number(amount) || 0), 0);
  const credits = (invoice.creditApply ?? []).reduce((s: number, { amount }: any) => s + (Number(amount) || 0), 0);


  // ✅ No discount — just total minus payments and credits
  return (paid + credits);
}