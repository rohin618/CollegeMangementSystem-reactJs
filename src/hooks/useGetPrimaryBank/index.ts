import { useQuery } from '@tanstack/react-query';
import { getAllBankDetailsByCompanyId } from '../../common/api/bank';
import { PRIMARY_ACCOUNT } from '../../common/constant';

export const useGetPrimaryBank = (companyId: string) => {
  return useQuery({
    queryKey: ['primaryBankDetail'],
    queryFn: async () => {
      const bankList = await getAllBankDetailsByCompanyId(companyId);
      const list = Array.isArray(bankList) ? bankList : [];
      return list.find((bank: any) => +bank.primaryAccount === PRIMARY_ACCOUNT.YES) || null;
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
    enabled: !!companyId, // only run if companyId exists
  });
};

