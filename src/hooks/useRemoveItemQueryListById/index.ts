import { useQueryClient } from '@tanstack/react-query';

type UseRemoveFromListProps<T> = {
  queryKey: any[];
};

export function useRemoveItemQueryListById<T>({ queryKey }: UseRemoveFromListProps<T>) {
  const queryClient = useQueryClient();

const removeItemById = (id: number | string, key: string = 'id') => {
  queryClient.setQueryData(queryKey, (oldData: T[] | undefined) => {
    if (!oldData) return [];
    return oldData.filter((item: any) => item[key] !== id);
  });
};

  const clearList = () => {
    queryClient.setQueryData(queryKey, []);
  };

  return { removeItemById, clearList };
}
