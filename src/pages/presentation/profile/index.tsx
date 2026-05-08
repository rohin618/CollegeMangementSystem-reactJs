import React, { useEffect, useState } from 'react';
import { SubHeaderLeft, SubHeaderRight, SubHeader, Page, PageWrapper } from '../../../layout';
import { Button } from '../../../components/bootstrap';
import { AccountActivity, ChangePassword, UserProfileView } from './component';
import { getUserById, updateUser } from '../../../common/api/user';
import { EXIST_SESSION_STORAGE_NAMES, NOTIFY_TYPE } from '../../../common/constant';
import { getStorage, notifyEntity } from '../../../helpers/helpers';
import { useGetAllCompanyList } from '../../../hooks/useGetAllCompanyList';

const Profile = () => {
	const [isEditMode, setIsEditMode] = useState(false);
	const [userData, setUserData] = useState<any>(null);

	// Fetch companies
	const { data: companyData = [], isLoading: isLoadingCompany } = useGetAllCompanyList();

	// Fetch user info
	useEffect(() => {
		const fetchUser = async () => {
			try {
				const sessionUser = getStorage(EXIST_SESSION_STORAGE_NAMES.CURRENT_USER_INFO);
				if (!sessionUser?.id) {
					notifyEntity(
						'User Not Found',
						NOTIFY_TYPE.ERROR,
					);
					return;
				}
				const res = await getUserById(sessionUser.id);
				if (res) setUserData(res);
			} catch (err) {
				console.error('Error fetching user:', err);

			}
		};
		fetchUser();
	}, []);

	const handleSave = async (updatedData: any) => {
		try {
			if (!updatedData?.id) return;
			const res = await updateUser(updatedData.id, updatedData);
			setUserData(res); // full object returned

			setIsEditMode(false);
		} catch (err) {
			console.error('Error updating user:', err);

		}
	};

	return (
		<PageWrapper title='Profile'>
			<SubHeader>
				<SubHeaderLeft>
					<div className='my-2'>
						<div className='h2 mb-0 fw-bold'>Profile</div>
						<span className='text-muted'>
							Manage your account settings and preferences
						</span>
					</div>
				</SubHeaderLeft>
				<SubHeaderRight>
					<Button
						color='info'
						isLight
						icon={!isEditMode ? 'Edit' : undefined}
						onClick={() => setIsEditMode((prev) => !prev)}
						isDisable={!userData || isLoadingCompany}>
						{isEditMode ? 'Cancel' : 'Edit'}
					</Button>
				</SubHeaderRight>
			</SubHeader>

			<Page container='fluid'>
				<div className='row g-3'>
					{/* Left - Profile Form */}
					<div className='col-lg-8'>
						{userData ? (
							<UserProfileView
								userEditFormObject={userData}
								isEditMode={isEditMode}
								companyList={companyData.map((c: any) => ({
									id: c.id,
									name: c.name ?? '',
								}))}
								onSave={handleSave}
								onCancel={() => setIsEditMode(false)}
							/>
						) : (
							<p>Loading user data...</p>
						)}
					</div>

					{/* Right - Change Password & Activity */}
					<div className='col-lg-4'>
						<ChangePassword />
						<AccountActivity
							createdAt={
								userData?.createdAt
									? new Date(userData.createdAt.seconds * 1000).toLocaleString()
									: 'N/A'
							}
							lastUpdated={
								userData?.updated?.length
									? new Date(
										userData.updated[userData.updated.length - 1]?.date?.seconds * 1000
									).toLocaleString()
									: 'N/A'
							}
						/>

					</div>
				</div>
			</Page>
		</PageWrapper>
	);
};

export default Profile;
