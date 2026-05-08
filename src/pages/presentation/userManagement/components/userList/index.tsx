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
import { DataTable } from '../../../../../components/common';
import useDarkMode from '../../../../../hooks/useDarkMode';
import { getFirstLetter, getLabelByValue, getColorByValue } from '../../../../../helpers/helpers';
import { USER_ROLE_LIST, USER_STATUS_LIST } from '../../../../../common/data/option';

type Props = {
	users: any[];
	isLoading: boolean;
	onEdit?: (user: any) => void;
	onDelete?: (user: any) => void;
};

const UserList: React.FC<Props> = ({
	users,
	isLoading,
	onEdit = () => {},
	onDelete = () => {},
}) => {
	const { darkModeStatus } = useDarkMode();

	const columns = [
		{
			label: 'User',
			key: 'username',
			render: (row: any) => (
				<div className='d-flex align-items-center'>
					<div className='flex-shrink-0'>
						<div className='ratio ratio-1x1 me-3' style={{ width: 48 }}>
							<div
								className={`bg-l${
									darkModeStatus ? 'o25' : '25'
								}-primary text-primary rounded-2 d-flex align-items-center justify-content-center`}>
								<span className='fw-bold'>
									{getFirstLetter(row?.username || 'U')}
								</span>
							</div>
						</div>
					</div>

					<div className='flex-grow-1'>
						<div className='fs-6 fw-bold'>{row?.username || '-'}</div>

						<div className='text-muted'>
							<small>{row?.email || '-'}</small>
						</div>
					</div>
				</div>
			),
		},

		{
			label: 'Role',
			key: 'role',
			sortable: true,
			render: (row: any) => (
				<Badge
					isLight
					color={getColorByValue(USER_ROLE_LIST, row?.role)}
					className='px-3 py-2 rounded-pill'>
					{getLabelByValue(USER_ROLE_LIST, row?.role)}
				</Badge>
			),
		},

		{
			label: 'Status',
			key: 'isActive',
			render: (row: any) => (
				<Badge
					isLight
					color={row?.isActive ? 'success' : 'danger'}
					className='px-3 py-2 rounded-pill'>
					{row?.isActive ? 'Active' : 'Inactive'}
				</Badge>
			),
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
				<CardLabel icon='person'>
					<CardTitle className='h5'>Users</CardTitle>
					<CardActions className='text-muted'>
						Total Users: {users.length}
					</CardActions>
				</CardLabel>
				
			</CardHeader>
			<CardBody className='p-4'>
				<DataTable
					fixed
					columns={columns}
					data={users}
					search={false}
					isLoading={isLoading}
					noDataFound='No Users Found'
				/>
			</CardBody>
		</Card>
	);
};

export default UserList;
