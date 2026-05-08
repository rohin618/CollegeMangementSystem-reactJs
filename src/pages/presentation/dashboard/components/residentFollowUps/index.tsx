import React, { useMemo, useState } from 'react';
import {
	Card,
	CardBody,
	CardHeader,
	CardLabel,
	CardTitle,
	CardSubTitle,
	CardTabItem,
	Button,
	Popovers,
} from '../../../../../components/bootstrap';
import Icon from '../../../../../components/icon';
import { ResidentProfileCard } from '../../../../../components/common';
import { useQuery } from '@tanstack/react-query';
import { FOLLOW_UP_STATUS, FOLLOW_UP_TO_TYPE } from '../../../../../common/constant';
import { getFollowUpsByCompanyId } from '../../../../../common/api/followUps';
import moment from 'moment';
import { getColorNameWithIndex } from '../../../../../common/data/enumColors';
import { useNavigate } from 'react-router-dom';
import Tooltips from '../../../../../components/bootstrap/Tooltips';

interface followUpInfoCardProps {
	residentInfo?: any[];
}
export const ResidentFollowupsInfo: React.FC<followUpInfoCardProps> = ({ residentInfo = [] }) => {
	const [activeTab, setActiveTab] = useState(0);
	const navigate = useNavigate();

	const followupsParams = [FOLLOW_UP_TO_TYPE.RESIDENT];

	const { data: followUpsList = [] } = useQuery({
		queryKey: ['followUpsParentByCompany'],
		queryFn: () => getFollowUpsByCompanyId({ followUpTo: followupsParams }),
		staleTime: 5 * 60 * 1000,
	});

	const followUpsListWithResidentData = useMemo(() => {
		const residentMap = new Map(residentInfo.map((resident: any) => [resident.id, resident]));

		return followUpsList.map((followUp: any) => ({
			...followUp,
			residentData: residentMap.get(followUp.followUpToId) || null,
		}));
	}, [followUpsList, residentInfo]);

	const today = moment().startOf('day');

	const { pendingList, overdueList, todayDueList } = useMemo(() => {
		const pending: any[] = [];
		const overdue: any[] = [];
		const todayDue: any[] = [];

		followUpsListWithResidentData.forEach((item: any) => {
			// only PENDING items are classified
			if (item.status !== FOLLOW_UP_STATUS.PENDING) return;

			if (!item.followUpDate) {
				// no date → normal pending
				pending.push(item);
				return;
			}

			const followUpDay = moment(item.followUpDate).startOf('day');

			if (followUpDay.isBefore(today)) {
				overdue.push(item);
			} else if (followUpDay.isSame(today)) {
				todayDue.push(item);
			} else {
				pending.push(item);
			}
		});

		return {
			pendingList: pending,
			overdueList: overdue,
			todayDueList: todayDue,
		};
	}, [followUpsListWithResidentData]);

	return (
		<Card stretch>
			<CardHeader>
				<CardLabel icon='AssignmentLate' iconColor='warning'>
					<CardTitle className='h4 mb-1'>Follow-ups Status Info</CardTitle>
					<CardSubTitle tag='div' className='h6 text-muted'>
						Pending and overdue follow-ups across residents.
					</CardSubTitle>
				</CardLabel>
			</CardHeader>

			<CardBody
				className='p-0'
				style={{
					maxHeight: '350px',
					overflowY: 'auto',
					scrollbarWidth: 'thin',
				}}>
				<Card hasTab onTabChange={setActiveTab} className='h-100' shadow='none'>
					{/* ================= TODAY DUE ================= */}
					<CardTabItem id={1} title={`Today (${todayDueList.length})`} icon='Today'>
						<CardBody className='p-0'>
							{todayDueList.length ? (
								todayDueList.map((item, index) =>
									renderFollowUpRow(item, index, navigate),
								)
							) : (
								<div className='py-5 text-center text-muted'>
									No follow-ups due today.
								</div>
							)}
						</CardBody>
					</CardTabItem>

					{/* ================= OVERDUE ================= */}
					<CardTabItem id={2} title={`Overdue (${overdueList.length})`} icon='Warning'>
						<CardBody className='p-0'>
							{overdueList.length ? (
								overdueList.map((item, index) =>
									renderFollowUpRow(item, index, navigate),
								)
							) : (
								<div className='py-5 text-center text-muted'>
									No overdue follow-ups.
								</div>
							)}
						</CardBody>
					</CardTabItem>
				</Card>
			</CardBody>
		</Card>
	);
};

const renderFollowUpRow = (item: any, index: number, navigate: (path: string) => void) => {
	const colorIndex = getColorNameWithIndex(index);

	return (
		<div className='row my-2 border rounded p-3 bg-white'>
			{/* LEFT – Profile */}
			<div
				className='col-7 cursor-pointer'>
				<ResidentProfileCard resident={item?.residentData} colorIndex={colorIndex} />
			</div>

			{/* RIGHT – Content */}
			<div className='col-5 d-flex justify-content-end align-items-center'>
				{/* TOP RIGHT – Date + View */}
				<div className='d-flex justify-content-between align-items-center'>
					<div className='d-flex align-items-center text-muted gap-2 me-3'>
						<Icon icon='DateRange' size='sm' />
						<span className='fw-medium'>
							{item?.followUpDate
								? moment(item.followUpDate).format('DD MMM YYYY')
								: '--'}
						</span>
					</div>

					<Button
						color='info'
						isLight
						size='sm'
						icon='RemoveRedEye'
						onClick={() => navigate(`/resident/details/${item?.residentData?.id}`)}>
						View
					</Button>
				</div>
			</div>

			{/* BOTTOM – Notes */}
			<div className='mt-2 d-flex align-items-start'>
				<span className='fw-semibold me-2'>Notes:</span>
				<Popovers trigger='hover' desc={item?.notes || 'No notes available'}>
					<div
						className='text-muted text-truncate'
						style={{
							maxWidth: '100%',
							cursor: 'pointer',
						}}>
						{item?.notes || 'No notes available'}
					</div>
				</Popovers>
			</div>
		</div>
	);
};
