// src/pages/purchaseOrder/components/PurchaseOrderList.tsx
import React, { useEffect, useMemo, useState } from 'react';

import {
	Badge,
	Button,
	Dropdown,
	DropdownItem,
	DropdownMenu,
	DropdownToggle,
} from '../../../../../components/bootstrap';
import useDarkMode from '../../../../../hooks/useDarkMode';
import {
	getColorByValue,
	getFirstLetter,
	getLabelByValue,
	priceFormat,
} from '../../../../../helpers/helpers';
import { PURCHASE_ORDER_STATUS_LIST } from '../../../../../common/data/option';
import { DataTable } from '../../../../../components/common';
import { PURCHASE_ORDER_STATUS, QUERY_KEY } from '../../../../../common/constant';
import { getAllVendors } from '../../../../../common/api/vendor';
import { useQuery } from '@tanstack/react-query';
import { getColorNameWithIndex } from '../../../../../common/data/enumColors';
import moment from 'moment';
import { IPurchaseOrderModal } from '../../../../../common/interface/purchaseOrder';
import { PurchaseOrderDetailViewModal } from '../purchaseOrderBillModal';
import { purchaseorderModal } from '../../../../../common/model/purchaseorder';
import { useSearch } from '../../../../../hooks';
import ReceiptDiscrepancyForm from '../receiptDiscrepancyForm';
import ConvertToBillModal from '../convertToBillModal';

type Props = {
	purchaseOrderList: any[];
	isLoading: boolean;
	onEdit: (row: any) => void;
	onDelete: (row: any) => void;
};

const PurchaseOrderList: React.FC<Props> = ({ purchaseOrderList, isLoading, onEdit, onDelete }) => {
	const { darkModeStatus } = useDarkMode();

	const [isPurchaseOrderBillOpen, setIsPurchaseOrderBillOpen] = useState(false);
	const [purchaseOrderData, setPurchaseOrderData] = useState<IPurchaseOrderModal>({
		...purchaseorderModal,
	});

	// All variable and fucntion related to ReceiptDiscrepancyForm
	const [isReceiptDiscrepancyFormOpen, setIsReceiptDiscrepancyFormOpen] =
		useState<boolean>(false);

	const handleOpenReceiptDiscrepancyForm = (item: IPurchaseOrderModal) => {
		setPurchaseOrderData(item);
		setIsReceiptDiscrepancyFormOpen(true);
	};
	const toggleReceiptDiscrepancyForm = () => {
		setIsReceiptDiscrepancyFormOpen(!isReceiptDiscrepancyFormOpen);
		setPurchaseOrderData({ ...purchaseorderModal });
	};

	// Convert to Bill
	const [isConvertToBillOpen, setIsConvertToBillOpen] = useState(false);
	const [convertToBillPO, setConvertToBillPO] = useState<IPurchaseOrderModal | null>(null);

	const handleOpenConvertToBill = (item: IPurchaseOrderModal) => {
		setConvertToBillPO(item);
		setIsConvertToBillOpen(true);
	};
	const toggleConvertToBill = () => {
		setIsConvertToBillOpen(false);
		setConvertToBillPO(null);
	};

	// All variable and function related to Bill
	const handleOpenPurchaseOrderBill = (item: IPurchaseOrderModal) => {
		setPurchaseOrderData(item);
		setIsPurchaseOrderBillOpen(true);
	};
	const togglePurchaseOrderBill = () => {
		setIsPurchaseOrderBillOpen(!isPurchaseOrderBillOpen);
		setPurchaseOrderData({ ...purchaseorderModal });
	};

	const columns = [
		{
			label: 'Vendor',
			key: 'vendorName',
			render: (row: any) => (
				<>
					<div className='d-flex align-items-center'>
						<div className='flex-shrink-0'>
							<div className='ratio ratio-1x1 me-3' style={{ width: 48 }}>
								<div
									className={`bg-l${darkModeStatus ? 'o25' : '25'}-${row?.colorIndex} text-${row?.colorIndex} rounded-2 d-flex align-items-center justify-content-center`}>
									<span className='fw-bold'>
										{getFirstLetter(row?.vendorName)}
									</span>
								</div>
							</div>
						</div>

						<div className='flex-grow-1'>
							<div className='fs-6 fw-bold'>{row?.vendorName || 'NA'}</div>

							<div className='text-muted d-inline-block'>
								<small>{row?.vendorEmail || '-'}</small>
							</div>
						</div>
					</div>
				</>
			),
		},
		{
			label: 'PO Code',
			key: 'code',
			sortable: true,
			render: (row: any) => `${row?.code}`,
		},
		{
			label: 'PO Date',
			key: 'date',
			render: (row: any) =>
				row?.purchaseOrder?.date
					? moment(row?.purchaseOrder?.date).format('DD-MMM-YYYY')
					: '-',
		},

		{
			label: 'VAT Amount',
			key: 'vatTotal',
			sortable: true,
			render: (row: any) => <div className='text-end'>{priceFormat(row?.vatTotal || 0)}</div>,
		},
		{
			label: 'Total Amount',
			key: 'totalPrice',
			sortable: true,
			render: (row: any) => {
				const purchaseOrder = row?.purchaseOrder;
				const existingApplied =
					purchaseOrder.debitApply?.reduce(
						(sum: number, d: any) => sum + (d.amount || 0),
						0,
					) || 0;

				const poActualTotal = (purchaseOrder.totalPrice || 0) - existingApplied;

				return <div className='text-end'>{priceFormat(poActualTotal)}</div>;
			},
		},
		{
			label: 'Status',
			key: 'status',
			render: (row: any) => (
				<Badge
					isLight
					color={getColorByValue(PURCHASE_ORDER_STATUS_LIST, row?.purchaseOrder?.status)}
					className='px-3 py-1 rounded-pill'>
					{getLabelByValue(PURCHASE_ORDER_STATUS_LIST, row?.purchaseOrder?.status)}
				</Badge>
			),
		},
		{
			label: 'Actions',
			key: 'actions',
			render: (row: any) => (
				<Dropdown>
					<DropdownToggle hasIcon={false}>
						<Button icon='MoreHoriz' color='dark' isLight shadow='sm' />
					</DropdownToggle>

					<DropdownMenu>
						{/* {row?.purchaseOrder?.status === PURCHASE_ORDER_STATUS.DRAFT && (
							<DropdownItem>
								<Button
									color='info'
									isLight
									icon='edit'
									onClick={() => onEdit(row?.purchaseOrder)}>
									Edit
								</Button>
							</DropdownItem>
						)} */}

						<DropdownItem>
							<Button
								color='info'
								isLight
								icon={
									+row?.purchaseOrder?.status === PURCHASE_ORDER_STATUS.DRAFT
										? 'edit'
										: 'visibility'
								}
								onClick={() => onEdit(row?.purchaseOrder)}>
								{+row?.purchaseOrder?.status === PURCHASE_ORDER_STATUS.DRAFT
									? 'edit'
									: 'view'}
							</Button>
						</DropdownItem>

						{(row?.purchaseOrder?.status === PURCHASE_ORDER_STATUS.DRAFT ||
							row?.purchaseOrder?.status === PURCHASE_ORDER_STATUS.PENDING) && (
							<DropdownItem>
								<Button
									color='danger'
									isLight
									icon='delete'
									onClick={() => onDelete(row?.purchaseOrder)}>
									Delete
								</Button>
							</DropdownItem>
						)}

						{[
							+PURCHASE_ORDER_STATUS.APPROVED,
							+PURCHASE_ORDER_STATUS.PARTIAL,
							+PURCHASE_ORDER_STATUS.COMPLETED,
							+PURCHASE_ORDER_STATUS.PENDING,
						].includes(+row?.purchaseOrder?.status) && (
							<DropdownItem>
								<Button
									color='info'
									isLight
									icon='receipt'
									onClick={() => handleOpenPurchaseOrderBill(row?.purchaseOrder)}>
									View PO
								</Button>
							</DropdownItem>
						)}

						{(row?.purchaseOrder?.status === PURCHASE_ORDER_STATUS.PARTIAL ||
							row?.purchaseOrder?.status === PURCHASE_ORDER_STATUS.COMPLETED) && (
							<DropdownItem>
								<Button
									color='danger'
									isLight
									icon='RemoveCircle'
									onClick={() =>
										handleOpenReceiptDiscrepancyForm(row?.purchaseOrder)
									}>
									Debit
								</Button>
							</DropdownItem>
						)}

						{(row?.purchaseOrder?.status === PURCHASE_ORDER_STATUS.PARTIAL ||
							row?.purchaseOrder?.status === PURCHASE_ORDER_STATUS.COMPLETED) && (
							<DropdownItem>
								<Button
									color='success'
									isLight
									icon='ReceiptLong'
									onClick={() => handleOpenConvertToBill(row?.purchaseOrder)}>
									Convert to Bill
								</Button>
							</DropdownItem>
						)}
					</DropdownMenu>
				</Dropdown>
			),
		},
	];

	return (
		<>
			<DataTable
				fixed
				columns={columns}
				data={purchaseOrderList}
				search={false}
				isLoading={isLoading}
				pagination={true}
				noDataFound='No Purchase Order Found'
			/>
			<PurchaseOrderDetailViewModal
				isOpen={isPurchaseOrderBillOpen}
				toggle={togglePurchaseOrderBill}
				purchaseOrderData={purchaseOrderData}
			/>

			<ReceiptDiscrepancyForm
				isOpen={isReceiptDiscrepancyFormOpen}
				toggle={toggleReceiptDiscrepancyForm}
				purchaseOrderDetail={purchaseOrderData}
			/>

			<ConvertToBillModal
				isOpen={isConvertToBillOpen}
				toggle={toggleConvertToBill}
				purchaseOrder={convertToBillPO}
			/>
		</>
	);
};

export default PurchaseOrderList;
