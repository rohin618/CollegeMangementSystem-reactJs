import React, { useEffect, useState } from 'react';
import { Page, PageWrapper, SubHeader, SubHeaderLeft } from '../../../layout';
import { ReportsSection } from './component/reportsSection';
import { ReportsListCard } from './component';
import { format, isSameDay } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { getReportList } from '../../../common/api/reports/getReportList';
import { Breadcrumb } from '../../../components/bootstrap';
import { pagesMenu } from '../../../menu';
import { REPORT_TYPE_LIST, YEAR_BASED_REPORTS } from '../../../common/data/option';

const validator = {
	fieldValid: () => true,
	message: () => '',
};

const ReportPage = () => {
	// ---------- Local State ----------
	const [data, setData] = useState({
		report: {
			reportType: REPORT_TYPE_LIST[0].value,
			reportPeriod: 'today',
			asOfDate: format(new Date(), 'yyyy-MM-dd'),
			startDate: new Date(),
			endDate: new Date(),
		},
	});
	const [isSubmited, setIsSubmited] = useState(false);

	// ---------- Compute Params ----------
	const sDate = format(data.report.startDate, 'yyyy-MM-dd');
	const eDate = format(data.report.endDate, 'yyyy-MM-dd');
	const isSame = isSameDay(data.report.startDate, data.report.endDate);
	const queryParams = isSame ? { eDate } : { sDate, eDate };

	// ---------- React Query (Manual Trigger) ----------
	const {
		data: reportsList = [],
		isLoading,
		isError,
		refetch: onReloadReports,
	} = useQuery({
		queryKey: ['invoiceReportsByCompany', queryParams],
		queryFn: () => getReportList(queryParams),
		staleTime: 1000 * 60 * 5,
		enabled: false,
	});

	// ---------- Handlers ----------
	const handleChange = (e: any) => {
		const { id, value } = e.target;

		if (id === 'year') {
			const startDate = new Date(value, 0, 1); 
			const endDate = new Date(value, 11, 31); 

			setData((prev) => ({
				...prev,
				report: {
					...prev.report,
					year: value,
					startDate,
					endDate,
					asOfDate: `${value}`,
				},
			}));
			return;
		}

		setData((prev) => ({
			...prev,
			report: { ...prev.report, [id]: value },
		}));
	};


	const handleDateRangeChange = (range: { startDate: Date; endDate: Date }) => {
		setData((prev) => ({
			...prev,
			report: {
				...prev.report,
				startDate: range.startDate,
				endDate: range.endDate,
				asOfDate: isSameDay(range.startDate, range.endDate)
					? format(range.endDate, 'yyyy-MM-dd')
					: `${format(range.startDate, 'yyyy-MM-dd')} - ${format(range.endDate, 'yyyy-MM-dd')}`,
			},
		}));
	};
	const isYearBasedReport = YEAR_BASED_REPORTS.includes(
		data.report.reportType
	);

	const YEARS = Array.from({ length: 6 }, (_, i) => {
		const y = new Date().getFullYear() - i;
		return { label: y.toString(), value: y };
	});


	const handleSubmit = async (e?: React.FormEvent) => {
		if (e) e.preventDefault();
		setIsSubmited(true);

		const { reportType, startDate, endDate } = data.report;
		if (!reportType || !startDate || !endDate) {
			console.warn('⚠️ Please fill in all fields');
			return;
		}

		await onReloadReports(); // ✅ Trigger API only on Save
	};

	const handleClear = () => {
		setData({
			report: {
				reportType: REPORT_TYPE_LIST[0].value,
				reportPeriod: 'today',
				asOfDate: format(new Date(), 'yyyy-MM-dd'),
				startDate: new Date(),
				endDate: new Date(),
			},
		});
		setIsSubmited(false);
	};

	useEffect(() => {
		onReloadReports()
	}, [])
	// ---------- Render ----------
	return (
		<PageWrapper title='Reports Dashboard'>
			<SubHeader>
				<SubHeaderLeft>
					<Breadcrumb
						list={[
							{
								title: pagesMenu.reports.text,
								to: `/${pagesMenu.reports.path}`,
							},
							{
								title: `${data.report.reportType}`,
								to: `/${pagesMenu.operations.subMenu.rooms.path}/create`,
							},
						]}
					/>
				</SubHeaderLeft>
			</SubHeader>

			<Page container='fluid'>
				<form onSubmit={handleSubmit}>
					<ReportsSection
						data={data}
						onPeriodChange={handleChange}
						onDateRangeChange={handleDateRangeChange}
						validator={validator}
						isSubmited={isSubmited}
						handleSubmit={handleSubmit}
						handleClear={handleClear}
						YEARS={YEARS}
						isYearBasedReport={isYearBasedReport}

					/>
				</form>

				<div className='mt-5'>
					<ReportsListCard
						reportType={data.report.reportType}
						reportsList={reportsList}
						isLoading={isLoading}
						data={data}
						isYearBasedReport={isYearBasedReport}
					/>
				</div>
			</Page>
		</PageWrapper>
	);
};

export default ReportPage;
