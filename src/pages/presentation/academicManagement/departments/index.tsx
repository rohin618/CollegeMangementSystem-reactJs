import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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

import { IDepartment } from '../../../../common/interface/departments';

import {
	createDepartment,
	deleteDepartmentById,
	getAllDepartments,
	updateDepartment,
} from '../../../../common/api/departments';

import DepartmentFormModal from './departmentForm';
import DepartmentList from './departmentList';

import { DepartmentModal } from '../../../../common/model/departmentModal';
import { QUERY_KEY } from '../../../../common/constant';
import { showAlert } from '../../../../helpers/alerts';
import { useSearch } from '../../../../hooks';

const DepartmentPage = () => {
	const queryClient = useQueryClient();



	const [isDepartmentModalOpen, setIsDepartmentModalOpen] = useState(false);

	const [departmentData, setDepartmentData] = useState<Partial<IDepartment>>(DepartmentModal);

	const [editDepartmentData, setEditDepartmentData] = useState<IDepartment | null>(null);

	/*
	|--------------------------------------------------------------------------
	| Query
	|--------------------------------------------------------------------------
	*/
	const { data: departments = [], isLoading } = useQuery({
		queryKey: [QUERY_KEY.DEPARTMENTS],
		queryFn: getAllDepartments,
	});

	/*
	|--------------------------------------------------------------------------
	| Filtered Departments
	|--------------------------------------------------------------------------
	*/
	
    const searchKeys = useMemo(() => ["code", "name"], []);
    const { searchValue, setSearchValue, filteredList: filteredDepartments } = useSearch(departments || [], searchKeys);

	/*
	|--------------------------------------------------------------------------
	| Modal
	|--------------------------------------------------------------------------
	*/
	const toggleDepartmentModal = () => {
		setIsDepartmentModalOpen((prev) => !prev);

		if (isDepartmentModalOpen) {
			setDepartmentData(DepartmentModal);
			setEditDepartmentData(null);
		}
	};
	const closeDepartmentModal = () => {
		setIsDepartmentModalOpen(false);
		setDepartmentData(DepartmentModal);
		setEditDepartmentData(null);
	};
	/*
	|--------------------------------------------------------------------------
	| Input Change
	|--------------------------------------------------------------------------
	*/
	const handleChange = (e: any) => {
		const { name, value } = e.target;

		setDepartmentData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	/*
	|--------------------------------------------------------------------------
	| Edit
	|--------------------------------------------------------------------------
	*/
	const handleEdit = (department: IDepartment) => {
		setEditDepartmentData(department);
		setDepartmentData(department);
		setIsDepartmentModalOpen(true);
	};

	/*
	|--------------------------------------------------------------------------
	| Mutations
	|--------------------------------------------------------------------------
	*/
	const createDepartmentMutation = useMutation({
		mutationFn: createDepartment,
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: [QUERY_KEY.DEPARTMENTS],
			});

			closeDepartmentModal();
		},
	});

	const updateDepartmentMutation = useMutation({
		mutationFn: ({ id, data }: { id: number; data: any }) => updateDepartment(id, data),

		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: [QUERY_KEY.DEPARTMENTS],
			});

			closeDepartmentModal();
		},
	});

	const deleteDepartmentMutation = useMutation({
		mutationFn: deleteDepartmentById,
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: [QUERY_KEY.DEPARTMENTS],
			});
		},
	});

	/*
	|--------------------------------------------------------------------------
	| Submit
	|--------------------------------------------------------------------------
	*/
	const handleSubmitDepartment = async () => {
		if (editDepartmentData?.id) {
			await updateDepartmentMutation.mutateAsync({
				id: editDepartmentData.id,
				data: departmentData,
			});
		} else {
			await createDepartmentMutation.mutateAsync(departmentData as any);
		}
	};

	/*
	|--------------------------------------------------------------------------
	| Delete
	|--------------------------------------------------------------------------
	*/
	const handleDelete = async (department: IDepartment) => {
		const result = await showAlert({
			title: 'Delete Department?',
			text: `Are you sure you want to delete ${department.name}?`,
			icon: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Yes, Delete',
			cancelButtonText: 'Cancel',
			onConfirm: async () => {
				await deleteDepartmentMutation.mutateAsync(department.id);
			},
		});
	};

	return (
		<PageWrapper title='Departments'>
			<SubHeader>
				<SubHeaderLeft>
					<label
						className='border-0 bg-transparent cursor-pointer me-0'
						htmlFor='departmentSearch'>
						<Icon icon='Search' size='2x' color='primary' />
					</label>

					<Input
						id='departmentSearch'
						type='search'
						className='border-0 shadow-none bg-transparent'
						placeholder='Search Department by name...'
						value={searchValue}
						onChange={(e: any) => setSearchValue(e.target.value)}
					/>

					<SubheaderSeparator />
				</SubHeaderLeft>

				<SubHeaderRight>
					<Button
						icon='FilterAlt'
						color='dark'
						isLight
						className='btn-only-icon position-relative'
						>
						{searchValue !== "" && <Popovers desc='Filtering applied' trigger='hover'>
							<span className='position-absolute top-0 start-100 translate-middle badge border border-light rounded-circle bg-danger p-2'>
								<span className='visually-hidden'>filter active</span>
							</span>
						</Popovers>}
					</Button>

					<SubheaderSeparator />

					<Button
						color='info'
						icon='AddCircle'
						isLight
						onClick={() => {
							setEditDepartmentData(null);
							setDepartmentData(DepartmentModal);
							setIsDepartmentModalOpen(true);
						}}>
						Add New Department
					</Button>
				</SubHeaderRight>
			</SubHeader>

			<Page container='fluid'>
				<DepartmentList
					departments={filteredDepartments}
					isLoading={isLoading}
					onEdit={handleEdit}
					onDelete={handleDelete}
				/>
			</Page>

			<DepartmentFormModal
				isOpen={isDepartmentModalOpen}
				toggle={toggleDepartmentModal}
				departmentData={departmentData}
				handleChange={handleChange}
				onSubmit={handleSubmitDepartment}
				isEdit={!!editDepartmentData}
			/>
		</PageWrapper>
	);
};

export default DepartmentPage;
