import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { IDiscountModel } from '../../../../../common/interface/discount';
import { discountModel } from '../../../../../common/model/discount';

import {
	createDiscount,
	deleteDiscountById,
	getAllDiscounts,
	updateDiscount,
} from '../../../../../common/api/discount';

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

import DiscountList from './discountList';
import DiscountForm from './discountForm';
import { DISCOUNT_STATUS, QUERY_KEY } from '../../../../../common/constant';
import {
	useMultiSearch,
	useRemoveItemQueryListById,
	useUpdateQueryListById,
} from '../../../../../hooks';
import { showAlert } from '../../../../../helpers/alerts';

export const Discount: React.FC<{ search?: string }> = ({ search }) => {
	const [discountFormData, setDiscountFormData] = useState<IDiscountModel>({
		...discountModel,
	});

	const [isEdit, setIsEdit] = useState(false);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const { data: discountList = [], isLoading: isDiscountLoading } = useQuery({
		queryKey: [QUERY_KEY.DISCOUNT_LIST],
		queryFn: getAllDiscounts,
		staleTime: 5 * 60 * 1000,
	});

	const updateDiscountList = useUpdateQueryListById<any>([QUERY_KEY.DISCOUNT_LIST]);

	const { removeItemById: removeProductById } = useRemoveItemQueryListById<any>({
		queryKey: [QUERY_KEY.DISCOUNT_LIST],
	});
	const filteredDiscountList = useMultiSearch(discountList, { name: search });

	// form change
	const handleChange = (e: any) => {
		const { id, value } = e.target;

		setDiscountFormData((prev) => ({
			...prev,
			[id]: value,
		}));
	};

	// open create form
	const handleCreateFormOpen = () => {
		setIsEdit(false);
		setDiscountFormData({ ...discountModel });
		setIsModalOpen(true);
	};

	// close modal
	const handleToggleModal = () => {
		setIsModalOpen(false);
		setDiscountFormData({ ...discountModel });
	};

	// create
	const handleCreate = async () => {
		try {
			const res = await createDiscount(discountFormData);
			updateDiscountList(res);
			handleToggleModal();
		} catch (error) {
			console.error('Failed to create discount:', error);
		}
	};

	// update
	const handleUpdate = async (id?: string) => {
		if (!id) return;

		try {
			const res = await updateDiscount(id, discountFormData);
			updateDiscountList(res);
			handleToggleModal();
		} catch (error) {
			console.error('Failed to update discount:', error);
		}
	};

	// edit
	const handleEdit = (data: IDiscountModel) => {
		setDiscountFormData(data);
		setIsEdit(true);
		setIsModalOpen(true);
	};

	const deleteDiscount = async (data: IDiscountModel) => {
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
				await deleteDiscountById(id);
				removeProductById(id);
			},
		});
	};

	const handleToggleDiscountStatus = async (discount: any) => {
		const id = discount?.id;
		if (!id) return;

		const isActive = +discount.status === DISCOUNT_STATUS.ACTIVE;

		const actionText = isActive ? 'deactivate' : 'activate';

		showAlert({
			title: 'Are you sure?',
			text: `Do you really want to ${actionText} this discount?`,
			icon: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Yes, do it!',
			cancelButtonText: 'Cancel',

			onConfirm: async () => {
				const payload = {
					...discount,
					status: isActive ? DISCOUNT_STATUS.INACTIVE : DISCOUNT_STATUS.ACTIVE,
				};

				const response = await updateDiscount(id, payload);

				updateDiscountList(response);
			},
		});
	};

	return (
		<>
			<Card stretch>
				<CardHeader>
					<CardLabel icon='LocalOffer'>
						<CardTitle tag='div' className='h5'>
							Discount List
						</CardTitle>

						<CardActions tag='div' className='text-muted'>
							Total records: {filteredDiscountList?.length || 0}
						</CardActions>
					</CardLabel>

					<CardActions>
						<Button
							color='primary'
							icon='AddCircle'
							isLight
							onClick={handleCreateFormOpen}>
							Add Discount
						</Button>
					</CardActions>
				</CardHeader>

				<CardBody>
					{isDiscountLoading ? (
						<div className='text-center py-5'>
							<Spinner color='info' size='3x' />
							<div className='mt-2'>Loading Discount...</div>
						</div>
					) : (
						<DiscountList
							discountList={filteredDiscountList}
							onEdit={handleEdit}
							onDelete={deleteDiscount}
							handleToggleDiscountStatus={handleToggleDiscountStatus}
							isLoading={isDiscountLoading}
						/>
					)}
				</CardBody>
			</Card>

			<DiscountForm
				isOpen={isModalOpen}
				toggle={handleToggleModal}
				isEdit={isEdit}
				discountData={discountFormData}
				handleChange={handleChange}
				onSubmit={isEdit ? () => handleUpdate(discountFormData?.id) : handleCreate}
			/>
		</>
	);
};
