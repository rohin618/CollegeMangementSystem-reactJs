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
import StudentForm from './studentForm';
import { IStudent } from '../../../common/interface/student';
import { QUERY_KEY } from '../../../common/constant';
import { getAllSemesters } from '../../../common/api/semester';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAllAcademicBatches } from '../../../common/api/academicBatch';
import { getAllDepartments } from '../../../common/api/departments';
import { StudentModal } from '../../../common/model/studentModal';
import { createStudent, getPaginatedStudents, updateStudent } from '../../../common/api/student';
import StudentList from './studentList';
import { useDebounce } from '../../../hooks/useDebounce';

const StudentPage = () => {
	const [studentData, setStudentData] = useState<Partial<IStudent>>(StudentModal);
	const [isEditMode, setIsEditMode] = useState(false);

	const [openStudentForm, setOpenStudentForm] = useState(false);

	const toggleForm = () => {
		setOpenStudentForm(!openStudentForm);
		setIsEditMode(false);
		setStudentData(StudentModal);
	};
	const [search, setSearch] = useState('');

	const [selectedDepartment, setSelectedDepartment] = useState<number | undefined>();

	const [selectedBatch, setSelectedBatch] = useState<number | undefined>();

	const [selectedSemester, setSelectedSemester] = useState<number | undefined>();

	const debouncedSearch = useDebounce(search, 500);
	const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
		queryKey: [
			QUERY_KEY.STUDENTS,
			debouncedSearch,
			selectedDepartment,
			selectedBatch,
			selectedSemester,
		],
		queryFn: ({ pageParam }) =>
			getPaginatedStudents({
				pageParam,
				search: debouncedSearch,
				departmentId: selectedDepartment,
				academicBatchId: selectedBatch,
				semesterId: selectedSemester,
			}),
		initialPageParam: 0,
		getNextPageParam: (lastPage) => (lastPage.last ? undefined : lastPage.pageNumber + 1),
	});

	const studentsList = useMemo(() => {
		return data?.pages?.flatMap((page: any) => page.content) || [];
	}, [data]);

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

	const { data: semesters = [] } = useQuery({
		queryKey: [QUERY_KEY.ALL_SEMESTERS],
		queryFn: getAllSemesters,
		staleTime: 3 * 60 * 1000,
		gcTime: 3 * 60 * 1000,
	});

	const onEdit = (data: IStudent) => {
		setStudentData(data);
		setOpenStudentForm(true);
		setIsEditMode(true);
	};

	const queryClient = useQueryClient();

	const createStudentMutation = useMutation({
		mutationFn: createStudent,
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: [QUERY_KEY.STUDENTS],
			});
		},
	});

	const updateStudentMutation = useMutation({
		mutationFn: ({ data }: { data: IStudent }) => updateStudent(data),

		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: [QUERY_KEY.STUDENTS],
			});
		},
	});

	const onSubmit = async (data: IStudent): Promise<void> => {
		if (isEditMode && data.id) {
			await updateStudentMutation.mutateAsync({
				data,
			});
		} else {
			await createStudentMutation.mutateAsync(data);
		}

		toggleForm();
	};
	const onDelete = async (id: number): Promise<void> => {};

	const handleChange = (e: any) => {
		const { name, value } = e.target;

		setStudentData((prevData) => ({
			...prevData,
			[name]: value,
		}));
	};
	return (
		<PageWrapper title={'demoPagesMenu.sales.subMenu.dashboard.text'}>
			<SubHeader>
				<SubHeaderLeft>
					<label
						className='border-0 bg-transparent cursor-pointer me-0'
						htmlFor='searchInput'>
						<Icon icon='Search' size='2x' color='primary' />
					</label>
					<Input
						id='searchInput'
						type='search'
						className='border-0 shadow-none bg-transparent'
						placeholder='Search Student...'
						value={search}
						onChange={(e: any) => setSearch(e.target.value)}
					/>
					{/* <SubheaderSeparator /> */}
					<SubheaderSeparator />
				</SubHeaderLeft>
				<SubHeaderRight>
					<Button color='primary' onClick={toggleForm}>
						Add Student
					</Button>
				</SubHeaderRight>
			</SubHeader>
			<Page container='fluid'>
				<StudentList
					students={studentsList}
					isLoading={isLoading}
					hasNextPage={hasNextPage}
					isFetchingNextPage={isFetchingNextPage}
					fetchNextPage={fetchNextPage}
					onEdit={onEdit}
					onDelete={(student) => onDelete(student.id)}
				/>

				<StudentForm
					isOpen={openStudentForm}
					toggleForm={toggleForm}
					studentData={studentData}
					handleChange={handleChange}
					isEditMode={isEditMode}
					onDelete={onDelete}
					onSubmit={onSubmit}
					departmentList={departments}
					semesterList={semesters}
					academicBatchList={academicBatches}
				/>
			</Page>
		</PageWrapper>
	);
};

export default StudentPage;
