import { useMemo, useState } from 'react';
import { getColorNameWithIndex } from '../../../../../common/data/enumColors';
import {
	Alert,
	Button,
	Card,
	CardBody,
	CardHeader,
	CardLabel,
	CardSubTitle,
	CardTitle,
	Spinner,
} from '../../../../../components/bootstrap';
import { ResidentProfileCard } from '../../../../../components/common';
import { useQuery } from '@tanstack/react-query';
import useDarkMode from '../../../../../hooks/useDarkMode';
import { getAllResidentWithInvoice } from '../../../../../common/api/resident';
import {
	DATA_MIGRATION_TO_DATE,
	FUND_SOURCE_TYPE,
	PLACEMENT_TYPE,
	RESPITE_STATUS_TYPE,
} from '../../../../../common/constant';
import { getActiveFundDetails, getActiveRespiteDetails } from '../../../../../helpers/helpers';
import { InvoiceCreateAndUpdateForm } from '../../../invoice/component';
import moment from 'moment';

export const DepositResidentInvoiceInfoCard = () => {
	const { darkModeStatus } = useDarkMode();

	const {
		data: residentListWithInvoice = [],
		isLoading,
		isError,
	} = useQuery({
		queryKey: ['residentListWithInvoice'],
		queryFn: getAllResidentWithInvoice,
	});

	const [isInvoiceEditFormOpen, setIsInvoiceEditFormOpen] = useState(false);

	/**
	 * ✅ Filter only PRIVATE residents without deposit invoice
	 */
	const depositPendingResidents = useMemo(() => {
		return residentListWithInvoice.filter((resident: any) => {
			const activeFund = getActiveFundDetails(resident?.fundDetails);

			const isPrivate = activeFund?.fundSource === FUND_SOURCE_TYPE.PRIVATE;

			const hasDepositInvoice =
				!!resident?.depositInvoiceId && resident.depositInvoiceId.trim() !== '';

			const isAfterMigrationDate = moment(resident?.admission?.admissionDate).isAfter(
				moment(DATA_MIGRATION_TO_DATE),
				'day',
			);

			// permanent condition
			const activeRespite = getActiveRespiteDetails(resident?.admission?.respiteStatusList);
			let placementType = resident?.admission?.typeOfPlacement;
			if (activeRespite) {
				placementType =
					+activeRespite?.status === RESPITE_STATUS_TYPE.EXTENDED_WITH_PERMANENT
						? PLACEMENT_TYPE.PERMANENT
						: PLACEMENT_TYPE.RESPITE;
			}
			const isPermanent = +placementType === PLACEMENT_TYPE.PERMANENT;

			return isPrivate && !hasDepositInvoice && isAfterMigrationDate && isPermanent;
		});
	}, [residentListWithInvoice]);

	return (
		<>
			<Card stretch>
				<CardHeader>
					<CardLabel icon='Payment' iconColor='info'>
						<CardTitle tag='div' className='h5'>
							Deposit Invoice
						</CardTitle>
						<CardSubTitle tag='div' className='h6'>
							Resident
						</CardSubTitle>
					</CardLabel>
				</CardHeader>

				<CardBody>
					<div
						style={{ maxHeight: '450px', overflowY: 'auto', scrollbarWidth: 'thin' }}
						className='px-3 py-2'>
						{/* Loader */}
						{isLoading && (
							<div className='d-flex justify-content-center py-6'>
								<Spinner size='lg' />
							</div>
						)}

						{/* Error */}
						{isError && (
							<Alert variant='destructive' className='my-4'>
								<strong>Error:</strong> Failed to load deposit invoices.
							</Alert>
						)}

						{/* Content */}
						{!isLoading && !isError && (
							<>
								{depositPendingResidents.length > 0 ? (
									<div className='row g-3'>
										{depositPendingResidents?.map(
											(resident: any, index: number) => (
												<DepositResidentRow
													key={resident.id}
													resident={resident}
													index={index}
													setIsInvoiceEditFormOpen={
														setIsInvoiceEditFormOpen
													}
												/>
											),
										)}
									</div>
								) : (
									<div className='text-center text-muted py-5'>
										<i className='bi bi-check-circle fs-2 mb-2 text-success'></i>
										<p className='mb-0'>
											All private residents have deposit invoices.
										</p>
									</div>
								)}
							</>
						)}
					</div>
				</CardBody>
			</Card>
			<InvoiceCreateAndUpdateForm
				toggle={() => setIsInvoiceEditFormOpen(!isInvoiceEditFormOpen)}
				isOpen={isInvoiceEditFormOpen}
			/>
		</>
	);
};

const DepositResidentRow = ({ resident, index, setIsInvoiceEditFormOpen }: any) => {
	const [isOpen, setIsOpen] = useState(false);
	const colorIndex = getColorNameWithIndex(index);

	return (
		<div className='col-12'>
			<div className='row g-2 align-items-center'>
				<div className='col d-flex'>
					<ResidentProfileCard resident={resident} colorIndex={colorIndex} />
				</div>

				<div className='col-auto'>
					<Button
						color='info'
						isLight
						icon='RemoveRedEye'
						onClick={() => setIsInvoiceEditFormOpen(true)}>
						Add
					</Button>
				</div>
			</div>

			{/* Future Modal */}
			{/* <DepositInvoiceDetailModal
        resident={resident}
        isOpen={isOpen}
        toggle={() => setIsOpen(false)}
      /> */}
		</div>
	);
};
