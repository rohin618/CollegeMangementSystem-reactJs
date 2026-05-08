import React, { useMemo, useState } from 'react';
import {
	Card,
	CardBody,
	CardHeader,
	CardLabel,
	CardTitle,
	CardActions,
	Button,
	FormGroup,
} from '../../../../../../components/bootstrap';
import { useQuery } from '@tanstack/react-query';
import {
	createFollowUps,
	updateFollowUps,
	buildFollowUpTree,
	getFollowUpsByCompanyId,
	deleteFollowUpById,
} from '../../../../../../common/api/followUps';
import {
	useRemoveItemQueryListById,
	useSearch,
	useUpdateQueryListById,
} from '../../../../../../hooks';
import { FOLLOW_UP_BASE } from '../../../../../../common/model/followUps';
import { FOLLOW_UP_STATUS, FOLLOW_UP_TO_TYPE } from '../../../../../../common/constant';
import AddFollowUpNotes from './addNotes';
import { FollowUpCard } from './followUpCard';
import { FOLLOW_UP_TYPE } from '../../../../../../common/constant/app';
import { IFollowUpBase } from '../../../../../../common/interface/followup';
import Icon from '../../../../../../components/icon';
import { showAlert } from '../../../../../../helpers/alerts';
import { serverTimestamp } from 'firebase/firestore';
import moment from 'moment';
import { SearchableSelect } from '../../../../../../components/common';
import {
	FOLLOW_UP_PRIORITY_LIST,
	FOLLOW_UP_STATUS_LIST,
} from '../../../../../../common/data/option';

type ResidentNotesInfoProps = {
	residentData: any;
};

export const ResidentNotesInfo: React.FC<ResidentNotesInfoProps> = ({ residentData }) => {
	const [notesFormData, setNotesFormData] = useState<IFollowUpBase>({ ...FOLLOW_UP_BASE });
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [minDateFromParent, setMinDateFromParent] = useState('');

	const [isEdit, setIsEdit] = useState(false);

	const { data: followUps = [] } = useQuery({
		queryKey: ['followUps', residentData?.id],
		queryFn: () =>
			getFollowUpsByCompanyId({
				followUpToId: residentData?.id,
				followUpTo: FOLLOW_UP_TO_TYPE.RESIDENT,
			}),
		enabled: !!residentData?.id,
		staleTime: 5 * 60 * 1000,
	});

	const followUpLists = useMemo(() => {
		return buildFollowUpTree(followUps);
	}, [followUps]);

	const {
		searchValue,
		setSearchValue,
		filteredList: filteredFollowUpsList,
	} = useSearch(followUpLists, ['status']);

	const updateFollowUpList = useUpdateQueryListById<any>(['followUps', residentData?.id]);
	
	const { removeItemById: removeFollowUpById } = useRemoveItemQueryListById<any>({
		queryKey: ['followUps', residentData?.id],
	});

	const onChangeFollowupNotes = (e: any) => {
		const { id, value, checked, type } = e.target;
		setNotesFormData((prev) => ({
			...prev,
			[id]: type === 'checkbox' ? checked : value,
		}));
	};

	const handleCreateFollowUps = async (extraPayload = {}) => {
		const payload = {
			...notesFormData,
			followUpToId: residentData?.id,
			...extraPayload,
		};

		const response = await createFollowUps(payload);
		updateFollowUpList(response);
	};

	const handleUpdateFollowUps = async (id: string | undefined) => {
		if (!id) return;
		const payload = {
			...notesFormData,
		};
		const response = await updateFollowUps(id, payload);
		updateFollowUpList(response);
	};

	const deleteFollowUp = async (id: string) => {
		showAlert({
			title: 'Are you sure?',
			text: "You won't be able to revert this!",
			icon: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Yes, delete it!',
			cancelButtonText: 'Cancel',

			onConfirm: async () => {
				await deleteFollowUpById(id);
				removeFollowUpById(id);
			},
		});
	};

	const toggleStatus = async (data: any) => {
		const isCompleting = +data?.status === FOLLOW_UP_STATUS.PENDING;

		const payload = {
			...data,
			status: isCompleting ? FOLLOW_UP_STATUS.COMPLETED : FOLLOW_UP_STATUS.PENDING,

			completedAt: isCompleting ? serverTimestamp() : null,
		};
		const response = await updateFollowUps(data?.id, payload);
		updateFollowUpList(response);
	};

	const handleEditFollowUps = (data: any) => {
		setNotesFormData(data);
		setIsEdit(true);
		setIsModalOpen(true);
	};
	const handleToggleModal = () => {
		setIsModalOpen(false);
		setNotesFormData({ ...FOLLOW_UP_BASE });
		setMinDateFromParent('');
	};
	const stats = useMemo(() => {
		const total = followUpLists?.length || 0;

		const pending = followUpLists.filter(
			(f: any) => f.status === FOLLOW_UP_STATUS.PENDING,
		).length;

		const completed = followUpLists.filter(
			(f: any) => f.status === FOLLOW_UP_STATUS.COMPLETED,
		).length;

		const today = moment().startOf('day');

		const overdue = followUpLists.filter((f: any) => {
			if (!f.followUpDate) return false;
			if (f.status === FOLLOW_UP_STATUS.COMPLETED) return false;

			return moment(f.followUpDate).startOf('day').isBefore(today);
		}).length;

		return [
			{
				title: 'Total Follow-ups',
				value: total,
				icon: 'Notes',
				color: 'text-dark',
			},
			{
				title: 'Pending',
				value: pending,
				icon: 'Pending',
				color: 'text-warning',
			},
			{
				title: 'Completed',
				value: completed,
				icon: 'CheckCircle',
				color: 'text-success',
			},
			{
				title: 'Overdue',
				value: overdue,
				icon: '',
				color: 'text-danger',
			},
		];
	}, [followUpLists]);

	return (
		<>
			<div className='row'>
				{stats.map((stat, index) => (
					<div className='col-md-3' key={index}>
						<Card className='p-4 d-flex justify-content-between align-items-center flex-row'>
							<div>
								<div className='text-muted mb-1'>{stat.title}</div>
								<h4 className={`fw-bold mb-0 ${stat.color}`}>{stat.value}</h4>
							</div>

							<div className='d-flex align-items-center justify-content-center'>
								<Icon icon={stat.icon} size='2x' className={stat.color} />
							</div>
						</Card>
					</div>
				))}
			</div>
			<Card>
				<CardHeader>
					<CardLabel icon='notes' iconColor='info'>
						<CardTitle className='h5'>Follow Ups</CardTitle>
					</CardLabel>

					<CardActions>
						<Button
							size='sm'
							isLight
							color='primary'
							onClick={() => {
								setNotesFormData({
									...FOLLOW_UP_BASE,
									parentFollowUpId: null, // parent follow-up
								});
								setIsModalOpen(true);
							}}>
							+ Add Follow-up
						</Button>
					</CardActions>
				</CardHeader>

				<CardBody>
					<div className='row mb-4'>
						<div className='col-md-4'>
							<FormGroup id='searchList' label='Follow Ups Status'>
								<SearchableSelect
									id='searchList'
									value={searchValue}
									onChange={(e: any) => setSearchValue(e.target.value)}
									options={FOLLOW_UP_STATUS_LIST}
									placeholder='Select Follow Ups Status'
								/>
							</FormGroup>
						</div>

						<div className='col-md-4 d-flex align-items-end'>
							<Button
								color='link'
								className='text-decoration-none text-primary fw-semibold p-0 d-flex align-items-center gap-1 justify-content-center'
								onClick={() => setSearchValue('')}>
								<Icon icon='Refresh' size='lg' className='text-primary' />
								Reset
							</Button>
						</div>
					</div>
					<div className='d-flex flex-column gap-3'>
						{filteredFollowUpsList?.map((item: any) => (
							<FollowUpCard
								key={item.id}
								item={item}
								onDelete={deleteFollowUp}
								onToggleStatus={toggleStatus}
								onEdit={() => {
									handleEditFollowUps(item);
								}}
								residentData={residentData}
								onAddSubFollowUp={() => {
									setNotesFormData({
										...FOLLOW_UP_BASE,
										parentFollowUpId: item.id, // sub follow-up
										followUpType: FOLLOW_UP_TYPE.SUB,
									});
									setIsEdit(false);
									setIsModalOpen(true);
									setMinDateFromParent(item.followUpDate);
								}}>
								{/* SUB FOLLOW UPS */}
								{item.subFollowUps?.length > 0 && (
									<div className='mt-3 ps-3 border-start border-1 border-dark'>
										{item.subFollowUps.map((sub: any) => (
											<FollowUpCard
												key={sub.id}
												item={sub}
												onDelete={deleteFollowUp}
												onToggleStatus={toggleStatus}
												onEdit={() => {
													handleEditFollowUps(sub);
												}}
												residentData={residentData}
											/>
										))}
									</div>
								)}
							</FollowUpCard>
						))}
					</div>
				</CardBody>
			</Card>

			{/* SHARED MODAL */}
			<AddFollowUpNotes
				isOpen={isModalOpen}
				toggle={handleToggleModal}
				title={isEdit ? 'Edit Follow-up Note' : 'Add Follow-up Note'}
				isEdit={isEdit}
				notesFormData={notesFormData}
				onChangeFollowupNotes={onChangeFollowupNotes}
				onSubmit={
					isEdit ? () => handleUpdateFollowUps(notesFormData?.id) : handleCreateFollowUps
				}
				minDateFromParent={minDateFromParent}
			/>
		</>
	);
};
