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
import { ISubject } from '../../../../../common/interface/subject';

type Props = {
	subjects: ISubject[];
	isLoading: boolean;
	hasNextPage?: boolean;
	isFetchingNextPage?: boolean;
	fetchNextPage?: () => void;
	onEdit?: (subject: ISubject) => void;
	onDelete?: (subject: ISubject) => void;
};

const SubjectList: React.FC<Props> = ({
	subjects,
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
			label: 'Subject',
			key: 'name',
			render: (row: ISubject) => (
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
									{getFirstLetter(row?.name || 'S')}
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
			render: (row: ISubject) => (
				<Badge
					isLight
					color='info'
					className='px-3 py-2 rounded-pill'>
					{row?.code || '-'}
				</Badge>
			),
		},

		{
			label: 'Credits',
			key: 'credits',
			sortable: true,
			render: (row: ISubject) => (
				<Badge
					isLight
					color='warning'
					className='px-3 py-2 rounded-pill'>
					{row?.credits || '-'}
				</Badge>
			),
		},

		{
			label: 'Type',
			key: 'type',
			render: (row: ISubject) => (
				<Badge
					isLight
					color='primary'
					className='px-3 py-2 rounded-pill'>
					{row?.type || '-'}
				</Badge>
			),
		},

		{
			label: 'Status',
			key: 'status',
			render: (row: ISubject) => (
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
			render: (row: ISubject) => (
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
				<CardLabel icon='MenuBook'>
					<CardTitle className='h5'>Subjects</CardTitle>

					<CardActions className='text-muted'>
						Total Subjects: {subjects.length}
					</CardActions>
				</CardLabel>
			</CardHeader>

			<CardBody>
				<InfiniteDataTable
	columns={columns}
	data={subjects}
	isLoading={isLoading}
	isFetchingNextPage={isFetchingNextPage}
	hasNextPage={hasNextPage}
	fetchNextPage={fetchNextPage}
	noDataFound='No Subjects Found'
	fixed
	scrollHeight='650px'
/>
			</CardBody>
		</Card>
	);
};

export default SubjectList;