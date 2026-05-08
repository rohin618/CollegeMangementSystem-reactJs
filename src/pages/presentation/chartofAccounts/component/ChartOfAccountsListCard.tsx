import { useMemo } from 'react';
import {
	CHART_OF_ACCOUNTS_CATEGORY_TYPE_LIST,
	CHART_OF_ACCOUNTS_STATUS_LIST,
} from '../../../../common/data/option';
import {
	Badge,
	Button,
	Dropdown,
	DropdownItem,
	DropdownMenu,
	DropdownToggle,
	Popovers,
} from '../../../../components/bootstrap';
import { formatCreatedAt, getColorByValue, getLabelByValue } from '../../../../helpers/helpers';
import { DataTable } from '../../../../components/common';
import classNames from 'classnames';
import useDarkMode from '../../../../hooks/useDarkMode';

const ChartOfAccountsListCard = ({ chartList, onEdit, onDelete }: any) => {
	const { darkModeStatus } = useDarkMode();
	const chartOfAccountTableData = useMemo(() => {
		return chartList.map((acc: any) => {
			const categoryType = getLabelByValue(
				CHART_OF_ACCOUNTS_CATEGORY_TYPE_LIST,
				acc.categoryType,
			);
			return {
				id: acc.id,
				...acc,
				categoryTypeLabel: categoryType,
			};
		});
	}, [chartList]);

	const chartAccountColumns = [
		{
			label: 'Account Code',
			key: 'code',
			sortable: true,
			render: (row: any) => row.code,
		},

		{
			label: 'Account Name',
			key: 'accountName',
			sortable: true,
			render: (row: any) => row.accountName,
		},

		{
			label: 'Account Type',
			key: 'categoryType',
			render: (row: any) => (
				<Badge
					isLight
                    className='px-4 py-1 rounded-pill text-center fs-6'
					color={getColorByValue(CHART_OF_ACCOUNTS_CATEGORY_TYPE_LIST, row.categoryType)}>
					{row?.categoryTypeLabel}
				</Badge>
			),
		},

		{
			label: 'Description',
			key: 'description',
			render: (row: any) => {
				const fullDesc = row?.description || '';
				const shortDesc = fullDesc.length > 50 ? fullDesc.slice(0, 50) + '…' : fullDesc;

				return (
					<>
						<Popovers desc={fullDesc} trigger='hover'>
							<div style={{textWrap:'wrap'}}>{shortDesc}</div>
						</Popovers>
					</>
				);
			},
		},

		{
			label: 'Created At',
			key: 'createdAt',
			render: (row: any) => formatCreatedAt(row?.created?.date),
		},

		{
			label: 'Status',
			key: 'status',
			render: (row: any) => (
				<Badge
					isLight
					color={getColorByValue(CHART_OF_ACCOUNTS_STATUS_LIST, row.status)}
					className='fw-bold px-4 py-1 rounded-pill text-center fs-6'>
					{getLabelByValue(CHART_OF_ACCOUNTS_STATUS_LIST, row.status)}
				</Badge>
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
								onClick={() => onEdit(row)}>
								Edit
							</Button>
						</DropdownItem>

						<DropdownItem>
							<Button
								size='sm'
								color='danger'
								isLight
								icon='delete'
								onClick={() => onDelete(row.id)}>
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
			columns={chartAccountColumns}
			data={chartOfAccountTableData}
			search={false}
			// isLoading={isLoading}
			pagination={false}
			noDataFound='No Chart of Account Found'
		/>
	);
};

export default ChartOfAccountsListCard;
