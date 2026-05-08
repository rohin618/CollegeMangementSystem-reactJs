import React, { useState, useMemo } from 'react';
import {
	Page,
	PageWrapper,
	SubHeader,
	SubHeaderLeft,
	SubHeaderRight,
	SubheaderSeparator,
} from '../../../layout';

import {
	Card,
	CardHeader,
	CardBody,
	CardLabel,
	CardTitle,
	CardActions,
	Button,
	FormGroup,
	Select,
	Option,
	Spinner,
	Input,
	Popovers,
} from '../../../components/bootstrap';

import Icon from '../../../components/icon';
import ChartOfAccountsListCard from './component/ChartOfAccountsListCard';
import ChartOfAccountsCreateForm from './component/ChartOfAccountsCreateForm';

import { useQuery, useMutation } from '@tanstack/react-query';
import {
	createChartOfAccount,
	getAllChartOfAccounts,
	updateChartOfAccount,
	deleteChartOfAccount,
} from '../../../common/api/chartAccount';
import {
	CHART_OF_ACCOUNTS_CATEGORY_TYPE_LIST,
	CHART_OF_ACCOUNTS_STATUS_LIST,
} from '../../../common/data/option';
import Swal from 'sweetalert2';
import { SearchableSelect } from '../../../components/common';

const ChartOfAccountsPage = () => {
	const [isOpenForm, setIsOpenForm] = useState(false);
	const [editItem, setEditItem] = useState<any>(null);
	const [isFilterOpen, setFilterOpen] = useState<boolean>(false);

	const [filters, setFilters] = useState({
		categoryType: '',
		status: '',
	});

	const [searchValue, setSearchValue] = useState(''); // <-- ADDED

	/** --------------------------------------------------
	 * FETCH ACCOUNTS LIST
	 * -------------------------------------------------- */
	const {
		data: chartList = [],
		isLoading: isListLoading,
		refetch: reloadList,
	} = useQuery({
		queryKey: ['chartOfAccounts'],
		queryFn: getAllChartOfAccounts,
	});

	/** --------------------------------------------------
	 * MUTATIONS (WITH LOADING STATE)
	 * -------------------------------------------------- */
	const createMutation = useMutation({
		mutationFn: createChartOfAccount,
		onSuccess: () => reloadList(),
	});

	const updateMutation = useMutation({
		mutationFn: ({ id, data }: any) => updateChartOfAccount(id, data),
		onSuccess: () => reloadList(),
	});

	const deleteMutation = useMutation({
		mutationFn: deleteChartOfAccount,
		onSuccess: () => reloadList(),
	});

	const isSaving =
		createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

	/** --------------------------------------------------
	 * FORM OPEN/CLOSE
	 * -------------------------------------------------- */
	const openCreateForm = () => {
		setEditItem(null);
		setIsOpenForm(true);
	};

	const openEditForm = (item: any) => {
		setEditItem(item);
		setIsOpenForm(true);
	};

	const closeForm = () => setIsOpenForm(false);

	/** --------------------------------------------------
	 * FILTER LOGIC
	 * -------------------------------------------------- */
	const handleFilterChange = (e: any) => {
		const { name, value } = e.target;
		setFilters((prev) => ({ ...prev, [name]: value }));
	};

	const handleFilterReset = () => {
		setFilters({ categoryType: '', status: '' });
		setSearchValue(''); // optional: also clear search
	};

	/** --------------------------------------------------
	 * APPLY SEARCH + FILTERS
	 * -------------------------------------------------- */
const filteredList = useMemo(() => {
  const search = searchValue.toLowerCase();

  return chartList.filter((item: any) => {
    const categoryTypeStr = String(item.categoryType ?? '').toLowerCase();

    const matchesSearch =
      String(item.accountName ?? '').toLowerCase().includes(search) ||
      String(item.code ?? '').toLowerCase().includes(search) ||
      String(item.description ?? '').toLowerCase().includes(search) ||
      categoryTypeStr.includes(search);

    const matchesType = filters.categoryType
      ? String(item.categoryType) === String(filters.categoryType)
      : true;

    const matchesStatus =
      filters.status !== ''
        ? Number(item.status) === Number(filters.status)
        : true;

    return matchesSearch && matchesType && matchesStatus;
  });
}, [chartList, filters, searchValue]);


	/** --------------------------------------------------
	 * SAVE HANDLER
	 * -------------------------------------------------- */
	const handleSave = async (data: any) => {
		if (editItem) {
			updateMutation.mutate({ id: editItem.id, data });
		} else {
			createMutation.mutate(data);
		}
	};

	const handleOpenDeleteInvoice = (id: string) => {
		Swal.fire({
			title: 'Are you sure?',
			text: "You won't be able to revert this!",
			icon: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Yes, delete it!',
			cancelButtonText: 'Cancel',
			confirmButtonColor: '#3085d6',
			cancelButtonColor: '#d33',
			customClass: {
				popup: 'my-swal-popup',
				confirmButton: 'btn btn-light-info',
				cancelButton: 'btn btn-light-danger',
			},
		}).then(async (result) => {
			if (!result.isConfirmed) return;
			await deleteMutation.mutate(id);
		});
	};

	return (
		<PageWrapper title='Chart of Accounts'>
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
						placeholder='Search account by name, code, type...'
						onChange={(e: any) => setSearchValue(e.target.value)}
						value={searchValue}
					/>

					<SubheaderSeparator />
				</SubHeaderLeft>

				<SubHeaderRight>
					<Button
						icon='FilterAlt'
						color='dark'
						isLight
						className='btn-only-icon position-relative'
						aria-label='Filter'
						onClick={() => setFilterOpen(!isFilterOpen)}>
						{chartList?.length !== filteredList.length && (
							<Popovers desc='Filtering applied' trigger='hover'>
								<span className='position-absolute top-0 start-100 translate-middle badge border border-light rounded-circle bg-danger p-2'>
									<span className='visually-hidden'>there is filtering</span>
								</span>
							</Popovers>
						)}
					</Button>
					<SubheaderSeparator />
					<Button color='info' isLight icon='AddCircle' onClick={openCreateForm}>
						Add Account
					</Button>
				</SubHeaderRight>
			</SubHeader>

			<Page container='fluid'>
				{isFilterOpen && (
					<Card>
						<CardHeader>
							<div className='d-flex justify-content-between align-items-center w-100'>
								{/* Left Side */}
								<div className='d-flex align-items-center gap-2 cursor-pointer'>
									<h5 className='mb-0 d-flex align-items-center gap-2'>
										<Icon icon='FilterAlt' color='primary' />
										Filters
									</h5>
								</div>

								{/* Right Side: Reset */}
								<Button
									color='link'
									className='text-decoration-none text-primary fw-semibold p-0 d-flex align-items-center gap-1'
									onClick={handleFilterReset}
									isDisable={isSaving}>
									<Icon icon='Refresh' size='lg' className='text-primary' />
									Reset
								</Button>
							</div>
						</CardHeader>
						<CardBody>
							<div className='row mb-4 align-items-center'>
								{/* ACCOUNT TYPE */}
								<div className='col-md-3'>
									<FormGroup label='Account Type' id='accountType' isFloating>
										<SearchableSelect
											id='accountType'
											name='categoryType'
											value={filters.categoryType}
											onChange={handleFilterChange}
											disabled={isSaving} options={CHART_OF_ACCOUNTS_CATEGORY_TYPE_LIST} placeholder='Select Account Type' />

									</FormGroup>
								</div>

								{/* STATUS FILTER */}
								<div className='col-md-3'>
									<FormGroup label='Status' id='status' isFloating>
										<SearchableSelect
											id='status'
											name='status'
											value={filters.status}
											onChange={handleFilterChange}
											disabled={isSaving} options={CHART_OF_ACCOUNTS_STATUS_LIST} placeholder='Select Status' />

									</FormGroup>
								</div>
							</div>
						</CardBody>
					</Card>
				)}
				<Card>
					<CardHeader>
						<CardLabel icon='ManageAccounts'>
							<CardTitle tag='div'>Chart of Accounts</CardTitle>
							<CardActions className='text-muted'>
								Total Records: {filteredList.length}
							</CardActions>
						</CardLabel>
					</CardHeader>

					<CardBody style={{ overflow: 'scroll' }}>
						{/* FILTER AREA */}

						{/* TABLE OR LOADING */}
						{isListLoading || deleteMutation.isPending ? (
							<div className='text-center py-5'>
								<Spinner color='primary' size='3x' />
								<div className='mt-2'>Loading accounts...</div>
							</div>
						) : (
							<ChartOfAccountsListCard
								chartList={filteredList}
								onEdit={openEditForm}
								onDelete={(id: any) => handleOpenDeleteInvoice(id)}
							/>
						)}
					</CardBody>
				</Card>

				{/* FORM MODAL */}
				<ChartOfAccountsCreateForm
					isOpen={isOpenForm}
					toggle={closeForm}
					onSave={handleSave}
					editData={editItem}
					isSaving={isSaving}
				/>

				{/* FULL SCREEN LOADER */}
				{isSaving && (
					<div
						className='position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center'
						style={{ background: 'rgba(255,255,255,0.6)', zIndex: 2000 }}>
						<Spinner size='3x' color='primary' />
					</div>
				)}
			</Page>
		</PageWrapper>
	);
};

export default ChartOfAccountsPage;
