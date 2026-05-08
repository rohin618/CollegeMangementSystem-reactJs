import React, { useState, useRef,  } from 'react';
import Swal from 'sweetalert2';
import classNames from 'classnames';
import { BankDetailsForm } from '../bankingDetailsForm';

import {
	Card,
	CardBody,
	CardHeader,
	CardLabel,
	CardTitle,
	Button,
	CardActions,
	Dropdown,
	DropdownItem,
	DropdownMenu,
	DropdownToggle,
} from '../../../../../../../components/bootstrap';
import SimpleReactValidator from 'simple-react-validator';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
	getAllBankDetailsByCompanyId,
	updateBankDetails,
} from '../../../../../../../common/api/bank';
import { bankModel } from '../../../../../../../common/model/bank';
import useDarkMode from '../../../../../../../hooks/useDarkMode';
import { useUpdateQueryListById } from '../../../../../../../hooks';
import { BANK_STATUS, PRIMARY_ACCOUNT } from '../../../../../../../common/constant';
import { priceFormat } from '../../../../../../../helpers/helpers';

export interface BankDetails {
	id?: string;
	companyId: number | string;
	openingBalance: number;
	bankName: string;
	accountName: string;
	accountNumber: string;
	sortCode: string;
	IBAN: string;
	BIC: string;
	bankAddress: string;
	status: number; // using BANK_STATUS
	primaryAccount: number | string;
}

interface Props {
	companyId: string;
}

export const BankDetails: React.FC<Props> = ({ companyId }) => {
	const queryClient = useQueryClient();
	const { darkModeStatus } = useDarkMode();
	const updateBankList = useUpdateQueryListById<any>(['bankDetails', companyId]);

	const [isOpenForm, setIsOpenForm] = useState(false);
	const [editBankObject, setEditBankObject] = useState<BankDetails | null>(null);
	const [formData, setFormData] = useState<BankDetails>({
		...bankModel,
		companyId,
	});
	const [isSubmitted, setIsSubmitted] = useState(false);
	const [isFormLoading, setIsFormLoading] = useState(false);

	const validator = useRef(new SimpleReactValidator());
	const {
		data: bankList = [],
		isLoading,
		isError,
	} = useQuery<BankDetails[]>({
		queryKey: ['bankDetails', companyId],

		queryFn: async () => {
			const result = await getAllBankDetailsByCompanyId(companyId);
			return result === '' ? [] : (result as BankDetails[]);
		},

		// queryFn: () => getAllBankDetailsByCompanyId(companyId),

		enabled: !!companyId,
		staleTime: 5 * 60 * 1000,
	});

	//Moved
	// useEffect(() => {
	//     if (editBankObject && Object.keys(editBankObject).length > 0) {
	//         setFormData(editBankObject);
	//     } else {
	//         setFormData({ ...bankModel, companyId });
	//     }
	//     return () => {
	//         setFormData({ ...bankModel, companyId });
	//     };
	// }, [editBankObject, companyId]);

	// Open Form for add
	const handleOpenFormModule = () => {
		setEditBankObject(null);
		setIsOpenForm(true);
	};

	// Close Form
	const handleCloseFormModule = () => {
		setIsOpenForm(false);
		setIsSubmitted(false);
		validator.current.hideMessages();
	};

	// Edit callback
	const handleOpenEditFormModule = (bank: BankDetails) => {
		setEditBankObject(bank);
		setIsOpenForm(true);
	};

	// // Input change  --- Moved
	// const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
	//     const { id, value } = e.target;
	//     setFormData((prev) => ({ ...prev, [id]: value }));
	// };

	// // Save  --- Moved
	// const handleSave = async (e?: React.FormEvent) => {
	//     if (e) e.preventDefault();
	//     setIsSubmitted(true);

	//     if (!validator.current.allValid()) {
	//         validator.current.showMessages();
	//         setFormData({ ...formData }); // Force re-render
	//         return;
	//     }

	//     setIsFormLoading(true);

	//     try {
	//         const res = formData?.id ? await updateBankDetails(formData?.id, { ...formData }) : await createBankDetails({ ...formData });

	//         updateBankList(res);
	//         setIsOpenForm(false);
	//         setEditBankObject(null);
	//     } catch (err) {
	//         console.error("Failed to save bank details:", err);
	//     } finally {
	//         setIsFormLoading(false);
	//         setIsSubmitted(false);
	//         validator.current.hideMessages();
	//         setFormData({ ...bankModel, companyId });
	//     }
	// };

	// Delete
	// const handleDelete = async (bank: BankDetails) => {
	//     if (!bank.id) return;
	//     if (!window.confirm("Are you sure you want to delete this bank detail?")) return;
	//     try {
	//         await deleteBankDetails(bank.id);
	//         queryClient.setQueryData<BankDetails[]>(["bankDetails", companyId], (old = []) =>
	//             old.filter(b => b.id !== bank.id)
	//         );
	//         // queryClient.invalidateQueries({ queryKey: ["bankDetails", companyId] });
	//     } catch (err) {
	//         console.error("Failed to delete:", err);
	//     }
	// };

	// Toggle active/deactive instead of delete
	// const handleToggleActive = async (bank: BankDetails) => {
	//     if (!bank.id) return;
	//     try {

	//         const newStatus = bank.status === BANK_STATUS.ACTIVE ? BANK_STATUS.INACTIVE : BANK_STATUS.ACTIVE;

	//         const response = await updateBankDetails(bank.id, {
	//             ...bank,
	//             status: newStatus,
	//         });

	//         // Update cache immediately
	//         updateBankList(response);

	//     } catch (err) {
	//         console.error("Failed to toggle active status:", err);
	//     }
	// };

	const handleToggleActive = async (bank: BankDetails) => {
		if (!bank.id) return;

		// If current status is ACTIVE, confirm before deactivation
		if (bank.status === BANK_STATUS.ACTIVE) {
			const result = await Swal.fire({
				title: 'Are you sure?',
				text: 'Do you really want to deactivate this bank?',
				icon: 'warning',
				showCancelButton: true,
				confirmButtonColor: '#d33',
				cancelButtonColor: '#3085d6',
				confirmButtonText: 'Yes, deactivate it!',
			});

			if (!result.isConfirmed) return; // stop if cancelled
		}

		try {
			const newStatus =
				bank.status === BANK_STATUS.ACTIVE ? BANK_STATUS.INACTIVE : BANK_STATUS.ACTIVE;

			const response = await updateBankDetails(bank.id, {
				...bank,
				status: newStatus,
			});

			// Update local list/cache
			updateBankList(response);

			// Show success alert
			// Swal.fire({
			//     title:
			//         newStatus === BANK_STATUS.ACTIVE
			//             ? 'Activated!'
			//             : 'Deactivated!',
			//     text:
			//         newStatus === BANK_STATUS.ACTIVE
			//             ? 'The bank has been activated successfully.'
			//             : 'The bank has been deactivated successfully.',
			//     icon: 'success',
			//     timer: 2000,
			//     showConfirmButton: false,
			// });
		} catch (err) {
			console.error('Failed to toggle active status:', err);
			// Swal.fire('Error', 'Something went wrong while updating.', 'error');
		}
	};

	const setPrimaryBankAccount = async (bank: any) => {
		try {
			const currentPrimary = bankList.find(
				(b: any) => b.primaryAccount === PRIMARY_ACCOUNT.YES,
			);

			if (currentPrimary && currentPrimary.id && currentPrimary.id !== bank.id) {
				const response = await updateBankDetails(currentPrimary.id, {
					...currentPrimary,
					primaryAccount: PRIMARY_ACCOUNT.NO,
				});
				updateBankList(response);
			}

			const response = await updateBankDetails(bank.id, {
				...bank,
				primaryAccount: PRIMARY_ACCOUNT.YES,
			});
			updateBankList(response);
		} catch (err) {
			console.error('Failed to set primary account:', err);
		}
	};

	return (
		<>
			<Card stretch tag='form' noValidate onSubmit={() => {}}>
				<CardHeader>
					<CardLabel icon='AccountBalance' iconColor='info'>
						<CardTitle tag='div' className='h5'>
							Bank Details
						</CardTitle>
					</CardLabel>
					<CardActions>
						<Button
							color='info'
							isLight
							onClick={handleOpenFormModule}
							icon='AddCircle'>
							Add New
						</Button>
					</CardActions>
				</CardHeader>
				<CardBody isScrollable>
					{isLoading && <div>Loading...</div>}
					{bankList.length === 0 && !isLoading && <div>No Data Found...</div>}
					<div className='row'>
						{bankList.map((bank: BankDetails) => (
							<div className='col-md-6' key={bank.id}>
								<Card
									className={`shadow - 3d - ${darkModeStatus ? 'light' : 'dark'} `}>
									<CardHeader>
										<CardLabel>
											<CardTitle
												tag='div'
												className={classNames('h6', 'cursor-pointer', {
													'link-dark': !darkModeStatus,
													'link-light': darkModeStatus,
												})}>
												{bank.bankName}
											</CardTitle>
										</CardLabel>
										<div className='d-flex align-items-center'>
											<div className='d-flex align-items-center gap-2'>
												<input
													className='form-check-input border-primary text-primary cursor-pointer mt-0'
													type='checkbox'
													id={`primary-${bank.id}`}
													checked={
														bank?.primaryAccount === PRIMARY_ACCOUNT.YES
													}
													onChange={() => setPrimaryBankAccount(bank)}
												/>
												<label
													className='form-check-label small text-muted fw-semibold cursor-pointer mb-0'
													htmlFor={`primary-${bank.id}`}>
													Primary Account
												</label>
											</div>

											<CardActions>
												<Dropdown>
													<DropdownToggle hasIcon={false}>
														<Button
															icon='MoreVert'
															color={
																darkModeStatus ? 'dark' : undefined
															}
															aria-label='More actions'
														/>
													</DropdownToggle>
													<DropdownMenu isAlignmentEnd>
														<DropdownItem>
															<Button
																icon='Edit'
																onClick={() =>
																	handleOpenEditFormModule(bank)
																}>
																Edit
															</Button>
														</DropdownItem>
														<DropdownItem isDivider />
														<DropdownItem>
															<Button
																icon={
																	bank.status ===
																	BANK_STATUS.ACTIVE
																		? 'Block'
																		: 'CheckCircle'
																}
																onClick={() =>
																	handleToggleActive(bank)
																}>
																{bank.status === BANK_STATUS.ACTIVE
																	? 'Deactivate'
																	: 'Activate'}
															</Button>
														</DropdownItem>
														{/* <DropdownItem>
                                                        <Button
                                                            icon="Delete"
                                                            onClick={() => handleDelete(bank)}
                                                        >
                                                            Delete
                                                        </Button>
                                                    </DropdownItem> */}
													</DropdownMenu>
												</Dropdown>
											</CardActions>
										</div>
									</CardHeader>

									{/* <CardBody>
                                    {bank.shortName} {bank.bankName} {bank.sortCode} {bank.openingBalance} {bank.bankAddress}
                                </CardBody> */}

									<CardBody>
										<div>
											<strong>Opening Balance:</strong> {priceFormat(bank.openingBalance)}
										</div>
										<div>
											<strong>Bank Name:</strong> {bank?.bankName}
										</div>
										<div>
											<strong>Account Name:</strong> {bank?.accountName}
										</div>
										<div>
											<strong>Account Number:</strong> {bank?.accountNumber}
										</div>
										<div>
											<strong>Sort Code:</strong> {bank?.sortCode}
										</div>
										<div>
											<strong>IBAN:</strong> {bank?.IBAN}
										</div>
										<div>
											<strong>BIC:</strong> {bank?.BIC}
										</div>
										<div>
											<strong>Address:</strong> {bank?.bankAddress}
										</div>
										<div>
											<strong>Status:</strong>{' '}
											<span
												className={
													bank?.status === BANK_STATUS.ACTIVE
														? 'text-success'
														: 'text-danger'
												}>
												{bank?.status === BANK_STATUS.ACTIVE
													? 'Active'
													: 'Inactive'}
											</span>
										</div>
									</CardBody>
								</Card>
							</div>
						))}
					</div>

					{/* OffCanvas Form for Add/Edit */}

					<BankDetailsForm
						isOpenForm={isOpenForm}
						handleCloseFormModule={handleCloseFormModule}
						companyId={companyId}
						editBankObject={editBankObject}
						onSaveSuccess={updateBankList}
					/>
				</CardBody>
			</Card>
		</>
	);
};
