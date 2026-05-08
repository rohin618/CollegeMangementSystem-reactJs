import { useMemo, useState } from 'react';
import {
	SubHeader,
	SubHeaderLeft,
	SubheaderSeparator,
	PageWrapper,
	SubHeaderRight,
} from '../../../layout';
import Page from '../../../layout/Page';
import { CompanyList } from './component';
import { Button, Input } from '../../../components/bootstrap';
import { useQuery } from '@tanstack/react-query';
import { getAllCompany } from '../../../common/api/company';
import { useGetCurrentUser, useMultiSearch, useSearch } from '../../../hooks';
import { CompanyForm } from './component';
import { USER_TYPE } from '../../../common/constant';
import Icon from '../../../components/icon';

const CompanyPage = () => {
	const [companyEditObject, setCompanyEditObject] = useState<any>(null);
	const [isOpenCompanyForm, setIsOpenCompanyForm] = useState(false);
	const [lastLargeNumer, setLastLargeNumber] = useState(0);
	const currentUser = useGetCurrentUser();

	const {
		data: companyList = [],
		isLoading,
		isError,
		error,
	}: any = useQuery({
		queryKey: ['companyList'],
		queryFn: () => getAllCompany(),
	});

	const companyListModified = useMemo(() => {
		return companyList?.filter((company: any) => {
			// ADMIN → all companies
			if (+currentUser?.userType === USER_TYPE.SUPER_ADMIN) return true;

			// NON-ADMIN → only mapped companies
			return currentUser?.companyIds?.includes(company.id);
		});
	}, [companyList]);

	const {
		searchValue,
		setSearchValue,
		filteredList: filteredCompanyList,
	} = useSearch(companyListModified || [], ['code', 'name']);


	const handleOpenCompanyEditForm = (data: any) => {
		setCompanyEditObject(data);
		setIsOpenCompanyForm(true);
	};

	const handleCloseCompanyForm = () => {
		setIsOpenCompanyForm(false);
		setCompanyEditObject(null);
	};

	const handleOpenModelCreateCompany = () => {
		if (companyList && companyList.length > 0) {
			const maxRoom: number = Math.max(...companyList.map((r: any) => r.code));
			setLastLargeNumber(maxRoom + 1);
		} else {
			setLastLargeNumber(1001);
		}
		setIsOpenCompanyForm(true);
	};

	const isAdmin = +currentUser?.userType === USER_TYPE.SUPER_ADMIN;

	return (
		<PageWrapper title='Company'>
			<SubHeader>
				<SubHeaderLeft>
					<label
						className='border-0 bg-transparent cursor-pointer me-0'
						htmlFor='residentName'>
						<Icon icon='Search' size='2x' color='primary' />
					</label>
					<Input
						id='residentName'
						type='search'
						className='border-0 shadow-none bg-transparent'
						placeholder='Search Company by name,code...'
						onChange={(e: any) => setSearchValue(e.target.value)}
						value={searchValue}
					/>
					<SubheaderSeparator />
				</SubHeaderLeft>
				<SubHeaderRight>
					{isAdmin && (
						<Button
							color='info'
							isLight
							icon='AddCircle'
							onClick={handleOpenModelCreateCompany}>
							Add New
						</Button>
					)}
				</SubHeaderRight>
			</SubHeader>

			<Page container='fluid'>
				{isLoading && <p>Loading companies...</p>}
				{isError && <p className='text-danger'>Error: {String(error)}</p>}

				<CompanyList
					companyList={filteredCompanyList}
					onEdit={handleOpenCompanyEditForm}
					isLoading={isLoading}
				/>

				<CompanyForm
					companyList={companyList}
					companyEditObject={companyEditObject}
					isOpen={isOpenCompanyForm}
					toggle={handleCloseCompanyForm}
					lastLargeNumer={lastLargeNumer}
				/>
			</Page>
		</PageWrapper>
	);
};

export default CompanyPage;
