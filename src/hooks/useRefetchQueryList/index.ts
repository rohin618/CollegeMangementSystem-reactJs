// useRefetchQueryList.ts
import { useEffect, useCallback } from 'react';
import { useQueryClient, QueryKey } from '@tanstack/react-query';

export function useRefetchQueryList<T>(queryKey: QueryKey) {
  const queryClient = useQueryClient();

  // 🔁 Auto refetch when queryKey changes
  // useEffect(() => {
  //   if (!queryKey) return;

  //   queryClient.invalidateQueries({ queryKey });
  // }, [queryClient, queryKey]);

  // 🔄 Soft refetch (mark stale)
  const refetch = useCallback(() => {
    return queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  // 🔥 Hard refetch (immediate API call)
  const forceRefetch = useCallback(() => {
    return queryClient.refetchQueries({ queryKey });
  }, [queryClient, queryKey]);

  return {
    refetch,
    forceRefetch,
  };
}
