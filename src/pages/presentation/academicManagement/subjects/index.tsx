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

import { useMemo, useState } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import SubjectForm from './subjectForm';
import SubjectList from './subjectList';

import { ISubject } from '../../../../common/interface/subject';
import { QUERY_KEY } from '../../../../common/constant';

import { showAlert } from '../../../../helpers/alerts';
import { useDebounce } from '../../../../hooks/useDebounce';
import { useRemoveInfiniteQueryItemById } from '../../../../hooks/useRemoveInfiniteQueryItemById';
import { useUpdateInfiniteQueryItemById } from '../../../../hooks/useUpdateInfiniteQueryItemById';
import {
	createSubject,
	deleteSubjectById,
	getPaginatedSubjects,
	updateSubject,
} from '../../../../common/api/subject';
import { SubjectModal } from '../../../../common/model/subjectModal';

const SubjectPage = () => {
	const [search, setSearch] = useState('');
	const debouncedSearch = useDebounce(search, 500);

	const queryClient = useQueryClient();

	const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);

	const [subjectData, setSubjectData] = useState<Partial<ISubject>>(SubjectModal);

	const [editSubjectData, setEditSubjectData] = useState<ISubject | null>(null);

	const toggleSubjectModal = () => {
		setIsSubjectModalOpen((prev) => !prev);
	};

	const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
		queryKey: [QUERY_KEY.SUBJECTS, debouncedSearch],
		queryFn: ({ pageParam }) =>
			getPaginatedSubjects({
				pageParam,
				search: debouncedSearch,
			}),
		initialPageParam: 0,
		getNextPageParam: (lastPage) => (lastPage.last ? undefined : lastPage.pageNumber + 1),
		staleTime: 5 * 60 * 1000,
	});

	const updateSubjectCache = useUpdateInfiniteQueryItemById<ISubject>([
		QUERY_KEY.SUBJECTS,
		debouncedSearch,
	]);

	const { removeItemById } = useRemoveInfiniteQueryItemById([
		QUERY_KEY.SUBJECTS,
		debouncedSearch,
	]);

	const deleteMutation = useMutation({
		mutationFn: deleteSubjectById,
		onSuccess: (_, subjectId) => {
			removeItemById(subjectId);
		},
	});

	const subjects = useMemo(() => {
		return data?.pages?.flatMap((page: any) => page.content) || [];
	}, [data]);

	const handleEdit = (subject: ISubject) => {
		setEditSubjectData(subject);
		setSubjectData(subject);
		setIsSubjectModalOpen(true);
	};

	const handleDelete = (subject: ISubject) => {
		showAlert({
			title: 'Delete Subject?',
			text: `Are you sure you want to delete ${subject.name}?`,
			icon: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Yes, Delete',
			cancelButtonText: 'Cancel',
			onConfirm: async () => {
				await deleteMutation.mutateAsync(subject.id);
			},
		});
	};

	const closeModal = () => {
		setEditSubjectData(null);
		setSubjectData(SubjectModal);
		setIsSubjectModalOpen(false);
	};

	const handleChange = (e: any) => {
		const { name, value } = e.target;

		setSubjectData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const createSubjectMutation = useMutation({
		mutationFn: createSubject,
		onSuccess: async () => {
            await queryClient.refetchQueries({
			queryKey: [QUERY_KEY.SUBJECTS],
		});
			closeModal();
		},
	});

	const updateSubjectMutation = useMutation({
		mutationFn: ({ id, data }: { id: number; data: any }) => updateSubject(id, data),

		onSuccess: () => {
			closeModal();
		},
	});

	const handleSubmitSubject = async () => {
		if (editSubjectData?.id) {
			await updateSubjectMutation.mutateAsync({
				id: editSubjectData.id,
				data: subjectData,
			});
		} else {
			await createSubjectMutation.mutateAsync(subjectData as any);
		}
	};
	return (
		<PageWrapper title='Subjects'>
			<SubHeader>
				<SubHeaderLeft>
					<label
						className='border-0 bg-transparent cursor-pointer me-0'
						htmlFor='subjectSearch'>
						<Icon icon='Search' size='2x' color='primary' />
					</label>

					<Input
						id='subjectSearch'
						type='search'
						className='border-0 shadow-none bg-transparent'
						placeholder='Search Subject...'
						value={search}
						onChange={(e: any) => setSearch(e.target.value)}
					/>

					<SubheaderSeparator />
				</SubHeaderLeft>

				<SubHeaderRight>
					<Button
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
					</Button>

					<SubheaderSeparator />

					<Button
						color='info'
						icon='AddCircle'
						isLight
						onClick={() => {
							setEditSubjectData(null);
							setSubjectData(SubjectModal);
							setIsSubjectModalOpen(true);
						}}>
						Add New Subject
					</Button>
				</SubHeaderRight>
			</SubHeader>

			<Page container='fluid'>
				<SubjectList
					subjects={subjects}
					isLoading={isLoading}
					hasNextPage={hasNextPage}
					isFetchingNextPage={isFetchingNextPage}
					fetchNextPage={fetchNextPage}
					onEdit={handleEdit}
					onDelete={handleDelete}
				/>

				<SubjectForm
					isOpen={isSubjectModalOpen}
					toggle={closeModal}
					subjectData={subjectData}
					handleChange={handleChange}
					onSubmit={handleSubmitSubject}
					isEdit={!!editSubjectData}
				/>
			</Page>
		</PageWrapper>
	);
};

export default SubjectPage;
