


import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useInfiniteQuery, useMutation } from '@tanstack/react-query';
import { 	PageWrapper,
	SubHeader,
	SubHeaderLeft,
	SubheaderSeparator,
	SubHeaderRight,
	Page, } from '../../../../layout';
import { Button, Input, Popovers } from '../../../../components/bootstrap';
import Icon from '../../../../components/icon';

const useDebounce = (value: string, delay = 500) => {
	const [debouncedValue, setDebouncedValue] = useState(value);

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedValue(value);
		}, delay);

		return () => clearTimeout(timer);
	}, [value, delay]);

	return debouncedValue;
};

const AcademicBatchPage = () => {
	const [isFilterOpen, setFilterOpen] = useState(false);
	const [searchParams] = useSearchParams();
	const statusParam = searchParams.get('status');

	const [search, setSearch] = useState('');
	const debouncedSearch = useDebounce(search, 500);

	const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
	const [editUserData, setEditUserData] = useState<any>(null);

	const toggleCreateUserModal = () => {
		setIsCreateUserModalOpen((prev) => !prev);
	};



	const handleEdit = (user: any) => {
		setEditUserData(user);
		setIsCreateUserModalOpen(true);
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
				HEllow
			</Page>
		</PageWrapper>
	);
};

export default AcademicBatchPage;