import {
	PageWrapper,
	SubHeader,
	SubHeaderLeft,
	SubheaderSeparator,
	SubHeaderRight,
	Page,
} from '../../../layout';
import Icon from '../../../components/icon';
import { Popovers, Button, Input } from '../../../components/bootstrap';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import CreateUsersModal from './components/createUserModal';

import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers } from '../../../features/users/userThunk';
import { RootState } from '../../../store/store';
import UserList from './components/userList';

const UserManagementPage = () => {
	const [isFilterOpen, setFilterOpen] = useState<Boolean>(false);
	const [searchParams] = useSearchParams();
	const statusParam = searchParams.get('status');

	const dispatch = useDispatch();
	const { users, loading } = useSelector((state: RootState) => state.users);

	useEffect(() => {
		dispatch(fetchUsers() as any);
	}, []);

	const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
	const toggleCreateUserModal = () => {
		setIsCreateUserModalOpen(!isCreateUserModalOpen);
	};
	const [filters, setFilters] = useState({});

	useEffect(() => {
		setFilters((prev) => ({
			...prev,
			residentStatus: statusParam ? statusParam : '',
		}));
		statusParam && setFilterOpen(true);
	}, [statusParam]);

	const handleFilterChange = (key: string, value: any) => {
		if (key === 'RESET') {
			setFilters({});
			return;
		}
		setFilters((prev) => {
			if (key === 'fundSource') {
				return { ...prev, fundSource: value, laId: '', icbId: '' };
			}
			return { ...prev, [key]: value };
		});
	};

	return (
		<PageWrapper title={'Resident'}>
			<SubHeader>
				<SubHeaderLeft>
					<label
						className='border-0 bg-transparent cursor-pointer me-0'
						htmlFor='residentName'>
						<Icon icon='Search' size='2x' color='primary' />
					</label>
					<Input
						id='residentName'
						type='search'
						className='border-0 shadow-none bg-transparent'
						placeholder='Search Resident by name...'
						onChange={(e: any) => handleFilterChange('residentName', e.target.value)}
						// value={filters.residentName}
					/>
					{/* <SubheaderSeparator /> */}
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
						<Popovers desc='Filtering applied' trigger='hover'>
							<span className='position-absolute top-0 start-100 translate-middle badge border border-light rounded-circle bg-danger p-2'>
								<span className='visually-hidden'>there is filtering</span>
							</span>
						</Popovers>
					</Button>
					<SubheaderSeparator />

					<Button color='info' icon='AddCircle' isLight onClick={toggleCreateUserModal}>
						Add New User
					</Button>
				</SubHeaderRight>
			</SubHeader>
			<Page container='fluid'>
                <UserList users={users} isLoading={loading} />
				<CreateUsersModal isOpen={isCreateUserModalOpen} toggle={toggleCreateUserModal} />
			</Page>
		</PageWrapper>
	);
};

export default UserManagementPage;
