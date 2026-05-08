import React, { useState } from 'react';
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

import {
	useMultiSearch,
	useRemoveItemQueryListById,
	useUpdateQueryListById,
} from '../../../../../hooks';

import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY, UNIT_OF_MEASUREMENT_STATUS } from '../../../../../common/constant';
import { showAlert } from '../../../../../helpers/alerts';

import UnitOfMeasurementForm from './unitOfMeasurementForm';
import UnitOfMeasurementList from './unitOfMeasurementList';

import {
	createUnitOfMeasurement,
	deleteUnitOfMeasurementById,
	getAllUnitOfMeasurement,
	updateUnitOfMeasurement,
} from '../../../../../common/api/unitOfMeasurement';

import { unitOfMeasurementModal } from '../../../../../common/model/unitOfMeasurement';
import { IUnitOfMeasurementModal } from '../../../../../common/interface/unitOfMeasurement';
import { getAllProduct } from '../../../../../common/api/product';

interface UnitOfMeasurementProps {
	search?: string;
}

export const UnitOfMeasurement: React.FC<UnitOfMeasurementProps> = ({ search }) => {
	const [unitOfMeasurement, setUnitOfMeasurement] = useState<IUnitOfMeasurementModal>({
		...unitOfMeasurementModal,
	});

	const [isEdit, setIsEdit] = useState(false);
	const [isModalOpen, setIsModalOpen] = useState(false);

	//  Update cache after create/update
	const updateUOMList = useUpdateQueryListById<any>([QUERY_KEY.UNIT_OF_MEASUREMENT]);

	//  Remove from cache after delete
	const { removeItemById } = useRemoveItemQueryListById<any>({
		queryKey: [QUERY_KEY.UNIT_OF_MEASUREMENT],
	});

	//  Fetch List
	const { data: uomList = [], isLoading } = useQuery({
		queryKey: [QUERY_KEY.UNIT_OF_MEASUREMENT],
		queryFn: () => getAllUnitOfMeasurement(),
		staleTime: 5 * 60 * 1000,
	});

	const { data: productList = [], isLoading: isProductLoading } = useQuery({
		queryKey: [QUERY_KEY.PRODUCT_LIST],
		queryFn: () => getAllProduct(),
		staleTime: 5 * 60 * 1000,
	});

	//  Search
	const filteredUOMList = useMultiSearch(uomList, {
		name: search,
	});

	//  Handle Change
	const handleChange = (e: any) => {
		const { id, value, checked, type } = e.target;

		setUnitOfMeasurement((prev) => ({
			...prev,
			[id]: type === 'checkbox' ? checked : value,
		}));
	};

	//  Open Create Form
	const handleCreateFormOpen = () => {
		setIsEdit(false);
		setIsModalOpen(true);
		setUnitOfMeasurement({ ...unitOfMeasurementModal });
	};

	//  Close Modal
	const handleToggleModal = () => {
		setIsModalOpen(false);
		setUnitOfMeasurement({ ...unitOfMeasurementModal });
	};

	//  Create
	const handleCreate = async () => {
		const response = await createUnitOfMeasurement(unitOfMeasurement);
		updateUOMList(response);
		setIsModalOpen(false);
	};

	//  Update
	const handleUpdate = async (id: string | undefined) => {
		if (!id) return;

		const payload = {
			...unitOfMeasurement,
		};

		const response = await updateUnitOfMeasurement(id, payload);
		updateUOMList(response);
		setIsModalOpen(false);
	};

	//  Edit
	const handleEdit = (data: IUnitOfMeasurementModal) => {
		setUnitOfMeasurement(data);
		setIsEdit(true);
		setIsModalOpen(true);
	};

	//  Delete
	const handleDelete = async (data: IUnitOfMeasurementModal) => {
		const id = data?.id;
		if (!id) return;

		// 🔹 1. Check from already loaded product list (fast)
		let linkedProducts =
			productList?.filter((product: any) => product.unitOfMeasurementId === id) || [];

		// 🔹 2. If productList not available / empty → fallback to DB
		if (!productList?.length) {
			linkedProducts = await getAllProduct({ unitOfMeasurementId: id });
		}

		// 🔹 3. Block delete if linked products exist
		if (linkedProducts.length > 0) {
			showAlert({
				title: 'Cannot Delete',
				text: 'This Unit Of Measurement is associated with existing products.',
				icon: 'error',
			});
			return;
		}

		showAlert({
			title: 'Are you sure?',
			text: "You won't be able to revert this!",
			icon: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Yes, delete it!',
			cancelButtonText: 'Cancel',

			onConfirm: async () => {
				await deleteUnitOfMeasurementById(id);
				removeItemById(id);
			},
		});
	};

	//  Toggle Status (Optional)
	const handleToggleStatus = async (item: any) => {
		const id = item?.id;
		if (!id) return;

		const isActive = +item.status === UNIT_OF_MEASUREMENT_STATUS.ACTIVE;

		// 🔹 Only block when trying to INACTIVATE
		if (isActive) {
			// 1️⃣ Check from already loaded list (fast)
			let linkedProducts =
				productList?.filter((product: any) => product.unitOfMeasurementId === id) || [];

			// 2️⃣ Fallback to DB if list not loaded
			if (!productList?.length) {
				linkedProducts = await getAllProduct({ unitOfMeasurementId: id });
			}

			// 3️⃣ Block inactivation if products exist
			if (linkedProducts.length > 0) {
				showAlert({
					title: 'Action Not Allowed',
					text: 'This Unit Of Measurement is already associated with products and cannot be deactivated.',
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
					...item,
					status: isActive
						? UNIT_OF_MEASUREMENT_STATUS.INACTIVE
						: UNIT_OF_MEASUREMENT_STATUS.ACTIVE,
				};

				const response = await updateUnitOfMeasurement(id, payload);
				updateUOMList(response);
			},
		});
	};

	return (
		<>
			<Card stretch>
				<CardHeader>
					<CardLabel icon='Straighten'>
						<CardTitle tag='div' className='h5'>
							Unit Of Measurement List
						</CardTitle>
						<CardActions tag='div' className='text-muted'>
							Total records: {filteredUOMList?.length || 0}
						</CardActions>
					</CardLabel>

					<CardActions>
						<Button
							color='primary'
							icon='AddCircle'
							isLight
							onClick={handleCreateFormOpen}>
							Add Unit
						</Button>
					</CardActions>
				</CardHeader>

				<CardBody>
					{isLoading ? (
						<div className='text-center py-5'>
							<Spinner color='info' size='3x' />
							<div className='mt-2'>Loading Units...</div>
						</div>
					) : (
						<UnitOfMeasurementList
							unitOfMeasurementList={filteredUOMList}
							onEdit={handleEdit}
							onDelete={handleDelete}
							isLoading={isLoading}
							handleToggleUnitStatus={handleToggleStatus}
						/>
					)}
				</CardBody>
			</Card>

			<UnitOfMeasurementForm
				isOpen={isModalOpen}
				toggle={handleToggleModal}
				unitOfMeasurement={unitOfMeasurement}
				isEdit={isEdit}
				handleChange={handleChange}
				onSubmit={isEdit ? () => handleUpdate(unitOfMeasurement?.id) : handleCreate}
				unitOfMeasurementList={uomList}
			/>
		</>
	);
};

export default UnitOfMeasurement;
