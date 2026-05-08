import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
	Button,
	Card,
	CardActions,
	CardBody,
	CardFooter,
	CardHeader,
	CardTitle,
	Dropdown,
	DropdownItem,
	DropdownMenu,
	DropdownToggle,
	FormGroup,
	Input,
	Modal,
	ModalBody,
	ModalFooter,
	ModalHeader,
	ModalTitle,
	Popovers,
	Spinner,
	Textarea,
} from '../../../../../components/bootstrap';
import { DateTimePicker, SearchableSelect } from '../../../../../components/common';
import SimpleReactValidator from 'simple-react-validator';
import { purchaseorderModal } from '../../../../../common/model/purchaseorder';
import { IPurchaseOrderModal } from '../../../../../common/interface/purchaseOrder';
import { PURCHASE_ORDER_STATUS_LIST, VAT_MODE_OPTIONS } from '../../../../../common/data/option';
import {
	GRN_STATUS_TYPE,
	PURCHASE_ORDER_STATUS,
	QUERY_KEY,
	VAT_MODE_TYPE,
} from '../../../../../common/constant';
import { useQuery } from '@tanstack/react-query';
import { getAllVendors } from '../../../../../common/api/vendor';
import { getAllProduct, updateProductLastPrice } from '../../../../../common/api/product';
import { getAllChartOfAccounts } from '../../../../../common/api/chartAccount';
import { useMasterData } from '../../../../../contexts/mastersContext';
import { createPurchaseOrder, notifyManagerForApproval, notifyMDForApproval, sendPOToSupplier, updatePurchaseOrder } from '../../../../../common/api/purchaseOrder';
import { useGetHeadOfficeAddress } from '../../../../../hooks/useGetHeadOfficeAddress';
import { useUpdateQueryListById } from '../../../../../hooks';
import {
	generateUid,
	getFirstLetter,
	getColorByValue,
	getLabelByValue,
	getStorage,
	getUserMappedCompanyId,
	getVatAmount,
	getVatAmountExcluded,
	priceFormat,
	showAlert,
} from '../../../../../helpers/helpers';
import { EXIST_SESSION_STORAGE_NAMES } from '../../../../../common/constant';
import useDarkMode from '../../../../../hooks/useDarkMode';
import { getColorNameWithIndex } from '../../../../../common/data/enumColors';
import { IVendorModal } from '../../../../../common/interface/vendor';
import { getAllUnitOfMeasurement } from '../../../../../common/api/unitOfMeasurement';
import PurchaseOrderComments from './purchaseOrderComments';
import GrnModal from '../grnModal';
import { useNavigate } from 'react-router-dom';
import { useMapById } from '../../../../../hooks/useMapById';

const round2 = (value: number) => Number(value.toFixed(2));
export const VIEW_ONLY_STYLE: React.CSSProperties = {
	pointerEvents: 'none',
};

type Props = {
	isOpen: boolean;
	toggle: () => void;
	purchaseOrderDataEdit?: IPurchaseOrderModal;
	bulkPurchaseOrderItems?: any;
};
const PurchaseOrderForm: React.FC<Props> = ({
	isOpen,
	toggle,
	purchaseOrderDataEdit = null,
	bulkPurchaseOrderItems = [],
}) => {
	const navigate = useNavigate();
	const [isLoading, setIsLoading] = useState(false);
	const [isViewOnly, setIsViewOnly] = useState(false);

	const [purchaseOrderData, setPurchaseOrderData] =
		useState<IPurchaseOrderModal>(purchaseorderModal);
	const { darkModeStatus } = useDarkMode();

	const [isSubmitted, setIsSubmitted] = useState(false);

	const [isOpenComment, setIsOpenComment] = useState(false);
	const [statusComment, setStatusComment] = useState(0);
	const [isSendingToSupplier, setIsSendingToSupplier] = useState(false);
	const [isSendingToMD, setIsSendingToMD] = useState(false);
	const [isGrnModalOpen, setIsGrnModalOpen] = useState(false);
	const [selectedItemId, setSelectedItemId] = useState('');
	const [isViewGrn, setIsViewGrn] = useState(false);

	const { data: headOfficeAddress } = useGetHeadOfficeAddress();

	const validator = useRef(new SimpleReactValidator({ className: 'text-danger' }));

	const { data: vendorList = [], isLoading: isVendorLoading } = useQuery({
		queryKey: [QUERY_KEY.VENDOR_LIST],
		queryFn: getAllVendors,
		staleTime: 5 * 60 * 1000,
	});

	const { data: productList = [], isLoading: isProductLoading } = useQuery({
		queryKey: [QUERY_KEY.PRODUCT_LIST],
		queryFn: () => getAllProduct(),
		staleTime: 5 * 60 * 1000,
	});

	const { data: chartOfAccountList = [] } = useQuery({
		queryKey: ['chartOfAccounts'],
		queryFn: getAllChartOfAccounts,
		staleTime: 5 * 60 * 1000,
	});

	const { data: unitOfMeasurementList = [], isLoading: isUnitOfMeasurementListLoading } =
		useQuery({
			queryKey: [QUERY_KEY.UNIT_OF_MEASUREMENT],
			queryFn: () => getAllUnitOfMeasurement(),
			staleTime: 5 * 60 * 1000,
		});

	const { vatList, isLoading: isVatLoading, isError: isVatError } = useMasterData();


	const updatePurchaseOrderList = useUpdateQueryListById<any>([QUERY_KEY.PURCHASE_ORDER]);

	const productMap = useMapById<any>(productList);
	const accountMap = useMapById<any>(chartOfAccountList);
	const vatMap = useMapById<any>(vatList);
	const unitOfMeasurementMap = useMapById<any>(unitOfMeasurementList);

	useEffect(() => {
		if (isOpen) {
			setIsSubmitted(false);
			validator.current.purgeFields();
			setIsViewOnly(false);

			if (purchaseOrderDataEdit) {
				// Editing / viewing an existing PO — use its data as-is
				setPurchaseOrderData({ ...purchaseOrderDataEdit });
				if (purchaseOrderDataEdit?.status !== PURCHASE_ORDER_STATUS.DRAFT) {
					setIsViewOnly(true);
				}
			} else {
				// Creating a new PO — auto-fill requestedBy from the logged-in user
				const sessionUser = getStorage(EXIST_SESSION_STORAGE_NAMES.CURRENT_USER_INFO);
				const userName = sessionUser?.name || sessionUser?.email || '';
				setPurchaseOrderData({ ...purchaseorderModal, requestedBy: userName });
			}
		}
	}, [isOpen, purchaseOrderDataEdit]);

	useEffect(() => {
		const rows = bulkPurchaseOrderItems?.rows ?? [];
		const header = bulkPurchaseOrderItems?.header;
		if (!bulkPurchaseOrderItems || !header || !Array.isArray(rows) || rows.length === 0) return;

		const mappedItems = rows?.map((item: any) => ({
			id: generateUid(),
			productId: item.productId || '',
			description: item.description || '',
			qty: item.qty ?? 0,
			unitPrice: item.unitPrice ?? 0,
			coaMapping: {
				accountId: '',
				type: '',
			},
			totalAmount: item.totalAmount ?? 0,
			vatRate: item.vatRate ?? 0,
			vatAmount: item.vatAmount ?? 0,
			vatId: item?.vatId ?? '',
		}));

		setPurchaseOrderData((prev: any) => ({
			...prev,

			// ✅ HEADER → PURCHASE ORDER DETAILS
			vendorId: prev.vendorId || header?.vendorId || '',
			date: prev.date || header?.poDate || '',
			deliveryDate: prev.deliveryDate || header?.expectDate || '',
			notes: prev.notes || header?.notes || '',

			// ✅ ITEMS
			items: mappedItems,

			// ✅ TOTALS
			subTotal: mappedItems.reduce((sum: number, i: any) => sum + i.qty * i.unitPrice, 0),
			vatTotal: mappedItems.reduce((sum: number, i: any) => sum + i.vatAmount, 0),
			totalPrice: mappedItems.reduce((sum: number, i: any) => sum + i.totalAmount, 0),
		}));
	}, [bulkPurchaseOrderItems, isOpen]);

	useEffect(() => {
		let subTotal = 0;
		let vatTotal = 0;
		let totalPrice = 0;

		purchaseOrderData.items.forEach((item) => {
			const lineTotal = Number(item.totalAmount || 0);
			const vatAmount = Number(item.vatAmount || 0);

			totalPrice += lineTotal;
			vatTotal += vatAmount;
			subTotal += lineTotal - vatAmount;
		});

		subTotal = round2(subTotal);
		vatTotal = round2(vatTotal);
		totalPrice = round2(totalPrice);

		setPurchaseOrderData((prev) => ({
			...prev,
			subTotal,
			vatTotal,
			totalPrice,
		}));
	}, [purchaseOrderData.items]);

	useEffect(() => {
		setPurchaseOrderData((prev) => {
			const isInclude = prev.vatMode === VAT_MODE_TYPE.INCLUDE;

			const updatedItems = prev.items.map((item) => {
				const qty = Number(item.qty) || 0;
				const unitPrice = Number(item.unitPrice) || 0;
				const vatRate = Number(item.vatRate) || 0;

				const baseAmount = round2(qty * unitPrice);

				const vatAmount = round2(
					isInclude
						? getVatAmount(baseAmount, vatRate)
						: getVatAmountExcluded(baseAmount, vatRate),
				);

				const totalAmount = isInclude ? baseAmount : round2(baseAmount + vatAmount);

				// 🔥 Only update if changed
				if (item.vatAmount === vatAmount && item.totalAmount === totalAmount) {
					return item;
				}

				return {
					...item,
					vatAmount,
					totalAmount,
				};
			});

			return { ...prev, items: updatedItems };
		});
	}, [purchaseOrderData.vatMode]);

	const handlePurchaseItemChange = useCallback(
		(itemId: string, field: string, value: any) => {
			setPurchaseOrderData((prev) => {
				const vatMode = prev?.vatMode;
				const isInclude = vatMode === VAT_MODE_TYPE.INCLUDE;

				return {
					...prev,
					items: prev.items.map((item) => {
						if (item.id !== itemId) return item;

						let updated = { ...item };
						let description = '';

						// 1️⃣ Handle COA Mapping
						if (field.startsWith('coaMapping.')) {
							const key = field.split('.')[1];
							return {
								...updated,
								coaMapping: {
									...updated.coaMapping,
									[key]: value,
								},
							};
						}

						// 2️⃣ Update basic field first
						updated = { ...updated, [field]: value };

						// 3️⃣ Handle VAT change And description via productId
						if (field === 'productId') {
							const product = productMap[value];
							const vatId = product?.vatId;
							description = product?.description;
							const vat = vatMap[vatId];
							updated.vatId = vatId;
							updated.vatRate = Number(vat?.rate || 0);
							updated.unitOfMeasurementId = product?.unitOfMeasurementId || '';
						}

						// 4️⃣ Handle VAT change via vatId
						if (field === 'vatId') {
							const vat = vatMap[value];
							updated.vatRate = Number(vat?.rate || 0);
						}

						// 5️⃣ Compute amounts (single place)
						const qty = Number(updated.qty) || 0;
						const unitPrice = Number(updated.unitPrice) || 0;
						const vatRate = Number(updated.vatRate) || 0;

						let baseAmount = round2(qty * unitPrice);

						let vatAmount = isInclude
							? getVatAmount(baseAmount, vatRate)
							: getVatAmountExcluded(baseAmount, vatRate);

						vatAmount = round2(vatAmount);

						const totalAmount = isInclude ? baseAmount : round2(baseAmount + vatAmount);

						return {
							...updated,
							totalAmount,
							vatAmount,
							description: field === 'productId' ? description : updated.description,
						};
					}),
				};
			});
		},
		[vatList, productList],
	);

	const handleChange = useCallback((e: any) => {
		const { id, value, type, checked } = e.target;
		setPurchaseOrderData((prev) => ({
			...prev,
			[id]: type === 'checkbox' ? checked : value,
		}));
	}, []);

	const handleFormSubmit = async (status: number, comment?: string) => {
		const isDraft = status === PURCHASE_ORDER_STATUS.DRAFT;

		if (!isDraft && !isViewOnly) {
			setIsSubmitted(true);

			if (!validator.current.allValid()) {
				validator.current.showMessages();
				console.log(validator.current.getErrorMessages());
				return;
			}
		}

		const payload = {
			...purchaseOrderData,
			status,
			cancelOrPartialCmt: comment ?? purchaseOrderData.cancelOrPartialCmt,
		};

		setIsLoading(true);

		try {
			const response = purchaseOrderData?.id
				? await updatePurchaseOrder(purchaseOrderData.id, payload)
				: await createPurchaseOrder(payload);

			updatePurchaseOrderList(response);

			const companyId = getUserMappedCompanyId()?.companyId || '';
			const savedId = response?.id ?? purchaseOrderData.id;

			if (status === PURCHASE_ORDER_STATUS.PENDING) {
				const managerEmail = headOfficeAddress?.directorEmail;
				if (savedId && managerEmail) {
					notifyManagerForApproval(savedId, managerEmail, companyId).catch(console.error);
				}
			}

			if (status === PURCHASE_ORDER_STATUS.AWAITING_MD) {
				const mdEmail = headOfficeAddress?.mdEmail;
				if (savedId && mdEmail) {
					notifyMDForApproval(savedId, mdEmail, companyId).catch(console.error);
				}
			}

			if (status === PURCHASE_ORDER_STATUS.COMPLETED) {
				await Promise.all(
					purchaseOrderData.items.map((item: any) =>
						item.productId && item.unitPrice > 0
							? updateProductLastPrice(item.productId, item.unitPrice)
							: Promise.resolve(),
					),
				);
			}

			setPurchaseOrderData({ ...purchaseorderModal });

			if (bulkPurchaseOrderItems) {
				navigate('/purchaseOrder');
			}
		} catch (err) {
			console.error('Error in saving purchase order:', err);
		} finally {
			toggle();
			setIsLoading(false);
		}
	};

	const handleAddPurchaseOrder = () => {
		setPurchaseOrderData((prev: any) => ({
			...prev,
			items: [
				...prev.items,
				{
					id: generateUid(),
					productId: '',
					description: '',
					qty: '',
					unitPrice: '',
					coaMapping: {
						accountId: '',
						type: '',
					},
					totalAmount: 0,
					vatRate: 0,
					vatAmount: 0,
					vatId: '',
					unitOfMeasurementId: '',
				},
			],
		}));
	};
	const handleDeletePurchaseOrderItem = (itemId: string) => {
		setPurchaseOrderData((prev: any) => ({
			...prev,
			items: prev.items.filter((item: any) => item.id !== itemId),
		}));
		setIsSubmitted(false);
		validator?.current.purgeFields();
	};

	const canAddItem = purchaseOrderData.items.every(
		(item: any) =>
			item.productId?.trim() &&
			item.description?.trim() &&
			Number(item.qty) > 0 &&
			Number(item.unitPrice) > 0 &&
			item.coaMapping?.accountId?.trim() &&
			Number(item.totalAmount) > 0 &&
			item?.vatId?.trim(),
	);

	const viewVendor = vendorList?.find((v) => v.id === purchaseOrderData.vendorId) as
		| IVendorModal
		| undefined;

	const handleOpenComments = (status: number) => {
		setStatusComment(status);
		setIsOpenComment(true);
	};

	const handleSendToMD = async () => {
		setIsSendingToMD(true);
		try {
			const payload = {
				...purchaseOrderData,
				status: PURCHASE_ORDER_STATUS.AWAITING_MD,
			};
			const response = await updatePurchaseOrder(purchaseOrderData.id!, payload);
			updatePurchaseOrderList(response);

			const companyId = getUserMappedCompanyId()?.companyId || '';
			const mdEmail = headOfficeAddress?.mdEmail;
			if (mdEmail) {
				await notifyMDForApproval(purchaseOrderData.id!, mdEmail, companyId);
			}

			showAlert({
				title: 'Sent to MD',
				text: mdEmail
					? `Status updated and MD (${mdEmail}) has been notified for approval.`
					: 'Status updated. No MD email found to notify.',
				icon: 'success',
				confirmButtonText: 'OK',
			});

			setPurchaseOrderData({ ...purchaseorderModal });
			toggle();
		} catch (err) {
			showAlert({
				title: 'Failed',
				text: 'Could not send to MD. Please try again.',
				icon: 'error',
				confirmButtonText: 'OK',
			});
		} finally {
			setIsSendingToMD(false);
		}
	};


	const selectedProductIds = useMemo(() => {
		return purchaseOrderData.items.map((item: any) => item.productId).filter(Boolean);
	}, [purchaseOrderData.items]);

	const requiresMDApproval = (purchaseOrderData.totalPrice || 0) > 2000;

	const getVendorEmail = (): string => {
		if (!viewVendor) return '';
		const primaryFromList = viewVendor.emails?.find((e) => e.isPrimary)?.email;
		const anyFromList = viewVendor.emails?.find((e) => e.email?.trim())?.email;
		return primaryFromList || anyFromList || viewVendor.emailId || '';
	};

	const handleSendToSupplier = async () => {
		const vendorEmail = getVendorEmail();
		if (!vendorEmail) {
			showAlert({
				title: 'No Vendor Email',
				text: 'This vendor has no email address on record.',
				icon: 'warning',
				confirmButtonText: 'OK',
			});
			return;
		}
		try {
			setIsSendingToSupplier(true);
			const companyId = getUserMappedCompanyId()?.companyId || '';
			await sendPOToSupplier(purchaseOrderData.id!, vendorEmail, companyId);
			showAlert({
				title: 'Sent!',
				text: `PO has been emailed to ${vendorEmail}`,
				icon: 'success',
				confirmButtonText: 'OK',
			});
		} catch (err) {
			console.log('---err',err)
			showAlert({
				title: 'Failed',
				text: 'Could not send PO to supplier. Please try again.',
				icon: 'error',
				confirmButtonText: 'OK',
			});
		} finally {
			setIsSendingToSupplier(false);
		}
	};

	const priceVarianceMap = useMemo(() => {
		const map: Record<string, { diff: number; pct: number; isHigher: boolean }> = {};
		purchaseOrderData.items.forEach((item: any) => {
			const product = productMap[item.productId];
			const last = Number(product?.lastPurchasePrice ?? 0);
			const current = Number(item.unitPrice ?? 0);
			if (last > 0 && current > 0 && last !== current) {
				const diff = current - last;
				const pct = Math.round((diff / last) * 100);
				map[item.id] = { diff, pct, isHigher: diff > 0 };
			}
		});
		return map;
	}, [purchaseOrderData.items, productMap]);

	const debitAmount =
		purchaseOrderData.debitApply?.reduce((sum: number, d: any) => sum + (d.amount || 0), 0) ||
		0;

	const isAllProductsAdded =
		productList.length > 0 && selectedProductIds.length >= productList.length;

	return (
		<>
			<Modal
				setIsOpen={() => {}}
				isOpen={isOpen}
				fullScreen
				titleId='transfer-modal'
				id='invoiceUpdate'>
				<ModalHeader setIsOpen={toggle}>
					<ModalTitle id='transfer-modal' className='fw-bold fs-4 d-flex align-items-center gap-3'>
						Purchase Order
						{purchaseOrderData?.status && (
							<span
								className={`badge bg-${getColorByValue(PURCHASE_ORDER_STATUS_LIST, purchaseOrderData.status)} fs-6`}>
								{getLabelByValue(PURCHASE_ORDER_STATUS_LIST, purchaseOrderData.status)}
							</span>
						)}
					</ModalTitle>
				</ModalHeader>
				<ModalBody>
					{false ? (
						<Spinner />
					) : (
						<>
							{isViewOnly ? (
								<div className='border rounded p-4 mb-4'>
									<div className='row g-4'>
										{/* Vendor */}
										<div className='col-md-4'>
											<div className='text-muted fw-semibold mb-2'>
												Vendor
											</div>

											<div className='rounded px-3 py-2 bg-white d-flex align-items-center'>
												{/* Avatar */}
												<div className='flex-shrink-0'>
													<div
														className='ratio ratio-1x1 me-3'
														style={{ width: 40 }}>
														<div className='bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center'>
															<span className='fw-bold'>
																{getFirstLetter(
																	viewVendor?.name || 'NA',
																)}
															</span>
														</div>
													</div>
												</div>

												{/* Text */}
												<div>
													<div className='fw-semibold'>
														{viewVendor?.name || '—'}
													</div>
													<div className='text-muted fw-semibold'>
														{viewVendor?.emailId || '-'}
													</div>
												</div>
											</div>
										</div>

										{/* PO Date */}
										<div className='col-md-4'>
											<div className='text-muted fw-semibold mb-2'>
												PO Date
											</div>
											<div className='rounded px-3 py-2 bg-white fw-semibold'>
												{purchaseOrderData.date || '—'}
											</div>
										</div>

										{/* Expected Date */}
										<div className='col-md-4'>
											<div className='text-muted fw-semibold mb-2'>
												Expected Date
											</div>
											<div className='rounded px-3 py-2 bg-white fw-semibold'>
												{purchaseOrderData.deliveryDate || '—'}
											</div>
										</div>

										{/* Notes */}
										<div className='col-md-12'>
											<div className='text-muted fw-semibold mb-2'>Notes</div>
											<div className='rounded px-3 py-3 bg-white text-muted'>
												{purchaseOrderData.notes || '—'}
											</div>
										</div>

										{/* Requested By */}
										<div className='col-md-4'>
											<div className='text-muted fw-semibold mb-2'>
												Requested By
											</div>
											<div className='rounded px-3 py-2 bg-white fw-semibold'>
												{purchaseOrderData.requestedBy || '—'}
											</div>
										</div>

										{/* Internal Memo */}
										<div className='col-md-4'>
											<div className='text-muted fw-semibold mb-2'>
												Internal Memo
											</div>
											<div className='rounded px-3 py-3 bg-white text-muted'>
												{purchaseOrderData.internalMemo || '—'}
											</div>
										</div>
									</div>
								</div>
							) : (
								<div className='row g-3'>
									<div className='col-3'>
										<FormGroup
											id='vendorId'
											label='Vendor'
											style={isViewOnly ? VIEW_ONLY_STYLE : undefined}>
											<SearchableSelect
												isValid={validator.current.fieldValid('Vendor')}
												isTouched={isSubmitted}
												invalidFeedback={validator.current.message(
													'Vendor',
													purchaseOrderData.vendorId,
													'required',
												)}
												name='vendorId'
												id='vendorId'
												value={purchaseOrderData.vendorId}
												onChange={handleChange}
												isLoading={isVendorLoading}
												options={vendorList}
												placeholder='Select Vendor'
												labelKey='name'
												valueKey='id'
												renderLabel={(vendor: any, i: number) => (
													<div className='d-flex align-items-center'>
														{/* Avatar */}
														<div className='flex-shrink-0'>
															<div
																className='ratio ratio-1x1 me-3'
																style={{ width: 40 }}>
																<div
																	className={`bg-l${darkModeStatus ? 'o25' : '25'}-${getColorNameWithIndex(i) || 'primary'}
						text-${getColorNameWithIndex(i) || 'primary'}
						rounded-2 d-flex align-items-center justify-content-center`}>
																	<span className='fw-bold'>
																		{getFirstLetter(
																			vendor?.name,
																		)}
																	</span>
																</div>
															</div>
														</div>

														{/* Text */}
														<div className='flex-grow-1'>
															<div className='fw-bold fs-6'>
																{vendor?.name || 'NA'}
															</div>

															<div className='text-muted'>
																<small>
																	{vendor?.emailId || '-'}
																</small>
															</div>
														</div>
													</div>
												)}
											/>
										</FormGroup>
									</div>
									<div className='col-3'>
										<FormGroup
											id='date'
											label='PO Date'
											style={isViewOnly ? VIEW_ONLY_STYLE : undefined}>
											<DateTimePicker
												id='date'
												value={purchaseOrderData.date}
												onChange={handleChange}
												isValid={validator.current.fieldValid('PO Date')}
												isTouched={isSubmitted}
												invalidFeedback={validator.current.message(
													'PO Date',
													purchaseOrderData.date,
													'required',
												)}
											/>
										</FormGroup>
									</div>

									<div className='col-3'>
										<FormGroup
											id='deliveryDate'
											label='Expect Date'
											style={isViewOnly ? VIEW_ONLY_STYLE : undefined}>
											<DateTimePicker
												minDate={purchaseOrderData.date}
												id='deliveryDate'
												value={purchaseOrderData.deliveryDate}
												onChange={handleChange}
												isValid={validator.current.fieldValid(
													'Expect Date',
												)}
												isTouched={isSubmitted}
												invalidFeedback={validator.current.message(
													'Expect Date',
													purchaseOrderData.deliveryDate,
													'required',
												)}
											/>
										</FormGroup>
									</div>
									<div className='col-6'>
										<FormGroup
											id='notes'
											label='Notes'
											style={isViewOnly ? VIEW_ONLY_STYLE : undefined}>
											<Textarea
												id='notes'
												placeholder='Notes'
												value={purchaseOrderData.notes}
												onChange={handleChange}
												isValid={validator.current.fieldValid('Notes')}
												isTouched={isSubmitted}
												invalidFeedback={validator.current.message(
													'Notes',
													purchaseOrderData.notes,
													'required',
												)}
											/>
										</FormGroup>
									</div>

									{/* requestedBy is auto-filled on create and shown read-only in view mode */}

									<div className='col-6'>
  <FormGroup
    id='internalMemo'
    label='Internal Memo (Finance Controller only)'
    style={isViewOnly ? VIEW_ONLY_STYLE : undefined}>
    <Textarea
      id='internalMemo'
      value={purchaseOrderData.internalMemo}
      onChange={handleChange}
      placeholder='Visible only to Finance Controller...'
    />
  </FormGroup>
</div>
								</div>
							)}

							{requiresMDApproval && !purchaseOrderData?.id && (
								<div className='alert alert-warning d-flex align-items-center gap-2 mb-3'>
									<span>⚠️</span>
									<span>
										This PO exceeds <strong>£2,000</strong> — MD approval will
										be required after Finance Controller review.
									</span>
								</div>
							)}

						<div className='row mt-4'>
								<div className='col-12'>
									<Card shadow='none' className='border'>
										<CardHeader className='d-flex justify-content-between align-items-center'>
											<CardTitle tag='h5' className='mb-0'>
												Items
											</CardTitle>

											{isViewOnly ? (
												<>
													<div>
														<span className='fw-bold'>VAT Mode: </span>
														<span className='text-muted fw-semibold mb-2'>
															{getLabelByValue(
																VAT_MODE_OPTIONS,
																purchaseOrderData?.vatMode,
															) || '-'}
														</span>
													</div>
												</>
											) : (
												<div className='d-flex align-items-center gap-3'>
													<div style={{ minWidth: '250px' }}>
														<SearchableSelect
															name='vatMode'
															id='vatMode'
															value={purchaseOrderData?.vatMode}
															onChange={handleChange}
															options={VAT_MODE_OPTIONS}
															placeholder='VAT Type'
														/>
													</div>

													<Button
														isLight
														icon='Add'
														color='dark'
														isDisable={
															!canAddItem || isAllProductsAdded
														}
														onClick={handleAddPurchaseOrder}>
														Add Items
													</Button>
												</div>
											)}
										</CardHeader>

										<CardBody>
											<div className='table-responsve table-scroll'>
												<table className='table'>
													<thead>
														<tr>
															<th>product Name / Code</th>
															<th>Description</th>
															<th>Qty</th>
															<th>Unit Price</th>
															<th>UOM</th>

															{/* <th>Account Type</th> */}
															<th className=''>Account</th>

															<th>VAT</th>
															{/* <th>VAT Amount</th> */}
															<th>Total Amount</th>
															{!isViewOnly && <th>Action</th>}
														</tr>
													</thead>

													{isViewOnly ? (
														<tbody>
															{purchaseOrderData?.items?.map(
																(item: any, i: number) => {
																	const product =
																		productMap[item.productId];

																	const account =
																		accountMap[
																			item.coaMapping
																				?.accountId
																		];

																	const fullDesc =
																		item?.description || '';
																	const shortDesc =
																		fullDesc.length > 80
																			? fullDesc.slice(
																					0,
																					80,
																				) + '…'
																			: fullDesc;
																	return (
																		<tr key={item.id}>
																			{/* Product */}
																			<td>
																				{product ? (
																					<div className='d-flex align-items-center'>
																						{/* Avatar */}
																						<div className='flex-shrink-0'>
																							<div
																								className='ratio ratio-1x1 me-3'
																								style={{
																									width: 40,
																								}}>
																								<div
																									className={`bg-l${darkModeStatus ? 'o25' : '25'}-${getColorNameWithIndex(i) || 'primary'}
						text-${getColorNameWithIndex(i) || 'primary'}
						rounded-2 d-flex align-items-center justify-content-center`}>
																									<span className='fw-bold'>
																										{getFirstLetter(
																											product?.name,
																										)}
																									</span>
																								</div>
																							</div>
																						</div>

																						{/* Text */}
																						<div className='flex-grow-1'>
																							<div className='fw-semibold'>
																								{
																									product?.name
																								}
																							</div>
																							<div className='text-muted small'>
																								{product?.productCode ||
																									''}
																							</div>
																						</div>
																					</div>
																				) : (
																					<span className='text-muted'>
																						—
																					</span>
																				)}
																			</td>

																			{/* Description */}
																			<td className='text-muted'>
																				{/* {item.description ||
																					'—'} */}

																				<Popovers
																					desc={fullDesc}
																					trigger='hover'>
																					<div
																						style={{
																							textWrap:
																								'wrap',
																						}}>
																						{shortDesc}
																					</div>
																				</Popovers>
																			</td>

																			{/* Qty */}
																			<td className=''>
																				{item.qty}
																			</td>

																			{/* Unit Price */}
																			<td className=''>
																				{priceFormat(
																					item?.unitPrice ||
																						0,
																				)}
																			</td>

																			{/* UOM */}
																			<td>
																				{unitOfMeasurementMap[
																					productMap[
																						item
																							?.productId
																					]
																						?.unitOfMeasurementId
																				]?.name || '-'}
																			</td>

																			{/* Account */}
																			<td>
																				{account?.accountName ||
																					'—'}
																			</td>

																			{/* VAT */}
																			<td>
																				{item?.vatRate +
																					'%'}
																			</td>

																			{/* Total */}
																			<td className=' fw-semibold'>
																				{priceFormat(
																					item?.totalAmount ||
																						0,
																				)}
																			</td>

																			{/* {[
																				+PURCHASE_ORDER_STATUS.APPROVED,
																				+PURCHASE_ORDER_STATUS.PARTIAL,
																				+PURCHASE_ORDER_STATUS.COMPLETED,
																			].includes(
																				+purchaseOrderData?.status,
																			) && (
																				<td className=''>
																					<Dropdown>
																						<DropdownToggle
																							hasIcon={
																								false
																							}>
																							<Button
																								color='dark'
																								isLight
																								icon='MoreHoriz'
																								aria-label='GRN actions'
																							/>
																						</DropdownToggle>

																						<DropdownMenu
																							isAlignmentEnd>
																							
																							{+purchaseOrderData?.status !==
																								PURCHASE_ORDER_STATUS.COMPLETED && (
																								<DropdownItem>
																									<Button
																										color='link'
																										icon='Edit'
																										onClick={() => {
																											setSelectedItemId(
																												item.id,
																											);
																											setIsGrnModalOpen(
																												true,
																											);
																											setIsViewGrn(
																												false,
																											);
																										}}>
																										Update
																										GRN
																									</Button>
																								</DropdownItem>
																							)}

																							
																							<DropdownItem>
																								<Button
																									color='link'
																									icon='Visibility'
																									onClick={() => {
																										setSelectedItemId(
																											item.id,
																										);
																										setIsGrnModalOpen(
																											true,
																										);
																										setIsViewGrn(
																											true,
																										);
																									}}>
																									View
																									GRN
																								</Button>
																							</DropdownItem>
																						</DropdownMenu>
																					</Dropdown>
																				</td>
																			)} */}
																		</tr>
																	);
																},
															)}
														</tbody>
													) : (
														<tbody>
															{purchaseOrderData?.items?.map(
																(item: any, i: number) => (
																	<tr
																		key={item.id}
																		className='align-middle'>
																		{/* 1️⃣ Product Name */}
																		<td
																			className='wpx-200'
																			style={
																				isViewOnly
																					? VIEW_ONLY_STYLE
																					: undefined
																			}>
																			<SearchableSelect
																				name={`productId-${i}`}
																				value={
																					item.productId
																				}
																				options={productList.filter(
																					(p: any) => {
																						// allow current row's selected product
																						if (
																							p.id ===
																							item.productId
																						)
																							return true;

																						// remove already selected products
																						return !selectedProductIds.includes(
																							p.id,
																						);
																					},
																				)}
																				labelKey='name'
																				valueKey='id'
																				placeholder='Select'
																				isTouched={
																					isSubmitted
																				}
																				isValid={validator.current.fieldValid(
																					`Product Name-${i}`,
																				)}
																				invalidFeedback={validator.current.message(
																					`Product Name-${i}`,
																					item.productId,
																					'required',
																				)}
																				onChange={(
																					e: any,
																				) => {
																					handlePurchaseItemChange(
																						item.id,
																						'productId',
																						e.target
																							.value,
																					);
																				}}
																				renderLabel={(
																					product: any,
																					pIndex: number,
																				) => (
																					<div className='d-flex align-items-center'>
																						{/* Avatar */}
																						<div className='flex-shrink-0'>
																							<div
																								className='ratio ratio-1x1 me-3'
																								style={{
																									width: 40,
																								}}>
																								<div
																									className={`bg-l${darkModeStatus ? 'o25' : '25'}-${getColorNameWithIndex(pIndex) || 'primary'}
							text-${getColorNameWithIndex(pIndex) || 'primary'}
							rounded-2 d-flex align-items-center justify-content-center`}>
																									<span className='fw-bold'>
																										{getFirstLetter(
																											product?.name,
																										)}
																									</span>
																								</div>
																							</div>
																						</div>

																						{/* Text */}
																						<div className='flex-grow-1'>
																							<div className='fs-6 fw-bold'>
																								{product?.name ||
																									'NA'}
																							</div>

																							<div className='text-muted'>
																								<small>
																									{product?.productCode ||
																										'-'}
																								</small>
																							</div>
																						</div>
																					</div>
																				)}
																			/>
																		</td>

																		{/* 2️⃣ Description */}
																		<td
																			className='wpx-250'
																			style={
																				isViewOnly
																					? VIEW_ONLY_STYLE
																					: undefined
																			}>
																			<Textarea
																				value={
																					item.description
																				}
																				placeholder='Description'
																				isTouched={
																					isSubmitted
																				}
																				isValid={validator.current.fieldValid(
																					`description-${i}`,
																				)}
																				invalidFeedback={validator.current.message(
																					`description-${i}`,
																					item.description,
																					'required',
																				)}
																				id='description'
																				name='description'
																				onChange={(
																					e: any,
																				) => {
																					handlePurchaseItemChange(
																						item.id,
																						'description',
																						e.target
																							.value,
																					);
																				}}
																			/>
																		</td>

																		{/* 3️⃣ Qty */}
																		<td
																			className='text-end wpx-100'
																			style={
																				isViewOnly
																					? VIEW_ONLY_STYLE
																					: undefined
																			}>
																			<Input
																				type='number'
																				value={item.qty}
																				placeholder='Qty'
																				isTouched={
																					isSubmitted
																				}
																				isValid={validator.current.fieldValid(
																					`qty-${i}`,
																				)}
																				invalidFeedback={validator.current.message(
																					`qty-${i}`,
																					item.qty,
																					'required|numeric',
																				)}
																				id='qty'
																				name='qty'
																				onChange={(
																					e: any,
																				) => {
																					handlePurchaseItemChange(
																						item.id,
																						'qty',
																						e.target
																							.value,
																					);
																				}}
																			/>
																		</td>

																		{/* 4️⃣ Unit Price (incl VAT) */}
																		<td
																			className='text-end wpx-140'
																			style={
																				isViewOnly
																					? VIEW_ONLY_STYLE
																					: undefined
																			}>
																			<Input
																				type='number'
																				placeholder='unit Price'
																				value={
																					item.unitPrice
																				}
																				isTouched={
																					isSubmitted
																				}
																				isValid={validator.current.fieldValid(
																					`unitPrice-${i}`,
																				)}
																				invalidFeedback={validator.current.message(
																					`unitPrice-${i}`,
																					item.unitPrice,
																					'required|numeric',
																				)}
																				id='unitPrice'
																				name='unitPrice'
																				onChange={(
																					e: any,
																				) => {
																					handlePurchaseItemChange(
																						item.id,
																						'unitPrice',
																						e.target
																							.value,
																					);
																				}}
																			/>
																			{priceVarianceMap[item.id] && (
																				<small
																					className={
																						priceVarianceMap[item.id].isHigher
																							? 'text-danger'
																							: 'text-success'
																					}>
																					{priceVarianceMap[item.id].isHigher ? '▲' : '▼'}
																					{Math.abs(priceVarianceMap[item.id].pct)}% vs last
																				</small>
																			)}
																		</td>

																		{/* UOM */}
																		<td
																			className='wpx-140 fw-bold'
																			style={
																				isViewOnly
																					? VIEW_ONLY_STYLE
																					: undefined
																			}>
																			{/* <Input
																				readOnly
																				placeholder='UOM'
																				value={
																					unitOfMeasurementMap[
																						productMap[
																							item
																								?.productId
																						]
																							?.unitOfMeasurementId
																					]?.name
																				}
																				id='UOM'
																				name='UOM'
																			/> */}

																			{unitOfMeasurementMap[
																				productMap[
																					item?.productId
																				]
																					?.unitOfMeasurementId
																			]?.name || '-'}
																		</td>

																		{/* 6️⃣ Account */}
																		<td
																			className='wpx-200'
																			style={
																				isViewOnly
																					? VIEW_ONLY_STYLE
																					: undefined
																			}>
																			<SearchableSelect
																				value={
																					item.coaMapping
																						?.accountId
																				}
																				options={
																					chartOfAccountList
																				}
																				labelKey='accountName'
																				valueKey='id'
																				renderLabel={(
																					coa: any,
																					i,
																				) => (
																					<>
																						{
																							coa.accountName
																						}
																					</>
																				)}
																				placeholder='Select'
																				isTouched={
																					isSubmitted
																				}
																				isValid={validator.current.fieldValid(
																					`account-${i}`,
																				)}
																				invalidFeedback={validator.current.message(
																					`account-${i}`,
																					item.coaMapping
																						?.accountId,
																					'required',
																				)}
																				onChange={(
																					e: any,
																				) => {
																					handlePurchaseItemChange(
																						item.id,
																						'coaMapping.accountId',
																						e.target
																							.value,
																					);
																				}}
																			/>
																		</td>

																		{/* 7️⃣ VAT */}
																		<td
																			className='wpx-140'
																			style={
																				isViewOnly
																					? VIEW_ONLY_STYLE
																					: undefined
																			}>
																			<SearchableSelect
																				value={item.vatId}
																				options={vatList}
																				labelKey='rate'
																				isLoading={
																					isVatLoading
																				}
																				valueKey='id'
																				renderLabel={(
																					vat,
																				) =>
																					`${Number(vat.rate).toFixed(1)}% - ${vat.name}`
																				}
																				placeholder='VAT'
																				isTouched={
																					isSubmitted
																				}
																				isValid={validator.current.fieldValid(
																					`vat-${i}`,
																				)}
																				invalidFeedback={validator.current.message(
																					`vat-${i}`,
																					item.vatId,
																					'required',
																				)}
																				id='vatId'
																				name='vatId'
																				onChange={(
																					e: any,
																				) => {
																					handlePurchaseItemChange(
																						item.id,
																						'vatId',
																						e.target
																							.value,
																					);
																				}}
																			/>
																		</td>

																		{/* 🔟 VAT Amount */}
																		{/* <td className='text-end wpx-140' style={isViewOnly ? VIEW_ONLY_STYLE : undefined}>
																		<Input
																			type='number'
																			value={item.vatAmount}
																			readOnly
																			isTouched={isSubmitted}
																			isValid={validator.current.fieldValid(
																				`vatAmount-${i}`,
																			)}
																			invalidFeedback={validator.current.message(
																				`vatAmount-${i}`,
																				item.vatAmount,
																				'required|numeric',
																			)}
																			id='vatAmount'
																			name='vatAmount'
																			onChange={(e: any) => {
																				handlePurchaseItemChange(
																					item.id,
																					'vatAmount',
																					e.target.value,
																				);
																			}}
																		/>
																	</td> */}

																		{/* 8️⃣ Total Amount */}
																		<td
																			className='text-end wpx-140'
																			style={
																				isViewOnly
																					? VIEW_ONLY_STYLE
																					: undefined
																			}>
																			<span className='fw-bold'>
																				{priceFormat(
																					item.totalAmount ||
																						0,
																				)}
																			</span>
																		</td>

																		<td
																			className='text-center wpx-80'
																			style={
																				isViewOnly
																					? VIEW_ONLY_STYLE
																					: undefined
																			}>
																			<Button
																				isLight
																				icon='Delete'
																				color='danger'
																				isDisable={
																					purchaseOrderData
																						?.items
																						?.length <=
																					1
																				}
																				onClick={() =>
																					handleDeletePurchaseOrderItem(
																						item.id,
																					)
																				}
																			/>
																		</td>
																	</tr>
																),
															)}
														</tbody>
													)}
												</table>
											</div>
										</CardBody>
										{isViewOnly && Object.keys(priceVarianceMap).length > 0 && (
											<div className='mt-3 p-3 border rounded'>
												<div className='fw-bold mb-2'>
													Price Changes vs Last Purchase
												</div>
												{purchaseOrderData.items
													.filter((item: any) => priceVarianceMap[item.id])
													.map((item: any) => {
														const v = priceVarianceMap[item.id];
														const product = productMap[item.productId];
														return (
															<div
																key={item.id}
																className='d-flex justify-content-between py-1 border-bottom'>
																<span>
																	{product?.name || item.productId}
																</span>
																<span
																	className={
																		v.isHigher
																			? 'text-danger fw-semibold'
																			: 'text-success fw-semibold'
																	}>
																	{v.isHigher ? '+' : ''}
																	{v.pct}% ({v.isHigher ? '+' : ''}£
																	{Math.abs(v.diff).toFixed(2)})
																</span>
															</div>
														);
													})}
											</div>
										)}

										<CardFooter className='d-flex'>
											<div>
												{(purchaseOrderData?.status ===
													PURCHASE_ORDER_STATUS.CANCELLED ||
													purchaseOrderData?.status ===
														PURCHASE_ORDER_STATUS.PARTIAL) && (
													<div className='mt-2'>
														<div className='fw-bold  mb-1'>
															Comments
														</div>

														<div className='text-muted'>
															{purchaseOrderData?.cancelOrPartialCmt ||
																'—'}
														</div>
													</div>
												)}

												{purchaseOrderData?.mdComment && (
													<div className='mt-2'>
														<div className='fw-bold mb-1'>
															MD Comment
														</div>
														<div className='text-muted'>
															{purchaseOrderData.mdComment}
														</div>
													</div>
												)}
											</div>
											<div className='row'>
												<div className='col-md-12 col-lg-12'>
													<table className='table table-borderless mb-0'>
														<tbody>
															<tr>
																<td className='fw-bold fs-5'>
																	Sub Total
																</td>
																<td className='text-end wpx-150 fw-bold fs-5'>
																	{priceFormat(
																		purchaseOrderData?.subTotal ||
																			0,
																	)}
																</td>
															</tr>

															<tr>
																<td className='fw-bold fs-5'>
																	VAT Total
																</td>
																<td className='text-end wpx-150 fw-bold fs-5'>
																	{priceFormat(
																		purchaseOrderData?.vatTotal ||
																			0,
																	)}
																</td>
															</tr>
															{debitAmount > 0 && (
																<tr>
																	<td className='fw-bold fs-5 text-danger'>
																		Debit Apply
																	</td>
																	<td className='text-end wpx-150 fw-bold fs-5 text-danger'>
																		-{' '}
																		{priceFormat(
																			debitAmount || 0,
																		)}
																	</td>
																</tr>
															)}

															<tr className='border-top'>
																<td className='fw-bold fs-4'>
																	Grand Total
																</td>
																<td className='text-end wpx-150 fw-bold fs-4 '>
																	{priceFormat(
																		(purchaseOrderData?.totalPrice ||
																			0) - (debitAmount || 0),
																	)}
																</td>
															</tr>
														</tbody>
													</table>
												</div>
											</div>
										</CardFooter>
									</Card>
								</div>
							</div>
						</>
					)}
				</ModalBody>

				<ModalFooter>
					<div className='row w-100'>
						<div className='col-12 d-flex justify-content-end gap-2'>
							{/* DRAFT / NEW */}
							{(purchaseOrderData?.status === PURCHASE_ORDER_STATUS.DRAFT ||
								!purchaseOrderData?.status) && (
								<>
									<Button
										color='dark'
										isLight
										isLoading={isLoading}
										onClick={() =>
											handleFormSubmit(PURCHASE_ORDER_STATUS.DRAFT)
										}>
										Save as Draft
									</Button>

									<Button
										color='info'
										isLight
										isLoading={isLoading}
										onClick={() =>
											handleFormSubmit(PURCHASE_ORDER_STATUS.PENDING)
										}>
										submit for Approval
									</Button>
								</>
							)}

							{/* PENDING — Manager reviews */}
							{purchaseOrderData?.status === PURCHASE_ORDER_STATUS.PENDING && (
								<>
									<Button
										color='dark'
										isLight
										isLoading={isLoading}
										onClick={() =>
											handleFormSubmit(PURCHASE_ORDER_STATUS.REJECTED)
										}>
										Reject
									</Button>

									{requiresMDApproval ? (
										<Button
											color='warning'
											isLight
											isLoading={isSendingToMD}
											onClick={handleSendToMD}>
											Send to MD (PO &gt; £2,000)
										</Button>
									) : (
										<Button
											color='success'
											isLight
											isLoading={isLoading}
											onClick={() =>
												handleFormSubmit(PURCHASE_ORDER_STATUS.APPROVED)
											}>
											Approve
										</Button>
									)}
								</>
							)}

							{/* AWAITING MD — waiting for MD to act via email, no buttons shown */}
							{purchaseOrderData?.status === PURCHASE_ORDER_STATUS.AWAITING_MD && (
								<span className='text-warning fw-semibold'>
									Waiting for MD approval via email...
								</span>
							)}

							{/* AWAITING MANAGER FINAL — Manager gives final sign-off */}
							{purchaseOrderData?.status ===
								PURCHASE_ORDER_STATUS.AWAITING_MANAGER_FINAL && (
								<>
									<Button
										color='dark'
										isLight
										isLoading={isLoading}
										onClick={() =>
											handleFormSubmit(PURCHASE_ORDER_STATUS.REJECTED)
										}>
										Reject
									</Button>

									<Button
										color='success'
										isLight
										isLoading={isLoading}
										onClick={() =>
											handleFormSubmit(PURCHASE_ORDER_STATUS.APPROVED)
										}>
										Final Approve
									</Button>
								</>
							)}
							{purchaseOrderData?.status === PURCHASE_ORDER_STATUS.CANCELLED && (
								<Button
									color='info'
									isLight
									isLoading={isLoading}
									onClick={() =>
										handleFormSubmit(PURCHASE_ORDER_STATUS.DRAFT)
									}>
									Restore to Draft
								</Button>
							)}

							{([
								PURCHASE_ORDER_STATUS.APPROVED,
								PURCHASE_ORDER_STATUS.PARTIAL,
								PURCHASE_ORDER_STATUS.COMPLETED,
							] as number[]).includes(+purchaseOrderData?.status) && (
								<Button
									color='info'
									isLight
									icon='Send'
									isLoading={isSendingToSupplier}
									onClick={handleSendToSupplier}>
									Send to Supplier
								</Button>
							)}

							{(purchaseOrderData?.status === PURCHASE_ORDER_STATUS.APPROVED ||
								purchaseOrderData?.status === PURCHASE_ORDER_STATUS.PARTIAL) && (
								<>
									{purchaseOrderData?.status !==
										PURCHASE_ORDER_STATUS.PARTIAL && (
										<Button
											color='dark'
											isLight
											isLoading={isLoading}
											onClick={() =>
												handleOpenComments(PURCHASE_ORDER_STATUS.CANCELLED)
											}>
											Cancel PO
										</Button>
									)}

									<Button
										color='warning'
										isLight
										isLoading={isLoading}
										onClick={() =>
											handleOpenComments(PURCHASE_ORDER_STATUS.PARTIAL)
										}>
										Partially update
									</Button>

									<Button
										color='success'
										isLight
										isLoading={isLoading}
										onClick={() =>
											handleFormSubmit(PURCHASE_ORDER_STATUS.COMPLETED)
										}>
										Completed
									</Button>
								</>
							)}

							<Button color='danger' isLight onClick={toggle}>
								close
							</Button>
						</div>
					</div>
				</ModalFooter>
			</Modal>

			<GrnModal
				isOpen={isGrnModalOpen}
				toggle={() => setIsGrnModalOpen(!isGrnModalOpen)}
				itemId={selectedItemId}
				purchaseOrder={purchaseOrderData}
				setPurchaseOrder={setPurchaseOrderData}
				productList={productList}
				isViewOnly={isViewGrn}
			/>

			<PurchaseOrderComments
				isOpen={isOpenComment}
				toggle={() => setIsOpenComment(!isOpenComment)}
				purchaseOrder={purchaseOrderData}
				submitForm={handleFormSubmit}
				statusComment={statusComment}
				setPurchaseOrder={setPurchaseOrderData}
			/>
		</>
	);
};

export default PurchaseOrderForm;
