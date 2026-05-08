import moment from "moment";

export const BED_STATUS = {
  AVAILABLE: 1,
  OCCUPIED: 3,
  BLOCK_BED_OCCUPIED: 2,
  PRIVATE_OCCUPIED: 4,
} as const;

export const ROOM_STATUS = {
  ACTIVE: 1,
  INACTIVE: 2,
  DELETE: 3,
  PRIVATE_OCCUPIED: 4,
} as const;


export const PRICE_PERIOD_STATUS = {
  ACTIVE: 1,
  INACTIVE: 2,
  EXPIRED: 3,
  DELETE: 4,
} as const;


export const RESIDENT_STATUS = {
  LIVING: 1,
  RIP: 3,
  LEFT_FROM_ROOM: 2,
} as const;

export const PAYMENT_STATUS = {
  DRAFT: 0,
  PENDING: 1,
  PARTIAL: 2,
  PAID: 3,
  VOID: 4
} as const;


export const PLACEMENT_STATUS = {
  PERMENT: 'Paid',
  PENDING: 'Pending',
  PARTIAL: 'Partial',
} as const;


export const PLACEMENT_TYPE = {
  PERMANENT: 1,
  RESPITE: 2,
} as const;


export const FUND_SOURCE_TYPE = {
  PRIVATE: 1,
  LOCAL_AUTHORITY: 2,
  CHC: 3,
  JOINT_FUNDNG: 4,
} as const;
export const FUND_SOURCE_TYPE_LABEL: Record<number, string> = Object.fromEntries(
  Object.entries(FUND_SOURCE_TYPE).map(([key, value]) => [value, key])
);

export const FUND_TYPE = {
  PARTIAL: 1,
  FULLY: 2,
} as const;

export const RESPITE_STATUS_TYPE = {
  EXTENDED_WITH_DATE: 1,
  EXTENDED_WITH_PERMANENT: 2,
} as const;

export const FNC_STATUS_TYPE = {
  YES: 1,
  NO: 2,
} as const;

export const FAMILY_OR_THIRD_PARTY_TOPUP_STATUS = {
  YES: 1,
  NO: 2,
} as const;

export const INCONT_STATUS_TYPE = {
  YES: 1,
  NO: 2,
} as const;

export const INVOICE_REQUEST_TYPE = {
  YES: 1,
  NO: 2,
} as const;
export const INVOICE_MODE_TYPE = {
  EMAIL: 1,
  POST: 2,
} as const;


export const RESIDENT_STATUS_TYPE = {
  ACTIVE: 1,
  LEFT: 2,
  RIP: 3,
} as const;

export const CONTRACT_STATUS_TYPE = {
  SENT: 1,
  UPDATED: 2,
} as const
export const MAX_BULK_INVOICE_LIMIT = 100

export const INVOICE_STATUS = {
  DRAFT: 0,
  PENDING: 1,
  PARTIAL: 2,
  COMPLITED: 3,
  CANCELLED: 4,
  VOID: 5,

} as const;


export const OPENING_BALANCE_STATUS = {
  PENDING: 1,
  PARTIAL: 2,
  COMPLETED: 3,
  CANCELLED: 4,
  VOID: 5,
} as const;
;


export const CHART_OF_ACCOUNTS_CATEGORY_TYPE = {
  ASSET: 1,
  LIABILITY: 2,
  INCOME: 3,
  EXPENSE: 4,
  ACCOUNTS_RECEIVABLE: 5,
  ACCOUNTS_PAYABLE: 6,

} as const;



export const CHART_OF_ACOUNT = {
  PENDING: 1,
  PARTIAL: 2,
  COMPLITED: 3,
  CANCELLED: 2,

} as const;

export const EMAIL_STATUS = {
  NOT_SENT: 0,
  SENT: 1,
  FAILED: 2,
};


export const INVOICE_CATEGORY = {
  BED: 1,
  MISC: 2,
  OPENING_BALANCE: 3,
} as const



export const COMPANY_STATUS = {
  ACTIVE: 1,
  INACTIVE: 2,
  EXPIRED: 0,
} as const

export const LA_STATUS = {
  ACTIVE: 1,
  INACTIVE: 2,
  DELETE: 0,
} as const

export const BANK_STATUS = {
  ACTIVE: 1,
  INACTIVE: 2,
} as const

export const CHART_OF_ACCOUNTS_STATUS = {
  ACTIVE: 1,
  INACTIVE: 2,
} as const


export const INVOICE_TO_TYPE = {
  PRIVATE: 1,
  LA: 2,
  CHC: 3,
  CLIENT_CONTRIBUTION: 4,
  FNC: 5,
  INCONT: 6,
  FAMILY_TOPUP: 7,
  THIRD_PARTY_TOPUP: 8,
} as const;

export const OPENING_BALANCE_TO_TYPE = { ...INVOICE_TO_TYPE } as const;


export const CREDIT_TO = { ...INVOICE_TO_TYPE } as const;

export const FUND_SOURCE_STATUS_TYPE = {
  ACTIVE: 1,
  INACTIVE: 2,
} as const;

export const NOTIFY_TYPE = {
  CREATE: "create" as const,
  UPDATE: "update" as const,
  DELETE: "delete" as const,
  ERROR: "error" as const,
  WARNING: "warning" as const,
};

export const USER_STATUS = {
  ACTIVE: 1,
  INACTIVE: 2,
  DELETE: 3,
} as const

export const SALUTATION = {
  MR: 1,
  MRS: 2,
  MISS: 3,

} as const;

export const GENDER = {
  MALE: 'Male',
  FEMALE: 'Female',
}


export const INVOICE_TYPE = {
  NORMAL: 1,          // Standard invoice
  ARREARS: 2,        // Additional amount due
  VAT_ARREARS: 7,        // Additional amount due
  CREDIT: 3,          // Refund / deduction
  OTHER: 4,          // Refund / deduction
  BLOCK_BED: 5,          // Refund / deduction
  OPENING_BALANCE: 6,
  VAT_CREDIT: 8,         // Refund / deduction
  DEPOSIT: 9,         // Refund / DEPOSIT
} as const;

export const PAYMENT_METHOD_TYPE = {
  CASH: 1,
  CHEQUE: 2,
  CREDIT_CARD: 3,
  DIRECT_DEBIT: 4,
  ONLINE_BANKING: 5,
  NORMAL: 6,

  AMERICAN_EXPRESS: 7,
  BACS: 8,
  MASTERCARD: 9,
  STANDING_ORDER: 10,
  SWITCH_MAESTRO: 11,
  VISA: 12,
  DIRECT_PAYMENT_CREDIT: 13,
};

export const PAYMENT_METHOD_LABEL: Record<number, string> = Object.fromEntries(
  Object.entries(PAYMENT_METHOD_TYPE).map(([key, value]) => [value, key])
);

export const LPA_TYPE = {
  YES: 1,
  NO: 0,

} as const;

export const RELATION_TYPE = {
  SPOUSE: 1,
  SON: 2,
  DAUGHTER: 3,
  FRIEND: 4,
  EX_HUSBAND: 5,
  EX_WIFE: 6,
  OTHERS: 7,
} as const;

export const NOK_INVOICE_REQUIRED = {
  YES: 1,
  NO: 0,

} as const;

export const CREDIT_TYPE = {
  ADJUSTMENT_CREDIT: 1,
  ADVANCE_CREDIT: 2,
  OPENING_BALANCE_CREDIT: 3,
  VAT_ADJUSTMENT_CREDIT: 4,
} as const;

export const CREDIT_STATUS = {
  ACTIVE: 1,
  INACTIVE: 2,
  DELETE: 3,
} as const;



export const VAT_STATUS = {
  ACTIVE: 1,
  INACTIVE: 2,
  DELETE: 3,
} as const;

export const MISCELLANEOUS_STATUS = {
  ACTIVE: 1,
  INACTIVE: 2,
  DELETE: 3,
} as const;


export const DUEDATE_STATUS = {
  ACTIVE: 1,
  INACTIVE: 2,
  DELETE: 3,
} as const;


export const BILLING_PATTERN_STATUS = {
  ACTIVE: 1,
  INACTIVE: 2,
  DELETE: 3,
} as const;

export const DOCUMENT_TYPE = {
  CONTRACT: 1,
  WELCOME_LETTER: 2,
  FEE_INCREASE_LETTER: 3,
  OTHERS: 4,
} as const;

export const DOCUMENT_STATUS = {
  ACTIVE: 1,
  INACTIVE: 2,
  // SIGNED:3
} as const;

export const DOCUMENT_TEMPLATE_TYPES = {
  RESIDENT_CONTRACT: 1,
  FEE_INCREASE_LETTER: 2,
  ICB_LA_PERMANENT: 3,
  ICB_LA_RESPITE: 4,
  PRIVATE_PERMANENT: 5,
  PRIVATE_RESPITE: 6,
  CC_CHC_PERMANENT: 7,
  RESIDENT_DEPOSIT_INVOICE: 8,
  CC_CHC_RESPITE: 9,
  // SIGNED: 3
} as const;

export const ADVANCE_STATUS = {
  ACTIVE: 1,
  PARTIALLY_USED: 2,
  CLOSED: 3,
  REFUNDED: 4,
} as const;

export const ADVANCE_USAGE_TYPE = {
  INVOICE: 1,
  REFUND: 2,
  ADJUSTMENT: 3,
  OTHER: 4,
} as const;


export const BOOKING_TYPE = {
  SHARED: 1,
  PRIVATE: 2,
} as const;
export const PREBOOK_TYPE = {
  YES: 1,
  NO: 2,
} as const;

export const PRIMARY_ACCOUNT = {
  NO: 0,
  YES: 1,
} as const;

export const REPORT_TYPE = {
  AR_AGEING_DETAIL: 'AR_AGEING_DETAIL',
  AGEING_SUMMARY: 'AGEING_SUMMARY',
  SALES_CUSTOMER_DETAIL: 'SALES_CUSTOMER_DETAIL',
  SALES_CUSTOMER_SUMMARY: 'SALES_CUSTOMER_SUMMARY',
  FNC_REPORT: 'FNC_REPORT',
  INCOME_ANALYSIS: "INCOME_ANALYSIS",
  CASH_FLOW_ANALYSIS: "CASH_FLOW_ANALYSIS"
} as const;

export const PREBOOK_HISTORY_STATUS = {
  ACTIVE: 1,
  INACTIVE: 2,
  DELETE: 3,
} as const;
export const VAT_CONFIG_STATUS = {
  ACTIVE: 1,
  INACTIVE: 2,
  DELETE: 3,
} as const;
export const BLOCK_BEDS_STATUS = {
  ACTIVE: 1,
  INACTIVE: 2,
} as const;

export const BLOCK_BEDS_TYPE = {
  YES: 1,
  NO: 2,
} as const;

export const DOCUMENT_IDENTIFIER = {
  fully: 1,
  partial: 2,
  private: 3,
  feesIncrement: 4,
  contract: 5,
} as const

export const OPENING_BALANCE_TYPE = {
  DEBIT: 1,
  CREDIT: 2,
} as const;

export const SHOW_ALERT_TYPE = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
  QUESTION: 'question',
} as const;



export const HTTTP_STATUS_CODE = {
  SUCCESS: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500,
} as const;


export const USER_TYPE = {
  SUPER_ADMIN: 1,
  OPERATIONS_MANAGER: 2,
  BILLING_EXECUTIVE: 3,
  ACCOUNTS_MANAGER: 4,
  FINANCE_EXECUTIVE: 5,
  PURCHASE_OFFICER: 6,
} as const;

export const DATA_MIGRATION_TO_DATE = moment('2025-12-31');


export const FOLLOW_UP_PRIORITY = {
  LOW: 3,
  MEDIUM: 2,
  HIGH: 1,
} as const;

export const FOLLOW_UP_STATUS = {
  PENDING: 1,
  COMPLETED: 2,
} as const;


export const FOLLOW_UP_TYPE = {
  PARENT: 1,
  SUB: 2
} as const;

export const FOLLOW_UP_TO_TYPE = {
  RESIDENT: 1,
  VENDOR: 2,
  EMPLOYEE: 3,
  ENQUIRY: 4,
  OTHER: 5,
} as const;

export const VENDOR_STATUS = {
  ACTIVE: 1,
  INACTIVE: 2,
  DELETE: 3,
  BLOCKED: 4,
} as const;
export const PRODUCT_CATEGORY_STATUS = {
  ACTIVE: 1,
  INACTIVE: 2,
} as const;
export const PRODUCT_STATUS = {
  ACTIVE: 1,
  INACTIVE: 2,
  DELETE: 3,
} as const;
export const PURCHASE_ORDER_STATUS = {
  DRAFT: 1,        // Created but not sent
  PENDING: 2,      // Sent to vendor, awaiting approval
  APPROVED: 3,     // Approved internally
  PARTIAL: 4,      // Partially received / billed
  COMPLETED: 5,    // Fully received & closed
  CANCELLED: 6,    // Cancelled before completion
  VOID: 7,         // Admin-only hard void
  REJECTED: 8,     // Reject the PO
  AWAITING_MD: 9,           // Manager sent to MD for approval (PO > £2,000)
  AWAITING_MANAGER_FINAL: 10, // MD approved, now waiting for Manager's final sign-off
} as const;

export const PURCHASE_BILL_STATUS = {
  DRAFT: 1,
  CONFIRMED: 2,
  CANCELLED: 3,
} as const;

export const VAT_MODE_TYPE = {
  INCLUDE: 1, // price includes VAT
  EXCLUDE: 2, // price excludes VAT
} as const;
export const GRN_STATUS_TYPE = {
  FULLY_RECEIVED: 1,
  PARTIALLY_RECEIVED: 2,
  CANCELED: 3,
} as const;

export const EMAIL_PROCESS_STATUS = {
  PROCESSING: 1,
  COMPLETED: 2,
  FAILED: 3,
} as const;

export const NOTIFICATION_STATUS = {
  UNREAD: 1,
  READ: 2,
  FAILED: 3,
} as const;

export const NOTIFICATION_TYPE = {
  BULK_INVOICE_EMAIL: 1,
} as const;

export const UNIT_OF_MEASUREMENT_STATUS = {
  ACTIVE: 1,
  INACTIVE: 2,
} as const;

export const MAIL_DRAFT_TYPE = {
  PRIVATE_PERMANENT: 1,
  PRIVATE_RESPITE: 2,
  LA_ICB_PERMANENT: 3,
  LA_ICB_RESPITE: 4,
  RESPITE_TO_PERMANENT_PVT: 5,
  RESPITE_TO_PERMANENT_LA_ICB: 6,
  ANNUAL_FEE_INCREMENT_LETTER: 7,
} as const;


export const NOK_EMAIL_TYPE = {
  PRIMARY: 1,
  SECONDARY: 2,
} as const;

export const DISCOUNT_STATUS = {
  ACTIVE: 1,
  INACTIVE: 2,
  EXPIRED: 3,
} as const;
export const DISCOUNT_TYPE = {
  PERCENTAGE: 1,
  AMOUNT: 2,
} as const;
export const DISCOUNT_APPLICABLE_TYPE = {
  SEAT: 1,
  ROOM: 2,
  TICKET: 3,
  PRODUCT: 4,
} as const;
export const DEBIT_TYPE = {
  PRODUCT: 1,
  SERVICE: 2,
  NORMAL: 3,
} as const;

export const DEBIT_NOTE_SETTLEMENT_TYPE = {
  REFUND: 1,
  ADJUSTMENT: 2,
  MIXED: 3,
} as const;

export const DEBIT_NOTE_STATUS = {
  CREATED: 1,
  PARTIAL: 2,
  SETTLED: 3,
  CANCELLED: 4,
} as const;



// CMS

export const USER_ROLE = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  FACULTY: 'FACULTY',
  STUDENT: 'STUDENT',
} as const;