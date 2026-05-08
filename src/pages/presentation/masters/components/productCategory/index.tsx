import React, { useMemo, useState } from 'react';
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
import { IProductCategoryModal } from '../../../../../common/interface/prouductCategory';
import { productCategoryModal } from '../../../../../common/model/productCategory/productCategory';
import {
	useMultiSearch,
	useRemoveItemQueryListById,
	useSearch,
	useUpdateQueryListById,
} from '../../../../../hooks';
import {
	createProductCategory,
	deleteProductCategoryById,
	getAllProductCategory,
	updateProductCategory,
} from '../../../../../common/api/prouductCategory';
import { useQuery } from '@tanstack/react-query';
import { PRODUCT_CATEGORY_STATUS, QUERY_KEY } from '../../../../../common/constant';
import { showAlert } from '../../../../../helpers/alerts';
import ProductCategoryForm from './productCategoryForm';
import ProductCategoryList from './productCategoryList';
import { getAllProduct } from '../../../../../common/api/product';

interface ProductCategoryProps {
	search?: string;
}
export const ProductCategory: React.FC<ProductCategoryProps> = ({ search }) => {
	const [productCategory, setProductCategory] = useState<IProductCategoryModal>({
		...productCategoryModal,
	});
	const [isEdit, setIsEdit] = useState(false);
	const [isModalOpen, setIsModalOpen] = useState(false);

	const updateCategoryList = useUpdateQueryListById<any>([QUERY_KEY.PRODUCT_CATEGORY]);

	const { removeItemById: removeProductCategoryById } = useRemoveItemQueryListById<any>({
		queryKey: [QUERY_KEY.PRODUCT_CATEGORY],
	});

	const { data: productCategoryList = [], isLoading: isProductCategoryLoading } = useQuery({
		queryKey: [QUERY_KEY.PRODUCT_CATEGORY],
		queryFn: () => getAllProductCategory(),
		staleTime: 5 * 60 * 1000

	});

	const { data: productList = [], isLoading: isProductLoading } = useQuery({
		queryKey: [QUERY_KEY.PRODUCT_LIST],
		queryFn: () => getAllProduct(),
		staleTime: 5 * 60 * 1000

	});

	const filteredProductCategoryList = useMultiSearch(productCategoryList, {
		name: search,
	});

	const onChangeProductCategory = (e: any) => {
		const { id, value, checked, type } = e.target;
		setProductCategory((prev) => ({
			...prev,
			[id]: type === 'checkbox' ? checked : value,
		}));
	};

	const handleToggleModal = () => {
		setIsModalOpen(false);
		setProductCategory({ ...productCategoryModal });
	};

	const handleCreateProductCategory = async (extraPayload = {}) => {
		const payload = {
			...productCategory,
			...extraPayload,
		};

		const response = await createProductCategory(payload);
		updateCategoryList(response);
	};
	const handleUpdateProductCategory = async (id: string | undefined) => {
		if (!id) return;
		const payload = {
			...productCategory,
		};
		const response = await updateProductCategory(id, payload);
		updateCategoryList(response);
	};

	const handleEditProductCategory = (data: IProductCategoryModal) => {
		setProductCategory(data);
		setIsEdit(true);
		setIsModalOpen(true);
	};
	const handleCreateFormOpen = () => {
		setIsModalOpen(true);
		setIsEdit(false);
		setProductCategory({ ...productCategoryModal });
	};

	const deleteProductCategory = async (data: IProductCategoryModal) => {
		const id = data?.id;
		if (!id) return;

		// 🔹 1. Check from already loaded product list (fast)
		let linkedProducts = productList?.filter((product: any) => product.categoryId === id) || [];

		// 🔹 2. If productList not available / empty → fallback to DB
		if (!productList?.length) {
			linkedProducts = await getAllProduct({ categoryId: id });
		}

		// 🔹 3. Block delete if linked products exist
		if (linkedProducts.length > 0) {
			showAlert({
				title: 'Cannot Delete',
				text: 'This category is associated with existing products.',
				icon: 'error',
			});
			return;
		}

		// 🔹 4. Confirm delete
		showAlert({
			title: 'Are you sure?',
			text: "You won't be able to revert this!",
			icon: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Yes, delete it!',
			cancelButtonText: 'Cancel',

			onConfirm: async () => {
				await deleteProductCategoryById(id);
				removeProductCategoryById(id);
			},
		});
	};
	const handleToggleProductStatus = async (category: any) => {
		const id = category?.id;
		if (!id) return;

		const isActive = +category.status === PRODUCT_CATEGORY_STATUS.ACTIVE;

		// 🔹 Only block when trying to INACTIVATE
		if (isActive) {
			// 1️⃣ Check from already loaded list (fast)
			let linkedProducts =
				productList?.filter((product: any) => product.categoryId === id) || [];

			// 2️⃣ Fallback to DB if list not loaded
			if (!productList?.length) {
				linkedProducts = await getAllProduct({ categoryId: id });
			}

			// 3️⃣ Block inactivation if products exist
			if (linkedProducts.length > 0) {
				showAlert({
					title: 'Action Not Allowed',
					text: 'This category is already associated with products and cannot be deactivated.',
					icon: 'error',
				});
				return;
			}
		}

		const actionText = isActive ? 'deactivate' : 'activate';

		showAlert({
			title: 'Are you sure?',
			text: `Do you really want to ${actionText} this product category?`,
			icon: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Yes, do it!',
			cancelButtonText: 'Cancel',

			onConfirm: async () => {
				const payload = {
					...category,
					status: isActive
						? PRODUCT_CATEGORY_STATUS.INACTIVE
						: PRODUCT_CATEGORY_STATUS.ACTIVE,
				};

				const response = await updateProductCategory(id, payload);
				updateCategoryList(response);
			},
		});
	};

	return (
		<>
			<Card stretch>
				<CardHeader>
					<CardLabel icon='Category'>
						<CardTitle tag='div' className='h5'>
							Prouduct Category List
						</CardTitle>
						<CardActions tag='div' className='text-muted'>
							Total records: {filteredProductCategoryList?.length || 0}
						</CardActions>
					</CardLabel>
					<CardActions>
						<Button
							color='primary'
							icon='AddCircle'
							isLight
							size='sm'
							onClick={handleCreateFormOpen}>
							Add productCategory
						</Button>
					</CardActions>
				</CardHeader>

				<CardBody>
					{isProductCategoryLoading ? (
						<div className='text-center py-5'>
							<Spinner color='info' size='3x' />
							<div className='mt-2'>Loading productCategory...</div>
						</div>
					) : (
						<>
							<ProductCategoryList
								productCategoryList={filteredProductCategoryList}
								onEdit={handleEditProductCategory}
								onDelete={deleteProductCategory}
								isLoading={isProductCategoryLoading}
								handleToggleProductStatus={handleToggleProductStatus}
							/>
						</>
					)}
				</CardBody>
			</Card>

			<ProductCategoryForm
				isOpen={isModalOpen}
				toggle={handleToggleModal}
				productCategory={productCategory}
				isEdit={isEdit}
				handleChange={onChangeProductCategory}
				onSubmit={
					isEdit
						? () => handleUpdateProductCategory(productCategory?.id)
						: handleCreateProductCategory
				}
				productCategoryList={productCategoryList}
			/>
		</>
	);
};
