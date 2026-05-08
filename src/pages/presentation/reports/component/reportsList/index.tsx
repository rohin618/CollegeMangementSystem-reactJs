import { isSameDay } from 'date-fns';
import moment from 'moment';
import React, { useState } from 'react';
import { REPORT_TYPE } from '../../../../../common/constant/app';
import {
	Card,
	CardBody,
	CardHeader,
	CardLabel,
	CardTitle,
} from '../../../../../components/bootstrap';
import { useGetCurrentUserCompanyDetails } from '../../../../../hooks/useGetCurrentUserCompany';

// Child components
import { useMasterData } from '../../../../../contexts/mastersContext';
import { useResidentDetailsById } from '../../../../../hooks';
import { CreditNoteDoc } from '../../../creditWallet/component/creditNoteDoc';
import { InvoiceDetailViewModal } from '../../../invoice/component';
import { AR_AgeingDetail } from './AR_AgeingDetail';
import { AgeingSummary } from './AgeingSummary';
import { CashFlowAnalysisReport } from './CashFlowAnalysis';
import FNCReport from './FNCReport';
import { IncomeAnalysisReport } from './IncomeAnalysis';
import { SalesCustomerDetail } from './SalesCustomerDetail';

interface ReportsListCardProps {
	reportType: string;
	reportsList: any[];
	isLoading: boolean;
	data: any;
	localICBList?: any[];
	localAuthorityList?: any[];
	fNCDetails?: any;
	residentData?: any;
	isYearBasedReport?: any;
}

export const ReportsListCard: React.FC<ReportsListCardProps> = ({
	reportType,
	reportsList,
	isLoading,
	data,
	isYearBasedReport,
}) => {
	const company = useGetCurrentUserCompanyDetails();
	const isSame = isSameDay(data.report.startDate, data.report.endDate);
	const {
		localAuthorityList = [],
		localICBList = [],
		fNCDetails,
		isLoading: isMasterLoading,
	} = useMasterData();

	const [residentId, setResidentId] = useState<string>();
	const { data: residentData, isLoading: isLoadingResident } = useResidentDetailsById(
		residentId ?? '',
	);
	const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isDetailICreditInfoModal, setIsDetailICreditInfoModal] = useState(false);
	const [creditDetailInfo, setCreditDetailInfo] = useState<any>({});

	// 🟢 Open modal with invoice data
	const handleRowClick = (data: any) => {
		setSelectedInvoice(data.inv);
		setResidentId(data.residentId);
		setCreditDetailInfo(data?.w);
		if (data?.w) {
			setIsDetailICreditInfoModal(true);
		} else {
			setIsModalOpen(true);
		}
	};

	const handleCloseCreditNotesDoc = () => {
		setCreditDetailInfo({});
		setIsDetailICreditInfoModal(false);
	};
	// 🟢 Close modal
	const toggleModal = () => setIsModalOpen((prev) => !prev);

	if (!reportType) return null;

	const getReportComponent = () => {
		const commonProps = {
			reportsList,
			localAuthorityList,
			isLoading,
			localICBList,
			fNCDetails,
			onRowClick: handleRowClick, // pass handler to child
		};

		switch (reportType) {
			case REPORT_TYPE.AR_AGEING_DETAIL:
				return <AR_AgeingDetail {...commonProps} />;
			case REPORT_TYPE.AGEING_SUMMARY:
				return <AgeingSummary {...commonProps} />;
			case REPORT_TYPE.SALES_CUSTOMER_DETAIL:
				return <SalesCustomerDetail {...commonProps} />;
			case REPORT_TYPE.FNC_REPORT:
				return <FNCReport {...commonProps} />;
			case REPORT_TYPE.INCOME_ANALYSIS:
				return (
					<IncomeAnalysisReport
						reportsList={reportsList}
						isLoading={isLoading}
						year={new Date(data.report.startDate).getFullYear()}
					/>
				);

			case REPORT_TYPE.CASH_FLOW_ANALYSIS:
				return (
					<CashFlowAnalysisReport
						reportsList={reportsList}
						isLoading={isLoading}
						year={new Date(data.report.startDate).getFullYear()}
					/>
				);
			default:
				return null;
		}
	};

	return (
		<>
			<Card className='shadow-3d-primary position-relative'>
				<CardHeader className='text-center'>
					<CardLabel className='w-100 d-flex flex-column align-items-center'>
						<CardTitle tag='div' className='h4 text-muted fw-semibold'>
							{company?.tradeName}
						</CardTitle>

						<CardTitle tag='div' className='h5 mt-2 fw-normal text-uppercase'>
							{reportType.replaceAll('_', ' ')}
						</CardTitle>

						<CardTitle tag='div' className='h6 mt-1 fw-light'>
							{isYearBasedReport
								? `For Year ${new Date(data.report.startDate).getFullYear()}`
								: isSame
									? `As of ${moment(data.report.endDate).format('DD MMM YYYY')}`
									: `From ${moment(data.report.startDate).format('DD MMM YYYY')} to ${moment(
											data.report.endDate,
										).format('DD MMM YYYY')}`}
						</CardTitle>
					</CardLabel>
				</CardHeader>

				<CardBody>{getReportComponent()}</CardBody>
			</Card>

			{/* 🧾 Invoice Detail Modal */}
			{selectedInvoice && (
				<InvoiceDetailViewModal
					isOpen={isModalOpen}
					toggle={toggleModal}
					detailInvoiceInfo={selectedInvoice}
					localICBList={localICBList}
					localAuthorityList={localAuthorityList}
					fNCDetails={fNCDetails}
					residentData={residentData}
				/>
			)}
			<CreditNoteDoc
				toggle={handleCloseCreditNotesDoc}
				isOpen={isDetailICreditInfoModal}
				creditDetailInfo={{ ...creditDetailInfo, residentData }}
			/>
		</>
	);
};
