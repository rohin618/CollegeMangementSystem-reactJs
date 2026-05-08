import { useState } from 'react';
import Swal from 'sweetalert2';
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
import Icon from '../../../../../components/icon';
import { BillingPatternFrom } from '../billingPatternForm';
import { BILLING_PATTERN_STATUS } from '../../../../../common/constant';
import { getColorByValue, getLabelByValue } from '../../../../../helpers/helpers';
import { BILLING_PATTERN_STATUS_LIST } from '../../../../../common/data/option';
import { updateBillingPatternMaster } from '../../../../../common/api/billingPattern';
import { useQueryClient } from '@tanstack/react-query';
import { useMasterData } from '../../../../../contexts/mastersContext';
import { useMultiSearch } from '../../../../../hooks';
import classNames from 'classnames';
import useDarkMode from '../../../../../hooks/useDarkMode';

export const BillingPattern = ({ search }: any) => {
	const queryClient = useQueryClient();
	const { billingPatternList, isLoading, isError } = useMasterData();
	const [isOpenBillFormulaModal, setIsOpenBillFormulaModal] = useState(false);
	const [editBillFormulaObject, setEditBillFormulaObject] = useState({});
	const { darkModeStatus } = useDarkMode();
	const filteredBillingPatternList = useMultiSearch(billingPatternList, { name: search });

	const handleOpenBillFormulaModal = () => setIsOpenBillFormulaModal(true);
	const handleCloseBillFormulaModal = () => {
		setIsOpenBillFormulaModal(false);
		setEditBillFormulaObject({});
	};
	const handleOpenEditModal = (data: any) => {
		setIsOpenBillFormulaModal(true);
		setEditBillFormulaObject(data);
	};

	//Handle Activate/Deactivate
	const handleToggleStatus = async (pattern: any) => {
		if (!pattern.id) return;

		const isActive = +pattern.status === BILLING_PATTERN_STATUS.ACTIVE;
		const actionText = isActive ? 'deactivate' : 'activate';

		const result = await Swal.fire({
			title: `Are you sure?`,
			text: `Do you really want to ${actionText} this billing pattern?`,
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: isActive ? '#d33' : '#3085d6',
			cancelButtonColor: '#6c757d',
			confirmButtonText: `Yes, ${actionText} it!`,
		});

		if (!result.isConfirmed) return;

		try {
			const newStatus = isActive
				? BILLING_PATTERN_STATUS.INACTIVE
				: BILLING_PATTERN_STATUS.ACTIVE;

			await updateBillingPatternMaster(pattern.id, {
				...pattern,
				status: newStatus,
			});

			// Refresh list automatically
			await queryClient.invalidateQueries({ queryKey: ['billingPatternList'] });
		} catch (err) {
			console.error('Failed to toggle billing pattern:', err);
			// notification("Error", "Something went wrong while updating status.", "error");
		}
	};	

	return (
		<Card className='shadow-3d-primary'>
			<CardHeader>
				<CardLabel icon='Receipt'>
					<CardTitle tag='div' className='h5'>
						Billing Pattern
					</CardTitle>
					<CardActions tag='div' className='text-muted'>
						Total records: {filteredBillingPatternList.length}
					</CardActions>
				</CardLabel>
				<CardActions>
					<Button color='primary' isLight onClick={handleOpenBillFormulaModal}>
						Add New
					</Button>
				</CardActions>
			</CardHeader>

			<CardBody>
				{isLoading ? (
					<div className='text-center py-5'>
						<Spinner size='lg' color='primary' />
					</div>
				) : isError ? (
					<div className='text-center text-danger py-5'>
						Failed to load billing patterns.
					</div>
				) : filteredBillingPatternList.length === 0 ? (
					<div className='text-center py-5 text-muted'>
						No billing patterns available.
					</div>
				) : (
					<table className='table table-modern table-hover'>
						<thead>
							<tr>
								<th>Formula Name</th>
								<th>Formula Expression</th>
								{/* <th>Effective Date From</th> */}
								<th>Description</th>
								<th>Status</th>
								<th>Action</th>
							</tr>
						</thead>
						<tbody>
							{filteredBillingPatternList.map((pattern: any) => (
								<tr key={pattern.id}>
									<td>
										<div>
											<div className='fw-medium'>{pattern.name}</div>
										</div>
									</td>
									<td>
										<div
											className={classNames(
												'd-flex align-items-center gap-2 px-2 py-1 rounded',
												{
													'bg-light': !darkModeStatus,
													'bg-dark': darkModeStatus,
												},
											)}>
											<Icon icon='Code' style={{ fontSize: '0.8rem' }} />
											<code
												className={classNames({
													'text-muted': !darkModeStatus,
													'text-light': darkModeStatus,
												})}>
												{pattern.billingFormula}
											</code>
										</div>
									</td>
									<td>
										{' '}
										<div className='small text-muted mt-1'>
											{pattern.description}
										</div>
									</td>
									<td>
										<Button
											isLink
											onClick={() => {}}
											color={getColorByValue(
												BILLING_PATTERN_STATUS_LIST,
												pattern.status,
											)}
											size='sm'
											className='text-nowrap'
											icon='circle'>
											{getLabelByValue(
												BILLING_PATTERN_STATUS_LIST,
												pattern.status,
											)}
										</Button>
									</td>
									<td>
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
															handleOpenEditModal(pattern)
														}>
														Edit
													</Button>
												</DropdownItem>

												<DropdownItem isDivider />

												<DropdownItem>
													<Button
														icon={
															+pattern.status ===
															BILLING_PATTERN_STATUS.ACTIVE
																? 'Block'
																: 'CheckCircle'
														}
														onClick={() => handleToggleStatus(pattern)}>
														{+pattern.status ===
														BILLING_PATTERN_STATUS.ACTIVE
															? 'Deactivate'
															: 'Activate'}
													</Button>
												</DropdownItem>
											</DropdownMenu>
										</Dropdown>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				)}

				<BillingPatternFrom
					editBillFormulaObject={editBillFormulaObject}
					isOpen={isOpenBillFormulaModal}
					toggle={handleCloseBillFormulaModal}
				/>
			</CardBody>
		</Card>
	);
};
