import { useMemo } from 'react';

export const useMapById = <T extends { id: string }>(
	list: T[]
): Record<string, T> => {
	return useMemo(() => {
		return list?.reduce((acc, curr) => {
			if (curr?.id) acc[curr.id] = curr;
			return acc;
		}, {} as Record<string, T>);
	}, [list]);
};