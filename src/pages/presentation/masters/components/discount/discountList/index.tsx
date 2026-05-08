import React, { useMemo } from 'react';
import useDarkMode from '../../../../../../hooks/useDarkMode';

import { getColorNameWithIndex } from '../../../../../../common/data/enumColors';
import {
	getColorByValue,
	getFirstLetter,
	getLabelByValue,
	priceFormat,
} from '../../../../../../helpers/helpers';

import {
	Badge,
	Button,
	Dropdown,
	DropdownItem,
	DropdownMenu,
	DropdownToggle,
} from '../../../../../../components/bootstrap';

import { DataTable } from '../../../../../../components/common';

import { IDiscountModel } from '../../../../../../common/interface/discount';

import { DISCOUNT_STATUS_LIST, DISCOUNT_TYPE_LIST } from '../../../../../../common/data/option';
import { DISCOUNT_STATUS, DISCOUNT_TYPE } from '../../../../../../common/constant';

type Props = {
	discountList: any[];
	onEdit: (item: IDiscountModel) => void;
	onDelete: (item: IDiscountModel) => void;
	handleToggleDiscountStatus: (item: any) => void;
	isLoading?: boolean;
};

const DiscountList: React.FC<Props> = ({
	discountList,
	onEdit,
	onDelete,
	isLoading,
	handleToggleDiscountStatus,
}) => {
	const { darkModeStatus } = useDarkMode();

	// prepare table data
	const discountTableData = useMemo(() => {
		return discountList.map((item, index) => ({
			...item,
			colorIndex: getColorNameWithIndex(index),
		}));
	}, [discountList]);

	const discountColumns = [
		{
			label: 'Discount',
			key: 'name',
			render: (row: IDiscountModel & { colorIndex: string }) => (
				<div className='d-flex align-items-center'>
					<div className='flex-shrink-0'>
						<div className='ratio ratio-1x1 me-3' style={{ width: 40 }}>
							<div
								className={`bg-l${darkModeStatus ? 'o25' : '25'}-${row.colorIndex}
                text-${row.colorIndex}
                rounded-2 d-flex align-items-center justify-content-center`}>
								<span className='fw-bold'>{getFirstLetter(row?.name)}</span>
							</div>
						</div>
					</div>

					<div className='flex-grow-1'>
						<div className='fw-semibold'>{row?.name}</div>
						<div className='text-muted small'>{row?.code}</div>
					</div>
				</div>
			),
		},

		{
			label: 'Type',
			key: 'discountType',
			render: (row: IDiscountModel) =>
				getLabelByValue(DISCOUNT_TYPE_LIST, row.discountType) || '-',
		},

		{
			label: 'Discount Value',
			key: 'discountValue',
			render: (row: IDiscountModel) =>
				row.discountType === DISCOUNT_TYPE.PERCENTAGE
					? `${row?.discountValue}%`
					: priceFormat(row?.discountAmount || 0),
		},

		{
			label: 'Usage Limit',
			key: 'usageLimit',
			render: (row: IDiscountModel) =>
				row.usageLimit ? `${row.usedCount || 0}/${row.usageLimit}` : 'Unlimited',
		},

		{
			label: 'Status',
			key: 'status',
			render: (row: IDiscountModel) => (
				<Badge
					isLight
					color={getColorByValue(DISCOUNT_STATUS_LIST, row.status)}
					className='px-3 py-1 rounded-pill'>
					{getLabelByValue(DISCOUNT_STATUS_LIST, row.status)}
				</Badge>
			),
		},

		{
			label: 'Actions',
			key: 'actions',
			render: (row: IDiscountModel) => (
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
								onClick={() => onEdit(row)}>
								Edit
							</Button>
						</DropdownItem>

						{onDelete && (
							<DropdownItem>
								<Button
									size='sm'
									color='danger'
									isLight
									icon='delete'
									onClick={() => onDelete(row)}>
									Delete
								</Button>
							</DropdownItem>
						)}
						<DropdownItem>
							<Button
								icon={
									+row?.status === DISCOUNT_STATUS.ACTIVE
										? 'Block'
										: 'CheckCircle'
								}
								onClick={() => handleToggleDiscountStatus(row)}>
								{+row?.status === DISCOUNT_STATUS.ACTIVE
									? 'Deactivate'
									: 'Activate'}
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
			columns={discountColumns}
			data={discountTableData}
			search={false}
			isLoading={isLoading}
			pagination={false}
		/>
	);
};

export default DiscountList;
