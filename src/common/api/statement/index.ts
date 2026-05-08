import moment, { Moment } from "moment";
import { CREDIT_TYPE, INVOICE_STATUS, INVOICE_TYPE } from "../../constant";
import { getUserMappedCompany } from "../../../helpers/helpers";
import { ICreditWalletModel } from "../../interface";
import { IInvoiceDiscount } from "../../interface/invoice";

// ----------------------------
// TYPES
// ----------------------------

export interface FirestoreTimestamp {
  toDate?: () => Date;
  seconds?: number;
  nanoseconds?: number;
  type?: string;
}

export interface InvoicePayment {
  id: string;
  date: string | Date | FirestoreTimestamp;
  amount: number;
}

export interface InvoiceCreditApply {
  id: string;
  creditWalletId: string;
  amount: number;
}

export interface Invoice {
  id: string;
  code: string;
  notes: string;
  type: number;
  totalPrice: number;
  subTotal?: number;
  vatTotal?: number;
  balanceDue?: number;
  discounts?: IInvoiceDiscount[];
  dueDay: number | string;
  invoiceDate: string | Date | FirestoreTimestamp;
  status: number | string;
  payerName?: string;
  residentName?: string;
  address?: string;
  sDate: string | Date | FirestoreTimestamp;
  eDate: string | Date | FirestoreTimestamp;
  payedInfo?: InvoicePayment[];
  creditApply?: InvoiceCreditApply[];
}

export interface Transaction {
  id?: string;
  date: any;
  description: string;
  amount: number;
  balance: number;
  notes: string;
  code: string;
}

export interface StatementSummary {
  current_due: number;
  past_due_1_30: number;
  past_due_31_60: number;
  past_due_61_90: number;
  past_due_90_plus: number;

  credit_wallet_used: number;
  credit_wallet_added: number;
  wallet_balance: number;

  wallet_shared: {
    added: number;
    used: number;
    balance: number;
    transactions: Transaction[];
  };

  total_due: number;
  total_payed: number;
}

export interface StatementResult {
  statement_no: number;
  client: Record<string, any>;
  date: string;
  summary: StatementSummary;
  transactions: Transaction[];
  payment_details: Record<string, string>;
}

// ----------------------------
// UTILITY
// ----------------------------

const toMoment = (val: any): Moment => {
  if (!val) return moment.invalid();
  if (val?.toDate) return moment(val.toDate());
  return moment(val);
};

function getInvoiceDiscountTotal(inv: Invoice): number {
  return (inv.discounts ?? []).reduce((s, d) => s + (Number(d.amount) || 0), 0);
}

function getEffectiveInvoiceTotal(inv: Invoice): number {
  if (inv.balanceDue != null) return Number(inv.balanceDue);

  const subTotal = Number(inv.subTotal || 0);
  const vatTotal = Number(inv.vatTotal || 0);
  const discTotal = getInvoiceDiscountTotal(inv);

  if (subTotal > 0 && discTotal > 0) {
    const discountedSubTotal = Math.max(subTotal - discTotal, 0);
    const discountRatio = discountedSubTotal / subTotal;
    const discountedVat = +(vatTotal * discountRatio).toFixed(2);
    return +(discountedSubTotal + discountedVat).toFixed(2);
  }

  return Math.max(Number(inv.totalPrice || 0) - discTotal, 0);
}

// ----------------------------
// MAIN FUNCTION
// ----------------------------

export const getStatementByResdientId = async (
  invoiceList: Invoice[] = [],
  creditWallets: ICreditWalletModel[] = [],
  bankInfo: any,
  startDate: string | Date,
  endDate: string | Date
): Promise<StatementResult> => {
  const selectedStart = moment(startDate).startOf("day");
  const selectedEnd = moment(endDate).endOf("day");

  const transactions: Transaction[] = [];
  const payedTransactions: Record<string, Transaction> = {};
  let clientInfo: Record<string, any> = {};

  // ------------------------------------------------
  // 1. INIT SUMMARY
  // ------------------------------------------------
  const summary: StatementSummary = {
    current_due: 0,
    past_due_1_30: 0,
    past_due_31_60: 0,
    past_due_61_90: 0,
    past_due_90_plus: 0,
    credit_wallet_used: 0,
    credit_wallet_added: 0,
    wallet_balance: 0,
    wallet_shared: { added: 0, used: 0, balance: 0, transactions: [] },
    total_due: 0,
    total_payed: 0,
  };

  const isInRange = (s: Moment, e: Moment) =>
    s.isSameOrBefore(selectedEnd) && e.isSameOrAfter(selectedStart);

  // ------------------------------------------------
  // 2. PROCESS CREDIT WALLETS
  //    Build lookup map for all wallets (used during invoice credit-apply rows).
  //    Only unapplied credit notes become standalone transaction rows.
  //    Applied ones (creditApply.length > 0) appear as "Credit Applied" rows
  //    attached to the invoice they were applied to.
  // ------------------------------------------------
  const walletById = new Map(creditWallets.map(w => [w.id!, w]));
  let walletCreditAdded = 0;

  for (const w of creditWallets) {
    const amount = Number(w.creditAmount) || 0;
    const wDate = toMoment(w.date);

    if (!wDate.isValid() || !isInRange(wDate, wDate)) continue;

    const isAdded = +w.type !== CREDIT_TYPE.OPENING_BALANCE_CREDIT;
    if (isAdded) walletCreditAdded += amount;

    const isAppliedToInvoice = Array.isArray(w.creditApply) && w.creditApply.length > 0;
    if (!isAppliedToInvoice) {
      summary.wallet_shared.transactions.push({
        id: w.id,
        date: wDate,
        description: `Credit Note — ${w.code}`,
        amount: -Math.abs(amount),
        balance: 0,
        notes: w.notes,
        code: w.code,
      });
    }
  }

  summary.credit_wallet_added = walletCreditAdded;
  summary.wallet_shared.added = walletCreditAdded;

  // ------------------------------------------------
  // 3. PROCESS INVOICES
  // ------------------------------------------------
  const invoiceAgeing = {
    current: 0,
    past_1_30: 0,
    past_31_60: 0,
    past_61_90: 0,
    past_90_plus: 0,
  };

  for (const inv of invoiceList) {
    if (+inv.status === INVOICE_STATUS.VOID) continue;

    clientInfo = {
      name: inv.payerName,
      resident: inv.residentName,
      address: inv.address,
    };

    const invStart = moment(inv.sDate as any);
    const invEnd = moment(inv.eDate as any);

    if (!isInRange(invStart, invEnd) && inv.type !== INVOICE_TYPE.OPENING_BALANCE) continue;

    const invoiceTotal = Number(inv.totalPrice) || 0;
    const effectiveTotal = getEffectiveInvoiceTotal(inv);
    const discountTotal = getInvoiceDiscountTotal(inv);

    // Invoice row
    transactions.push({
      date: inv.invoiceDate,
      description: `${inv.type === INVOICE_TYPE.DEPOSIT ? "Deposit" : "Invoice"} No. ${inv.code}`,
      amount: invoiceTotal,
      balance: 0,
      notes: inv.notes,
      code: inv.code,
    });

    // Discount row
    if (discountTotal > 0) {
      transactions.push({
        date: inv.invoiceDate,
        description: `Discount Applied — ${inv.code}`,
        amount: -discountTotal,
        balance: 0,
        notes: inv.notes,
        code: inv.code,
      });
    }

    // Cash / bank payments
    let paymentsApplied = 0;
    for (const p of (inv.payedInfo ?? [])) {
      const pAmount = Number(p.amount) || 0;
      paymentsApplied += pAmount;
      summary.total_payed += pAmount;

      if (!payedTransactions[p.id]) {
        payedTransactions[p.id] = {
          id: p.id,
          date: p.date,
          description: "Payment Received",
          amount: 0,
          balance: 0,
          notes: inv.notes,
          code: inv.code,
        };
      }
      payedTransactions[p.id].amount += -pAmount;
    }

    // Credit note applies — each becomes a "Credit Applied" payment row
    let creditApplied = 0;
    for (const ca of (inv.creditApply ?? [])) {
      const caAmount = Number(ca.amount) || 0;
      creditApplied += caAmount;
      summary.credit_wallet_used += caAmount;
      summary.wallet_shared.used += caAmount;

      const wallet = walletById.get(ca.creditWalletId);
      payedTransactions[`credit_${ca.id}`] = {
        id: ca.id,
        date: inv.invoiceDate,
        description: `Credit Applied — ${wallet?.code ?? ca.creditWalletId}`,
        amount: -caAmount,
        balance: 0,
        notes: inv.notes,
        code: inv.code,
      };
    }

    const outstanding = effectiveTotal - paymentsApplied - creditApplied;
    if (outstanding <= 0) continue;

    // Ageing bucket (only for unpaid/incomplete invoices)
    if (+inv.status !== INVOICE_STATUS.COMPLITED) {
      const dueDate = toMoment(inv.invoiceDate).add(Number(inv.dueDay) || 0, "days");
      if (dueDate.isValid()) {
        const diff = moment().diff(dueDate, "days");
        if (diff <= 0)       invoiceAgeing.current    += outstanding;
        else if (diff <= 30) invoiceAgeing.past_1_30  += outstanding;
        else if (diff <= 60) invoiceAgeing.past_31_60 += outstanding;
        else if (diff <= 90) invoiceAgeing.past_61_90 += outstanding;
        else                 invoiceAgeing.past_90_plus += outstanding;
      }
    }
  }

  // ------------------------------------------------
  // 4. AGEING BUCKETS — pure invoice outstanding amounts
  // ------------------------------------------------
  summary.current_due    = invoiceAgeing.current;
  summary.past_due_1_30  = invoiceAgeing.past_1_30;
  summary.past_due_31_60 = invoiceAgeing.past_31_60;
  summary.past_due_61_90 = invoiceAgeing.past_61_90;
  summary.past_due_90_plus = invoiceAgeing.past_90_plus;

  // ------------------------------------------------
  // 5. WALLET BALANCE
  //    Available credit = total issued − total applied to invoices
  // ------------------------------------------------
  summary.wallet_balance = summary.credit_wallet_added - summary.credit_wallet_used;
  summary.wallet_shared.balance = summary.wallet_balance;

  // ------------------------------------------------
  // 6. TOTAL DUE
  //    Positive = resident owes us | Negative = we owe the payer (credit balance)
  // ------------------------------------------------
  const rawTotalDue =
    summary.current_due +
    summary.past_due_1_30 +
    summary.past_due_31_60 +
    summary.past_due_61_90 +
    summary.past_due_90_plus;

  summary.total_due = rawTotalDue - summary.wallet_balance;

  // ------------------------------------------------
  // 7. BUILD TRANSACTION LIST & RUNNING BALANCE
  // ------------------------------------------------
  transactions.push(...Object.values(payedTransactions));
  transactions.push(...summary.wallet_shared.transactions);
  transactions.sort((a, b) => moment(a.date).valueOf() - moment(b.date).valueOf());

  const companyDetails = getUserMappedCompany();
  let runningBalance = 0;
  for (const tx of transactions) {
    runningBalance += Number(tx.amount || 0);
    tx.balance = runningBalance;
  }

  // ------------------------------------------------
  // 8. RETURN
  // ------------------------------------------------
  return {
    statement_no: Math.floor(Math.random() * 10000),
    client: clientInfo,
    date: moment().format("YYYY-MM-DD"),
    summary,
    transactions,
    payment_details: {
      account_name: bankInfo?.accountName,
      account_number: bankInfo?.accountNumber,
      sort_code: bankInfo?.sortCode,
      email: companyDetails?.email,
      phone: companyDetails.phone,
    },
  };
};
