import React, { useState } from 'react';
import {
	Badge,
	Button,
	Card,
	CardBody,
	Dropdown,
	DropdownItem,
	DropdownMenu,
	DropdownToggle,
} from '../../../../../../../components/bootstrap';
import {
	FOLLOW_UP_PRIORITY_LIST,
	FOLLOW_UP_STATUS_LIST,
	SALUTATION_LIST,
} from '../../../../../../../common/data/option';
import { FOLLOW_UP_STATUS } from '../../../../../../../common/constant';
import { getColorByValue, getLabelByValue } from '../../../../../../../helpers/helpers';
import Icon from '../../../../../../../components/icon';
import moment from 'moment';

type FollowUpCardProps = {
	item: any;
	onDelete: (id: string) => void;
	onToggleStatus: (item: any) => void;
	onAddSubFollowUp?: () => void;
	children?: React.ReactNode;
	onEdit?: () => void;
	residentData: any;
};

export const FollowUpCard: React.FC<FollowUpCardProps> = ({
	item,
	onDelete,
	onToggleStatus,
	onAddSubFollowUp,
	onEdit,
	children,
	residentData,
}) => {
	const [showSubFollowUps, setShowSubFollowUps] = useState(false);

	const subCount = item?.subFollowUps?.length || 0;

	return (
		<Card
			className={`shadow-none ${onAddSubFollowUp ? '' : 'border border-light rounded-1 p-2'}`}>
			<CardBody
				className={` ${onAddSubFollowUp ? 'py-3 border border-light rounded-1' : 'py-1'}`}>
				{/* HEADER */}
				<div className='d-flex justify-content-between align-items-center'>
					<div className='d-flex gap-2'>
						{onAddSubFollowUp && (
							<>
								<Badge
									isLight
									color={getColorByValue(FOLLOW_UP_PRIORITY_LIST, item.priority)}>
									{getLabelByValue(FOLLOW_UP_PRIORITY_LIST, item.priority)}
								</Badge>

								<Badge
									isLight
									color={getColorByValue(FOLLOW_UP_STATUS_LIST, item.status)}>
									{getLabelByValue(FOLLOW_UP_STATUS_LIST, item.status)}
								</Badge>
							</>
						)}

						{item.followUpDate && (
							<div className='d-flex justify-content-center align-items-center gap-1'>
								<Icon icon='DateRange' />
								<span className='fw-medium'>
									{moment(item.followUpDate).format('DD MMM YYYY')}
								</span>
							</div>
						)}
					</div>

					<div className='d-flex gap-2'>
						<Dropdown>
							<DropdownToggle hasIcon={false}>
								<Button icon='MoreHoriz' color='dark' isLight shadow='sm' />
							</DropdownToggle>
							<DropdownMenu isAlignmentEnd={false} direction={'right'}>
								<DropdownItem>
									<Button
										size='sm'
										isLight
										color='info'
										icon='edit'
										onClick={onEdit}>
										Edit
									</Button>
								</DropdownItem>
								{onAddSubFollowUp && (
									<DropdownItem>
										<Button
											size='sm'
											isLight
											icon={
												+item.status === FOLLOW_UP_STATUS.COMPLETED
													? 'Block'
													: 'CheckCircle'
											}
											color={
												item.status === FOLLOW_UP_STATUS.COMPLETED
													? 'warning'
													: 'success'
											}
											onClick={() => onToggleStatus(item)}>
											{item.status === FOLLOW_UP_STATUS.COMPLETED
												? 'Mark Pending'
												: 'Mark Complete'}
										</Button>
									</DropdownItem>
								)}
								<DropdownItem>
									<Button
										size='sm'
										isLight
										color='danger'
										icon='delete'
										onClick={() => onDelete(item.id)}>
										Delete
									</Button>
								</DropdownItem>
							</DropdownMenu>
						</Dropdown>
					</div>
				</div>

				{onAddSubFollowUp && (
					<div className='d-flex align-items-center gap-2 my-2'>
						<Icon icon='person' size='lg' />
						<span className='fw-bold fs-5'>
							{getLabelByValue(SALUTATION_LIST, residentData?.personal?.salutation)}.{' '}
							{residentData?.personal?.name}
						</span>
					</div>
				)}

				<p className='fw-medium  mb-0 text-muted'>{item.notes}</p>

				<div className={`d-flex flex-column gap-1 mt-2 align-items-start ${onAddSubFollowUp && 'mt-5'}`}>
					{onAddSubFollowUp && (
						<Button
							size='sm'
							isLight
							color='primary'
							className='w-auto'
							onClick={onAddSubFollowUp}>
							+ Add new Sub Follow-up
						</Button>
					)}

					{subCount > 0 && (
						<Button
							size='sm'
							isLight
							color='link'
							className='w-auto d-flex align-items-center gap-1 px-0'
							onClick={() => setShowSubFollowUps((p) => !p)}>
							<Icon icon={showSubFollowUps ? 'chevron-down' : 'chevron-right'} />
							<span>
								{showSubFollowUps
									? `Hide Sub Follow-ups (${subCount})`
									: `Show All Sub Follow-ups (${subCount})`}
							</span>
						</Button>
					)}
				</div>

				{showSubFollowUps && children}
			</CardBody>
		</Card>
	);
};
