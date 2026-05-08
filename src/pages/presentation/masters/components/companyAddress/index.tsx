import React, { useEffect, useState } from 'react';
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

import CompanyAddressForm from './companyAddressForm';
import CompanyAddressView from './companyAddressView';

import { companyAddressModal } from '../../../../../common/model/companyHeadOfficeAddress';
import { QUERY_KEY } from '../../../../../common/constant';

import {
    createHeadOfficeAddress,
	getHeadOfficeAddress,
    updateHeadOfficeAddress,
} from '../../../../../common/api/headOfficeAddress';

import { useQuery, useQueryClient } from '@tanstack/react-query';

interface companyAddressProps {
	search?: string;
}

const HeadOfficeAddress: React.FC<companyAddressProps> = () => {
	const queryClient = useQueryClient();

	const {
		data: headOfficeAddress,
		isLoading: isHeadOfficeLoading,
	} = useQuery({
		queryKey: [QUERY_KEY.HEAD_OFFICE_ADDRESS],
		queryFn: () => getHeadOfficeAddress(),
		staleTime: 5 * 60 * 1000,
	});

	const [companyAddress, setCompanyAddress] = useState<any>({
		...companyAddressModal,
	});

	const [isEdit, setIsEdit] = useState(false);
	const [isModalOpen, setIsModalOpen] = useState(false);

	/** populate form when data loaded */
	useEffect(() => {
		if (headOfficeAddress) {
			setCompanyAddress(headOfficeAddress);
			setIsEdit(true);
		}
	}, [headOfficeAddress]);

	const handleChange = (e: any) => {
		const { id, value } = e.target;

		setCompanyAddress((prev: any) => ({
			...prev,
			[id]: value,
		}));
	};

	const handleToggleModal = () => {
		setIsModalOpen(false);
	};

	const handleCreate = async () => {
		const response = await createHeadOfficeAddress(companyAddress);

		queryClient.setQueryData([QUERY_KEY.HEAD_OFFICE_ADDRESS], response);

		setIsModalOpen(false);
	};

	const handleUpdate = async () => {
		if (!companyAddress?.id) return;

		const response = await updateHeadOfficeAddress(companyAddress.id, companyAddress);

		queryClient.setQueryData([QUERY_KEY.HEAD_OFFICE_ADDRESS], response);

		setIsModalOpen(false);
	};

	const handleEdit = () => {
		setIsEdit(true);
		setIsModalOpen(true);
	};

	const handleCreateFormOpen = () => {
		setCompanyAddress(companyAddressModal);
		setIsEdit(false);
		setIsModalOpen(true);
	};

	return (
		<>
			<Card stretch>
				<CardHeader>
					<CardLabel icon='LocationOn'>
						<CardTitle tag='div' className='h5'>
							Head Office Address
						</CardTitle>
					</CardLabel>

					<CardActions>
						{headOfficeAddress ? (
							<Button
								color='info'
								icon='Edit'
								isLight
								onClick={handleEdit}>
								Edit
							</Button>
						) : (
							<Button
								color='primary'
								icon='AddCircle'
								isLight
								onClick={handleCreateFormOpen}>
								Add
							</Button>
						)}
					</CardActions>
				</CardHeader>

				<CardBody>
					{isHeadOfficeLoading ? (
						<div className='text-center py-5'>
							<Spinner color='info' size='3x' />
							<div className='mt-2'>Loading address...</div>
						</div>
					) : (
						<CompanyAddressView
							address={headOfficeAddress}
							onEdit={handleEdit}
						/>
					)}
				</CardBody>
			</Card>

			<CompanyAddressForm
				isOpen={isModalOpen}
				toggle={handleToggleModal}
				companyAddress={companyAddress}
				handleChange={handleChange}
				isEdit={isEdit}
				onSubmit={isEdit ? handleUpdate : handleCreate}
			/>
		</>
	);
};

export default HeadOfficeAddress;