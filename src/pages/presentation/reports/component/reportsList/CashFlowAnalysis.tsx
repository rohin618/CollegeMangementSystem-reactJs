import React, { useMemo } from 'react';
import moment from 'moment';
import Icon from '../../../../../components/icon';
import { Button } from '../../../../../components/bootstrap';
import { INVOICE_TO_TYPE_LIST } from '../../../../../common/data/option';
import { formatMoney, getLabelByValue } from '../../../../../helpers/helpers';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface Props {
	reportsList: any[];
	isLoading: boolean;
	year: number;
}

/* ======================================================
   HELPERS
====================================================== */

const getMonthsForYear = (year: number) =>
	Array.from({ length: 12 }, (_, i) => moment().year(year).month(i).format('MMM-YY'));

/* ======================================================
   COMPONENT
====================================================== */

export const CashFlowAnalysisReport: React.FC<Props> = ({ reportsList = [], isLoading, year }) => {
	const MONTHS = useMemo(() => getMonthsForYear(year), [year]);

	/* ======================================================
       BUILD DATA  (CORRECT SOURCE: payedInfo)
    ====================================================== */

	const data = useMemo(() => {
		const categories: any = {};

		const ensureCategory = (label: string) => {
			if (!categories[label]) {
				categories[label] = {
					billed: 0,
					received: MONTHS.reduce((a: any, m) => {
						a[m] = 0;
						return a;
					}, {}),
				};
			}
		};

		reportsList.forEach((r: any) => {
			(r.invoices || []).forEach((inv: any) => {
				const invType = INVOICE_TO_TYPE_LIST.find((t) => t.value === inv.invoiceTo);
				const label = invType?.shortName || 'Unknown';

				ensureCategory(label);

				/* =====================
                   BILLED (selected year only)
                ===================== */
				if (inv.invoiceDate) {
					const d = moment(inv.invoiceDate);
					if (d.year() === year) {
						categories[label].billed += Number(inv.totalPrice || 0);
					}
				}

				/* =====================
                   RECEIVED (from payedInfo)
                ===================== */
				(inv.payedInfo || []).forEach((p: any) => {
					if (!p.date) return;

					const m = moment(p.date).format('MMM-YY');

					// only show inside selected year table
					if (!MONTHS.includes(m)) return;

					categories[label].received[m] += Number(p.amount || 0);
				});
			});
		});

		return categories;
	}, [reportsList, year, MONTHS]);

	/* ======================================================
       CALCULATIONS
    ====================================================== */

	const getTotalReceived = (cat: any) => MONTHS.reduce((s, m) => s + cat.received[m], 0);

	const getClosing = (cat: any) => cat.billed - getTotalReceived(cat);

	const CATEGORY_ORDER = ['PVT', 'CC', 'FTU', 'LA', 'TPT', 'ICB', 'FNC', 'INC'];

	const categories = useMemo(() => {
		return Object.keys(data).sort((a, b) => {
			const idxA = CATEGORY_ORDER.indexOf(a);
			const idxB = CATEGORY_ORDER.indexOf(b);
			if (idxA !== -1 && idxB !== -1) return idxA - idxB;
			if (idxA !== -1) return -1;
			if (idxB !== -1) return 1;
			return a.localeCompare(b);
		});
	}, [data]);

	/* ======================================================
       EXCEL EXPORT
    ====================================================== */

	const exportExcel = () => {
		const rows: any[] = [];

		rows.push({
			Month: 'Billed Amount',
			...Object.fromEntries(categories.map((c) => [c, data[c].billed])),
		});

		MONTHS.forEach((m) => {
			rows.push({
				Month: m,
				...Object.fromEntries(categories.map((c) => [c, data[c].received[m]])),
			});
		});

		rows.push({
			Month: 'Total Received',
			...Object.fromEntries(categories.map((c) => [c, getTotalReceived(data[c])])),
		});

		rows.push({
			Month: 'Closing Balance',
			...Object.fromEntries(categories.map((c) => [c, getClosing(data[c])])),
		});

		const ws = XLSX.utils.json_to_sheet(rows);
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, 'Cash Flow');

		const buffer = XLSX.write(wb, {
			type: 'array',
			bookType: 'xlsx',
		});

		saveAs(new Blob([buffer]), `CashFlow_${year}_${moment().format('YYYYMMDD')}.xlsx`);
	};

	/* ======================================================
       RENDER
    ====================================================== */

	return (
		<>
			<div className='text-end mb-3'>
				<Button color='success' onClick={exportExcel}>
					<Icon icon='Download' /> Export Excel
				</Button>
			</div>

			<table className='table table-modern  align-middle text-end'>
				<thead className='table-primary'>
					<tr>
						<th className='text-start'>Billing Month</th>
						{categories.map((c) => (
							<th key={c}>{c}</th>
						))}
					</tr>
				</thead>

				<tbody>
					{isLoading ? (
						<tr>
							<td colSpan={categories.length + 1}>Loading…</td>
						</tr>
					) : (
						<>
							{/* Billed */}
							<tr className='fw-bold'>
								<td className='text-start'>Billed Amount</td>
								{categories.map((c) => (
									<td key={c}>£{formatMoney(data[c].billed)}</td>
								))}
							</tr>

							{/* Monthly received */}
							{MONTHS.map((m) => (
								<tr key={m}>
									<td className='text-start'>{m}</td>
									{categories.map((c) => (
										<td key={c}>£{formatMoney(data[c].received[m])}</td>
									))}
								</tr>
							))}

							{/* Total */}
							<tr className='table-warning fw-bold'>
								<td className='text-start'>Total Received</td>
								{categories.map((c) => (
									<td key={c}>£{formatMoney(getTotalReceived(data[c]))}</td>
								))}
							</tr>

							{/* Closing */}
							<tr className='table-success fw-bold'>
								<td className='text-start'>Closing Balance (Net Due)</td>
								{categories.map((c) => (
									<td key={c}>£{formatMoney(getClosing(data[c]))}</td>
								))}
							</tr>
						</>
					)}
				</tbody>
			</table>
		</>
	);
};
