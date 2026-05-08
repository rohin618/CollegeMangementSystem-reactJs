import React, { useCallback, useEffect, useMemo, useState } from 'react';
import moment from 'moment';
import {
	Card,
	CardBody,
	CardHeader,
	CardLabel,
	CardTitle,
	Button,
	Dropdown,
	DropdownToggle,
	DropdownMenu,
	DropdownItem,
	FormGroup,
	Select,
	Option,
	CardActions,
} from '../../../../components/bootstrap';
import Icon from '../../../../components/icon';
import {
	getLabelByValue,
	getResidentInvoiceAddress,
	priceFormat,
} from '../../../../helpers/helpers';
import { CREDIT_TYPE_STAUS_LIST, INVOICE_TO_TYPE_LIST } from '../../../../common/data/option';
import { CREDIT_STATUS, CREDIT_TYPE } from '../../../../common/constant';
import classNames from 'classnames';
import useDarkMode from '../../../../hooks/useDarkMode';
import { CreditNoteDoc } from '../../creditWallet/component/creditNoteDoc';
import { DataTable, ResidentProfileCard, SearchableSelect } from '../../../../components/common';
import { getColorNameWithIndex } from '../../../../common/data/enumColors';
import { useMasterData } from '../../../../contexts/mastersContext';
import { InvoiceDetailViewModal } from '../../invoice/component';
import { useMultiSearch, useRemoveItemQueryListById, useSearch } from '../../../../hooks';
import Swal from 'sweetalert2';
import { deleteCreditWallet } from '../../../../common/api/creditWalet';
import { ICreditWalletModel } from '../../../../common/interface';
import { CreditNotesForm } from './creditNotesForm';
import { downloadOverAllCreditNotesListAsExcel, downloadOverAllCreditNotesListAsPDF } from '../../../../helpers/exportExcel';

interface ResidentCreditNotesProps {
	creditWalletList: any[];
	onViewInvoice?: (invoice: any, residentData: any) => void;
	isFilterOpen: boolean;
	setFilterDataSize: (size: number) => void;
	isLoading: boolean;
}

export const ResidentCreditNotes: React.FC<ResidentCreditNotesProps> = ({
	creditWalletList = [],
	onViewInvoice,
	isFilterOpen,
	setFilterDataSize,
	isLoading,
}) => {
	const { darkModeStatus } = useDarkMode();
	const [isDetailICreditInfoModal, setIsDetailICreditInfoModal] = useState(false);
	const [creditDetailInfo, setCreditDetailInfo] = useState<any>({});
	const [isOpenEditCreditModel, setIsOpenEditCreditModel] = useState(false);
	const [invoiceDetailInfo, setInvoiceDetailInfo] = useState<any>({});
	const [isDetailInvoiceInfoModal, setIsDetailInvoiceInfoModal] = useState(false);
	const [editCreditDetailInfo, setEditCreditDetailInfo] = useState<ICreditWalletModel>();
	const { removeItemById: removeCreditWalletById } = useRemoveItemQueryListById<any>({
		queryKey: ['creditNotesListByCompanyId'],
	});
	const [filterFromObject, setFilterFromObject] = useState<any>({
		creditTo: '',
	});

	const filteredCreditWalletList = useMultiSearch(creditWalletList, filterFromObject);

	const handleChangeFilter = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = event.target;

		setFilterFromObject((prev: any) => ({
			...prev,
			[name]: value,
		}));
	};
	const handleResetFilter = () => {
		setFilterFromObject({
			creditTo: '',
		});
	};

	useEffect(() => {
		setFilterDataSize(filteredCreditWalletList.length);
	}, [filteredCreditWalletList]);

	const {
		localAuthorityList = [],
		localICBList = [],
		fNCDetails,
		isLoading: isMasterLoading,
	} = useMasterData();

	const handleOpenCreditDetail = (credit: any) => {
		setCreditDetailInfo(credit);
		setIsDetailICreditInfoModal(true);
	};
	const handleCloseCreditDetail = () => {
		setIsDetailICreditInfoModal(false);
		setCreditDetailInfo({});
	};

	const openInvoiceDetail = (invoice: any, residentData: any) => {
		setInvoiceDetailInfo({ ...invoice, residentData });
		setIsDetailInvoiceInfoModal(true);
	};

	/** 🔹 Delete Credit Wallet */
	const handleOpenDeleteWallet = useCallback(
		async (wallet: ICreditWalletModel) => {
			if (!wallet?.id) return;

			const confirm = await Swal.fire({
				title: 'Are you sure?',
				text: "You won't be able to revert this!",
				icon: 'warning',
				showCancelButton: true,
				confirmButtonText: 'Yes, delete it!',
				cancelButtonText: 'Cancel',
				confirmButtonColor: '#3085d6',
				cancelButtonColor: '#d33',
			});

			if (!confirm.isConfirmed) return;

			// ✅ Total applied credit
			const creditApplied = (wallet.creditApply || []).reduce(
				(sum, { amount }) => sum + Number(amount || 0),
				0,
			);

			// ✅ Build invoice list as plain HTML
			const invoiceCodesHtml = (wallet.invoices || [])
				.map((inv: any) => `<b>#${inv.code}</b>`)
				.join(', ');

			// ✅ Safe remaining balance
			const remainingBalance = Math.max(0, Number(wallet.creditAmount || 0) - creditApplied);

			if (creditApplied > 0) {
				await Swal.fire({
					icon: 'warning',
					title: 'Cannot Delete Credit',
					html: `
          <p>
            Credit Wallet <b>${wallet.code}</b> has been used in
            Invoice(s): ${invoiceCodesHtml}
          </p>
          <p>
            Used Amount: <b>${priceFormat(creditApplied)}</b><br/>
            Available Balance: <b>${priceFormat(remainingBalance)}</b>
          </p>
          <p>
            Since this credit has already been applied, it cannot be deleted.
          </p>
        `,
				});
				return;
			}

			// ✅ Delete safely
			await deleteCreditWallet(wallet.id);
			removeCreditWalletById(wallet.id);

		},
		[deleteCreditWallet, removeCreditWalletById, filteredCreditWalletList],
	);


	const handleOpenEditCreditNoteModal = (creditDetail: ICreditWalletModel) => {
		setEditCreditDetailInfo(creditDetail)
		setIsOpenEditCreditModel(true)

	}

	const handleCloseCreditModal = () => {
		setIsOpenEditCreditModel(false)
	}

	const creditTableData = useMemo(() => {
		return filteredCreditWalletList.map((credit: any, index: number) => {
			const statusColor = +CREDIT_STATUS.ACTIVE === +credit.status ? 'success' : 'danger';
			const colorIndex = getColorNameWithIndex(index);
			const invoiceAddress = getResidentInvoiceAddress(
				credit?.residentData,
				+credit.creditTo,
				credit?.fundTypeId,
				{
					localAuthorityList,
					localICBList,
					fNCDetails,
				},
			);

			return {
				id: credit.id,
				...credit,
				colorIndex,
				invoiceAddress,
				statusColor,
				date: credit?.date,
			};
		});
	}, [filteredCreditWalletList]);

	const creditNoteColumns = [
		{
			label: 'Resident Name',
			key: 'resident',
			render: (row: any) => (
				<ResidentProfileCard resident={row?.residentData} colorIndex={row.colorIndex} />
			),
		},

		{
			label: 'Credit Note No',
			key: 'code',
			sortable: true,
			render: (row: any) => row?.code,
		},

		{
			label: 'Credit Note Date',
			key: 'date',
			sortable: true,
			render: (row: any) => (row?.date ? moment(row.date).format('DD MMM YYYY') : '-'),
		},

		{
			label: 'Category',
			key: 'category',
			render: (row: any) => row?.invoiceAddress?.shortName || 'NA',
		},

		{
			label: 'Amount Before VAT',
			key: 'subTotal',
			sortable: true,
			render: (row: any) => priceFormat(row?.subTotal || 0),
		},

		{
			label: 'VAT Amount',
			key: 'vatTotal',
			sortable: true,
			render: (row: any) => priceFormat(row?.vatTotal || 0),
		},

		{
			label: 'Credit Note Amount',
			key: 'creditAmount',
			sortable: true,
			render: (row: any) => priceFormat(row?.creditAmount || 0),
		},

		{
			label: 'Invoice Number Linked',
			key: 'invoices',
			render: (row: any) =>
				row?.invoices?.length > 0 ? (
					<div className='flex flex-wrap gap-2'>
						{row.invoices.map((invoice: any) => (
							<Button
								key={invoice.id}
								isLight
								color='primary'
								size='sm'
								onClick={() => openInvoiceDetail(invoice, row?.residentData)}
								className='gap-1 h-8 text-xs'>
								#{invoice.code}
							</Button>
						))}
					</div>
				) : (
					<span className='text-xs text-muted'>No invoices</span>
				),
		},

		{
			label: 'Status',
			key: 'status',
			render: (row: any) => (
				<div
					className={classNames(
						`bg-l${darkModeStatus ? 'o25' : '10'}-${row.statusColor}`,
						`text-${row.statusColor}`,
						'fw-bold py-1 px-3 rounded-pill text-center',
					)}>
					{getLabelByValue(CREDIT_TYPE_STAUS_LIST, +row.status)}
				</div>
			),
		},

		{
			label: 'Action',
			key: 'action',
			render: (row: any) => (
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

					<DropdownMenu isAlignmentEnd>
						<DropdownItem>
							<Button icon='Visibility' onClick={() => handleOpenCreditDetail(row)}>
								View
							</Button>
						</DropdownItem>
						<DropdownItem>
							<Button icon='edit' onClick={() => handleOpenEditCreditNoteModal(row)}>
								Edit
							</Button>
						</DropdownItem>

						<DropdownItem>
							<Button icon='delete' onClick={() => handleOpenDeleteWallet(row)}>
								Delete
							</Button>
						</DropdownItem>
					</DropdownMenu>
				</Dropdown>
			),
		},
	];

	return (
		<>
			{isFilterOpen && (
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
								onClick={handleResetFilter}>
								<Icon icon='Refresh' size='lg' className='text-primary' />
								Reset
							</Button>
						</div>
					</CardHeader>
					<CardBody>
						<div className='row mb-4'>
							<div className='col-md-4'>
								<FormGroup id='searchList' label='Credit To' isFloating>
									<SearchableSelect
										name='creditTo'
										id='creditTo'
										value={filterFromObject.creditTo}
										onChange={handleChangeFilter}
										options={INVOICE_TO_TYPE_LIST}
										placeholder='Select Credit To'
									/>

								</FormGroup>
							</div>
						</div>
					</CardBody>
				</Card>
			)}
			<div className='row h-100'>
				<div className='col-12'>
					<Card className='shadow-3d-primary' stretch>
						<CardHeader>
							<CardLabel icon='ReceiptLong'>
								<CardTitle tag='div' className='h5 text-primary fw-semibold'>
									Resident Credit Notes
								</CardTitle>
								<div className='text-muted fw-normal'>
									Total records: {filteredCreditWalletList.length}
								</div>
							</CardLabel>
							<CardActions>
								
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
												onClick={() => downloadOverAllCreditNotesListAsPDF(creditTableData)}>
												PDF
											</Button>
										</DropdownItem>
										<DropdownItem>
											<Button icon='Excel' onClick={() => downloadOverAllCreditNotesListAsExcel(creditTableData)}>
												Excel
											</Button>
										</DropdownItem>
									</DropdownMenu>
								</Dropdown>
							</CardActions>
						</CardHeader>

						<CardBody className='p-3'>
							<DataTable
								fixed={true}
								columns={creditNoteColumns}
								data={creditTableData}
								search={false}
								isLoading={isLoading}
								pagination={false}
								noDataFound='No Credit Found'
							/>
						</CardBody>
						<InvoiceDetailViewModal
							fNCDetails={fNCDetails}
							localICBList={localICBList}
							localAuthorityList={localAuthorityList}
							toggle={() => setIsDetailInvoiceInfoModal(false)}
							residentData={invoiceDetailInfo?.residentData}
							detailInvoiceInfo={invoiceDetailInfo}
							isOpen={isDetailInvoiceInfoModal}
						/>
						<CreditNoteDoc
							isOpen={isDetailICreditInfoModal}
							toggle={handleCloseCreditDetail}
							creditDetailInfo={creditDetailInfo}
						/>
						<CreditNotesForm editCreditDetailInfo={editCreditDetailInfo} isOpen={isOpenEditCreditModel} toggle={handleCloseCreditModal} />
					</Card>
				</div>
			</div>
		</>
	);
};
