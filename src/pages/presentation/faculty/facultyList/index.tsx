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
} from '../../../../components/bootstrap';

import InfiniteDataTable from '../../../../components/common/infinixDataTable';

import useDarkMode from '../../../../hooks/useDarkMode';
import { getFirstLetter } from '../../../../helpers/helpers';

import { IFaculty } from '../../../../common/interface/faculty';

type Props = {
	faculties: IFaculty[];
	isLoading: boolean;
	hasNextPage?: boolean;
	isFetchingNextPage?: boolean;
	fetchNextPage?: () => void;
	onEdit?: (faculty: IFaculty) => void;
	onDelete?: (faculty: IFaculty) => void;
};

const FacultyList: React.FC<Props> = ({
	faculties,
	isLoading,
	hasNextPage = false,
	isFetchingNextPage = false,
	fetchNextPage = () => {},
	onEdit = () => {},
	onDelete = () => {},
}) => {
	const { darkModeStatus } = useDarkMode();

	const columns = [
		{
			label: 'Faculty',
			key: 'firstName',
			render: (row: IFaculty) => (
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
									{getFirstLetter(
										row?.firstName || 'F',
									)}
								</span>
							</div>
						</div>
					</div>

					<div className='flex-grow-1'>
						<div className='fs-6 fw-bold'>
							{row?.firstName}{' '}
							{row?.lastName}
						</div>

						<div className='text-muted'>
							<small>{row?.email}</small>
						</div>
					</div>
				</div>
			),
		},

		{
			label: 'Employee Code',
			key: 'employeeCode',
			sortable: true,
			render: (row: IFaculty) => (
				<Badge
					isLight
					color='info'
					className='px-3 py-2 rounded-pill'>
					{row?.employeeCode || '-'}
				</Badge>
			),
		},

		{
			label: 'Designation',
			key: 'designation',
			render: (row: IFaculty) => (
				<Badge
					isLight
					color='primary'
					className='px-3 py-2 rounded-pill'>
					{row?.designation || '-'}
				</Badge>
			),
		},

		{
			label: 'Department',
			key: 'departmentName',
			render: (row: IFaculty) => (
				<div className='fw-semibold'>
					{row?.departmentName || '-'}
				</div>
			),
		},

		{
			label: 'Phone Number',
			key: 'phoneNumber',
			render: (row: IFaculty) => (
				<div>{row?.phoneNumber || '-'}</div>
			),
		},

		{
			label: 'Status',
			key: 'status',
			render: (row: IFaculty) => (
				<Badge
					isLight
					color={
						row?.status === 'ACTIVE'
							? 'success'
							: row?.status ===
								  'ON_LEAVE'
								? 'warning'
								: row?.status ===
									  'RETIRED'
									? 'secondary'
									: row?.status ===
										  'RESIGNED'
										? 'danger'
										: 'dark'
					}
					className='px-3 py-2 rounded-pill'>
					{row?.status || '-'}
				</Badge>
			),
		},

		{
			label: 'Actions',
			key: 'actions',
			render: (row: IFaculty) => (
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
								onClick={() =>
									onEdit(row)
								}>
								Edit
							</Button>
						</DropdownItem>

						<DropdownItem>
							<Button
								color='danger'
								isLight
								icon='delete'
								onClick={() =>
									onDelete(row)
								}>
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
				<CardLabel icon='Person'>
					<CardTitle className='h5'>
						Faculties
					</CardTitle>

					<CardActions className='text-muted'>
						Total Faculties:{' '}
						{faculties.length}
					</CardActions>
				</CardLabel>
			</CardHeader>

			<CardBody>
				<InfiniteDataTable
					columns={columns}
					data={faculties}
					isLoading={isLoading}
					isFetchingNextPage={
						isFetchingNextPage
					}
					hasNextPage={hasNextPage}
					fetchNextPage={fetchNextPage}
					noDataFound='No Faculties Found'
					fixed
					scrollHeight='650px'
				/>
			</CardBody>
		</Card>
	);
};

export default FacultyList;