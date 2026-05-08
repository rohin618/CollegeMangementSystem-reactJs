import { useQuery } from '@tanstack/react-query';
import { getAllCompany } from '../../common/api/company'; 

export const useGetAllCompanyList = () => {
  return useQuery({
    queryKey: ['companyList'],
    queryFn: async () => {
      const res = await getAllCompany();
      // make sure we return the array
      return res ?? [];
    },
    staleTime: 5 * 60 * 1000, // keep cache fresh for 5 minutes
    retry: 1, 
  });
};
