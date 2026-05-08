import React, { useEffect, useMemo, useRef, useState } from 'react';
import SimpleReactValidator from 'simple-react-validator';

import {
	Button,
	FormGroup,
	Input,
	OffCanvas,
	OffCanvasBody,
	OffCanvasHeader,
	OffCanvasTitle,
} from '../../../../../../components/bootstrap';

import { DateTimePicker, SearchableSelect } from '../../../../../../components/common';

import { IDiscountModel } from '../../../../../../common/interface/discount';

import {
	DISCOUNT_TYPE_LIST,
	DISCOUNT_STATUS_LIST,
	DISCOUNT_APPLICABLE_TYPE_LIST,
} from '../../../../../../common/data/option';
import { DISCOUNT_APPLICABLE_TYPE, DISCOUNT_TYPE } from '../../../../../../common/constant';

interface DiscountFormProps {
	isOpen: boolean;
	toggle: () => void;
	discountData: IDiscountModel;
	handleChange: (e: any) => void;
	onSubmit: () => void;
	isEdit: boolean;
}

const DiscountForm: React.FC<DiscountFormProps> = ({
	isOpen,
	toggle,
	discountData,
	handleChange,
	onSubmit,
	isEdit,
}) => {
	const [isLoading, setIsLoading] = useState(false);
	const validator = useRef(new SimpleReactValidator());
	const [isSubmitted, setIsSubmitted] = useState(false);
	const [discountValueError, setDiscountValueError] = useState('');

	useEffect(() => {
		if (isOpen) {
			setIsSubmitted(false);
			validator.current.hideMessages();
		}
	}, [isOpen]);

	const handleSubmit = async () => {
		setIsSubmitted(true);

		const isDiscountValueValid = validateDiscountValue();

		if (!validator.current.allValid() || !isDiscountValueValid) {
			validator.current.showMessages();
			return;
		}


		try {
			setIsLoading(true);
			await onSubmit();
			toggle();
		} finally {
			setIsLoading(false);
			setIsSubmitted(false);
		}
	};

	const isPercentage = discountData?.discountType === DISCOUNT_TYPE.PERCENTAGE;

	const fieldKey = isPercentage ? 'discountValue' : 'discountAmount';

	const fieldValue = isPercentage ? discountData?.discountValue : discountData?.discountAmount;
	useEffect(() => {
		if (isPercentage) {
			handleChange({
				target: { id: 'discountAmount', value: 0 },
			});
		} else {
			handleChange({
				target: { id: 'discountValue', value: 0 },
			});
		}
	}, [discountData?.discountType]);

	const validateDiscountValue = () => {
		const value = fieldValue;

		if (!value || value <= 0) {
			setDiscountValueError('Discount value must be greater than 0');
			return false;
		}

		if (isPercentage && value > 100) {
			setDiscountValueError('Percentage cannot exceed 100');
			return false;
		}

		setDiscountValueError('');
		return true;
	};

	return (
		<OffCanvas
			id='discountCanvas'
			titleId='discountCanvasLabel'
			placement='end'
			isOpen={isOpen}
			isBackdrop={false}
			setOpen={toggle}>
			<OffCanvasHeader setOpen={toggle}>
				<OffCanvasTitle id='discountCanvasLabel'>
					{isEdit ? 'Edit Discount' : 'Create Discount'}
				</OffCanvasTitle>
			</OffCanvasHeader>

			<OffCanvasBody>
				<div className='row g-3'>
					{/* Name */}
					<div className='col-12'>
						<FormGroup id='name' label='Discount Name' isFloating>
							<Input
								value={discountData?.name}
								onChange={handleChange}
								disabled={isLoading}
								isValid={validator.current.fieldValid('Discount Name')}
								isTouched={isSubmitted}
								invalidFeedback={validator.current.message(
									'Discount Name',
									discountData?.name,
									'required',
								)}
							/>
						</FormGroup>
					</div>

					{/* Discount Type */}
					<div className='col-12'>
						<FormGroup id='discountType' label='Discount Type' isFloating>
							<SearchableSelect
								id='discountType'
								value={discountData?.discountType}
								onChange={handleChange}
								options={DISCOUNT_TYPE_LIST}
								labelKey='label'
								valueKey='value'
								isValid={validator.current.fieldValid('Discount Type')}
								isTouched={isSubmitted}
								invalidFeedback={validator.current.message(
									'Discount Type',
									discountData?.discountType,
									'required',
								)}
							/>
						</FormGroup>
					</div>

					{/* Discount Value / Amount */}
					<div className='col-12'>
						<FormGroup
							id={fieldKey}
							label={isPercentage ? 'Discount (%)' : 'Discount Amount'}
							isFloating>
							<Input
								type='number'
								value={fieldValue || ''}
								max={isPercentage ? 100 : undefined}
								onChange={(e: any) => {
									const value = +e.target.value;

									setDiscountValueError('');

									handleChange({
										target: {
											id: fieldKey,
											value,
										},
									});
								}}
								isValid={!discountValueError}
								isTouched={isSubmitted}
								invalidFeedback={discountValueError}
							/>
						</FormGroup>
					</div>

					{/* Start Date */}
					<div className='col-12'>
						<FormGroup id='startDate'>
							<DateTimePicker
								isFloating
								label='Start Date'
								value={discountData?.startDate}
								onChange={handleChange}
								isValid={validator.current.fieldValid('Start Date')}
								isTouched={isSubmitted}
								invalidFeedback={validator.current.message(
									'Start Date',
									discountData?.startDate,
									'required',
								)}
							/>
						</FormGroup>
					</div>

					{/* End Date */}
					<div className='col-12'>
						<FormGroup id='endDate'>
							<DateTimePicker
								isFloating
								label='End Date'
								value={discountData?.endDate}
								onChange={handleChange}
								isValid={validator.current.fieldValid('End Date')}
								isTouched={isSubmitted}
								invalidFeedback={validator.current.message(
									'End Date',
									discountData?.endDate,
									'required',
								)}
							/>
						</FormGroup>
					</div>

					{/* Usage Limit */}
					<div className='col-12'>
						<FormGroup id='usageLimit' label='Usage Limit' isFloating>
							<Input
								type='number'
								value={discountData?.usageLimit}
								onChange={handleChange}
								isValid={validator.current.fieldValid('Usage Limit')}
								isTouched={isSubmitted}
								invalidFeedback={validator.current.message(
									'Usage Limit',
									discountData?.usageLimit,
									'required|numeric|min:1',
								)}
							/>
						</FormGroup>
					</div>

					{/* Status */}
					<div className='col-12'>
						<FormGroup id='applicableType' label='Applicable Type' isFloating>
							<SearchableSelect
								id='applicableType'
								value={discountData?.applicableType}
								onChange={handleChange}
								options={DISCOUNT_APPLICABLE_TYPE_LIST}
								labelKey='label'
								valueKey='value'
								isValid={validator.current.fieldValid('Applicable Type')}
								isTouched={isSubmitted}
								invalidFeedback={validator.current.message(
									'Applicable Type',
									discountData?.applicableType,
									'required',
								)}
							/>
						</FormGroup>
					</div>

					{/* Status */}
					{/* <div className="col-12">
						<FormGroup id="status" label="Status" isFloating>
							<SearchableSelect
								id="status"
								value={discountData?.status}
								onChange={handleChange}
								options={DISCOUNT_STATUS_LIST}
								labelKey="label"
								valueKey="value"
							/>
						</FormGroup>
					</div> */}
				</div>
			</OffCanvasBody>

			{/* Footer */}
			<div className='row m-0'>
				<div className='col-12 p-3 pb-0'>
					<Button
						color='info'
						className='w-100'
						onClick={handleSubmit}
						isLoading={isLoading}>
						{isEdit ? 'Update' : 'Save'}
					</Button>
				</div>

				<div className='col-12 p-3'>
					<Button
						isOutline
						color='danger'
						className='w-100'
						onClick={toggle}
						isDisable={isLoading}>
						Close
					</Button>
				</div>
			</div>
		</OffCanvas>
	);
};

export default DiscountForm;
