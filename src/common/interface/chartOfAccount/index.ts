export interface IChartOfAccount {
  id?: string;                     // Firestore auto ID
  companyId: string;               // Multi-tenancy
  categoryType: number | undefined;            // CHART_OF_ACCOUNTS_CATEGORY_TYPE
  code: string;                    // Dynamic: AC1001, AC1002...
  accountName: string;             // Name of the account
  description?: string;            // Optional description

  status: number;                  // CHART_OF_ACCOUNTS_STATUS

  created: {
    date: any;                     // serverTimestamp()
    user: string;
  };

  updated: {
    date: any;
    user: string;
  }[];                             // History log
}
