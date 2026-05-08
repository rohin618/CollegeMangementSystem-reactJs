import { useQuery } from "@tanstack/react-query";
import { QUERY_KEY } from "../../common/constant";
import { getUserMappedCompanyId } from "../../helpers/helpers";
import { getHeadOfficeAddress } from "../../common/api/headOfficeAddress";

export const useGetHeadOfficeAddress = () => {
  const resolvedCompanyId = getUserMappedCompanyId()?.companyId || '';

  return useQuery({
    queryKey: [QUERY_KEY.HEAD_OFFICE_ADDRESS],
    queryFn: () => getHeadOfficeAddress(), // ✅ pass a function
    enabled: !!resolvedCompanyId, // ✅ only run if companyId is available
    staleTime: 5 * 60 * 1000, // ✅ keep cache fresh for 5 min
    retry: 1, // ✅ retry once if failed
  });
};