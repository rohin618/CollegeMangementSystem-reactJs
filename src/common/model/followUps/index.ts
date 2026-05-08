import { serverTimestamp } from "firebase/firestore";
import { FOLLOW_UP_PRIORITY, FOLLOW_UP_STATUS } from "../../constant";
import { FOLLOW_UP_TO_TYPE, FOLLOW_UP_TYPE } from "../../constant/app";

export const FOLLOW_UP_BASE = {
  followUpTo: FOLLOW_UP_TO_TYPE.RESIDENT,
  followUpToId: "", //link ID

  followUpType: FOLLOW_UP_TYPE.PARENT,
  parentFollowUpId: null, // ✅ correct

  notes: "",
  followUpDate: "",

  priority: FOLLOW_UP_PRIORITY.LOW,
  status: FOLLOW_UP_STATUS.PENDING,
  requiresReview: true,

  created: {
    date: serverTimestamp(),
    userId: "",
  },

  updated: [],
  completedAt: null, // ✅ correct
};
