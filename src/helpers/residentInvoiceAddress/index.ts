// ----------------------
// Helpers + Types
// ----------------------

import {
  INVOICE_TO_TYPE,
  LPA_TYPE,
  NOK_INVOICE_REQUIRED
} from "../../common/constant";

// ----------------------
// Type Interfaces
// ----------------------

export interface MasterItem {
  id: string;
  [key: string]: any;
}

export interface NOKItem {
  lpa?: string | number;
  invoiceRequired?: string | number;
  [key: string]: any;
}

export interface ResidentBilling {
  [key: string]: any;
}

export interface ResidentDetails {
  nok?: NOKItem[];
  billing?: ResidentBilling;
  [key: string]: any;
}

export interface MasterDataBundle {
  localAuthorityList: MasterItem[];
  localICBList: MasterItem[];
  fNCDetails?: Record<string, any> | null;
}

export interface InvoiceAddressResult {
  activity?: string;
  shortName?: string;
  [key: string]: any;
}

// ----------------------
// Helper Functions
// ----------------------

export const getShortName = (creditTo: number): string => {
  switch (creditTo) {
    case INVOICE_TO_TYPE.PRIVATE:
      return "PVT";
    case INVOICE_TO_TYPE.FAMILY_TOPUP:
      return "FTU";
    case INVOICE_TO_TYPE.THIRD_PARTY_TOPUP:
      return "TPT";
    case INVOICE_TO_TYPE.CLIENT_CONTRIBUTION:
      return "CC";
    case INVOICE_TO_TYPE.FNC:
      return "FNC";
    case INVOICE_TO_TYPE.INCONT:
      return "INC";
    case INVOICE_TO_TYPE.LA:
      return "LA";
    default:
      return "";
  }
};

const getAuthorityAddress = (
  list: MasterItem[],
  fundTypeId: string,
  activity: string
): InvoiceAddressResult => {
  const result = list.find((item) => item.id === fundTypeId);
  return result ? { ...result, activity } : {};
};

// ----------------------
// Main Function
// ----------------------

export const getResidentInvoiceAddress = (
  residentDetails: ResidentDetails | null | undefined,
  invoiceTo: number | string,
  fundTypeId: string,
  masters: MasterDataBundle
): InvoiceAddressResult => {
  const { localAuthorityList, localICBList, fNCDetails } = masters;

  // if (!residentDetails )  return {};


  const creditTo = Number(invoiceTo);
  const shortName = getShortName(creditTo);


  switch (creditTo) {
    case INVOICE_TO_TYPE.LA:
      // case INVOICE_TO_TYPE.THIRD_PARTY_TOPUP:
      // case INVOICE_TO_TYPE.THIRD_PARTY_TOPUP:
      return getAuthorityAddress(localAuthorityList, fundTypeId, "Local Authority");

    case INVOICE_TO_TYPE.THIRD_PARTY_TOPUP:
      return { ...getAuthorityAddress(localAuthorityList, fundTypeId, "Local Authority"), shortName }

    case INVOICE_TO_TYPE.CHC:
      return getAuthorityAddress(localICBList, fundTypeId, "CHC");

    case INVOICE_TO_TYPE.PRIVATE:
    case INVOICE_TO_TYPE.FAMILY_TOPUP:
    case INVOICE_TO_TYPE.CLIENT_CONTRIBUTION: {

      const nokList = residentDetails?.nok ?? [];

      let mainRecipient = null;
      const ccEmails = [];

      for (const n of nokList) {
        // 🔥 Priority 1 → LPA
        if (!mainRecipient && n.lpa === LPA_TYPE.YES) {
          mainRecipient = n;
          continue;
        }

        // 🔥 Priority 2 → Invoice Required (only if LPA not found)
        if (!mainRecipient && n.invoiceRequired === NOK_INVOICE_REQUIRED.YES) {
          mainRecipient = n;
          continue;
        }

        if (n?.email) {
          ccEmails.push(n?.email);
        }

      }

      if (mainRecipient) {
        return {
          ...mainRecipient,
          ccEmails,
          activity: "Private",
          shortName
        };
      }

      // 🔥 Fallback → Billing
      const billing = residentDetails?.billing;
      return billing
        ? { ...billing, activity: "Private", shortName }
        : {};
    }

    case INVOICE_TO_TYPE.FNC:
      return fNCDetails
        ? { ...fNCDetails, activity: "FNC", shortName }
        : {};
    case INVOICE_TO_TYPE.INCONT:
      return fNCDetails
        ? { ...fNCDetails, activity: "FNC", shortName }
        : {};

    default:
      return {};
  }
};
