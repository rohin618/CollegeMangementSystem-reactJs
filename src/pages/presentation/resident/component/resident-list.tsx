// ─── ResidentList.tsx ─────────────────────────────────────────────────────────

import {
	CardBody,
	Card,
	Button,
	Dropdown,
	DropdownItem,
	DropdownMenu,
	DropdownToggle,
	CardHeader,
	CardLabel,
	CardTitle,
	CardActions,
	FormGroup,
} from '../../../../components/bootstrap';
import Icon from '../../../../components/icon';
import moment from 'moment';
import {
	RESIDENT_STATUS_LIST,
	INVOICE_STATUS_TYPE_LIST,
	FUND_SOURCE_LIST,
	FNC_STATUS_LIST,
	FUND_TYPE_LIST,
	FAMILY_TOPUP_STATUS_LIST,
} from '../../../../common/data/option';
import {
	PRICE_PERIOD_STATUS,
	FUND_SOURCE_TYPE,
	FUND_TYPE,
	RESIDENT_STATUS,
	DATA_MIGRATION_TO_DATE,
	INVOICE_STATUS,
} from '../../../../common/constant';
import useDarkMode from '../../../../hooks/useDarkMode';
import { getColorNameWithIndex } from '../../../../common/data/enumColors';
import {
	priceFormat,
	getLabelByValue,
	getColorByValue,
	resolvePaymentStatus,
	getActiveFundDetails,
	getActiveFundDetailsByLAOrICB,
	getInvoiceOpenBalance,
	getNearestByEndDateOrTodayOverLap,
	IInvoice,
} from '../../../../helpers/helpers';
import classNames from 'classnames';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable, ResidentProfileCard, SearchableSelect } from '../../../../components/common';
import { IResidentModel } from '../../../../common/interface';
import { IInvoiceDiscount, IInvoiceModel } from '../../../../common/interface/invoice';
import { getActiveFundDetailsByJointFund } from '../../../../helpers/resident';

// ─── Pure module-level helpers ────────────────────────────────────────────────

/** Total gross amount across all resident invoices */
function getTotalAmount(invoices: any[] = []): number {
	return invoices.reduce((s, inv) => s + Number(inv.totalPrice || 0), 0);
}

/** Total paid (payedInfo) across all resident invoices */
function getPaidAmount(invoices: any[] = []): number {
	return invoices.reduce((s, inv) => {
		const paid = (inv.payedInfo ?? []).reduce(
			(ps: number, p: any) => ps + Number(p.amount || 0),
			0,
		);
		return s + paid;
	}, 0);
}

/**
 * Total outstanding balance across all resident invoices — discount-aware.
 * ✅ Sums getInvoiceOpenBalance() per invoice so discounts, credits and payments
 *    are all factored in consistently using the pre-VAT discount model.
 */
function getResidentOutstanding(invoices: any[] = []): number {
	return invoices.filter((inv:any)=>![INVOICE_STATUS.VOID,INVOICE_STATUS.DRAFT].includes(inv.status) ).reduce((s, inv) => s + getInvoiceOpenBalance(inv), 0);
}

// ─── Component ────────────────────────────────────────────────────────────────

export const ResidentList = ({
	residentList = [],
	localICBList = [],
	localAuthorityList = [],
	isLoading = false,
	filters,
	onFilterChange,
	dateRange = { selection: { startDate: null, endDate: null } },
	filterAccordianOpen,
}: any) => {
	const navigate = useNavigate();
	const { darkModeStatus } = useDarkMode();

	const validRoomPrice = (resident: any) =>
		resident?.roomPrice?.find((x: any) => x.status === PRICE_PERIOD_STATUS.ACTIVE) || {};

	// ── Date-filtered resident list ───────────────────────────────────────────
	const residentNewList = useMemo(() => {
		const { startDate, endDate } = dateRange;
		if (!residentList?.length || !startDate || !endDate) return [];
		return residentList.filter((item: any) =>
			moment(item?.admission?.admissionDate).isBetween(startDate, endDate, undefined, '[]'),
		);
	}, [residentList, dateRange]);

	// ── Table data ────────────────────────────────────────────────────────────
	const residentTableData = useMemo(() => {
		return residentNewList.map((resident: any, i: number) => {
			const colorIndex = getColorNameWithIndex(i);
			const { perWeek = 0 } = validRoomPrice(resident);

			const paymentStatus = resolvePaymentStatus(resident?.invoices);
			const paymentColor = getColorByValue(INVOICE_STATUS_TYPE_LIST, paymentStatus);

			// ✅ Discount-aware outstanding — uses balanceDue if available (pre-VAT discount model)
			const outstanding = getResidentOutstanding(resident?.invoices ?? []);

			// Credit wallets balance
			const creditAmount = Math.abs(
				(resident.creditWallets ?? []).reduce(
					(s: number, { creditAmount }: any) => s + (Number(creditAmount) || 0),
					0,
				),
			);

			const fundDetail = getNearestByEndDateOrTodayOverLap(resident?.allFundDetails);
			let shortName: any = '';
			if (+fundDetail?.fundSource === FUND_SOURCE_TYPE.JOINT_FUNDNG) {
				const { la, icb } = getActiveFundDetailsByJointFund(
					fundDetail,
					localAuthorityList,
					localICBList,
				);
				shortName = la?.shortName + ' & ' + icb?.shortName;
			} else {
				shortName =
					+fundDetail?.fundSource !== FUND_SOURCE_TYPE.PRIVATE
						? getActiveFundDetailsByLAOrICB(
								fundDetail,
								localAuthorityList,
								localICBList,
							)?.shortName
						: +fundDetail?.fundSource === FUND_SOURCE_TYPE.PRIVATE
							? 'PVT'
							: '';
			}

			return {
				id: resident.id,
				resident,
				colorIndex,
				dob: resident.personal.dob,
				perWeek,
				admissionDate: resident?.admission?.admissionDate,
				dischargeDate: resident?.admission?.dateDischargeAndRip,
				// ✅ outstanding already accounts for discounts (pre-VAT), credits & payments
				balance: outstanding,
				residentStatus: resident.admission.residentStatus,
				paymentStatus,
				paymentColor,
				residentName: resident?.personal?.name,
				category: shortName,
			};
		});
	}, [residentNewList, localAuthorityList, localICBList]);

	// ── Navigation ────────────────────────────────────────────────────────────
	const handleEditResidentForm = (row: any) => {
		const current: IResidentModel = residentList?.find((r: IResidentModel) => r.id === row.id);
		const isMigration =
			+current?.admission?.residentStatus !== RESIDENT_STATUS.LIVING &&
			moment(current?.admission?.dateDischargeAndRip).isSameOrBefore(DATA_MIGRATION_TO_DATE);

		navigate(isMigration ? `/resident/fromResidentPage/${row.id}` : `/resident/edit/${row.id}`);
	};

	// ── Table columns ─────────────────────────────────────────────────────────
	const residentColumns = useMemo(
		() => [
			{
				label: 'Resident',
				key: 'residentName',
				sortable: true,
				render: (row: any) => (
					<ResidentProfileCard resident={row.resident} colorIndex={row.colorIndex} />
				),
			},
			{
				label: 'Category',
				key: 'category',
				sortable: true,
				render: (row: any) => <strong>{row?.category || '—'}</strong>,
			},
			{
				label: 'DOB',
				key: 'dob',
				sortable: true,
				render: (row: any) => (row.dob ? moment(row.dob).format('DD MMM YYYY') : 'NA'),
			},
			{
				label: 'Weekly Price',
				key: 'perWeek',
				sortable: true,
				render: (row: any) => <strong>{priceFormat(row.perWeek)}</strong>,
			},
			{
				label: 'Admission Date',
				key: 'admissionDate',
				sortable: true,
				render: (row: any) => moment(row.admissionDate).format('DD MMM YYYY'),
			},
			{
				label: 'Discharge/RIP Date',
				key: 'dischargeDate',
				render: (row: any) =>
					row.dischargeDate ? moment(row.dischargeDate).format('DD MMM YYYY') : 'NA',
			},
			{
				label: 'Outstanding',
				key: 'balance',
				sortable: true,
				render: (row: any) => (
					<strong className={row.balance > 0 ? 'text-danger' : ''}>
						{priceFormat(row.balance)}
					</strong>
				),
			},
			{
				label: 'Status',
				key: 'residentStatus',
				render: (row: any) => (
					<Button
						isLink
						size='sm'
						icon='circle'
						color={getColorByValue(RESIDENT_STATUS_LIST, row.residentStatus)}>
						{getLabelByValue(RESIDENT_STATUS_LIST, row.residentStatus)}
					</Button>
				),
			},
			{
				label: 'Payment',
				key: 'paymentStatus',
				render: (row: any) => (
					<div
						style={{ width: 100 }}
						className={classNames(
							`bg-l${darkModeStatus ? 'o25' : '10'}-${row.paymentColor}`,
							`text-${row.paymentColor}`,
							'fw-bold py-2 rounded-pill text-center',
						)}>
						{getLabelByValue(INVOICE_STATUS_TYPE_LIST, row.paymentStatus) ||
							row.paymentStatus}
					</div>
				),
			},
			{
				label: 'Action',
				key: 'action',
				render: (row: any) => (
					<Dropdown>
						<DropdownToggle hasIcon={false}>
							<Button icon='MoreHoriz' color='dark' isLight shadow='sm' />
						</DropdownToggle>
						<DropdownMenu isAlignmentEnd={false} direction='right'>
							<DropdownItem>
								<Button
									icon='Visibility'
									onClick={() => navigate(`/resident/details/${row.id}`)}>
									View
								</Button>
							</DropdownItem>
							<DropdownItem>
								<Button icon='Edit' onClick={() => handleEditResidentForm(row)}>
									Edit
								</Button>
							</DropdownItem>
						</DropdownMenu>
					</Dropdown>
				),
			},
			// eslint-disable-next-line react-hooks/exhaustive-deps
		],
		[darkModeStatus],
	);

	// ─────────────────────────────────────────────────────────────────────────
	// RENDER
	// ─────────────────────────────────────────────────────────────────────────

	return (
		<>
			{/* ── Filter panel ──────────────────────────────────────────── */}
			{filterAccordianOpen && (
				<div className='row'>
					<div className='col-12'>
						<Card>
							<CardHeader>
								<div className='d-flex justify-content-between align-items-center w-100'>
									<h5 className='mb-0 d-flex align-items-center gap-2'>
										<Icon icon='FilterAlt' color='primary' />
										Filters
									</h5>
									<Button
										color='link'
										className='text-decoration-none text-primary fw-semibold p-0 d-flex align-items-center gap-1'
										onClick={() => onFilterChange('RESET', null)}>
										<Icon icon='Refresh' size='lg' className='text-primary' />
										Reset
									</Button>
								</div>
							</CardHeader>
							<CardBody>
								<div className='row g-3'>
									{/* Fund Source */}
									<div className='col-xl-2 col-lg-3 col-md-4 col-sm-6'>
										<FormGroup id='fundSource' label='Fund Source'>
											<SearchableSelect
												id='fundSource'
												value={filters.fundSource}
												onChange={(e: any) =>
													onFilterChange('fundSource', e.target.value)
												}
												placeholder='Select Fund Source'
												options={FUND_SOURCE_LIST}
											/>
										</FormGroup>
									</div>

									{/* Local Authority */}
									{+filters.fundSource === FUND_SOURCE_TYPE.LOCAL_AUTHORITY && (
										<div className='col-xl-2 col-lg-3 col-md-4 col-sm-6'>
											<FormGroup id='laId' label='Local Authority'>
												<SearchableSelect
													id='laId'
													value={filters.laId}
													placeholder='Select Local Authority'
													onChange={(e: any) =>
														onFilterChange('laId', e.target.value)
													}
													valueKey='id'
													labelKey='name'
													options={localAuthorityList}
												/>
											</FormGroup>
										</div>
									)}

									{/* ICB */}
									{+filters.fundSource === FUND_SOURCE_TYPE.CHC && (
										<div className='col-xl-2 col-lg-3 col-md-4 col-sm-6'>
											<FormGroup id='icbId' label='ICB'>
												<SearchableSelect
													id='icbId'
													value={filters.icbId}
													placeholder='Select ICB'
													onChange={(e: any) =>
														onFilterChange('icbId', e.target.value)
													}
													options={localICBList}
													valueKey='id'
													labelKey='name'
												/>
											</FormGroup>
										</div>
									)}

									{/* FNC Status */}
									<div className='col-xl-2 col-lg-3 col-md-4 col-sm-6'>
										<FormGroup id='fncStatus' label='FNC Status'>
											<SearchableSelect
												id='fncStatus'
												value={filters.fncStatus}
												placeholder='Select FNC'
												onChange={(e: any) =>
													onFilterChange('fncStatus', e.target.value)
												}
												options={FNC_STATUS_LIST}
											/>
										</FormGroup>
									</div>

									{/* Fund Type */}
									{(+filters.fundSource === FUND_SOURCE_TYPE.CHC ||
										+filters.fundSource ===
											FUND_SOURCE_TYPE.LOCAL_AUTHORITY) && (
										<div className='col-xl-2 col-lg-3 col-md-4 col-sm-6'>
											<FormGroup id='fundType' label='Fund Type'>
												<SearchableSelect
													id='fundType'
													value={filters.fundType}
													placeholder='Select Fund Type'
													onChange={(e: any) =>
														onFilterChange('fundType', e.target.value)
													}
													options={FUND_TYPE_LIST}
												/>
											</FormGroup>
										</div>
									)}

									{/* Partial fund sub-filters */}
									{+filters.fundType === FUND_TYPE.PARTIAL && (
										<>
											{/* Family TopUp */}
											{(+filters.fundSource === FUND_SOURCE_TYPE.CHC ||
												+filters.fundSource ===
													FUND_SOURCE_TYPE.LOCAL_AUTHORITY) && (
												<div className='col-xl-2 col-lg-3 col-md-4 col-sm-6'>
													<FormGroup
														id='familyTopupStatus'
														label='Family TopUp'>
														<SearchableSelect
															id='familyTopupStatus'
															value={filters.familyTopupStatus}
															placeholder='Select Family TopUp Status'
															onChange={(e: any) =>
																onFilterChange(
																	'familyTopupStatus',
																	e.target.value,
																)
															}
															options={FAMILY_TOPUP_STATUS_LIST}
														/>
													</FormGroup>
												</div>
											)}

											{/* Third Party TopUp */}
											{+filters.fundSource ===
												FUND_SOURCE_TYPE.LOCAL_AUTHORITY && (
												<div className='col-xl-2 col-lg-3 col-md-4 col-sm-6'>
													<FormGroup
														id='thirdPartyTopupStatus'
														label='Third Party TopUp'>
														<SearchableSelect
															id='thirdPartyTopupStatus'
															value={filters.thirdPartyTopupStatus}
															placeholder='Select Third Party TopUp Status'
															onChange={(e: any) =>
																onFilterChange(
																	'thirdPartyTopupStatus',
																	e.target.value,
																)
															}
															options={FAMILY_TOPUP_STATUS_LIST}
														/>
													</FormGroup>
												</div>
											)}

											{/* Client Contribution */}
											{+filters.fundSource ===
												FUND_SOURCE_TYPE.LOCAL_AUTHORITY && (
												<div className='col-xl-2 col-lg-3 col-md-4 col-sm-6'>
													<FormGroup
														id='clientContribution'
														label='CC Status'>
														<SearchableSelect
															id='clientContribution'
															value={filters.clientContribution}
															placeholder='Select CC Status'
															onChange={(e: any) =>
																onFilterChange(
																	'clientContribution',
																	e.target.value,
																)
															}
															options={FAMILY_TOPUP_STATUS_LIST}
														/>
													</FormGroup>
												</div>
											)}
										</>
									)}

									{/* Payment Status */}
									<div className='col-xl-2 col-lg-3 col-md-4 col-sm-6'>
										<FormGroup id='paymentStatus' label='Payment Status'>
											<SearchableSelect
												id='paymentStatus'
												placeholder='Select Payment Status'
												value={filters.paymentStatus}
												onChange={(e: any) =>
													onFilterChange('paymentStatus', e.target.value)
												}
												options={INVOICE_STATUS_TYPE_LIST}
											/>
										</FormGroup>
									</div>

									{/* Resident Status */}
									<div className='col-xl-2 col-lg-3 col-md-4 col-sm-6'>
										<FormGroup id='residentStatus' label='Resident Status'>
											<SearchableSelect
												id='residentStatus'
												placeholder='Select Resident Status'
												value={+filters.residentStatus}
												onChange={(e: any) =>
													onFilterChange('residentStatus', e.target.value)
												}
												options={RESIDENT_STATUS_LIST}
											/>
										</FormGroup>
									</div>
								</div>
							</CardBody>
						</Card>
					</div>
				</div>
			)}

			{/* ── Main table ─────────────────────────────────────────────── */}
			<div className='row h-100'>
				<div className='col-12'>
					<Card stretch>
						<CardHeader>
							<CardLabel icon='person'>
								<CardTitle className='h5'>Residents</CardTitle>
								<CardActions className='text-muted'>
									Total Residents: {residentNewList.length}
								</CardActions>
							</CardLabel>
							<Button
								icon='people'
								isLight
								color='primary'
								onClick={() => navigate('/resident/fromResidentPage')}>
								Add Resident
							</Button>
						</CardHeader>
						<CardBody>
							<DataTable
								fixed={true}
								columns={residentColumns}
								data={residentTableData}
								search={false}
								isLoading={isLoading}
								pagination={false}
							/>
						</CardBody>
					</Card>
				</div>
			</div>
		</>
	);
};
