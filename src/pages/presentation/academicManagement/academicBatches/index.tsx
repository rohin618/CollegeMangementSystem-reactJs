import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
	PageWrapper,
	SubHeader,
	SubHeaderLeft,
	SubheaderSeparator,
	SubHeaderRight,
	Page,
} from '../../../../layout';

import { Button, Input, Popovers } from '../../../../components/bootstrap';
import Icon from '../../../../components/icon';

import { IAcademicBatch } from '../../../../common/interface/academicBatch';

import {
	createAcademicBatch,
	deleteAcademicBatchById,
	getAllAcademicBatches,
	updateAcademicBatch,
} from '../../../../common/api/academicBatch';

import AcademicBatchFormModal from './academicBatchForm';
import AcademicBatchList from './academicBatchList';


import { QUERY_KEY } from '../../../../common/constant';
import { showAlert } from '../../../../helpers/alerts';
import { useSearch } from '../../../../hooks';
import { AcademicBatchModal } from '../../../../common/model/academicBatchModal';

const AcademicBatchPage = () => {
	const queryClient = useQueryClient();

	const [isAcademicBatchModalOpen, setIsAcademicBatchModalOpen] =
		useState(false);

	const [academicBatchData, setAcademicBatchData] =
		useState<Partial<IAcademicBatch>>(AcademicBatchModal);

	const [editAcademicBatchData, setEditAcademicBatchData] =
		useState<IAcademicBatch | null>(null);

	/*
	|--------------------------------------------------------------------------
	| Query
	|--------------------------------------------------------------------------
	*/
	const { data: academicBatches = [], isLoading } = useQuery({
		queryKey: [QUERY_KEY.ACADEMIC_BATCH],
		queryFn: getAllAcademicBatches,
	});

	/*
	|--------------------------------------------------------------------------
	| Filtered Academic Batches
	|--------------------------------------------------------------------------
	*/
	const searchKeys = useMemo(() => ['name'], []);

	const {
		searchValue,
		setSearchValue,
		filteredList: filteredAcademicBatches,
	} = useSearch(academicBatches || [], searchKeys);

	/*
	|--------------------------------------------------------------------------
	| Modal
	|--------------------------------------------------------------------------
	*/
	const toggleAcademicBatchModal = () => {
		setIsAcademicBatchModalOpen((prev) => !prev);

		if (isAcademicBatchModalOpen) {
			setAcademicBatchData(AcademicBatchModal);
			setEditAcademicBatchData(null);
		}
	};

	const closeAcademicBatchModal = () => {
		setIsAcademicBatchModalOpen(false);
		setAcademicBatchData(AcademicBatchModal);
		setEditAcademicBatchData(null);
	};

	/*
	|--------------------------------------------------------------------------
	| Input Change
	|--------------------------------------------------------------------------
	*/
	const handleChange = (e: any) => {
		const { name, value } = e.target;

		setAcademicBatchData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	/*
	|--------------------------------------------------------------------------
	| Edit
	|--------------------------------------------------------------------------
	*/
	const handleEdit = (academicBatch: IAcademicBatch) => {
		setEditAcademicBatchData(academicBatch);
		setAcademicBatchData(academicBatch);
		setIsAcademicBatchModalOpen(true);
	};

	/*
	|--------------------------------------------------------------------------
	| Mutations
	|--------------------------------------------------------------------------
	*/
	const createAcademicBatchMutation = useMutation({
		mutationFn: createAcademicBatch,
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: [QUERY_KEY.ACADEMIC_BATCH],
			});

			closeAcademicBatchModal();
		},
	});

	const updateAcademicBatchMutation = useMutation({
		mutationFn: ({
			id,
			data,
		}: {
			id: number;
			data: any;
		}) => updateAcademicBatch(id, data),

		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: [QUERY_KEY.ACADEMIC_BATCH],
			});

			closeAcademicBatchModal();
		},
	});

	const deleteAcademicBatchMutation = useMutation({
		mutationFn: deleteAcademicBatchById,
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: [QUERY_KEY.ACADEMIC_BATCH],
			});
		},
	});

	/*
	|--------------------------------------------------------------------------
	| Submit
	|--------------------------------------------------------------------------
	*/
	const handleSubmitAcademicBatch = async () => {
		const payload = {
			...academicBatchData,
			startYear: academicBatchData.startYear
				? new Date(academicBatchData.startYear).getFullYear()
				: null,
			endYear: academicBatchData.endYear
				? new Date(academicBatchData.endYear).getFullYear()
				: null,
		};

		if (editAcademicBatchData?.id) {
			await updateAcademicBatchMutation.mutateAsync({
				id: editAcademicBatchData.id,
				data: payload,
			});
		} else {
			await createAcademicBatchMutation.mutateAsync(
				payload as any,
			);
		}
	};

	/*
	|--------------------------------------------------------------------------
	| Delete
	|--------------------------------------------------------------------------
	*/
	const handleDelete = async (
		academicBatch: IAcademicBatch,
	) => {
		await showAlert({
			title: 'Delete Academic Batch?',
			text: `Are you sure you want to delete ${academicBatch.name}?`,
			icon: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Yes, Delete',
			cancelButtonText: 'Cancel',
			onConfirm: async () => {
				await deleteAcademicBatchMutation.mutateAsync(
					academicBatch.id,
				);
			},
		});
	};

	return (
		<PageWrapper title='Academic Batches'>
			<SubHeader>
				<SubHeaderLeft>
					<label
						className='border-0 bg-transparent cursor-pointer me-0'
						htmlFor='academicBatchSearch'>
						<Icon
							icon='Search'
							size='2x'
							color='primary'
						/>
					</label>

					<Input
						id='academicBatchSearch'
						type='search'
						className='border-0 shadow-none bg-transparent'
						placeholder='Search Academic Batch by name...'
						value={searchValue}
						onChange={(e: any) =>
							setSearchValue(e.target.value)
						}
					/>

					<SubheaderSeparator />
				</SubHeaderLeft>

				<SubHeaderRight>
					<Button
						icon='FilterAlt'
						color='dark'
						isLight
						className='btn-only-icon position-relative'>
						{searchValue !== '' && (
							<Popovers
								desc='Filtering applied'
								trigger='hover'>
								<span className='position-absolute top-0 start-100 translate-middle badge border border-light rounded-circle bg-danger p-2'>
									<span className='visually-hidden'>
										filter active
									</span>
								</span>
							</Popovers>
						)}
					</Button>

					<SubheaderSeparator />

					<Button
						color='info'
						icon='AddCircle'
						isLight
						onClick={() => {
							setEditAcademicBatchData(null);
							setAcademicBatchData(
								AcademicBatchModal,
							);
							setIsAcademicBatchModalOpen(true);
						}}>
						Add New Academic Batch
					</Button>
				</SubHeaderRight>
			</SubHeader>

			<Page container='fluid'>
				<AcademicBatchList
					academicBatches={filteredAcademicBatches as any}
					isLoading={isLoading}
					onEdit={handleEdit}
					onDelete={handleDelete}
				/>
			</Page>

			<AcademicBatchFormModal
				isOpen={isAcademicBatchModalOpen}
				toggle={toggleAcademicBatchModal}
				academicBatchData={academicBatchData}
				handleChange={handleChange}
				onSubmit={handleSubmitAcademicBatch}
				isEdit={!!editAcademicBatchData}
			/>
		</PageWrapper>
	);
};

export default AcademicBatchPage;