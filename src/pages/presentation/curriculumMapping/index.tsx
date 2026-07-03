import { useMemo, useState } from 'react';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
	PageWrapper,
	SubHeader,
	SubHeaderLeft,
	SubheaderSeparator,
	SubHeaderRight,
	Page,
} from '../../../layout';

import Icon from '../../../components/icon';
import { Button, Input, Popovers } from '../../../components/bootstrap';

import { QUERY_KEY } from '../../../common/constant';
import { ICurriculum } from '../../../common/interface/curriculum';
import { CurriculumModal } from '../../../common/model/curriculumModal';

import { useDebounce } from '../../../hooks/useDebounce';
import { useRemoveInfiniteQueryItemById } from '../../../hooks/useRemoveInfiniteQueryItemById';

import {
	createCurriculum,
	deleteCurriculumById,
	getPaginatedCurriculum,
	updateCurriculum,
} from '../../../common/api/curriculam';

import { getAllDepartments } from '../../../common/api/departments';
import { getAllAcademicBatches } from '../../../common/api/academicBatch';
import { getAllSubjects } from '../../../common/api/subject';
import { getAllSemesters } from '../../../common/api/semester';

import { showAlert } from '../../../helpers/alerts';
import CurriculumList from './curriculumList';
import CurriculumFormModal from './curriculumForm';

const CurriculumPage = () => {
	const queryClient = useQueryClient();

	const [isCurriculumModalOpen, setIsCurriculumModalOpen] = useState(false);

	const [curriculumData, setCurriculumData] = useState<Partial<ICurriculum>>(CurriculumModal);

	const [editCurriculumData, setEditCurriculumData] = useState<ICurriculum | null>(null);

	/*
	|--------------------------------------------------------------------------
	| Pagination Query
	|--------------------------------------------------------------------------
	*/
	const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
		queryKey: [QUERY_KEY.CURRICULAM],
		queryFn: ({ pageParam = 0 }) =>
			getPaginatedCurriculum({
				page: pageParam,
				size: 10,
			}),
		initialPageParam: 0,
		getNextPageParam: (lastPage) => (lastPage.last ? undefined : lastPage.number + 1),
		staleTime: 5 * 60 * 1000,
	});

	const curriculums = useMemo(() => {
		return data?.pages?.flatMap((page: any) => page.content) || [];
	}, [data]);

	/*
	|--------------------------------------------------------------------------
	| Dropdown Data
	|--------------------------------------------------------------------------
	*/
	const { data: departments = [] } = useQuery({
		queryKey: [QUERY_KEY.ALL_DEPARTMENTS],
		queryFn: getAllDepartments,
		staleTime: 3 * 60 * 1000,
		gcTime: 3 * 60 * 1000,
	});

	const { data: academicBatches = [] } = useQuery({
		queryKey: [QUERY_KEY.ALL_ACADEMIC_BATCHES],
		queryFn: getAllAcademicBatches,
		staleTime: 3 * 60 * 1000,
		gcTime: 3 * 60 * 1000,
	});

	const { data: subjects = [] } = useQuery({
		queryKey: [QUERY_KEY.ALL_SUBJECTS],
		queryFn: getAllSubjects,
		staleTime: 3 * 60 * 1000,
		gcTime: 3 * 60 * 1000,
	});

	const { data: semesters = [] } = useQuery({
		queryKey: [QUERY_KEY.ALL_SEMESTERS],
		queryFn: getAllSemesters,
		staleTime: 3 * 60 * 1000,
		gcTime: 3 * 60 * 1000,
	});

	/*
	|--------------------------------------------------------------------------
	| Create
	|--------------------------------------------------------------------------
	*/
	const createCurriculumMutation = useMutation({
		mutationFn: createCurriculum,

		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: [QUERY_KEY.CURRICULAM],
			});

			handleCloseModal();
		},
	});

	/*
	|--------------------------------------------------------------------------
	| Delete
	|--------------------------------------------------------------------------
	*/
	const { removeItemById } = useRemoveInfiniteQueryItemById([QUERY_KEY.CURRICULAM]);

	const deleteMutation = useMutation({
		mutationFn: deleteCurriculumById,

		onSuccess: (_, curriculumId) => {
			removeItemById(curriculumId);
		},
	});

	/*
	|--------------------------------------------------------------------------
	| Handlers
	|--------------------------------------------------------------------------
	*/
	const handleChange = (e: any) => {
		const { name, value } = e.target;

		setCurriculumData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleSubmitCurriculum = async () => {
		if (editCurriculumData) {
			await updateCurriculumMutation.mutateAsync({
				id: curriculumData.id!,
				departmentId: curriculumData.departmentId!,
				academicBatchId: curriculumData.academicBatchId!,
				semesterId: curriculumData.semesterId!,
				subjectId: curriculumData.subjectId!,
			});
		} else {
			await createCurriculumMutation.mutateAsync({
				departmentId: curriculumData.departmentId!,
				academicBatchId: curriculumData.academicBatchId!,
				semesterId: curriculumData.semesterId!,
				subjectIds: curriculumData.subjectIds || [],
			});
		}
	};

	const handleEdit = (curriculum: ICurriculum) => {
		setEditCurriculumData(curriculum);
		setCurriculumData(curriculum);
		setIsCurriculumModalOpen(true);
	};

	const handleDelete = (curriculum: ICurriculum) => {
		showAlert({
			title: 'Delete Curriculum?',
			text: `Delete curriculum mapping for ${curriculum.subjectName}?`,
			icon: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Yes, Delete',
			cancelButtonText: 'Cancel',

			onConfirm: async () => {
				await deleteMutation.mutateAsync(curriculum.id);
			},
		});
	};

	const handleCloseModal = () => {
		setEditCurriculumData(null);
		setCurriculumData(CurriculumModal);
		setIsCurriculumModalOpen(false);
	};

	const updateCurriculumMutation = useMutation({
		mutationFn: updateCurriculum,

		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: [QUERY_KEY.CURRICULAM],
			});

			handleCloseModal();
		},
	});

	return (
		<PageWrapper title='Curriculum'>
			<SubHeader>
				<SubHeaderLeft>
					<label
						className='border-0 bg-transparent cursor-pointer me-0'
						htmlFor='curriculumSearch'>
						<Icon icon='Search' size='2x' color='primary' />
					</label>

					{/* <Input
						id='curriculumSearch'
						type='search'
						className='border-0 shadow-none bg-transparent'
						placeholder='Search Curriculum...'
						value={search}
						onChange={(e: any) => setSearch(e.target.value)}
					/> */}

					<SubheaderSeparator />
				</SubHeaderLeft>

				<SubHeaderRight>
					{/* <Button
						icon='FilterAlt'
						color='dark'
						isLight
						className='btn-only-icon position-relative'>
						{search && (
							<Popovers desc='Filtering applied' trigger='hover'>
								<span className='position-absolute top-0 start-100 translate-middle badge border border-light rounded-circle bg-danger p-2'>
									<span className='visually-hidden'>filter active</span>
								</span>
							</Popovers>
						)}
					</Button> */}

					<SubheaderSeparator />

					<Button
						color='info'
						icon='AddCircle'
						isLight
						onClick={() => {
							setEditCurriculumData(null);
							setCurriculumData(CurriculumModal);
							setIsCurriculumModalOpen(true);
						}}>
						Add New Curriculum
					</Button>
				</SubHeaderRight>
			</SubHeader>

			<Page container='fluid'>
				<CurriculumList
					curriculums={curriculums}
					isLoading={isLoading}
					hasNextPage={hasNextPage}
					isFetchingNextPage={isFetchingNextPage}
					fetchNextPage={fetchNextPage}
					onEdit={handleEdit}
					onDelete={handleDelete}
				/>

				<CurriculumFormModal
					isOpen={isCurriculumModalOpen}
					toggle={handleCloseModal}
					curriculumData={curriculumData}
					handleChange={handleChange}
					onSubmit={handleSubmitCurriculum}
					isEdit={!!editCurriculumData}
					departments={departments}
					academicBatches={academicBatches}
					semesters={semesters}
					subjects={subjects}
				/>
			</Page>
		</PageWrapper>
	);
};

export default CurriculumPage;
