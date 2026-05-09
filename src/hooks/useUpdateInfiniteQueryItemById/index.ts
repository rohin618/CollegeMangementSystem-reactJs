import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

export const useUpdateInfiniteQueryItemById = <
	T extends { id: string | number }
>(
	queryKey: any[],
) => {
	const queryClient = useQueryClient();

	const updateItem = useCallback(
		(updatedItem: T) => {
			queryClient.setQueryData(queryKey, (oldData: any) => {
				if (!oldData?.pages) return oldData;

				return {
					...oldData,
					pages: oldData.pages.map((page: any) => ({
						...page,
						content: page.content.map((item: T) =>
							item.id === updatedItem.id ? updatedItem : item,
						),
					})),
				};
			});
		},
		[queryClient, queryKey],
	);

	return updateItem;
};