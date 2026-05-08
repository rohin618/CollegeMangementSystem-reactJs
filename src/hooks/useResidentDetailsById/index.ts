import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getResidentById } from "../../common/api/resident";

export const useResidentDetailsById = (residentId: string) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["residentDetails", residentId],
    queryFn: () => getResidentById(residentId),
    enabled: !!residentId, // run only if residentId exists
    staleTime: 5 * 60 * 1000, // 5 min
  });
};


