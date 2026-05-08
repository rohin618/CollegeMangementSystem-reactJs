import {
	Button,
	CardBody,
	Card,
	Spinner,
	Alert,
	Badge,
	Dropdown,
	DropdownToggle,
	DropdownMenu,
	DropdownItem,
	Popovers,
} from '../../../../../components/bootstrap';

import Icon from '../../../../../components/icon';
import useDarkMode from '../../../../../hooks/useDarkMode';
import { getFirstLetter, getLabelByValue, showAlert } from '../../../../../helpers/helpers';
import { getColorNameWithIndex } from '../../../../../common/data/enumColors';
import { USER_TYPE_LIST } from '../../../../../common/data/option';
import { updateUser } from '../../../../../common/api/user';
import { USER_STATUS } from '../../../../../common/constant';
import { useRemoveItemQueryListById, useUpdateQueryListById } from '../../../../../hooks';
import { useState } from 'react';
import classNames from 'classnames';

export const UserCardList = ({
	usersList = [],
	isLoading,
	isError,
	error,
	onEdit = () => {},
	companyList = [],
}: any) => {
	const { darkModeStatus } = useDarkMode();
	const updateUsersList = useUpdateQueryListById<any>(['usersList']);
	const { removeItemById: removeUserListById } = useRemoveItemQueryListById<any>({
		queryKey: ['usersList'],
	});

	const [isDeleteLoading, setIsDeleteLoading] = useState(false);
	const [userDeleteId, setUserDeleteId] = useState<any>(null);

	/* ----------------------------- DELETE HANDLER ----------------------------- */
	const handleDelete = (item: any) => {
		setUserDeleteId(item.id);

		const handleUserDelete = async () => {
			setIsDeleteLoading(true);
			try {
				const res = await updateUser(item.id, {
					...item,
					status: USER_STATUS.DELETE,
				});
				if (res) removeUserListById(res.id);
			} finally {
				setIsDeleteLoading(false);
				setUserDeleteId(null);
			}
		};

		showAlert({
			title: 'Are you sure?',
			text: "You won't be able to revert this.",
			icon: 'error',
			showCancelButton: true,
			confirmButtonText: 'Yes, delete it!',
			onConfirm: handleUserDelete,
		});
	};

	/* ----------------------------- COMPANY BADGES ----------------------------- */
	const getCompanyBadges = (companyIds: any[] = []) =>
		companyIds.map((companyId) => {
			const companyName = companyList.find(({ id }: any) => id === companyId)?.name || 'NA';

			return (
				<Badge
					key={companyId}
					isLight={!darkModeStatus}
					// color={darkModeStatus ? "dark" : "dark"}
					color='dark'
					className={classNames('d-inline-flex align-items-center px-3 py-2', {
						'text-dark': !darkModeStatus,
						'text-light': darkModeStatus,
					})}>
					<span>{companyName}</span>
				</Badge>
			);
		});

	/* ----------------------------- STATES ----------------------------- */
	if (isLoading) {
		return (
			<div className='d-flex justify-content-center py-5'>
				<Spinner color='primary' />
				<span className='ms-2'>Loading users…</span>
			</div>
		);
	}

	if (isError) {
		return (
			<Alert color='danger' isLight>
				<strong>Error:</strong> {error?.message || 'Failed to load users'}
			</Alert>
		);
	}

	if (!usersList.length) {
		return <div className='text-center py-5 text-muted fw-bold'>No users found</div>;
	}

	/* ----------------------------- UI ----------------------------- */
	return (
		<div className='row g-4'>
			{usersList.map((user: any, index: number) => {
				const colorIndex = getColorNameWithIndex(index);
				const companyIds = user?.companyIds || [];
				const visibleCompanies = companyIds.slice(0, 1);
				const hiddenCompanies = companyIds.slice(1);

				return (
					<div key={user.id} className='col-xl-4 col-lg-6'>
						<Card className='h-100'>
							<CardBody>
								{/* HEADER */}
								<div className='d-flex align-items-start mb-3'>
									<div
										className={`rounded-2 d-flex align-items-center justify-content-center me-3 bg-l${
											darkModeStatus ? 'o25' : '25'
										}-${colorIndex} text-${colorIndex}`}
										style={{ width: 64, height: 64 }}>
										<span className='fw-bold fs-3'>
											{getFirstLetter(user?.name)}
										</span>
									</div>

									<div className='flex-grow-1'>
										<div className='d-flex justify-content-between'>
											<div>
												<Popovers desc={user?.name} trigger='hover'>
													<div
														className='fw-bold fs-5 text-truncate'
														style={{ maxWidth: 180 }}>
														{user?.name}
													</div>
												</Popovers>

												<div className='d-flex align-items-center gap-2 mt-1'>
													<div className='text-muted small'>
														W{user?.code}
													</div>

													<small className='badge bg-success bg-opacity-10 text-success'>
														{getLabelByValue(
															USER_TYPE_LIST,
															user?.userType,
														)}
													</small>
												</div>
											</div>

											{isDeleteLoading && userDeleteId === user.id ? (
												<Spinner size='sm' />
											) : (
												<Dropdown>
													<DropdownToggle hasIcon={false}>
														<Button
															icon='MoreVert'
															color={
																darkModeStatus ? 'dark' : undefined
															}
														/>
													</DropdownToggle>
													<DropdownMenu isAlignmentEnd>
														<DropdownItem>
															<Button
																icon='Edit'
																color='dark'
																isLight
																onClick={() => onEdit(user)}>
																Edit
															</Button>
														</DropdownItem>
														<DropdownItem isDivider />
														<DropdownItem>
															<Button
																icon='Delete'
																onClick={() => handleDelete(user)}>
																Delete
															</Button>
														</DropdownItem>
													</DropdownMenu>
												</Dropdown>
											)}
										</div>
									</div>
								</div>

								{/* CONTACT INFO */}
								<div className='mb-3'>
									{/* Email */}
									<div className='d-flex align-items-center mb-2'>
										<Icon icon='Email' className='me-2' />
										<Popovers desc={user?.email} trigger='hover'>
											<span
												className='text-info fw-bold text-truncate d-inline-block'
												style={{ maxWidth: 180 }}>
												{user?.email}
											</span>
										</Popovers>
									</div>

									{/* Phone */}
									<div className='d-flex align-items-center'>
										<Icon icon='LocalPhone' className='me-2' />
										<span className='text-info fw-bold'>{user?.phone}</span>
									</div>
								</div>

								{/* COMPANIES */}
								<div className='d-flex flex-wrap gap-2'>
									{getCompanyBadges(visibleCompanies)}

									{hiddenCompanies.length > 0 && (
										<Popovers
											desc={
												<div className='d-flex flex-wrap gap-2'>
													{getCompanyBadges(hiddenCompanies)}
												</div>
											}
											trigger='hover'>
											<span className='fw-bold text-primary cursor-pointer'>
												+{hiddenCompanies.length}
											</span>
										</Popovers>
									)}
								</div>
							</CardBody>
						</Card>
					</div>
				);
			})}
		</div>
	);
};
