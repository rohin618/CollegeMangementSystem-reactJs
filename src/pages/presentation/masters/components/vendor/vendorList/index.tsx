// src/pages/vendor/components/VendorList.tsx
import React, { useMemo } from 'react';
import useDarkMode from '../../../../../../hooks/useDarkMode';
import { getColorNameWithIndex } from '../../../../../../common/data/enumColors';
import {
	getColorByValue,
	getFirstLetter,
	getLabelByValue,
} from '../../../../../../helpers/helpers';
import {
	Badge,
	Button,
	Dropdown,
	DropdownItem,
	DropdownMenu,
	DropdownToggle,
	Popovers,
} from '../../../../../../components/bootstrap';
import { PAYMENT_METHOD_LIST, VENDOR_STATUS_LIST } from '../../../../../../common/data/option';
import { VENDOR_STATUS } from '../../../../../../common/constant';
import { DataTable } from '../../../../../../components/common';

type Props = {
	vendorList: any[];
	onEdit: (item: any) => void;
	onDelete: (item: any) => void;
	isLoading: boolean;
	handleToggleVendorStatus: (vendor: any) => void;
};

const VendorList: React.FC<Props> = ({
	vendorList,
	onEdit,
	onDelete,
	isLoading,
	handleToggleVendorStatus,
}) => {
	const { darkModeStatus } = useDarkMode();
	// prepare table data
	const vendorTableData = useMemo(() => {

		return vendorList.map((item: any, index: number) => ({
			...item,
			id: item.id,
			colorIndex: getColorNameWithIndex(index),
		}));
	}, [vendorList]);

	const removeUnncessaryKeys = (row: any) => {
		const { colorIndex, ...cleanProduct } = row;
		return cleanProduct;
	};

	// table columns
	const vendorColumns = [
		{
			label: 'Vendor',
			key: 'name',
			sortable: true,
			render: (row: any) => (
				<div className='d-flex align-items-center'>
					<div className='flex-shrink-0'>
						<div className='ratio ratio-1x1 me-3' style={{ width: 48 }}>
							<div
								className={`bg-l${darkModeStatus ? 'o25' : '25'}-${row?.colorIndex} text-${row?.colorIndex} rounded-2 d-flex align-items-center justify-content-center`}>
								<span className='fw-bold'>{getFirstLetter(row?.name)}</span>
							</div>
						</div>
					</div>

					<div className='flex-grow-1'>
						<div className='fs-6 fw-bold'>{row?.name || 'NA'}</div>

						<div className='text-muted d-inline-block'>
							<small>{row?.emailId || '-'}</small>
						</div>
					</div>
				</div>
			),
		},
		{
			label: 'Code',
			key: 'code',
			render: (row: any) => 'V' + row.code || '-',
		},
		{
			label: 'Trade Name',
			key: 'tradeName',
			render: (row: any) => row.tradeName || '-',
		},
		{
			label: 'Payment Mode',
			key: 'paymentMode',
			render: (row: any) => getLabelByValue(PAYMENT_METHOD_LIST, row.paymentMode) || '-',
		},
		{
			label: 'Location',
			key: 'location',
			render: (row: any) => {
				const locationParts = [
					row.addressLine1,
					row.addressLine2,
					row.city,
					row.postCode,
					row.country,
				].filter(Boolean);

				return locationParts.length ? (
					<Popovers desc={locationParts.join(', ')} trigger='hover'>
						<div className=' text-truncate' style={{ maxWidth: 180 }}>
							{locationParts.join(', ')}
						</div>
					</Popovers>
				) : (
					'-'
				);
			},
		},

		{
			label: 'Primary Email',
			key: 'primaryEmail',
			render: (row: any) =>
				row.emails?.find((e: any) => e.isPrimary)?.email || row.emailId || '-',
		},
		{
			label: 'Primary Phone',
			key: 'primaryPhone',
			render: (row: any) =>
				row.phones?.find((p: any) => p.isPrimary)?.phone || row.primaryPhone || '-',
		},
		{
			label: 'VAT Reg No',
			key: 'vatRegNo',
			render: (row: any) => row.vatRegNo || '-',
		},
		{
			label: 'Reference No',
			key: 'referenceNo',
			render: (row: any) => row.referenceNo || '-',
		},
		{
			label: 'Status',
			key: 'status',
			render: (row: any) => (
				<Badge
					isLight
					color={getColorByValue(VENDOR_STATUS_LIST, row.status)}
					className='px-3 py-1 rounded-pill'>
					{getLabelByValue(VENDOR_STATUS_LIST, row.status)}
				</Badge>
			),
		},
		{
			label: 'Rating',
			key: 'overallRating',
			render: (row: any) => {
				const r = row.overallRating;
				if (!r) return <span className='text-muted'>-</span>;
				const color: 'success' | 'warning' | 'danger' =
					r >= 4 ? 'success' : r >= 3 ? 'warning' : 'danger';
				return (
					<Badge isLight color={color}>
						★ {r} / 5
					</Badge>
				);
			},
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
						<DropdownItem>
							<Button
								size='sm'
								color='info'
								isLight
								icon='edit'
								onClick={() => onEdit(removeUnncessaryKeys(row))}>
								Edit
							</Button>
						</DropdownItem>

						<DropdownItem>
							<Button
								size='sm'
								color='danger'
								isLight
								icon='delete'
								onClick={() => onDelete(removeUnncessaryKeys(row))}>
								Delete
							</Button>
						</DropdownItem>

						<DropdownItem isDivider />

						<DropdownItem>
							<Button
								icon={
									+row.status === VENDOR_STATUS.ACTIVE ? 'Block' : 'CheckCircle'
								}
								onClick={() => handleToggleVendorStatus(removeUnncessaryKeys(row))}>
								{+row.status === VENDOR_STATUS.ACTIVE ? 'Deactivate' : 'Activate'}
							</Button>
						</DropdownItem>
					</DropdownMenu>
				</Dropdown>
			),
		},
	];

	return (
		<DataTable
			fixed
			columns={vendorColumns}
			data={vendorTableData}
			search={false}
			isLoading={isLoading}
			pagination={false}
			noDataFound={'No vendors found'}
		/>
	);
};

export default VendorList;
