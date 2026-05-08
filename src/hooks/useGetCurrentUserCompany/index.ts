import { useState, useEffect } from 'react';
import { getUserMappedCompanyId } from '../../helpers/helpers';
import { useGetCurrentUser } from '../useGetCurrentUser';
import { getAllCompany } from '../../common/api/company';
import { useQuery } from '@tanstack/react-query';

export const useGetCurrentUserCompanyDetails = () => {
	const [matchedCompany, setMatchedCompany] = useState<any>(null);
	const currentUser = useGetCurrentUser();

	// Get company ID mapped to current user
	const resolvedCompanyId = getUserMappedCompanyId()?.companyId;

	// Fetch all companies of current user
	const { data: companyList = [] } = useQuery({
		queryKey: ['companyList', { ids: currentUser?.companyIds }],
		queryFn: () => getAllCompany({ companyIds: currentUser?.companyIds }),
		enabled: currentUser?.companyIds?.length > 0,
	});

	useEffect(() => {
		if (companyList?.length && resolvedCompanyId) {
			const company = companyList.find(
				(company: any) => company.id === resolvedCompanyId,
			);
			setMatchedCompany(company || null);
		}
	}, [companyList, resolvedCompanyId]);

	return matchedCompany;
};
