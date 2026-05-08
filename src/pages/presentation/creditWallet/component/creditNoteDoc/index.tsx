import React, { useRef } from 'react';
import './creditNoteDoc.scss'; // Optional external stylesheet
import {
	Modal,
	ModalBody,
	ModalHeader,
	ModalTitle,
	Button,
} from '../../../../../components/bootstrap';
import {
	findRoomAndBedByid,
	getActiveFundDetails,
	getLabelByValue,
	getUserMappedCompany,
	getVatAmount,
	priceFormat,
} from '../../../../../helpers/helpers';
import logo from '../../../../../assets/img/logo.png';
import moment from 'moment';
import { useResidentInvoiceAddress } from '../../../../../hooks';
import { SALUTATION_LIST } from '../../../../../common/data/option';
import { CREDIT_TYPE, QUERY_KEY } from '../../../../../common/constant';
import { IInvoiceItem } from '../../../../../common/interface';
import { useReactToPrint } from 'react-to-print';
import useDarkMode from '../../../../../hooks/useDarkMode';
import classNames from 'classnames';
import { useGetAllRoomsWithBeds } from '../../../../../hooks/useGetAllRoomsWithBed';
import { useQuery } from '@tanstack/react-query';
import { getHeadOfficeAddress } from '../../../../../common/api/headOfficeAddress';
import { useGetHeadOfficeAddress } from '../../../../../hooks/useGetHeadOfficeAddress';

export const CreditNoteDoc = ({ toggle = () => {}, isOpen = false, creditDetailInfo }: any) => {
	const creditTo = Number(creditDetailInfo?.creditTo);
	const sectionRef = useRef<HTMLDivElement>(null);
	const {
		data: roomsList = [],
		isLoading: roomListIsLoading,
		isError,
	} = useGetAllRoomsWithBeds();

	const {data:headOfficeAddress,isLoading:isHeadOfficeLoading} = useGetHeadOfficeAddress();

	const invoiceAddress = useResidentInvoiceAddress(
		creditDetailInfo?.residentData,
		creditTo,
		creditDetailInfo?.fundTypeId,
	);

	const companyDetails = getUserMappedCompany();
	const { darkModeStatus } = useDarkMode();

	const getDocumentTitle = () => {
		const residentData = creditDetailInfo?.residentData;
		const residentName = residentData?.personal?.name;
		const { room, bed } = findRoomAndBedByid(roomsList,residentData?.roomId, residentData?.bedId);
		const currentMonth = moment().format('MMMM');

		return `${bed?.bedName ?? room?.roomNumber} ${residentName || ''} ${invoiceAddress?.shortName || ''} - ${currentMonth} - ${creditDetailInfo?.code}`;
	};

	const handlePrint = useReactToPrint({
		contentRef: sectionRef,
		documentTitle: getDocumentTitle() || 'Credit',
	});
	return (
		<Modal setIsOpen={toggle} isOpen={isOpen} fullScreen titleId='transfer-modal'>
			<ModalHeader setIsOpen={toggle}>
				<ModalTitle id='transfer-modal'>Invoice Details</ModalTitle>
				<Button className='ms-4' onClick={handlePrint} icon='Print' color='info' isLight>
					Print
				</Button>
			</ModalHeader>

			<ModalBody className=''>
				<div
					id='pdf-content'
					ref={sectionRef}
					className={classNames(
						'credit-note bg-white border rounded mx-auto my-4 p-4 pdf-root',
						{
							'bg-dark text-light': darkModeStatus,
							'bg-white text-dark': !darkModeStatus,
						},
					)}>
					{/* <PrintableComponent ref={contentRef} /> */}

					{/* <div className='row  mb-4'>

						<div className='col-md-8'>
							<h5 className='fw-bold mb-1'>
								{companyDetails?.tradeName || companyDetails?.name || 'NA'}
							</h5>
							<p className='mb-0 small'>
								{companyDetails?.buildingNumber || 'NA'}{' '}
								{companyDetails?.addressLine1 || ''}, {companyDetails?.area || ''},{' '}
								{companyDetails?.townOrCity || ''}, {companyDetails?.county || ''}{' '}
								{companyDetails?.postcode || ''}
							</p>
							<p className='mb-0 small'>
								{companyDetails?.country || 'United Kingdom'}
							</p>
							<p className='mb-0 small'>{companyDetails?.phone || 'NA'}</p>
							<p className='mb-0 small'>{companyDetails?.email || 'NA'}</p>
							<p className='mb-0 small fw-semibold'>
								VAT Registration No.: {companyDetails?.vatNumber || 'NA'}
							</p>
						</div>

						<div className='col-md-4 text-end'>
							<img
								src={companyDetails?.logo ? companyDetails.logo : logo}
								alt='Company Logo'
								style={{ maxHeight: '80px', objectFit: 'contain' }}
							/>
						</div>
					</div> */}
					<table className='table table-borderless mb-4 w-100'>
						<tbody>
							<tr>
								{/* LEFT DETAILS */}
								<td className='align-top' style={{ width: '70%' }}>
									<h5 className='fw-bold mb-1'>
										{companyDetails?.tradeName || companyDetails?.name || 'NA'}
									</h5>

									<p className='mb-0 small'>
										{headOfficeAddress?.buildingNumber || 'NA'}{' '}
										{headOfficeAddress?.area || ''},{' '}
										{headOfficeAddress?.address || ''},{' '}
										{headOfficeAddress?.postCode || ''}
										
									</p>

									<p className='mb-0 small'>
										{companyDetails?.country || 'United Kingdom'}
									</p>

									<p className='mb-0 small'>{companyDetails?.phone || 'NA'}</p>

									<p className='mb-0 small'>{companyDetails?.email || 'NA'}</p>

									<p className='mb-0 small fw-semibold'>
										VAT Registration No.: {companyDetails?.vatNumber || 'NA'}
									</p>
								</td>

								{/* RIGHT LOGO */}
								<td className='align-top text-end' style={{ width: '30%' }}>
									<img
										src={companyDetails?.logo || logo}
										alt='Company Logo'
										className='img-fluid'
										style={{ maxHeight: '80px', objectFit: 'contain' }}
									/>
								</td>
							</tr>
						</tbody>
					</table>

					{/* <div className='row mt-4'>
						<div className='col-md-6'>
							<div className='fw-semibold text-muted mb-1'>Credit Note To : <span className='fw-semibold mb-0'>{getLabelByValue(SALUTATION_LIST, +invoiceAddress?.salutation)} . {invoiceAddress?.name || ''}</span></div>

							<p className='small mb-0'>
								Re: {getLabelByValue(SALUTATION_LIST, +creditDetailInfo?.residentData?.personal?.salutation)} . {creditDetailInfo?.residentData?.personal?.name || ''}
							</p>
							<p className='small mb-0'>
								{[
									invoiceAddress?.addressLine1,
									invoiceAddress?.addressLine2,
									invoiceAddress?.buildingNumber,
									invoiceAddress?.area,
									invoiceAddress?.townOrCity,
									invoiceAddress?.county,
									invoiceAddress?.country,
									invoiceAddress?.postcode || invoiceAddress?.postCode,
								]
									.filter(Boolean)
									.join(', ') || ''}
							</p>
						</div>

						<div className='col-md-6'>
							<div className='row small mb-1'>
								<div className='col-6 fw-semibold text-muted'>Credit Note No</div>
								<div className='col-6 text-end fw-semibold'>
									{creditDetailInfo?.code || 'NA'}
								</div>
							</div>
							<div className='row small mb-1'>
								<div className='col-6 fw-semibold text-muted'>Credit Note Date</div>
								<div className='col-6 text-end fw-semibold'>
									{creditDetailInfo?.date
										? moment(creditDetailInfo.date).format('DD/MM/YYYY')
										: 'NA'}
								</div>
							</div>
						</div>
					</div> */}

					<table className='table table-borderless mt-4 w-100'>
						<tbody>
							<tr>
								{/* LEFT: Credit Note To */}
								<td className='align-top' style={{ width: '60%' }}>
									<div className='fw-semibold text-muted mb-1'>
										Credit Note To :
										<span className='fw-semibold ms-1'>
											{getLabelByValue(
												SALUTATION_LIST,
												+invoiceAddress?.salutation,
											)}
											. {invoiceAddress?.name || ''}
										</span>
									</div>

									<p className='small mb-0'>
										Re:{' '}
										{getLabelByValue(
											SALUTATION_LIST,
											+creditDetailInfo?.residentData?.personal?.salutation,
										)}
										. {creditDetailInfo?.residentData?.personal?.name || ''}
									</p>

									<p className='small mb-0'>
										{[
											invoiceAddress?.addressLine1,
											invoiceAddress?.addressLine2,
											invoiceAddress?.buildingNumber,
											invoiceAddress?.area,
											invoiceAddress?.townOrCity,
											invoiceAddress?.county,
											invoiceAddress?.country,
											invoiceAddress?.postcode || invoiceAddress?.postCode,
										]
											.filter(Boolean)
											.join(', ') || ''}
									</p>
								</td>

								{/* RIGHT: Credit Note Meta */}
								<td className='align-top' style={{ width: '40%' }}>
									<table className='table table-borderless table-sm mb-0 w-100'>
										<tbody>
											<tr>
												<td className='fw-semibold text-muted'>
													Credit Note No
												</td>
												<td className='text-end fw-semibold'>
													{creditDetailInfo?.code || 'NA'}
												</td>
											</tr>
											<tr>
												<td className='fw-semibold text-muted'>
													Credit Note Date
												</td>
												<td className='text-end fw-semibold'>
													{creditDetailInfo?.date
														? moment(creditDetailInfo.date).format(
																'DD/MM/YYYY',
															)
														: 'NA'}
												</td>
											</tr>
										</tbody>
									</table>
								</td>
							</tr>
						</tbody>
					</table>

					<div className='table-responsive mt-3'>
						<table className='table table-bordered align-middle'>
							<thead>
								<tr>
									<th style={{ width: '60px' }}>S.No</th>
									<th>Category</th>
									<th>Description</th>
									<th>Period</th>
									<th>VAT %</th>
									<th>Qty</th>
									<th>Rate</th>
									<th>Amount</th>
								</tr>
							</thead>
							<tbody>
								{+creditDetailInfo?.type === CREDIT_TYPE.ADJUSTMENT_CREDIT ||
								+creditDetailInfo?.type === CREDIT_TYPE.VAT_ADJUSTMENT_CREDIT ? (
									creditDetailInfo?.items?.map(
										(item: IInvoiceItem, index: number) => (
											<tr>
												<td>{index + 1}</td>
												<td className='text-center'>
													{invoiceAddress.shortName}
												</td>
												<td>{item.description}</td>
												<td>
													{`${
														item.period.from
															? moment(item.period.from).format(
																	'DD.MM.YYYY',
																)
															: ''
													} - ${
														item.period.to
															? moment(item.period.to).format(
																	'DD.MM.YYYY',
																)
															: ''
													}`}
												</td>
												<td>
													{item?.vatRate ? `${item.vatRate}%` : 'Exempt'}
												</td>
												<td>1</td>
												<td className='text-end'>
													{priceFormat(
														getVatAmount(item?.amount, item?.vatRate) ||
															0,
													)}
												</td>
												<td className='text-end'>
													{priceFormat(item?.amount || 0)}
												</td>
											</tr>
										),
									)
								) : (
									<tr>
										<td>1</td>
										<td>{invoiceAddress.shortName}</td>
										<td>This credit from {creditDetailInfo?.code} invoice</td>
										<td>
											{creditDetailInfo?.sDate ||
											creditDetailInfo?.residentData?.admission?.admissionDate
												? `${moment(
														creditDetailInfo?.sDate ||
															creditDetailInfo?.residentData
																?.admission?.admissionDate,
													).format('DD.MM.YYYY')} - ${moment(
														creditDetailInfo?.eDate ||
															creditDetailInfo?.residentData
																?.admission?.respiteEDate ||
															creditDetailInfo?.date,
													).format('DD.MM.YYYY')}`
												: 'NA'}
										</td>
										<td>
											{creditDetailInfo?.vatRate
												? `${creditDetailInfo.vatRate}%`
												: 'Exempt'}
										</td>
										<td>1</td>
										<td className='text-end'>
											{priceFormat(creditDetailInfo?.subTotal || 0)}
										</td>
										<td className='text-end'>
											{priceFormat(creditDetailInfo?.subTotal || 0)}
										</td>
									</tr>
								)}
							</tbody>
						</table>

						<table className='table table-borderless w-50 ms-auto'>
							<tbody>
								<tr>
									<td className='fw-semibold text-primary'>Sub Total</td>
									<td className='text-end'>
										{priceFormat(creditDetailInfo?.subTotal || 0)}
									</td>
								</tr>
								<tr>
									<td className='fw-semibold text-primary'>VAT Total</td>
									<td className='text-end'>
										{priceFormat(creditDetailInfo?.vatTotal || 0)}
									</td>
								</tr>
								<tr>
									<td className='fw-semibold text-primary'>Total</td>
									<td className='text-end'>
										{priceFormat(
											(creditDetailInfo?.subTotal || 0) +
												(creditDetailInfo?.vatTotal || 0),
										)}
									</td>
								</tr>
								<tr>
									<td className='fw-semibold text-primary'>Total Credit</td>
									<td className='text-end fw-bold'>
										{priceFormat(creditDetailInfo?.creditAmount || 0)}
									</td>
								</tr>
							</tbody>
						</table>
					</div>

					<div className='mt-4'>
						<h6 className='fw-semibold text-primary mb-2'>VAT Summary</h6>
						<table className='table table-bordered align-middle table-fixed'>
							<thead style={{ backgroundColor: '#d9e6f2' }}>
								<tr>
									<th className='text-center'>Rate</th>
									<th className='text-center'>VAT Amount</th>
									<th className='text-center'>Net Amount</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td className='text-center'>
										{creditDetailInfo?.vatRate
											? `${creditDetailInfo?.vatRate}%`
											: 'Exempt'}
									</td>
									<td className='text-center'>
										{' '}
										{priceFormat(creditDetailInfo?.vatTotal || 0)}
									</td>
									<td className='text-center'>
										{priceFormat(creditDetailInfo?.subTotal || 0)}
									</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>
			</ModalBody>
		</Modal>
	);
};
