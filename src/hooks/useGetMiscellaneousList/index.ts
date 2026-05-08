import { useQuery } from "@tanstack/react-query";
import { getAllMiscellaneousMaster } from "../../common/api/miscellaneous";
import { useAuth } from "../../contexts/authContext";
import { getStorage } from "../../helpers/helpers";
import { EXIST_SESSION_STORAGE_NAMES } from "../../common/constant";

export const useGetMiscellaneousList = () => {
  const { user, loading } = useAuth();

  const curentUser = getStorage(EXIST_SESSION_STORAGE_NAMES.CURRENT_USER_INFO);
  const enabled = !!user && !loading && !!curentUser;

  return useQuery({
    queryKey: ["miscellaneousList"],
    enabled,

    queryFn: async () => {
      if (!user) {
        throw new Error("User not authenticated");
      }
      return getAllMiscellaneousMaster();
    },

    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};
