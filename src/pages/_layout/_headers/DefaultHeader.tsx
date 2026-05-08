import React, { useMemo, useEffect, useState } from 'react';
import Header, { HeaderLeft, HeaderRight } from '../../../layout/Header/Header';
import Navigation from '../../../layout/Navigation/Navigation';
import useDeviceScreen from '../../../hooks/useDeviceScreen';
import Avatar from '../../../components/Avatar';
import { useGetCurrentUser, useLocalStorageSubscribe } from '../../../hooks';
import { getLabelByValue, getUserMappedCompanyId, setStorage } from '../../../helpers/helpers';
import { SALUTATION_LIST, USER_ROLE_LIST } from '../../../common/data/option';
import { useQuery } from '@tanstack/react-query';
import { getAllCompany } from '../../../common/api/company';
import { EXIST_SESSION_STORAGE_NAMES, NOTIFICATION_STATUS } from '../../../common/constant';
import Icon from '../../../components/icon';
import { SwitchCompanyModal } from './component';
import { useNavigate } from 'react-router-dom';
import {
	Button,
	Dropdown,
	DropdownMenu,
	DropdownToggle,
	Popovers,
} from '../../../components/bootstrap';
import classNames from 'classnames';
import useDarkMode from '../../../hooks/useDarkMode';
import { IButtonProps } from '../../../components/bootstrap/Button';
import { AdvanceCreditForm } from '../../presentation/creditWallet/component';
import { CreditNotesForm } from '../../presentation/creditNotes/components';
import { InvoiceCreateAndUpdateForm } from '../../presentation/invoice/component';
import NotificationModal from './component/notification/notifcationModal';
import { getAllNotificationByCompanyId } from '../../../common/api/notification';

const DefaultHeader = () => {
	const { width } = useDeviceScreen();
	const currentUser = useGetCurrentUser();
	const resolvedCompanyId = getUserMappedCompanyId()?.companyId; // get the current companyId from storage
	const { darkModeStatus, setDarkModeStatus } = useDarkMode();
	const [isOpenAddAdvanceModel, setIsOpenAddAdvanceModel] = useState(false);
	const [isOpenAddCreditModel, setIsOpenAddCreditModel] = useState(false);
	const [isInvoiceEditFormOpen, setIsInvoiceEditFormOpen] = useState(false);
	const [isNotificationOpen, setIsNotificationOpen] = useState(false);

	const [notifications, setNotifications] = useState<any[]>([]);

	useEffect(() => {
		const unsubscribe = getAllNotificationByCompanyId(
			(data) => {
				setNotifications(data);
			},
			(error) => {
				console.error(error);
			},
		);
		return () => unsubscribe();
	}, []);

	const hasUnreadNotifications = useMemo(() => {
		return notifications?.some((notify: any) =>
			notify?.invoices?.some((inv: any) => inv.status === NOTIFICATION_STATUS.UNREAD),
		);
	}, [notifications]);

	const handleOpenCreateAdvanceModal = () => {
		setIsOpenAddAdvanceModel((prev) => !prev);
	};

	const handleOpenCreateCreditModal = () => {
		setIsOpenAddCreditModel((prev) => !prev);
	};
	const handleOpenOrCloseNotificationModal = () => {
		setIsNotificationOpen((prev) => !prev);
	};

	const [matchedCompany, setMatchedCompany] = useState<any>(null);
	const navigate = useNavigate();
	const styledBtn: IButtonProps = {
		color: darkModeStatus ? 'dark' : 'light',
		hoverShadow: 'default',
		isLight: !darkModeStatus,
		size: 'lg',
	};

	useLocalStorageSubscribe((event: any) => {
		if (event.key === EXIST_SESSION_STORAGE_NAMES.CURENT_COMPANY_ID) {
			setMatchedCompany(JSON.parse(event.newValue));
		}
	});

	// Fallback in case no matched company is found
	// if (!matchedCompany) {
	// 	return <div>No company found.</div>;
	// }

	//switch company logic
	const [openSwitchCompany, setOpenSwitchCompany] = useState<boolean>(false);

	const handleSwitchCompany = (company: any) => {
		if (!company) return;
		setStorage(EXIST_SESSION_STORAGE_NAMES.CURENT_COMPANY_ID, company);
		setMatchedCompany(company);
		setOpenSwitchCompany(false);
		navigate('/dashboard');
		window.location.reload();
	};

	const toggleInvoiceEditForm = () => {
		setIsInvoiceEditFormOpen((prev) => !prev);
		// handleOnInviceSave();
		// onRelaodInviceList();
	};

	return (
		<Header>
			<HeaderLeft>CMS</HeaderLeft>
			<HeaderRight>
				<div className='row'>
					<div className='col-auto'>
						<Dropdown>
							<DropdownToggle hasIcon={false}>
								{/* eslint-disable-next-line react/jsx-props-no-spreading */}
								<Button
									{...styledBtn}
									icon='AddCircleOutline'
									aria-label='Quick menu'
								/>
							</DropdownToggle>
							<DropdownMenu isAlignmentEnd size='lg' className='py-0 overflow-hidden'>
								<div className='row g-0'>
									<div
										className={classNames(
											'col-12',
											'p-4',
											'd-flex justify-content-center',
											'fw-bold fs-5',
											'text-info',
											'border-bottom border-info',
											{
												'bg-l25-info': !darkModeStatus,
												'bg-lo25-info': darkModeStatus,
											},
										)}>
										Quick Panel
									</div>
									<div
										className={classNames(
											'col-6 p-4 transition-base cursor-pointer bg-light-hover',
											'border-end border-bottom',
											{ 'border-dark': darkModeStatus },
										)}
										onClick={handleOpenCreateAdvanceModal}>
										<div className='d-flex flex-column align-items-center justify-content-center'>
											<Icon icon='AccountBalance' size='3x' color='info' />
											<span>Add Payment</span>
											<small className='text-muted'>Adv / Credit</small>
										</div>
									</div>
									<div
										className={classNames(
											'col-6 p-4 transition-base cursor-pointer bg-light-hover',
											'border-bottom',
											{ 'border-dark': darkModeStatus },
										)}
										onClick={handleOpenCreateCreditModal}>
										<div className='d-flex flex-column align-items-center justify-content-center'>
											<Icon icon='TrendingDown' size='3x' color='danger' />
											<span>Credit Notes</span>
											<small className='text-muted'>adjustment</small>
										</div>
									</div>
									<div
										className={classNames(
											'col-12 p-4 transition-base cursor-pointer bg-light-hover',
											'border-end',
											{ 'border-dark': darkModeStatus },
										)}
										onClick={toggleInvoiceEditForm}>
										<div className='d-flex flex-column align-items-center justify-content-center'>
											<Icon icon='Inventory' size='3x' color='success' />
											<span>Add Invoice</span>
											<small className='text-muted'>Miscellaneous</small>
										</div>
									</div>
									<div className='col-6 p-4 transition-base cursor-pointer bg-light-hover'>
										{/* <div className='d-flex flex-column align-items-center justify-content-center'>
											<Icon icon='ElectricalServices' size='3x' color='warning' />
											<span>Power</span>
											<small className='text-muted'>Mode</small>
										</div> */}
									</div>
								</div>
							</DropdownMenu>
						</Dropdown>
					</div>
					<div className='col-auto position-relative'>
						<Button
							icon='Notifications'
							size='lg'
							color='dark'
							isLight
							className='btn-only-icon position-relative'
							aria-label='Notifications'
							onClick={handleOpenOrCloseNotificationModal}>
							{hasUnreadNotifications && (
								<Popovers desc='You have unread notifications' trigger='hover'>
									<span className='position-absolute top-0 start-100 translate-middle badge border border-light rounded-circle bg-danger p-2'>
										<span className='visually-hidden'>
											Unread notifications
										</span>
									</span>
								</Popovers>
							)}
						</Button>
					</div>

					<div className='col d-flex align-items-center'>
						<div className='me-3'>
							<Avatar
								size={48}
								color='primary'
								userName={currentUser?.username || 'User'}
							/>
						</div>

						<div>
							<div className='fw-bold fs-6 mb-0'>
								{` ${
									currentUser?.username || 'User'
								}`}
							</div>

							<div className='text-muted'>
								<small>{getLabelByValue(USER_ROLE_LIST, currentUser?.role)}</small>
							</div>
						</div>
					</div>
					<Navigation
						menu={{}}
						id='header-top-menu'
						horizontal={
							!!width && width >= Number(import.meta.env.VITE_MOBILE_BREAKPOINT_SIZE)
						}
					/>
				</div>
			</HeaderRight>

			{/* <AdvanceCreditForm
				isOpen={isOpenAddAdvanceModel}
				toggle={handleOpenCreateAdvanceModal}
			/>
			<CreditNotesForm isOpen={isOpenAddCreditModel} toggle={handleOpenCreateCreditModal} />
			<InvoiceCreateAndUpdateForm
				// residentData={invoiceEditObject?.residentData}
				toggle={toggleInvoiceEditForm}
				isOpen={isInvoiceEditFormOpen}
				onSave={toggleInvoiceEditForm}
			/>*/}
			<NotificationModal
				isOpen={isNotificationOpen}
				toggle={handleOpenOrCloseNotificationModal}
				notifications={notifications}
				hasUnreadNotifications={hasUnreadNotifications}
			/> 
		</Header>
	);
};

export default DefaultHeader;
