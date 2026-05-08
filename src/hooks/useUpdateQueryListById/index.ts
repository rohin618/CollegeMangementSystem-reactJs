import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

type UpdateOptions = {
  mode?: "prepend" | "append"; // where to insert new items
};

export const useUpdateQueryListById = <T extends { id: string }>(
  queryKey: (string | number | any | undefined)[],
  options?: UpdateOptions
) => {

  const queryClient = useQueryClient();

  const updateList = useCallback(
    (data: T) => {
      // remove undefined from key to avoid invalid query key
      const safeKey = queryKey.filter(Boolean);

      queryClient.setQueryData<T[]>(safeKey, (oldData: T[] = []) => {
        const index = oldData.findIndex((item) => item.id === data.id);

        if (!data?.id) return oldData;

        if (index > -1) {

          // replace existing
          return oldData.map((item) => (item.id === data.id ? data : item));
        } else {
          // add new
          return options?.mode === "append"
            ? [...oldData, data]
            : [data, ...oldData];
        }
      });
    },
    [queryClient, queryKey, options?.mode]
  );

  return updateList;
};

