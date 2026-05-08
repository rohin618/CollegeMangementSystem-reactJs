import { useQuery } from "@tanstack/react-query";
import { getAllDueDateMaster } from "../../common/api/dueDate";
import { useAuth } from "../../contexts/authContext";

import { EXIST_SESSION_STORAGE_NAMES } from "../../common/constant";
import { getStorage } from "../../helpers/helpers";

export const useDueDateList = () => {
  const { user, loading } = useAuth();
 const curentUser = getStorage(EXIST_SESSION_STORAGE_NAMES.CURRENT_USER_INFO);
  const enabled = !!user && !loading && !!curentUser;

  return useQuery({
    queryKey: ["dueDateList"],
    enabled,

    queryFn: async () => {
      if (!user) {
        throw new Error("User not authenticated");
      }
      return getAllDueDateMaster();
    },

    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};
