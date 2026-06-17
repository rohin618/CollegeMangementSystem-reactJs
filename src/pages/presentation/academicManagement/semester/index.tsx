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

import { ISemester } from '../../../../common/interface/semester';



import SemesterFormModal from './semesterForm';
import SemesterList from './semesterList';

import { QUERY_KEY } from '../../../../common/constant';
import { showAlert } from '../../../../helpers/alerts';
import { useSearch } from '../../../../hooks';
import { createSemester, deleteSemesterById, getAllSemesters, updateSemester } from '../../../../common/api/semester';
import { SemesterModal } from '../../../../common/model/semesterModal';

const SemesterPage = () => {
	const queryClient = useQueryClient();

	const [isSemesterModalOpen, setIsSemesterModalOpen] =
		useState(false);

	const [semesterData, setSemesterData] =
		useState<Partial<ISemester>>(SemesterModal);

	const [editSemesterData, setEditSemesterData] =
		useState<ISemester | null>(null);

	/*
	|--------------------------------------------------------------------------
	| Query
	|--------------------------------------------------------------------------
	*/
	const { data: semesters = [], isLoading } = useQuery({
		queryKey: [QUERY_KEY.SEMESTERS],
		queryFn: getAllSemesters,
	});

	/*
	|--------------------------------------------------------------------------
	| Search
	|--------------------------------------------------------------------------
	*/
	const searchKeys = useMemo(
		() => ['semesterNumber'],
		[],
	);

	const {
		searchValue,
		setSearchValue,
		filteredList: filteredSemesters,
	} = useSearch(semesters || [], searchKeys);

	/*
	|--------------------------------------------------------------------------
	| Modal
	|--------------------------------------------------------------------------
	*/
	const toggleSemesterModal = () => {
		setIsSemesterModalOpen((prev) => !prev);

		if (isSemesterModalOpen) {
			setSemesterData(SemesterModal);
			setEditSemesterData(null);
		}
	};

	const closeSemesterModal = () => {
		setIsSemesterModalOpen(false);
		setSemesterData(SemesterModal);
		setEditSemesterData(null);
	};

	/*
	|--------------------------------------------------------------------------
	| Input Change
	|--------------------------------------------------------------------------
	*/
	const handleChange = (e: any) => {
		const { name, value } = e.target;

		setSemesterData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	/*
	|--------------------------------------------------------------------------
	| Edit
	|--------------------------------------------------------------------------
	*/
	const handleEdit = (semester: ISemester) => {
		setEditSemesterData(semester);
		setSemesterData(semester);
		setIsSemesterModalOpen(true);
	};

	/*
	|--------------------------------------------------------------------------
	| Mutations
	|--------------------------------------------------------------------------
	*/
	const createSemesterMutation = useMutation({
		mutationFn: createSemester,
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: [QUERY_KEY.SEMESTERS],
			});

			closeSemesterModal();
		},
	});

	const updateSemesterMutation = useMutation({
		mutationFn: ({
			id,
			data,
		}: {
			id: number;
			data: any;
		}) => updateSemester(id, data),

		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: [QUERY_KEY.SEMESTERS],
			});

			closeSemesterModal();
		},
	});

	const deleteSemesterMutation = useMutation({
		mutationFn: deleteSemesterById,
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: [QUERY_KEY.SEMESTERS],
			});
		},
	});

	/*
	|--------------------------------------------------------------------------
	| Submit
	|--------------------------------------------------------------------------
	*/
	const handleSubmitSemester = async () => {
		if (editSemesterData?.id) {
			await updateSemesterMutation.mutateAsync({
				id: editSemesterData.id,
				data: semesterData,
			});
		} else {
			await createSemesterMutation.mutateAsync(
				semesterData as any,
			);
		}
	};

	/*
	|--------------------------------------------------------------------------
	| Delete
	|--------------------------------------------------------------------------
	*/
	const handleDelete = async (
		semester: ISemester,
	) => {
		await showAlert({
			title: 'Delete Semester?',
			text: `Are you sure you want to delete Semester ${semester.semesterNumber}?`,
			icon: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Yes, Delete',
			cancelButtonText: 'Cancel',
			onConfirm: async () => {
				await deleteSemesterMutation.mutateAsync(
					semester.id,
				);
			},
		});
	};

	return (
		<PageWrapper title='Semesters'>
			<SubHeader>
				<SubHeaderLeft>
					<label
						className='border-0 bg-transparent cursor-pointer me-0'
						htmlFor='semesterSearch'>
						<Icon
							icon='Search'
							size='2x'
							color='primary'
						/>
					</label>

					<Input
						id='semesterSearch'
						type='search'
						className='border-0 shadow-none bg-transparent'
						placeholder='Search Semester...'
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
							setEditSemesterData(null);
							setSemesterData(
								SemesterModal,
							);
							setIsSemesterModalOpen(true);
						}}>
						Add New Semester
					</Button>
				</SubHeaderRight>
			</SubHeader>

			<Page container='fluid'>
				<SemesterList
					semesters={filteredSemesters}
					isLoading={isLoading}
					onEdit={handleEdit}
					onDelete={handleDelete}
				/>
			</Page>

			<SemesterFormModal
				isOpen={isSemesterModalOpen}
				toggle={toggleSemesterModal}
				semesterData={semesterData}
				handleChange={handleChange}
				onSubmit={handleSubmitSemester}
				isEdit={!!editSemesterData}
			/>
		</PageWrapper>
	);
};

export default SemesterPage;