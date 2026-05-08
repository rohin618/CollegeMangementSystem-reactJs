import { useQuery } from "@tanstack/react-query"
import { getAllRoomsWithBeds } from "../../common/api/room"

export const useGetAllRoomsWithBeds = () => {
  return useQuery({
    queryKey: ['allRoomsWithBeds'],  
    queryFn: async () => getAllRoomsWithBeds(),
    staleTime: 5 * 60 * 1000, 
    retry: 1, 
  });
}           