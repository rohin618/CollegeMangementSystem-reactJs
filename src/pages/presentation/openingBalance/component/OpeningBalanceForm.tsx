import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, FormGroup, Input, Option, Select } from '../../../../components/bootstrap';

import OffCanvas, {
	OffCanvasBody,
	OffCanvasHeader,
	OffCanvasTitle,
} from '../../../../components/bootstrap/OffCanvas';

import SimpleReactValidator from 'simple-react-validator';

import { INVOICE_TO_TYPE } from '../../../../common/constant';
import {
	CHART_OF_ACCOUNTS_CATEGORY_TYPE_LIST,
	OPENING_BALANCE_TYPE_LIST,
	PAYMENT_METHOD_LIST,
} from '../../../../common/data/option';

import {
	generateUid,
	getResidentInvoiceAddress,
	getResidetByAllAvilableFundList,
} from '../../../../helpers/helpers';

import { openingBalanceModel } from '../../../../common/model/openingBalance';

import {
	CHART_OF_ACCOUNTS_CATEGORY_TYPE,
	CREDIT_STATUS,
	CREDIT_TYPE,
	DATA_MIGRATION_TO_DATE,
	INVOICE_CATEGORY,
	INVOICE_STATUS,
	INVOICE_TYPE,
	OPENING_BALANCE_TO_TYPE,
	OPENING_BALANCE_TYPE,
} from '../../../../common/constant/app';
import { IOpeningBalanceModel } from '../../../../common/interface/openingBalance';

import { ResidentProfileCard, SearchableSelect } from '../../../../components/common';
import { getColorNameWithIndex } from '../../../../common/data/enumColors';
import { ICreditWalletModel, IInvoiceModel } from '../../../../common/interface';
import { createCreditWallet, updateCreditWallet } from '../../../../common/api/creditWalet';
import { createInvoice, updateInvoice } from '../../../../common/api/invoice';
import moment from 'moment';
import { creditWaletModel } from '../../../../common/model/creditWalet';
import { invoiceModel } from '../../../../common/model/invoice';

type Props = {
	isOpen: boolean;
	toggle: () => void;
	onSave: (data: IOpeningBalanceModel) => void;
	editData?: IOpeningBalanceModel;
	residents: any[];
	residentListWithInvoice: any[];
	localAuthorityList: any[];
	localICBList: any[];
	chartAccounts: any[];
	isResidentListLoading?: boolean;
	isSaving?: boolean;
	fNCDetails: any;
	dueDateList: any[];
	bankList: any[];
};
const OpeningBalanceForm: React.FC<Props> = ({
	isOpen,
	toggle,
	onSave,
	editData,
	residents = [],
	residentListWithInvoice = [],
	localAuthorityList = [],
	fNCDetails = {},
	localICBList = [],
	chartAccounts = [],
	isResidentListLoading = false,
	isSaving = false,
	dueDateList = [],
	bankList = [],
}) => {
	const [formData, setFormData] = useState({ ...openingBalanceModel });
	const [, forceUpdate] = useState(0);
	const [isSubmitted, setIsSubmitted] = useState(false);
	const validator = useRef(
		new SimpleReactValidator({
			className: 'text-danger',
			autoForceUpdate: { forceUpdate: () => forceUpdate((p) => p + 1) },
		}),
	);

	/** LOAD EDIT DATA */
	useEffect(() => {
		if (editData) {
			setFormData({ ...editData });
		} else {
			setFormData({ ...openingBalanceModel });
			setIsSubmitted(false);
			validator.current.hideMessages();
		}
	}, [editData, isOpen]);

	const handleChange = (e: any) => {
		const { name, value } = e.target;

		setFormData((prev) => {
			let updated: any = { ...prev };

			if (name === 'coaAccountId') {
				updated.coaMapping = { ...prev.coaMapping, accountId: value };
			} else if (name === 'coaType') {
				updated.coaMapping = { ...prev.coaMapping, type: value };
				//  When switching to DEBIT → clear CREDIT fields
				if (+value === OPENING_BALANCE_TYPE.DEBIT) {
					updated.paymentMethod = '';
					updated.refNo = '';
					updated.bankId = '';

					//  Clear validator messages
					validator.current.hideMessages();
					validator.current.purgeFields();
				}
			} else if (name === 'coaCategory') {
				updated.coaMapping = { ...prev.coaMapping, category: value };
			} else {
				updated[name] = value;
			}

			if (name === 'residentId') {
				updated.openingBalanceTo = '';
				updated.fundTypeId = '';
			}

			if (name === 'openingBalanceTo') {
				updated.fundTypeId = '';
			}

			return updated;
		});
	};

	/** CREDIT TO LIST */
	const creditToList: any = useMemo(() => {
		if (!formData.residentId) return [];
		const res = residentListWithInvoice.find((r) => r.id === formData.residentId);
		return getResidetByAllAvilableFundList(res) ?? [];
	}, [formData.residentId, residentListWithInvoice]);

	/** FUND LIST */
	const fundList = useMemo(() => {
		const openingTo: number = Number(formData.openingBalanceTo);
		if (!openingTo) return [];

		const record: any = creditToList.find((ct: any) => {
			const v = ct.value;
			if (Array.isArray(v)) return v.includes(openingTo);
			if (typeof v === 'string') return v.split(',').map(Number).includes(openingTo);
			return v === openingTo;
		});

		const ids = record?.fundTypeIds ?? [];
		if (!ids.length) return [];

		const source =
			openingTo === INVOICE_TO_TYPE.CHC
				? localICBList
				: [+INVOICE_TO_TYPE.LA, +INVOICE_TO_TYPE.THIRD_PARTY_TOPUP].includes(openingTo)
					? localAuthorityList
					: [];

		return ids.map((id: any) => source.find((x) => x.id === id)).filter(Boolean);
	}, [formData.openingBalanceTo, creditToList]);

	/** SUBMIT (unchanged logic) */
	// const handleSubmit = async () => {
	//     setIsSubmitted(true);

	//     if (!validator.current.allValid()) {
	//         validator.current.showMessages();
	//         forceUpdate(p => p + 1);
	//         return;
	//     }

	//     // your full submit logic remains untouched…

	//     onSave(formData);
	// };
	const handleSubmit = async () => {
		setIsSubmitted(true);
		debugger

		console.log('----',validator.current)

		if (!validator.current.allValid()) {
			validator.current.showMessages();
			forceUpdate((p) => p + 1);
			return;
		}
		const residentData = residentListWithInvoice?.find(
			(res) => res.id === formData?.residentId,
		);
		// Base payload for Opening Balance (used in both cases)
		const basePayload: any = {
			...formData,
			roomId: residentData?.roomId || '',
			bedId: residentData?.bedId || '',
			residentId: formData?.residentId || '',
			fundTypeId: formData.fundTypeId,
			totalPrice: Number(formData.totalPrice),
			openingBalanceDate: moment().format('YYYY-MM-DD'),
		};

		delete basePayload.invoiceDetails;
		delete basePayload.creditWalletDetails;

		// CASE 1: CREATE INVOICE (AR)
		if (
			+formData.coaMapping.category === CHART_OF_ACCOUNTS_CATEGORY_TYPE.ACCOUNTS_RECEIVABLE &&
			+formData.coaMapping.type === OPENING_BALANCE_TYPE.DEBIT
		) {
			const invoiceReq = buildInvoiceObject(); // ⬅️ FIXED TYP0

			const invoiceAddress: any = getResidentInvoiceAddress(
				residentData,
				+formData.openingBalanceTo,
				formData.fundTypeId,
				{
					localAuthorityList,
					localICBList,
					fNCDetails,
				},
			);

			const formDataReference: any = { ...formData };
			const existInvoiceData = formDataReference?.invoiceDetails || {};
			// Create invoice
			const createdInvoice: any = formData.invoiceId
				? await updateInvoice(formData.invoiceId, { ...invoiceReq })
				: await createInvoice({ ...invoiceReq }, invoiceAddress?.shortName);

			if (createdInvoice) {
				const payload: IOpeningBalanceModel = {
					...basePayload,
					invoiceId: createdInvoice?.id || '',
				};

				onSave(payload);
			}
			// Attach invoice ID to opening balance payload

			return;
		} else if (
			+formData.coaMapping.category === CHART_OF_ACCOUNTS_CATEGORY_TYPE.ACCOUNTS_RECEIVABLE &&
			+formData.coaMapping.type === OPENING_BALANCE_TYPE.CREDIT
		) {
			const creditWalletRequest: ICreditWalletModel = buildCreditWalletObject();
			const invoiceAddress: any = getResidentInvoiceAddress(
				residentData,
				+formData.openingBalanceTo,
				formData.fundTypeId,
				{
					localAuthorityList,
					localICBList,
					fNCDetails,
				},
			);

			const formDataReference: any = { ...formData };
			const existCreditWallet = formDataReference?.creditWalletDetails || {};

			const walletRes: any = formData.creditWalletId
				? await updateCreditWallet(formData.creditWalletId, { ...creditWalletRequest })
				: await createCreditWallet({ ...creditWalletRequest }, invoiceAddress?.shortName);

			if (walletRes) {
				const payload: IOpeningBalanceModel = {
					...basePayload,
					creditWalletId: walletRes?.id || '',
				};

				onSave(payload);
			}
			// Attach invoice ID to opening balance payload
			return;
		}

		// CASE 2: NO INVOICE (NON-AR CATEGORY)
		onSave(basePayload);
	};

	const buildCreditWalletObject = () => {
		const formDataReference: any = { ...formData };
		const existCreditWallet = formDataReference?.creditWalletDetails || {};
		return {
			...creditWaletModel,
			status: CREDIT_STATUS.ACTIVE, // ✅ maybe change to BANK_STATUS instead?
			...existCreditWallet,
			paymentMethod: +formData?.paymentMethod || 0,
			refNo: formData?.refNo || '',
			bankId: formData?.bankId || '',
			residentId: formData?.residentId || '',
			fundTypeId: formData?.fundTypeId,
			creditTo: +formData?.openingBalanceTo,
			subTotal: +formData?.totalPrice || 0,
			creditAmount: +formData?.totalPrice || 0,
			type: CREDIT_TYPE.OPENING_BALANCE_CREDIT,
			date: DATA_MIGRATION_TO_DATE.format('YYYY-MM-DD'),
		} as ICreditWalletModel;
	};

	const buildInvoiceObject = () => {
		const residentData = residentListWithInvoice?.find(
			(res) => res.id === formData?.residentId,
		);
		const formDataReference: any = { ...formData };
		const existInvoiceData = formDataReference?.invoiceDetails || {};

		const total = Number(formData.totalPrice) || 0;
		const openingTo:any = Number(formData.openingBalanceTo);

		const invoiceReq: IInvoiceModel = {
			...invoiceModel,
			...(existInvoiceData || {}),

			status: INVOICE_STATUS.PENDING,
			invoiceDate: DATA_MIGRATION_TO_DATE.format('YYYY-MM-DD'),

			roomId: residentData?.roomId || '',
			bedId: residentData?.bedId || '',
			residentId: formData?.residentId || '',

			invoiceTo: openingTo,

			fundTypeId:
				[OPENING_BALANCE_TO_TYPE.INCONT, OPENING_BALANCE_TO_TYPE.FNC].includes(openingTo)
					? fNCDetails?.id || ''
					: formData.fundTypeId || '',

			type: INVOICE_TYPE.OPENING_BALANCE,

			sDate: '',
			eDate: '',

			dueDay: formData.dueDay,

			items: [
				{
					id: generateUid(),
					category: INVOICE_CATEGORY.OPENING_BALANCE,
					description: 'Opening Balance Adjustment',
					qty: 1,
					weekPrice: total,
					amount: total,
					vatId: '',
					vatRate: 0,
					period: { from: '', to: '' },
				},
			],

			isArrearsSettled: false,
			isCreditWalletSettled: false,

			payedInfo: [],
			creditApply: [],
			arrearsApply: [],

			subTotal: total,
			vatTotal: 0,
			totalPrice: total,
			balanceDue: total,
		};
		return invoiceReq;
	};

	const handleChangeResident = (data: any) => {
		setFormData((prev: any) => ({
			...prev,
			updated: '',
			fundTypeId: '',
			residentId: data?.value ?? '',
		}));
	};

	const residentValue = useMemo(
		() => residents.find((opt) => opt.value === formData.residentId) || null,
		[residents, formData.residentId],
	);

	return (
		<OffCanvas
			id='openBalanceCanvas'
			titleId='openBalanceCanvasTitle'
			placement='end'
			isOpen={isOpen}
			isBackdrop={false}
			setOpen={toggle}>
			<OffCanvasHeader setOpen={toggle}>
				<OffCanvasTitle id='openBalanceCanvasTitle'>
					{editData ? 'Edit Opening Balance' : 'Add Opening Balance'}
				</OffCanvasTitle>
			</OffCanvasHeader>

			<OffCanvasBody>
				{/* --- entire form body stays EXACTLY SAME --- */}
				<div className='d-flex flex-column gap-3'>
					{/* CATEGORY */}
					<FormGroup id='categoryType' label='Category *'>
						<SearchableSelect
							name='coaCategory'
							value={formData.coaMapping.category}
							disabled
							isValid={validator.current.fieldValid('Category')}
							isTouched={isSubmitted}
							invalidFeedback={validator.current.message(
								'Category',
								formData.coaMapping.category,
								'required',
							)}
							options={CHART_OF_ACCOUNTS_CATEGORY_TYPE_LIST}
							placeholder='Select Category'
						/>
					</FormGroup>

					{/* RESIDENT */}

					<FormGroup id='residentId' label='Resident *'>
						<SearchableSelect
							isValid={validator.current.fieldValid('Select resident')}
							isTouched={isSubmitted}
							invalidFeedback={validator.current.message(
								'Select resident',
								formData.residentId,
								'required',
							)}
							name='residentId'
							id='residentId'
							value={formData.residentId}
							onChange={handleChange}
							isLoading={isResidentListLoading}
							options={residentListWithInvoice}
							placeholder='SelectResident'
							labelKey='personal.name'
							valueKey='id'
							renderLabel={(r, i) => (
								<ResidentProfileCard
									resident={r}
									colorIndex={getColorNameWithIndex(i)}
									isNavigate={false}
								/>
							)}
						/>
					</FormGroup>

					{/* OPENING BALANCE TO */}
					<FormGroup id='openingBalanceTo' label='Opening Balance To *'>
						<SearchableSelect
							id='openingBalanceTo'
							name='openingBalanceTo'
							value={formData.openingBalanceTo}
							onChange={handleChange}
							disabled={!formData.residentId}
							isValid={validator.current.fieldValid('Opening Balance To')}
							isTouched={isSubmitted}
							invalidFeedback={validator.current.message(
								'Opening Balance To',
								formData.openingBalanceTo,
								'required',
							)}
							options={creditToList}
							valueKey='value'
							labelKey='label'
							placeholder='Select Opening Balance To'
						/>
					</FormGroup>

					{/* FUND TYPE */}
					{(+formData.openingBalanceTo === OPENING_BALANCE_TO_TYPE.CHC ||
						+formData.openingBalanceTo === OPENING_BALANCE_TO_TYPE.LA) && (
							<FormGroup id='fundTypeId' label='Fund Type *'>
								<SearchableSelect
									name='fundTypeId'
									value={formData.fundTypeId}
									onChange={handleChange}
									disabled={!formData.openingBalanceTo}
									isValid={validator.current.fieldValid('Fund Type')}
									isTouched={isSubmitted}
									invalidFeedback={validator.current.message(
										'Fund Type',
										formData.fundTypeId,
										'required',
									)}
									options={fundList}
									labelKey='name'
									valueKey='id'
									placeholder='Select Fund Type'
								/>
							</FormGroup>
						)}

					{/* TYPE */}
					<FormGroup id='coaType' label='Type *'>
						<SearchableSelect
							name='coaType'
							value={formData.coaMapping.type}
							onChange={handleChange}
							isValid={validator.current.fieldValid('Type')}
							isTouched={isSubmitted}
							invalidFeedback={validator.current.message(
								'Type',
								formData.coaMapping.type,
								'required',
							)}
							options={OPENING_BALANCE_TYPE_LIST}
							placeholder='Select Type'
						/>
					</FormGroup>

					{+formData.coaMapping.type === OPENING_BALANCE_TYPE.CREDIT && (
						<>
							<FormGroup id='paymentMethod' label='Payment Method'>
								<SearchableSelect
									placeholder='Select Payment Method'
									value={formData.paymentMethod}
									id='paymentMethod'
									name='paymentMethod'
									onChange={handleChange}
									isValid={validator.current.fieldValid('Payment Method')}
									isTouched={isSubmitted}
									invalidFeedback={validator.current.message(
										'Payment Method',
										formData.paymentMethod,
										'required',
									)}
									options={PAYMENT_METHOD_LIST}
								/>
							</FormGroup>

							<FormGroup id='refNo' label='Reference No.'>
								<Input
									type='text'
									name='refNo'
									value={formData.refNo}
									onChange={handleChange}
								/>
							</FormGroup>

							<FormGroup id='bankId' label='Deposit To'>
								<SearchableSelect
									placeholder='Select Deposit To'
									value={formData.bankId}
									id='bankId'
									name='bankId'
									onChange={handleChange}
									isValid={validator.current.fieldValid('Deposit To')}
									isTouched={isSubmitted}
									invalidFeedback={validator.current.message(
										'Deposit To',
										formData.bankId,
										'required',
									)}
									options={bankList}
									labelKey='bankName'
									valueKey='id'
								/>
							</FormGroup>
						</>
					)}

					{/* ACCOUNT */}
					<FormGroup id='coaAccountId' label='Chart Account *'>
						<SearchableSelect
							name='coaAccountId'
							value={formData.coaMapping.accountId}
							onChange={handleChange}
							isValid={validator.current.fieldValid('Chart Account')}
							isTouched={isSubmitted}
							invalidFeedback={validator.current.message(
								'Chart Account',
								formData.coaMapping.accountId,
								'required',
							)}
							options={chartAccounts}
							labelKey='accountName'
							valueKey='id'
							placeholder='Select Chart Account'
						/>
					</FormGroup>

					{/* AMOUNT */}
					<FormGroup id='totalPrice' label='Amount *'>
						<Input
							type='number'
							name='totalPrice'
							value={formData.totalPrice}
							onChange={handleChange}
							placeholder='0.00'
							isValid={validator.current.fieldValid('Amount')}
							isTouched={isSubmitted}
							invalidFeedback={validator.current.message(
								'Amount',
								formData.totalPrice,
								'required|numeric',
							)}
						/>
					</FormGroup>

					{/* DUE DAY */}
					<FormGroup id='dueDay' label='Due Day*'>
						<SearchableSelect
							name='dueDay'
							value={formData.dueDay}
							onChange={handleChange}
							isValid={validator.current.fieldValid('Due Day')}
							isTouched={isSubmitted}
							invalidFeedback={validator.current.message(
								'Due Day',
								formData.dueDay,
								'required',
							)}
							options={dueDateList}
							labelKey='name'
							valueKey='day'
							placeholder='Select Due Day'
						/>
					</FormGroup>

					{/* NOTES */}
					<FormGroup id='notes' label='Notes'>
						<Input
							type='text'
							name='notes'
							value={formData.notes}
							onChange={handleChange}
						/>
					</FormGroup>
				</div>

				{/* FOOTER BUTTONS (inside body since OffCanvas has no footer) */}
				<div className='d-flex justify-content-end gap-2 mt-4'>
					<Button color='danger' isOutline onClick={toggle} isDisable={isSaving}>
						Cancel
					</Button>
					<Button color='info' onClick={handleSubmit} isLoading={isSaving}>
						{editData ? 'Update' : 'Save'}
					</Button>
				</div>
			</OffCanvasBody>
		</OffCanvas>
	);
};

export default OpeningBalanceForm;
