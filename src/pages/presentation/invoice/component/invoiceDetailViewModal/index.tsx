import {
	Button,
	Modal,
	ModalBody,
	ModalHeader,
	ModalTitle,
	Popovers,
} from '../../../../../components/bootstrap';
import { useMemo, useRef, useState } from 'react';
import { useResidentInvoiceAddress, useUpdateQueryListById } from '../../../../../hooks';
import { Invoice } from './invoice';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import html2pdf from 'html2pdf.js';
import { showAlert } from '../../../../../helpers/alerts';
import {
	findRoomAndBedByid,
	getActiveFundDetails,
	getActiveFundDetailsByLAOrICB,
	getUserMappedCompany,
	isValidRestoreOrVoidInvoice,
} from '../../../../../helpers/helpers';
import { useReactToPrint } from 'react-to-print';
import {
	downloadInvoiceById,
	invoiceSendSingleMail,
	updateInvoiceStatus,
} from '../../../../../common/api/invoice';

import invoiceCss from './invoice/invoice.scss?inline';
import invoiceCsks from './invoice/text.css?inline';
import {
	FUND_SOURCE_TYPE,
	INVOICE_MODE_TYPE,
	INVOICE_STATUS,
} from '../../../../../common/constant';
import { IInvoiceModel } from '../../../../../common/interface';
import Icon from '../../../../../components/icon';
import { useGetAllRoomsWithBeds } from '../../../../../hooks/useGetAllRoomsWithBed';
import moment from 'moment';

export const InvoiceDetailViewModal = ({
	isOpen = false,
	residentData = null,
	detailInvoiceInfo = null,
	toggle = () => {},
	localICBList = [],
	localAuthorityList = [],
	fNCDetails = {},
	invoiceList = [],
	handleConfirmInvoice = (invoice: IInvoiceModel) => {},
	handleUpdateInvoiceVoidStatus = (invoice: IInvoiceModel) => {},
	handleRestoreVoid = (invoice: IInvoiceModel) => {},
	showStatusUpdateBtn = false,
}: any) => {
	const [isLoading, setIsLoading] = useState(false);
	const [isDownloadLoad, setIsDownloadLoad] = useState(false);
	const sectionRef = useRef<HTMLDivElement>(null);
	const {
		data: roomsList = [],
		isLoading: roomListIsLoading,
		isError,
	} = useGetAllRoomsWithBeds();
	const handlePrint = useReactToPrint({
		contentRef: sectionRef,
		documentTitle: detailInvoiceInfo?.code || 'Invoice',
	});
	const companyDetails = getUserMappedCompany();

	const invoiceAddress = useResidentInvoiceAddress(
		residentData,
		+detailInvoiceInfo?.invoiceTo,
		detailInvoiceInfo?.fundTypeId,
	);

	const totalPrice = +detailInvoiceInfo?.totalPrice || 0;

	const creditApply = useMemo(() => {
		if (!detailInvoiceInfo?.creditApply) return [];
		return Object?.values(
			detailInvoiceInfo?.creditApply?.reduce(
				(
					acc: Record<
						string,
						{
							id: string;
							amount: number;
						}
					>,
					item: any,
				) => {
					if (!acc[item.id]) {
						acc[item.id] = { ...item }; // first occurrence
					} else {
						acc[item.id].amount += item.amount; // sum amounts
					}
					return acc;
				},
				{},
			),
		);
	}, [detailInvoiceInfo]);

	const remainingAmount = useMemo(() => {
		const totalCredits = (creditApply || []).reduce(
			(sum: number, { amount }: any) => sum + (Number(amount) || 0),
			0,
		);

		return totalPrice - totalCredits;
	}, [creditApply, totalPrice]);

	const creditNotesValue = useMemo(() => {
		const totalCredits = (creditApply || []).reduce(
			(sum: number, { amount }: any) => sum + (Number(amount) || 0),
			0,
		);

		return totalCredits;
	}, [creditApply]);

	const handleGetInvoicePdf = async () => {
		const invoice: any = document.getElementById('invoice-box');
		html2pdf()
			.set({
				margin: 10,
				filename: 'invoice.pdf',
				image: { type: 'jpeg', quality: 0.98 },

				html2canvas: {
					scale: 2,
					useCORS: true, // 🔥 REQUIRED
					allowTaint: false, // 🔥 REQUIRED
				},

				jsPDF: {
					unit: 'mm',
					format: 'a4',
					orientation: 'portrait',
				},
			})
			.from(invoice)
			.save();

		// const canvas = await html2canvas(invoice, {
		//   scale: 2, // high quality
		//   useCORS: true,
		// });

		// const imgData = canvas.toDataURL("image/png");
		// const pdf = new jsPDF("p", "mm", "a4");

		// const pdfWidth = pdf.internal.pageSize.getWidth();
		// const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

		// pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
		// pdf.save("document.pdf")
	};
	// 	try {
	// 		// 🔍 Validation
	// 		if (!invoiceAddress?.email || !companyDetails?.email) {
	// 			const missing = [];
	// 			if (!companyDetails?.email) missing.push('company');
	// 			if (!invoiceAddress?.email) missing.push(invoiceAddress?.activity || 'resident');

	// 			showAlert({
	// 				icon: 'warning',
	// 				title: 'Missing Email',
	// 				text: `Please update the ${missing.join(' and ')} email address${missing.length > 1 ? 'es' : ''}.`,
	// 			});
	// 			return;
	// 		}

	// 		const body = {
	// 			toEmailId: invoiceAddress.email,
	// 			invoiceId: detailInvoiceInfo?.id,
	// 			replyEmailId: companyDetails.email, // 🔥 FIXED (was boolean)
	// 		};

	// 		setIsLoading(true);

	// 		await sendInvoiceNotificationById(body);

	// 		showAlert({
	// 			icon: 'success',
	// 			title: 'Email Sent',
	// 			text: 'Invoice email has been sent successfully.',
	// 		});
	// 	} catch (error) {
	// 	} finally {
	// 		setIsLoading(false);
	// 	}
	// };

	const handleSendEmail = async () => {
		if (!detailInvoiceInfo?.id || !invoiceAddress || !detailInvoiceInfo?.code) {
			showAlert({
				icon: 'warning',
				title: 'Cannot Send Email',
				text: 'Invoice details or invoice address are missing.',
			});
			return;
		}

		const body = {
			invoiceId: detailInvoiceInfo.id,
			invoiceAddress: { ...invoiceAddress },
			code: detailInvoiceInfo?.code,
		};

		try {
			setIsLoading(true);

			await invoiceSendSingleMail(body);

			showAlert({
				icon: 'success',
				title: 'Email Sent',
				text: 'Invoice email has been sent successfully.',
			});
		} catch (e) {
			console.error(e);

			showAlert({
				icon: 'error',
				title: 'Send Failed',
				text: 'Failed to send invoice email. Please try again.',
			});
		} finally {
			setIsLoading(false);
		}
	};

	// const handleDownloadInvoiceById = (): void => {
	// 	const element = document.getElementById('invoice-box');

	// 	if (!element) {
	// 		showAlert({
	// 			title: 'Invoice Download',
	// 			text: 'Invoice content not found.',
	// 			icon: 'error',
	// 		});
	// 		return;
	// 	}

	// 	const payload: any = {
	// 		content: element.outerHTML, // 🔥 FIX
	// 		css: invoiceCss,
	// 		// css: invoiceCsks,
	// 	};

	// 	const fileName = detailInvoiceInfo?.code ? `${detailInvoiceInfo.code}.pdf` : 'invoice.pdf';

	// 	downloadInvoiceById(payload, fileName);
	// };

	const isEmailMode = useMemo(() => {
		return residentData?.admission?.invoiceMode === INVOICE_MODE_TYPE.EMAIL;
	}, [residentData]);

	const handleDownloadInvoiceById = async () => {
		if (!detailInvoiceInfo?.id || !invoiceAddress) {
			showAlert({
				icon: 'warning',
				title: 'Cannot Download Invoice',
				text: 'Invoice details or invoice address are missing.',
			});
			return;
		}

		const body = {
			invoiceId: detailInvoiceInfo.id,
			invoiceAddress: { ...invoiceAddress },
		};
		const residentName = residentData?.personal?.name;
		const { room, bed } = findRoomAndBedByid(
			roomsList,
			residentData?.roomId,
			residentData?.bedId,
		);
		const currentMonth = moment().format('MMMM');

		const fileName = `${bed?.bedName ?? (room?.roomNumber || '')} ${residentName || ''} ${invoiceAddress?.shortName || ''} - ${currentMonth} - ${detailInvoiceInfo?.code}`;
		try {
			setIsDownloadLoad(true);

			await downloadInvoiceById(body, fileName);

			showAlert({
				icon: 'success',
				title: 'Invoice Downloaded',
				text: 'The invoice has been downloaded successfully.',
			});
		} catch (e) {
			console.error(e);

			showAlert({
				icon: 'error',
				title: 'Download Failed',
				text: 'Failed to download the invoice. Please try again.',
			});
		} finally {
			setIsDownloadLoad(false);
		}
	};

	const { isDraft, isVoid, isPending } = useMemo(() => {
		const status = Number(detailInvoiceInfo?.status);

		return {
			isDraft: status === INVOICE_STATUS.DRAFT,
			isVoid: status === INVOICE_STATUS.VOID,
			isPending: status === INVOICE_STATUS.PENDING,
		};
	}, [detailInvoiceInfo?.status]);

	return (
		<Modal
			setIsOpen={toggle}
			isOpen={isOpen}
			fullScreen
			titleId='transfer-modal'
			isStaticBackdrop={true}>
			<ModalHeader
				setIsOpen={toggle}
				// className='d-flex justify-content-between align-items-center px-4 py-3 '
			>
				<ModalTitle id='transfer-modal' className='fw-semibold mb-0'>
					Invoice Details
				</ModalTitle>
				<div className='vr mx-2' />

				{/* RIGHT : PRIMARY ACTIONS */}
				{showStatusUpdateBtn && (
					<div className='d-flex align-items-center gap-2 mx-2'>
						{/* DRAFT */}
						{isDraft && (
							<>
								<Button
									color='success'
									onClick={() => handleConfirmInvoice(detailInvoiceInfo)}
									isLight>
									Confirm
								</Button>

								<Button
									color='danger'
									isLight
									onClick={() =>
										handleUpdateInvoiceVoidStatus(detailInvoiceInfo)
									}>
									Void
								</Button>
							</>
						)}

						{isVoid && (
							<Button
								color='warning'
								onClick={() => handleRestoreVoid(detailInvoiceInfo)}>
								Restore to Draft
							</Button>
						)}
					</div>
				)}

				<div className='d-flex align-items-center gap-3 text-right'>
					<Popovers trigger='hover' title='Print'>
						<Button icon='Print' color='info' isLight onClick={handlePrint} />
					</Popovers>

					<Popovers trigger='hover' title='Download'>
						<Button
							color='info'
							isLight
							isDisable={isDownloadLoad}
							onClick={handleDownloadInvoiceById}>
							{isDownloadLoad ? (
								<span className='spinner-border spinner-border-sm' />
							) : (
								<Icon icon='download' size='lg' />
							)}
						</Button>
					</Popovers>

					{isEmailMode && isPending && (
						<Popovers trigger='hover' title='Send Email'>
							<Button
								color='info'
								isLight
								isDisable={isLoading}
								onClick={handleSendEmail}>
								{isLoading ? (
									<span className='spinner-border spinner-border-sm' />
								) : (
									<Icon icon='send' />
								)}
							</Button>
						</Popovers>
					)}
				</div>
			</ModalHeader>

			<ModalBody className=''>
				<div ref={sectionRef}>
					<Invoice
						detailInvoiceInfo={detailInvoiceInfo}
						creditNotesValue={creditNotesValue}
						totalPrice={totalPrice}
						remainingAmount={remainingAmount}
						invoiceAddress={invoiceAddress}
						status={detailInvoiceInfo?.status}
					/>
				</div>
			</ModalBody>
		</Modal>
	);
};
