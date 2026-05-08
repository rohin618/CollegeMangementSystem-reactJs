import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { getAllBankDetailsByCompanyId } from "../../common/api/bank";
import { getUserMappedCompanyId } from "../../helpers/helpers";
import { useAuth } from "../../contexts/authContext";

export const useBankDetails = (companyId?: string) => {
  const { user, loading } = useAuth();


  const resolvedCompanyId: string = companyId || getUserMappedCompanyId()?.companyId || null;

  // ✅ Single source of truth
  const enabled =
    !!user &&
    !loading &&
    !!resolvedCompanyId;

  return useQuery({
    queryKey: ["bankDetails"],
    enabled,

    queryFn: async () => {
      if (!user || !resolvedCompanyId) {
        throw new Error("Unauthorized or missing companyId");
      }
      return getAllBankDetailsByCompanyId(resolvedCompanyId);
    },

    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};
