import React, { act, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import moment from 'moment';

import useDarkMode from '../../../hooks/useDarkMode';
import PageWrapper from '../../../layout/PageWrapper/PageWrapper';
import SubHeader, {
	SubHeaderLeft,
	SubheaderSeparator,
	SubHeaderRight,
} from '../../../layout/SubHeader';
import Breadcrumb from '../../../components/bootstrap/Breadcrumb';
import Button from '../../../components/bootstrap/Button';
import Page from '../../../layout/Page';

import { BedBookingForm } from './component/bed-booking';
import RoomChangeModel from './component/roomChangeModel/RoomChangeModel';

import { createResident, updateBlockBedReport, updateResident } from '../../../common/api/resident';
import { BED_STATUS } from '../../../common/constant';
import { pagesMenu } from '../../../menu';
import {
	generateUid,
	getActiveFundBlockBed,
	getActiveFundDetails,
	getActiveFundDetailsByLAOrICB,
	getNearestByEndDateOrTodayOverLap,
	getUserMappedCompanyId,
	isBlockBedsValidation,
	mergeArrayOfObjectUniqueByKey,
	notifyEntity,
	showAlert,
} from '../../../helpers/helpers';
import {
	BLOCK_BEDS_TYPE,
	BOOKING_TYPE,
	DATA_MIGRATION_TO_DATE,
	FUND_SOURCE_TYPE,
	NOTIFY_TYPE,
	PREBOOK_HISTORY_STATUS,
	PREBOOK_TYPE,
	RESIDENT_STATUS,
} from '../../../common/constant/app';
import { useGetAllRoomsWithBeds } from '../../../hooks/useGetAllRoomsWithBed';
import { updateLocalAuthority } from '../../../common/api/localAuthority';
import { updateICB } from '../../../common/api/ibc';
import { useMasterData } from '../../../contexts/mastersContext';
import { useUpdateQueryListById, useUpdateQueryObjectById } from '../../../hooks';
import {
	getUpdateBlockBedHistory,
	getUpdatedCurrentBlockBedHistory,
} from '../../../helpers/resident';

const BedBookPage: React.FC = () => {
	const navigate = useNavigate();
	const bedBookingFormRef = useRef<any>(null);
	const { roomId, bedId, residentId } = useParams<{
		roomId?: string;
		bedId?: string;
		residentId?: string;
	}>();

	const [isLoading, setIsLoading] = useState(false);
	const [currentResidentData, setCurrentResidentData] = useState<any>(null);
	const [roomChangeModalOpen, setRoomChangeModalOpen] = useState(false);
	const [selectedRoom, setSelectedRoom] = useState<any>(null);
	const [selectedBed, setSelectedBed] = useState<any>(null);
	const [selectedDate, setSelectedDate] = useState<any>(moment().format('YYYY-MM-DD'));
	const [bookingType, setBookingType] = useState<number>(0);
	const companyId = getUserMappedCompanyId()?.companyId;
	const updateLocalICBList = useUpdateQueryListById<any>(['localICBList']);
	const updateLocalAuthorityList = useUpdateQueryListById<any>(['localAuthorityList']);
	const updateResidentListWithInvoiceList = useUpdateQueryListById<any>([
		'residentListByCompany',
	]);
	const updateResidentCache = useUpdateQueryObjectById(['residentDetails', residentId]);

	const {
		data: roomsList = [],
		isLoading: isRoomLoading,
		refetch: refetchRoomsWithBed,
	} = useGetAllRoomsWithBeds();
	const {
		localAuthorityList = [],
		localICBList = [],
		isLoading: isMasterLoading,
	} = useMasterData();

	const hnadleUpdateFundDetail = async (activeFund: any, updatedFundInformation: any) => {
		const updateFn =
			+activeFund?.fundSource === FUND_SOURCE_TYPE.LOCAL_AUTHORITY
				? updateLocalAuthority
				: updateICB;
		const updateListState =
			+activeFund?.fundSource === FUND_SOURCE_TYPE.LOCAL_AUTHORITY
				? updateLocalAuthorityList
				: updateLocalICBList;

		const res = await updateFn(updatedFundInformation.id, { ...updatedFundInformation });
		updateListState(res);
		return res;
	};

	const handleBookingSubmit = async () => {
		try {
			setIsLoading(true);
			const formData = bedBookingFormRef.current?.residentSubmitForm();
			if (!formData) return;
			let targetRoomId = selectedRoom?.id || formData.roomId;
			let targetBedId = selectedBed?.id || formData.bedId;

			// special condition for shared to private in same Room
			if (
				+currentResidentData?.admission?.bookingType === BOOKING_TYPE.SHARED &&
				+formData.admission.bookingType === BOOKING_TYPE.PRIVATE &&
				validateRoomAvailability(targetRoomId, targetBedId)
			)
				return;

			// special condition for initial time private select. Its prevent from update other to available
			if (
				(currentResidentData === null || currentResidentData === undefined) &&
				+formData.admission.bookingType === BOOKING_TYPE.PRIVATE &&
				validateRoomAvailability(targetRoomId, targetBedId)
			)
				return;

			// ------- CREATE NEW RESIDENT -------
			const activeFund = getActiveFundDetails(formData?.fundDetails); // correct
			const isBlockBed = +activeFund?.blockBedStatus === BLOCK_BEDS_TYPE.YES;
			const fundingAuthorityDetails: any = getActiveFundDetailsByLAOrICB(
				activeFund,
				localAuthorityList,
				localICBList,
			); // correct

			if (!fundingAuthorityDetails && isBlockBed) {
				showAlert({
					title: 'Invalid Funding Authority',
					text: 'The funding authority details provided are invalid.',
					icon: 'error',
				});

				return null;
			}
			// 3. Validate block bed usage
			const valid = isBlockBedsValidation(activeFund, fundingAuthorityDetails, residentId);
			if (!valid) return null;
			// 4) Find active block bed
			const activeBlockBed = getActiveFundBlockBed(
				fundingAuthorityDetails?.blockBeds || [],
				activeFund?.eDate,
			);

			//Removing the respiteStatusList first one Default Start Date
			const respiteStatusList = formData?.admission?.respiteStatusList[0];
			if (!respiteStatusList?.eDate || !respiteStatusList?.status) {
				formData.admission.respiteStatusList[0].sDate = '';
			}

			if (residentId) {
				// special condition for RIP/LEFT to LIVING again in same room and bed check if available
				if (
					+currentResidentData?.admission?.residentStatus !== RESIDENT_STATUS.LIVING &&
					+formData?.admission?.residentStatus === RESIDENT_STATUS.LIVING
				) {
					//Validate for both shared and private
					if (+formData?.admission?.bookingType === BOOKING_TYPE.SHARED) {
						if (
							validateRoomAvailabilityRIPAndLEFT(
								targetRoomId,
								targetBedId,
								BOOKING_TYPE.SHARED,
							)
						)
							return;
					} else {
						if (
							validateRoomAvailabilityRIPAndLEFT(
								targetRoomId,
								targetBedId,
								BOOKING_TYPE.PRIVATE,
							)
						)
							return;
					}

					//Set this as Empty
					formData.admission.dateDischargeAndRip = '';
				}
				// Update existing resident
				const updatedHistory = await updateBedHistory(
					formData,
					currentResidentData,
					selectedRoom,
					selectedBed,
				);

				const updatedData = {
					...formData,
					roomId: targetRoomId,
					bedId: targetBedId,
					roomHistory: updatedHistory,
				};

				// resident Id  | currentResidentData   | previous Resident Data
				if (
					activeBlockBed?.id === activeFund?.currentBlockBedId || // BB yes -> BB yes ( same fund edit time )
					+activeFund.fundSource === FUND_SOURCE_TYPE.PRIVATE
				) {
					const residentResponse = await updateResident(
						residentId,
						updatedData,
						currentResidentData,
					);
					updateResidentCache(residentResponse);
					updateResidentListWithInvoiceList(residentResponse);
					refetchRoomsWithBed();
					// Only For Current Block Bed update the history
					if (activeBlockBed?.id === activeFund?.currentBlockBedId) {
						const fundingAuthorityDetails = getActiveFundDetailsByLAOrICB(
							activeFund,
							localAuthorityList,
							localICBList,
						); // correct
						if (fundingAuthorityDetails) {
							const updatedFundInformation: any =
								await getUpdatedCurrentBlockBedHistory(
									activeFund,
									activeFund?.currentBlockHistoryId,
									fundingAuthorityDetails,
									updatedData,
								);
							if (activeFund && updatedFundInformation) {
								hnadleUpdateFundDetail(activeFund, updatedFundInformation);
							}
						}
					}
				} else {
					if (+activeFund?.blockBedStatus === BLOCK_BEDS_TYPE.YES) {
						// BB yes -> BB yes  ( another fund )
						const currentBlockHistoryId = isBlockBed ? generateUid() : '';
						// same or different fundAuthority Chagnes it will works
						const updateFundDetails = [
							...formData.fundDetails,
							{
								...activeFund,
								currentBlockHistoryId,
								currentBlockBedId: activeBlockBed?.id,
							},
						];

						// current New formData With updated fundDetails
						const updatedData = {
							...formData,
							roomId: targetRoomId,
							bedId: targetBedId,
							roomHistory: updatedHistory,
							fundDetails: mergeArrayOfObjectUniqueByKey(
								updateFundDetails,
								updateFundDetails,
							),
						};

						const prevFundingAuthorityDetails = getActiveFundDetailsByLAOrICB(
							activeFund,
							localAuthorityList,
							localICBList,
						); // correct

						if (prevFundingAuthorityDetails) {
							const updatedFundInformation: any = await getUpdateBlockBedHistory(
								activeFund,
								currentBlockHistoryId,
								prevFundingAuthorityDetails,
								updatedData,
							);
							const residentResponse = await updateResident(
								residentId,
								updatedData,
								currentResidentData,
							);
							updateResidentCache(residentResponse);
							updateResidentListWithInvoiceList(residentResponse);
							refetchRoomsWithBed();
							if (activeFund && updatedFundInformation) {
								hnadleUpdateFundDetail(activeFund, updatedFundInformation);
							}
						}

						// return
					} else {
						// Update resident once
						const residentResponse = await updateResident(
							residentId,
							updatedData,
							currentResidentData,
						);

						updateResidentCache(residentResponse);
						updateResidentListWithInvoiceList(residentResponse);
						refetchRoomsWithBed();
					}
				}

				// Take Previous all block bed Yes FundDetails Not current Block Bed
				const matchBlockBedFundDetails = updatedData?.fundDetails.filter(
					(fund: any) =>
						+fund?.blockBedStatus === BLOCK_BEDS_TYPE.YES &&
						activeFund?.id !== fund?.id,
				);

				// Local State Because the List update during the API Call it wont update react Query Immediatly

				let updatedLocalAuthorityListState = [...localAuthorityList];
				let updatedLocalICBListState = [...localICBList];

				// Loop through ALL matched block bed fund details
				for (const fundDetail of matchBlockBedFundDetails) {
					const prevFundingAuthorityDetails = getActiveFundDetailsByLAOrICB(
						fundDetail,
						updatedLocalAuthorityListState,
						updatedLocalICBListState,
					);

					// Need to change this to find function --------------------
					// const prevFundingAuthorityBlockBed: any =
					// 	prevFundingAuthorityDetails?.blockBedHistory?.findIndex(
					// 		(his) => his.id === fundDetail.currentBlockHistoryId,
					// 	);

					// if (+prevFundingAuthorityBlockBed?.status === PREBOOK_HISTORY_STATUS.INACTIVE)
					// 	return;
					if (!prevFundingAuthorityDetails) continue;
					const updatedFundInformation = await getUpdateBlockBedHistory(
						fundDetail,
						fundDetail.currentBlockHistoryId,
						prevFundingAuthorityDetails,
						updatedData,
					);
					if (updatedFundInformation) {
						const res = await hnadleUpdateFundDetail(
							fundDetail,
							updatedFundInformation,
						);
						// ✅ IMPORTANT: Update local working state
						if (+fundDetail?.fundSource === FUND_SOURCE_TYPE.LOCAL_AUTHORITY) {
							updatedLocalAuthorityListState = updatedLocalAuthorityListState.map(
								(item) => (item.id === res.id ? res : item),
							);
						} else {
							updatedLocalICBListState = updatedLocalICBListState.map((item) =>
								item.id === res.id ? res : item,
							);
						}
					}
				}
			} else {
				// This Else Condition for Create new Resident

				const isLiving = +formData?.admission?.residentStatus === RESIDENT_STATUS.LIVING;

				// This Execution only for Living so update the RoomHistory and BlockBed History
				if (isLiving) {
					// Generate history ID only when block bed is active
					const currentBlockHistoryId = isBlockBed ? generateUid() : '';
					const updatedFundDetails = isBlockBed
						? [
							{
								...activeFund,
								currentBlockHistoryId,
								currentBlockBedId: activeBlockBed?.id,
							},
						]
						: formData.fundDetails;
					const newRoomHistoryEntry = {
						id: generateUid(),
						roomId,
						bedId,
						bookingType: formData.admission.bookingType,
						sDate: moment(formData?.admission?.admissionDate).isSameOrBefore(
							DATA_MIGRATION_TO_DATE,
						)
							? '2026-01-01'
							: formData?.admission?.admissionDate,
						eDate: '',
						status:
							+formData.admission.bookingType === BOOKING_TYPE.SHARED
								? BED_STATUS.OCCUPIED
								: BED_STATUS.PRIVATE_OCCUPIED,
						note: '',
					};

					// Final combined resident data
					const newResidentData = {
						...formData,
						roomId,
						bedId,
						fundDetails: updatedFundDetails,
						roomHistory: [newRoomHistoryEntry],
					};

					const newResident = await createResident(newResidentData);
					updateResidentCache(newResident);
					updateResidentListWithInvoiceList(newResident);
					refetchRoomsWithBed();

					if (isBlockBed) {
						const updatedFundInformation: any = await getUpdateBlockBedHistory(
							activeFund,
							currentBlockHistoryId,
							fundingAuthorityDetails,
							newResident,
						);
						if (activeBlockBed && updatedFundInformation) {
							const res = hnadleUpdateFundDetail(activeFund, updatedFundInformation);
							await updateBlockBedReport(activeFund, res);
						}
					}
				} else {
					// This Else Execution for Rip/left during Create Time.

					// Get the NearestFundDetails by EndDate or Today OverLap
					const nearestFundDetails = getNearestByEndDateOrTodayOverLap(
						formData?.fundDetails,
					);

					// Check if the nearest fund has block bed active
					const isBlockBedByNearestFund =
						+nearestFundDetails?.blockBedStatus === BLOCK_BEDS_TYPE.YES;

					// Generate history ID only when block bed is active
					const nearestBlockBedHistoryId = isBlockBedByNearestFund ? generateUid() : '';

					// Get the nearest fund authority details
					const nearestFundAuthorityDetails: any = getActiveFundDetailsByLAOrICB(
						nearestFundDetails,
						localAuthorityList,
						localICBList,
					); // correct

					// Get the nearest block bed by end date or today overlap
					const nearestBlockBed = getNearestByEndDateOrTodayOverLap(
						nearestFundAuthorityDetails?.blockBeds || [],
					);

					// If the nearest fund has block bed active then update the fund details with block bed history
					const updatedFundDetails = isBlockBedByNearestFund
						? formData.fundDetails.map((fund: any) => {
							// Identify the same fund (use id or unique key)
							if (fund?.id === nearestFundDetails?.id) {
								return {
									...fund,
									currentBlockHistoryId: nearestBlockBedHistoryId,
									currentBlockBedId: nearestBlockBed?.id,
								};
							}
							return fund;
						})
						: formData.fundDetails;

					// Create new room history entry with correct start date and end Date
					const newRoomHistoryEntry = {
						id: generateUid(),
						roomId,
						bedId,
						bookingType: formData.admission.bookingType,
						sDate: moment(formData?.admission?.admissionDate).isSameOrBefore(
							DATA_MIGRATION_TO_DATE,
						)
							? '2026-01-01'
							: formData?.admission?.admissionDate,
						eDate:
							formData?.admission?.dateDischargeAndRip ||
							moment().format('YYYY-MM-DD'),
						status:
							+formData.admission.bookingType === BOOKING_TYPE.SHARED
								? BED_STATUS.OCCUPIED
								: BED_STATUS.PRIVATE_OCCUPIED,
						note: '',
					};
					// Final combined resident data
					const newResidentData = {
						...formData,
						roomId,
						bedId,
						fundDetails: updatedFundDetails,
						roomHistory: [newRoomHistoryEntry],
					};

					const newResident = await createResident(newResidentData);
					updateResidentCache(newResident);
					updateResidentListWithInvoiceList(newResident);
					refetchRoomsWithBed();

					// If the nearest fund has block bed active then update the block bed history with resident details
					if (isBlockBedByNearestFund) {
						const historyList = nearestFundAuthorityDetails?.blockBedHistory ?? [];
						const updatedBlockBedHistory: any = {
							residentId: newResident?.id,
							bedId: newResident?.bedId,
							roomId: newResident?.roomId,
							sDate: nearestFundDetails?.sDate || moment().format('YYYY-MM-DD'),
							eDate: nearestFundDetails?.eDate || moment().format('YYYY-MM-DD'),
							status: PREBOOK_HISTORY_STATUS.INACTIVE,
							blockBedId: nearestBlockBed?.id,
							id: nearestBlockBedHistoryId,
						};
						const updatedFundingAuthorityDetails = {
							...nearestFundAuthorityDetails,
							blockBedHistory: [
								...historyList, // existing history
								updatedBlockBedHistory, // new entry
							],
						};
						if (nearestBlockBed && updatedFundingAuthorityDetails) {
							const res = hnadleUpdateFundDetail(
								nearestFundDetails,
								updatedFundingAuthorityDetails,
							);
						}
					}
				}
			}

			navigate(-1);
		} catch (err) {
			console.error('Booking Submit Error:', err);
		} finally {
			setIsLoading(false);
		}
	};

	/**  Update Bed & Room History */
	const updateBedHistory = async (
		formData: any,
		current: any,
		selectedRoom?: any,
		selectedBed?: any,
	) => {
		const history = [...(current?.roomHistory || [])];
		const currentActiveFund = getActiveFundDetails(current?.fundDetails);
		const activeFund = getActiveFundDetails(formData?.fundDetails);

		const currRoom = current?.roomId;
		const currBed = current?.bedId;
		const prevPre = +currentActiveFund?.blockBedStatus;
		const prevStat = +current?.admission?.residentStatus;

		const nextRoom = selectedRoom?.id || formData?.roomId;
		const nextBed = selectedBed?.id || formData?.bedId;
		const nextPre = +activeFund?.blockBedStatus;
		const nextStat = +formData?.admission?.residentStatus;
		const booking = +formData?.admission?.bookingType;

		const changed = currRoom !== nextRoom || currBed !== nextBed || prevPre !== nextPre;

		//  No change at all
		if (!changed && prevStat === nextStat) return history;

		//  RIP/LEFT: just close
		if (nextStat === RESIDENT_STATUS.RIP || nextStat === RESIDENT_STATUS.LEFT_FROM_ROOM) {
			const dateDischargeAndRip =
				formData?.admission?.dateDischargeAndRip || moment().format('YYYY-MM-DD');
			const i = history.findIndex((h) => !h.eDate);
			if (i !== -1)
				history[i] = {
					...history[i],
					eDate: moment(dateDischargeAndRip).format('YYYY-MM-DD'),
				};
			return history;
		}

		//  LIVING (normal)
		const active = history.findIndex((h) => !h.eDate);
		if (active !== -1 && (changed || prevStat !== RESIDENT_STATUS.LIVING)) {
			history[active] = {
				...history[active],
				eDate: moment(selectedDate).subtract(1, 'day').format('YYYY-MM-DD'),
				status:
					prevPre !== nextPre
						? +booking === BOOKING_TYPE.SHARED
							? BED_STATUS.OCCUPIED
							: BED_STATUS.PRIVATE_OCCUPIED
						: history[active].status,
			};
		}

		//  Create new active entry
		history.push({
			id: generateUid(),
			roomId: nextRoom,
			bedId: nextBed,
			bookingType: booking,
			sDate: moment(selectedDate).format('YYYY-MM-DD'),
			eDate: '',
			status:
				booking === BOOKING_TYPE.SHARED ? BED_STATUS.OCCUPIED : BED_STATUS.PRIVATE_OCCUPIED,
			note: '',
			blockBedStatus: nextPre,
		});

		return history;
	};
	/** Update Bed & Room History */
	// const updateBedHistory = async (
	// 	formData: any,
	// 	current: any,
	// 	selectedDate: string,        // ✅ now explicit — no free variable
	// 	selectedRoom?: any,
	// 	selectedBed?: any,
	// ) => {
	// 	const history = [...(current?.roomHistory || [])];

	// 	const currentActiveFund = getActiveFundDetails(current?.fundDetails);
	// 	const activeFund = getActiveFundDetails(formData?.fundDetails);

	// 	const currRoom = current?.roomId;
	// 	const currBed = current?.bedId;
	// 	const prevPre = +currentActiveFund?.blockBedStatus;
	// 	const prevStat = +current?.admission?.residentStatus;

	// 	const nextRoom = selectedRoom?.id || formData?.roomId;
	// 	const nextBed = selectedBed?.id || formData?.bedId;
	// 	const nextPre = +activeFund?.blockBedStatus;
	// 	const nextStat = +formData?.admission?.residentStatus;
	// 	const booking = +formData?.admission?.bookingType;   // ✅ cast once, used consistently

	// 	const bedOrRoomChanged = currRoom !== nextRoom || currBed !== nextBed;
	// 	const preChanged = prevPre !== nextPre;
	// 	const changed = bedOrRoomChanged || preChanged;

	// 	// ✅ Nothing changed at all — bail early
	// 	if (!changed && prevStat === nextStat) return history;

	// 	// ✅ RIP / LEFT: close the open entry and stop — no new entry should be created
	// 	if (nextStat === RESIDENT_STATUS.RIP || nextStat === RESIDENT_STATUS.LEFT_FROM_ROOM) {
	// 		const dateDischargeAndRip =
	// 			formData?.admission?.dateDischargeAndRip || moment().format('YYYY-MM-DD');
	// 		const i = history.findIndex((h) => !h.eDate);
	// 		if (i !== -1) {
	// 			history[i] = {
	// 				...history[i],
	// 				eDate: moment(dateDischargeAndRip).format('YYYY-MM-DD'),
	// 			};
	// 		}
	// 		return history;   // ✅ explicit return — does not fall through to the push below
	// 	}

	// 	// LIVING (normal) — close the active entry if something meaningful changed
	// 	const activeIdx = history.findIndex((h) => !h.eDate);

	// 	if (activeIdx !== -1 && (changed || prevStat !== RESIDENT_STATUS.LIVING)) {
	// 		history[activeIdx] = {
	// 			...history[activeIdx],
	// 			eDate: moment(selectedDate).subtract(1, 'day').format('YYYY-MM-DD'),
	// 			// ✅ Only recalculate status when blockBedStatus specifically changed;
	// 			//    a bed/room move retains whatever status the entry already had.
	// 			...(preChanged && {
	// 				status:
	// 					booking === BOOKING_TYPE.SHARED
	// 						? BED_STATUS.OCCUPIED
	// 						: BED_STATUS.PRIVATE_OCCUPIED,
	// 			}),
	// 		};
	// 	}

	// 	// ✅ Only push a new entry when something actually changed
	// 	//    (guards against re-admitting when only status toggled back to LIVING
	// 	//     with no room/bed/pre change and no prior active entry)
	// 	if (changed || prevStat !== RESIDENT_STATUS.LIVING) {
	// 		history.push({
	// 			id: generateUid(),
	// 			roomId: nextRoom,
	// 			bedId: nextBed,
	// 			bookingType: booking,
	// 			sDate: moment(selectedDate).format('YYYY-MM-DD'),
	// 			eDate: '',
	// 			status:
	// 				booking === BOOKING_TYPE.SHARED
	// 					? BED_STATUS.OCCUPIED
	// 					: BED_STATUS.PRIVATE_OCCUPIED,
	// 			note: '',
	// 			blockBedStatus: nextPre,
	// 		});
	// 	}

	// 	return history;
	// };
	/**  Compute resident data based on room/bed selection */
	const residentData = useMemo(() => {
		if (!roomsList?.length) return null;

		setBookingType(currentResidentData?.admission?.bookingType || '');

		const currentRoomId = roomId || currentResidentData?.roomId;
		const currentBedId = bedId || currentResidentData?.bedId;

		const currentRoom: any = roomsList.find((room) => room.id === currentRoomId) || {};
		const currentBed: any = currentRoom.beds?.find((bed: any) => bed.id === currentBedId);

		setSelectedRoom(currentRoom);
		setSelectedBed(currentBed);

		return { ...currentResidentData, roomId: currentRoomId, bedId: currentBedId };
	}, [currentResidentData, roomId, bedId, roomsList]);

	const validateRoomAvailability = (roomId: string, bedId: string) => {
		const room = roomsList?.find((r: any) => r.id === roomId);
		const bedList = room?.beds || [];
		const hasUnavailableBeds = bedList.find(
			(bed: any) => bed?.id !== bedId && bed?.bedStatus !== BED_STATUS.AVAILABLE,
		);
		if (hasUnavailableBeds) {
			showAlert({
				title: 'Room Cannot Be Selected',
				text: 'This room is currently occupied or reserved. You cannot select Private. Please choose another room or select the Shared booking type.',
				icon: 'error',
			});

			return true;
		}

		return false;
	};
	const validateRoomAvailabilityRIPAndLEFT = (
		roomId: string,
		bedId: string,
		bookingType: number,
	) => {
		const room = roomsList?.find((r: any) => r.id === roomId);
		const bedList = room?.beds || [];
		const hasUnavailableBeds =
			bookingType === BOOKING_TYPE.SHARED
				? bedList.find(
					(bed: any) => bed?.id === bedId && bed?.bedStatus !== BED_STATUS.AVAILABLE,
				)
				: bedList.find((bed: any) => bed?.bedStatus !== BED_STATUS.AVAILABLE);
		if (hasUnavailableBeds) {
			showAlert({
				title: 'Room Cannot Be Selected',
				text: 'This room is currently occupied or reserved.',
				icon: 'error',
			});

			return true;
		}

		return false;
	};

	const activeFund = getActiveFundDetails(currentResidentData?.fundDetails);

	return (
		<PageWrapper title={residentData?.name || 'Bed Booking'}>
			<SubHeader>
				<SubHeaderLeft>
					<Breadcrumb
						list={[
							{
								title: pagesMenu.operations.subMenu.rooms.text,
								to: `/${pagesMenu.operations.subMenu.rooms.path}`,
							},
							{
								title: 'Bed Booking',
								to: `/${pagesMenu.operations.subMenu.rooms.path}/create`,
							},
						]}
					/>
					<SubheaderSeparator />
					<span className='text-muted'>
						<strong>Accommodation:</strong> Room {selectedRoom?.roomNumber}, Bed{' '}
						{selectedBed?.bedName}
					</span>
					{residentId && (
						<Button
							color='success'
							isLight
							rounded='pill'
							shadow='sm'
							className='py-1 ms-2'
							icon='RoomPreferences'
							onClick={() => setRoomChangeModalOpen(true)}>
							Change Room
						</Button>
					)}
				</SubHeaderLeft>

				<SubHeaderRight>
					<Button
						color='danger'
						isLight
						onClick={() => navigate(-1)}
						isDisable={isLoading}
						icon='ArrowBackIos'>
						Back
					</Button>
					<Button
						color='info'
						isLight
						onClick={handleBookingSubmit}
						isLoading={isLoading}
						icon='Save'>
						{residentId ? 'Update' : 'Book Now'}
					</Button>
				</SubHeaderRight>
			</SubHeader>

			<Page>
				<BedBookingForm
					ref={bedBookingFormRef}
					roomId={residentData?.roomId}
					bedId={residentData?.bedId}
					onGetResidentData={setCurrentResidentData}
					roomsList={roomsList}
					setBookingType={setBookingType}
				/>
				<RoomChangeModel
					isOpen={roomChangeModalOpen}
					setIsOpen={setRoomChangeModalOpen}
					roomsList={roomsList}
					roomId={residentData?.roomId}
					bedId={residentData?.bedId}
					onSelect={(room, bed, date) => {
						setSelectedRoom(room);
						setSelectedBed(bed);
						setSelectedDate(date);
					}}
					bookingType={bookingType}
				/>
			</Page>
		</PageWrapper>
	);
};

export default BedBookPage;
