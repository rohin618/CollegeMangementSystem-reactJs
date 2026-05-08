import { useQuery } from "@tanstack/react-query";
import { getAllICBByCompanyId } from "../../common/api/ibc";
import { getUserMappedCompanyId } from "../../helpers/helpers";
import { useAuth } from "../../contexts/authContext";
import { useMemo } from "react";

export const useLocalICBList = () => {
  const { user, loading } = useAuth();

  // ✅ Resolve companyId safely
  const resolvedCompanyId: string = getUserMappedCompanyId()?.companyId

  const enabled =
    !!user &&
    !loading &&
    !!resolvedCompanyId;

  return useQuery({
    queryKey: ["localICBList"],
    enabled,

    queryFn: async () => {
      if (!user || !resolvedCompanyId) {
        throw new Error("Unauthorized or missing companyId");
      }
      return getAllICBByCompanyId();
    },

    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};
