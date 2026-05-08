import { useQuery } from '@tanstack/react-query';
import {
	CardBody,
	Card,
	CardHeader,
	CardTitle,
	CardLabel,
	CardActions,
	Accordion,
	AccordionItem,
	Button,
	Badge,
	Alert,
	Modal,
	ModalHeader,
	ModalBody,
	ModalTitle,
} from '../../../../../components/bootstrap';
import Icon from '../../../../../components/icon';
import { ResidentDocumentForm } from '../residentDocumentForm';
import {
	downloadResidentDocument,
	getResidentDocumentByResidentId,
	sendEmailResidentDocument,
} from '../../../../../common/api/residentDocument';
import { useParams } from 'react-router-dom';
import {
	getActiveFundDetails,
	getActiveFundDetailsByLAOrICB,
	getActiveRespiteDetails,
	getActiveWeekInfoByEndDate,
	getColorByValue,
	getLabelByValue,
	getUserMappedCompany,
	imageUrlToBase64,
	showAlert,
} from '../../../../../helpers/helpers';
import { DOCUMENT_TYPE_LIST, FUND_SOURCE_LIST } from '../../../../../common/data/option';
import moment from 'moment';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
	DOCUMENT_TEMPLATE_TYPES,
	FUND_SOURCE_TYPE,
	PLACEMENT_TYPE,
} from '../../../../../common/constant';
import {
	feeIncreaseLetterDocument,
	permanentAgreementDocument,
	respiteAgreementDocument,
	welcomeLetterCCCHCPermanent,
	welcomeLetterIcbOrLaPermanentDocument,
	welcomeLetterIcbOrLaRespite,
	welcomeLetterPrivatePermanent,
	welcomeLetterPrivateRespite,
	residentDepositInvoiceDocument,
} from '../../../../../common/printDocument';
import { useGetBillingPatternList } from '../../../../../hooks/useGetBillingPatternList';
import {
	DOCUMENT_IDENTIFIER,
	FAMILY_OR_THIRD_PARTY_TOPUP_STATUS,
	FUND_TYPE,
	INVOICE_MODE_TYPE,
	LPA_TYPE,
	NOK_INVOICE_REQUIRED,
	RESPITE_STATUS_TYPE,
} from '../../../../../common/constant/app';
import { useGetPrimaryBank } from '../../../../../hooks/useGetPrimaryBank';
import { useMasterData } from '../../../../../contexts/mastersContext';
import { welcomeLetterCCCHCRespite } from '../../../../../common/printDocument/welcomeLetterCCCHCRespite';
import useDarkMode from '../../../../../hooks/useDarkMode';
import { useReactToPrint } from 'react-to-print';
import './printDoc.scss';
import documentCss from './printDocDownload.scss?inline';
import { SendDocumentEmailModal } from './sendDocumentEmailModal';
import { useGetHeadOfficeAddress } from '../../../../../hooks/useGetHeadOfficeAddress';
import { getDocumentHeader } from '../../../../../helpers/residentDocument';
import { getActiveFundDetailsByJointFund } from '../../../../../helpers/resident';

const documentTemplateList = [
	{
		id: DOCUMENT_TEMPLATE_TYPES.RESIDENT_CONTRACT,
		color: 'info',
		name: "Resident's Contract",
		type: DOCUMENT_IDENTIFIER.contract,
	},
	{
		id: DOCUMENT_TEMPLATE_TYPES.FEE_INCREASE_LETTER,
		color: 'info',
		name: 'Annual Fee Increment Letter',
		type: DOCUMENT_IDENTIFIER.feesIncrement,
	},
	{
		id: DOCUMENT_TEMPLATE_TYPES.ICB_LA_PERMANENT,
		color: 'info',
		name: 'Welcome Letter - ICB or LA (Permanent)',
		type: DOCUMENT_IDENTIFIER.fully,
	},
	{
		id: DOCUMENT_TEMPLATE_TYPES.ICB_LA_RESPITE,
		color: 'info',
		name: 'Welcome Letter - ICB or LA (Respite)',
		type: DOCUMENT_IDENTIFIER.fully,
	},
	{
		id: DOCUMENT_TEMPLATE_TYPES.PRIVATE_PERMANENT,
		color: 'info',
		name: 'Welcome Letter - Private (Permanent)',
		type: DOCUMENT_IDENTIFIER.private,
	},
	{
		id: DOCUMENT_TEMPLATE_TYPES.PRIVATE_RESPITE,
		color: 'info',
		name: 'Welcome Letter - Private (Respite)',
		type: DOCUMENT_IDENTIFIER.private,
	},
	{
		id: DOCUMENT_TEMPLATE_TYPES.CC_CHC_PERMANENT,
		color: 'info',
		name: 'Welcome Letter - CC, CHC (Permanent)',
		type: DOCUMENT_IDENTIFIER.partial,
	},
	{
		id: DOCUMENT_TEMPLATE_TYPES.CC_CHC_RESPITE,
		color: 'info',
		name: 'Welcome Letter - CC, CHC (Respite)',
		type: DOCUMENT_IDENTIFIER.partial,
	},
];

export const ResidentDocumentItem = ({ document = {} }: any) => {
	return (
		<div className='d-flex align-items-center gap-4 p-3 border rounded-3 hover-shadow-sm bg-white hover-bg-light transition mb-3'>
			{/* === Left Side: Icon + Title === */}
			<div className='d-flex align-items-center gap-3 flex-grow-1 min-w-0'>
				<Icon icon='FileText' className='text-secondary fs-4 flex-shrink-0' />
				<div className='flex-grow-1 min-w-0'>
					<p className='fw-medium mb-0 text-truncate'>{document.name}</p>
					<small className='text-muted text-truncate'>
						Main residence contract signed on admission
					</small>
				</div>
			</div>

			{/* === Dates === */}
			<div className='d-flex align-items-center gap-4 text-muted small'>
				<div className='d-flex align-items-center gap-2'>
					<Icon icon='Calendar' className='text-secondary fs-6' />
					<div>
						<span className='fw-normal'>From:</span>
						<span className='ms-1'>
							{' '}
							{moment(document.fundSDate).format('DD MM YYYY')}
						</span>
					</div>
				</div>
				<div className='d-flex align-items-center gap-2'>
					<Icon icon='Calendar' className='text-secondary fs-6' />
					<div>
						<span className='fw-normal'>To:</span>
						<span className='ms-1'>
							{moment(document.fundEDate).format('DD MM YYYY')}
						</span>
					</div>
				</div>
			</div>

			{/* === Status + Size === */}
			<div className='d-flex align-items-center gap-3'>
				{document.isSigned && (
					<Badge color='success' isLight className='px-2 py-1 text-uppercase'>
						Signed
					</Badge>
				)}
				<span className='text-muted small'>{document.size}</span>
			</div>

			{/* === Actions === */}
			<div className='d-flex align-items-center gap-2'>
				<Button
					tag='a'
					download
					target='_blank'
					href={document.fileUrl}
					isLight
					size='sm'
					color='info'
					className='d-flex align-items-center gap-1'>
					<Icon icon='Download' className='fs-6' />
				</Button>
			</div>
		</div>
	);
};

export const ResidentDocuments = ({ residentData = {} }: any) => {
	const { residentId }: any = useParams();
	const [isOpenDocumentModelForm, setIsOpenDocumentModelForm] = useState(false);
	const [isOpenTemplateViewModal, setIsOpenTemplateViewModal] = useState(false);
	const [openTemplateType, setOpenTemplateType] = useState<any>(null);
	const [comapanyDetails, setCompanyDetails] = useState<any>(getUserMappedCompany());
	const [isDownloadLoading, setDownloadLoading] = useState<boolean>(false);
	const [isPrintLoading, setPrintLoading] = useState(false);
	const [isSendMailOpen, setIsSendMailOpen] = useState(false);
	const [isLogoLoading, setIsLogoLoading] = useState(false);

	const { darkModeStatus } = useDarkMode();
	const {
		data: primaryBankDetails = [],
		isLoading: isPrimaryBankLoading,
		isError: isPrimaryBankError,
	} = useGetPrimaryBank(comapanyDetails?.id || '');

	const { data: headOfficeAddress, isLoading: isHeadOfficeLoading } = useGetHeadOfficeAddress();
	const {
		billingPatternList,
		localAuthorityList = [],
		localICBList = [],
		isLoading: isMasterLoading,
		isError: isMasterError,
	} = useMasterData();
	const [logoBase64, setLogoBase64] = useState<string | null>(null);

	useEffect(() => {
		let currentRequest = true;

		const convertLogo = async () => {
			if (!comapanyDetails?.logo) {
				setLogoBase64(null);
				return;
			}

			try {
				setIsLogoLoading(true);

				const base64 = await imageUrlToBase64(comapanyDetails.logo);

				if (currentRequest) {
					setLogoBase64(base64);
				}
			} catch (error) {
				if (currentRequest) {
					setLogoBase64(null);
				}
			} finally {
				if (currentRequest) {
					setIsLogoLoading(false);
				}
			}
		};

		convertLogo();

		return () => {
			currentRequest = false;
		};
	}, [comapanyDetails?.logo]);

	const billingFormulas = useMemo(() => {
		if (!billingPatternList?.length || !comapanyDetails) return [];
		return ['privateBillingPattern', 'familyTopupPattern', 'ccBillingPattern']
			.map((key) => {
				const patternId = comapanyDetails[key];

				if (!patternId) return null;

				const matchedPattern = billingPatternList.find((p: any) => p.id === patternId);

				if (!matchedPattern?.billingFormula) return null;

				return {
					name: key,
					id: patternId,
					formula: matchedPattern?.billingFormula,
					description: matchedPattern?.description,
				};
			})
			.filter(Boolean);
	}, [billingPatternList, comapanyDetails]);

	const {
		data: residentDocumentByResidentIdList = [],
		isLoading,
		isError,
		refetch: onRelaodInviceList,
	} = useQuery({
		queryKey: ['residentDocumentByResidentId', residentId],
		queryFn: () => getResidentDocumentByResidentId(residentId),
		enabled: !!residentId,
	});

	const openDocumentFormModal = () => {
		setIsOpenDocumentModelForm(true);
	};

	const handleCloseDocumentModalForm = () => {
		setIsOpenDocumentModelForm(false);
	};

	const handleOpenModalTemplate = (temp: any) => {
		if (isLogoLoading) {
			showAlert({
				title: 'Please wait',
				text: 'Logo is still loading.',
				icon: 'info',
			});
			return;
		}
		setOpenTemplateType(temp);
		setIsOpenTemplateViewModal(true);
	};

	const handleCloseModalTemplate = () => {
		setOpenTemplateType(null);
		setIsOpenTemplateViewModal(false);
	};

	const renderedButtons = useMemo(() => {
		return documentTemplateList.map((temp) => {
			const fundDetails = getActiveFundDetails(residentData?.fundDetails);
			let placementType = +residentData?.admission?.typeOfPlacement;
			const fundSource = +fundDetails?.fundSource;
			const isJointFund = +fundSource === FUND_SOURCE_TYPE.JOINT_FUNDNG;
			const fundType = +fundDetails?.fundType;
			const activeRespite = getActiveRespiteDetails(
				residentData?.admission?.respiteStatusList,
			);
			const documentType = temp.type;

			//condition for extended with respite or permanent
			if (activeRespite) {
				placementType =
					+activeRespite?.status === RESPITE_STATUS_TYPE.EXTENDED_WITH_PERMANENT
						? PLACEMENT_TYPE.PERMANENT
						: PLACEMENT_TYPE.RESPITE;
			}

			if (
				temp.id === DOCUMENT_TEMPLATE_TYPES.FEE_INCREASE_LETTER &&
				!(
					(+(activeRespite?.status || 0) ===
						RESPITE_STATUS_TYPE.EXTENDED_WITH_PERMANENT ||
						placementType === PLACEMENT_TYPE.PERMANENT) &&
					(+fundSource === FUND_SOURCE_TYPE.PRIVATE ||
						+fundDetails?.familyTopupStatus === FAMILY_OR_THIRD_PARTY_TOPUP_STATUS.YES)
				)
			) {
				return null;
			}

			if (placementType === PLACEMENT_TYPE.PERMANENT && temp.name.includes('Respite')) {
				return null;
			}

			if (placementType === PLACEMENT_TYPE.RESPITE && temp.name.includes('Permanent')) {
				return null;
			}

			//  NEW: Welcome Letter filtering based on fundSource + fundType
			const isWelcomeLetter = temp.name.startsWith('Welcome Letter');

			//  DO NOT affect Resident Contract
			if (isWelcomeLetter) {
				const fundType = +fundDetails?.fundType; // FULLY / PARTIAL

				// 1 PRIVATE → show only Private
				if (
					fundSource === FUND_SOURCE_TYPE.PRIVATE &&
					!(documentType === DOCUMENT_IDENTIFIER.private)
				) {
					return null;
				}

				// 2 ICB / LA + FULLY → show only ICB / LA
				if (
					(fundSource === FUND_SOURCE_TYPE.CHC ||
						fundSource === FUND_SOURCE_TYPE.LOCAL_AUTHORITY ||
						isJointFund) &&
					fundType === FUND_TYPE.FULLY &&
					!(documentType === DOCUMENT_IDENTIFIER.fully)
				) {
					return null;
				}

				// 3 ICB / LA + PARTIAL → show only CC / CHC
				if (
					(fundSource === FUND_SOURCE_TYPE.CHC ||
						fundSource === FUND_SOURCE_TYPE.LOCAL_AUTHORITY ||
						isJointFund) &&
					fundType === FUND_TYPE.PARTIAL &&
					!(documentType === DOCUMENT_IDENTIFIER.partial)
				) {
					return null;
				}
			}

			let displayName =
				temp.id === DOCUMENT_TEMPLATE_TYPES.RESIDENT_CONTRACT
					? `Resident's Contract (${
							placementType === PLACEMENT_TYPE.RESPITE ? 'Respite' : 'Permanent'
						})`
					: temp.name;

			if (fundType === FUND_TYPE.FULLY) {
				displayName = displayName.replace(
					'ICB or LA',
					`${getLabelByValue(FUND_SOURCE_LIST, fundSource)}`,
				);
			} else if (fundType === FUND_TYPE.PARTIAL) {
				displayName = displayName.replace(
					'CC, CHC',
					`${[
						fundDetails?.familyTopupStatus === FAMILY_OR_THIRD_PARTY_TOPUP_STATUS.YES &&
							'FTU',
						fundDetails?.thirdPartyTopupStatus ===
							FAMILY_OR_THIRD_PARTY_TOPUP_STATUS.YES && 'TPT',
						fundDetails?.clientContribution > 0 && 'CC',
					]
						.filter(Boolean)
						.join(', ')}, ${getLabelByValue(FUND_SOURCE_LIST, fundSource)}`,
				);
			}

			return (
				<Button
					key={temp.id}
					size='sm'
					className='me-2 mb-2'
					color='light'
					isLight
					data-template={{ ...temp, displayName }}
					onClick={() => handleOpenModalTemplate({ ...temp, displayName })}>
					{displayName}
				</Button>
			);
		});
	}, [documentTemplateList, residentData]);
	const documentSize = renderedButtons.filter(Boolean).length;

	// end room info
	const roomInfo = getActiveWeekInfoByEndDate(residentData?.roomPrice);
	const theme = useMemo(
		() => ({
			bg: darkModeStatus ? '#111827' : '#ffffff',
			surface: darkModeStatus ? '#1f2933' : '#ffffff',
			text: darkModeStatus ? '#e5e7eb' : '#374151',
			mutedText: darkModeStatus ? '#9ca3af' : '#6c757d',
			border: darkModeStatus ? '#374151' : '#e6e9ef',
			headerBorder: darkModeStatus ? '#4b5563' : '#e6e9ef',
			sectionBg: darkModeStatus ? '#2b3035' : '#e9ecef',
			shadow: darkModeStatus ? '0 2px 8px rgba(0,0,0,.35)' : '0 2px 8px rgba(0,0,0,.05)',
			divider: darkModeStatus ? '#4b5563' : '#dee2e6',
			emphasis: darkModeStatus ? '#f9fafb' : '#212529',
		}),
		[darkModeStatus],
	);

	const printRef = useRef<HTMLDivElement>(null);
	const handlePrint = useReactToPrint({
		contentRef: printRef,
		documentTitle:
			openTemplateType?.displayName && residentData?.personal?.name
				? `${openTemplateType.displayName} - ${residentData.personal.name}`
				: 'Document',
	});

	const activeRespite = getActiveRespiteDetails(residentData?.admission?.respiteStatusList);

	const placementType = activeRespite
		? +activeRespite?.status === RESPITE_STATUS_TYPE.EXTENDED_WITH_PERMANENT
			? PLACEMENT_TYPE.PERMANENT
			: PLACEMENT_TYPE.RESPITE
		: +residentData?.admission?.typeOfPlacement;

	const handleDownloadDocument = async () => {
		if (isLogoLoading) {
			showAlert({
				title: 'Please wait',
				text: 'Logo is still loading.',
				icon: 'info',
			});
			return;
		}
		setDownloadLoading(true);
		const element = document.getElementById('document-box');

		if (!element) {
			showAlert({
				title: 'Document Download',
				text: 'Document content not found.',
				icon: 'error',
			});
			return;
		}

		const bedName = residentData?.bedDetails?.bedName;
		const residentName = residentData?.personal?.name;
		const activeFund = getActiveFundDetails(residentData?.fundDetails);
		let fundingName = getActiveFundDetailsByLAOrICB(
			activeFund,
			localAuthorityList,
			localICBList,
		)?.shortName;
		const isJointFunding = +activeFund?.fundSource === FUND_SOURCE_TYPE.JOINT_FUNDNG;
		if (isJointFunding) {
			const { la, icb } = getActiveFundDetailsByJointFund(
				activeFund,
				localAuthorityList,
				localICBList,
			);
			fundingName = `${la?.name || ''} & ${icb?.name || ''}`;
		}

		try {
			const payload: any = {
				content: element.outerHTML, // 🔥 FIX
				css: documentCss,
				documentType: openTemplateType?.id || '',
				action: 'DOWNLOAD',
				header:
					openTemplateType?.id === DOCUMENT_TEMPLATE_TYPES.RESIDENT_CONTRACT
						? `<div style="
width: 100%;
box-sizing: border-box;
padding: 10px 20px 8px 20px;
margin: 0;
display: flex;
justify-content: space-between;
align-items: center; 
border-bottom: 1px solid #e5e5e5;
position: relative;
">
  <div style="display:flex; align-items:center; gap:8px;">
    <img
      src=${logoBase64 || ''}
      alt="Company Logo"
      style="
        height:50px;
        width:auto; 
        display:block;
      "
    />
    <p style="margin:0; font-size:13px; font-weight:600; color:#111;">
      ${comapanyDetails?.tradeName}
    </p>
  </div>

  <div style="text-align:right;">
    <p style="margin:0; font-size:9px; color:#333; line-height:1.6;">
      ${comapanyDetails?.buildingNumber} ${comapanyDetails?.area}
    </p>
    <p style="margin:0; font-size:9px; color:#333; line-height:1.6;">
      ${comapanyDetails?.address}
    </p>
    <p style="margin:0; font-size:9px; color:#333; line-height:1.6;">
      ${comapanyDetails?.postCode}
    </p>
  </div>
</div>`
						: '',
			};

			let docName = '';
			const documentType = openTemplateType?.type;
			if (
				documentType === DOCUMENT_IDENTIFIER.fully ||
				documentType === DOCUMENT_IDENTIFIER.partial
			) {
				docName = `Welcome Letter - ${bedName} ${residentName} ${fundingName}`;
			} else if (documentType === DOCUMENT_IDENTIFIER.private) {
				docName = `Welcome Letter - ${bedName} ${residentName} PVT`;
			} else if (documentType === DOCUMENT_IDENTIFIER.contract) {
				const fundType =
					+activeFund?.fundSource === FUND_SOURCE_TYPE.PRIVATE ? 'PVT' : fundingName;
				const typeOfPlacement =
					placementType === PLACEMENT_TYPE.PERMANENT ? 'Permanent' : 'Respite';
				docName = `Resident Contract - ${bedName} ${residentName} ${fundType}`;
			} else if (documentType === DOCUMENT_IDENTIFIER.feesIncrement) {
				const fundType =
					+activeFund?.fundSource === FUND_SOURCE_TYPE.PRIVATE ? 'PVT' : fundingName;
				docName = `Annual Fee increment letter - ${bedName} ${residentName} ${fundType}`;
			}

			const fileName = docName ? `${docName}` : 'Document';

			await downloadResidentDocument(payload, fileName);
		} catch (e) {
			console.error(e);
		} finally {
			setDownloadLoading(false);
		}
	};

	const handleSendEmail = async () => {
		try {
			if (isLogoLoading) {
				showAlert({
					title: 'Please wait',
					text: 'Logo is still loading.',
					icon: 'info',
				});
				return;
			}
			const element = document.getElementById('document-box');
			if (!element) {
				showAlert({
					icon: 'warning',
					title: 'Missing Document',
					text: `Document content not found.`,
				});
				return;
			}

			const emailAddress = getNokName().email;
			// 🔍 Validation
			if (!emailAddress) {
				showAlert({
					icon: 'warning',
					title: 'Missing Email',
					text: `Please update the  email address ${emailAddress}.`,
				});
				return;
			}
			setPrintLoading(true);

			const body = {
				content: element.outerHTML, // 🔥 FIX
				css: documentCss,
				documentType: openTemplateType?.id || '',
				action: 'EMAIL',
				emailId: emailAddress,
				header:
					openTemplateType?.id === DOCUMENT_TEMPLATE_TYPES.RESIDENT_CONTRACT
						? getDocumentHeader(logoBase64, comapanyDetails)
						: '',
			};
			console.log(body);

			await sendEmailResidentDocument(body);

			showAlert({
				icon: 'success',
				title: 'Email Sent',
				text: 'Invoice email has been sent successfully.',
			});
		} catch (error: any) {
			console.error(error);
		} finally {
			setPrintLoading(false);
		}
	};

	const getNokName = () => {
		const nokList = residentData?.nok ?? [];
		const invoiceReq = nokList.find(
			({ invoiceRequired }: any) => invoiceRequired === NOK_INVOICE_REQUIRED.YES,
		);
		const lpa = nokList.find(({ lpa }: any) => lpa === LPA_TYPE.YES);
		if (lpa) return { ...lpa };
		if (invoiceReq) return { ...invoiceReq };
		return { ...residentData?.billing };
	};

	const isEmailMode = useMemo(() => {
		return residentData?.admission?.invoiceMode === INVOICE_MODE_TYPE.EMAIL;
	}, [residentData]);

	return (
		<>
			<Card className='shadow-3d-primary'>
				<CardHeader>
					<CardLabel icon='Receipt'>
						<CardTitle tag='div' className='h5'>
							Documents
						</CardTitle>
						<CardActions tag='div' className='text-muted'>
							Manage resident contracts and related documents
						</CardActions>
					</CardLabel>
					<CardActions>
						{isEmailMode && (
							<Button
								icon='send'
								color='info'
								isLight
								onClick={() => setIsSendMailOpen(true)}>
								Send Mail
							</Button>
						)}

						<Button icon='upload' color='info' isLight onClick={openDocumentFormModal}>
							Upload Document
						</Button>
					</CardActions>
				</CardHeader>

				<CardBody>
					<Alert icon='ViewInAr' isLight color='success' className='flex-nowrap'>
						{documentSize || 0} Template Available
						<div className='row mt-3'>
							<div className='col-12'>{renderedButtons}</div>
						</div>
					</Alert>

					{residentDocumentByResidentIdList.map((doc) => {
						const docType = getLabelByValue(DOCUMENT_TYPE_LIST, doc.type);
						const docColor = getColorByValue(DOCUMENT_TYPE_LIST, doc.type);

						return (
							<Accordion
								key={doc.id}
								id={`accordion-${doc.id}`}
								shadow='none'
								className='border border-1 rounded-1 mb-4'
								color={doc.color}>
								<AccordionItem
									className={`bg-l10-${docColor}`}
									id={`accordion-item-${doc.id}`}
									title={
										<div className='d-flex justify-content-between w-100 align-items-center'>
											<div className='d-flex align-items-center'>
												<div className='flex-shrink-0'>
													<div className='p-2 bg-white rounded-circle'>
														<Icon
															icon='Receipt'
															className={`fs-3 text-${docColor}`}
														/>
													</div>
												</div>
												<div className='flex-grow-1 ms-3'>
													<div className='fw-medium fs-5'>{docType}</div>
													<span className='text-muted fs-6 fw-normal'>
														{doc.subtitle}
													</span>
												</div>
											</div>
											<div className='me-2'>
												<Badge
													size='sm'
													className='me-2 bg-white-text px-3 py-2'
													icon='UploadFile'>
													{doc.documents.length} Document
													{doc.documents?.length > 1 ? 's' : ''}
												</Badge>
											</div>
										</div>
									}>
									{doc.documents.map((document: any) => (
										<ResidentDocumentItem document={document} />
									))}
								</AccordionItem>
							</Accordion>
						);
					})}
				</CardBody>
			</Card>
			<ResidentDocumentForm
				residentData={residentData}
				isOpen={isOpenDocumentModelForm}
				toggle={handleCloseDocumentModalForm}
			/>

			<Modal
				setIsOpen={handleCloseModalTemplate}
				isOpen={isOpenTemplateViewModal}
				fullScreen
				titleId='transfer-modal'>
				<ModalHeader setIsOpen={handleCloseModalTemplate}>
					<ModalTitle id='transfer-modal'>
						Template Of {openTemplateType?.displayName}
					</ModalTitle>
					{/* <Button
						className='ms-4'
						onClick={handlePrint}
						icon='Print'
						color='dark'
						isLight>
						Print
					</Button> */}
					<Button
						className='ms-2'
						color='info'
						icon='Email'
						isLight
						isLoading={isPrintLoading}
						onClick={handleSendEmail}>
						Send Email
					</Button>
					<Button
						className='ms-4'
						onClick={handleDownloadDocument}
						icon='Download'
						color='dark'
						isLoading={isDownloadLoading}
						isLight>
						Download
					</Button>
				</ModalHeader>

				<ModalBody className=''>
					<div id='document-box'>
						{openTemplateType?.id === DOCUMENT_TEMPLATE_TYPES.RESIDENT_CONTRACT && (
							<div
								className='contract-list'
								ref={printRef}
								dangerouslySetInnerHTML={{
									__html:
										+placementType === PLACEMENT_TYPE.RESPITE
											? respiteAgreementDocument(
													residentData,
													comapanyDetails,
													roomInfo,
													theme,
													localAuthorityList,
													localICBList,
												)
											: permanentAgreementDocument(
													residentData,
													comapanyDetails,
													roomInfo,
													theme,
													billingFormulas,
													localAuthorityList,
													localICBList,
												),
								}}
							/>
						)}

						{openTemplateType?.id === DOCUMENT_TEMPLATE_TYPES.FEE_INCREASE_LETTER && (
							<div
								ref={printRef}
								dangerouslySetInnerHTML={{
									__html: feeIncreaseLetterDocument(
										residentData,
										comapanyDetails,
										roomInfo,
										theme,
										billingFormulas,
										headOfficeAddress,
										logoBase64,
									),
								}}
							/>
						)}

						{openTemplateType?.id === DOCUMENT_TEMPLATE_TYPES.ICB_LA_PERMANENT && (
							<div
								ref={printRef}
								dangerouslySetInnerHTML={{
									__html: welcomeLetterIcbOrLaPermanentDocument(
										residentData,
										comapanyDetails,
										roomInfo,
										localAuthorityList,
										localICBList,
										theme,
										billingFormulas,
										headOfficeAddress,
										logoBase64,
									),
								}}
							/>
						)}

						{openTemplateType?.id === DOCUMENT_TEMPLATE_TYPES.ICB_LA_RESPITE && (
							<div
								ref={printRef}
								dangerouslySetInnerHTML={{
									__html: welcomeLetterIcbOrLaRespite(
										residentData,
										comapanyDetails,
										roomInfo,
										localAuthorityList,
										localICBList,
										theme,
										headOfficeAddress,
										logoBase64,
									),
								}}
							/>
						)}

						{openTemplateType?.id === DOCUMENT_TEMPLATE_TYPES.PRIVATE_PERMANENT && (
							<div
								ref={printRef}
								dangerouslySetInnerHTML={{
									__html: welcomeLetterPrivatePermanent(
										residentData,
										comapanyDetails,
										roomInfo,
										primaryBankDetails,
										theme,
										billingFormulas,
										headOfficeAddress,
										logoBase64,
									),
								}}
							/>
						)}

						{openTemplateType?.id === DOCUMENT_TEMPLATE_TYPES.PRIVATE_RESPITE && (
							<div
								ref={printRef}
								dangerouslySetInnerHTML={{
									__html: welcomeLetterPrivateRespite(
										residentData,
										comapanyDetails,
										roomInfo,
										primaryBankDetails,
										theme,
										headOfficeAddress,
										logoBase64,
									),
								}}
							/>
						)}

						{openTemplateType?.id === DOCUMENT_TEMPLATE_TYPES.CC_CHC_PERMANENT && (
							<div
								ref={printRef}
								dangerouslySetInnerHTML={{
									__html: welcomeLetterCCCHCPermanent(
										residentData,
										comapanyDetails,
										primaryBankDetails,
										localAuthorityList,
										localICBList,
										theme,
										billingFormulas,
										roomInfo,
										headOfficeAddress,
										logoBase64,
									),
								}}
							/>
						)}
						{openTemplateType?.id === DOCUMENT_TEMPLATE_TYPES.CC_CHC_RESPITE && (
							<div
								ref={printRef}
								dangerouslySetInnerHTML={{
									__html: welcomeLetterCCCHCRespite(
										residentData,
										comapanyDetails,
										roomInfo,
										primaryBankDetails,
										localAuthorityList,
										localICBList,
										theme,
										headOfficeAddress,
										logoBase64,
									),
								}}
							/>
						)}
					</div>
				</ModalBody>
			</Modal>
			<SendDocumentEmailModal
				isOpen={isSendMailOpen}
				toggle={() => setIsSendMailOpen(!isSendMailOpen)}
				templates={renderedButtons
					.filter(Boolean)
					.map((btn: any) => btn.props['data-template'])
					.filter(Boolean)}
				/* raw dependencies */
				residentData={residentData}
				companyDetails={comapanyDetails}
				roomInfo={roomInfo}
				theme={theme}
				billingFormulas={billingFormulas}
				primaryBankDetails={primaryBankDetails}
				localAuthorityList={localAuthorityList}
				localICBList={localICBList}
				placementType={placementType}
			/>
		</>
	);
};
