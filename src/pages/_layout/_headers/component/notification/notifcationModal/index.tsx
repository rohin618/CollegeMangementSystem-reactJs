import React, { useEffect, useMemo, useState } from 'react';
import {
	Alert,
	Button,
	OffCanvas,
	OffCanvasBody,
	OffCanvasHeader,
	OffCanvasTitle,
} from '../../../../../../components/bootstrap';

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

	

	const handleClearAllNotify = async () => {
		showAlert({
			title: 'Clear all notifications?',
			text: 'This will mark all notifications as read.',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Yes, clear all',
			cancelButtonText: 'Cancel',

			onConfirm: async () => {
				// await handleMarkAllInvoiceAsRead();
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
					
						<div className='text-center text-muted py-4'>No notifications</div>
					
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
