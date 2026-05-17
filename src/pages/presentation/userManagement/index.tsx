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

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useInfiniteQuery, useMutation } from '@tanstack/react-query';

import CreateUsersModal from './components/createUserModal';
import UserList from './components/userList';


import { useRemoveInfiniteQueryItemById } from '../../../hooks/useRemoveInfiniteQueryItemById';
import { useUpdateInfiniteQueryItemById } from '../../../hooks/useUpdateInfiniteQueryItemById';
import { deleteUserById, getPaginatedUsers } from '../../../common/api/userManagement';
import { showAlert } from '../../../helpers/alerts';
import { QUERY_KEY } from '../../../common/constant';
import { useDebounce } from '../../../hooks/useDebounce';




const UserManagementPage = () => {
	const [isFilterOpen, setFilterOpen] = useState(false);

	const [search, setSearch] = useState('');
	const debouncedSearch = useDebounce(search, 500);

	const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
	const [editUserData, setEditUserData] = useState<any>(null);

	const toggleCreateUserModal = () => {
		setIsCreateUserModalOpen((prev) => !prev);
	};

	const {
		data,
		isLoading,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useInfiniteQuery({
		queryKey: [QUERY_KEY.USERS, debouncedSearch],
		queryFn: ({ pageParam }) =>
			getPaginatedUsers({
				pageParam,
				search: debouncedSearch,
			}),
		initialPageParam: 0,
		getNextPageParam: (lastPage) =>
			lastPage.last ? undefined : lastPage.pageNumber + 1,
		staleTime: 5 * 60 * 1000,
	});

	const updateUserCache = useUpdateInfiniteQueryItemById<any>([
		QUERY_KEY.USERS,
		debouncedSearch,
	]);

	const { removeItemById } = useRemoveInfiniteQueryItemById([
		QUERY_KEY.USERS,
		debouncedSearch,
	]);

	const deleteMutation = useMutation({
		mutationFn: deleteUserById,
		onSuccess: (_, userId) => {
			removeItemById(userId);
		},
	});

	const users = useMemo(() => {
		return data?.pages?.flatMap((page: any) => page.content) || [];
	}, [data]);

	const handleEdit = (user: any) => {
		setEditUserData(user);
		setIsCreateUserModalOpen(true);
	};

	const handleDelete = (user: any) => {
		showAlert({
			title: 'Are you sure?',
			text: `You are about to delete ${user.username}. This action cannot be reverted.`,
			icon: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Yes, delete it!',
			cancelButtonText: 'Cancel',

			onConfirm: async () => {
				await deleteMutation.mutateAsync(user.id);
			},
		});
	};

	const handleModalClose = () => {
		setEditUserData(null);
		setIsCreateUserModalOpen(false);
	};

	return (
		<PageWrapper title='Users'>
			<SubHeader>
				<SubHeaderLeft>
					<label
						className='border-0 bg-transparent cursor-pointer me-0'
						htmlFor='userSearch'>
						<Icon icon='Search' size='2x' color='primary' />
					</label>

					<Input
						id='userSearch'
						type='search'
						className='border-0 shadow-none bg-transparent'
						placeholder='Search User by name...'
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
						className='btn-only-icon position-relative'
						aria-label='Filter'
						onClick={() => setFilterOpen(!isFilterOpen)}>
						<Popovers desc='Filtering applied' trigger='hover'>
							<span className='position-absolute top-0 start-100 translate-middle badge border border-light rounded-circle bg-danger p-2'>
								<span className='visually-hidden'>filter active</span>
							</span>
						</Popovers>
					</Button>

					<SubheaderSeparator />

					<Button
						color='info'
						icon='AddCircle'
						isLight
						onClick={() => {
							setEditUserData(null);
							toggleCreateUserModal();
						}}>
						Add New User
					</Button>
				</SubHeaderRight>
			</SubHeader>

			<Page container='fluid'>
				<UserList
					users={users}
					isLoading={isLoading}
					hasNextPage={hasNextPage}
					isFetchingNextPage={isFetchingNextPage}
					fetchNextPage={fetchNextPage}
					onEdit={handleEdit}
					onDelete={handleDelete}
				/>

				<CreateUsersModal
					isOpen={isCreateUserModalOpen}
					toggle={handleModalClose}
					editUserData={editUserData}
					onUpdateSuccess={updateUserCache}
				/>
			</Page>
		</PageWrapper>
	);
};

export default UserManagementPage;