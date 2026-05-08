import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Page, PageWrapper, SubHeader, SubHeaderLeft, SubHeaderRight } from '../../../../layout';

import {
	Breadcrumb,
	Card,
	CardHeader,
	CardTabItem,
	Button,
	DropdownToggle,
	Dropdown,
	DropdownMenu,
	DropdownItem,
} from '../../../../components/bootstrap';

import classNames from 'classnames';
import { pagesMenu } from '../../../../menu';
import Icon from '../../../../components/icon';
import { LA_STATUS_LIST } from '../../../../common/data/option';
import {
	getActiveBedDetails,
	getActiveFundDetails,
	getColorByValue,
	getLabelByValue,
	getUserMappedCompanyId,
	priceFormat,
} from '../../../../helpers/helpers';
import useDarkMode from '../../../../hooks/useDarkMode';
import {
	BLOCK_BEDS_TYPE,
	FUND_SOURCE_TYPE,
	PREBOOK_HISTORY_STATUS,
	PRIMARY_ACCOUNT,
} from '../../../../common/constant';
import { useQuery } from '@tanstack/react-query';
import { getICBById } from '../../../../common/api/ibc';
import { getLocalAuthorityById } from '../../../../common/api/localAuthority';
import BlockBedHistory from '../component/tabs/blockBedHistory';
import FundDetailsOfLaAndIcb from '../component/tabs/fundDetails';
import { LaOrIcbInvoiceList } from '../component/tabs';
import { CreateBlockBedInvoice } from '../component';
import { getAllInvoicesList } from '../../../../common/api/invoice';
import { LaAndIcbForm } from '../component/laAndIcbForm';
import { IInvoiceModel, ILaAndICBModel } from '../../../../common/interface';
import { useUpdateQueryListById, useUpdateQueryObjectById } from '../../../../hooks';
import { useMasterData } from '../../../../contexts/mastersContext';
import { ResidentInvoiceArrearsCheck } from '../../resident/component';
import { getStatementByResdientId } from '../../../../common/api/statement';
import moment from 'moment';
import { getAllResidentByCompanyId } from '../../../../common/api/resident';
import { BasicStatCard, BlockBedsCard, TotalResidentsCard } from '../component/statCards';

const LaAndIcbView: React.FC = () => {
	const { fundType, fundId }: any = useParams();
	const { darkModeStatus } = useDarkMode();
	const [isOpenModalCheckArrears, setIsOpenModalCheckArrears] = useState(false);
	const [isOpenModalCreditCheckModal, setIsOpenModalCreditCheckModal] = useState(false);
	const isFromICBTab = useMemo(() => {
		return Number(fundType) === +FUND_SOURCE_TYPE.CHC;
	}, [fundType, fundId]);

	const {
		data: laOrICBfundDetails,
		isLoading,
		refetch,
	} = useQuery({
		queryKey: ['laOrICB', fundId],
		queryFn: () =>
			isFromICBTab ? getICBById(fundId || '') : getLocalAuthorityById(fundId || ''),
		enabled: !!fundId,
		// always fetch fresh when component mounts
		staleTime: 0,
		refetchOnMount: 'always',
	});

	// Build request payload for invoices (used when fetching)
	const invoiceReq = useMemo(
		() => ({
			fundTypeId: fundId,
		}),
		[fundType],
	);

	const {
		data: invoiceListByFundTypeId = [],
		isLoading: isInvoiceLoading,
		isError,
		refetch: onRelaodInviceListByFundTypeId,
	} = useQuery({
		queryKey: ['invoiceListByFundTypeId', fundId],
		queryFn: () => getAllInvoicesList(invoiceReq),
		enabled: Boolean(fundId),
		staleTime: 5 * 60 * 1000, // cache fresh for 5 minutes
		retry: 1, // retry once on failure
	});
	const {
		localAuthorityList = [],
		localICBList = [],
		vatList,
		bankList,
		isLoading: isMasterLoading,
	} = useMasterData();

	const { data: residentList = [], isLoading: isResidentListLoading } = useQuery({
		queryKey: ['residentListByCompany'],
		queryFn: getAllResidentByCompanyId,
		staleTime: 5 * 60 * 1000,
	});

	const blockBeds = laOrICBfundDetails?.blockBeds || [];
	const blockBedHistory = laOrICBfundDetails?.blockBedHistory || [];

	const activeBlockBedInfo = getActiveBedDetails(blockBeds) || null;
	const noOfBlockBeds = activeBlockBedInfo?.noOfBlockBed || 0;
	const [isCreateInvoiceModalOpen, setIsCreateInvoiceModalOpen] = useState(false);
	const [isOpenLaFormModule, setIsOpenLaFormModule] = useState(false);
	const [laEditObject, setLaEditObject] = useState<ILaAndICBModel | null>(null);
	const updateLocalICBList = useUpdateQueryListById<any>(['localICBList']);
	const updateLocalAuthorityList = useUpdateQueryListById<any>(['localAuthorityList']);
	const updateLaOrIcb = useUpdateQueryObjectById<any>(['laOrICB', fundId]);
	const companyId = getUserMappedCompanyId()?.companyId;
	const [statement, setStatement] = useState<any>({ openBalance: 0, overDue: 0 });
	// const [residentList, setResidentList] = useState<any[]>([]);

	const handleCheckArrears = () => {
		setIsOpenModalCheckArrears((prev) => !prev);

		// const reqObj = {
		// 	invoiceList: invoiceListByFundTypeId,
		// 	isCredit: false,
		// 	laOrICBfundDetails,
		// 	localICBList,
		// 	vatList,
		// }
		// checkArrearsAndCreditBlockBedInvoice(reqObj)
	};
	const handleOpenCreateInvoiceModalOpen = () => {
		setIsCreateInvoiceModalOpen(true);
	};

	const handleCloseCreateInvoiceModal = () => {
		setIsCreateInvoiceModalOpen(false);
	};

	const handleCloseLaFromModule = () => {
		setIsOpenLaFormModule(false);
	};
	const handleCloseSuccessLa = (data: ILaAndICBModel) => {
		updateQueryList(data);
		setLaEditObject(null);
		setIsOpenLaFormModule(false);
	};
	const updateQueryList = (data: ILaAndICBModel) => {
		isFromICBTab ? updateLocalICBList(data) : updateLocalAuthorityList(data);
		updateLaOrIcb(data);
	};
	const handleOpenEditModalLaFrom = (editObject: ILaAndICBModel) => {
		setLaEditObject(editObject);
		setIsOpenLaFormModule(true);
	};

	const activeBankInfo: any = useMemo(() => {
		return bankList?.find(({ primaryAccount }: any) => primaryAccount === PRIMARY_ACCOUNT.YES);
	}, [bankList]);

	// useEffect(() => {
	// 	const fetchResidents = async () => {
	// 		const list = await getAllResidentByCompanyId();
	// 		setResidentList(list || []);
	// 	};

	// 	fetchResidents();
	// }, []);

	const residentDetailsStats = useMemo(() => {
		return residentList.reduce(
			(acc, resident: any) => {
				const fundDetails = resident?.fundDetails || [];

				// Check total residents
				const hasFund = fundDetails.some(
					(fd: any) => fd?.nameOfLa === fundId || fd?.nameIbc === fundId,
				);

				if (hasFund) acc.totalResidents++;

				// Active fund check
				const activeFund = getActiveFundDetails(fundDetails);

				if (
					activeFund &&
					(activeFund?.nameOfLa === fundId || activeFund?.nameIbc === fundId)
				) {
					acc.activeResident++;

					if (+activeFund?.blockBedStatus === BLOCK_BEDS_TYPE.YES) {
						acc.blockBedResidents++;
					} else {
						acc.normalResidents++;
					}
				}

				return acc;
			},
			{
				totalResidents: 0,
				activeResident: 0,
				normalResidents: 0,
				blockBedResidents: 0,
			},
		);
	}, [residentList, fundId]);

	useEffect(() => {
		const fetchStatement = async () => {
			if (!invoiceListByFundTypeId?.length) return;
			const residentStatement: any = await getStatementByResdientId(
				invoiceListByFundTypeId,
				[],
				activeBankInfo,
				moment('2000-01-01').format('YYYY-MM-DD'),
				moment().format('YYYY-MM-DD'),
			);

			const overDue =
				residentStatement?.summary?.past_due_1_30 +
				residentStatement?.summary?.past_due_31_60 +
				residentStatement?.summary?.past_due_61_90 +
				residentStatement?.summary?.past_due_90_plus;
			setStatement({ openBalance: residentStatement.summary.total_due, overDue });
		};

		fetchStatement();
	}, [invoiceListByFundTypeId]);

	const statsConfig = useMemo(() => {
		try {
			return [
				{
					title: 'Open Balance',
					value: statement.openBalance,
					icon: 'TrendingUp',
					color: 'text-success',
				},
				{
					title: 'overDue',
					value: statement.overDue,
					icon: 'AccessTime',
					color: 'text-warning',
				},
			];
		} catch (mainError) {
			console.error('StatsConfig error:', mainError);
			// Prevent UI crash
			return [
				{
					title: 'Total Funded',
					value: '£0.00',
					icon: 'TrendingUp',
					color: 'text-success',
				},
				{ title: 'Outstanding', value: '£0.00', icon: 'AccessTime', color: 'text-warning' },
			];
		}
	}, [invoiceListByFundTypeId, statement]);

	if (isLoading) {
		return (
			<PageWrapper title='LA / ICB Details'>
				<div className='p-4'>Loading...</div>
			</PageWrapper>
		);
	}
	return (
		<PageWrapper title='LA / ICB Details'>
			<SubHeader>
				<SubHeaderLeft>
					<Breadcrumb
						list={[
							{
								title: 'LA / ICB',
								to: `/${pagesMenu.organisationSetup.subMenu.laAndIcb.path}`,
							},
							{ title: 'Details', to: `/LaAndIcbDetails` },
						]}
					/>
				</SubHeaderLeft>
			</SubHeader>

			<Page container='fluid'>
				<Card className='mb-4 p-3'>
					<CardHeader className='d-flex justify-content-between align-items-start'>
						<div className='d-flex align-items-start gap-2'>
							<div className='flex-shrink-0'>
								<div className='ratio ratio-1x1 me-3' style={{ width: 48 }}>
									<div
										className={`bg-l${darkModeStatus ? 'o25' : '25'}-danger text-danger rounded-2 d-flex align-items-center justify-content-center`}>
										<span className='fw-bold'>
											<Icon icon='Apartment' size='2x' />
										</span>
									</div>
								</div>
							</div>

							<div>
								<div
									className={classNames('fw-bold', 'cursor-pointer', {
										'link-dark': !darkModeStatus,
										'link-light': darkModeStatus,
									})}>
									{laOrICBfundDetails?.name}
								</div>

								<div className='d-flex align-items-center gap-2 mt-1'>
									<span
										className={classNames('fw-bold', {
											'text-dark': !darkModeStatus,
											'text-light': darkModeStatus,
										})}>
										{laOrICBfundDetails?.shortName}
									</span>

									<Button
										isLink
										color={getColorByValue(
											LA_STATUS_LIST,
											laOrICBfundDetails?.status,
										)}
										size='sm'
										className='text-nowrap'
										icon='circle'>
										{getLabelByValue(
											LA_STATUS_LIST,
											laOrICBfundDetails?.status,
										)}
									</Button>
								</div>

								<div className='d-flex gap-4 mt-2'>
									<div className='d-flex align-items-center gap-1 text-muted'>
										<Icon icon='Place' size='lg' />
										<span>
											{laOrICBfundDetails?.area || 'NA'},{' '}
											{laOrICBfundDetails?.postCode || 'NA'}
										</span>
									</div>

									<div className='d-flex align-items-center gap-1 text-muted'>
										<Icon icon='Call' size='lg' />
										<span>{laOrICBfundDetails?.phone || 'NA'}</span>
									</div>
								</div>
							</div>
						</div>
						<Button
							color='info'
							isLight
							icon='Edit'
							onClick={() => handleOpenEditModalLaFrom(laOrICBfundDetails)}>
							Edit
						</Button>
					</CardHeader>
				</Card>

				<div className='row'>
					<div className='row'>
						<div className='col-12 col-sm-6 col-lg-3'>
							<BasicStatCard {...statsConfig[0]} />
						</div>

						<div className='col-12 col-sm-6 col-lg-3'>
							<BasicStatCard {...statsConfig[1]} />
						</div>

						<div className='col-12 col-sm-6 col-lg-3'>
							<TotalResidentsCard
								stats={residentDetailsStats}
								noOfBlockBeds={noOfBlockBeds}
							/>
						</div>

						<div className='col-12 col-sm-6 col-lg-3'>
							<BlockBedsCard
								noOfActiveResidents={residentDetailsStats?.blockBedResidents}
								noOfBlockBeds={noOfBlockBeds}
							/>
						</div>
					</div>
				</div>

				<Card
					hasTab
					className='h-100'
					tabActionsRightSide={
						<Dropdown>
							<DropdownToggle hasIcon={false}>
								<Button
									icon='MoreHoriz'
									color='dark'
									isLight
									shadow='sm'
									aria-label='More actions'
								/>
							</DropdownToggle>
							<DropdownMenu>
								<DropdownItem>
									<Button
										icon='Visibility'
										onClick={handleOpenCreateInvoiceModalOpen}>
										Create New Invoice
									</Button>
								</DropdownItem>
								<DropdownItem>
									<Button
										icon='Edit'
										onClick={() => setIsOpenModalCheckArrears(true)}>
										Check Credit and arrears Invoice
									</Button>
								</DropdownItem>
							</DropdownMenu>
						</Dropdown>
					}>
					<CardTabItem id='fundDetails' title='Fund Details' icon='payments'>
						<FundDetailsOfLaAndIcb data={laOrICBfundDetails} fundType={fundType} />
					</CardTabItem>

					<CardTabItem
						id='fundAging'
						title='Fund Ageing & Invoice List'
						icon='receipt_long'>
						<LaOrIcbInvoiceList
							invoiceListByFundTypeId={invoiceListByFundTypeId}
							isInvoiceLoading={isInvoiceLoading}
							laOrICBfundDetails={laOrICBfundDetails}
							fundType={+fundType}
							activeBlockBedInfo={activeBlockBedInfo}
						/>
					</CardTabItem>

					<CardTabItem id='blockBedHistory' title='Block Bed History' icon='history'>
						<BlockBedHistory blockBeds={blockBedHistory} />
					</CardTabItem>
				</Card>
				<LaAndIcbForm
					toggle={handleCloseLaFromModule}
					onCloseSuccess={handleCloseSuccessLa}
					isOpen={isOpenLaFormModule}
					laEditObject={laEditObject}
					isFromICBTab={isFromICBTab}
					companyId={companyId}
				/>
				{/* <CreateBlockBedInvoice laOrICBfundDetails={laOrICBfundDetails} fundType={+fundType} fundId={fundId} toggle={handleCloseCreateInvoiceModal} isOpen={isCreateInvoiceModalOpen} activeBlockBedInfo={activeBlockBedInfo} /> */}
				<CreateBlockBedInvoice
					laOrICBfundDetails={laOrICBfundDetails}
					fundType={+fundType}
					fundId={fundId}
					onRelaodInviceListByFundTypeId={onRelaodInviceListByFundTypeId}
					toggle={handleCloseCreateInvoiceModal}
					isOpen={isCreateInvoiceModalOpen}
					activeBlockBedInfo={activeBlockBedInfo}
				/>

				{isOpenModalCheckArrears && (
					<ResidentInvoiceArrearsCheck
						laOrICBfundDetails={laOrICBfundDetails}
						isBlockBed={true}
						onRelaodInviceListByFundTypeId={onRelaodInviceListByFundTypeId}
						localICBList={localICBList}
						localAuthorityList={localAuthorityList}
						isCredit={false}
						vatList={vatList}
						toggle={() => setIsOpenModalCheckArrears(!isOpenModalCheckArrears)}
						isOpen={isOpenModalCheckArrears}
						invoiceList={invoiceListByFundTypeId}
					/>
				)}
				{isOpenModalCreditCheckModal && (
					<ResidentInvoiceArrearsCheck
						laOrICBfundDetails={laOrICBfundDetails}
						isBlockBed={true}
						onRelaodInviceListByFundTypeId={onRelaodInviceListByFundTypeId}
						localICBList={localICBList}
						localAuthorityList={localAuthorityList}
						isCredit={true}
						vatList={vatList}
						toggle={() => setIsOpenModalCreditCheckModal(!isOpenModalCreditCheckModal)}
						isOpen={isOpenModalCreditCheckModal}
						invoiceList={invoiceListByFundTypeId}
					/>
				)}
			</Page>
		</PageWrapper>
	);
};

export default LaAndIcbView;
