// src/pages/openingBalance/OpeningBalancePage.tsx
import React, { useMemo, useState } from 'react';
import {
	PageWrapper,
	Page,
	SubHeader,
	SubHeaderLeft,
	SubHeaderRight,
	SubheaderSeparator,
} from '../../../layout';

import {
	Button,
	Card,
	CardBody,
	CardLabel,
	CardHeader,
	CardTitle,
	Spinner,
	Input,
	FormGroup,
	Select,
	Option,
	Popovers,
	CardActions,
} from '../../../components/bootstrap';

import Icon from '../../../components/icon';

import { useQuery, useMutation } from '@tanstack/react-query';

import {
	getAllOpeningBalances,
	createOpeningBalance,
	updateOpeningBalance,
	deleteOpeningBalance,
} from '../../../common/api/openBalance';

import { getAllResidentWithInvoice } from '../../../common/api/resident';
import { getAllChartOfAccounts } from '../../../common/api/chartAccount';

import { useMasterData } from '../../../contexts/mastersContext';
import { getLabelByValue, priceFormat } from '../../../helpers/helpers';
import {
	CHART_OF_ACCOUNTS_CATEGORY_TYPE_LIST,
	INVOICE_TO_TYPE_LIST,
	OPENING_BALANCE_TO_TYPE_LIST,
	OPENING_BALANCE_TYPE_LIST,
} from '../../../common/data/option';

import OpeningBalanceForm from './component/OpeningBalanceForm';
import OpeningBalanceListTable from './component/OpeningBalanceListTable';
import {
	CHART_OF_ACCOUNTS_CATEGORY_TYPE,
	OPENING_BALANCE_TO_TYPE,
	OPENING_BALANCE_TYPE,
} from '../../../common/constant/app';
import { useMultiSearch } from '../../../hooks';
import Swal from 'sweetalert2';
import showNotification from '../../../components/extras/showNotification';
import { getColorNameWithIndex } from '../../../common/data/enumColors';
import { ResidentProfileCard, SearchableSelect } from '../../../components/common';

// -------------------------------------------

const OpeningBalancePage: React.FC = () => {
	const [showForm, setShowForm] = useState(false);
	const [editItem, setEditItem] = useState<any>(null);
	const [isFilterOpen, setFilterOpen] = useState<boolean>(false);
	const [filters, setFilters] = useState({
		category: '',
		openingBalanceTo: '',
		fundTypeId: '',
		residentName: '',
		COAName: '',
		type: '',
	});

	const {
		localAuthorityList = [],
		localICBList = [],
		fNCDetails = {},
		dueDateList = [],
		bankList = [],
		isLoading: isMasterLoading,
		isError,
	} = useMasterData();

	/** FETCH LIST */
	const {
		data: list = [],
		refetch,
		isLoading,
	} = useQuery({
		queryKey: ['openingBalanceList'],
		queryFn: getAllOpeningBalances,
	});

	/** FETCH RESIDENTS */
	const { data: residentListWithInvoice = [], isLoading: isResidentListLoading } = useQuery({
		queryKey: ['residentListWithInvoice'],
		queryFn: getAllResidentWithInvoice,
	});

	/** FETCH CHART ACCOUNTS */
	const { data: chartAccounts = [] } = useQuery({
		queryKey: ['chartAccounts'],
		queryFn: getAllChartOfAccounts,
	});

	/** RESIDENT SIMPLE MAP */
	// const residents = useMemo(
	// 	() =>
	// 		(residentListWithInvoice || []).map((r: any) => ({
	// 			id: r.id,
	// 			name: r?.personal?.name || r?.name || 'Unnamed',
	// 		})),
	// 	[residentListWithInvoice],
	// );

	// Resident options for ReactSelect
	const residents = useMemo(() => {
		return (
			residentListWithInvoice?.map((r: any, i: number) => {
				const colorIndex = getColorNameWithIndex(i);
				return {
					label: (
						<ResidentProfileCard
							resident={r}
							colorIndex={colorIndex}
							isNavigate={false}
						/>
					),
					value: r.id,
				};
			}) ?? []
		);
	}, [residentListWithInvoice]);

	const handleFilterChange = (key: string, value: any) => {
		if (key === 'RESET') {
			setFilters({
				category: '',
				openingBalanceTo: '',
				fundTypeId: '',
				residentName: '',
				COAName: '',
				type: '',
			});
			return;
		}
		setFilters((prev) => {
			return { ...prev, [key]: value };
		});
	};
	const modifiedOpeningBalanceList = useMemo(() => {
		return list?.map((data: any) => {
			return {
				openingBalance: { ...data },
				category: data.coaMapping.category,
				residentName: data?.residentData?.personal?.name,
				COAName: data?.coaMapping?.chartOfAccountDetail?.accountName,
				type: data?.coaMapping?.type,
				openingBalanceTo: data?.openingBalanceTo,
				fundTypeId: data?.fundTypeId,
			};
		});
	}, [list]);

	const filteredOpeningBalance = useMultiSearch(modifiedOpeningBalanceList, filters);

	/** MUTATIONS */
	const createMut = useMutation({
		mutationFn: createOpeningBalance,
		onSuccess: () => refetch(),
	});

	const updateMut = useMutation({
		mutationFn: ({ id, data }: any) => updateOpeningBalance(id, data),
		onSuccess: () => refetch(),
	});

	const deleteMut = useMutation({
		mutationFn: deleteOpeningBalance,
		onSuccess: () => refetch(),
	});

	const isMutating = createMut.isPending || updateMut.isPending || deleteMut.isPending;

	/** SAVE HANDLER */
	const handleSave = (form: any) => {
		// remove unwanted fields from form
		const { paymentMethod, refNo, bankId, ...restFormData } = form;

		if (editItem) {
			updateMut.mutate({ id: editItem.id, data: restFormData });
		} else {
			createMut.mutate(restFormData);
		}

		setShowForm(false);
		setEditItem(null);
	};

	let debitAmt = 0;
	let creditAmt = 0;

	const sum = (arr: any[]) => arr.reduce((total, { amount }) => total + Number(amount || 0), 0);

	list?.forEach((data: any) => {
		const totalPrice = Number(data?.totalPrice || 0);
		const { payedInfo = [], creditApply = [] } = data?.invoiceDetails || {};
		const { creditApply: creditWalletCreditApply = [] } = data?.creditWalletDetails || {};
		// for invoice
		const totalPaid = sum(payedInfo);
		const totalCredits = sum(creditApply);
		const pendingAmt = totalPrice - (totalPaid + totalCredits);

		//for credit
		const pendingAmtCredit = totalPrice - sum(creditWalletCreditApply);

		if (+data?.coaMapping?.type === OPENING_BALANCE_TYPE.CREDIT) {
			creditAmt += pendingAmtCredit; // Opening Credit → full totalPrice
		} else {
			debitAmt += pendingAmt; // Others → remaining balance
		}
	});

	const stats = [
		{
			title: 'Total Entries',
			value: list?.length,
			icon: 'People',
			subTitles: 'Balance Records',
			color: 'text-dark',
		},
		{
			title: 'Total Debit',
			value: priceFormat(debitAmt),
			icon: 'TrendingUp',
			subTitles: 'Incoming Balance',
			color: 'text-success',
		},
		{
			title: 'Total Credit',
			value: priceFormat(creditAmt),
			icon: 'TrendingDown',
			subTitles: 'OutGoing Balances',
			color: 'text-danger',
		},
		{
			title: 'Total Net',
			value: priceFormat(debitAmt - creditAmt),
			icon: 'TrendingUp',
			subTitles: 'OutGoing Balances',
			color: debitAmt > creditAmt ? 'text-success' : 'text-danger',
		},
	];

	const handleEditOpeningBalance = (item: any) => {
		delete item.residentData;
		delete item.coaMapping.chartOfAccountDetail;
		setEditItem(item);
		setShowForm(true);
	};
	const handleDeleteOpeningBalance = (item: any) => {
		let validDelete = false;
		Swal.fire({
			title: 'Are you sure?',
			text: "You won't be able to revert this!",
			icon: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Yes, delete it!',
			cancelButtonText: 'Cancel',
			confirmButtonColor: '#3085d6',
			cancelButtonColor: '#d33',
			customClass: {
				popup: 'my-swal-popup',
				confirmButton: 'btn btn-light-info',
				cancelButton: 'btn btn-light-danger',
			},
		}).then((result) => {
			if (!result.isConfirmed) return;

			if (+item.coaMapping.category === CHART_OF_ACCOUNTS_CATEGORY_TYPE.ACCOUNTS_RECEIVABLE) {
				if (+item.coaMapping.type === OPENING_BALANCE_TYPE.DEBIT) {
					const { payedInfo = [], creditApply = [] } = item?.invoiceDetails || {};
					validDelete = sum(payedInfo) + sum(creditApply) > 0 ? false : true;
				} else if (+item.coaMapping.type === OPENING_BALANCE_TYPE.DEBIT) {
					const { creditApply = [] } = item?.creditWalletDetails || {};
					validDelete = sum(creditApply) > 0 ? false : true;
				}
			}

			if (validDelete) deleteMut.mutate(item.id);
			else
				showNotification(
					"You can't Delete This OpeningBalance. They have some Amount to Pay",
					'',
					'warning',
				);
		});
	};

	return (
		<PageWrapper title='Opening Balance'>
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
						placeholder='Search by resident, COA...'
						onChange={(e: any) => {
							handleFilterChange('residentName', e.target.value);
						}}
						value={filters.residentName}
					/>

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
						{list?.length !== filteredOpeningBalance?.length && (
							<Popovers desc='Filtering applied' trigger='hover'>
								<span className='position-absolute top-0 start-100 translate-middle badge border border-light rounded-circle bg-danger p-2'>
									<span className='visually-hidden'>there is filtering</span>
								</span>
							</Popovers>
						)}
					</Button>
					<SubheaderSeparator />
					<Button color='info' icon='AddCircle' isLight onClick={() => setShowForm(true)}>
						Add Opening Balance
					</Button>
				</SubHeaderRight>
			</SubHeader>

			<Page container='fluid'>
				<div className='row'>
					{stats?.map((stat, index) => (
						<div className='col-md-3' key={index}>
							<Card className='p-4 d-flex justify-content-between align-items-center flex-row'>
								{/* Left Section */}
								<div>
									<div className='text-muted mb-1'>{stat.title}</div>
									<h4 className={`fw-bold mb-0  ${stat.color}`}>{stat.value}</h4>
								</div>

								{/* Right Icon */}
								<div className='d-flex align-items-center justify-content-center'>
									<Icon icon={stat.icon} size='2x' className={stat.color} />
								</div>
							</Card>
						</div>
					))}
				</div>

				{isFilterOpen && (
					<div className='row'>
						<Card>
							<CardHeader>
								<div className='d-flex justify-content-between align-items-center w-100'>
									{/* Left Side */}
									<div className='d-flex align-items-center gap-2 cursor-pointer'>
										<h5 className='mb-0 d-flex align-items-center gap-2'>
											<Icon icon='FilterAlt' color='primary' />
											Filters
										</h5>
									</div>

									{/* Right Side: Reset */}
									<Button
										color='link'
										className='text-decoration-none text-primary fw-semibold p-0 d-flex align-items-center gap-1'
										onClick={() => handleFilterChange('RESET', null)}>
										<Icon icon='Refresh' size='lg' className='text-primary' />
										Reset
									</Button>
								</div>
							</CardHeader>
							<CardBody>
								<form>
									<div className='row g-3 mb-5'>
										<div className='col-xl-2 col-lg-3 col-md-4 col-sm-6'>
											<FormGroup id='fundSource' label='Account Category'>
												<SearchableSelect
													value={filters?.category}
													onChange={(e: any) =>
														handleFilterChange(
															'category',
															e.target.value,
														)
													}
													placeholder='Select Account Category'
													options={CHART_OF_ACCOUNTS_CATEGORY_TYPE_LIST}
												/>
											</FormGroup>
										</div>
										<div className='col-xl-2 col-lg-3 col-md-4 col-sm-6'>
											<FormGroup id='fundSource' label='Opening Balance To'>
												<SearchableSelect
													value={filters?.openingBalanceTo}
													onChange={(e: any) =>
														handleFilterChange(
															'openingBalanceTo',
															e.target.value,
														)
													}
													options={OPENING_BALANCE_TO_TYPE_LIST}
													placeholder='Select Opening Balance To'
												/>
											</FormGroup>
										</div>
										<div className='col-xl-2 col-lg-3 col-md-4 col-sm-6'>
											<FormGroup id='type' label='Type'>
												<SearchableSelect
													value={filters?.type}
													onChange={(e: any) =>
														handleFilterChange('type', e.target.value)
													}
													options={OPENING_BALANCE_TYPE_LIST}
													placeholder='Select Type'
												/>
											</FormGroup>
										</div>

										{/* LOCAL AUTHORITY */}
										{+filters.openingBalanceTo ===
											OPENING_BALANCE_TO_TYPE.LA && (
											<div className='col-xl-2 col-lg-3 col-md-4 col-sm-6'>
												<FormGroup id='fundTypeId' label='Local Authority'>
													<SearchableSelect
														value={filters.fundTypeId}
														onChange={(e: any) =>
															handleFilterChange(
																'fundTypeId',
																e.target.value,
															)
														}
														options={localAuthorityList}
														placeholder='Select Local Authority'
														labelKey='name'
														valueKey='id'
													/>
												</FormGroup>
											</div>
										)}

										{/* ICB */}
										{+filters.openingBalanceTo ===
											OPENING_BALANCE_TO_TYPE.CHC && (
											<div className='col-xl-2 col-lg-3 col-md-4 col-sm-6'>
												<FormGroup id='fundTypeId' label='ICB'>
													<SearchableSelect
														value={filters.fundTypeId}
														onChange={(e: any) =>
															handleFilterChange(
																'fundTypeId',
																e.target.value,
															)
														}
														options={localICBList}
														placeholder='Select ICB'
														labelKey='name'
														valueKey='id'
													/>
												</FormGroup>
											</div>
										)}
									</div>
								</form>
							</CardBody>
						</Card>
					</div>
				)}

				<Card stretch>
					<CardHeader>
						<CardLabel>
							<CardTitle tag='div' className='h5'>
								Opening Balance List
							</CardTitle>
							<CardActions tag='div' className='text-muted'>
								Total records: {filteredOpeningBalance?.length ?? 0}
							</CardActions>
						</CardLabel>
					</CardHeader>

					<CardBody>
						{isLoading ? (
							<div className='text-center py-5'>
								<Spinner color='info' size='3x' />
								<div className='mt-2'>Loading Opening Balance...</div>
							</div>
						) : (
							<OpeningBalanceListTable
								openingBalanceList={filteredOpeningBalance}
								onEdit={handleEditOpeningBalance}
								onDelete={handleDeleteOpeningBalance}
								isLoading={isLoading}
							/>
						)}
					</CardBody>
				</Card>

				{/* FORM MODAL */}
				<OpeningBalanceForm
					isOpen={showForm}
					editData={editItem}
					toggle={() => {
						setShowForm(false);
						setEditItem(null);
					}}
					onSave={handleSave}
					residents={residents}
					localAuthorityList={localAuthorityList}
					localICBList={localICBList}
					chartAccounts={chartAccounts}
					residentListWithInvoice={residentListWithInvoice}
					isResidentListLoading={isResidentListLoading}
					isSaving={isMutating}
					fNCDetails={fNCDetails}
					dueDateList={dueDateList}
					bankList={bankList}
				/>

				{isMutating && (
					<div
						className='position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center'
						style={{ background: 'rgba(255,255,255,0.6)', zIndex: 2000 }}>
						<Spinner size='3x' color='primary' />
					</div>
				)}
			</Page>
		</PageWrapper>
	);
};

export default OpeningBalancePage;
