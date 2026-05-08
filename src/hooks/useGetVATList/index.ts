import { useQuery } from "@tanstack/react-query";
import { getAllVATMaster } from "../../common/api/vat";
import { useAuth } from "../../contexts/authContext";
import { getStorage } from "../../helpers/helpers";
import { EXIST_SESSION_STORAGE_NAMES } from "../../common/constant";

export const useGetVATList = () => {
  const { user, loading } = useAuth();

  const curentUser = getStorage(EXIST_SESSION_STORAGE_NAMES.CURRENT_USER_INFO);
  const enabled = !!user && !loading && !!curentUser;

  return useQuery({
    queryKey: ["vatList"],
    enabled,

    queryFn: async () => {
      if (!user) {
        throw new Error("User not authenticated");
      }
      return getAllVATMaster();
    },

    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};
