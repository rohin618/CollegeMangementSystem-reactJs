import React, { useState, useMemo } from 'react';
import moment from 'moment';
import { ApexOptions, ApexAxisChartSeries } from 'apexcharts';
import {
	Card,
	CardBody,
	CardHeader,
	CardLabel,
	CardSubTitle,
	CardTitle,
	CardActions,
	FormGroup,
} from '../../../../../components/bootstrap';
import Button, { ButtonGroup } from '../../../../../components/bootstrap/Button';
import Chart from '../../../../../components/extras/Chart';
import useDarkMode from '../../../../../hooks/useDarkMode';
import { INVOICE_TO_TYPE_LIST } from '../../../../../common/data/option';
import { INVOICE_TO_TYPE } from '../../../../../common/constant';
import { useQuery } from '@tanstack/react-query';
import { getAllInvoicesList } from '../../../../../common/api/invoice';
import { getInvoiceMonthlySummary, priceFormat } from '../../../../../helpers/helpers';
import { SearchableSelect } from '../../../../../components/common';

interface Invoice {
	id: string | number;
	totalInvoicePrice: number;
	payedAmount: number;
}

interface OverAllRevenuItem {
	month: string;
	invoiceTo: number;
	invoices: Invoice[];
}

export const MonthSalesInfo: React.FC = () => {
	const { themeStatus } = useDarkMode();
	const [selectedYear, setSelectedYear] = useState(moment());
	const [activeCompanyTab, setActiveCompanyTab] = useState<number>(INVOICE_TO_TYPE.LA);

	/* -------------------- Query -------------------- */

	const invoiceQuery = useMemo(() => ({
		sDate: selectedYear.clone().startOf('year').format('YYYY-MM-DD'),
		eDate: selectedYear.clone().endOf('year').format('YYYY-MM-DD'),
	}), [selectedYear]);

	const {
		data: invoiceListByCompany = [],
		isLoading,
		isError,
	}:any = useQuery({
		queryKey: ['invoiceListByCompany', invoiceQuery],
		queryFn: () => getAllInvoicesList(invoiceQuery),
		keepPreviousData: true,
	});

	/* -------------------- Monthly Summary -------------------- */

	const overAllRevenu: any[] = useMemo(() => {
		if (!invoiceListByCompany?.length) return [];
		return getInvoiceMonthlySummary(
			invoiceListByCompany,
			selectedYear.year()
		);
	}, [invoiceListByCompany, selectedYear]);

	/* -------------------- Chart Series -------------------- */

	const salesByStoreSeries: ApexAxisChartSeries = useMemo(() => {
		const invoiceRaised = Array(12).fill(0);
		const invoiceCollected = Array(12).fill(0);

		overAllRevenu
			.filter(item => item.invoiceTo === activeCompanyTab)
			.forEach(({ invoices = [], month }) => {

				const monthIndex = moment(month, 'MMM').month();

				invoices.forEach(inv => {
					invoiceRaised[monthIndex] += inv.totalInvoicePrice ?? 0;
					invoiceCollected[monthIndex] += inv.payedAmount ?? 0;
				});
			});

		const totalRaised = invoiceRaised.reduce((a, b) => a + b, 0);
		const totalCollected = invoiceCollected.reduce((a, b) => a + b, 0);

		return [
			{
				name: `Invoice Raised (${priceFormat(totalRaised)})`,
				type: 'column',
				data: invoiceRaised,
			},
			{
				name: `Invoice Collected (${priceFormat(totalCollected)})`,
				type: 'column',
				data: invoiceCollected,
			},
		];
	}, [overAllRevenu, activeCompanyTab]);

	/* -------------------- Chart Options -------------------- */

	const months = moment.monthsShort();

	const salesByStoreOptions: ApexOptions = {
		chart: {
			height: 370,
			type: 'line',
			stacked: false,
			toolbar: { show: false },
		},
		dataLabels: { enabled: false },
		stroke: { width: [1, 1], curve: 'smooth' },
		plotOptions: {
			bar: {
				borderRadius: 5,
				columnWidth: '25%',
			},
		},
		xaxis: { categories: months },
		yaxis: [
			{
				labels: {
					formatter: (val) => priceFormat(val),
				},
				title: { text: 'Invoice Raised' },
			},
			{
				opposite: true,
				labels: {
					formatter: (val) => priceFormat(val),
				},
				title: { text: 'Invoice Collected' },
			},
		],
		tooltip: {
			theme: themeStatus,
			y: {
				formatter: (val: number) => priceFormat(val),
			},
		},
		legend: { horizontalAlign: 'left' },
	};

	/* -------------------- Handlers -------------------- */

	const handleYearChange = (type: 'prev' | 'next') => {
		setSelectedYear(prev =>
			type === 'prev'
				? prev.clone().subtract(1, 'year')
				: prev.clone().add(1, 'year')
		);
	};

	/* -------------------- UI -------------------- */

	return (
		<Card stretch>
			<CardHeader>
				<CardLabel icon="ReceiptLong">
					<CardTitle tag="div" className="h5">
						Monthly Sales by Fund
					</CardTitle>
					<CardSubTitle tag="div" className="h6">
						Reports
					</CardSubTitle>
				</CardLabel>

				<CardActions>
					<ButtonGroup>
						<FormGroup isFloating label="Select Fund">
							<SearchableSelect
								id="fund"
								placeholder="Select Fund"
								value={activeCompanyTab}
								onChange={(e: any) =>
									setActiveCompanyTab(Number(e.target.value))
								}
								options={INVOICE_TO_TYPE_LIST}
							/>
						</FormGroup>
					</ButtonGroup>

					<ButtonGroup>
						<Button
							color="primary"
							isLight
							icon="ChevronLeft"
							onClick={() => handleYearChange('prev')}
						/>
						<Button color="primary" isLight isDisable>
							{selectedYear.format('YYYY')}
						</Button>
						<Button
							color="primary"
							isLight
							icon="ChevronRight"
							onClick={() => handleYearChange('next')}
						/>
					</ButtonGroup>
				</CardActions>
			</CardHeader>

			<CardBody>
				<Chart
					series={salesByStoreSeries}
					options={salesByStoreOptions}
					type="line"
					height={370}
				/>
			</CardBody>
		</Card>
	);
};