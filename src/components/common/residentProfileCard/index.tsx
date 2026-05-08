import React from 'react';
import Icon from '../../icon';
import { PREBOOK_TYPE } from '../../../common/constant';
import {
	getActiveFundList,
	getFirstLetter,
	getFundTypes,
	getLabelByValue,
} from '../../../helpers/helpers';
import useDarkMode from '../../../hooks/useDarkMode';
import { INVOICE_TO_TYPE_LIST } from '../../../common/data/option';
import { Popovers } from '../../bootstrap';
import { useGetAllRoomsWithBeds } from '../../../hooks/useGetAllRoomsWithBed';
import { useNavigate } from 'react-router-dom';

interface ResidentProfileCardProps {
	resident: any;
	colorIndex: string | number;
	invoiceTo?: any;
	badge?: any;
	isNavigate?: boolean;
}

export const ResidentProfileCard: React.FC<ResidentProfileCardProps> = ({
	resident,
	colorIndex = 1,
	invoiceTo,
	badge = '',
	isNavigate = true,
}) => {
	const { darkModeStatus } = useDarkMode();
	const navigate = useNavigate();
	const {
		data: roomsList = [],
		isLoading: roomListIsLoading,
		isError,
	} = useGetAllRoomsWithBeds();
	if (!resident) return null;

	const findRoomAndBed = (roomId: any, bedId: any) => {
		const room = roomsList.find((r: any) => r.id === roomId) as any;
		const bed =
			room?.beds.length <= 1 ? null : (room?.beds?.find((b: any) => b.id === bedId) as any);
		return { room, bed };
	};

	const { room, bed } = findRoomAndBed(resident?.roomId, resident?.bedId);

	const residentName = resident?.personal?.name;

	const fundInfo: any[] = getActiveFundList ? getActiveFundList(resident) : [];
	const handleNavigate = () => {
		if (!resident?.id || !isNavigate) return;
		navigate(`/resident/details/${resident.id}`);
	};
	return (
		<div className='d-flex align-items-center'>
			<div className='flex-shrink-0 cursor-pointr'>
				<div className='ratio ratio-1x1 me-3' style={{ width: 48 }}>
					<div
						className={`bg-l${darkModeStatus ? 'o25' : '25'}-${colorIndex} text-${colorIndex} rounded-2 d-flex align-items-center justify-content-center`}>
						<span className='fw-bold'>{getFirstLetter(residentName)}</span>
					</div>
				</div>
			</div>

			<div className='flex-grow-1'>
				<div
					className={`fs-6 fw-bold ${isNavigate ? 'cursor-pointer' : ''}`}
					onClick={isNavigate ? handleNavigate : undefined}>
					{residentName || 'NA'} {badge}
				</div>

				<div className='text-muted d-inline-block'>
					£{' '}
					{!invoiceTo ? (
						<>
							{fundInfo?.length == 0 && (
								<small color='danger' className='text-danger fw-semibold '>
									Fund InActive
								</small>
							)}
							{fundInfo?.length > 2 ? (
								<>
									<small>{fundInfo[0]?.label || 'NA'}, </small>
									<small>{fundInfo[1]?.label || 'NA'}</small>
									<Popovers
										desc={fundInfo
											?.filter((_, index) => index >= 2)
											?.map((item, index) => (
												<div key={item.id || index}>
													{item.label || item.userName || 'NA'}
												</div>
											))}
										trigger='hover'>
										<strong>
											<span className='cursor-pointer'>
												+{fundInfo.length - 2}
											</span>
										</strong>
									</Popovers>
								</>
							) : (
								fundInfo?.map((item, index) => (
									<small key={item.id || index}>
										{item.label || 'NA'}
										{index !== fundInfo.length - 1 && ', '}
									</small>
								))
							)}
						</>
					) : (
						<small>{getLabelByValue(INVOICE_TO_TYPE_LIST, invoiceTo)}</small>
					)}
				</div>

				<div className='text-muted' title='Room info'>
					<Icon icon='Home' />{' '}
					<small>
						{room?.roomNumber || 'NA'}
						{bed ? (
							<>
								{'-'}
								{bed?.bedName}
							</>
						) : (
							''
						)}
					</small>
				</div>
			</div>
		</div>
	);
};
