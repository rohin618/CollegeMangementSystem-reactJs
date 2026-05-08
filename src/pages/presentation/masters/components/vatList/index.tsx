import {
	CardBody,
	Card,
	CardHeader,
	CardTitle,
	CardLabel,
	CardActions,
	Button,
	Dropdown,
	DropdownItem,
	DropdownMenu,
	DropdownToggle,
	Spinner,
} from '../../../../../components/bootstrap';

import { getColorByValue, getLabelByValue } from '../../../../../helpers/helpers';
import { VAT_STATUS_list } from '../../../../../common/data/option';

import { useMemo, useState } from 'react';
import useDarkMode from '../../../../../hooks/useDarkMode';
import { useMultiSearch, useRemoveItemQueryListById } from '../../../../../hooks';
import Swal from 'sweetalert2';
import { VatForm } from '../vatForm';
import { deleteVAT } from '../../../../../common/api/vat';
import { VAT_STATUS } from '../../../../../common/constant/app';
import { useMasterData } from '../../../../../contexts/mastersContext';
import moment from 'moment';
export const VatList = ({ search }: any) => {
	const { darkModeStatus, themeStatus } = useDarkMode();
	const [isOpenValFormModal, setIsOpenValFormModal] = useState(false);
	const [editVatObject, setEditVatObject] = useState({});
	const { vatList, isLoading, isError } = useMasterData();
	const { removeItemById, clearList } = useRemoveItemQueryListById<any>({
		queryKey: ['vatList'],
	});

	const filteredVatList = useMultiSearch(vatList, { name: search });

	const activeVatList = useMemo(() => {
		return filteredVatList.filter((vat: any) => +vat.status !== VAT_STATUS.DELETE);
	}, [filteredVatList]);

	const handleOpenAddForm = () => {
		setIsOpenValFormModal(true);
	};

	const handleCloseFormModel = () => {
		setIsOpenValFormModal(false);
		setEditVatObject(false);
	};

	const handleOpenEditModal = (vat: any) => {
		setIsOpenValFormModal(true);
		setEditVatObject(vat);
	};

	const handleOpenDeleteVAT = (id: string) => {
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

			removeItemById(id);
			// setDeletingId(id); // Mark this row as deleting
			try {
				await deleteVAT(id);
				removeItemById(id);
			} finally {
				// setDeletingId(null); // Reset after deletion
			}
		});
	};

	return (
		<>
			<Card className='shadow-3d-primary'>
				<CardHeader>
					<CardLabel icon='Receipt'>
						<CardTitle tag='div' className='h5'>
							VAT
						</CardTitle>
						<CardActions tag='div' className='text-muted'>
							Total records: {activeVatList?.length ?? 0}
						</CardActions>
					</CardLabel>
					<CardActions>
						<Button color='primary' isLight onClick={handleOpenAddForm}>
							Add New
						</Button>
					</CardActions>
				</CardHeader>
				<CardBody>
					<table className='table table-modern table-hover'>
						<thead>
							<tr>
								<th>VAT Code</th>
								<th>VAT Name</th>
								<th>VAT Rate</th>
								<th>Effective Date From</th>
								<th>VAT Description</th>
								<th>Status</th>
								<th>Action</th>
							</tr>
						</thead>
						<tbody>
							{isLoading && (
								<tr>
									<td colSpan={7} className='text-center py-5'>
										<Spinner color='primary' size='lg' />
									</td>
								</tr>
							)}

							{isError && (
								<tr>
									<td colSpan={7} className='text-center text-danger'>
										Failed to load VAT.
										<small className='d-block mt-1'>
											Please try again later.
										</small>
									</td>
								</tr>
							)}

							{!isLoading && !isError && filteredVatList.length === 0 && (
								<tr>
									<td colSpan={7} className='text-center text-muted py-4'>
										No VAT found.
									</td>
								</tr>
							)}
							{!isLoading && !isError && activeVatList.map((vat: any) => (
								<tr key={vat.id}>
									<td>{vat.code}</td>
									<td>{vat.name}</td>
									<td>{Number(vat.rate)?.toFixed(1)}%</td>
									<td>{moment(vat.efftDateFrom).format('DD-MMM-YYYY')}</td>
									<td>{vat.description}</td>
									<td>
										<Button
											isLink
											onClick={() => {}}
											color={getColorByValue(VAT_STATUS_list, vat.status)}
											size='sm'
											className='text-nowrap'
											icon='circle'>
											{getLabelByValue(VAT_STATUS_list, vat.status)}
										</Button>
									</td>
									<td>
										<Dropdown>
											<DropdownToggle hasIcon={false}>
												<Button
													icon='MoreHoriz'
													color={themeStatus}
													shadow='default'
													hoverShadow='none'
													aria-label='More'
												/>
											</DropdownToggle>
											<DropdownMenu isAlignmentEnd>
												<DropdownItem>
													<Button
														color='link'
														icon='Edit'
														// isActive={viewMode === Views.MONTH}
														onClick={() => handleOpenEditModal(vat)}>
														Edit
													</Button>
												</DropdownItem>

												<DropdownItem isDivider />
												<DropdownItem>
													<Button
														color='link'
														icon='Delete'
														// isActive={viewMode === Views.MONTH}
														onClick={() => handleOpenDeleteVAT(vat.id)}>
														Delete
													</Button>
												</DropdownItem>
											</DropdownMenu>
										</Dropdown>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</CardBody>
			</Card>
			<VatForm
				editVatObject={editVatObject}
				isOpen={isOpenValFormModal}
				toggle={handleCloseFormModel}
			/>
		</>
	);
};
