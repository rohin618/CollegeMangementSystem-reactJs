import React, { useMemo } from 'react';
import {
	Badge,
	Button,
	Card,
	Modal,
	ModalBody,
	ModalHeader,
	ModalTitle,
} from '../../../../../../components/bootstrap';
import moment from 'moment';
import {
	getActiveFundDetails,
	getActiveIncontDetailsDetails,
	getActiveWeekInfoByEndDate,
	getColorByValue,
	getLabelByValue,
	priceFormat,
} from '../../../../../../helpers/helpers';
import {
	BED_STATUS_LIST,
	BOOKING_TYPE_LIST,
	RESIDENT_STATUS_LIST,
} from '../../../../../../common/data/option';
import { DataTable, ResidentProfileCard } from '../../../../../../components/common';
import { getColorNameWithIndex } from '../../../../../../common/data/enumColors';
import Icon from '../../../../../../components/icon';
import {
	FNC_STATUS_TYPE,
	INCONT_STATUS_TYPE,
	RESIDENT_STATUS,
} from '../../../../../../common/constant';
import { useNavigate } from 'react-router-dom';
import { pagesMenu } from '../../../../../../menu';
import { useMasterData } from '../../../../../../contexts/mastersContext';

interface BedHistoryProps {
	isOpen?: boolean;
	toggle?: () => void;
	bedDetails?: any;
}

const BedHistory: React.FC<BedHistoryProps> = ({
	isOpen = false,
	toggle = () => {},
	bedDetails = [],
}) => {
	const history = bedDetails?.history ?? [];
	const navigate = useNavigate();

	const { fNCDetails, isLoading: isFncLoading } = useMasterData();

	const stats = [
		{
			title: 'Total',
			count: history.length,
			colorClass: 'text-primary',
			iconClass: 'person',
		},
		{
			title: 'Active',
			count: history.filter(
				(h: any) => +h?.residentData?.admission?.residentStatus === RESIDENT_STATUS.LIVING,
			).length,
			colorClass: 'text-success',
			iconClass: 'Login',
		},
		{
			title: 'Discharge/RIP',
			count: history.filter(
				(h: any) => +h?.residentData?.admission?.residentStatus !== RESIDENT_STATUS.LIVING,
			).length,
			colorClass: 'text-danger',
			iconClass: 'logout',
		},
	];
	const bedHistoryTableData = useMemo(() => {
		const history = bedDetails?.history ?? [];

		return history.map((bedHistory: any, index: number) => {
			const weeklyPrice = getActiveWeekInfoByEndDate(bedHistory?.residentData?.roomPrice);

			const activeFund = getActiveFundDetails(bedHistory?.residentData?.fundDetails);
			let incAmt = 0;

			if (activeFund && +activeFund?.incontStatus === INCONT_STATUS_TYPE.YES) {
				const incDetails = getActiveWeekInfoByEndDate(activeFund?.incontDetails);
				incAmt = Number(incDetails?.perWeek || 0);
			}

			let fncAmt = 0;
			if (activeFund && +activeFund?.fncStatus === FNC_STATUS_TYPE.YES) {
				const fncDetails = getActiveWeekInfoByEndDate((fNCDetails as any)?.priceInfo);
				fncAmt = Number(fncDetails?.perWeek || 0);
			}

			return {
				id: index + 1,
				index: index + 1,
				residentName: bedHistory?.residentData?.personal?.name,
				resident: bedHistory?.residentData,
				colorIndex: getColorNameWithIndex(index),
				dob: bedHistory?.residentData?.personal?.dob,
				dateDischargeAndRip: bedHistory?.residentData?.admission?.dateDischargeAndRip,
				weeklyPrice: weeklyPrice?.perWeek,
				outstandingAmount: bedHistory?.outstandingAmount,
				status: bedHistory?.residentData?.admission?.residentStatus,
				note: bedHistory?.note,
				incAmt: incAmt + fncAmt,
				residentId: bedHistory?.residentData?.id,
				admissionDate: bedHistory?.residentData?.admission?.admissionDate,
				startDate: bedHistory?.sDate,
				endDate: bedHistory?.eDate,
			};
		});
	}, [bedDetails?.history, fNCDetails]);
	const bedHistoryColumns = [
		{
			label: '#',
			key: 'index',
		},

		{
			label: 'Resident',
			key: 'residentName',
			sortable: true,
			render: (row: any) => (
				<div
					role='button'
					className='cursor-pointer'
					onClick={() => navigate(`/resident/details/${row?.residentId}`)}>
					<ResidentProfileCard resident={row.resident} colorIndex={row.colorIndex} />
				</div>
			),
		},

		{
			label: 'DOB',
			key: 'dob',
			sortable: true,
			render: (row: any) => moment(row.dob).format('DD MMM YYYY') || '-',
		},

		{
			label: 'Weekly Price',
			key: 'weeklyPrice',
			sortable: true,
			render: (row: any) => (
				<div className='text-end'>
					{row.weeklyPrice ? priceFormat(row.weeklyPrice) : '-'}
				</div>
			),
		},

		{
			label: 'FNC/INC Amount',
			key: 'incAmt',
			sortable: true,
			render: (row: any) => (
				<div className='text-end'>{row.incAmt ? priceFormat(row.incAmt) : '-'}</div>
			),
		},

		{
			label: 'Admission Date',
			key: 'admissionDate',
			sortable: true,
			render: (row: any) =>
				row?.admissionDate ? moment(row?.admissionDate).format('DD MMM YYYY') : '-',
		},

		{
			label: 'Discharge / RIP Date',
			key: 'dateDischargeAndRip',
			sortable: true,
			render: (row: any) =>
				row?.dateDischargeAndRip
					? moment(row?.dateDischargeAndRip).format('DD MMM YYYY')
					: '-',
		},

		{
			label: 'Outstanding',
			key: 'outstandingAmount',
			sortable: true,
			render: (row: any) => (
				<div className='text-end'>
					<strong className={row.outstandingAmount ? 'text-danger' : ''}>
						{priceFormat(row.outstandingAmount)}
					</strong>
				</div>
			),
		},

		{
			label: 'Resident Status',
			key: 'status',
			render: (row: any) => (
				<>
					<Button
						isLink
						size='sm'
						icon='circle'
						color={getColorByValue(RESIDENT_STATUS_LIST, row.status)}>
						{getLabelByValue(RESIDENT_STATUS_LIST, row.status)}
					</Button>
				</>
			),
		},

		{
			label: 'Start Date',
			key: 'startDate',
			render: (row: any) =>
				row?.startDate ? moment(row.startDate).format('DD-MMM-YYYY') : '-',
		},
		{
			label: 'End Date',
			key: 'endDate',
			render: (row: any) => (row?.endDate ? moment(row.endDate).format('DD-MMM-YYYY') : '-'),
		},
		{
			label: 'Notes',
			key: 'note',
			render: (row: any) => row.note || '-',
		},
	];

	return (
		<Modal
			titleId='bedHistoryModal'
			placement='end'
			isOpen={isOpen}
			setIsOpen={toggle}
			size='xl'
			isCentered>
			<ModalHeader setIsOpen={toggle}>
				<ModalTitle id='bedHistoryModal'>Bed History - {bedDetails?.bedName}</ModalTitle>
			</ModalHeader>

			<ModalBody>
				<>
					<div className='row mb-4'>
						{stats.map((stat, index) => (
							<div key={index} className='col-md-4'>
								<Card className='py-4 px-4'>
									<div className='d-flex justify-content-between align-items-center'>
										{/* Left side: Title + Count */}
										<div>
											<div className='text-muted small'>{stat.title}</div>
											<h4 className={`fw-bold mb-0 ${stat.colorClass}`}>
												{stat.count}
											</h4>
										</div>

										{/* Right side: Icon */}
										<div className={`fs-2 ${stat.colorClass}`}>
											<Icon icon={stat.iconClass} />
										</div>
									</div>
								</Card>
							</div>
						))}
					</div>

					<DataTable
						fixed
						columns={bedHistoryColumns}
						data={bedHistoryTableData}
						isLoading={false}
						pagination={false}
						search={false}
					/>
				</>
			</ModalBody>
		</Modal>
	);
};

export default BedHistory;
