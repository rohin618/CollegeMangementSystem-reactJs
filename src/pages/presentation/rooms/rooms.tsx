import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
	PageWrapper,
	SubHeaderLeft,
	SubheaderSeparator,
	SubHeaderRight,
	SubHeader,
	Page,
} from '../../../layout';

import { Button, Badge } from '../../../components/bootstrap';
import { useQuery } from '@tanstack/react-query';

import RoomCard from './component/roomCard';
import { getAllRoomsWithBeds } from '../../../common/api/room';
import { RoomForm } from './component/room-form';
import { BED_STATUS, ROOM_STATUS } from '../../../common/constant';

const RoomsPage = () => {
	const navigate = useNavigate();
	const [isOpenModelCreateRoom, setIsOpenModelCreateRoom] = useState(false);
	const [editRoomObject, setEditRoomObject] = useState(null);
	const {
		data: roomsList,
		isLoading,
		isError,
		error,
	} = useQuery({
		queryKey: ['roomsList'],
		queryFn: getAllRoomsWithBeds,
	});

	const { activeRoomList, bedCount, vacants, occupied } = useMemo(() => {
		if (!roomsList) {
			return {
				activeRoomList: [],
				bedCount: 0,
				vacants: 0,
				occupied: 0,
			};
		}

		const activeRooms = roomsList.filter(
			(room: any) =>
				+room.status === ROOM_STATUS.ACTIVE ||
				+room.status === ROOM_STATUS.PRIVATE_OCCUPIED,
		);

		let totalBeds = 0;
		let vacantCount = 0;
		let occupiedCount = 0;

		activeRooms.forEach((room: any) => {
			const beds = room.beds || [];
			const roomBedCount = beds.length;

			totalBeds += roomBedCount;

			const hasOccupiedBed = beds.some((bed: any) => bed.bedStatus !== BED_STATUS.AVAILABLE);

			if (hasOccupiedBed) {
				//  if ANY bed occupied → ALL beds occupied
				occupiedCount += roomBedCount;
			} else {
				//  all beds vacant
				vacantCount += roomBedCount;
			}
		});

		return {
			activeRoomList: activeRooms,
			bedCount: totalBeds,
			vacants: vacantCount,
			occupied: occupiedCount,
		};
	}, [roomsList]);

	const handleOpenModelCreateRoom = () => {
		setIsOpenModelCreateRoom(!isOpenModelCreateRoom);
	};

	const handleOpenModelEditRoom = (data: any) => {
		setIsOpenModelCreateRoom(!isOpenModelCreateRoom);
		setEditRoomObject(data);
	};

	const handleToggleRommModal = () => {
		setIsOpenModelCreateRoom(!isOpenModelCreateRoom);
		setEditRoomObject(null);
	};

	return (
		<PageWrapper title='Rooms'>
			<SubHeader>
				<SubHeaderLeft>
					<span className='h4 mb-0 fw-bold'>Rooms</span>
					<SubheaderSeparator />
					<span>
						{/* 5 out of <Badge color='success' isLight rounded={1}>
                                {activeRoomList?.length} rooms
                            </Badge> are booked; <Badge color='primary' isLight rounded={1}>
                                5 are still available
                            </Badge> */}
						{activeRoomList?.length} rooms
					</span>
					<SubheaderSeparator />
					<span>{bedCount} beds</span>
					<SubheaderSeparator />
					<span>{occupied} Occupied</span>
					<SubheaderSeparator />
					<span>{vacants} Vacant</span>
				</SubHeaderLeft>
				<SubHeaderRight>
					<Button
						color='info'
						isLight
						// onClick={() => navigate('/rooms/create')}
						onClick={handleOpenModelCreateRoom}
						icon='AddCircle'>
						Add Room
					</Button>
				</SubHeaderRight>
			</SubHeader>

			<Page container='fluid'>
				{isLoading && <p>Loading rooms...</p>}
				{isError && <p>Error: {error.message}</p>}
				{!isLoading && !isError && activeRoomList?.length === 0 && (
					<h3 className='text-center text-muted'>No rooms available.</h3>
				)}
				<div className='row'>
					{activeRoomList?.map((room: any) => (
						<div className='col-3' key={room.id}>
							<RoomCard
								roomData={room}
								onEdit={() => handleOpenModelEditRoom(room)}
							/>
						</div>
					))}
				</div>
			</Page>
			<RoomForm
				roomsList={activeRoomList}
				editRoomObject={editRoomObject}
				isOpen={isOpenModelCreateRoom}
				toggle={handleToggleRommModal}
			/>
		</PageWrapper>
	);
};

export default RoomsPage;
