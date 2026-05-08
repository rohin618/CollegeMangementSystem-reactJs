import React, { createContext, useContext, ReactNode } from "react";
import {
    useBankDetails,
    useFNCDetails,
    useGetMiscellaneousList,
    useGetVATList,
    useLocalAuthorityList,
    useLocalICBList
} from "../hooks";
import { useGetBillingPatternList } from "../hooks/useGetBillingPatternList";
import { useDueDateList } from "../hooks/useDueDate";

// 🧾 Define interfaces for each master data type
export interface LaItem {
    id: string;
    name: string;
    region: string;
    code: string;
    contact?: string;
}

export interface IcbItem {
    id: string;
    name: string;
    code: string;
    address?: string;
    phone?: string;
    email?: string;
}

export interface BankItem {
    id: string;
    name: string;
    ifsc: string;
    branch?: string;
    accountNumber?: string;
    swiftCode?: string;
}

export interface FormulaItem {
    id: string;
    name: string;
    expression: string;
    description?: string;
    variables?: string[];
}

export interface FncDetails {
    id: string;
    currency: string;
    taxRate: number;
    serviceChargeRate: number;
    rounding: string;
    billingCycle: string;
    invoicePrefix: string;
    paymentTerms: string;
    createdAt: string;
}

// 🧩 Context Data Type (Updated)
export interface MasterDataType {
    localAuthorityList: LaItem[];
    localICBList: IcbItem[];
    bankList: BankItem[];
    vatList: any[];
    formulaList: FormulaItem[];
    miscellaneousList: any[];
    dueDateList: any[];
    billingPatternList: any[];
    isLoading: boolean;
    isError: boolean;
    fNCDetails: FncDetails | null;
}

// 🧩 Context default value
const MasterDataContext = createContext<MasterDataType | null>({} as MasterDataType);

interface Props {
    children: ReactNode;
}

export const MasterDataProvider: React.FC<Props> = ({ children }) => {


    const value: any = {
    
    };

    return <MasterDataContext.Provider value={value}>{children}</MasterDataContext.Provider>;
};

// 🧩 Custom Hook for easy access
export const useMasterData = (): MasterDataType => {
    const context = useContext(MasterDataContext);
    if (!context) {
        throw new Error("useMasterData must be used inside MasterDataProvider");
    }
    return context || {};
};
