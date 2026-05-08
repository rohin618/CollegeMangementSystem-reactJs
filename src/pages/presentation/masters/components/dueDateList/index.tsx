import React, { useMemo, useState } from 'react';
import {
	Button,
	Card,
	CardActions,
	CardBody,
	CardHeader,
	CardTitle,
	CardLabel,
	Spinner,
	Dropdown,
	DropdownToggle,
	DropdownMenu,
	DropdownItem,
} from '../../../../../components/bootstrap';
import DueDateForm from '../dueDateForm';
import { getColorNameWithIndex } from '../../../../../common/data/enumColors';
import { getFirstLetter } from '../../../../../helpers/helpers';
import useDarkMode from '../../../../../hooks/useDarkMode';
import { useMultiSearch, useRemoveItemQueryListById } from '../../../../../hooks';
import { deleteDueDate } from '../../../../../common/api/dueDate';

import Swal from 'sweetalert2';
import { DUEDATE_STATUS } from '../../../../../common/constant/app';
import { useMasterData } from '../../../../../contexts/mastersContext';

const DueDateList = ({ search }: any) => {
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [isOpenDueDateFormModel, setIsOpenDueDateFormModel] = useState<boolean>(false);
	const [editDueDateObject, setEditDueDateObject] = useState<any>({});

	const { darkModeStatus } = useDarkMode();

	const { dueDateList, isLoading, isError } = useMasterData();

	const filteredDueDate = useMultiSearch(dueDateList, { name: search });

	const activeDueDate = useMemo(() => {
		return filteredDueDate.filter((vat: any) => +vat.status !== DUEDATE_STATUS.DELETE);
	}, [filteredDueDate]);

	const { removeItemById, clearList } = useRemoveItemQueryListById<any>({
		queryKey: ['dueDateList'],
	});
	const handleOpenDueDateForm = () => {
		setIsOpenDueDateFormModel(true);
	};
	const handleCloseDueDateForm = () => {
		setIsOpenDueDateFormModel(false);
		setEditDueDateObject({});
	};
	const handleOpenEditFormModal = (dueDate: any) => {
		setEditDueDateObject(dueDate);
		setIsOpenDueDateFormModel(true);
	};

	const handleDeleteDueDate = (id: string) => {
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
			setDeletingId(id); // Mark this row as deleting
			try {
				await deleteDueDate(id);
				removeItemById(id);
			} finally {
				setDeletingId(null); // Reset after deletion
			}
		});
	};

	return (
		<Card>
			<CardHeader title='Due Date List'>
				<CardLabel icon='Receipt'>
					<CardTitle>Due Date</CardTitle>
					<CardActions tag='div' className='text-muted'>
						Total records: {activeDueDate?.length || 0}
					</CardActions>
				</CardLabel>
				<CardActions>
					<Button color='primary' isLight onClick={() => handleOpenDueDateForm()}>
						Add New
					</Button>
				</CardActions>
			</CardHeader>
			<CardBody>
				<>
					<div className='row'>
						<div className='col-md-12'>
							<div className='row g-3 justify-content-center'>
								<div className='col-10'>
									{/* Loader State */}
									{isLoading && (
										<div className='text-center py-5'>
											<Spinner color='primary' size='lg' />
										</div>
									)}

									{/* Error State */}
									{/* {isError && (
										<div className='text-center text-danger'>
											Failed to load DueDates.
											<small className='d-block mt-1'>
												{(error as any)?.message ||
													'Please try again later.'}
											</small>
										</div>
									)} */}

									{/* Empty State */}
									{!isLoading && !isError && activeDueDate.length === 0 && (
										<div className='text-center text-muted py-4'>
											No Due Date found.
										</div>
									)}

									{/* Company List */}
									{!isLoading &&
										!isError &&
										activeDueDate?.map((dueDate: any, i: number) => {
											// Get color index based on position
											const colorIndex = getColorNameWithIndex(i);
											return (
												<div
													className='row mb-4 border-bottom pb-1'
													key={dueDate.id}>
													{/* Left Section - Avatar + Title */}
													<div className='col d-flex align-items-center'>
														{/* Avatar */}
														<div className='flex-shrink-0'>
															<div
																className='ratio ratio-1x1 me-3'
																style={{ width: '48px' }}>
																<div
																	className={`bg-l${
																		darkModeStatus
																			? 'o25'
																			: '25'
																	}-${colorIndex} text-${colorIndex} rounded-2 d-flex align-items-center justify-content-center`}>
																	<span className='fw-bold'>
																		{getFirstLetter(
																			dueDate?.name,
																		)}
																	</span>
																</div>
															</div>
														</div>

														{/* Title + Subtitle */}
														<div className='flex-grow-1'>
															<div className='fs-6 fw-semibold'>
																{dueDate?.name || ''}
															</div>

															{/* ✅ Added: Due Date */}
															<div className='text-muted'>
																<small>
																	{dueDate?.day
																		? `Due Day: ${dueDate.day}`
																		: ''}
																</small>
															</div>
														</div>
													</div>

													{/* Right Section - Button */}
													<div className='col-auto text-end'>
														{deletingId === dueDate.id ? (
															<Spinner />
														) : (
															<Dropdown>
																<DropdownToggle hasIcon={false}>
																	<Button
																		icon='MoreHoriz'
																		color='dark'
																		isLight
																		shadow='sm'
																		aria-label='More actions'
																	/>
																</DropdownToggle>
																<DropdownMenu isAlignmentEnd>
																	<DropdownItem>
																		<Button
																			icon='Edit'
																			onClick={() =>
																				handleOpenEditFormModal(
																					dueDate,
																				)
																			}>
																			Edit
																		</Button>
																	</DropdownItem>

																	<DropdownItem isDivider />
																	<DropdownItem>
																		<Button
																			icon='Delete'
																			onClick={() => {
																				handleDeleteDueDate(
																					dueDate.id,
																				);
																			}}>
																			Delete
																		</Button>
																	</DropdownItem>
																</DropdownMenu>
															</Dropdown>
														)}
													</div>
												</div>
											);
										})}
								</div>
							</div>
						</div>
					</div>
				</>
				<DueDateForm
					isOpen={isOpenDueDateFormModel}
					toggle={handleCloseDueDateForm}
					dueDateEditData={editDueDateObject}
				/>
			</CardBody>
		</Card>
	);
};

export default DueDateList;
