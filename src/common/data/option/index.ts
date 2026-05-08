
import { PLACEMENT_TYPE, FUND_SOURCE_TYPE, PRICE_PERIOD_STATUS, INVOICE_TO_TYPE, USER_STATUS, SALUTATION, FUND_SOURCE_STATUS_TYPE, FUND_TYPE, PAYMENT_STATUS, BED_STATUS, CONTRACT_STATUS_TYPE, RESPITE_STATUS_TYPE, FNC_STATUS_TYPE, INCONT_STATUS_TYPE, INVOICE_REQUEST_TYPE, INVOICE_MODE_TYPE, RESIDENT_STATUS_TYPE, INVOICE_TYPE, PAYMENT_METHOD_TYPE, LPA_TYPE, RELATION_TYPE, NOK_INVOICE_REQUIRED, USER_TYPE } from "../../constant";
import { BILLING_PATTERN_STATUS, BOOKING_TYPE, CREDIT_STATUS, CREDIT_TYPE, DOCUMENT_STATUS, DOCUMENT_TYPE, INVOICE_CATEGORY, INVOICE_STATUS, PREBOOK_TYPE, REPORT_TYPE, ROOM_STATUS, FAMILY_OR_THIRD_PARTY_TOPUP_STATUS, VAT_CONFIG_STATUS, VAT_STATUS, BLOCK_BEDS_TYPE, BLOCK_BEDS_STATUS, LA_STATUS, CHART_OF_ACCOUNTS_CATEGORY_TYPE, OPENING_BALANCE_STATUS, CHART_OF_ACCOUNTS_STATUS, OPENING_BALANCE_TYPE, GENDER, FOLLOW_UP_PRIORITY, FOLLOW_UP_STATUS, VENDOR_STATUS, PRODUCT_STATUS, PURCHASE_ORDER_STATUS, VAT_MODE_TYPE, GRN_STATUS_TYPE, MAIL_DRAFT_TYPE, EMAIL_STATUS, NOK_EMAIL_TYPE, DISCOUNT_STATUS, DISCOUNT_TYPE, DISCOUNT_APPLICABLE_TYPE, DEBIT_NOTE_SETTLEMENT_TYPE, DEBIT_NOTE_STATUS, USER_ROLE } from "../../constant/app";

export const PLACEMENT_LIST = [
  {
    value: PLACEMENT_TYPE.PERMANENT,
    label: "Permanent"
  },
  {
    value: PLACEMENT_TYPE.RESPITE,
    label: "Respite"
  }
];


export const FUND_SOURCE_LIST = [
  {
    value: FUND_SOURCE_TYPE.PRIVATE,
    label: "Private",
    shortName: 'PVT',
  },
  {
    value: FUND_SOURCE_TYPE.LOCAL_AUTHORITY,
    label: "Local Authority",
    shortName: 'LA',
  },
  {
    value: FUND_SOURCE_TYPE.CHC,
    label: "ICB",
    shortName: "ICB",
  },
  {
    value: FUND_SOURCE_TYPE.JOINT_FUNDNG,
    label: "Joint Funding",
    shortName: "JF",
  },
];

export const FUND_TYPE_LIST = [
  {
    value: FUND_TYPE.PARTIAL,
    label: "Partial",
  },
  {
    value: FUND_TYPE.FULLY,
    label: "Fully",
  },
]

export const RESPITE_STATUS_LIST = [
  {
    value: RESPITE_STATUS_TYPE.EXTENDED_WITH_DATE,
    label: "Extended with Date",
  },
  {
    value: RESPITE_STATUS_TYPE.EXTENDED_WITH_PERMANENT,
    label: "Extended with Permanent",
  },
];


export const FNC_STATUS_LIST = [
  {
    value: FNC_STATUS_TYPE.YES,
    label: "Yes",
  },
  {
    value: FNC_STATUS_TYPE.NO,
    label: "No",
  },
];

export const FAMILY_TOPUP_STATUS_LIST = [
  {
    value: FAMILY_OR_THIRD_PARTY_TOPUP_STATUS.YES,
    label: "Yes",
  },
  {
    value: FAMILY_OR_THIRD_PARTY_TOPUP_STATUS.NO,
    label: "No",
  },
];

export const INCONT_STATUS_LIST = [
  {
    value: INCONT_STATUS_TYPE.YES,
    label: "Yes",
  },
  {
    value: INCONT_STATUS_TYPE.NO,
    label: "No",
  },
];

export const INVOICE_REQUEST_LIST = [
  {
    value: INVOICE_REQUEST_TYPE.YES,
    label: "Yes",
  },
  {
    value: INVOICE_REQUEST_TYPE.NO,
    label: "No",
  },
];


export const INVOICE_MODE_LIST = [
  {
    value: INVOICE_MODE_TYPE.EMAIL,
    label: "Email",
  },
  {
    value: INVOICE_MODE_TYPE.POST,
    label: "Post",
  },
];


export const RESIDENT_STATUS_LIST = [
  {
    value: RESIDENT_STATUS_TYPE.ACTIVE,
    label: "Active",
    color: "success",
  },
  {
    value: RESIDENT_STATUS_TYPE.LEFT,
    label: "Left",
    color: "warning",
  },
  {
    value: RESIDENT_STATUS_TYPE.RIP,
    label: "RIP",
    color: "danger",
  },
];

export const BED_STATUS_LIST = [
  {
    value: BED_STATUS.AVAILABLE,
    label: "Available",
    color: "success",
  },
  {
    value: BED_STATUS.OCCUPIED,
    label: "Occupied",
    color: "danger",
  },
  {
    value: BED_STATUS.PRIVATE_OCCUPIED,
    label: "Single",
    color: "info",
  },
  {
    value: BED_STATUS.BLOCK_BED_OCCUPIED,
    label: "Block Bed Occupied",
    color: "warning",
  },
];
export const ROOM_STATUS_LIST = [
  {
    value: ROOM_STATUS.ACTIVE,
    label: "Active",
    color: "success",
  },
  {
    value: ROOM_STATUS.INACTIVE,
    label: "Inactive",
    color: "secondary",
  },
  {
    value: ROOM_STATUS.DELETE,
    label: "Deleted",
    color: "danger",
  },
  {
    value: ROOM_STATUS.PRIVATE_OCCUPIED,
    label: "Single",
    color: "warning",
  },
];



export const PRICE_PERIOD_STATUS_LIST = [
  {
    value: PRICE_PERIOD_STATUS.ACTIVE,
    label: "Active",
    color: "success",
  },
  {
    value: PRICE_PERIOD_STATUS.INACTIVE,
    label: "Inactive",
    color: "danger",
  },
  {
    value: PRICE_PERIOD_STATUS.EXPIRED,
    label: "Expired",
    color: "warning",
  },
  {
    value: PRICE_PERIOD_STATUS.DELETE,
    label: "Delete",
    color: "danger",
  },
];


export const CONTRACT_STATUS_LIST = [
  {
    value: CONTRACT_STATUS_TYPE.SENT,
    label: "Sent",
    color: "success",
  },
  {
    value: CONTRACT_STATUS_TYPE.UPDATED,
    label: "Updated",
    color: "danger",
  },
];


// export const PAYMENT_STATUS_LIST = [
//   {
//     value: PAYMENT_STATUS.DRAFT,
//     label: "Draft",
//     color: "secondary",          // Bootstrap: neutral / inactive
//     icon: "EditNote"             // 📝 Draft state
//   },
//   {
//     value: PAYMENT_STATUS.PAID,
//     label: "Paid",
//     color: "success",            // Bootstrap: completed / success
//     icon: "CheckCircle"          // ✅ Fully paid
//   },
//   {
//     value: PAYMENT_STATUS.PENDING,
//     label: "Pending",
//     color: "warning",            // Bootstrap: attention required
//     icon: "HourglassTop"         // ⏳ Waiting
//   },
//   {
//     value: PAYMENT_STATUS.PARTIAL,
//     label: "Partial",
//     color: "info",               // Bootstrap: partial / in-progress
//     icon: "RemoveCircleOutline"  // ➖ Partially paid
//   },
//   {
//     value: PAYMENT_STATUS.VOID,
//     label: "Void",
//     color: "danger",             // Bootstrap: destructive / cancelled
//     icon: "Cancel"               // ❌ Voided
//   },
// ];


export const INVOICE_TO_TYPE_LIST = [
  {
    value: INVOICE_TO_TYPE.CHC,
    label: "ICB",
    color: "primary",       // 🔵 Blue
    shortName: "ICB"
  },
  {
    value: INVOICE_TO_TYPE.CLIENT_CONTRIBUTION,
    label: "Client Contribution",
    color: "info",          // 🔷 Light blue
    shortName: "CC"
  },
  {
    value: INVOICE_TO_TYPE.FNC,
    label: "FNC",
    color: "warning",       // 🟡 Yellow
    shortName: "FNC"
  },
  {
    value: INVOICE_TO_TYPE.LA,
    label: "Local Authority",
    color: "success",       // 🟢 Green
    shortName: "LA"
  },
  {
    value: INVOICE_TO_TYPE.PRIVATE,
    label: "Private",
    color: "secondary",     // ⚪ Gray
    shortName: "PVT"
  },
  {
    value: INVOICE_TO_TYPE.INCONT,
    label: "INCONT",
    color: "danger",        // 🔴 Red
    shortName: "INC"
  },
  {
    value: INVOICE_TO_TYPE.FAMILY_TOPUP,
    label: "Family TopUp",
    color: "secondary",     // Gray
    shortName: "FTU"
  },
  {
    value: INVOICE_TO_TYPE.THIRD_PARTY_TOPUP,
    label: "Third Party TopUp",
    color: "dark",          // ⚫ Dark
    shortName: "TPT"
  }
];


export const OPENING_BALANCE_TO_TYPE_LIST = [...INVOICE_TO_TYPE_LIST]

export const INVOICE_STATUS_TYPE_LIST = [
  {
    value: INVOICE_STATUS.DRAFT,
    label: "Draft",
    color: "secondary",          // Bootstrap: neutral / inactive
    icon: "EditNote"
  },
  {
    value: INVOICE_STATUS.PENDING,
    label: "Pending",
    color: "warning",            // Bootstrap: attention required
    icon: "HourglassTop"         // ⏳ Waiting
  },
  {
    value: INVOICE_STATUS.PARTIAL,
    label: "Partially Paid",
    color: "info",               // Bootstrap: partial / in-progress
    icon: "RemoveCircleOutline"  // ➖ Partially paid
  },
  {
    value: INVOICE_STATUS.COMPLITED,
    label: "Completed",
    color: "success",            // Bootstrap: completed / success
    icon: "CheckCircle"
  },
  {
    value: INVOICE_STATUS.CANCELLED,
    label: "Cancelled",
    color: "danger",             // Bootstrap: destructive / cancelled
    icon: "Cancel"               // ❌ Voided
  },
  {
    value: INVOICE_STATUS.VOID,
    label: "Void",
    color: "danger",             // Bootstrap: destructive / cancelled
    icon: "Cancel"               // ❌ Voided
  },
];



export const CREDIT_TO_TYPE_LIST = [...INVOICE_TO_TYPE_LIST];


export const CREDIT_TYPE_LIST = [
  {
    value: CREDIT_TYPE.ADVANCE_CREDIT,
    label: "Payment",
  },
  {
    value: CREDIT_TYPE.ADJUSTMENT_CREDIT,
    label: "Credit Note",
  },
  {
    value: CREDIT_TYPE.OPENING_BALANCE_CREDIT,
    label: "Opening Balance",
  },
  {
    value: CREDIT_TYPE.VAT_ADJUSTMENT_CREDIT,
    label: "VAT Credit Note",
  }
];

export const CREDIT_TYPE_STAUS_LIST = [
  {
    value: CREDIT_STATUS.ACTIVE,
    label: "Active",
  },
  {
    value: CREDIT_STATUS.INACTIVE,
    label: "Inactive",
  },
  {
    value: CREDIT_STATUS.DELETE,
    label: "Delete",
  }
]


export const FUND_SOURCE_STATUS_TYPE_LIST = [
  {
    value: FUND_SOURCE_STATUS_TYPE.ACTIVE,
    label: "Active",
  },
  {
    value: FUND_SOURCE_STATUS_TYPE.INACTIVE,
    label: "Inactive",
  }
]

export const SALUTATION_LIST = [
  {
    value: SALUTATION.MR,
    label: "Mr",
  },
  {
    value: SALUTATION.MISS,
    label: "Ms",
  },
  {
    value: SALUTATION.MRS,
    label: "Mrs",
  }
];

export const GENDER_LIST = [
  {
    value: GENDER.MALE,
    label: "Male",
  },
  {
    value: GENDER.FEMALE,
    label: "Female",
  },
];

export const USER_STATUS_LIST = [
  {
    value: USER_STATUS.ACTIVE,
    label: "Active",
  },
  {
    value: USER_STATUS.INACTIVE,
    label: "Inactive",
  },
  {
    value: USER_STATUS.DELETE,
    label: "Delete",
  }
];
export const BLOCK_BEDS_STATUS_LIST = [
  {
    value: BLOCK_BEDS_STATUS.ACTIVE,
    label: "Active",
    color: "success"
  },
  {
    value: BLOCK_BEDS_STATUS.INACTIVE,
    label: "Inactive",
    color: "warning"
  },
];


export const INVOICE_TYPE_LIST = [
  {
    value: INVOICE_TYPE.NORMAL,
    label: "Normal",
    color: "success",
    icon: 'DoneAll'
  },
  {
    value: INVOICE_TYPE.ARREARS,
    label: "Arrears",
    color: "warning",
    icon: 'PendingActions'
  },
  {
    value: INVOICE_TYPE.CREDIT,
    label: "Credit",
    color: "info",
    icon: 'BrightnessMedium'
  },
  {
    value: INVOICE_TYPE.OTHER,
    label: "Other",
    color: "secondary",
    icon: 'Category'
  },
  {
    value: INVOICE_TYPE.BLOCK_BED,
    label: "Block Bed",
    color: "light",
    icon: 'Block'
  },
  {
    value: INVOICE_TYPE.OPENING_BALANCE,
    label: "Opening Balance",
    color: "light",
    icon: 'AccountBalanceWallet'
  },
  {
    value: INVOICE_TYPE.VAT_ARREARS,
    label: "VAT Arrears",
    color: "light",
    icon: 'RequestPage'
  },
  {
    value: INVOICE_TYPE.VAT_CREDIT,
    label: "VAT Credit",
    color: "light",
    icon: 'Payments'
  },
  {
    value: INVOICE_TYPE.DEPOSIT,
    label: "Deposit",
    color: "light",
    icon: 'Savings'
  },
];
export const EMAIL_STATUS_LIST = [

  {
    value: EMAIL_STATUS.SENT,
    label: "Sent",
    color: "success",
    // icon: 'HomeRepairService'
  },
   {
    value: EMAIL_STATUS.NOT_SENT,
    label: "Not Sent",
    color: "warning",
    // icon: 'HomeRepairService'
  },
  {
    value: EMAIL_STATUS.FAILED,
    label: "Failed",
    color: "danger",
    // icon: 'HomeRepairService'
  }

]


export const PAYMENT_METHOD_LIST = [
  { value: PAYMENT_METHOD_TYPE.CASH, label: "Cash" },
  { value: PAYMENT_METHOD_TYPE.CHEQUE, label: "Cheque" },
  { value: PAYMENT_METHOD_TYPE.CREDIT_CARD, label: "Credit Card" },
  { value: PAYMENT_METHOD_TYPE.DIRECT_DEBIT, label: "Direct Debit" },
  { value: PAYMENT_METHOD_TYPE.ONLINE_BANKING, label: "Online Banking" },
  { value: PAYMENT_METHOD_TYPE.NORMAL, label: "Normal" },

  { value: PAYMENT_METHOD_TYPE.AMERICAN_EXPRESS, label: "American Express" },
  { value: PAYMENT_METHOD_TYPE.BACS, label: "BACS" },
  { value: PAYMENT_METHOD_TYPE.MASTERCARD, label: "MasterCard" },
  { value: PAYMENT_METHOD_TYPE.STANDING_ORDER, label: "Standing Order" },
  { value: PAYMENT_METHOD_TYPE.SWITCH_MAESTRO, label: "Switch/Maestro" },
  { value: PAYMENT_METHOD_TYPE.VISA, label: "Visa" },
  { value: PAYMENT_METHOD_TYPE.DIRECT_PAYMENT_CREDIT, label: "Direct Payment Credit" },
];


export const LPA_TYPE_LIST = [
  {
    label: "Yes",
    value: LPA_TYPE.YES
  },
  {
    label: "No",
    value: LPA_TYPE.NO
  }
];

export const RELATION_TYPE_LIST = [
  { value: RELATION_TYPE.SPOUSE, label: "Spouse" },
  { value: RELATION_TYPE.SON, label: "Son" },
  { value: RELATION_TYPE.DAUGHTER, label: "Daughter" },
  { value: RELATION_TYPE.FRIEND, label: "Friend" },
  { value: RELATION_TYPE.EX_HUSBAND, label: "Ex Husband" },
  { value: RELATION_TYPE.EX_WIFE, label: "Ex Wife" },
  { value: RELATION_TYPE.OTHERS, label: "Others" },
];

export const NOK_INVOICE_REQUIRED_LIST = [
  {
    label: "Yes",
    value: NOK_INVOICE_REQUIRED.YES
  },
  {
    label: "No",
    value: NOK_INVOICE_REQUIRED.NO
  }
];
export const VAT_STATUS_list = [
  { value: VAT_STATUS.ACTIVE, label: "Active", color: "success" },
  { value: VAT_STATUS.INACTIVE, label: "Inactive", color: "warning" },
  { value: VAT_STATUS.DELETE, label: "Delete", color: "danger" },
];


export const INVOICE_CATEGORY_LIST = [
  {
    value: INVOICE_CATEGORY.BED,
    label: "Bed",
  },
  {
    value: INVOICE_CATEGORY.MISC,
    label: "Miscellaneous",
  },
  {
    value: INVOICE_CATEGORY.OPENING_BALANCE,
    label: "Opening Balance",
  }
]


export const BILLING_PATTERN_STATUS_LIST = [

  { value: BILLING_PATTERN_STATUS.ACTIVE, label: "Active", color: "success" },
  { value: BILLING_PATTERN_STATUS.INACTIVE, label: "Inactive", color: "warning" },
  { value: BILLING_PATTERN_STATUS.DELETE, label: "Delete", color: "danger" },

];



export const DOCUMENT_TYPE_LIST = [

  { value: DOCUMENT_TYPE.CONTRACT, label: "Contract", color: "info", icon: "" },
  { value: DOCUMENT_TYPE.WELCOME_LETTER, label: "Welcome Letter", color: "success", icon: "" },
  { value: DOCUMENT_TYPE.FEE_INCREASE_LETTER, label: "Fees Increase Letter", color: "primary", icon: "" },
  { value: DOCUMENT_TYPE.OTHERS, label: "Others", color: "danger", icon: "" },

];

export const DOCUMENT_STATUS_LIST = [

  { value: DOCUMENT_STATUS.ACTIVE, label: "Active", color: "info" },
  { value: DOCUMENT_STATUS.INACTIVE, label: "In Active", color: "danger" },
  // { value: DOCUMENT_STATUS.SIGNED, label: "Fees Increase Letter", color: "success" },

];
export const OPENING_BALANCE_TYPE_LIST = [
  {
    value: OPENING_BALANCE_TYPE.CREDIT,
    label: "Credit",
    color: "danger"
  },
  {
    value: OPENING_BALANCE_TYPE.DEBIT,
    label: "Debit",
    color: "success"
  },
];

export const CHART_OF_ACCOUNTS_STATUS_LIST = [
  {
    value: CHART_OF_ACCOUNTS_STATUS.ACTIVE,
    label: "Active",
    color: "success"
  },
  {
    value: CHART_OF_ACCOUNTS_STATUS.INACTIVE,
    label: "Inactive",
    color: "warning"
  },
];
export const BOOKING_TYPE_LIST = [
  {
    value: BOOKING_TYPE.SHARED,
    label: "Double"
  },
  {
    value: BOOKING_TYPE.PRIVATE,
    label: "Single"
  }
];

export const YEAR_BASED_REPORTS = [
  REPORT_TYPE.INCOME_ANALYSIS,
  REPORT_TYPE.CASH_FLOW_ANALYSIS,
];


export const REPORT_TYPE_LIST = [
  { label: 'AR Ageing Detail Reports', value: REPORT_TYPE.AR_AGEING_DETAIL },
  { label: 'Ageing Summary Reports', value: REPORT_TYPE.AGEING_SUMMARY },
  { label: 'Sales by Customer Detail Reports', value: REPORT_TYPE.SALES_CUSTOMER_DETAIL },
  { label: 'FNC Report List', value: REPORT_TYPE.FNC_REPORT },
  { label: 'Income Analysis', value: REPORT_TYPE.INCOME_ANALYSIS },
  { label: 'Cash flow analysis', value: REPORT_TYPE.CASH_FLOW_ANALYSIS },
];



export const PRE_BOOKING_LIST = [
  {
    value: PREBOOK_TYPE.YES,
    label: "Yes"
  },
  {
    value: PREBOOK_TYPE.NO,
    label: "No"
  }
];
export const BLOCK_BEDS_TYPE_LIST = [
  {
    value: BLOCK_BEDS_TYPE.YES,
    label: "Yes"
  },
  {
    value: BLOCK_BEDS_TYPE.NO,
    label: "No"
  }
];

export const VAT_CONFIG_STATUS_LIST = [
  { value: VAT_CONFIG_STATUS.ACTIVE, label: "Active", color: "success" },
  { value: VAT_CONFIG_STATUS.INACTIVE, label: "Inactive", color: "warning" },
  { value: VAT_CONFIG_STATUS.DELETE, label: "Delete", color: "danger" },
];


export const LA_STATUS_LIST = [
  { value: LA_STATUS.ACTIVE, label: "Active", color: "success" },
  { value: LA_STATUS.INACTIVE, label: "Inactive", color: "warning" },
  { value: LA_STATUS.DELETE, label: "Delete", color: "danger" },
];




export const CHART_OF_ACCOUNTS_CATEGORY_TYPE_LIST = [
  {
    value: CHART_OF_ACCOUNTS_CATEGORY_TYPE.ASSET,
    label: "Asset",
    color: "info",
  },
  {
    value: CHART_OF_ACCOUNTS_CATEGORY_TYPE.LIABILITY,
    label: "Liability",
    color: "warning",
  },
  {
    value: CHART_OF_ACCOUNTS_CATEGORY_TYPE.INCOME,
    label: "Income",
    color: "success",
  },
  {
    value: CHART_OF_ACCOUNTS_CATEGORY_TYPE.EXPENSE,
    label: "Expense",
    color: "danger",
  },
  {
    value: CHART_OF_ACCOUNTS_CATEGORY_TYPE.ACCOUNTS_RECEIVABLE,
    label: "Accounts Receivable",
    color: "secondary",
  },
  {
    value: CHART_OF_ACCOUNTS_CATEGORY_TYPE.ACCOUNTS_PAYABLE,
    label: "Accounts Payable",
    color: "primary",
  },
];





export const OPENING_BALANCE_STATUS_LIST = [
  { value: OPENING_BALANCE_STATUS.PENDING, label: "Pending" },
  { value: OPENING_BALANCE_STATUS.PARTIAL, label: "Partially Completed" },
  { value: OPENING_BALANCE_STATUS.COMPLETED, label: "Completed" },
  { value: OPENING_BALANCE_STATUS.CANCELLED, label: "Cancelled" },
];

export const USER_TYPE_LIST = [
  {
    value: USER_TYPE.SUPER_ADMIN,
    label: "Super Admin",
  },
  {
    value: USER_TYPE.OPERATIONS_MANAGER,
    label: "Operations Manager",
  },
  {
    value: USER_TYPE.BILLING_EXECUTIVE,
    label: "Billing Executive",
  },
  {
    value: USER_TYPE.ACCOUNTS_MANAGER,
    label: "Accounts Manager",
  },
  {
    value: USER_TYPE.FINANCE_EXECUTIVE,
    label: "Finance Executive (Billing & Accounts)",
  },
  {
    value: USER_TYPE.PURCHASE_OFFICER,
    label: "Purchase Officer",
  },
];


export const FOLLOW_UP_PRIORITY_LIST = [
  {
    value: FOLLOW_UP_PRIORITY.LOW,
    label: "Low",
    color: 'dark',
  },
  {
    value: FOLLOW_UP_PRIORITY.MEDIUM,
    label: "Medium",
    color: 'warning',
  },
  {
    value: FOLLOW_UP_PRIORITY.HIGH,
    label: "High",
    color: 'danger',
  },
];

export const FOLLOW_UP_STATUS_LIST = [
  {
    value: FOLLOW_UP_STATUS.PENDING,
    label: "Open",
    color: 'info',
  },
  {
    value: FOLLOW_UP_STATUS.COMPLETED,
    label: "Completed",
    color: 'success',
  }
];

export const VENDOR_STATUS_LIST = [
  {
    value: VENDOR_STATUS.ACTIVE,
    label: "Active",
    color: "success",
  },
  {
    value: VENDOR_STATUS.INACTIVE,
    label: "Inactive",
    color: "secondary",
  },
  {
    value: VENDOR_STATUS.DELETE,
    label: "Deleted",
    color: "danger",
  },
  {
    value: VENDOR_STATUS.BLOCKED,
    label: "Blocked",
    color: "danger",
  }
];
export const PRODUCT_STATUS_LIST = [
  {
    value: PRODUCT_STATUS.ACTIVE,
    label: "Active",
    color: "success",
  },
  {
    value: PRODUCT_STATUS.INACTIVE,
    label: "Inactive",
    color: "secondary",
  },
  {
    value: PRODUCT_STATUS.DELETE,
    label: "Deleted",
    color: "danger",
  }
];

export const PURCHASE_ORDER_STATUS_LIST = [
  {
    value: PURCHASE_ORDER_STATUS.DRAFT,
    label: "Draft",
    color: "secondary",
  },
  {
    value: PURCHASE_ORDER_STATUS.PENDING,
    label: "Pending",
    color: "warning",
  },
  {
    value: PURCHASE_ORDER_STATUS.APPROVED,
    label: "Approved",
    color: "info",
  },
  {
    value: PURCHASE_ORDER_STATUS.PARTIAL,
    label: "Partially Received",
    color: "primary",
  },
  {
    value: PURCHASE_ORDER_STATUS.COMPLETED,
    label: "Completed",
    color: "success",
  },
  {
    value: PURCHASE_ORDER_STATUS.CANCELLED,
    label: "Cancelled",
    color: "danger",
  },
  {
    value: PURCHASE_ORDER_STATUS.VOID,
    label: "Void",
    color: "danger",
  },
  {
    value: PURCHASE_ORDER_STATUS.REJECTED,
    label: "Rejected",
    color: "dark",
  },
  {
    value: PURCHASE_ORDER_STATUS.AWAITING_MD,
    label: "Awaiting MD Approval",
    color: "warning",
  },
  {
    value: PURCHASE_ORDER_STATUS.AWAITING_MANAGER_FINAL,
    label: "Awaiting Manager Final Approval",
    color: "info",
  },
];
export const VAT_MODE_OPTIONS = [
  {
    value: VAT_MODE_TYPE.EXCLUDE,
    label: 'VAT Excluded',
    color: 'primary',
  },
  {
    value: VAT_MODE_TYPE.INCLUDE,
    label: 'VAT Included',
    color: 'info',
  },
];

export const GRN_STATUS_LIST = [
  {
    value: GRN_STATUS_TYPE.FULLY_RECEIVED,
    label: 'Fully Received',
    color: 'success',
  },
  {
    value: GRN_STATUS_TYPE.PARTIALLY_RECEIVED,
    label: 'Partially Received',
    color: 'warning',
  },
  {
    value: GRN_STATUS_TYPE.CANCELED,
    label: 'Canceled',
    color: 'danger',
  },
];
export const MAIL_DRAFT_TYPE_LIST = [
  {
    value: MAIL_DRAFT_TYPE.PRIVATE_PERMANENT,
    label: "Private (Permanent)",
    color: "primary",
  },
  {
    value: MAIL_DRAFT_TYPE.PRIVATE_RESPITE,
    label: "Private (Respite)",
    color: "info",
  },
  {
    value: MAIL_DRAFT_TYPE.LA_ICB_PERMANENT,
    label: "LA/ICB (Permanent)",
    color: "success",
  },
  {
    value: MAIL_DRAFT_TYPE.LA_ICB_RESPITE,
    label: "LA/ICB (Respite)",
    color: "warning",
  },
  {
    value: MAIL_DRAFT_TYPE.RESPITE_TO_PERMANENT_PVT,
    label: "Respite to Permanent Stay (PVT)",
    color: "secondary",
  },
  {
    value: MAIL_DRAFT_TYPE.RESPITE_TO_PERMANENT_LA_ICB,
    label: "Respite to Permanent Stay (LA/ICB)",
    color: "dark",
  },
  {
    value: MAIL_DRAFT_TYPE.ANNUAL_FEE_INCREMENT_LETTER,
    label: "Annual Fee Increment Letter",
    color: "danger",
  },
];


export const NOK_EMAIL_TYPE_LIST = [
  {
    value: NOK_EMAIL_TYPE.PRIMARY,
    label: "Primary",
  },
  {
    value: NOK_EMAIL_TYPE.SECONDARY,
    label: "Secondary",
  },
];


export const DISCOUNT_STATUS_LIST = [
  {
    value: DISCOUNT_STATUS.ACTIVE,
    label: 'Active',
    color: 'success',
  },
  {
    value: DISCOUNT_STATUS.INACTIVE,
    label: 'Inactive',
    color: 'secondary',
  },
  {
    value: DISCOUNT_STATUS.EXPIRED,
    label: 'Expired',
    color: 'danger',
  },
];
export const DISCOUNT_TYPE_LIST = [
  {
    value: DISCOUNT_TYPE.PERCENTAGE,
    label: 'Percentage',
    color: 'info',
  },
  {
    value: DISCOUNT_TYPE.AMOUNT,
    label: 'Fixed Amount',
    color: 'primary',
  },
];
export const DISCOUNT_APPLICABLE_TYPE_LIST = [
  {
    value: DISCOUNT_APPLICABLE_TYPE.SEAT,
    label: 'Seat',
  },
  {
    value: DISCOUNT_APPLICABLE_TYPE.ROOM,
    label: 'Room',
  },
  {
    value: DISCOUNT_APPLICABLE_TYPE.TICKET,
    label: 'Ticket',
  },
  {
    value: DISCOUNT_APPLICABLE_TYPE.PRODUCT,
    label: 'Product',
  },
];

export const DEBIT_NOTE_SETTLEMENT_TYPE_LIST = [
  {
    value: DEBIT_NOTE_SETTLEMENT_TYPE.REFUND,
    label: 'Refund',
    color: 'success',
  },
  {
    value: DEBIT_NOTE_SETTLEMENT_TYPE.ADJUSTMENT,
    label: 'Adjustment',
    color: 'warning',
  },
  {
    value: DEBIT_NOTE_SETTLEMENT_TYPE.MIXED,
    label: 'Mixed',
    color: 'secondary',
  },
];

export const DEBIT_NOTE_STATUS_LIST = [
  {
    value: DEBIT_NOTE_STATUS.CREATED,
    label: 'Created',
    color: 'secondary',
  },
  {
    value: DEBIT_NOTE_STATUS.PARTIAL,
    label: 'Partial',
    color: 'warning',
  },
  {
    value: DEBIT_NOTE_STATUS.SETTLED,
    label: 'Settled',
    color: 'success',
  },
  {
    value: DEBIT_NOTE_STATUS.CANCELLED,
    label: 'Cancelled',
    color: 'danger',
  },
];






// CMS
export const USER_ROLE_LIST = [
  {
    value: USER_ROLE.SUPER_ADMIN,
    label: 'Super Admin',
    color: 'danger',
  },
  {
    value: USER_ROLE.ADMIN,
    label: 'Admin',
    color: 'warning',
  },
  {
    value: USER_ROLE.FACULTY,
    label: 'Faculty',
    color: 'info',
  },
  {
    value: USER_ROLE.STUDENT,
    label: 'Student',
    color: 'success',
  },
];