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

import { IStudent } from '../../../../common/interface/student';

type Props = {
	students: IStudent[];
	isLoading: boolean;
	hasNextPage?: boolean;
	isFetchingNextPage?: boolean;
	fetchNextPage?: () => void;
	onEdit?: (student: IStudent) => void;
	onDelete?: (student: IStudent) => void;
};

const StudentList: React.FC<Props> = ({
	students,
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
			label: 'Student',
			key: 'firstName',
			render: (row: IStudent) => (
				<div className='d-flex align-items-center'>
					<div className='flex-shrink-0'>
						<div className='ratio ratio-1x1 me-3' style={{ width: 48 }}>
							<div
								className={`bg-l${
									darkModeStatus ? 'o25' : '25'
								}-primary text-primary rounded-2 d-flex align-items-center justify-content-center`}>
								<span className='fw-bold'>
									{getFirstLetter(`${row?.firstName || ''}`)}
								</span>
							</div>
						</div>
					</div>

					<div className='flex-grow-1'>
						<div className='fs-6 fw-bold'>
							{row?.firstName} {row?.lastName}
						</div>

						<div className='text-muted'>
							<small>{row?.email}</small>
						</div>
					</div>
				</div>
			),
		},

		{
			label: 'Register No',
			key: 'registerNumber',
			sortable: true,
			render: (row: IStudent) => (
				<Badge isLight color='info' className='px-3 py-2 rounded-pill'>
					{row?.registerNumber}
				</Badge>
			),
		},

		{
			label: 'Department',
			key: 'departmentName',
			render: (row: IStudent) => (
				<div className='fw-semibold'>{row?.departmentName || '-'}</div>
			),
		},

		{
			label: 'Academic Batch',
			key: 'academicBatchName',
			render: (row: IStudent) => (
				<Badge isLight color='primary' className='px-3 py-2 rounded-pill'>
					{row?.academicBatchName || '-'}
				</Badge>
			),
		},

		{
			label: 'Semester',
			key: 'semesterName',
			render: (row: IStudent) => (
				<Badge isLight color='warning' className='px-3 py-2 rounded-pill'>
					{row?.semesterName || '-'}
				</Badge>
			),
		},

		{
			label: 'Gender',
			key: 'gender',
			render: (row: IStudent) => (
				<Badge isLight color='secondary' className='px-3 py-2 rounded-pill'>
					{row?.gender || '-'}
				</Badge>
			),
		},

		{
			label: 'Status',
			key: 'status',
			render: (row: IStudent) => (
				<Badge
					isLight
					color={
						row?.status === 'ACTIVE'
							? 'success'
							: row?.status === 'GRADUATED'
								? 'primary'
								: row?.status === 'INACTIVE'
									? 'secondary'
									: 'danger'
					}
					className='px-3 py-2 rounded-pill'>
					{row?.status}
				</Badge>
			),
		},

		{
			label: 'Actions',
			key: 'actions',
			render: (row: IStudent) => (
				<Dropdown>
					<DropdownToggle hasIcon={false}>
						<Button icon='MoreHoriz' color='dark' isLight shadow='sm' />
					</DropdownToggle>

					<DropdownMenu>
						<DropdownItem>
							<Button color='info' isLight icon='edit' onClick={() => onEdit(row)}>
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
				<CardLabel icon='School'>
					<CardTitle className='h5'>Students</CardTitle>

					<CardActions className='text-muted'>
						Total Students: {students.length}
					</CardActions>
				</CardLabel>
			</CardHeader>

			<CardBody>
				<InfiniteDataTable
					columns={columns}
					data={students}
					isLoading={isLoading}
					isFetchingNextPage={isFetchingNextPage}
					hasNextPage={hasNextPage}
					fetchNextPage={fetchNextPage}
					noDataFound='No Students Found'
					fixed
					scrollHeight='650px'
				/>
			</CardBody>
		</Card>
	);
};

export default StudentList;
