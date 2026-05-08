import React, { useMemo, useState } from 'react';
import { getAllByCompanyIdCreditWallet } from '../../../common/api/creditWalet';
import { useQuery } from '@tanstack/react-query';
import { ResidentCreditNotes, CreditNotesForm } from './components';
import {
	Page,
	PageWrapper,
	SubHeader,
	SubHeaderLeft,
	SubHeaderRight,
	SubheaderSeparator,
} from '../../../layout';
import { useSearch } from '../../../hooks';
import Icon from '../../../components/icon';
import { Button, Input, Popovers } from '../../../components/bootstrap';
import { CREDIT_TYPE } from '../../../common/constant';

const CreditNotePage = () => {
	const [isFilterOpen, setFilterOpen] = useState<boolean>(false);
	const [filterDataSise, setFilterDataSize] = useState(0);
	const [isOpenAddCreditModel, setIsOpenAddCreditModel] = useState(false);
	const req = {
		isGroupByResident: false,
	};

	const {
		data: creditWalletList = [],
		isLoading,
		isError,
		refetch,
	} = useQuery({
		queryKey: ['creditNotesListByCompanyId'],
		queryFn: () => getAllByCompanyIdCreditWallet(req),
		      // enabled: Boolean(id),
        staleTime: 5 * 60 * 1000, // cache fresh for 5 minutes
        retry: 1, // retry once on failure
	});

	const filteredCreditList = useMemo(() => {
		return creditWalletList.filter(
			(credit: any) => +credit.type !== CREDIT_TYPE.ADVANCE_CREDIT,
		);
	}, [creditWalletList]);

	const {
		searchValue,
		setSearchValue,
		filteredList: creditWalletListFilteredData,
	} = useSearch(filteredCreditList as any[], ['residentData.personal.name']);




	const handleOpenCreateCreditModal = () => {
		setIsOpenAddCreditModel(prev => !prev);

	}

	return (
		<PageWrapper>
			<SubHeader>
				<SubHeaderLeft>
					<label
						className='border-0 bg-transparent cursor-pointer me-0'
						htmlFor='searchInput'>
						<Icon icon='Search' size='2x' color='primary' />
					</label>
					<Input
						id='searchInput'
						type='search'
						className='border-0 shadow-none bg-transparent'
						placeholder='Search Resident by name...'
						onChange={(e: any) => setSearchValue(e.target.value)}
						value={searchValue}
					/>
					{/* <SubheaderSeparator /> */}
					<SubheaderSeparator />
				</SubHeaderLeft>
				<SubHeaderRight>
					<Button
						icon='FilterAlt'
						color='dark'
						isLight
						className='btn-only-icon position-relative'
						aria-label='Filter'
						onClick={() => setFilterOpen(!isFilterOpen)}>
						{filteredCreditList?.length !== filterDataSise && (
							<Popovers desc='Filtering applied' trigger='hover'>
								<span className='position-absolute top-0 start-100 translate-middle badge border border-light rounded-circle bg-danger p-2'>
									<span className='visually-hidden'>there is filtering</span>
								</span>
							</Popovers>
						)}
					</Button>
					<Button
						color='info'
						isLight
						// onClick={() => navigate('/rooms/create')}
						onClick={handleOpenCreateCreditModal}
						icon='AddCircle'
					>
						Add Credit Notes
					</Button>


				</SubHeaderRight>
			</SubHeader>
			<Page container='fluid'>
				<div>
					<ResidentCreditNotes
						creditWalletList={creditWalletListFilteredData}
						isFilterOpen={isFilterOpen}
						setFilterDataSize={setFilterDataSize}
						isLoading={isLoading}
					/>
					<CreditNotesForm isOpen={isOpenAddCreditModel}  toggle={()=>setIsOpenAddCreditModel(false)}/>
				</div>
			</Page>
		</PageWrapper>
	);
};

export default CreditNotePage;
