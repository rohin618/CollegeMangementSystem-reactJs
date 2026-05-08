import { FC, useState } from 'react';
import classNames from 'classnames';
import { useNavigate } from 'react-router-dom';

import useDarkMode from '../../../../hooks/useDarkMode';
import COLORS from '../../../../common/data/enumColors';
import {
	CardActions,
	CardBody,
	CardHeader,
	CardLabel,
	CardSubTitle,
	CardTitle,
	Card,
	Dropdown,
	DropdownItem,
	DropdownMenu,
	DropdownToggle,
	Button,
	Popovers,
} from '../../../../components/bootstrap';
import { BED_STATUS, PRICE_PERIOD_STATUS, ROOM_STATUS } from '../../../../common/constant';
import Badge from '../../../../components/bootstrap/Badge';
import BedBookingDetailInfoModel from './bed-booking-model';
import { getActiveBedDetails, showAlert } from './../../../../helpers/helpers';
import Swal from 'sweetalert2';
import { updateRoom } from '../../../../common/api/room';
import { useUpdateQueryListById } from '../../../../hooks';
import Spinner from '../../../../components/bootstrap/Spinner';
import Tooltips from '../../../../components/bootstrap/Tooltips';
import EdgeAwareWrapper from '../../../../components/common/wrapper/EdgeAwareWrapper';

const RoomCard: FC<any> = ({ roomData = {}, onEdit = () => {} }) => {
	const navigate = useNavigate();
	const { darkModeStatus } = useDarkMode();
	const [isDeleteLoading, setIsDeletLoading] = useState(false);

	const updateRoomsList = useUpdateQueryListById<any>(['roomsList']);
	// Holds index of active/open detail; null if none
	const [activeIndex, setActiveIndex] = useState<number | null>(null);

	const toggleDetailInfoRoom = (index: number) => {
		setActiveIndex((prev) => (prev === index ? null : index));
	};

	const handleDelete = () => {
		showAlert({
			title: 'Are you sure?',
			text: 'You won’t be able to revert this!',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Yes, delete it!',
			cancelButtonText: 'Cancel',

			customClass: {
				confirmButton: 'btn btn-light-info',
				cancelButton: 'btn btn-light-danger',
			},

			onConfirm: async () => {
				const updatedRoom = {
					...roomData,
					status: ROOM_STATUS.DELETE,
				};
				delete updatedRoom.beds;
				try {
					setIsDeletLoading(true);
					const updatedBedRes = await updateRoom(
						updatedRoom.id,
						{ ...updatedRoom },
						true,
					);
					if (!updatedBedRes) return;
					// Update the price period in the list
					updateRoomsList(updatedRoom);
				} catch (error) {
					console.error('Failed to delete price period:', error);
				} finally {
					setIsDeletLoading(false);
				}
			},
		});
	};

	return (
		<Card className={`shadow-3d-${darkModeStatus ? COLORS.LIGHT.name : COLORS.DARK.name}`}>
			<CardHeader>
				<CardLabel>
					<CardTitle
						tag='div'
						className={classNames('h6', 'cursor-pointer', {
							'link-dark': !darkModeStatus,
							'link-light': darkModeStatus,
						})}
						data-tour='100'>
						R-{roomData.roomNumber}
					</CardTitle>
					<CardSubTitle className='text-muted'>{roomData?.description}</CardSubTitle>
				</CardLabel>
				<CardActions>
					{isDeleteLoading ? (
						<Spinner color='info' size='10' />
					) : (
						<Dropdown>
							<DropdownToggle hasIcon={false}>
								<Button
									icon='MoreVert'
									color={darkModeStatus ? 'dark' : undefined}
									aria-label='More actions'
								/>
							</DropdownToggle>
							<DropdownMenu isAlignmentEnd>
								<DropdownItem>
									<Button icon='Edit' onClick={onEdit}>
										Edit Room
									</Button>
								</DropdownItem>
								<DropdownItem>
									<Button
										icon='AddBox'
										onClick={() =>
											navigate(
												`/rooms/${roomData?.id}/bed/create?roomNumber=${roomData.roomNumber}`,
											)
										}>
										View Bed's
									</Button>
								</DropdownItem>
								<DropdownItem isDivider />
								<DropdownItem>
									<Button icon='Delete' onClick={handleDelete}>
										Delete Room
									</Button>
								</DropdownItem>
							</DropdownMenu>
						</Dropdown>
					)}
				</CardActions>
			</CardHeader>

			<CardBody>
				<div className='row g-3'>
					{roomData?.beds?.length === 0 && <span>Room record is not available yet</span>}
					{roomData?.beds?.map(
						(bed: any, index: number) =>
							getActiveBedDetails(bed?.pricePeriods, bed.bedName) && (
								<div className='col-auto' key={bed.bedName || index}>
									<div className='position-relative'>
										<div>
											<EdgeAwareWrapper
												content={
													<BedBookingDetailInfoModel
														onClose={toggleDetailInfoRoom}
														bedInfo={bed}
													/>
												}>
												<div className='d-flex align-items-center cursor-pointer'>
													<Popovers
														trigger='hover'
														placement='top'
														desc={
															bed.bedStatus === BED_STATUS.AVAILABLE
																? 'Available for booking.'
																: bed.bedStatus ===
																	  BED_STATUS.BLOCK_BED_OCCUPIED
																	? 'Block Bed Occupied.'
																	: bed.bedStatus ===
																		  BED_STATUS.PRIVATE_OCCUPIED
																		? 'Independent.'
																		: 'Occupied.'
														}>
														<Button
															color={
																bed.bedStatus ===
																BED_STATUS.AVAILABLE
																	? 'success'
																	: bed.bedStatus ===
																		  BED_STATUS.BLOCK_BED_OCCUPIED
																		? 'warning'
																		: bed.bedStatus ===
																			  BED_STATUS.PRIVATE_OCCUPIED
																			? 'secondary'
																			: 'danger'
															}
															size='sm'
															className='rounded-pill'
															isLight
															onClick={() =>
																toggleDetailInfoRoom(index)
															}
															icon='Bed'>
															{bed.bedName}
														</Button>
													</Popovers>
												</div>
											</EdgeAwareWrapper>
										</div>

										{/* {activeIndex === index && (
											<>
												<div
													className='mt-2 position-absolute '
													style={{ minWidth: '400px', zIndex: 1 }}>
													<BedBookingDetailInfoModel
														onClose={toggleDetailInfoRoom}
														bedInfo={bed}
													/>
												</div>
												
											</>
										)} */}
									</div>
								</div>
							),
					)}
				</div>

				<div className='row g-3 mt-4'>
					{roomData?.amenities && (
						<div className='col-auto'>
							<Badge color='primary' isLight className='rounded-pill'>
								{roomData.amenities}
							</Badge>
						</div>
					)}
				</div>
			</CardBody>
		</Card>
	);
};

export default RoomCard;
