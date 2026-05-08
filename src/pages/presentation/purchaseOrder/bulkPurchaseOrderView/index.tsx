import React, { useEffect, useMemo, useState } from 'react';
import {
	SubHeaderLeft,
	SubheaderSeparator,
	SubHeader,
	Page,
	PageWrapper,
	SubHeaderRight,
} from '../../../../layout';
import Icon from '../../../../components/icon';
import {
	Input,
	Card,
	CardBody,
	CardHeader,
	CardTabItem,
	Badge,
	Button,
} from '../../../../components/bootstrap';
import { QUERY_KEY } from '../../../../common/constant';
import { useQueryClient } from '@tanstack/react-query';
import { priceFormat, showAlert } from '../../../../helpers/helpers';
import { useLocation, useNavigate } from 'react-router-dom';
import PurchaseOrderForm from '../components/purchaseOrderForm';
import BulkPurchaseOrder from '../components/bulkPurchaseOrder';
import { postBulkPurchaseOrder } from '../../../../common/api/purchaseOrder';

const BulkPurchaseOrderView = () => {
	const [isPurchaseOrderFormOpen, setIsPurchaseOrderFormOpen] = useState(false);
	const [isPurchaseOrderBulkOpen, setIsPurchaseOrderBulkOpen] = useState(false);

	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [bulkPurchaseOrder, setBulkPurchaseOrder] = useState<any>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const summary = bulkPurchaseOrder?.summary ?? {};
	const rows = bulkPurchaseOrder?.rows ?? [];

	const validRows = rows.filter((r: any) => r.status === 'Valid');
	const errorRows = rows.filter((r: any) => r.status === 'Error');
	const warningRows = rows.filter((r: any) => r.warnings?.length > 0);
	const navigate = useNavigate();
	useEffect(() => {
		setIsPurchaseOrderBulkOpen(true);
	}, []);

	const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
	const toggleRow = (id: string) => {
		setExpandedRows((prev) => ({
			...prev,
			[id]: !prev[id],
		}));
	};

	const header = bulkPurchaseOrder?.header;
	const headerErrors = bulkPurchaseOrder?.headerErrors ?? [];

	const hasHeaderError = headerErrors.length > 0;
	const isHeaderValid = !!header && !hasHeaderError;
	const hasSummary = !!bulkPurchaseOrder?.summary;

	const hasError = summary.errors > 0 || hasHeaderError;
	const hasWarning = summary.warnings > 0;

	const hasValidRows = summary.validRows === summary.totalRows;

	const handleBulkUpload = async (file: File) => {
		try {
			setIsSubmitting(true);

			const formData = new FormData();
			formData.append('file', file);

			const response = await postBulkPurchaseOrder(formData);

			setBulkPurchaseOrder(response);
			setIsPurchaseOrderBulkOpen(false);

			showAlert({
				title: 'Success',
				text: response?.message || 'Bulk uploaded successfully',
				icon: 'success',
				confirmButtonText: 'OK',
			});
		} catch (error: any) {
			showAlert({
				title: 'Upload Failed',
				text: error?.response?.data?.message || 'Something went wrong',
				icon: 'error',
				confirmButtonText: 'OK',
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleToggleBulkPurchaseOrder = () => {
		setIsPurchaseOrderBulkOpen(!isPurchaseOrderBulkOpen);
		navigate('/purchaseOrder');
	};

	const renderTable = (data: any[]) => (
		<div className=''>
			<table className='table table-modern table-hover'>
				<thead className='table-light'>
					<tr>
						<th>Row No</th>
						<th>Product Code</th>
						<th>Description</th>
						<th>Quantity</th>
						<th>Unit Price</th>
						<th>Status</th>
					</tr>
				</thead>
				<tbody>
					{!data?.length ? (
						<tr>
							<td colSpan={6} className='text-center py-4 text-muted'>
								<Icon icon='Info' className='me-2' />
								No records found
							</td>
						</tr>
					) : (
						data.map((row: any) => (
							<React.Fragment key={row.id}>
								{/* Main Clickable Row */}
								<tr onClick={() => toggleRow(row.id)} style={{ cursor: 'pointer' }}>
									<td>{row.rowNo}</td>
									<td>{row.productCode}</td>
									<td>{row.description}</td>
									<td>{row.qty}</td>
									<td>{row.unitPrice}</td>
									<td>
										{row.status === 'Valid' && (
											<Badge color='success' isLight>
												<Icon icon='CheckCircle' className='me-1' />
												Valid
											</Badge>
										)}

										{row.status === 'Error' && (
											<Badge color='danger' isLight>
												<Icon icon='Cancel' className='me-1' />
												Error
											</Badge>
										)}

										{row.warnings?.length > 0 && (
											<Badge color='warning' isLight className='ms-2'>
												<Icon icon='Warning' className='me-1' />
												Warning
											</Badge>
										)}
									</td>
								</tr>

								{/* Expandable Row */}
								{expandedRows[row.id] &&
									(row.errors?.length > 0 || row.warnings?.length > 0) && (
										<tr>
											<td colSpan={6} className=''>
												{row.errors?.length > 0 && (
													<div className='text-danger small mb-1'>
														<Icon icon='Cancel' className='me-1' />
														{row.errors.join(', ')}
													</div>
												)}

												{row.warnings?.length > 0 && (
													<div className='text-warning small'>
														<Icon icon='Warning' className='me-1' />
														{row.warnings.join(', ')}
													</div>
												)}
											</td>
										</tr>
									)}
							</React.Fragment>
						))
					)}
				</tbody>
			</table>
		</div>
	);

	const headerStat = {
		title: 'Purchase Order Details',
		value: hasHeaderError ? 'Error' : 'Valid',
		icon: hasHeaderError ? 'Cancel' : 'CheckCircle',
		subTitles: hasHeaderError ? 'Fix Required' : 'Ready',
		color: hasHeaderError ? 'text-danger' : 'text-success',
	};

	const stats = useMemo(() => {
		return [
			{
				title: 'Total Rows',
				value: rows.length,
				icon: 'Description',
				subTitles: 'Uploaded Records',
				color: 'text-primary',
			},
			{
				title: 'Valid Rows',
				value: summary.validRows || 0,
				icon: 'CheckCircle',
				subTitles: 'Ready to Process',
				color: 'text-success',
			},
			{
				title: 'Errors',
				value: summary.errors || 0,
				icon: 'Cancel',
				subTitles: 'Need Fixing',
				color: 'text-danger',
			},
			{
				title: 'Warnings',
				value: summary.warnings || 0,
				icon: 'Warning',
				subTitles: 'Review Required',
				color: 'text-warning',
			},
			headerStat,
		];
	}, [rows, summary]);

	const handleSave = () => {
		if (hasError || hasWarning) {
			let title = 'Validation Issues Found';
			let icon: 'error' | 'warning' = 'warning';
			let message = '';

			if (hasError && hasWarning) {
				icon = 'error';
				message = `This file contains ${summary.errors} errors and ${summary.warnings} warnings. 
Please fix the issues and upload the Excel file again.`;
			} else if (hasError) {
				icon = 'error';
				message = `This file contains ${summary.errors} errors. 
Please correct them and upload the Excel file again.`;
			} else {
				message = `This file contains ${summary.warnings} warnings. 
Please review them before proceeding.`;
			}

			showAlert({
				title,
				text: message,
				icon,
				confirmButtonText: 'OK',
			});

			return;
		}
		setIsPurchaseOrderFormOpen(true);
	};

	return (
		<PageWrapper title='Bulk Purchase Order Review'>
			<SubHeader>
				<SubHeaderLeft>
					<div className='my-2'>
						<div className='h3 mb-0 fw-bold'>Bulk Purchase Order Review</div>
						{/* <div className='text-muted small'>
				Review validation results before saving
			</div> */}
					</div>
				</SubHeaderLeft>

				<SubHeaderRight>
					<div className='d-flex gap-2'>
						{hasSummary && !(hasError || hasWarning) && (
							<Button color='success' onClick={handleSave} isLight>
								<Icon icon='Save' className='me-1' />
								Save Purchase Orders
							</Button>
						)}

						{/* <Button
							color='primary'
							icon='AddCircle'
							isLight
							onClick={() => setIsPurchaseOrderBulkOpen(true)}>
							Upload Bulk Purchase Order
						</Button> */}
						{(hasError || hasWarning) && (
							<Button
								color='danger'
								icon='AddCircle'
								isLight
								onClick={() => setIsPurchaseOrderBulkOpen(true)}>
								Re upload Bulk PO
							</Button>
						)}
					</div>
				</SubHeaderRight>
			</SubHeader>

			<Page container='fluid'>
				<div
					className='mb-4'
					style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(5, 1fr)',
						gap: '1rem',
					}}>
					{stats?.map((stat, index) => (
						<Card
							key={index}
							className='p-4 d-flex justify-content-between align-items-center flex-row shadow-sm rounded-4'>
							{/* Left */}
							<div>
								<div className='text-muted mb-1 small'>{stat.title}</div>
								<h4 className={`fw-bold mb-1 ${stat.color}`}>{stat.value}</h4>
								<div className='text-muted small'>{stat.subTitles}</div>
							</div>

							{/* Right */}
							<Icon icon={stat.icon} size='2x' className={stat.color} />
						</Card>
					))}
				</div>

				{/* 🔥 Tabs Structure */}
				<Card hasTab tabButtonColor='info' className='mb-4 shadow-sm rounded-4'>
					<CardTabItem
						id='Purchase Order Details'
						title='Purchase Order Details'
						icon={hasHeaderError ? 'Cancel' : 'CheckCircle'}>
						<CardBody>
							{!header ? (
								<div className='text-muted text-center py-4'>
									No header data available
								</div>
							) : (
								<CardBody>
									{/* Header Title + Status */}
									<div className='d-flex justify-content-between align-items-center mb-4'>
										<h5 className='fw-bold mb-0'>Purchase Order Details</h5>

										{hasHeaderError ? (
											<Badge color='danger' isLight>
												<Icon icon='Cancel' className='me-1' />
												Error
											</Badge>
										) : (
											<Badge color='success' isLight>
												<Icon icon='CheckCircle' className='me-1' />
												Valid
											</Badge>
										)}
									</div>

									{/* Header Fields */}
									<div className='row g-4'>
										<div className='col-md-6'>
											<div className='text-muted small'>Vendor Code</div>
											<div className='fw-semibold'>{header.vendorCode}</div>
										</div>

										<div className='col-md-6'>
											<div className='text-muted small'>Vendor Name</div>
											<div className='fw-semibold'>{header.vendorName}</div>
										</div>

										<div className='col-md-6'>
											<div className='text-muted small'>PO Date</div>
											<div className='fw-semibold'>{header.poDate}</div>
										</div>

										<div className='col-md-6'>
											<div className='text-muted small'>Expected Date</div>
											<div className='fw-semibold'>{header.expectDate}</div>
										</div>

										<div className='col-12'>
											<div className='text-muted small'>Notes</div>
											<div className='fw-semibold'>{header.notes || '-'}</div>
										</div>
									</div>

									{/* Header Errors */}
									{hasHeaderError && (
										<div className='mt-4 p-3 bg-danger bg-opacity-10 rounded-3'>
											<div className='text-danger fw-semibold mb-1'>
												<Icon icon='Cancel' className='me-1' />
												Header Errors
											</div>
											<ul className='mb-0 ps-3 text-danger small'>
												{headerErrors.map((err: string, idx: number) => (
													<li key={idx}>{err}</li>
												))}
											</ul>
										</div>
									)}
								</CardBody>
							)}
						</CardBody>
					</CardTabItem>
					<CardTabItem id='all' title={`All (${summary.totalRows || 0})`} icon='List'>
						<CardBody>{renderTable(rows)}</CardBody>
					</CardTabItem>

					<CardTabItem id='error' title={`Errors (${summary.errors || 0})`} icon='Cancel'>
						<CardBody>{renderTable(errorRows)}</CardBody>
					</CardTabItem>

					<CardTabItem
						id='warning'
						title={`Warnings (${summary.warnings || 0})`}
						icon='Warning'>
						<CardBody>{renderTable(warningRows)}</CardBody>
					</CardTabItem>

					<CardTabItem
						id='valid'
						title={`Valid (${summary.validRows || 0})`}
						icon='CheckCircle'>
						<CardBody>{renderTable(validRows)}</CardBody>
					</CardTabItem>
				</Card>

				{<PurchaseOrderForm
					isOpen={isPurchaseOrderFormOpen}
					toggle={() => setIsPurchaseOrderFormOpen(!isPurchaseOrderFormOpen)}
					bulkPurchaseOrderItems={{
						rows: bulkPurchaseOrder?.rows ?? [],
						header: bulkPurchaseOrder?.header ?? null,
					}}
				/>}

				<BulkPurchaseOrder
					isOpen={isPurchaseOrderBulkOpen}
					toggle={handleToggleBulkPurchaseOrder}
					onSubmit={handleBulkUpload}
					isSubmitting={isSubmitting}
				/>
			</Page>
		</PageWrapper>
	);
};

export default BulkPurchaseOrderView;
