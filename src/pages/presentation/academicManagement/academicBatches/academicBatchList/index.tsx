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
import { IAcademicBatch } from '../../../../../common/interface/academicBatch';

type Props = {
	academicBatches: IAcademicBatch[];
	isLoading: boolean;
	onEdit?: (academicBatch: IAcademicBatch) => void;
	onDelete?: (academicBatch: IAcademicBatch) => void;
};

const AcademicBatchList: React.FC<Props> = ({
	academicBatches,
	isLoading,
	onEdit = () => {},
	onDelete = () => {},
}) => {
	const { darkModeStatus } = useDarkMode();
console.log(academicBatches)
	const columns = [
		{
			label: 'Academic Batch',
			key: 'name',
			render: (row: IAcademicBatch) => (
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
									{getFirstLetter(row?.name || 'A')}
								</span>
							</div>
						</div>
					</div>

					<div className='flex-grow-1'>
						<div className='fs-6 fw-bold'>
							{row?.name || '-'}
						</div>

						<div className='text-muted'>
							<small>
								Batch Duration: {row?.startYear || '-'} -{' '}
								{row?.endYear || '-'}
							</small>
						</div>
					</div>
				</div>
			),
		},

		{
			label: 'Duration',
			key: 'duration',
			sortable: true,
			render: (row: IAcademicBatch) => (
				<Badge
					isLight
					color='info'
					className='px-3 py-2 rounded-pill'>
					{row?.startYear || '-'} - {row?.endYear || '-'}
				</Badge>
			),
		},

		{
			label: 'Status',
			key: 'status',
			render: (row: IAcademicBatch) => (
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
			render: (row: IAcademicBatch) => (
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
				<CardLabel icon='School'>
					<CardTitle className='h5'>
						Academic Batches
					</CardTitle>

					<CardActions className='text-muted'>
						Total Academic Batches:{' '}
						{academicBatches.length}
					</CardActions>
				</CardLabel>
			</CardHeader>

			<CardBody>
				<InfiniteDataTable
					columns={columns}
					data={academicBatches}
					isLoading={isLoading}
					isFetchingNextPage={false}
					hasNextPage={false}
					fetchNextPage={() => {}}
					noDataFound='No Academic Batches Found'
					fixed
					scrollHeight='650px'
				/>
			</CardBody>
		</Card>
	);
};

export default AcademicBatchList;