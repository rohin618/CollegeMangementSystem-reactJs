// hooks/useDeleteQueryListById.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";

type DeleteFn<TId> = (id: TId) => Promise<any>;

export const useDeleteQueryListById = <
  TItem extends Record<string, any>,
  TId = string
>(
  queryKey: (string | number | undefined)[],
  deleteFn: DeleteFn<TId>,
  idKey: keyof TItem = "id" as keyof TItem
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: TId) => deleteFn(itemId),
    onSuccess: (_, itemId) => {
      queryClient.setQueryData<TItem[]>(queryKey, (oldList = []) =>{

        return  oldList.filter((item) => String(item[idKey]) !== String(itemId))
      }
     
      );
    },
  });
};
