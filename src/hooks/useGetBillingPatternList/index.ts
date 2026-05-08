import { useQuery } from "@tanstack/react-query";
import { getAllBillingPatternMaster } from "../../common/api/billingPattern";
import { useAuth } from "../../contexts/authContext";
import { getStorage } from "../../helpers/helpers";
import { EXIST_SESSION_STORAGE_NAMES } from "../../common/constant";

export const useGetBillingPatternList = () => {
  const { user, loading } = useAuth();

  const curentUser = getStorage(EXIST_SESSION_STORAGE_NAMES.CURRENT_USER_INFO);

  const enabled = !!user && !loading && !!curentUser;

  return useQuery({
    queryKey: ["billingPatternList"],
    enabled,
    queryFn: async () => {
      if (!user) {
        throw new Error("User not authenticated");
      }
      return getAllBillingPatternMaster();
    },

    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};
