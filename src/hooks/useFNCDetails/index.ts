

import { useQuery } from '@tanstack/react-query';
import { getAllFNMByCompany } from '../../common/api/fnm';
import { getUserMappedCompanyId } from '../../helpers/helpers';
import { useAuth } from '../../contexts/authContext';

export const useFNCDetails = () => {
  const { user, loading } = useAuth();
  const isEnabled = !!user && !loading; // 🔥 KEY LINE
  const resolvedCompanyId = getUserMappedCompanyId()?.companyId;

  return useQuery({
    queryKey: ['fncDetails', resolvedCompanyId],
    queryFn: () => getAllFNMByCompany(resolvedCompanyId), // ✅ pass a function
    enabled: !!resolvedCompanyId && isEnabled, // ✅ only run if companyId is available
    staleTime: 5 * 60 * 1000, // ✅ keep cache fresh for 5 min
    retry: 1, // ✅ retry once if failed
  });
};
