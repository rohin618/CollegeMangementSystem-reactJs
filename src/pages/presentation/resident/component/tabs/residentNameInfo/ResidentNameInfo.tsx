import React from 'react';
import moment from 'moment';
import classNames from 'classnames';
import { RESIDENT_STATUS_LIST } from '../../../../../../common/data/option';
import {
	getColorByValue,
	getLabelByValue,
	getFundTypes,
	getActiveWeekInfoByEndDate,
	priceFormat,
	getActiveFundDetails,
} from '../../../../../../helpers/helpers';
import { Card, CardBody, CardTitle } from '../../../../../../components/bootstrap';
import Icon from '../../../../../../components/icon';
import Avatar from '../../../../../../components/Avatar';
import { BLOCK_BEDS_TYPE, PREBOOK_TYPE } from '../../../../../../common/constant';

type ResidentNameInfoProps = {
	residentData: any;
};

export const ResidentNameInfo = ({ residentData }: ResidentNameInfoProps) => {
	const statusColor = getColorByValue(
		RESIDENT_STATUS_LIST,
		residentData?.admission?.residentStatus,
	);
	const statusLabel = getLabelByValue(
		RESIDENT_STATUS_LIST,
		residentData?.admission?.residentStatus,
	);

	const admission = residentData?.admission || {};
	const admissionDate = admission?.admissionDate
		? moment(admission.admissionDate).format('DD MMM YYYY')
		: '-';
	const dischargeDate = admission?.dateDischargeAndRip
		? moment(admission.dateDischargeAndRip).format('DD MMM YYYY')
		: '-';
	const fundTypes = getFundTypes(residentData);
	const validRoomPrice = getActiveWeekInfoByEndDate(residentData?.roomPrice);
	const activeFund = getActiveFundDetails(residentData?.fundDetails);
	return (
		<Card className='shadow-3d-primary mb-4'>
			<CardBody className='py-4'>
				<div className='d-flex align-items-center justify-content-between mb-3'>
					<div className='d-flex align-items-center gap-3'>
						<Avatar
							src='https://facit-zen.omtanke.studio/static/media/wanna3.3ae77f2526857e4c2185.webp'
							color='primary'
							size={48}
						/>
						<CardTitle tag='h3' className='display-6 fw-bold mb-0'>
							{residentData?.personal?.name}
							<div className='text-muted small fs-6 mt-1'>
								{residentData?.code}
							</div>
						</CardTitle>
					</div>

					{+activeFund?.blockBedStatus === BLOCK_BEDS_TYPE.YES && (
						<div
							style={{ minWidth: 120 }}
							className={classNames(
								`bg-l10-${statusColor}`,
								`text-${statusColor}`,
								'fw-bold py-2 rounded-pill text-center',
							)}>
							<Icon icon='circle' color={statusColor} className='me-2' />
							{statusLabel}
						</div>
					)}
				</div>

				{/* Divider */}
				<hr className='my-3' />

				{/* Bottom Section: Four Info Fields (with Icons) */}
				<div className='row g-4'>
					{/* Admission Date */}
					<div className='col-md-6 col-sm-12 d-flex align-items-center'>
						<div className='flex-shrink-0'>
							<Icon icon='Login' size='2x' color='primary' />
						</div>
						<div className='flex-grow-1 ms-3'>
							<div className='fw-bold fs-6 mb-0'>{admissionDate}</div>
							<div className='text-muted'>Admission Date</div>
						</div>
					</div>

					{/* Discharge Date */}
					<div className='col-md-6 col-sm-12 d-flex align-items-center'>
						<div className='flex-shrink-0'>
							<Icon icon='Logout' size='2x' color='primary' />
						</div>
						<div className='flex-grow-1 ms-3'>
							<div className='fw-bold fs-6 mb-0'>{dischargeDate}</div>
							<div className='text-muted'>Discharge/RIP Date</div>
						</div>
					</div>

					{/* Fund Source */}
					<div className='col-md-6 col-sm-12 d-flex align-items-center'>
						<div className='flex-shrink-0'>
							<Icon icon='Foundation' size='2x' color='primary' />
						</div>
						<div className='flex-grow-1 ms-3'>
							<div className='fw-bold fs-6 mb-0'>
								{`${fundTypes?.fundName || ''}${
									fundTypes?.fnc ? `, ${fundTypes.fnc}` : ''
								}` || '-'}
							</div>
							<div className='text-muted'>Fund Source</div>
						</div>
					</div>

					{/* Room Rate (Per Week) */}
					<div className='col-md-6 col-sm-12 d-flex align-items-center'>
						<div className='flex-shrink-0'>
							<span className='text-primary fs-2 ms-2'>£</span>
						</div>
						<div className='flex-grow-1 ms-3'>
							<div className='fw-bold fs-6 mb-0'>
								{priceFormat(+validRoomPrice?.perWeek || 0)}
							</div>
							<div className='text-muted'>Room Rate (Per Week)</div>
						</div>
					</div>
				</div>
			</CardBody>
		</Card>
	);
};

export default ResidentNameInfo;
