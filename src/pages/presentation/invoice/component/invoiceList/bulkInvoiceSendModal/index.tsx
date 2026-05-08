import React, { useMemo } from 'react';
import {
	Badge,
	Button,
	Modal,
	ModalBody,
	ModalFooter,
	ModalHeader,
	ModalTitle,
	Popovers,
} from '../../../../../../components/bootstrap';
import moment from 'moment';
import {
	getLabelByValue,
	getResidentInvoiceAddress,
	priceFormat,
} from '../../../../../../helpers/helpers';
import { ResidentProfileCard } from '../../../../../../components/common';
import { INVOICE_STATUS_TYPE_LIST } from '../../../../../../common/data/option';
import { getColorNameWithIndex } from '../../../../../../common/data/enumColors';
import { useMasterData } from '../../../../../../contexts/mastersContext';

interface IBulkInvoiceSendModalProps {
	isOpen: boolean;
	toggle: () => void;
	selectedInvoices: any[];
	isLoading: boolean;
	onConfirm: () => void;
	residentData?: any;
}

const BulkInvoiceSendModal: React.FC<IBulkInvoiceSendModalProps> = ({
	isOpen,
	toggle,
	selectedInvoices,
	isLoading,
	onConfirm,
	residentData,
}) => {
	const {
		localAuthorityList = [],
		localICBList = [],
		fNCDetails = {},
		isLoading: isMasterLoading,
	}: any = useMasterData();

	const totalBalance = useMemo(() => {
		return selectedInvoices?.reduce((total: number, row: any) => {
			const payedAmount =
				row?.payedInfo?.reduce(
					(sum: number, p: any) => sum + (Number(p?.amount) || 0),
					0,
				) || 0;

			const creditApplyAmount =
				row?.creditApply?.reduce(
					(sum: number, p: any) => sum + (Number(p?.amount) || 0),
					0,
				) || 0;

			const balance = (Number(row?.totalPrice) || 0) - (payedAmount + creditApplyAmount);

			return total + balance;
		}, 0);
	}, [selectedInvoices]);

	return (
		<Modal setIsOpen={toggle} isOpen={isOpen} size='xl'>
			<ModalHeader>
				<ModalTitle id='transfer-modal' className='fw-semibold mb-0'>
					Review Selected Invoices
				</ModalTitle>
			</ModalHeader>

			<ModalBody>
				<div className=' border rounded p-3 mb-4'>
					<p className='mb-2 text-muted'>
						The below invoices are selected for sending. Please review the details
						carefully before confirming. Once sent, invoices cannot be edited.
					</p>

					<span>{selectedInvoices?.length} Invoice(s) Selected</span>
				</div>
				{/* Table Section */}
				<div
					className='table-responsive border rounded'
					style={{ maxHeight: '450px', overflowY: 'auto' }}>
					<table className='table table-modern table-hover align-middle mb-0'>
						<thead className='table-light sticky-top'>
							<tr>
								<th>Resident</th>
								<th>Invoice No</th>
								<th>Category</th>
								<th>Email To</th>
								<th>Invoice Date</th>
								<th>Period</th>
								<th>Total</th>
								<th>Paid</th>
								<th>Balance</th>
							</tr>
						</thead>

						<tbody>
							{selectedInvoices?.map((row: any, index: number) => {
								const colorIndex = getColorNameWithIndex(index);

								const residentInfo = row?.residentData
									? row?.residentData
									: residentData;

								const invoiceAddress: any = getResidentInvoiceAddress(
									residentInfo,
									+row.invoiceTo,
									row?.fundTypeId,
									{
										localAuthorityList,
										localICBList,
										fNCDetails,
									},
								);

								const ccEmail = invoiceAddress?.ccEmails;
								// const ccEmail = ['Rohinikumar@gmail.com','rk@gamil.com'];

								const payedAmount =
									row?.payedInfo?.reduce(
										(sum: number, p: any) => sum + (Number(p?.amount) || 0),
										0,
									) || 0;

								const creditApplyAmount =
									row?.creditApply?.reduce(
										(sum: number, p: any) => sum + (Number(p?.amount) || 0),
										0,
									) || 0;

								return (
									<tr key={row.id}>
										<td>
											{residentInfo ? (
												<ResidentProfileCard
													resident={residentInfo}
													colorIndex={colorIndex}
												/>
											) : (
												<span className='text-muted'>
													Block Bed Not Assign
												</span>
											)}
										</td>

										<td className='fw-semibold'>{row.code}</td>
										<td>{row?.invoiceAddress?.shortName || 'NA'}</td>
										<td>
											<strong>{invoiceAddress?.email}</strong>
											{ccEmail?.length > 0 && (
												<Popovers
													desc={
														<div className='d-flex flex-wrap gap-2'>
															{ccEmail?.map(
																(email: any, index: number) => (
																	<Badge
																		key={index}
																		color='info'
																		isLight
																		className='px-3 py-2'>
																		{email || ''}
																	</Badge>
																),
															)}
														</div>
													}
													trigger='hover'>
													<span className='fw-bold text-primary cursor-pointer ms-1'>
														+{ccEmail?.length}
													</span>
												</Popovers>
											)}
										</td>
										<td>
											{row?.invoiceDate
												? moment(row.invoiceDate).format('DD MMM YYYY')
												: 'NA'}
										</td>

										<td>
											{row?.sDate
												? moment(row.sDate).format('DD MMM YYYY')
												: 'NA'}{' '}
											→{' '}
											{row?.eDate
												? moment(row.eDate).format('DD MMM YYYY')
												: 'NA'}
										</td>

										<td className='fw-semibold'>
											{priceFormat(row?.totalPrice)}
										</td>

										<td>
											<strong>{priceFormat(payedAmount)}</strong>
										</td>

										<td
											className={`${+row?.totalPrice - (payedAmount + creditApplyAmount) && 'text-danger'}`}>
											{priceFormat(
												+row?.totalPrice -
													(payedAmount + creditApplyAmount),
											)}
										</td>
									</tr>
								);
							})}
						</tbody>
						<tfoot className=' sticky-bottom'>
							<tr className="border-top">
								<td colSpan={8} className='text-end fw-bold'>
									Total Balance:
								</td>
								<td className='fw-bold text-danger'>{priceFormat(totalBalance)}</td>
							</tr>
						</tfoot>
					</table>
				</div>
			</ModalBody>

			<ModalFooter>
				{/* Action Buttons */}
				<div className='d-flex justify-content-between align-items-center mt-4'>
					<div>
						<Button color='danger' className='me-2' onClick={toggle} isLight>
							Cancel
						</Button>

						<Button color='success' isDisable={isLoading} onClick={onConfirm} isLight>
							{isLoading ? 'Sending...' : 'Confirm & Send'}
						</Button>
					</div>
				</div>
			</ModalFooter>
		</Modal>
	);
};

export default BulkInvoiceSendModal;
