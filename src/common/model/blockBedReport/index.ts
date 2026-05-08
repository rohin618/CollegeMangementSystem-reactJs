import { serverTimestamp } from 'firebase/firestore';
import { FUND_SOURCE_TYPE } from '../../constant';
import { BLOCK_BEDS_STATUS } from '../../constant/app';

export const BlockBedReportModel = {
    companyId: '',            // linked company
    authorityId: '',          // LA / CHC id
    authorityName: '',
    authorityType: FUND_SOURCE_TYPE.LOCAL_AUTHORITY,

    date: '',                 // YYYY-MM-DD (report date)

    blockBedId: '',
    totalBlockBeds: 0,
    usedBlockBeds: 0,
    remainingBlockBeds: 0,
    perWeek: 0,

    created: {
        date: serverTimestamp(),
        user: '',             // uid of creator
    },

    updated: [],              // { date, user }[]
};