import { useNavigate, useParams } from 'react-router-dom';
import useDarkMode from '../../../../../hooks/useDarkMode';
import { useRemoveItemQueryListById, useUpdateQueryListById } from '../../../../../hooks';
import { useMemo, useState } from 'react';
import { useMasterData } from '../../../../../contexts/mastersContext';
import {
	Button,
	Card,
	CardActions,
	CardBody,
	CardHeader,
	CardLabel,
	CardSubTitle,
	CardTitle,
	Dropdown,
	DropdownItem,
	DropdownMenu,
	DropdownToggle,
} from '../../../../../components/bootstrap';
import { LaAndIcbForm } from '../laAndIcbForm';
import { deleteICB } from '../../../../../common/api/ibc';
import { deleteLocalAuthority } from '../../../../../common/api/localAuthority';
import COLORS, { getColorNameWithIndex } from '../../../../../common/data/enumColors';
import classNames from 'classnames';
import Icon from '../../../../../components/icon';
import {
	getActiveBedDetails,
	getActiveFundBlockBed,
	getColorByValue,
	getLabelByValue,
	notifyEntity,
	priceFormat,
	showAlert,
} from '../../../../../helpers/helpers';
import {
	BLOCK_BEDS_STATUS,
	FUND_SOURCE_TYPE,
	LA_STATUS,
	NOTIFY_TYPE,
	PREBOOK_HISTORY_STATUS,
} from '../../../../../common/constant';
import { LA_STATUS_LIST } from '../../../../../common/data/option';
import Swal from 'sweetalert2';

export const LaAndIcbList = ({
	isFromICBTab = false,
	onEdit = () => {},
	updateQueryList = () => {},
}: any) => {
	const { darkModeStatus } = useDarkMode();

	const navigate = useNavigate();

	const { localAuthorityList = [], localICBList = [], isLoading } = useMasterData();

	const listData = useMemo(() => {
		return isFromICBTab ? localICBList : localAuthorityList;
	}, [isFromICBTab, localICBList, localAuthorityList]);

	const handleDelete = async (body: any) => {
		const blockBedsStatus = getActiveFundBlockBed(body?.blockBeds || []);
		const blockBedsUsageCount =
			body?.blockBedHistory?.filter((data: any) => data?.status === BLOCK_BEDS_STATUS.ACTIVE)
				.length || 0;

		if (blockBedsStatus || blockBedsUsageCount > 0) {
			showAlert({
				title: 'Cannot Delete Block Bed',
				text: 'You cannot delete this. It has an active block bed status or is currently in use by a resident.',
				icon: 'error',
			});

			return;
		}
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
			try {
				const apiFn = isFromICBTab ? deleteICB : deleteLocalAuthority;
				const res = await apiFn(body?.id, body);
				if (res) updateQueryList(res);
				// notifyEntity('Deleted Successfully', NOTIFY_TYPE.UPDATE);
			} catch (error) {
				console.error('Something went wrong');
			}
		});
	};

	return (
		<div>
			{isLoading && <div>Loading...</div>}
			{listData?.length === 0 && !isLoading && <div>No Data Found...</div>}

			<div className='row'>
				{listData?.map((item: any, i: number) => {
					const colorIndex = getColorNameWithIndex(i);
					const noOfBlockBeds =
						getActiveBedDetails(item?.blockBeds || [])?.noOfBlockBed || 0;

					const noOfActiveResidents =
						item.blockBedHistory?.filter(
							(resident: any) => resident.status === PREBOOK_HISTORY_STATUS.ACTIVE,
						).length || 0;

					return (
						+item.status === LA_STATUS.ACTIVE && (
							<div className='col-md-4' key={item.id}>
								<Card
									className={`shadow-3d-${darkModeStatus ? COLORS.LIGHT.name : COLORS.DARK.name}`}>
									<CardHeader className='d-flex justify-content-between align-items-start'>
										<div
											className='d-flex align-items-start gap-2'
											onClick={() =>
												navigate(
													`/laAndIcb/details/${isFromICBTab ? FUND_SOURCE_TYPE.CHC : FUND_SOURCE_TYPE.LOCAL_AUTHORITY}/${item.id}`,
												)
											}>
											<div className='flex-shrink-0'>
												<div
													className='ratio ratio-1x1 me-3'
													style={{ width: 48 }}>
													<div
														className={`bg-l${darkModeStatus ? 'o25' : '25'}-${colorIndex} text-${colorIndex} rounded-2 d-flex align-items-center justify-content-center`}>
														<span className='fw-bold'>
															<Icon icon='Apartment' size='2x' />
														</span>
													</div>
												</div>
											</div>

											<div>
												<div
													className={classNames(
														'fw-bold',
														'cursor-pointer',
														{
															'link-dark': !darkModeStatus,
															'link-light': darkModeStatus,
														},
													)}>
													{item?.name}
												</div>
												<div className='d-flex align-items-center gap-2 mt-1'>
													<span
														className={classNames('fw-bold', {
															'text-dark': !darkModeStatus,
															'text-light': darkModeStatus,
														})}>
														{item?.shortName}
													</span>
													<Button
														isLink
														onClick={() => {}}
														color={getColorByValue(
															LA_STATUS_LIST,
															item.status,
														)}
														size='sm'
														className='text-nowrap'
														icon='circle'>
														{getLabelByValue(
															LA_STATUS_LIST,
															item.status,
														)}
													</Button>
												</div>
											</div>
										</div>

										{/* RIGHT SIDE: DROPDOWN ACTIONS */}
										<Dropdown>
											<DropdownToggle hasIcon={false}>
												<Button
													icon='MoreVert'
													color={darkModeStatus ? 'dark' : undefined}
												/>
											</DropdownToggle>
											<DropdownMenu isAlignmentEnd>
												<DropdownItem>
													<Button
														icon='Edit'
														onClick={() => onEdit(item)}>
														Edit
													</Button>
												</DropdownItem>

												<DropdownItem isDivider />

												<DropdownItem>
													<Button
														icon='Delete'
														onClick={() => handleDelete(item)}>
														Delete
													</Button>
												</DropdownItem>
												<DropdownItem isDivider />
												{/* <DropdownItem>
													<Button
														icon='Visibility'
														onClick={() =>
															navigate(
																`/laAndIcb/details/${isFromICBTab}/${item.id}`,
															)
														}>
														View
													</Button>
												</DropdownItem> */}
											</DropdownMenu>
										</Dropdown>
									</CardHeader>

									<CardBody className='pt-0'>
										{/* LOCATION + COUNTRY */}
										<div className='mb-3'>
											<div className='d-flex align-items-center gap-2'>
												<Icon
													icon='locationOn'
													className='text-muted'
													size='lg'
												/>
												<div>
													<div>{item?.area || 'NA'}</div>
													<small className='text-muted'>
														{item?.postCode || 'NA'}
													</small>
												</div>
											</div>
										</div>

										{/* PHONE */}
										<div className='mb-3'>
											<div className='d-flex align-items-center gap-2'>
												<Icon
													icon='phone'
													className='text-muted'
													size='lg'
												/>
												<span>{item?.phone || 'NA'}</span>
											</div>
										</div>

							

										<hr className='text-muted' />

										<div className='d-flex justify-content-between align-items-center mt-3 fs-5'>
											<div className='d-flex align-items-center gap-2'>
												<Icon icon='BedroomChild' />
												<span>Block Beds: {noOfBlockBeds}</span>
											</div>

											<span
												className={classNames('badge border py-2', {
													'bg-light text-muted': !darkModeStatus,
													'bg-dark text-light': darkModeStatus,
												})}>
												{noOfActiveResidents} Residents
											</span>
										</div>
									</CardBody>
								</Card>
							</div>
						)
					);
				})}
			</div>
		</div>
	);
};
