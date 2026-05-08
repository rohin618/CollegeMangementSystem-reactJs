import React, { useMemo, useState } from 'react';
import {
	Button,
	Modal,
	ModalBody,
	ModalFooter,
	ModalHeader,
	Card,
	CardBody,
	CardHeader,
	CardLabel,
	CardTitle,
	CardSubTitle,
	Badge,
	Popovers,
	FormGroup,
	Input,
} from '../../../../../components/bootstrap';
import { BED_STATUS } from '../../../../../common/constant';
import { BOOKING_TYPE } from '../../../../../common/constant/app';
import moment from 'moment';
import Swal from 'sweetalert2';
import classNames from 'classnames';
import useDarkMode from '../../../../../hooks/useDarkMode';
import { DateTimePicker } from '../../../../../components/common';

interface RoomChangeModelProps {
	isOpen?: boolean;
	setIsOpen?: (isOpen: boolean) => void;
	roomsList?: any[];
	roomId?: string;
	bedId?: string;
	onSelect?: (room: any, bed: any, date: any) => void;
	bookingType?: number;
}

const RoomChangeModel: React.FC<RoomChangeModelProps> = ({
	isOpen = false,
	setIsOpen = () => {},
	roomsList = [],
	roomId,
	bedId,
	onSelect = () => {},
	bookingType = 0,
}) => {
	const [selectedRoom, setSelectedRoom] = useState<any>(null);
	const [selectedBed, setSelectedBed] = useState<any>(null);
	const [selectedDate, setSelectedDate] = useState<any>(moment().format('YYYY-MM-DD'));
	const { darkModeStatus } = useDarkMode();

	const availableRooms = useMemo(() => {
		if (!Array.isArray(roomsList) || roomsList.length === 0) return [];

		return roomsList.filter((room: any) => {
			if (!room?.beds || room.beds.length === 0) return false;

			const beds = room.beds.filter((b: any) => b && b.bedStatus !== undefined);

			if (+bookingType === BOOKING_TYPE.PRIVATE) {
				return (
					beds.length > 0 &&
					beds.every((b: any) => Number(b.bedStatus) === BED_STATUS.AVAILABLE)
				);
			}

			if (+bookingType === BOOKING_TYPE.SHARED) {
				return beds.some((b: any) => Number(b.bedStatus) === BED_STATUS.AVAILABLE);
			}

			return false;
		});
	}, [roomsList, bookingType]);

	const resetSelection = () => {
		setSelectedRoom(null);
		setSelectedBed(null);
	};

	const handleSelectBed = (room: any, bed: any) => {
		setSelectedRoom(room);
		setSelectedBed(bed);
	};

	const handleConfirmSelection = () => {
		Swal.fire({
			title: 'Room Changed',
			text: 'You selected a different room. Please make sure to update the room price according to the new room. Do you want to continue?',
			icon: 'info',
			showCancelButton: true,
			confirmButtonText: 'Yes, proceed',
			cancelButtonText: 'Cancel',
			confirmButtonColor: '#0d6efd', // Primary blue
			cancelButtonColor: '#6c757d', // Secondary grey
			customClass: {
				popup: 'my-swal-popup',
				confirmButton: 'btn btn-light-primary',
				cancelButton: 'btn btn-light-secondary',
			},
		}).then((result) => {
			if (!result.isConfirmed) return;

			if (selectedRoom && selectedBed) {
				onSelect(selectedRoom, selectedBed, selectedDate);
				setIsOpen(false);
			}
		});
	};

	return (
		<Modal
			isOpen={isOpen}
			setIsOpen={setIsOpen}
			toggle={() => setIsOpen(!isOpen)}
			fullScreen='lg'
			size='lg'
			isCentered
			isScrollable>
			<ModalHeader>
				<div className='w-100'>
					<div className='w-100 d-flex justify-content-between align-items-center'>
						<div className='d-flex flex-column'>
							<div className='fw-bold fs-5'>Change Room & Bed</div>
							{+bookingType === BOOKING_TYPE.PRIVATE ? (
								<span className='small text-muted'>
									You’ve selected a{' '}
									<span className='fw-semibold text-primary'>Single</span>{' '}
									booking — only rooms with all beds available are shown below.
								</span>
							) : (
								<span className='small text-muted'>
									You’ve selected a{' '}
									<span className='fw-semibold text-success'>Double</span> booking
									— rooms with at least one available bed are listed below.
								</span>
							)}
						</div>
					</div>

					<div className='row'>
						<div className='d-flex flex-column small text-muted mt-2 col-4'>
							{roomId && bedId ? (
								<div>
									<span
										className={classNames('fw-semibold me-2', {
											'text-dark': !darkModeStatus,
											'text-light': darkModeStatus,
										})}>
										Current:
									</span>
									Room{' '}
									<span className='fw-semibold text-primary'>
										{roomsList?.find((r) => r.id === roomId)?.roomNumber ||
											roomId}
									</span>{' '}
									→ Bed{' '}
									<span className='fw-semibold text-success'>
										{roomsList
											?.find((r) => r.id === roomId)
											?.beds?.find((b: any) => b.id === bedId)?.bedName ||
											bedId}
									</span>
								</div>
							) : (
								<div className='fst-italic'>No current room or bed assigned</div>
							)}

							<div className='mt-1'>
								<span
									className={classNames('fw-semibold me-2', {
										'text-dark': !darkModeStatus,
										'text-light': darkModeStatus,
									})}>
									Selected:
								</span>
								{selectedRoom && selectedBed ? (
									<>
										Room{' '}
										<span className='fw-semibold text-primary'>
											{selectedRoom.roomNumber}
										</span>{' '}
										→ Bed{' '}
										<span className='fw-semibold text-success'>
											{selectedBed.bedName}
										</span>
										<Button
											size='sm'
											className='py-1 px-3 fw-semibold text-dark ms-2'
											onClick={resetSelection}>
											Clear Selection
										</Button>
									</>
								) : (
									<span className='mt-1 fst-italic'>No room or bed selected</span>
								)}
							</div>
						</div>
						<div className='col-md-4'>
							<FormGroup id='roomStartDate' >
								<DateTimePicker
									label='Room Start Date'
									placeholder='Room Start Date'
									value={selectedDate}
									onChange={(e: any) => setSelectedDate(e.target.value)}
								/>
							</FormGroup>
						</div>
					</div>
				</div>
			</ModalHeader>

			<ModalBody>
				{availableRooms?.length === 0 ? (
					<div className='text-center text-muted py-4'>No available rooms found.</div>
				) : (
					<div className='row g-4'>
						{availableRooms.map((room, roomIndex) => {
							const availableBeds = room?.beds?.filter(
								(b: any) => +b?.bedStatus === BED_STATUS.AVAILABLE,
							);

							return (
								<div className='col-md-6' key={room.id || roomIndex}>
									<Card
										className={`shadow-sm border-0 ${
											selectedRoom?.id === room.id ? 'border-warning' : ''
										}`}>
										<CardHeader>
											<CardLabel>
												<CardTitle tag='div' className='h6 fw-bold'>
													R-{room.roomNumber}
												</CardTitle>
												<CardSubTitle className='text-muted small'>
													{room?.description || 'No description'}
												</CardSubTitle>
											</CardLabel>
										</CardHeader>

										<CardBody>
											{availableBeds?.length === 0 ? (
												<div className='text-muted small'>
													No beds available.
												</div>
											) : (
												<div className='d-flex flex-wrap gap-2'>
													{availableBeds.map(
														(bed: any, index: number) => {
															const isSelected =
																selectedBed?.id === bed.id;
															return (
																<Popovers
																	key={bed.bedName || index}
																	trigger='hover'
																	placement='top'
																	desc='Available for booking.'>
																	<Button
																		color={
																			isSelected
																				? 'danger'
																				: 'success'
																		}
																		isLight={!isSelected}
																		isOutline={isSelected}
																		className={`rounded-pill ${
																			isSelected
																				? 'border-2'
																				: ''
																		}`}
																		size='sm'
																		icon='Bed'
																		onClick={() =>
																			handleSelectBed(
																				room,
																				bed,
																			)
																		}>
																		{bed.bedName}
																	</Button>
																</Popovers>
															);
														},
													)}
												</div>
											)}

											{room?.amenities && (
												<div className='mt-3'>
													<Badge
														color='info'
														isLight
														className='rounded-pill'>
														{room.amenities}
													</Badge>
												</div>
											)}
										</CardBody>
									</Card>
								</div>
							);
						})}
					</div>
				)}
			</ModalBody>

			<ModalFooter>
				<div className='text-end mt-3 w-100'>
					<Button
						color='success'
						isDisable={!selectedRoom || !selectedBed}
						onClick={handleConfirmSelection}>
						Select
					</Button>
					<Button color='dark' className='ms-2' onClick={() => setIsOpen(false)}>
						Close
					</Button>
				</div>
			</ModalFooter>
		</Modal>
	);
};

export default RoomChangeModel;
