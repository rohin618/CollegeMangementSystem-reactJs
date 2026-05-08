import { useCallback, useEffect, useMemo, useState } from 'react';
import {
	Modal,
	ModalHeader,
	ModalBody,
	Button,
	FormGroup,
	Input,
	Alert,
	CardLabel,
	CardTitle,
	Badge,
	Textarea,
} from '../../../../../../components/bootstrap';
import { DOCUMENT_TEMPLATE_TYPES, PLACEMENT_TYPE } from '../../../../../../common/constant';
import {
	feeIncreaseLetterDocument,
	permanentAgreementDocument,
	respiteAgreementDocument,
	welcomeLetterCCCHCPermanent,
	welcomeLetterIcbOrLaPermanentDocument,
	welcomeLetterIcbOrLaRespite,
	welcomeLetterPrivatePermanent,
	welcomeLetterPrivateRespite,
} from '../../../../../../common/printDocument';
import { welcomeLetterCCCHCRespite } from '../../../../../../common/printDocument/welcomeLetterCCCHCRespite';
import Icon from '../../../../../../components/icon';
import { showAlert } from '../../../../../../helpers/alerts';
import documentCss from '../printDocDownload.scss?inline';
import {
	downloadResidentDocument,
	getResidentDocument,
	sendResidentDocumentMail,
} from '../../../../../../common/api/residentDocument';
import {
	getNokInfo,
	getUserMappedCompanyId,
	imageUrlToBase64,
} from '../../../../../../helpers/helpers';

import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { MAIL_DRAFT_TEMPLATES } from './draftMailTemplates';
import { SearchableSelect } from '../../../../../../components/common';
import { MAIL_DRAFT_TYPE_LIST } from '../../../../../../common/data/option';
import { useGetHeadOfficeAddress } from '../../../../../../hooks/useGetHeadOfficeAddress';
import { getDocumentHeader } from '../../../../../../helpers/residentDocument';

interface Props {
	isOpen: boolean;
	toggle: () => void;
	templates: any[];

	residentData: any;
	companyDetails: any;
	roomInfo: any;
	theme: any;
	billingFormulas: any;
	primaryBankDetails: any;
	localAuthorityList: any;
	localICBList: any;
	placementType: number;
}

export const SendDocumentEmailModal = ({
	isOpen,
	toggle,
	templates,
	residentData,
	companyDetails,
	roomInfo,
	theme,
	billingFormulas,
	primaryBankDetails,
	localAuthorityList,
	localICBList,
	placementType,
}: Props) => {
	const [subject, setSubject] = useState('');
	const [body, setBody] = useState('Email Body...');

	const [draftType, setDraftType] = useState('');
	// const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
	const [selectedTemplates, setSelectedTemplates] = useState<any[]>([]);
	const [blobs, setBlobs] = useState<{ templateId: number; blob: Blob; displayName: string }[]>(
		[],
	);
	const [loadingTemplates, setLoadingTemplates] = useState<number[]>([]);
	const [email, setEmail] = useState('');
	const [ccInput, setCcInput] = useState('');
	const [ccEmails, setCcEmails] = useState<string[]>([]);

	const [isSending, setIsSending] = useState(false);

	const [activeDocRequests, setActiveDocRequests] = useState(0);
	const { data: headOfficeAddress, isLoading: isHeadOfficeLoading } = useGetHeadOfficeAddress();
	const [logoBase64, setLogoBase64] = useState<string | null>(null);
	const [isLogoLoading, setIsLogoLoading] = useState(false);

	useEffect(() => {
		let currentRequest = true;

		const convertLogo = async () => {
			if (!companyDetails?.logo) {
				setLogoBase64(null);
				return;
			}

			try {
				setIsLogoLoading(true);

				const base64 = await imageUrlToBase64(companyDetails.logo);

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
	}, [companyDetails?.logo]);

	useEffect(() => {
		if (!residentData) return;

		const nokInfo = getNokInfo(residentData);
		const residentEmail = nokInfo?.email;
		setEmail(residentEmail);
	}, [residentData]);

	useEffect(() => {
		if (!isOpen) {
			setSubject('');
			setBody('<p>Email Body...</p>');
			setSelectedTemplates([]);
			setBlobs([]);
			setDraftType('');
		}
	}, [isOpen]);

	const renderTemplateForMail = useCallback(
		(template: any): string | null => {
			if (!template?.id) return null;

			switch (template.id) {
				case DOCUMENT_TEMPLATE_TYPES.RESIDENT_CONTRACT:
					return placementType === PLACEMENT_TYPE.RESPITE
						? respiteAgreementDocument(
								residentData,
								companyDetails,
								roomInfo,
								theme,
								localAuthorityList,
								localICBList,
							)
						: permanentAgreementDocument(
								residentData,
								companyDetails,
								roomInfo,
								theme,
								billingFormulas,
								localAuthorityList,
								localICBList,
							);

				case DOCUMENT_TEMPLATE_TYPES.FEE_INCREASE_LETTER:
					return feeIncreaseLetterDocument(
						residentData,
						companyDetails,
						roomInfo,
						theme,
						billingFormulas,
						headOfficeAddress,
						logoBase64,
					);

				case DOCUMENT_TEMPLATE_TYPES.ICB_LA_PERMANENT:
					return welcomeLetterIcbOrLaPermanentDocument(
						residentData,
						companyDetails,
						roomInfo,
						localAuthorityList,
						localICBList,
						theme,
						billingFormulas,
						headOfficeAddress,
						logoBase64,
					);

				case DOCUMENT_TEMPLATE_TYPES.ICB_LA_RESPITE:
					return welcomeLetterIcbOrLaRespite(
						residentData,
						companyDetails,
						roomInfo,
						localAuthorityList,
						localICBList,
						theme,
						headOfficeAddress,
						logoBase64,
					);

				case DOCUMENT_TEMPLATE_TYPES.PRIVATE_PERMANENT:
					return welcomeLetterPrivatePermanent(
						residentData,
						companyDetails,
						roomInfo,
						primaryBankDetails,
						theme,
						billingFormulas,
						headOfficeAddress,
						logoBase64,
					);

				case DOCUMENT_TEMPLATE_TYPES.PRIVATE_RESPITE:
					return welcomeLetterPrivateRespite(
						residentData,
						companyDetails,
						roomInfo,
						primaryBankDetails,
						theme,
						headOfficeAddress,
						logoBase64,
					);

				case DOCUMENT_TEMPLATE_TYPES.CC_CHC_PERMANENT:
					return welcomeLetterCCCHCPermanent(
						residentData,
						companyDetails,
						primaryBankDetails,
						localAuthorityList,
						localICBList,
						theme,
						billingFormulas,
						roomInfo,
						headOfficeAddress,
						logoBase64,
					);

				case DOCUMENT_TEMPLATE_TYPES.CC_CHC_RESPITE:
					return welcomeLetterCCCHCRespite(
						residentData,
						companyDetails,
						roomInfo,
						primaryBankDetails,
						localAuthorityList,
						localICBList,
						theme,
						headOfficeAddress,
						logoBase64,
					);

				default:
					return null;
			}
		},
		[
			residentData,
			companyDetails,
			roomInfo,
			theme,
			billingFormulas,
			primaryBankDetails,
			localAuthorityList,
			localICBList,
			placementType,
			headOfficeAddress,
			logoBase64,
		],
	);

	const handleSendEmail = async () => {
		try {
			if (!subject.trim() || !body.trim()) {
				showAlert({
					title: 'Validation Error',
					text: 'Subject and message are required.',
					icon: 'error',
				});
				return;
			}

			if (!blobs.length) {
				showAlert({
					title: 'Validation Error',
					text: 'No documents selected.',
					icon: 'error',
				});
				return;
			}

			if (!email.trim()) {
				showAlert({
					title: 'Email Error',
					text: 'Recipient email is required.',
					icon: 'error',
				});
				return;
			}

			const companyId = getUserMappedCompanyId()?.companyId || '';

			if (!companyId) {
				console.warn('Need Company Id');
				return;
			}

			setIsSending(true);

			const formData = new FormData();

			formData.append('message', body);
			formData.append('subject', subject);
			formData.append('email', email);
			formData.append('companyId', companyId);
			if (ccEmails?.length > 0) {
				ccEmails.forEach((cc: string) => {
					formData.append('ccEmails', cc);
				});
			}

			blobs.forEach((item, index) => {
				const fileName = `${item?.displayName || 'document'}.pdf`;
				formData.append('files', item.blob, fileName);
			});

			const res = await sendResidentDocumentMail(formData);

			// ✅ Success Alert
			showAlert({
				title: 'Success',
				text: 'Email sent successfully.',
				icon: 'success',
			});

			toggle();
			setBlobs([]);
			setSubject('');
			setBody('');
			setCcEmails([]);
			setSelectedTemplates([]);
			setDraftType('');
		} catch (error: any) {
			console.error(error);

			const errorMessage =
				error?.response?.data?.error ||
				error?.message ||
				'Failed to send email. Please try again.';

			showAlert({
				title: 'Error',
				text: errorMessage,
				icon: 'error',
			});
		} finally {
			setIsSending(false);
		}
	};

	const toggleTemplateSelection = async (temp: any) => {
		const isAlreadySelected = selectedTemplates.some((t) => t.id === temp.id);

		// 🔹 REMOVE CASE
		if (isAlreadySelected) {
			setSelectedTemplates((prev) => prev.filter((t) => t.id !== temp.id));

			// remove blob also
			setBlobs((prev) => prev.filter((b) => b.templateId !== temp.id));

			return;
		}

		// start loader
		setLoadingTemplates((prev) => [...prev, temp.id]);

		try {
			const element = generateDocumentElement(temp);
			const responseBlob = await handleGetDocument(element, temp);

			if (responseBlob) {
				setBlobs((prev) => [
					...prev,
					{ templateId: temp.id, blob: responseBlob, displayName: temp.displayName },
				]);

				setSelectedTemplates((prev) => [...prev, temp]);
			}
		} catch (e) {
			console.error(e);
		} finally {
			// remove loader
			setLoadingTemplates((prev) => prev.filter((id) => id !== temp.id));
		}
	};

	const handleGetDocument = async (element: any, documentInfo: any) => {
		if (!element) {
			showAlert({
				title: 'Document Download',
				text: 'Document content not found.',
				icon: 'error',
			});
			return null;
		}

		try {
			setActiveDocRequests((prev) => prev + 1);
			const payload: any = {
				content: element.innerHTML,
				css: documentCss,
				documentType: documentInfo?.id || '',
				action: 'DOWNLOAD',
				header:
					documentInfo?.id === DOCUMENT_TEMPLATE_TYPES.RESIDENT_CONTRACT
						? getDocumentHeader(logoBase64, companyDetails)
						: '',
			};
			const responseBlob = await getResidentDocument(payload);
			return responseBlob;
		} catch (e) {
			console.error(e);
			return null;
		} finally {
			setActiveDocRequests((prev) => prev - 1);
		}
	};

	const generateDocumentElement = (temp: any) => {
		const htmlContent = renderTemplateForMail(temp);
		if (!htmlContent) return null;

		const wrapper = document.createElement('div');
		wrapper.style.backgroundColor = '#fff';
		wrapper.style.padding = '20px';
		wrapper.innerHTML = htmlContent;

		return wrapper;
	};

	const isValidEmail = useCallback((email: string) => {
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
	}, []);

	const addEmail = useCallback(
		(value: string) => {
			const email = value.trim().replace(/,$/, '');

			if (!email) return;
			if (!isValidEmail(email)) return;
			if (ccEmails.includes(email)) return;

			setCcEmails((prev) => [...prev, email]);
		},
		[ccEmails, isValidEmail],
	);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLInputElement>) => {
			if (['Enter', ',', 'Tab'].includes(e.key)) {
				e.preventDefault();
				addEmail(ccInput);
				setCcInput('');
			}
		},
		[ccInput, addEmail],
	);

	const removeEmail = useCallback((email: string) => {
		setCcEmails((prev) => prev.filter((item) => item !== email));
	}, []);

	const handlePaste = useCallback(
		(e: React.ClipboardEvent<HTMLInputElement>) => {
			e.preventDefault();
			const pasted = e.clipboardData.getData('text');

			const emails = pasted.split(/[,\s;]+/);

			emails.forEach((email) => addEmail(email));
		},
		[addEmail],
	);

	const handleDraftChange = (e: any) => {
		const { value } = e.target;

		setDraftType(value);

		const template = MAIL_DRAFT_TEMPLATES[value];
		setBody(template || 'Email Body...');
	};
	return (
		<Modal
			isOpen={isOpen}
			setIsOpen={toggle}
			fullScreen
			isStaticBackdrop
			key={isOpen ? 'open' : 'closed'}>
			<ModalHeader setIsOpen={toggle} className='border-bottom bg-transparent text-dark'>
				<div className='d-flex align-items-center gap-3'>
					<div className='p-2 rounded-circle border'>
						<Icon icon='mail' className='text-dark fs-4' />
					</div>

					<div>
						<CardTitle className='h5 mb-0 text-dark'>Send Document via Email</CardTitle>
						<small className=''>Compose email and select document template</small>
					</div>
				</div>
			</ModalHeader>

			<ModalBody className=''>
				<div className='container-fluid'>
					<div className='row'>
						<div className='col-lg-8 mx-auto'>
							{/* EMAIL DETAILS */}
							<div className='bg-white rounded shadow-sm p-4 mb-4'>
								<h6 className='fw-semibold mb-3'>Email Details</h6>

								<FormGroup isFloating label='Recipient Email'>
									<Input
										className='my-2'
										type='email'
										value={email}
										onChange={(e: any) => setEmail(e.target.value)}
										placeholder='Enter recipient email'
									/>
								</FormGroup>

								<FormGroup label='CC For recipient email'>
									<div className='form-control d-flex flex-wrap align-items-center gap-2 py-2'>
										{ccEmails.map((email) => (
											<Badge
												key={email}
												color='primary'
												isLight
												className='d-flex align-items-center gap-2'>
												{email}
												<span
													style={{ cursor: 'pointer' }}
													onClick={() => removeEmail(email)}>
													×
												</span>
											</Badge>
										))}

										<input
											type='email'
											className='border-0 flex-grow-1'
											placeholder='Type email and press Enter'
											value={ccInput}
											onChange={(e) => setCcInput(e.target.value)}
											onKeyDown={handleKeyDown}
											onPaste={handlePaste}
											style={{
												outline: 'none',
												minWidth: '200px',
												backgroundColor: 'transparent',
											}}
										/>
									</div>
								</FormGroup>

								<FormGroup label='Email Subject' isFloating>
									<Input
										className='my-4'
										placeholder='Enter email subject'
										value={subject}
										onChange={(e: any) => setSubject(e.target.value)}
									/>
								</FormGroup>

								<SearchableSelect
									name='mailDraftType'
									id='mailDraftType'
									value={draftType}
									onChange={handleDraftChange}
									options={MAIL_DRAFT_TYPE_LIST}
									placeholder='Draft Type'
								/>

								<div className='my-4'>
									<style>
										{`
      .ck-editor__editable_inline {
        min-height: 200px !important;
      }
    `}
									</style>

									<CKEditor
										editor={ClassicEditor}
										data={body}
										onChange={(event, editor) => {
											setBody(editor.getData());
										}}
									/>
								</div>
							</div>

							{/* TEMPLATE SELECTION */}
							<div className='bg-white rounded shadow-sm p-4 mb-4'>
								<h6 className='fw-semibold mb-3'>Select Document Templates</h6>

								<div className='row g-3'>
									{templates?.map((temp) => {
										const isSelected = selectedTemplates.some(
											(t) => t.id === temp.id,
										);

										const isLoading = loadingTemplates.includes(temp.id);

										return (
											<div className='col-md-6 col-lg-4' key={temp.id}>
												<div
													onClick={() => {
														if (isLoading) return;

														if (isLogoLoading) {
															showAlert({
																title: 'Please wait',
																text: 'Logo is still loading. Try again in a moment.',
																icon: 'info',
															});
															return;
														}

														toggleTemplateSelection(temp);
													}}
													className={`border rounded p-3 position-relative ${
														isSelected
															? 'border-primary bg-light shadow-sm'
															: 'border-light'
													}`}
													style={{
														cursor: isLoading
															? 'not-allowed'
															: 'pointer',
														transition: '0.2s',
														opacity: isLoading ? 0.7 : 1,
													}}>
													{/* 🔹 Loading Spinner */}
													{isLoading && (
														<span className='position-absolute top-0 end-0 m-2'>
															<span className='spinner-border spinner-border-sm text-primary' />
														</span>
													)}

													{/* 🔹 Check Icon (Only when selected & not loading) */}
													{isSelected && !isLoading && (
														<span className='position-absolute top-0 end-0 m-2'>
															<Icon
																icon='check-circle'
																className='text-primary fs-5'
															/>
														</span>
													)}

													<div className='fw-semibold'>
														{temp.displayName || temp.name}
													</div>

													<small className='text-muted'>
														{isLoading
															? 'Generating document...'
															: isSelected
																? 'Selected'
																: 'Click to select'}
													</small>
												</div>
											</div>
										);
									})}
								</div>
							</div>

							{/* ACTIONS */}
							<div className='d-flex justify-content-end gap-2'>
								<Button color='danger' isLight onClick={toggle}>
									Cancel
								</Button>
								<Button
									isLight
									color='info'
									isLoading={isSending}
									isDisable={
										activeDocRequests > 0 || selectedTemplates.length < 1
									}
									onClick={handleSendEmail}>
									Send Email
								</Button>
							</div>
						</div>
					</div>
				</div>
			</ModalBody>
		</Modal>
	);
};
