export interface IFollowUpBase {
    id?:string;
  followUpTo: string | number;
  followUpToId: string;

  followUpType: string | number;
  parentFollowUpId: string | null;

  notes: string;
  followUpDate: string;

  priority: string | number;
  status: string | number;
  requiresReview: boolean;

  created: {
    date: any;          // Firestore serverTimestamp()
    userId: string;
  };

  updated: any[];       // can be typed better if you want
  completedAt: any | null;
}
