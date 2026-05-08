export const notification = {
  residentInvoiceById: {
    api: "notification/invoiveDetailsById",
    method: "post",
    isFormData: false,
  },
} as const;


export const invoice = {
  downloadInvoiceById: {
    api: "document/downloadInvoiceById",
    method: "post",
    isFormData: false,
  },
} as const;

export const residentDocument = {
  downloadDocument: {
    api: "document",
    method: "post",
    isFormData: false,
  },  
} as const;

export const invoiceSingleMail = {
  invoiceMail: {
    api: "invoice/send-single",
    method: "post",
    isFormData: false,
  },  
} as const;
export const invoiceBulkMail = {
  invoiceMail: {
    api: "invoice/send-bulk",
    method: "post",
    isFormData: false,
  },  
} as const;
export const downloadInvoiceUrl = {
  downloadInvoice: {
    api: "invoice/export",
    method: "post",
    isFormData: false,
  },  
} as const;
export const residentDocumentMail = {
  documentMail: {
    api: "document/sendEmail",
    method: "post",
    isFormData: false,
  },  
} as const;

export const bulkPurchaseOrder = {
  purchaseOrder: {
    api: "purchaseOrder/import",
    method: "post",
    isFormData: false,
  },
} as const;

export const purchaseOrderMail = {
  sendToSupplier: {
    api: "purchaseOrder/send-to-supplier",
    method: "post",
    isFormData: false,
  },
  notifyManager: {
    api: "purchaseOrder/notify-manager",
    method: "post",
    isFormData: false,
  },
  notifyMD: {
    api: "purchaseOrder/notify-md",
    method: "post",
    isFormData: false,
  },
} as const;