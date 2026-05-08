// hooks/useInvoiceList.ts
import { useQuery } from '@tanstack/react-query';
import { getAllByResidentIdInvoices } from '../../common/api/invoice';

export const useInvoiceListByResident = (residentId: string) => {
    return useQuery<any[]>({
        queryKey: ['invoiceList', residentId],
        queryFn: () => getAllByResidentIdInvoices(residentId!),
        enabled: !!residentId,
        staleTime: 1000 * 60 * 5, // cache valid for 5 mins
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });
};
