import React, { useState } from 'react';
import { IVendorModal } from '../../../../../common/interface/vendor';
import { vendorModal } from '../../../../../common/model/vendor';
import {
	useMultiSearch,
	useRemoveItemQueryListById,
	useUpdateQueryListById,
} from '../../../../../hooks';
import { useQuery } from '@tanstack/react-query';
import { createVendor, getAllVendors, updateVendor } from '../../../../../common/api/vendor';
import { QUERY_KEY, VENDOR_STATUS } from '../../../../../common/constant';
import { showAlert } from '../../../../../helpers/alerts';
import {
	Button,
	Card,
	CardActions,
	CardBody,
	CardHeader,
	CardLabel,
	CardTitle,
	Spinner,
} from '../../../../../components/bootstrap';
import VendorForm from './vendorForm';
import VendorList from './vendorList';
import VendorContracts from './vendorContracts';
import VendorRating from './vendorRating';
import VendorImportModal from './vendorImportModal';
import { getUserMappedCompanyId } from '../../../../../helpers/helpers';
import { useGetAllCompanyList } from '../../../../../hooks/useGetAllCompanyList';

const VendorPage: React.FC<{ search?: string }> = ({ search }) => {
	const [vendorFormData, setVendorFormData] = useState<IVendorModal>({ ...vendorModal });
	const [isEdit, setIsEdit] = useState(false);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [activeTab, setActiveTab] = useState<'details' | 'contracts' | 'rating'>('details');
	const [isImportOpen, setIsImportOpen] = useState(false);

	const updateVendorList = useUpdateQueryListById<any>([QUERY_KEY.VENDOR_LIST]);

	const { removeItemById: removeVendorById } = useRemoveItemQueryListById<any>({
		queryKey: [QUERY_KEY.VENDOR_LIST],
	});

	const { data: vendorList = [], isLoading: isVendorLoading } = useQuery({
		queryKey: [QUERY_KEY.VENDOR_LIST],
		queryFn: () => getAllVendors(),
		staleTime: 5 * 60 * 1000,
	});

	const { data: allCompanyList = [] } = useGetAllCompanyList();
	const allCompanyIds = allCompanyList.map((c: any) => c.id as string);

	const filteredVendorList = useMultiSearch(vendorList, { name: search });

	const onChangeVendor = (e: any) => {
		const { id, value, checked, type } = e.target;
		setVendorFormData((prev) => ({
			...prev,
			[id]: type === 'checkbox' ? checked : value,
		}));
	};

	const handleEmailsChange = (emails: any[]) => {
		setVendorFormData((prev) => ({ ...prev, emails }));
	};

	const handlePhonesChange = (phones: any[]) => {
		setVendorFormData((prev) => ({ ...prev, phones }));
	};

	const handleToggleModal = () => {
		setIsModalOpen(false);
		setVendorFormData({ ...vendorModal });
		setActiveTab('details');
	};

	const handleCreateVendor = async (extraPayload = {}) => {
		const payload = {
			...vendorFormData,
			...extraPayload,
		};

		const response = await createVendor(payload);
		updateVendorList(response);
	};
	const handleUpdateVendor = async (id: string | undefined) => {
		if (!id) return;
		const payload = {
			...vendorFormData,
		};
		const response = await updateVendor(id, payload);
		updateVendorList(response);
	};

	const handleEditVendor = (data: IVendorModal) => {
		setVendorFormData(data);
		setIsEdit(true);
		setIsModalOpen(true);
	};
	const handleCreateFormOpen = () => {
		setIsModalOpen(true);
		setIsEdit(false);
		setVendorFormData({ ...vendorModal });
	};

	const deleteVendor = async (data: IVendorModal) => {
		const id = data?.id;

		if (!id) return;
		showAlert({
			title: 'Are you sure?',
			text: "You won't be able to revert this!",
			icon: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Yes, delete it!',
			cancelButtonText: 'Cancel',

			onConfirm: async () => {
				const payload = {
					...vendorFormData,
					status: VENDOR_STATUS.DELETE,
				};
				await updateVendor(id, payload);
				removeVendorById(id);
			},
		});
	};


	return (
		<>
			<Card stretch>
				<CardHeader>
					<CardLabel icon='Storefront'>
						<CardTitle tag='div' className='h5'>
							Vendor List
						</CardTitle>
						<CardActions tag='div' className='text-muted'>
							Total records: {filteredVendorList?.length || 0}
						</CardActions>
					</CardLabel>
					<CardActions>
						<Button
							color='secondary'
							icon='Download'
							isLight
							onClick={() => setIsImportOpen(true)}>
							Import Vendor
						</Button>
						<Button
							color='primary'
							icon='AddCircle'
							isLight
							onClick={handleCreateFormOpen}>
							Add Vendor
						</Button>
					</CardActions>
				</CardHeader>

				<CardBody>
					{isVendorLoading ? (
						<div className='text-center py-5'>
							<Spinner color='info' size='3x' />
							<div className='mt-2'>Loading Vendor...</div>
						</div>
					) : (
						<>
							<VendorList
								vendorList={filteredVendorList}
								onEdit={handleEditVendor}
								onDelete={deleteVendor}
								isLoading={isVendorLoading}
								handleToggleVendorStatus={() => {}}
							/>
						</>
					)}
				</CardBody>
			</Card>

			<VendorImportModal
				isOpen={isImportOpen}
				toggle={() => setIsImportOpen(false)}
				currentCompanyId={getUserMappedCompanyId()?.companyId || ''}
				allCompanyIds={allCompanyIds}
				allCompanyList={allCompanyList}
				existingVendorList={vendorList}
				onImport={(imported) => {
					updateVendorList(imported);
					setIsImportOpen(false);
					showAlert({
						title: 'Imported!',
						text: `${imported.name} added to this home.`,
						icon: 'success',
						confirmButtonText: 'OK',
					});
				}}
			/>

			<VendorForm
				vendorData={vendorFormData}
				handleChange={onChangeVendor}
				isOpen={isModalOpen}
				toggle={handleToggleModal}
				onSubmit={
					isEdit ? () => handleUpdateVendor(vendorFormData?.id) : handleCreateVendor
				}
				isEdit={isEdit}
				vendorList={vendorList}
				onEmailsChange={handleEmailsChange}
				onPhonesChange={handlePhonesChange}
				activeTab={activeTab}
				setActiveTab={setActiveTab}
				contractsContent={
					activeTab === 'contracts' && vendorFormData.id ? (
						<VendorContracts
							vendorId={vendorFormData.id}
							companyId={getUserMappedCompanyId()?.companyId || ''}
						/>
					) : null
				}
				ratingContent={
					activeTab === 'rating' && vendorFormData.id ? (
						<VendorRating
							vendorId={vendorFormData.id}
							vendorData={vendorFormData}
							onSave={async (rating) => {
								await updateVendor(vendorFormData.id!, { ...vendorFormData, ...rating });
								updateVendorList({ ...vendorFormData, ...rating, id: vendorFormData.id });
								showAlert({
									title: 'Saved',
									text: 'Rating updated successfully',
									icon: 'success',
									confirmButtonText: 'OK',
								});
							}}
						/>
					) : null
				}
			/>
		</>
	);
};

export default VendorPage;
