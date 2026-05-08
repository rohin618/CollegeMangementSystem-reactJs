import { useQuery } from "@tanstack/react-query";
import { getAllLocalAuthorityByCompanyId } from "../../common/api/localAuthority";
import { getUserMappedCompanyId } from "../../helpers/helpers";
import { useAuth } from "../../contexts/authContext";
import { useMemo } from "react";

export const useLocalAuthorityList = () => {
  const { user, loading } = useAuth();

  // ✅ Resolve companyId safely
  const resolvedCompanyId: string = getUserMappedCompanyId()?.companyId

  const enabled =
    !!user &&
    !loading &&
    !!resolvedCompanyId;

  return useQuery({
    queryKey: ["localAuthorityList"],
    enabled,

    queryFn: async () => {
      if (!user || !resolvedCompanyId) {
        throw new Error("Unauthorized or missing companyId");
      }
      return getAllLocalAuthorityByCompanyId();
    },

    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};
