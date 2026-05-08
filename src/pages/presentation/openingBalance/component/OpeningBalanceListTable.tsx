// src/pages/openingBalance/component/OpeningBalanceListTable.tsx
import React, { useMemo } from 'react';
import moment from 'moment';
import {
	Badge,
	Button,
	Dropdown,
	DropdownItem,
	DropdownMenu,
	DropdownToggle,
} from '../../../../components/bootstrap';
import {
	getColorByValue,
	getLabelByValue,
	getResidentInvoiceAddress,
	priceFormat,
} from '../../../../helpers/helpers';
import {
	CHART_OF_ACCOUNTS_CATEGORY_TYPE_LIST,
	OPENING_BALANCE_TO_TYPE_LIST,
	OPENING_BALANCE_TYPE_LIST,
} from '../../../../common/data/option';
import { useMasterData } from '../../../../contexts/mastersContext';
import { getColorNameWithIndex } from '../../../../common/data/enumColors';
import { DataTable, ResidentProfileCard } from '../../../../components/common';
import { CHART_OF_ACCOUNTS_CATEGORY_TYPE } from '../../../../common/constant';

type Props = {
	openingBalanceList: any[];
	onEdit: (item: any) => void;
	onDelete: (id: string) => void;
	isLoading:boolean;
};

const OpeningBalanceListTable: React.FC<Props> = ({ openingBalanceList, onEdit, onDelete,isLoading }) => {
	const {
		localAuthorityList = [],
		localICBList = [],
		fNCDetails,
		isLoading: isMasterLoading,
		isError: isMasterError,
	} = useMasterData();

	const handleGetPendingAmount = (item: any) => {
		const { totalPrice = 0, invoiceDetails = {} } = item;
		const { payedInfo = [], creditApply = [] } = invoiceDetails;

		const sum = (arr: any[]) =>
			arr.reduce((total, { amount }) => total + Number(amount || 0), 0);

		const totalPaid = sum(payedInfo);
		const totalCredits = sum(creditApply);

		return totalPrice - (totalPaid + totalCredits);
	};

	const openingBalanceTableData = useMemo(() => {
		return openingBalanceList?.map((item: any, i: number) => {
			const openingBalanceData  = item?.openingBalance;
			const fundShortName = getResidentInvoiceAddress(
				openingBalanceData?.residentData,
				+openingBalanceData?.openingBalanceTo,
				openingBalanceData?.fundTypeId,
				{
					localAuthorityList,
					localICBList,
					fNCDetails,
				},
			);


			return {
				openingBalance:{...openingBalanceData},
				...openingBalanceData,
				id: openingBalanceData?.id,
				fundShortName,
				colorIndex: getColorNameWithIndex(i),
				type:openingBalanceData?.coaMapping?.type,
			};
		});
	}, [openingBalanceList, localAuthorityList, localICBList, fNCDetails]);
	const openingBalanceColumns = [
		{
			label: 'Resident',
			key: 'resident',
			render: (row: any) => (
				<ResidentProfileCard resident={row?.residentData} colorIndex={row.colorIndex} />
			),
		},

		{
			label: 'Date',
			key: 'createdAt',	
			render: (row: any) =>
				row?.created?.date?.toDate
					? moment(row.created.date.toDate()).format('DD MMM YYYY')
					: '-',
		},

		{
			label: 'Balance To',
			key: 'openingBalanceTo',
			render: (row: any) =>
				getLabelByValue(OPENING_BALANCE_TO_TYPE_LIST, row.openingBalanceTo) || '-',
		},

		{
			label: 'Fund Name',
			key: 'fundName',
			render: (row: any) => row.fundShortName?.shortName || '-',
		},

		{
			label: 'Account Category',
			key: 'accountCategory',
			render: (row: any) => (
				<Badge
					isLight
					className='px-4 py-1 rounded-pill text-center fs-6'
					color={getColorByValue(
						CHART_OF_ACCOUNTS_CATEGORY_TYPE_LIST,
						row?.coaMapping?.category,
					)}>
					{getLabelByValue(
						CHART_OF_ACCOUNTS_CATEGORY_TYPE_LIST,
						row?.coaMapping?.category,
					) || '-'}
				</Badge>
			),
		},

		{
			label: 'Chart of Account Name',
			key: 'coaName',
			render: (row: any) => row?.coaMapping?.chartOfAccountDetail?.accountName || '-',
		},

		{
			label: 'Type',
			key: 'type',
			render: (row: any) => (
				<Badge
					isLight
					className='px-4 py-1 rounded-pill text-center fs-6'
					color={getColorByValue(OPENING_BALANCE_TYPE_LIST, row?.type)}>
					{getLabelByValue(OPENING_BALANCE_TYPE_LIST, row?.type)}
				</Badge>
			),
		},

		{
			label: 'Amount',
			key: 'totalPrice',
			sortable: true,
			render: (row: any) => (
				<span className='text-end d-block'>{priceFormat(Number(row.totalPrice || 0))}</span>
			),
		},

		{
			label: 'Actions',
			key: 'action',
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
								className='me-2'
								onClick={() => onEdit(row?.openingBalance)}>
								Edit
							</Button>
						</DropdownItem>

						<DropdownItem>
							<Button
								size='sm'
								color='danger'
								isLight
								icon='delete'
								onClick={() => onDelete(row?.openingBalance)}>
								Delete
							</Button>
						</DropdownItem>
					</DropdownMenu>
				</Dropdown>
			),
		},
	];

	return (
		<DataTable
			fixed={true}
			columns={openingBalanceColumns}
			data={openingBalanceTableData}
			search={false}
			isLoading={isLoading}
			pagination={false}
		/>
	);
};

export default OpeningBalanceListTable;
