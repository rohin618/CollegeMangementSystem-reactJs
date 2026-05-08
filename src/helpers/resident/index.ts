
// ------------------------------------------------------------
// residentBlockBed.ts (Fully Typed)
// ------------------------------------------------------------

import moment from "moment";
import { BLOCK_BEDS_TYPE, FUND_SOURCE_TYPE, NOTIFY_TYPE, PREBOOK_HISTORY_STATUS } from "../../common/constant";
import { generateUid, getActiveFundBlockBed,showAlert } from "../helpers";

// ---------------------- TYPES ----------------------
interface BlockBed {
    id: string;
    status: boolean;
    noOfBlockBed: number;
    perWeek: number;
}

interface BlockBedHistory {
    id: string;
    status: number;
    residentId: string;
    sDate: string;
    eDate: string;
}

interface FundingAuthority {
    id: string;
    name: string;
    blockBeds?: BlockBed[];
    blockBedHistory?: BlockBedHistory[];
    shortName?: string;
}

interface FundDetails {
    fundSource: number;
    nameOfLa?: number;
    nameIbc?: number;
    blockBedStatus: number;
    eDate: string;
    sDate: string;
}

interface ResidentData {
    roomId: string;
    bedId: string;
    fundDetails: any[];
    roomHistory: any[];
    admission?: {
        bookingType: number;
    };
    [key: string]: any;
}


// ---------------------- HELPERS ----------------------
export const buildblockBedHistoryEntry = (
    resident: any,
    activeBlockBed: any,
    blockBedHistoryId: string,
    activeFund: any
) => ({
    residentId: resident?.id,
    bedId: resident?.bedId,
    roomId: resident?.roomId,
    sDate: activeFund?.sDate || moment().format('YYYY-MM-DD'),
    eDate: '', // empty at creation time
    status: PREBOOK_HISTORY_STATUS.ACTIVE,
    blockBedId: activeBlockBed?.id,
    id: blockBedHistoryId,
});
export function getActiveBlockBedByFund(blockBeds: BlockBed[] = []) {
    return blockBeds.find((b: any) => b.status) || null;
}

export function getActiveFundDetailsByLAOrICB(
    activeFund: FundDetails,
    localAuthorityList: FundingAuthority[],
    localICBList: FundingAuthority[]
): FundingAuthority | undefined {
    const selectedId =
        +activeFund?.fundSource === FUND_SOURCE_TYPE.LOCAL_AUTHORITY
            ? activeFund?.nameOfLa
            : activeFund?.nameIbc;

    const sourceList =
        +activeFund?.fundSource === FUND_SOURCE_TYPE.LOCAL_AUTHORITY
            ? localAuthorityList
            : localICBList;
    return sourceList.find((i: any) => i.id === selectedId);
}

export function isBlockBedsValidation(
    activeFund: FundDetails,
    fundingAuthorityDetails: FundingAuthority,
    residentId: string | undefined
): boolean {
    const activeBlockBed = getActiveFundBlockBed(
        fundingAuthorityDetails?.blockBeds || [], activeFund?.eDate
    );

    if (+activeFund?.blockBedStatus !== BLOCK_BEDS_TYPE.YES) return true;


    if (!activeBlockBed) {
        showAlert({
            title: "No Active Block Bed Found",
            text: "This Local Authority / ICB has no active block beds. Please create and activate block beds for this authority.",
            icon: "warning"
        });
        return false;
    }

    const totalBlockBeds = +activeBlockBed.noOfBlockBed;

    const activeHistoryCount =
        fundingAuthorityDetails?.blockBedHistory?.filter(
            (h) => {
                if (residentId && h.residentId === residentId && h.status === PREBOOK_HISTORY_STATUS.ACTIVE) return false;
                return h.status === PREBOOK_HISTORY_STATUS.ACTIVE
            }
        ).length || 0;


    if (!totalBlockBeds || activeHistoryCount >= totalBlockBeds) {
        showAlert({
            title: "Block Bed Limit Exceeded",
            text: `The selected ${activeFund.fundSource === FUND_SOURCE_TYPE.LOCAL_AUTHORITY ? 'Local Authority ' : "ICB"} has reached its maximum block bed allocation. Cannot proceed.`,
            icon: "error"
        });


        return false;
    }

    return true;
}
export async function getUpdateBlockBedHistory(
    activeFund: FundDetails,
    blockBedHistoryId: string,
    fundingAuthorityDetails: FundingAuthority,
    newResident: any
) {
    if (!fundingAuthorityDetails) return;

    const activeBlockBed = getActiveFundBlockBed(
        fundingAuthorityDetails.blockBeds ?? [], activeFund?.eDate
    );

    if (!activeBlockBed) return;

    const historyList = fundingAuthorityDetails.blockBedHistory ?? [];

    const index = historyList.findIndex(
        (his) => his.id === blockBedHistoryId
    );


    /** ----------------------------
     *  CASE 1: UPDATE EXISTING HISTORY
     * ---------------------------- */
    if (index > -1) {
        const record = historyList[index];

        // Already inactive → skip update
        // if (+record.status === PREBOOK_HISTORY_STATUS.INACTIVE) return;

        const updatedRecord = {
            ...record,
            sDate: moment(activeFund?.sDate).format("YYYY-MM-DD"),
            eDate: moment(activeFund?.eDate).format("YYYY-MM-DD"),
            status: PREBOOK_HISTORY_STATUS.INACTIVE,
        };

        // Replace only that index (immutability-safe)
        const updatedHistory = [...historyList];
        updatedHistory[index] = updatedRecord;

        return {
            ...fundingAuthorityDetails,
            blockBedHistory: updatedHistory
        };
    }


    /** ----------------------------
     *  CASE 2: CREATE NEW HISTORY
     * ---------------------------- */
    const newHistory = buildblockBedHistoryEntry(
        newResident,
        activeBlockBed,
        blockBedHistoryId,
        activeFund
    );

    fundingAuthorityDetails.blockBedHistory = [
        ...historyList,
        newHistory,
    ];

    return {
        ...fundingAuthorityDetails,
        blockBedHistory: [...historyList, newHistory],
    };
}



export const validateBlockBedAdmission = ({
    admissionDate,
    blockStartDate,
    blockEndDate,
    blockBedStatus,
}: {
    admissionDate: string;
    blockStartDate?: string;
    blockEndDate?: string;
    blockBedStatus?: number;
}) => {
    if (!admissionDate || !blockBedStatus) return null;

    const formattedAdmission = moment(admissionDate).format("YYYY-MM-DD");

    // 🔴 Before Block Start
    if (
        blockBedStatus &&
        blockStartDate &&
        formattedAdmission < blockStartDate
    ) {
        return `Block Bed start date is ${blockStartDate}. Admission date cannot be earlier than the Block Bed start date.`;
    }

    // 🔴 After Block End
    if (
        blockBedStatus &&
        blockEndDate &&
        formattedAdmission > blockEndDate
    ) {
        return `Admission date must fall within the Block Bed period (${blockStartDate} to ${blockEndDate}).`;
    }

    return null;
};



export async function getUpdatedCurrentBlockBedHistory(
    activeFund: FundDetails,
    blockBedHistoryId: string,
    fundingAuthorityDetails: FundingAuthority,
    residentData?: any
) {
    if (!fundingAuthorityDetails) return;

    const activeBlockBed = getActiveFundBlockBed(
        fundingAuthorityDetails.blockBeds ?? [],
        activeFund?.eDate
    );

    if (!activeBlockBed) return;

    const historyList = fundingAuthorityDetails.blockBedHistory ?? [];

    const index = historyList.findIndex(
        (his) => his.id === blockBedHistoryId
    );

    /** ----------------------------
     *  ONLY UPDATE EXISTING HISTORY (START DATE ONLY)
     * ---------------------------- */
    if (index > -1) {
        const record = historyList[index];

        const updatedRecord = {
            ...record,
            sDate: activeFund?.sDate
                ? moment(activeFund.sDate).format("YYYY-MM-DD")
                : record.sDate, // fallback to old value
            bedId: residentData?.bedId,
            roomId: residentData?.roomId,
        };

        const updatedHistory = [...historyList];
        updatedHistory[index] = updatedRecord;

        return {
            ...fundingAuthorityDetails,
            blockBedHistory: updatedHistory,
        };
    }

    // ❌ Do NOT create new history
    return fundingAuthorityDetails;
}



const isDateOverlap = (
    start1: string,
    end1: string,
    start2: string,
    end2: string
) => {
    const s1 = moment(start1);
    const e1 = end1 ? moment(end1) : moment("9999-12-31");

    const s2 = moment(start2);
    const e2 = end2 ? moment(end2) : moment("9999-12-31");

    // ✅ overlap condition
    return s1.isSameOrBefore(e2) && s2.isSameOrBefore(e1);
};

export const validateJointFundingPrices = (formData: any): boolean => {
    const { fundDetails, roomPrice } = formData;

    for (const fund of fundDetails) {
        // ✅ Only JOINT FUNDING
        if (+fund.fundSource !== FUND_SOURCE_TYPE.JOINT_FUNDNG) continue;

        if (!fund.sDate) continue;

        for (const room of roomPrice) {
            if (!room.sDate) continue;

            const isOverlap = isDateOverlap(
                fund.sDate,
                fund.eDate,
                room.sDate,
                room.eDate
            );

            if (!isOverlap) continue;

            const roomPriceValue = Number(room.perWeek || 0);
            const laPrice = Number(fund.jfLaRoomPrice || 0);
            const icbPrice = Number(fund.jfIcbRoomPrice || 0);
            const totalPrice = Number(laPrice + icbPrice);

            // ❌ validation failed
            if (totalPrice !== roomPriceValue) {
                return false;
            }
        }
    }

    return true; // ✅ all valid
};

export function getActiveFundDetailsByJointFund(
    activeFund: FundDetails,
    localAuthorityList: FundingAuthority[],
    localICBList: FundingAuthority[]
) : {
    la?: FundingAuthority;
    icb?: FundingAuthority;
} {
    return {
        la: localAuthorityList?.find(
            (i: any) => i.id === activeFund?.nameOfLa
        ),
        icb: localICBList?.find(
            (i: any) => i.id === activeFund?.nameIbc
        ),
    };
}