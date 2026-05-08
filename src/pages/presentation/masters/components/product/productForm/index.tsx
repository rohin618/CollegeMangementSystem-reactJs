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
	Textarea,
} from '../../../../../../components/bootstrap';
import { SearchableSelect } from '../../../../../../components/common';
import { PRODUCT_STATUS } from '../../../../../../common/constant';
import { PRODUCT_STATUS_LIST } from '../../../../../../common/data/option';
import { useMasterData } from '../../../../../../contexts/mastersContext';

interface ProductFormProps {
	isOpen: boolean;
	toggle: () => void;
	productData: any;
	handleChange: (e: any) => void;
	onSubmit: () => void;
	isEdit: boolean;
	productCategoryList: any[];
	productList: any[];
	unitOfMeasurementList: any[];
	vendorList: any[];
}

const ProductForm: React.FC<ProductFormProps> = ({
	isOpen,
	toggle,
	productData,
	handleChange,
	onSubmit,
	isEdit,
	productCategoryList,
	productList,
	unitOfMeasurementList,
	vendorList,
}) => {
	const [isLoading, setIsLoading] = useState(false);
	const validator = useRef(new SimpleReactValidator());
	const [isSubmited, setIsSubmited] = useState(false);

	const { vatList, isLoading: isVatLoading, isError: isVatError } = useMasterData();

	useEffect(() => {
		if (isOpen) {
			setIsSubmited(false);
			validator.current.hideMessages();
		}
	}, [isOpen]);

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

	const isProductCodeExist = useMemo(() => {
		// Skip if no input or list empty
		if (!productData?.productCode || !productList?.length) return '';

		const alreadyExists = productList.some(
			(p: any) =>
				p.productCode?.toLowerCase().trim() ===
					productData.productCode.toLowerCase().trim() && p.id !== productData.id, // ✅ skip same record while editing
		);

		return alreadyExists ? `${productData.productCode} already exists` : '';
	}, [productList, productData?.productCode, productData?.id]);

	return (
		<OffCanvas
			id='productCanvas'
			titleId='productCanvasLabel'
			placement='end'
			isOpen={isOpen}
			isBackdrop={false}
			setOpen={toggle}>
			<OffCanvasHeader setOpen={toggle}>
				<OffCanvasTitle id='productCanvasLabel'>
					{isEdit ? 'Edit Product' : 'Create Product'}
				</OffCanvasTitle>
			</OffCanvasHeader>

			<OffCanvasBody>
				<div className='row g-3'>
					{/* Product Name */}
					<div className='col-12'>
						<FormGroup id='name' label='Product Name' isFloating>
							<Input
								value={productData?.name}
								onChange={handleChange}
								disabled={isLoading}
								isValid={validator.current.fieldValid('Product Name')}
								isTouched={isSubmited}
								invalidFeedback={validator.current.message(
									'Product Name',
									productData?.name,
									'required',
								)}
							/>
						</FormGroup>
					</div>

					{/* Product Category */}
					<div className='col-12'>
						<FormGroup id='categoryId' label='Product Category' isFloating>
							<SearchableSelect
								id='categoryId'
								value={productData?.categoryId}
								onChange={handleChange}
								options={productCategoryList}
								isValid={validator.current.fieldValid('Product Category')}
								isTouched={isSubmited}
								invalidFeedback={validator.current.message(
									'Product Category',
									productData?.categoryId,
									'required',
								)}
								labelKey='name'
								valueKey='id'
								renderLabel={(pro) => `${pro.name}`}
							/>
						</FormGroup>
					</div>
					{/* unitOfMeasurement  */}
					<div className='col-12'>
						<FormGroup id='unitOfMeasurementId' label='Unit Of Measurement' isFloating>
							<SearchableSelect
								id='unitOfMeasurementId'
								value={productData?.unitOfMeasurementId}
								onChange={handleChange}
								options={unitOfMeasurementList}
								isValid={validator.current.fieldValid('Unit Of Measurement')}
								isTouched={isSubmited}
								invalidFeedback={validator.current.message(
									'Unit Of Measurement',
									productData?.unitOfMeasurementId,
									'required',
								)}
								labelKey='name'
								valueKey='id'
								renderLabel={(unit) => `${unit.name}`}
							/>
						</FormGroup>
					</div>
					<div className='col-12'>
						<FormGroup id='vatId' label='VAT' isFloating>
							<SearchableSelect
								value={productData?.vatId}
								options={vatList}
								labelKey='rate'
								isLoading={isVatLoading}
								valueKey='id'
								renderLabel={(vat) =>
									`${Number(vat.rate).toFixed(1)}% - ${vat.name}`
								}
								placeholder='VAT'
								isTouched={isSubmited}
								isValid={validator.current.fieldValid(`vat`)}
								invalidFeedback={validator.current.message(
									`vat`,
									productData?.vatId,
									'required',
								)}
								id='vatId'
								name='vatId'
								onChange={handleChange}
							/>
						</FormGroup>
					</div>
					<div className='col-12'>
						<FormGroup id='vendorId' label='Vendor' isFloating>
							<SearchableSelect
								id='vendorId'
								value={productData?.vendorId}
								onChange={handleChange}
								options={vendorList}
								isValid={validator.current.fieldValid('Vendor')}
								isTouched={isSubmited}
								invalidFeedback={validator.current.message(
									'Vendor',
									productData?.vendorId,
									'required',
								)}
								labelKey='name'
								valueKey='id'
								renderLabel={(vendor) => `${vendor.name}`}
							/>
						</FormGroup>
					</div>

					{/* Product productCode */}
					<div className='col-12'>
						<FormGroup id='productCode' label='Product Code' isFloating>
							<Input
								value={productData?.productCode || ''}
								onChange={handleChange}
								disabled={isLoading}
								isValid={
									validator.current.fieldValid('Product Code') &&
									!isProductCodeExist
								}
								isTouched={isSubmited || !!isProductCodeExist}
								invalidFeedback={
									validator.current.message(
										'Product Code',
										productData?.productCode,
										'required',
									) || isProductCodeExist
								}
							/>
						</FormGroup>
					</div>

					{/* Product Description */}
					<div className='col-12'>
						<FormGroup id='description' label='Product Description' isFloating>
							<Textarea
								rows={3}
								value={productData?.description}
								onChange={handleChange}
								isValid={validator.current.fieldValid('Product Description')}
								isTouched={isSubmited}
								invalidFeedback={validator.current.message(
									'Product Description',
									productData?.description,
									'required',
								)}
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
						isDisable={!!isProductCodeExist}
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

export default ProductForm;
