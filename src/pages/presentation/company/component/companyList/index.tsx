import useDarkMode from '../../../../../hooks/useDarkMode';
import {
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
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames';
import Avatar from '../../../../../components/Avatar';
import USERS from '../../../../../common/data/userDummyData';
import { COMPANY_STATUS, USER_TYPE } from '../../../../../common/constant';
import { DataTable } from '../../../../../components/common';
import { useMemo } from 'react';
import { useGetCurrentUser } from '../../../../../hooks';

export const CompanyList = ({ companyList, onEdit = () => {}, isLoading }: any) => {
	const navigate = useNavigate();
	const { darkModeStatus } = useDarkMode();
	const companyColumns = [
		{
			label: 'Company Name',
			key: 'company',
			render: (row: any) => (
				<div className='d-flex align-items-center'>
					<div className='flex-shrink-0'>
						<div className='ratio ratio-1x1 me-3' style={{ width: 48 }}>
							<div
								className={classNames(
									'd-flex align-items-center justify-content-center rounded-3 bg-light border',
									'ratio ratio-1x1',
								)}>
								<Avatar
									src={row?.logo || ''}
									color={USERS.JOHN.color}
									size={46}
									rounded={3}
									userName={row?.name}
									className='img-fluid rounded-3'
								/>
							</div>
						</div>
					</div>

					<div className='flex-grow-1'>
						<div className='fs-6 fw-bold'>{row?.name || '-'}</div>
						<div className='text-muted small'>C{row?.code || '-'}</div>
					</div>
				</div>
			),
		},

		{
			label: 'Trade Name',
			key: 'tradeName',
			sortable: true,
			render: (row: any) => (
				<div className='fw-semibold text-primary'>{row?.tradeName || '-'}</div>
			),
		},

		{
			label: 'Contact',
			key: 'contact',
			render: (row: any) => (
				<>
					<div className='fw-semibold'>{row?.phone || row?.email || '-'}</div>

					{row?.phone && row?.email && (
						<div className='text-muted small'>{row?.email}</div>
					)}
				</>
			),
		},

		{
			label: 'Location',
			key: 'location',
			sortable: true,
			render: (row: any) => (
				<div>
					{row?.buildingNumber && `${row.buildingNumber}, `}
					{row?.area} {row?.address} {row?.postCode}
				</div>
			),
		},

		{
			label: 'Status',
			key: 'status',
			sortable: true,
			render: (row: any) => {
				const isActive = +row?.status === COMPANY_STATUS.ACTIVE;

				return (
					<div
						className={classNames(
							`bg-l${darkModeStatus ? 'o25' : '10'}-${
								isActive ? 'success' : 'secondary'
							}`,
							`text-${isActive ? 'success' : 'secondary'}`,
							'fw-bold py-1 px-3 rounded-pill text-center',
						)}>
						{isActive ? 'Active' : 'Inactive'}
					</div>
				);
			},
		},

		{
			label: 'Action',
			key: 'action',
			render: (row: any) => (
				<Dropdown>
					<DropdownToggle hasIcon={false}>
						<Button icon='MoreHoriz' color='dark' isLight shadow='sm' />
					</DropdownToggle>

					<DropdownMenu>
						<DropdownItem>
							<Button icon='Edit' onClick={() => onEdit(row)} className='me-2'>
								Edit
							</Button>
						</DropdownItem>

						<DropdownItem>
							<Button
								icon='Visibility'
								onClick={() =>
									navigate(`/company/${row?.id}?companyName=${row?.name}`)
								}>
								View
							</Button>
						</DropdownItem>
					</DropdownMenu>
				</Dropdown>
			),
		},
	];

	return (
		<div className='row h-100'>
			<div className='col-12'>
				<Card stretch>
					<CardHeader>
						<CardLabel icon='person'>
							<CardTitle className='h5'>Company List</CardTitle>
							<CardActions className='text-muted'>
								Total Company: {companyList?.length}
							</CardActions>
						</CardLabel>
					</CardHeader>
					<CardBody>
						<DataTable
							fixed={true}
							columns={companyColumns}
							data={companyList}
							search={false}
							isLoading={isLoading}
							pagination={false}
							noDataFound='No Company Found'
						/>
					</CardBody>
				</Card>
			</div>
		</div>
	);
};
