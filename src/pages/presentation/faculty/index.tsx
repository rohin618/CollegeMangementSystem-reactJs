import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
	SubHeaderLeft,
	SubheaderSeparator,
	SubHeader,
	Page,
	PageWrapper,
	SubHeaderRight,
} from '../../../layout';
import Icon from '../../../components/icon';
import { Button, Input } from '../../../components/bootstrap';
import { QUERY_KEY } from '../../../common/constant';
import { FacultyModal } from '../../../common/model/facultyModal';
import { IFaculty } from '../../../common/interface/faculty';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { showAlert } from '../../../helpers/alerts';
import {
	createFaculty,
	deleteFacultyById,
	getPaginatedFaculties,
	updateFaculty,
} from '../../../common/api/faculty';
import { getAllDepartments } from '../../../common/api/departments';
import { useDebounce } from '../../../hooks/useDebounce';
import FacultyForm from './facultyForm';
import FacultyList from './facultyList';

const EmployeePage = () => {
	const [facultyData, setFacultyData] = useState<Partial<IFaculty>>(FacultyModal);
	const [selectedDepartment, setSelectedDepartment] = useState<number | undefined>();

	const [isEditMode, setIsEditMode] = useState(false);

	const [openFacultyForm, setOpenFacultyForm] = useState(false);

	const [search, setSearch] = useState('');
	const debouncedSearch = useDebounce(search, 500);
	const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
		queryKey: [QUERY_KEY.FACULTIES, debouncedSearch, selectedDepartment],

		queryFn: ({ pageParam }) =>
			getPaginatedFaculties({
				pageParam,
				search: debouncedSearch,
				departmentId: selectedDepartment,
			}),

		initialPageParam: 0,

		getNextPageParam: (lastPage) => (lastPage.last ? undefined : lastPage.pageNumber + 1),
	});
	const toggleForm = () => {
		setOpenFacultyForm((prev) => !prev);

		if (openFacultyForm) {
			setFacultyData(FacultyModal);
			setIsEditMode(false);
		}
	};
	const faculties = useMemo(() => {
		return data?.pages?.flatMap((page: any) => page.content) || [];
	}, [data]);
	const queryClient = useQueryClient();
	const { data: departments = [] } = useQuery({
		queryKey: [QUERY_KEY.ALL_DEPARTMENTS],
		queryFn: getAllDepartments,
		staleTime: 3 * 60 * 1000,
		gcTime: 3 * 60 * 1000,
	});

	const createFacultyMutation = useMutation({
		mutationFn: createFaculty,
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: [QUERY_KEY.FACULTIES],
			});
		},
	});
	const handleEdit = (faculty: IFaculty) => {
		setFacultyData(faculty);
		setIsEditMode(true);
		setOpenFacultyForm(true);
	};
	const handleChange = (e: any) => {
		const { name, value } = e.target;

		setFacultyData((prev) => ({
			...prev,
			[name]: value,
		}));
	};
	const handleDelete = async (faculty: IFaculty) => {
		showAlert({
			title: 'Delete Faculty?',
			text: `Are you sure you want to delete ${faculty.firstName} ${faculty.lastName}?`,
			icon: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Yes, Delete',
			cancelButtonText: 'Cancel',

			onConfirm: async () => {
				await deleteFacultyMutation.mutateAsync(faculty.id);
			},
		});
	};
	const handleSubmit = async (data: IFaculty): Promise<void> => {
		if (isEditMode && data.id) {
			await updateFacultyMutation.mutateAsync({
				id: data.id,
				data,
			});
		} else {
			await createFacultyMutation.mutateAsync(data);
		}

		toggleForm();
	};
	const deleteFacultyMutation = useMutation({
		mutationFn: deleteFacultyById,
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: [QUERY_KEY.FACULTIES],
			});
		},
	});
	const updateFacultyMutation = useMutation({
		mutationFn: ({ id, data }: { id: number; data: IFaculty }) => updateFaculty(id, data),

		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: [QUERY_KEY.FACULTIES],
			});
		},
	});
	return (
		<PageWrapper title='Faculties'>
			<SubHeader>
				<SubHeaderLeft>
					<label
						className='border-0 bg-transparent cursor-pointer me-0'
						htmlFor='facultySearch'>
						<Icon icon='Search' size='2x' color='primary' />
					</label>

					<Input
						id='facultySearch'
						type='search'
						className='border-0 shadow-none bg-transparent'
						placeholder='Search Faculty...'
						value={search}
						onChange={(e: any) => setSearch(e.target.value)}
					/>

					<SubheaderSeparator />
				</SubHeaderLeft>

				<SubHeaderRight>
					<Button
						color='info'
						icon='AddCircle'
						isLight
						onClick={() => {
							setFacultyData(FacultyModal);
							setIsEditMode(false);
							setOpenFacultyForm(true);
						}}>
						Add Faculty
					</Button>
				</SubHeaderRight>
			</SubHeader>

			<Page container='fluid'>
				<FacultyList
					faculties={faculties}
					isLoading={isLoading}
					hasNextPage={hasNextPage}
					isFetchingNextPage={isFetchingNextPage}
					fetchNextPage={fetchNextPage}
					onEdit={handleEdit}
					onDelete={handleDelete}
				/>

				<FacultyForm
					isOpen={openFacultyForm}
					toggleForm={toggleForm}
					facultyData={facultyData}
					handleChange={handleChange}
					isEditMode={isEditMode}
					onSubmit={handleSubmit}
					departmentList={departments}
				/>
			</Page>
		</PageWrapper>
	);
};

export default EmployeePage;
