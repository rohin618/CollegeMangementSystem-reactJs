import { useMemo } from "react";
import {
  INVOICE_TO_TYPE,
  NOK_INVOICE_REQUIRED,
  LPA_TYPE
} from "../../common/constant";
import { FncDetails, IcbItem, LaItem, useMasterData } from "../../contexts/mastersContext";
import { getResidentInvoiceAddress } from "../../helpers/residentInvoiceAddress";

export interface ListItem {
  id: string;
  [key: string]: any;
}

export interface NOKItem {
  lpa?: string | number;
  invoiceRequired?: string | number;
  [key: string]: any;
}

export interface ResidentData {
  nok?: NOKItem[];
  billing?: Record<string, any>;
}

export interface InvoiceAddressResult {
  activity?: string;
  shortName?: string;
  [key: string]: any;
}





// ----------------------
// Hook
// ----------------------
export const useResidentInvoiceAddress = (
  residentDetails: ResidentData | null | undefined,
  invoiceTo: number,
  fundTypeId: string,
): InvoiceAddressResult => {
  const {
    localAuthorityList = [],
    localICBList = [],
    fNCDetails
  } = useMasterData();

  return useMemo(() => {
    // if (!residentDetails) return {};
    return getResidentInvoiceAddress(residentDetails, invoiceTo, fundTypeId, {
      localAuthorityList,
      localICBList,
      fNCDetails
    });

  }, [
    residentDetails,
    invoiceTo,
    fundTypeId,
    localAuthorityList,
    localICBList,
    fNCDetails
  ]);
};


