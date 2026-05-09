import { useQueryClient } from '@tanstack/react-query';

export const useRemoveInfiniteQueryItemById = (
	queryKey: any[],
) => {
	const queryClient = useQueryClient();

	const removeItemById = (
		id: number | string,
		key: string = 'id',
	) => {
		queryClient.setQueryData(queryKey, (oldData: any) => {
			if (!oldData?.pages) return oldData;

			return {
				...oldData,
				pages: oldData.pages.map((page: any) => ({
					...page,
					content: page.content.filter(
						(item: any) => item[key] !== id,
					),
				})),
			};
		});
	};

	return { removeItemById };
};