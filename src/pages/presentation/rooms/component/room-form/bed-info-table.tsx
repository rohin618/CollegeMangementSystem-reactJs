import { FC, useState, useCallback, useMemo } from 'react';
import Card, {
	CardBody,
	CardHeader,
	CardLabel,
	CardTitle,
	CardActions,
} from '../../../../../components/bootstrap/Card';
import useDarkMode from '../../../../../hooks/useDarkMode';
import Dropdown, {
	DropdownItem,
	DropdownMenu,
	DropdownToggle,
} from '../../../../../components/bootstrap/Dropdown';
import Badge from '../../../../../components/bootstrap/Badge';
import Popovers from '../../../../../components/bootstrap/Popovers';
import Button from '../../../../../components/bootstrap/Button';
import {
	priceFormat,
	getColorByValue,
	getLabelByValue,
	showAlert,
} from '../../../../../helpers/helpers';
import { PRICE_PERIOD_STATUS_LIST } from '../../../../../common/data/option';
import { updateBed } from '../../../../../common/api/bed';
import Swal from 'sweetalert2';
import { PRICE_PERIOD_STATUS } from '../../../../../common/constant';
import { useUpdateQueryListById } from '../../../../../hooks';
import Spinner from '../../../../../components/bootstrap/Spinner';
import moment from 'moment';
import BedHistory from './bedHistory/BedHistory';

interface IBedInfoTableProps {
	onOpenBedPriceNewForm: () => void;
	bedDetails: {
		bedName?: string;
		pricePeriods?: any[];
		id?: string;
	};
	onOpenBedEditForm: (index: number) => void;
	roomId: string;
}

export const BedInfoTable: FC<IBedInfoTableProps> = ({
	onOpenBedPriceNewForm,
	bedDetails = {},
	onOpenBedEditForm,
	roomId,
}) => {
	const { darkModeStatus } = useDarkMode();
	const [isDeleteLoading, setIsDeleteLoading] = useState(false);

	const [openBedHistoryModal, setOpenBedHistoryModal] = useState<boolean>(false);
	const [bedDetailsData, setBedDetailsData] = useState<any>();

	const openBedHistory = () => {
		setOpenBedHistoryModal(!openBedHistoryModal);
		setBedDetailsData(bedDetails);
	};

	const updateBedsByRoomIdList = useUpdateQueryListById<any>(['bedsByRoomIdList', roomId]);

	/** Format date once to avoid repeating logic */
	const formatDate = useCallback((date: string | Date) => {
		return moment(date).format('DD MMM YYYY');
	}, []);

	/** Handle deleting a price period */
	const handleDelete = useCallback(
		async (bedInfo: any, index: number) => {
			showAlert({
				title: 'Are you sure?',
				text: "You won't be able to revert this!",
				icon: 'warning',
				showCancelButton: true,
				confirmButtonText: 'Yes, delete it!',
				cancelButtonText: 'Cancel',
				onConfirm: async () => {
					const updatedBed = {
						...bedInfo,
						pricePeriods: bedInfo.pricePeriods.map((pp: any, i: number) =>
							i === index ? { ...pp, status: PRICE_PERIOD_STATUS.DELETE } : pp,
						),
					};

					try {
						setIsDeleteLoading(true);
						const updatedBedRes = await updateBed(updatedBed.id, updatedBed, true);
						updateBedsByRoomIdList(updatedBedRes);
					} catch (error) {
						console.error('Failed to delete price period:', error);
					} finally {
						setIsDeleteLoading(false);
					}
				},
			});
		},
		[updateBedsByRoomIdList],
	);

	/** Memoized price periods to avoid re-render calculations */
	const pricePeriods = useMemo(() => bedDetails?.pricePeriods ?? [], [bedDetails]);

	return (
		<>
			<Card className='rounded-1 mb-0'>
				<CardHeader>
					<CardLabel icon='bed'>
						<CardTitle>{bedDetails?.bedName}</CardTitle>
					</CardLabel>
					<CardActions>
						<Dropdown>
							<DropdownToggle hasIcon={false}>
								<Button icon='MoreHoriz' color='dark' isLight shadow='sm' />
							</DropdownToggle>

							<DropdownMenu>
								<DropdownItem>
									<Button
										color='success'
										isLight
										size='sm'
										icon='AddCircle'
										onClick={onOpenBedPriceNewForm}
										isDisable={isDeleteLoading}>
										Add Price Info
									</Button>
								</DropdownItem>

								<DropdownItem>
									<Button
										color='primary'
										isLight
										size='sm'
										icon='Visibility'
										onClick={openBedHistory}
										// isDisable={isDeleteLoading}
									>
										View History
									</Button>
								</DropdownItem>
							</DropdownMenu>
						</Dropdown>
					</CardActions>
				</CardHeader>

				<CardBody>
					{/* <div className="table-responsive"> */}
					<table className='table table-modern table-hover mb-0'>
						<thead>
							<tr>
								<th>Start Date</th>
								<th>End Date</th>
								<th>
									<Popovers trigger='hover' desc='Price Per Week'>
										PPW
									</Popovers>
								</th>
								<th>
									<Popovers trigger='hover' desc='Minimum Price Per Week'>
										Min PPW
									</Popovers>
								</th>
								<th>Status</th>
								<th>Action</th>
							</tr>
						</thead>

						<tbody>
							{pricePeriods.length > 0 ? (
								pricePeriods.map((priceInfo, index) => (
									<tr key={index}>
										<td>{formatDate(priceInfo?.sDate)}</td>
										<td>{formatDate(priceInfo?.eDate)}</td>
										<td>{priceFormat(priceInfo?.pricePerWeek)}</td>
										<td>{priceFormat(priceInfo?.minPricePerWeek)}</td>
										<td>
											<Badge
												color={getColorByValue(
													PRICE_PERIOD_STATUS_LIST,
													priceInfo?.status,
												)}
												isLight
												rounded={1}>
												{getLabelByValue(
													PRICE_PERIOD_STATUS_LIST,
													priceInfo?.status,
												)}
											</Badge>
										</td>
										<td>
											{isDeleteLoading ? (
												<Spinner color='info' size='10' />
											) : (
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
																	onOpenBedEditForm(index)
																}
																isDisable={isDeleteLoading}>
																Edit
															</Button>
														</DropdownItem>
														<DropdownItem isDivider />
														<DropdownItem>
															<Button
																icon='Delete'
																onClick={() =>
																	handleDelete(bedDetails, index)
																}
																isDisable={isDeleteLoading}>
																Delete
															</Button>
														</DropdownItem>
													</DropdownMenu>
												</Dropdown>
											)}
										</td>
									</tr>
								))
							) : (
								<tr>
									<td colSpan={6} className='text-center'>
										No price periods available
									</td>
								</tr>
							)}
						</tbody>
					</table>
					{/* </div> */}
				</CardBody>
			</Card>

			<BedHistory
				isOpen={openBedHistoryModal}
				toggle={() => setOpenBedHistoryModal(!openBedHistoryModal)}
				bedDetails={bedDetailsData}
			/>
		</>
	);
};
