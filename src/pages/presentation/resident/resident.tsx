import {
	PageWrapper,
	SubHeader,
	SubHeaderLeft,
	SubheaderSeparator,
	SubHeaderRight,
	Page,
} from '../../../layout';
import { useQuery } from '@tanstack/react-query';
import Icon from '../../../components/icon';
import {
	Popovers,
	Button,
	Input,
	Dropdown,
	DropdownToggle,
	DropdownMenu,
	DropdownItem,
} from '../../../components/bootstrap';

import { ResidentList } from './component';
import { getAllResidentWithInvoice, updateRoomHistoryEDate } from '../../../common/api/resident';
import { useMultiSearch } from '../../../hooks';
import { useMasterData } from '../../../contexts/mastersContext';

import { useEffect, useMemo, useState } from 'react';
import {
	getActiveFundDetails,
	getActiveFundList,
	getActiveResidentRoomPriceDetails,
	getColorByValue,
	getResidetByAllAvilableFundList,
	resolvePaymentStatus,
	showAlert,
} from '../../../helpers/helpers';
import { ILaAndICBModel, IResidentModel } from '../../../common/interface';
import moment from 'moment';
import Swal from 'sweetalert2';
import { DateRangePickerPopover } from '../../../components/common';
import { downloadResidentListAsExcel, downloadResidentListAsPDF } from '../../../helpers';
import { getColorNameWithIndex } from '../../../common/data/enumColors';
import { FUND_SOURCE_LIST, } from '../../../common/data/option';
import { FUND_SOURCE_TYPE, INVOICE_STATUS, INVOICE_TO_TYPE } from '../../../common/constant';
import { useGetAllRoomsWithBeds } from '../../../hooks/useGetAllRoomsWithBed';
import { useSearchParams } from 'react-router-dom';
const ResidentPage = () => {
	const [isFilterOpen, setFilterOpen] = useState<Boolean>(false);
	const [datePickerDefaultValue, setDatePickerDefaultValue] = useState({
		startDate: moment('2005-01-01').toDate(),
		endDate: moment().add('1', 'year').endOf('year').toDate(),
	});
	const [searchParams] = useSearchParams();
	const statusParam = searchParams.get('status');

	const {
		data: roomsList = [],
		isLoading: roomListIsLoading,
		isError: isRoomError,
	} = useGetAllRoomsWithBeds();

// 	useEffect(()=>{
// updateRoomHistoryEDate()
// 	},[])

	const [filters, setFilters] = useState({
		fundSource: '',
		laId: '',
		icbId: '',
		paymentStatus: '',
		residentStatus: '',
		admissionDate: '',
		residentName: '',
		fncStatus: '',
		fundType: '',
		familyTopupStatus: '',
		thirdPartyTopupStatus: '',
		clientContribution: '',
	});

	useEffect(() => {
		setFilters((prev) => ({
			...prev,
			residentStatus: statusParam ? statusParam : '',
		}));
		statusParam && setFilterOpen(true)
	}, [statusParam]);

	const handleFilterChange = (key: string, value: any) => {
		if (key === 'RESET') {
			setFilters({
				fundSource: '',
				laId: '',
				icbId: '',
				paymentStatus: '',
				residentStatus: '',
				admissionDate: '',
				residentName: '',
				fncStatus: '',
				fundType: '',
				familyTopupStatus: '',
				thirdPartyTopupStatus: '',
				clientContribution: '',
			});
			setDatePickerDefaultValue({
				startDate: moment('2025-01-01').toDate(),
				endDate: moment().add('1', 'year').endOf('year').toDate(),
			});
			return;
		}
		setFilters((prev) => {
			if (key === 'fundSource') {
				return { ...prev, fundSource: value, laId: '', icbId: '' };
			}
			return { ...prev, [key]: value };
		});
	};

	const {
		localAuthorityList = [],
		localICBList = [],
		fNCDetails = {},
		isLoading: isMasterLoading,
	}: any = useMasterData();

	const {
		data: residentListWithInvoice,
		isLoading,
		isError,
		error,
	}: any = useQuery({
		queryKey: ['residentListWithInvoice'],
		queryFn: getAllResidentWithInvoice,
	});
	const modifiedResidentList = useMemo(() => {
		return residentListWithInvoice?.map((resident: any) => {
			const activeFund = getActiveFundDetails(resident?.fundDetails);

			const paymentStatus = resolvePaymentStatus(resident?.invoices);
			const clientContribution = activeFund?.clientContribution > 0 ? 1 : 2;

			return {
				...resident,
				fundDetails: activeFund ? [activeFund] : [],
				laId: activeFund?.nameOfLa ?? null,
				icbId: activeFund?.nameIbc ?? null,
				fundSource: activeFund?.fundSource ?? null,
				paymentStatus,
				residentStatus: resident?.admission?.residentStatus ?? null,
				admissionDate: resident?.admission?.admissionDate ?? null,
				residentName: resident?.personal?.name ?? '',
				fncStatus: activeFund?.fncStatus ?? null,
				fundType: activeFund?.fundType ?? null,
				familyTopupStatus: activeFund?.familyTopupStatus ?? '',
				thirdPartyTopupStatus: activeFund?.thirdPartyTopupStatus ?? '',
				clientContribution: clientContribution,
				allFundDetails: resident?.fundDetails || [],
			};
		});
	}, [residentListWithInvoice]);

	const residentFilteredListListWithInvoice: IResidentModel[] = useMultiSearch(
		modifiedResidentList,
		filters,
	);

	const getPendingAmount = (invoices: any[]) =>
		invoices
			?.filter((inv) => inv.status === INVOICE_STATUS.PENDING)
			.reduce((sum, inv) => sum + (inv.totalPrice || 0), 0);

	const handleDownloadResidentExcel = () => {
		if (residentFilteredListListWithInvoice?.length === 0) return;
		downloadResidentListAsExcel(
			residentFilteredListListWithInvoice,
			localAuthorityList,
			localICBList,
			roomsList,
			fNCDetails,
		);
	};

	const handleDownloadResidentPDF = () => {
		if (residentFilteredListListWithInvoice?.length === 0) return;
		downloadResidentListAsPDF(
			residentFilteredListListWithInvoice,
			localAuthorityList,
			localICBList,
			roomsList,
			fNCDetails
		);
	};


	return (
		<PageWrapper title={'Resident'}>
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
						placeholder='Search Resident by name...'
						onChange={(e: any) => handleFilterChange('residentName', e.target.value)}
						value={filters.residentName}
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
						{residentListWithInvoice?.length !==
							residentFilteredListListWithInvoice?.length && (
							<Popovers desc='Filtering applied' trigger='hover'>
								<span className='position-absolute top-0 start-100 translate-middle badge border border-light rounded-circle bg-danger p-2'>
									<span className='visually-hidden'>there is filtering</span>
								</span>
							</Popovers>
						)}
					</Button>
					<SubheaderSeparator />
					<DateRangePickerPopover
						value={datePickerDefaultValue}
						onApply={setDatePickerDefaultValue}
					/>
					<Dropdown>
						<DropdownToggle hasIcon={false}>
							<Button
								icon='Download'
								color='info'
								isLight
								shadow='sm'
								aria-label='More actions'>
								Export
							</Button>
						</DropdownToggle>
						<DropdownMenu isAlignmentEnd>
							<DropdownItem>
								<Button
									icon='PDF'
									color='info'
									isLight
									onClick={handleDownloadResidentPDF}>
									PDF
								</Button>
							</DropdownItem>
							<DropdownItem>
								<Button icon='Excel' onClick={handleDownloadResidentExcel}>
									Excel
								</Button>
							</DropdownItem>
						</DropdownMenu>
					</Dropdown>
				</SubHeaderRight>
			</SubHeader>
			<Page container='fluid'>
				<ResidentList
					localICBList={localICBList}
					isLoading={isLoading}
					localAuthorityList={localAuthorityList}
					residentList={residentFilteredListListWithInvoice}
					filters={filters}
					onFilterChange={handleFilterChange}
					dateRange={datePickerDefaultValue}
					filterAccordianOpen={isFilterOpen}
					statusParam={statusParam}
				/>
			</Page>
		</PageWrapper>
	);
};

export default ResidentPage;
