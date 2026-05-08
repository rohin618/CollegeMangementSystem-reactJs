import React, { useEffect, useMemo, useState } from 'react';
import {
	Alert,
	Button,
	OffCanvas,
	OffCanvasBody,
	OffCanvasHeader,
	OffCanvasTitle,
} from '../../../../../../components/bootstrap';
import {
	getAllNotificationByCompanyId,
	updateInvoiceStatusOnly,
} from '../../../../../../common/api/notification';
import {
	EMAIL_PROCESS_STATUS,
	NOTIFICATION_STATUS,
	NOTIFICATION_TYPE,
} from '../../../../../../common/constant';
import { showAlert } from '../../../../../../helpers/alerts';
import Icon from '../../../../../../components/icon';

interface NotificationModalProps {
	isOpen: boolean;
	toggle: () => void;
	isLoading?: boolean;
	notifications: any[];
	hasUnreadNotifications: boolean;
}

const NotificationModal: React.FC<NotificationModalProps> = ({
	isOpen,
	toggle,
	isLoading = false,
	notifications,
	hasUnreadNotifications,
}) => {
	const [loading, setLoading] = useState(false);

	const notificationInvoice = useMemo(() => {
		return notifications.filter(
			(notify: any) => notify?.type === NOTIFICATION_TYPE.BULK_INVOICE_EMAIL,
		);
	}, [notifications]);

	const handleMarkSingleInvoiceAsRead = async (notificationId: string, invoiceId: string) => {
		const selectedNotification = notificationInvoice.find(
			(notify: any) => notify.id === notificationId,
		);

		if (!selectedNotification) return;

		//  Build payload here
		const updatedInvoices = selectedNotification.invoices.map((inv: any) =>
			inv.invoiceId === invoiceId ? { ...inv, status: NOTIFICATION_STATUS.READ } : inv,
		);

		//  Send payload to API
		await updateInvoiceStatusOnly(notificationId, updatedInvoices);
	};

	const handleMarkAllInvoiceAsRead = async () => {
		setLoading(true);

		try {
			for (const notify of notificationInvoice) {
				if (!notify?.invoices?.length) continue;

				const hasUnreadInvoice = notify.invoices.some(
					(inv: any) => inv.status === NOTIFICATION_STATUS.UNREAD,
				);

				if (!hasUnreadInvoice) continue;

				const updatedInvoices = notify.invoices.map((inv: any) => ({
					...inv,
					status: NOTIFICATION_STATUS.READ,
				}));

				await updateInvoiceStatusOnly(notify.id, updatedInvoices);
			}
		} finally {
			setLoading(false);
		}
	};

	const handleClearAllNotify = async () => {
		showAlert({
			title: 'Clear all notifications?',
			text: 'This will mark all notifications as read.',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Yes, clear all',
			cancelButtonText: 'Cancel',

			onConfirm: async () => {
				await handleMarkAllInvoiceAsRead();
			},
		});
	};

	return (
		<OffCanvas
			id='notificationModal'
			titleId='notificationModalLabel'
			placement='end'
			isOpen={isOpen}
			setOpen={toggle}
			isBackdrop={false}>
			{/* Header */}
			<OffCanvasHeader setOpen={toggle}>
				<OffCanvasTitle id='notificationModalLabel'>Notification</OffCanvasTitle>
			</OffCanvasHeader>

			{/* Body */}
			<OffCanvasBody>
				<>
					{hasUnreadNotifications ? (
						notificationInvoice.map((notify) =>
							notify.invoices?.map(
								(data: any, index: number) =>
									data.status === NOTIFICATION_STATUS.UNREAD && (
										<Alert
											key={data.invoiceId || index}
											color={
												data.processStatus ===
												EMAIL_PROCESS_STATUS.PROCESSING
													? 'warning'
													: data.processStatus ===
														  EMAIL_PROCESS_STATUS.COMPLETED
														? 'success'
														: 'danger'
											}
											isLight>
											<div className='d-flex align-items-center w-100'>
												<div className='me-2'>
													<Icon
														icon={
															data?.processStatus ===
															EMAIL_PROCESS_STATUS.COMPLETED
																? 'CheckCircle'
																: data?.processStatus ===
																	  EMAIL_PROCESS_STATUS.PROCESSING
																	? 'WatchLater'
																	: 'RemoveCircleOutline'
														}
														size='2x'
													/>
												</div>
												{/* Message */}
												<div className='flex-grow-1 text-wrap'>
													{data.message}
												</div>

												{/* Close Button */}
												<button
													type='button'
													className='btn-close ms-2 flex-shrink-0'
													aria-label='Close'
													onClick={() =>
														handleMarkSingleInvoiceAsRead(
															notify.id,
															data.invoiceId,
														)
													}
												/>
											</div>
										</Alert>
									),
							),
						)
					) : (
						<div className='text-center text-muted py-4'>No notifications</div>
					)}
				</>
			</OffCanvasBody>

			{/* Footer */}
			<div className='row m-0'>
				<div className='col-12 p-3'>
					{hasUnreadNotifications ? (
						<Button
							isOutline
							color='danger'
							className='w-100'
							onClick={handleClearAllNotify}
							isDisable={isLoading}>
							Clear All
						</Button>
					) : (
						<Button
							isOutline
							color='danger'
							className='w-100'
							onClick={toggle} 
						>
							Close
						</Button>
					)}
				</div>
			</div>
		</OffCanvas>
	);
};

export default NotificationModal;
