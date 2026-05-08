import React from 'react';
import moment from 'moment';
import {
	Card,
	CardBody,
	CardHeader,
	CardLabel,
	CardTitle,
	Badge,
	Spinner,
	CardSubTitle,
} from '../../../../../../components/bootstrap';
import { getLabelByValue } from '../../../../../../helpers/helpers';
import {
	BED_STATUS_LIST,
	BLOCK_BEDS_TYPE_LIST,
	BOOKING_TYPE_LIST,
	PRE_BOOKING_LIST,
} from '../../../../../../common/data/option';
import { useGetAllRoomsWithBeds } from '../../../../../../hooks/useGetAllRoomsWithBed';
import Icon from '../../../../../../components/icon';

type RoomHistoryResidentInfoProps = {
	residentData: any;
};

const RoomHistoryResidentInfo: React.FC<RoomHistoryResidentInfoProps> = ({ residentData }) => {
	const { data: roomsList = [], isLoading, isError } = useGetAllRoomsWithBeds();
	const historyList = residentData?.roomHistory || [];

	if (isLoading)
		return (
			<div className='text-center py-4'>
				<Spinner color='primary'  className='me-3'/> Loading room history...
			</div>
		);

	if (isError)
		return <p className='text-danger text-center'>Failed to load room and bed details.</p>;

	if (!historyList.length) {
		return (
			<Card className='shadow-3d-primary mb-4'>
				<CardHeader>
					<CardLabel icon='History'>
						<CardTitle tag='h5' className='mb-0'>
							Room History
						</CardTitle>
					</CardLabel>
				</CardHeader>
				<CardBody>
					<p className='text-muted mb-0'>No room history available.</p>
				</CardBody>
			</Card>
		);
	}

	const findRoomAndBed = (roomId: string, bedId: string) => {
		const room = roomsList.find((r: any) => r.id === roomId) as any;
		const bed = room?.beds?.find((b: any) => b.id === bedId) as any;
		return { room, bed };
	};

	// const lastRecord = historyList[historyList.length - 1];
	// const remainingRecords = historyList.slice(0, -1);
	// const orderedList = [lastRecord, ...remainingRecords];

	return (
		<Card className='shadow-3d-primary mb-4'>
			<CardHeader>
				<CardLabel icon='History'>
					<CardTitle tag='h5' className='mb-0 text-primary fw-semibold fs-5'>
						Room History
					</CardTitle>
					<CardSubTitle className='text-muted fs-6'>
						Total Records: {historyList.length}
					</CardSubTitle>
				</CardLabel>
			</CardHeader>

			<CardBody>
				<p className='text-muted mb-4 fs-6'>
					Historical records of room and bed allocations for the resident.
				</p>

				<div className='row g-4'>
					{[...historyList].reverse().map((record: any, index: number) => {
						const { room, bed } = findRoomAndBed(record.roomId, record.bedId);
						const isActive = index === 0; 
						const recordNumber = historyList.indexOf(record) + 1;

						return (
							<div className='col-md-6 col-sm-12' key={index}>
								<div
									className={`border rounded p-3 shadow-sm h-100 `}
								>
									<div className='d-flex justify-content-between align-items-center mb-3'>
										<h6 className='fw-bold mb-0'>
											<Icon icon='Home' className='me-2 text-primary' />
											Record #{recordNumber}
										</h6>

										{isActive && (
											<Badge color='success' isLight className='px-3 py-2 rounded-pill'>
												Resident Current Active Room
											</Badge>
										)}
									</div>

									<div className='row'>
										<div className='col-6 mb-2'>
											<div className='text-muted small mb-1'>Room Number</div>
											<div className='fw-semibold fs-6'>
												{room?.roomNumber || '-'}
											</div>
										</div>

										<div className='col-6 mb-2'>
											<div className='text-muted small mb-1'>Floor</div>
											<div className='fw-semibold fs-6'>
												{room?.floor || '-'}
											</div>
										</div>

										<div className='col-6 mb-2'>
											<div className='text-muted small mb-1'>Bed Name</div>
											<div className='fw-semibold fs-6'>
												{bed?.bedName || '-'}
											</div>
										</div>

										<div className='col-6 mb-2'>
											<div className='text-muted small mb-1'>Booking Type</div>
											<div className='fw-semibold fs-6'>
												{getLabelByValue(
													BOOKING_TYPE_LIST,
													record.bookingType,
												) || '-'}
											</div>
										</div>

										<div className='col-6 mb-2'>
											<div className='text-muted small mb-1'>Start Date</div>
											<div className='fw-semibold fs-6'>
												{record?.sDate
													? moment(record?.sDate).format('DD-MM-YYYY')
													: '-'}
											</div>
										</div>

										<div className='col-6 mb-2'>
											<div className='text-muted small mb-1'>End Date</div>
											<div className='fw-semibold fs-6'>
												{record?.eDate
													? moment(record?.eDate).format('DD-MM-YYYY')
													: '-'}
											</div>
										</div>

										<div className='col-6 mb-2'>
											<div className='text-muted small mb-1'>
												Bed Booking Status
											</div>
											<div className='fw-semibold fs-6'>
												{getLabelByValue(BED_STATUS_LIST, +record.status) ||
													'N/A'}
											</div>
										</div>
											<div className='col-6 mb-2'>
											<div className='text-muted small mb-1'>
												Block Bed
											</div>
											<div className='fw-semibold fs-6'>
												{getLabelByValue( BLOCK_BEDS_TYPE_LIST, +record.blockBedStatus) ||
													'N/A'}
											</div>
										</div>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			</CardBody>
		</Card>
	);
};

export default RoomHistoryResidentInfo;
