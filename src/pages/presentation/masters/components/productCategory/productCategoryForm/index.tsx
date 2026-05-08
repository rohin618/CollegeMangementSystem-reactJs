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

interface VendorFormProps {
	isOpen: boolean;
	toggle: () => void;
	productCategory: any;
	handleChange: (e: any) => void;
	onSubmit: () => void;
	isEdit: boolean;
	productCategoryList: any[];
}
const ProductCategoryForm: React.FC<VendorFormProps> = ({
	isOpen,
	toggle,
	productCategory,
	handleChange,
	onSubmit,
	isEdit,
	productCategoryList,
}) => {
	const [isLoading, setIsLoading] = useState(false);
	const validator = useRef(new SimpleReactValidator());
	const [isSubmited, setIsSubmited] = useState(false);

	useEffect(() => {
		if (isOpen) {
			setIsSubmited(false);
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

	const isCategoryNameExist = useMemo(() => {
		// Skip if no input or list empty
		if (!productCategory?.name || !productCategoryList?.length) return '';

		const alreadyExists = productCategoryList.some(
			(c: any) =>
				c.name?.toLowerCase().trim() === productCategory.name.toLowerCase().trim() &&
				c.id !== productCategory.id, // ✅ skip same record while editing
		);

		return alreadyExists ? `${productCategory.name} already exists` : '';
	}, [productCategoryList, productCategory?.name, productCategory?.id]);

	return (
		<OffCanvas
			id='productCategoryForm'
			titleId='productCategoryFormLabel'
			placement='end'
			isOpen={isOpen}
			isBackdrop={false}
			setOpen={toggle}>
			<OffCanvasHeader setOpen={toggle}>
				<OffCanvasTitle id='productCategoryFormLabel'>
					{isEdit ? 'Edit Product Category' : 'Create Product Category'}
				</OffCanvasTitle>
			</OffCanvasHeader>

			<OffCanvasBody>
				<div className='row g-3'>
					<div className='col-12'>
						<FormGroup id='name' label='Category Name' isFloating>
							<Input
								value={productCategory?.name || ''}
								onChange={handleChange}
								disabled={isLoading}
								isValid={
									validator.current.fieldValid('Category Name') &&
									!isCategoryNameExist
								}
								isTouched={isSubmited || !!isCategoryNameExist}
								invalidFeedback={
									validator.current.message(
										'Category Name',
										productCategory?.name,
										'required',
									) || isCategoryNameExist
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
						isDisable={!!isCategoryNameExist}
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

export default ProductCategoryForm;
