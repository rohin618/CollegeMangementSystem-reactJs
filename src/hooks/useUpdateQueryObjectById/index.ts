import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

export const useUpdateQueryObjectById = <T extends { id?: string | number }>(
  queryKey: (string | number | undefined)[]
) => {
  const queryClient = useQueryClient();

  const updateObject = useCallback(
    (updatedData: Partial<T>) => {
      if (!updatedData?.id) return;

      const safeKey = queryKey.filter(Boolean);

      queryClient.setQueryData<T | undefined>(safeKey, (oldData) => {
        if (!oldData) return updatedData as T;
        // 🔄 Merge old + updated
        return {
          ...oldData,
          ...updatedData,
        } as T;
      });
    },
    [queryClient, queryKey]
  );

  return updateObject;
};
