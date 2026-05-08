import React, { useMemo } from 'react';
import moment from 'moment';
import {
	Card,
	CardBody,
	CardHeader,
	CardLabel,
	CardTitle,
} from '../../../../../../components/bootstrap';

import {
	PLACEMENT_LIST,
	RESPITE_STATUS_LIST,
	INVOICE_REQUEST_LIST,
	INVOICE_MODE_LIST,
	CONTRACT_STATUS_LIST,
	RESIDENT_STATUS_LIST,
	BOOKING_TYPE_LIST,
} from '../../../../../../common/data/option';

import {
	getLabelByValue,
	getFundTypes,
	getActiveRespiteDetails,
} from '../../../../../../helpers/helpers';
import {
	FUND_SOURCE_TYPE,
	PLACEMENT_TYPE,
	RESPITE_STATUS_TYPE,
	RESIDENT_STATUS_TYPE,
} from '../../../../../../common/constant';

type Props = {
	residentData: any;
	localICBList?: any[];
	localAuthorityList?: any[];
	fNCDetails?: any;
};

export const AdmissionResidentInfo = ({
	residentData,
	localICBList = [],
	localAuthorityList = [],
	fNCDetails = {},
}: Props) => {
	const admission = residentData?.admission || {};

	const validRespiteStatus = getActiveRespiteDetails(admission?.respiteStatusList);

	const fundDetail = getFundTypes(residentData);

	const isPermanent =
		+admission.typeOfPlacement === PLACEMENT_TYPE.PERMANENT ||
		+validRespiteStatus?.status === RESPITE_STATUS_TYPE.EXTENDED_WITH_PERMANENT;

	const displayData = useMemo(() => {
		const rows: [string, any][] = [
			[
				'Admission Date',
				admission?.admissionDate && moment(admission.admissionDate).format('DD MMM YYYY'),
			],
			['Type of Placement', getLabelByValue(PLACEMENT_LIST, admission.typeOfPlacement)],
			['Invoice Request', getLabelByValue(INVOICE_REQUEST_LIST, admission.invoiceRequest)],
			['Invoice Mode', getLabelByValue(INVOICE_MODE_LIST, admission.invoiceMode)],
			['Contract Status', getLabelByValue(CONTRACT_STATUS_LIST, admission.contractStatus)],
			['Resident Status', getLabelByValue(RESIDENT_STATUS_LIST, admission.residentStatus)],
			['Booking Type', getLabelByValue(BOOKING_TYPE_LIST, admission.bookingType)],
		];

		// Respite-only fields
		if (+admission.typeOfPlacement === PLACEMENT_TYPE.RESPITE && !isPermanent) {
			rows.push(
				[
					'Respite Start Date',
					admission?.respiteSDate && moment(admission.respiteSDate).format('DD MMM YYYY'),
				],
				[
					'Respite End Date',
					admission?.respiteEDate && moment(admission.respiteEDate).format('DD MMM YYYY'),
				],
				['No. of Respite Weeks', admission?.noOfRespiteWeeks],
				// [
				// 	'Respite Status',
				// 	getLabelByValue(RESPITE_STATUS_LIST, validRespiteStatus?.status),
				// ],
				// [
				// 	'Respite Status Start Date',
				// 	validRespiteStatus?.sDate &&
				// 		moment(validRespiteStatus.sDate).format('DD MMM YYYY'),
				// ],
				// [
				// 	'Respite Status End Date',
				// 	validRespiteStatus?.eDate &&
				// 		moment(validRespiteStatus.eDate).format('DD MMM YYYY'),
				// ],
			);
		}

		// RIP / LEFT
		if (
			[RESIDENT_STATUS_TYPE.RIP, RESIDENT_STATUS_TYPE.LEFT].includes(
				admission.residentStatus,
			)
		) {
			rows.push([
				'Date of Discharge / RIP',
				admission?.dateDischargeAndRip &&
					moment(admission.dateDischargeAndRip).format('DD MMM YYYY'),
			]);
		}

		return rows.filter(([_, value]) => value);
	}, [admission, validRespiteStatus, isPermanent]);

	const activeRespiteStatus = validRespiteStatus?.status;

	const shouldShowRespiteInfo =
		+admission.typeOfPlacement === PLACEMENT_TYPE.RESPITE &&
		admission.respiteSDate &&
		admission.respiteEDate &&
		admission.respiteStatusList?.length > 0 &&
		getActiveRespiteDetails(admission?.respiteStatusList);

	const shouldShowFeesIncrement =
		(+activeRespiteStatus === RESPITE_STATUS_TYPE.EXTENDED_WITH_PERMANENT ||
			+admission.typeOfPlacement === PLACEMENT_TYPE.PERMANENT) &&
		+fundDetail?.fundSource === FUND_SOURCE_TYPE.PRIVATE;

	return (
		<Card className='shadow-3d-primary'>
			<CardHeader>
				<CardLabel icon='admission'>
					<CardTitle tag='h5' className='mb-0 text-primary fw-semibold fs-5'>
						Admission Information
					</CardTitle>
				</CardLabel>
			</CardHeader>	
			<CardBody>
				<div className='row'>
					{displayData.map(([label, value], index) => (
						<div className='col-md-6 col-sm-12 mb-3' key={index}>
							<div className='text-muted fw-medium mb-1 fs-6'>{label}</div>
							<div className='fw-semibold fs-6'>{value}</div>
						</div>
					))}
				</div>

				{shouldShowRespiteInfo && (
					<RespiteInfoSummaryCard respiteList={admission.respiteStatusList} />
				)}

				{shouldShowFeesIncrement && (
					<FeesIncrementSummaryCard
						incrementList={getActiveRespiteDetails(admission.feesIncrementInfo)}
					/>
				)}
			</CardBody>
		</Card>
	);
};

export default AdmissionResidentInfo;

const FeesIncrementSummaryCard = ({ incrementList = [] }: { incrementList: any[] }) => {
	if (!incrementList?.length) return null;

	return (
		<Card shadow='none' borderSize={1} className='mt-3'>
			<CardHeader>
				<CardLabel>
					<CardTitle tag='div' className='h6'>
						Fees Increment Information
					</CardTitle>
				</CardLabel>
			</CardHeader>

			<CardBody>
				<table className='table table-modern table-hover'>
					<thead>
						<tr>
							<th>Increment (%)</th>
							<th>Increment Date</th>
						</tr>
					</thead>
					<tbody>
						{incrementList?.map((item, index) => (
							<tr key={index}>
								<td>{item.percentage}%</td>
								<td>{item.date ? moment(item.date).format('DD MMM YYYY') : '-'}</td>
							</tr>
						))}
					</tbody>
				</table>
			</CardBody>
		</Card>
	);
};

const RespiteInfoSummaryCard = ({ respiteList = [] }: { respiteList: any[] }) => {
	if (!respiteList?.length) return null;

	return (
		<Card shadow='none' borderSize={1} className='mt-3'>
			<CardHeader>
				<CardLabel>
					<CardTitle tag='div' className='h6'>
						Respite Information
					</CardTitle>
				</CardLabel>
			</CardHeader>

			<CardBody>
				<table className='table table-modern table-hover'>
					<thead>
						<tr>
							<th>Status</th>
							<th>Start Date</th>
							<th>End Date</th>
						</tr>
					</thead>
					<tbody>
						{respiteList?.map((item, index) => (
							<tr key={index}>
								<td>{getLabelByValue(RESPITE_STATUS_LIST, item.status)}</td>
								<td>
									{item.sDate ? moment(item.sDate).format('DD MMM YYYY') : '-'}
								</td>
								<td>
									{+item.status === RESPITE_STATUS_TYPE.EXTENDED_WITH_PERMANENT
										? 'Permanent'
										: item.eDate
											? moment(item.eDate).format('DD MMM YYYY')
											: '-'}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</CardBody>
		</Card>
	);
};
