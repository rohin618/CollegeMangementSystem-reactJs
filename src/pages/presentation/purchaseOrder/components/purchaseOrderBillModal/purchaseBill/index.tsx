import React from 'react';
import './purchaseBill.scss';
import { getLabelByValue, priceFormat } from '../../../../../../helpers/helpers';
import { VAT_MODE_OPTIONS } from '../../../../../../common/data/option';

type Props = {
	purchaseOrderData: any;
	companyDetails: any;
	vendorInfo: any;
	productMap: any;
	primaryBank: any;
};

const PurchaseBill: React.FC<Props> = ({
	purchaseOrderData,
	companyDetails,
	vendorInfo,
	productMap,
	primaryBank,
}) => {
	const debitAmount =
		purchaseOrderData.debitApply?.reduce((sum: number, d: any) => sum + (d.amount || 0), 0) ||
		0;

	return (
		<div className='purchase-bill-box'>
			<div className='bill-box' id='purchase-bill'>
				{/* ===== HEADER ===== */}
				<div className='bill-header'>
					<h2>PURCHASE ORDER</h2>
				</div>

				{/* ===== LOGO ===== */}
				<img src={companyDetails?.logo || ''} alt='Company Logo' className='bill-logo' />

				{/* ===== COMPANY INFO ===== */}

				<div className='vendor-info mb-4'>
					<p className='fw-bold fs-5 vendor-title'>Vendor Info</p>

					<p>
						<span className='label'>Name:</span> {vendorInfo?.name}
					</p>

					<p>
						<span className='label'>Address:</span>{' '}
						{[
							vendorInfo?.addressLine1,
							vendorInfo?.addressLine2,
							vendorInfo?.city,
							vendorInfo?.postCode,
							vendorInfo?.country,
						]
							.filter(Boolean)
							.join(', ')}
					</p>

					<p>
						<span className='label'>Email:</span> {vendorInfo?.emailId}
					</p>

					<p>
						<span className='label'>Tel:</span>{' '}
						{vendorInfo?.primaryPhone || vendorInfo?.secondaryPhone}
					</p>
				</div>

				{/* ===== VENDOR + BILL INFO ===== */}
				<div className='row info-section'>
					<div className='col-6 company-info'>
						<p className='fw-bold company-title'>{companyDetails?.tradeName}</p>

						<p>
							<span className='label'>Address:</span> {companyDetails?.address}
						</p>

						<p>
							<span className='label'>Tel:</span> {companyDetails?.phone}
						</p>

						<p>
							<span className='label'>Email:</span> {companyDetails?.email}
						</p>
					</div>
					<div className='col-6 '>
						<table className='table table-borderless table-sm'>
							<tbody>
								<tr>
									<td>Bill No</td>
									<td className='fw-bold'>{purchaseOrderData?.code || '-'}</td>
								</tr>
								<tr>
									<td>Bill Date</td>
									<td className='fw-bold'>{purchaseOrderData?.date || '-'}</td>
								</tr>
								<tr>
									<td>Payment Terms</td>
									<td className='fw-bold'>
										{purchaseOrderData?.paymentTerms || '-'}
									</td>
								</tr>
								<tr>
									<td>Delivery Date</td>
									<td className='fw-bold'>
										{purchaseOrderData?.deliveryDate || '-'}
									</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>

				{/* ===== ITEMS TABLE ===== */}
				<table className='table purchase-table'>
					<thead>
						<tr>
							<th>S.No</th>
							<th>Product / Code</th>
							<th>Description</th>
							<th className='text-end'>Qty</th>
							<th className='text-end'>Unit Price</th>
							<th className='text-end'>Total Amount</th>
						</tr>
					</thead>
					<tbody>
						{purchaseOrderData?.items?.map((item: any, index: number) => (
							<tr key={item.id}>
								<td>{index + 1}</td>
								<td>
									{productMap.get(item.productId).name}
									{' - '}
									<span className='text-muted'>
										{productMap.get(item.productId).productCode}
									</span>
								</td>
								<td>{item.description}</td>
								<td className='text-end'>{item.qty}</td>
								<td className='text-end'>{item.unitPrice}</td>
								<td className='text-end'>{item.totalAmount}</td>
							</tr>
						))}
					</tbody>
				</table>

				{/* ===== TOTALS ===== */}
				<table className='table table-borderless totals-table'>
					<tbody>
						<tr>
							<td>Sub Total</td>
							<td className='text-end'>{purchaseOrderData?.subTotal}</td>
						</tr>
						<tr>
							<td>VAT Total</td>
							<td className='text-end'>{purchaseOrderData?.vatTotal}</td>
						</tr>
						{debitAmount > 0 && (
							<tr>
								<td className='fw-bold fs-5 text-danger'>Debit Apply</td>
								<td className='text-end wpx-150 fw-bold fs-5 text-danger'>
									- {priceFormat(debitAmount || 0)}
								</td>
							</tr>
						)}
						<tr className='grand-total'>
							<td>Grand Total</td>
							<td>{priceFormat((purchaseOrderData?.totalPrice || 0) - (debitAmount || 0))}</td>
						</tr>
					</tbody>
				</table>

				{/* ===== VAT SUMMARY ===== */}
				<p className='section-title'>
					VAT Summary{' '}
					<span className='text-muted'>
						({getLabelByValue(VAT_MODE_OPTIONS, purchaseOrderData?.vatMode) || '-'})
					</span>
				</p>
				<table className='table vat-table'>
					<thead>
						<tr>
							<th>VAT Rate</th>
							<th>VAT Amount</th>
							<th>Net Amount</th>
						</tr>
					</thead>
					<tbody>
						{purchaseOrderData?.items?.map((item: any, index: number) => (
							<tr key={index}>
								<td>{item.vatRate}%</td>
								<td>{item.vatAmount}</td>
								<td>{item.totalAmount}</td>
							</tr>
						))}
					</tbody>
				</table>

				{/* ===== BANK DETAILS ===== */}
				<p className='section-title'>Bank Details</p>
				<p>
					<strong>Account Name:</strong> {primaryBank?.accountName}
				</p>
				<p>
					<strong>Account No:</strong> {primaryBank?.accountNumber}
				</p>
				<p>
					<strong>IFSC / Sort Code:</strong> {primaryBank?.sortCode}
				</p>
				<p>
					<strong>Bank Name:</strong> {primaryBank?.bankName}
				</p>
			</div>
		</div>
	);
};

export default PurchaseBill;
