import React from 'react';
import {
	Badge,
	Button,
	Card,
	CardActions,
	CardBody,
	CardHeader,
	CardLabel,
	CardTitle,
	Dropdown,
	DropdownItem,
	DropdownMenu,
	DropdownToggle,
} from '../../../../../components/bootstrap';

import useDarkMode from '../../../../../hooks/useDarkMode';
import { getFirstLetter } from '../../../../../helpers/helpers';

import InfiniteDataTable from '../../../../../components/common/infinixDataTable';
import { IDepartment } from '../../../../../common/interface/departments';

type Props = {
	departments: IDepartment[];
	isLoading: boolean;
	onEdit?: (department: IDepartment) => void;
	onDelete?: (department: IDepartment) => void;
};

const DepartmentList: React.FC<Props> = ({
	departments,
	isLoading,
	onEdit = () => {},
	onDelete = () => {},
}) => {
	const { darkModeStatus } = useDarkMode();

	const columns = [
		{
			label: 'Department',
			key: 'name',
			render: (row: IDepartment) => (
				<div className='d-flex align-items-center'>
					<div className='flex-shrink-0'>
						<div
							className='ratio ratio-1x1 me-3'
							style={{ width: 48 }}>
							<div
								className={`bg-l${
									darkModeStatus ? 'o25' : '25'
								}-primary text-primary rounded-2 d-flex align-items-center justify-content-center`}>
								<span className='fw-bold'>
									{getFirstLetter(row?.name || 'D')}
								</span>
							</div>
						</div>
					</div>

					<div className='flex-grow-1'>
						<div className='fs-6 fw-bold'>
							{row?.name || '-'}
						</div>

						<div className='text-muted'>
							<small>{row?.description || '-'}</small>
						</div>
					</div>
				</div>
			),
		},

		{
			label: 'Code',
			key: 'code',
			sortable: true,
			render: (row: IDepartment) => (
				<Badge
					isLight
					color='info'
					className='px-3 py-2 rounded-pill'>
					{row?.code || '-'}
				</Badge>
			),
		},

		{
			label: 'Status',
			key: 'status',
			render: (row: IDepartment) => (
				<Badge
					isLight
					color={
						row?.status === 'ACTIVE'
							? 'success'
							: 'danger'
					}
					className='px-3 py-2 rounded-pill'>
					{row?.status || '-'}
				</Badge>
			),
		},

		{
			label: 'Actions',
			key: 'actions',
			render: (row: IDepartment) => (
				<Dropdown>
					<DropdownToggle hasIcon={false}>
						<Button
							icon='MoreHoriz'
							color='dark'
							isLight
							shadow='sm'
						/>
					</DropdownToggle>

					<DropdownMenu>
						<DropdownItem>
							<Button
								color='info'
								isLight
								icon='edit'
								onClick={() => onEdit(row)}>
								Edit
							</Button>
						</DropdownItem>

						<DropdownItem>
							<Button
								color='danger'
								isLight
								icon='delete'
								onClick={() => onDelete(row)}>
								Delete
							</Button>
						</DropdownItem>
					</DropdownMenu>
				</Dropdown>
			),
		},
	];

	return (
		<Card stretch>
			<CardHeader>
				<CardLabel icon='Apartment'>
					<CardTitle className='h5'>Departments</CardTitle>

					<CardActions className='text-muted'>
						Total Departments: {departments.length}
					</CardActions>
				</CardLabel>
			</CardHeader>

			<CardBody>
				<InfiniteDataTable
					columns={columns}
					data={departments}
					isLoading={isLoading}
					isFetchingNextPage={false}
					hasNextPage={false}
					fetchNextPage={() => {}}
					noDataFound='No Departments Found'
					fixed
					scrollHeight='650px'
				/>
			</CardBody>
		</Card>
	);
};

export default DepartmentList;