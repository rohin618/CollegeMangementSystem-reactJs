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
import { ICurriculum } from '../../../../common/interface/curriculum';
import { InfiniteDataTable } from '../../../../components/common/infinixDataTable';

type Props = {
	curriculums: ICurriculum[];
	isLoading: boolean;
	hasNextPage?: boolean;
	isFetchingNextPage?: boolean;
	fetchNextPage?: () => void;
	onEdit?: (curriculum: ICurriculum) => void;
	onDelete?: (curriculum: ICurriculum) => void;
};

const CurriculumList: React.FC<Props> = ({
	curriculums,
	isLoading,
	hasNextPage = false,
	isFetchingNextPage = false,
	fetchNextPage = () => {},
	onEdit = () => {},
	onDelete = () => {},
}) => {


	const columns = [
		{
			label: 'Department',
			key: 'departmentName',
			render: (row: ICurriculum) => (
				<div>
					<div className='fw-bold'>{row.departmentName}</div>

					<small className='text-muted'>{row.academicBatchName}</small>
				</div>
			),
		},

		{
			label: 'Semester',
			key: 'semesterName',
			render: (row: ICurriculum) => (
				<Badge isLight color='info' className='px-3 py-2 rounded-pill'>
					{row.semesterName}
				</Badge>
			),
		},

		{
			label: 'Subject',
			key: 'subjectName',
			render: (row: ICurriculum) => <div className='fw-semibold'>{row.subjectName}</div>,
		},

		{
			label: 'Display Order',
			key: 'displayOrder',
			sortable: true,
			render: (row: ICurriculum) => (
				<Badge isLight color='warning' className='px-3 py-2 rounded-pill'>
					{row.displayOrder}
				</Badge>
			),
		},

		{
			label: 'Status',
			key: 'status',
			render: (row: ICurriculum) => (
				<Badge
					isLight
					color={row.status === 'ACTIVE' ? 'success' : 'danger'}
					className='px-3 py-2 rounded-pill'>
					{row.status}
				</Badge>
			),
		},

		{
			label: 'Actions',
			key: 'actions',
			render: (row: ICurriculum) => (
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
				<CardLabel icon='AccountTree'>
					<CardTitle className='h5'>Curriculum Mapping</CardTitle>

					<CardActions className='text-muted'>
						Total Records: {curriculums.length}
					</CardActions>
				</CardLabel>
			</CardHeader>

			<CardBody>
				<InfiniteDataTable
					columns={columns}
					data={curriculums}
					isLoading={isLoading}
					isFetchingNextPage={isFetchingNextPage}
					hasNextPage={hasNextPage}
					fetchNextPage={fetchNextPage}
					noDataFound='No Curriculum Records Found'
					fixed
					scrollHeight='650px'
				/>
			</CardBody>
		</Card>
	);
};

export default CurriculumList;
