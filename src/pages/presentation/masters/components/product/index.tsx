import React, { useMemo, useState } from 'react';
import { IProductModal } from '../../../../../common/interface/product';
import { productModal } from '../../../../../common/model/product';
import { useMultiSearch, useRemoveItemQueryListById, useSearch, useUpdateQueryListById } from '../../../../../hooks';
import { useMasterData } from '../../../../../contexts/mastersContext';
import { useQuery } from '@tanstack/react-query';
import { createProduct, getAllProduct, updateProduct } from '../../../../../common/api/product';
import { PRODUCT_STATUS, QUERY_KEY, VENDOR_STATUS } from '../../../../../common/constant';
import { vendorModal } from '../../../../../common/model/vendor';
import { showAlert } from '../../../../../helpers/alerts';
import { IVendorModal } from '../../../../../common/interface/vendor';
import {
	Button,
	Card,
	CardActions,
	CardBody,
	CardHeader,
	CardLabel,
	CardTitle,
	Spinner,
} from '../../../../../components/bootstrap';
import { P } from 'framer-motion/dist/types.d-Cjd591yU';
import ProductList from './productList';
import ProductForm from './productForm';
import { getAllProductCategory } from '../../../../../common/api/prouductCategory';
import { getAllUnitOfMeasurement } from '../../../../../common/api/unitOfMeasurement';
import { getAllVendors } from '../../../../../common/api/vendor';

export const Product: React.FC<{ search?: string }> = ({ search }) => {
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [productFormData, setProductFormData] = useState<IProductModal>({ ...productModal });
	const [isEdit, setIsEdit] = useState(false);
	const [isModalOpen, setIsModalOpen] = useState(false);

	const { data: productCategoryList = [], isLoading: isProductCategoryLoading } = useQuery({
		queryKey: [QUERY_KEY.PRODUCT_CATEGORY],
		queryFn: () => getAllProductCategory(),
		staleTime: 5 * 60 * 1000

	});
	const { data: vendorList = [], isLoading: isVendorLoading } = useQuery({
		queryKey: [QUERY_KEY.VENDOR_LIST],
		queryFn: () => getAllVendors(),
		staleTime: 5 * 60 * 1000,
	});
	const { data: unitOfMeasurementList = [], isLoading: isUnitOfMeasurementList } = useQuery({
		queryKey: [QUERY_KEY.UNIT_OF_MEASUREMENT],
		queryFn: () => getAllUnitOfMeasurement(),
		staleTime: 5 * 60 * 1000

	});

	const updateProductList = useUpdateQueryListById<any>([QUERY_KEY.PRODUCT_LIST]);

	const { removeItemById: removeProductById } = useRemoveItemQueryListById<any>({
		queryKey: [QUERY_KEY.PRODUCT_LIST],
	});


	const { data: productList = [], isLoading: isProductLoading } = useQuery({
		queryKey: [QUERY_KEY.PRODUCT_LIST],
		queryFn: () => getAllProduct(),
		staleTime: 5 * 60 * 1000

	});

	const filteredProductList = useMultiSearch(productList, { productName: search });

	const onChangeProduct = (e: any) => {
		const { id, value, checked, type } = e.target;
		setProductFormData((prev) => ({
			...prev,
			[id]: type === 'checkbox' ? checked : value,
		}));
	};

	const handleToggleModal = () => {
		setIsModalOpen(false);
		setProductFormData({ ...productModal });
	};

	const handleCreateProduct = async (extraPayload = {}) => {
		const payload = {
			...productFormData,
			...extraPayload,
		};

		const response = await createProduct(payload);
		updateProductList(response);
	};
	const handleUpdateProduct = async (id: string | undefined) => {
		if (!id) return;
		const payload = {
			...productFormData,
		};
		const response = await updateProduct(id, payload);
		updateProductList(response);
	};

	const handleEditProduct = (data: IProductModal) => {
		setProductFormData(data);
		setIsEdit(true);
		setIsModalOpen(true);
	};
	const handleCreateFormOpen = () => {
		setIsModalOpen(true);
		setIsEdit(false);
		setProductFormData({ ...productModal });
	};

	const deleteProduct = async (data: IProductModal) => {
		const id = data?.id;

		if (!id) return;
		showAlert({
			title: 'Are you sure?',
			text: "You won't be able to revert this!",
			icon: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Yes, delete it!',
			cancelButtonText: 'Cancel',

			onConfirm: async () => {
				const payload = {
					...productFormData,
					status: PRODUCT_STATUS.DELETE,
				};
				await updateProduct(id, payload);
				removeProductById(id);
			},
		});
	};

	const handleToggleProductStatus = async (data: IProductModal) => {
		const id = data?.id;
		if (!id) return;

		const isActive = +data.status === PRODUCT_STATUS.ACTIVE;
		const actionText = isActive ? 'deactivate' : 'activate';

		showAlert({
			title: 'Are you sure?',
			text: `Do you really want to ${actionText} this product?`,
			icon: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Yes, do it!',
			cancelButtonText: 'Cancel',

			onConfirm: async () => {
				const payload = {
					...data,
					status: isActive ? PRODUCT_STATUS.INACTIVE : PRODUCT_STATUS.ACTIVE,
				};
				const response = await updateProduct(id, payload);
				updateProductList(response);
			},
		});
	};

	return (
		<>
			<Card stretch>
				<CardHeader>
					<CardLabel icon='Inventory2'>
						<CardTitle tag='div' className='h5'>
							Product List
						</CardTitle>
						<CardActions tag='div' className='text-muted'>
							Total records: {filteredProductList?.length || 0}
						</CardActions>
					</CardLabel>
					<CardActions>
						<Button
							color='primary'
							icon='AddCircle'
							isLight
							onClick={handleCreateFormOpen}>
							Add Product
						</Button>
					</CardActions>
				</CardHeader>

				<CardBody>
					{isProductLoading ? (
						<div className='text-center py-5'>
							<Spinner color='info' size='3x' />
							<div className='mt-2'>Loading Product...</div>
						</div>
					) : (
						<>
							<ProductList
								productList={filteredProductList}
								onEdit={handleEditProduct}
								onDelete={deleteProduct}
								isLoading={isProductLoading}
								handleToggleProductStatus={handleToggleProductStatus}
								productCategoryList={productCategoryList}
								unitOfMeasurementList={unitOfMeasurementList}
								vendorList={vendorList}
							/>
						</>
					)}
				</CardBody>
			</Card>

			<ProductForm
				isOpen={isModalOpen}
				toggle={handleToggleModal}
				isEdit={isEdit}
				productData={productFormData}
				handleChange={onChangeProduct}
				onSubmit={
					isEdit ? () => handleUpdateProduct(productFormData?.id) : handleCreateProduct
				}
				productCategoryList={productCategoryList}
				productList={productList}
				unitOfMeasurementList={unitOfMeasurementList}
				vendorList={vendorList}
			/>
		</>
	);
};
