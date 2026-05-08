import React, { useMemo } from 'react';
import { PURCHASE_ORDER_STATUS } from '../../../../../common/constant';
import { getLabelByValue, priceFormat } from '../../../../../helpers/helpers';
import { PURCHASE_ORDER_STATUS_LIST } from '../../../../../common/data/option';

interface PurchaseOrderReportsProps {
	purchaseOrderList: any[];
	productList: any[];
	vendorList: any[];
}

// ─── CSV helper ────────────────────────────────────────────────────────────────
const downloadCSV = (filename: string, rows: any[][], headers: string[]) => {
	const escape = (v: any) => {
		const s = String(v ?? '').replace(/"/g, '""');
		return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s}"` : s;
	};
	const content = [headers, ...rows].map((r) => r.map(escape).join(',')).join('\n');
	const blob = new Blob([content], { type: 'text/csv' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
};

// ─── Helpers ───────────────────────────────────────────────────────────────────
const isThisMonth = (dateStr: string): boolean => {
	if (!dateStr) return false;
	const d = new Date(dateStr);
	const now = new Date();
	return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
};

const statusLabel = (status: number) =>
	getLabelByValue(PURCHASE_ORDER_STATUS_LIST, status) || String(status);

const fmtChange = (change: number): string => {
	const sign = change >= 0 ? '+' : '';
	return `${sign}£${Math.abs(change).toFixed(2)}`;
};

const fmtPct = (pct: number): string => {
	const sign = pct >= 0 ? '+' : '';
	return `${sign}${pct.toFixed(1)}%`;
};

// ─── Sub-components ────────────────────────────────────────────────────────────
const SectionHeader: React.FC<{
	title: string;
	onDownload: () => void;
}> = ({ title, onDownload }) => (
	<div className='d-flex justify-content-between align-items-center mb-2'>
		<h6 className='fw-bold mb-0'>{title}</h6>
		<button className='btn btn-sm btn-outline-secondary' onClick={onDownload}>
			⬇ Download CSV
		</button>
	</div>
);

// ─── Main component ─────────────────────────────────────────────────────────────
const PurchaseOrderReports: React.FC<PurchaseOrderReportsProps> = ({
	purchaseOrderList,
	productList,
	vendorList,
}) => {
	// Quick lookup maps
	const vendorMap = useMemo(
		() => new Map(vendorList.map((v: any) => [v.id, v.name || '-'])),
		[vendorList],
	);
	const productMap = useMemo(
		() => new Map(productList.map((p: any) => [p.id, p])),
		[productList],
	);

	// ── Section 1: stat cards ────────────────────────────────────────────────
	const stats = useMemo(() => {
		let openPOs = 0;
		let pendingApprovals = 0;
		let monthlyValue = 0;
		let completedThisMonth = 0;

		for (const po of purchaseOrderList) {
			const s = +po.status;
			const thisMonth = isThisMonth(po.date);

			if (s === PURCHASE_ORDER_STATUS.DRAFT || s === PURCHASE_ORDER_STATUS.PENDING) openPOs++;
			if (s === PURCHASE_ORDER_STATUS.PENDING || s === PURCHASE_ORDER_STATUS.AWAITING_MD)
				pendingApprovals++;
			if (thisMonth) monthlyValue += Number(po.totalPrice || 0);
			if (thisMonth && s === PURCHASE_ORDER_STATUS.COMPLETED) completedThisMonth++;
		}

		return { openPOs, pendingApprovals, monthlyValue, completedThisMonth };
	}, [purchaseOrderList]);

	// ── Section 2: open POs ──────────────────────────────────────────────────
	const openPOs = useMemo(
		() =>
			purchaseOrderList.filter((po) =>
				(
					[
						PURCHASE_ORDER_STATUS.DRAFT,
						PURCHASE_ORDER_STATUS.PENDING,
						PURCHASE_ORDER_STATUS.AWAITING_MD,
					] as number[]
				).includes(+po.status),
			),
		[purchaseOrderList],
	);

	// ── Section 3: pending approvals ─────────────────────────────────────────
	const pendingApprovals = useMemo(
		() =>
			purchaseOrderList.filter((po) =>
				(
					[
						PURCHASE_ORDER_STATUS.PENDING,
						PURCHASE_ORDER_STATUS.AWAITING_MD,
					] as number[]
				).includes(+po.status),
			),
		[purchaseOrderList],
	);

	// ── Section 4: price variance ────────────────────────────────────────────
	const priceVarianceRows = useMemo(() => {
		const rows: {
			productName: string;
			vendorName: string;
			lastPrice: number;
			currentPrice: number;
			change: number;
			pct: number;
		}[] = [];

		for (const po of purchaseOrderList) {
			if (+po.status !== PURCHASE_ORDER_STATUS.COMPLETED) continue;
			const vendor = vendorMap.get(po.vendorId) || '-';

			for (const item of po.items || []) {
				const product = productMap.get(item.productId);
				if (!product) continue;
				const lastPrice = Number(product.lastPurchasePrice ?? 0);
				const currentPrice = Number(item.unitPrice ?? 0);
				if (!lastPrice || currentPrice === lastPrice) continue;

				const change = currentPrice - lastPrice;
				const pct = (change / lastPrice) * 100;
				rows.push({
					productName: product.name || '-',
					vendorName: vendor,
					lastPrice,
					currentPrice,
					change,
					pct,
				});
			}
		}

		// Sort biggest increases first
		rows.sort((a, b) => b.pct - a.pct);
		return rows;
	}, [purchaseOrderList, vendorMap, productMap]);

	// ── CSV downloads ─────────────────────────────────────────────────────────
	const downloadOpenPOs = () => {
		downloadCSV(
			'open-purchase-orders.csv',
			openPOs.map((po) => [
				`PO-${po.code}`,
				vendorMap.get(po.vendorId) || '-',
				po.date || '-',
				po.totalPrice ?? 0,
				statusLabel(+po.status),
			]),
			['PO Code', 'Vendor', 'Date', 'Total (£)', 'Status'],
		);
	};

	const downloadPendingApprovals = () => {
		downloadCSV(
			'pending-approvals.csv',
			pendingApprovals.map((po) => [
				`PO-${po.code}`,
				vendorMap.get(po.vendorId) || '-',
				po.totalPrice ?? 0,
				po.date || '-',
				+po.status === PURCHASE_ORDER_STATUS.AWAITING_MD
					? 'MD Approval'
					: 'Finance Controller',
			]),
			['PO Code', 'Vendor', 'Total (£)', 'Submitted Date', 'Waiting For'],
		);
	};

	const downloadVariance = () => {
		downloadCSV(
			'price-variance.csv',
			priceVarianceRows.map((r) => [
				r.productName,
				r.vendorName,
				r.lastPrice.toFixed(2),
				r.currentPrice.toFixed(2),
				fmtChange(r.change),
				fmtPct(r.pct),
			]),
			['Product Name', 'Vendor', 'Last Price (£)', 'Current Price (£)', 'Change', '% Change'],
		);
	};

	// ── Render ────────────────────────────────────────────────────────────────
	return (
		<div className='mt-4'>
			{/* ── Section 1: Summary cards ───────────────────────────────────── */}
			<div className='row g-3 mb-4'>
				{[
					{ label: 'Open POs', value: stats.openPOs },
					{ label: 'Pending Approvals', value: stats.pendingApprovals },
					{
						label: 'Total PO Value (This Month)',
						value: priceFormat(stats.monthlyValue),
					},
					{ label: 'Completed This Month', value: stats.completedThisMonth },
				].map(({ label, value }) => (
					<div key={label} className='col-12 col-sm-6 col-xl-3'>
						<div className='card p-3 text-center h-100'>
							<div className='text-muted small'>{label}</div>
							<div className='h3 fw-bold mt-1'>{value}</div>
						</div>
					</div>
				))}
			</div>

			{/* ── Section 2: Open POs ───────────────────────────────────────── */}
			<div className='card p-3 mb-4'>
				<SectionHeader title='Open Purchase Orders' onDownload={downloadOpenPOs} />
				{openPOs.length === 0 ? (
					<p className='text-muted small mb-0'>No open POs.</p>
				) : (
					<div className='table-responsive'>
						<table className='table table-sm table-hover align-middle mb-0'>
							<thead className='table-light'>
								<tr>
									<th>PO Code</th>
									<th>Vendor</th>
									<th>Date</th>
									<th>Total</th>
									<th>Status</th>
								</tr>
							</thead>
							<tbody>
								{openPOs.map((po) => (
									<tr key={po.id}>
										<td className='fw-semibold'>PO-{po.code}</td>
										<td>{vendorMap.get(po.vendorId) || '-'}</td>
										<td>{po.date || '-'}</td>
										<td>{priceFormat(po.totalPrice ?? 0)}</td>
										<td>
											<span className='badge bg-secondary'>
												{statusLabel(+po.status)}
											</span>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>

			{/* ── Section 3: Pending Approvals ─────────────────────────────── */}
			<div className='card p-3 mb-4'>
				<SectionHeader
					title='Pending Approvals'
					onDownload={downloadPendingApprovals}
				/>
				{pendingApprovals.length === 0 ? (
					<p className='text-muted small mb-0'>No pending approvals.</p>
				) : (
					<div className='table-responsive'>
						<table className='table table-sm table-hover align-middle mb-0'>
							<thead className='table-light'>
								<tr>
									<th>PO Code</th>
									<th>Vendor</th>
									<th>Total</th>
									<th>Submitted Date</th>
									<th>Waiting For</th>
								</tr>
							</thead>
							<tbody>
								{pendingApprovals.map((po) => (
									<tr key={po.id}>
										<td className='fw-semibold'>PO-{po.code}</td>
										<td>{vendorMap.get(po.vendorId) || '-'}</td>
										<td>{priceFormat(po.totalPrice ?? 0)}</td>
										<td>{po.date || '-'}</td>
										<td>
											<span
												className={`badge ${
													+po.status === PURCHASE_ORDER_STATUS.AWAITING_MD
														? 'bg-danger'
														: 'bg-warning text-dark'
												}`}>
												{+po.status === PURCHASE_ORDER_STATUS.AWAITING_MD
													? 'MD Approval'
													: 'Finance Controller'}
											</span>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>

			{/* ── Section 4: Price Variance ─────────────────────────────────── */}
			<div className='card p-3 mb-4'>
				<SectionHeader title='Price Variance Report' onDownload={downloadVariance} />
				{priceVarianceRows.length === 0 ? (
					<p className='text-muted small mb-0'>
						No price variances found across completed POs.
					</p>
				) : (
					<div className='table-responsive'>
						<table className='table table-sm table-hover align-middle mb-0'>
							<thead className='table-light'>
								<tr>
									<th>Product Name</th>
									<th>Vendor</th>
									<th>Last Price</th>
									<th>Current Price</th>
									<th>Change</th>
									<th>% Change</th>
								</tr>
							</thead>
							<tbody>
								{priceVarianceRows.map((r, i) => (
									<tr key={i}>
										<td className='fw-semibold'>{r.productName}</td>
										<td>{r.vendorName}</td>
										<td>{priceFormat(r.lastPrice)}</td>
										<td>{priceFormat(r.currentPrice)}</td>
										<td
											style={{
												color: r.change >= 0 ? '#198754' : '#dc3545',
											}}>
											<strong>{fmtChange(r.change)}</strong>
										</td>
										<td
											style={{
												color: r.pct >= 0 ? '#198754' : '#dc3545',
											}}>
											<strong>{fmtPct(r.pct)}</strong>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	);
};

export default PurchaseOrderReports;
