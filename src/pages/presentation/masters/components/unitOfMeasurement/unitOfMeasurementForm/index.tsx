import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
	Button,
	FormGroup,
	Input,
	OffCanvas,
	OffCanvasBody,
	OffCanvasHeader,
	OffCanvasTitle,
} from '../../../../../../components/bootstrap';
import SimpleReactValidator from 'simple-react-validator';

interface UnitOfMeasurementFormProps {
	isOpen: boolean;
	toggle: () => void;
	unitOfMeasurement: any;
	handleChange: (e: any) => void;
	onSubmit: () => void;
	isEdit: boolean;
	unitOfMeasurementList: any[];
}

const UnitOfMeasurementForm: React.FC<UnitOfMeasurementFormProps> = ({
	isOpen,
	toggle,
	unitOfMeasurement,
	handleChange,
	onSubmit,
	isEdit,
	unitOfMeasurementList,
}) => {
	const [isLoading, setIsLoading] = useState(false);
	const validator = useRef(new SimpleReactValidator());
	const [isSubmited, setIsSubmited] = useState(false);

	useEffect(() => {
		if (isOpen) {
			setIsSubmited(false);
		}
	}, [isOpen]);

	// 🔹 Submit Handler
	const handleSubmit = async () => {
		setIsSubmited(true);

		if (!validator.current.allValid()) {
			validator.current.showMessages();
			return;
		}

		try {
			setIsLoading(true);
			await onSubmit();
			toggle();
		} finally {
			setIsLoading(false);
			setIsSubmited(false);
		}
	};

	// 🔹 Duplicate Name Check
	const isUnitNameExist = useMemo(() => {
		if (!unitOfMeasurement?.name || !unitOfMeasurementList?.length) return '';

		const alreadyExists = unitOfMeasurementList.some(
			(u: any) =>
				u.name?.toLowerCase().trim() === unitOfMeasurement.name.toLowerCase().trim() &&
				u.id !== unitOfMeasurement.id, // Skip same record during edit
		);

		return alreadyExists ? `${unitOfMeasurement.name} already exists` : '';
	}, [unitOfMeasurementList, unitOfMeasurement?.name, unitOfMeasurement?.id]);

	return (
		<OffCanvas
			id='unitOfMeasurementForm'
			titleId='unitOfMeasurementFormLabel'
			placement='end'
			isOpen={isOpen}
			isBackdrop={false}
			setOpen={toggle}>
			<OffCanvasHeader setOpen={toggle}>
				<OffCanvasTitle id='unitOfMeasurementFormLabel'>
					{isEdit ? 'Edit Unit Of Measurement' : 'Create Unit Of Measurement'}
				</OffCanvasTitle>
			</OffCanvasHeader>

			<OffCanvasBody>
				<div className='row g-3'>
					{/* Unit Name */}
					<div className='col-12'>
						<FormGroup id='name' label='Unit Name' isFloating>
							<Input
								value={unitOfMeasurement?.name || ''}
								onChange={handleChange}
								disabled={isLoading}
								isValid={
									validator.current.fieldValid('Unit Name') && !isUnitNameExist
								}
								isTouched={isSubmited || !!isUnitNameExist}
								invalidFeedback={
									validator.current.message(
										'Unit Name',
										unitOfMeasurement?.name,
										'required',
									) || isUnitNameExist
								}
							/>
						</FormGroup>
					</div>
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

export default UnitOfMeasurementForm;
