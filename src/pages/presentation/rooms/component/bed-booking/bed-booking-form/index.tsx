import {
	useState,
	forwardRef,
	useImperativeHandle,
	useRef,
	useEffect,
	useMemo,
	useCallback,
	ChangeEvent,
} from 'react';
import {
	Card,
	CardBody,
	CardHeader,
	CardLabel,
	CardSubTitle,
	CardTitle,
	Input,
	Button,
	FormGroup,
	Option,
	Select,
	Alert,
	Textarea,
} from '../../../../../../components/bootstrap';

import {
	PLACEMENT_LIST,
	FUND_SOURCE_LIST,
	FUND_TYPE_LIST,
	FNC_STATUS_LIST,
	INCONT_STATUS_LIST,
	INVOICE_REQUEST_LIST,
	INVOICE_MODE_LIST,
	RESIDENT_STATUS_LIST,
	CONTRACT_STATUS_LIST,
	FUND_SOURCE_STATUS_TYPE_LIST,
	FAMILY_TOPUP_STATUS_LIST,
	BOOKING_TYPE_LIST,
	PRE_BOOKING_LIST,
	BLOCK_BEDS_TYPE_LIST,
} from '../../../../../../common/data/option';
import {
	FUND_SOURCE_TYPE,
	PLACEMENT_TYPE,
	FUND_SOURCE_STATUS_TYPE,
	INCONT_STATUS_TYPE,
	FUND_TYPE,
	RESIDENT_STATUS_TYPE,
	PRICE_PERIOD_STATUS,
	FNC_STATUS_TYPE,
} from '../../../../../../common/constant';

import { residentModel } from '../../../../../../common/model/resident';
import { getResidentById } from '../../../../../../common/api/resident';
import {
	getActiveFundDetails,
	notifyEntity,
	generateUid,
	getActiveRespiteDetails,
	getActiveFundDetailsByLAOrICB,
	isBlockBedsValidation,
	getActiveFundBlockBed,
	showAlert,
	getMaxDateBylist,
} from '../../../../../../helpers/helpers';

import showNotification from '../../../../../../components/extras/showNotification';
import SimpleReactValidator from 'simple-react-validator';
import { useLocation, useParams } from 'react-router-dom';
import { getAllByResidentIdInvoices } from '../../../../../../common/api/invoice';
import { useQuery } from '@tanstack/react-query';
import moment from 'moment';
import { PersonalInfoSection } from './personalInfoSection';
import { ContactInfoSection } from './contactInfoSection';
import { GuardianSection } from './guardianSection';
import { RespiteInfoTable } from './respiteInfoTable';
import { IncontInfoTable } from './incontInfoTable';
import { RoomPriceTable } from './roomPriceTable';
import { BillingSection } from './billingSection';

import {
	NOTIFY_TYPE,
	PREBOOK_HISTORY_STATUS,
	PREBOOK_TYPE,
	RESPITE_STATUS_TYPE,
	FAMILY_OR_THIRD_PARTY_TOPUP_STATUS,
	BLOCK_BEDS_TYPE,
	RESIDENT_STATUS,
	DATA_MIGRATION_TO_DATE,
	BOOKING_TYPE,
} from '../../../../../../common/constant/app';
import { AdvancePaymentSection } from './advancePaymentSection';
import { useMasterData } from '../../../../../../contexts/mastersContext';
import { FeesIncrementInfoTable } from './feesIncrementInfoTable';
import Swal from 'sweetalert2';
import { ILaAndICBModel } from '../../../../../../common/interface';
import { DateTimePicker, SearchableSelect } from '../../../../../../components/common';
import { validateJointFundingPrices } from '../../../../../../helpers/resident';

// Extracted components for better organization

export const BedBookingForm = forwardRef<any, any>(
	(
		{
			roomId = '',
			bedId = '',
			onGetResidentData = (data: any) => {},
			setBookingType = () => {},
			isFromResidentPage = false,
			roomsList = [],
		}: any,
		ref,
	) => {
		const migrationToDate = DATA_MIGRATION_TO_DATE;
		const { residentId }: any = useParams();
		const validator = useRef(new SimpleReactValidator());
		const [residentData, setResidentData] = useState<any>({ ...residentModel });
		const [, forceUpdate] = useState(0);
		const [isSubmited, setIsSubmited] = useState(false);
		const [isGetResidentLoading, setIsGetResidentLoading] = useState(false);
		const location = useLocation();
		const {
			localAuthorityList = [],
			localICBList = [],
			isLoading: isMasterLoading,
		} = useMasterData();
		const {
			data: invoiceList = [],
			isLoading,
			isError,
			refetch: onRelaodInviceList,
		} = useQuery({
			queryKey: ['invoiceList', residentId],
			queryFn: () => getAllByResidentIdInvoices(residentId),
			enabled: Boolean(residentId),
		});
		useEffect(() => {
			const fetchResident = async () => {
				setIsGetResidentLoading(true);
				try {
					const data: any = await getResidentById(residentId);
					setResidentData({ ...residentModel, ...data });
					onGetResidentData({ ...residentModel, ...data });
				} catch (error) {
					console.error('Error fetching resident:', error);
				} finally {
					setIsGetResidentLoading(false);
					validator.current.purgeFields();
				}
			};

			if (residentId) {
				fetchResident();
			}
		}, [residentId]);

		function hasDateRangeOverlap(range: { sDate: string; eDate: string }): boolean {
			if (!invoiceList?.length || !range) return false;

			const rangeStart = moment(range.sDate);
			const rangeEnd = moment(range.eDate);

			return invoiceList.some((item: any) => {
				const itemStart = moment(item.sDate);
				const itemEnd = moment(item.eDate);

				const overlapStart = moment.max(itemStart, rangeStart);
				const overlapEnd = moment.min(itemEnd, rangeEnd);

				return overlapEnd.isAfter(overlapStart);
			});
		}

		const checkInvoiceOverlap = useCallback(
			(range: any) => hasDateRangeOverlap(range),
			[invoiceList],
		);

		function isDateRangeValid(newRange: { sDate: string; eDate: string }): boolean {
			if (!invoiceList?.length || !newRange) return true; // no invoices, allow any change

			if (!newRange.eDate) return true;

			const newStart = moment(newRange.sDate);
			const newEnd = moment(newRange.eDate);
			return invoiceList.every((inv: any) => {
				const invStart = moment(inv.sDate);
				const invEnd = moment(inv.eDate);
				return invEnd.isBefore(newEnd);
			});
		}

		const handlePersonalChange = useCallback(
			(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
				const { id, value } = e.target;
				setResidentData((prevData: any) => ({
					...prevData,
					personal: {
						...prevData.personal,
						[id]: value,
					},
				}));
			},
			[],
		);

		function doesFundCoverAdmissionDate(
			fund: any,
			admissionDate: string,
			activeBlockBed: any | null,
		): boolean {
			if (!admissionDate) return true; // no admission date yet → skip
			if (!fund) return false;

			let startDate: string | null = null;
			let endDate: string | null = null;

			if (+fund.blockBedStatus === BLOCK_BEDS_TYPE.YES && activeBlockBed) {
				// Block bed fund → use block bed period
				startDate = activeBlockBed.sDate || null;
				endDate = activeBlockBed.eDate || null;
			} else {
				return true;
				// Normal fund → use fund's own dates
				startDate = fund.sDate || null;
				endDate = fund.eDate || null;
			}

			if (!startDate) return false; // no start date → cannot cover

			const admDate = moment(admissionDate);
			const start = moment(startDate);
			const end = endDate ? moment(endDate) : null;

			return start.isSameOrBefore(admDate) && (!end || end.isSameOrAfter(admDate));
		}

		function validateAdmissionFundCoverage(
			admissionDate: string,
			fundDetails: any[],
			resolveActiveBlockBed: (fund: any) => any | null,
			skipFundIndex: number = -1,
		): { valid: boolean; message: string } {
			if (!admissionDate) return { valid: true, message: '' };
			if (!fundDetails || fundDetails.length === 0) return { valid: true, message: '' };

			const formattedAdmission = moment(admissionDate).format('YYYY-MM-DD');

			const isCovered = fundDetails.some((fund: any, index: number) => {
				if (index === skipFundIndex) return false; // skip fund being currently edited if needed

				const activeBlockBed =
					+fund.blockBedStatus === BLOCK_BEDS_TYPE.YES
						? resolveActiveBlockBed(fund)
						: null;

				return doesFundCoverAdmissionDate(fund, formattedAdmission, activeBlockBed);
			});

			if (!isCovered) {
				return {
					valid: false,
					message: `No fund covers the admission date (${moment(formattedAdmission).format('DD-MM-YYYY')}). Please ensure at least one fund's period includes the admission date.`,
				};
			}

			return { valid: true, message: '' };
		}

		const handleAdmissionChange = useCallback(
			(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
				validator.current.purgeFields();
				const { id, value } = e.target;

				if (id === 'respiteEDate' || id === 'respiteSDate') {
					validator.current.purgeFields();
				}

				setResidentData((prevData: any) => {
					const isStatusChange = id === 'residentStatus';
					const newStatus = isStatusChange ? value : prevData.admission.residentStatus;

					const updatedAdmission = {
						...prevData.admission,
						[id]: value,
						...(isStatusChange &&
							newStatus !== RESIDENT_STATUS.LIVING && {
								dateDischargeAndRip: '',
							}),
					};
					if (id === 'admissionDate') {
						const resolveActiveBlockBed = (fund: any) => {
							const authorityDetails = getActiveFundDetailsByLAOrICB(
								fund,
								localAuthorityList,
								localICBList,
							);
							return getActiveFundBlockBed(
								authorityDetails?.blockBeds || [],
								fund?.eDate,
							);
						};

						const result = validateAdmissionFundCoverage(
							value, // new admission date
							prevData.fundDetails, // all funds
							resolveActiveBlockBed, // resolver
						);

						const hasValidSDate = prevData.fundDetails.some(
							(item: any) =>
								(item.nameOfLa && item.nameOfLa.trim() !== '') ||
								(item.nameIbc && item.nameIbc.trim() !== ''),
						);

						if (!result.valid && hasValidSDate) {
							showAlert({
								title: 'Invalid Admission Date',
								text: result.message,
								icon: 'error',
							});
							return { ...prevData };
						}
					}

					// calculate for respite weeks
					const { respiteSDate, respiteEDate, admissionDate } = updatedAdmission;

					// choose start date with priority
					const startDate = respiteSDate
						? moment(respiteSDate).format('YYYY-MM-DD')
						: admissionDate
							? moment(admissionDate).format('YYYY-MM-DD')
							: '';

					// update start date in state
					updatedAdmission.respiteSDate = startDate;

					if (startDate && respiteEDate) {
						const startMoment = moment(startDate); // IMPORTANT FIX
						const endMoment = moment(respiteEDate);

						const diffInDays = endMoment.diff(startMoment, 'days');

						updatedAdmission.noOfRespiteWeeks =
							diffInDays < 7 ? 1 : Math.ceil(diffInDays / 7);
					} else {
						updatedAdmission.noOfRespiteWeeks = '';
					}
					return {
						...prevData,

						admission: updatedAdmission,
					};
				});
			},
			[residentData, setResidentData],
		);

		const handleGuardianChange = useCallback((nok: any[]) => {
			setResidentData((prevData: any) => ({
				...prevData,
				nok,
			}));
		}, []);

		const handleBillingChange = useCallback(
			(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
				const { id, value } = e.target;
				setResidentData((prevData: any) => ({
					...prevData,
					billing: {
						...prevData.billing,
						[id]: value,
					},
				}));
			},
			[],
		);

		const handleNotesChange = useCallback(
			(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
				const { id, value } = e.target;
				setResidentData((prevData: any) => ({
					...prevData,
					[id]: value,
				}));
			},
			[],
		);

		const handleAdvancePaymentChange = useCallback(
			(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
				const { id, value } = e.target;
				setResidentData((prevData: any) => ({
					...prevData,
					advancePayment: {
						...prevData.advancePayment,
						[id]: value,
					},
				}));
			},
			[],
		);

		const handleRespiteChange = useCallback((index: number, key: string, value: string) => {
			validator.current.purgeFields();
			setResidentData((prevData: any) => {
				const updatedList = [...prevData.admission.respiteStatusList];
				updatedList[index] = {
					...updatedList[index],
					[key]: value,
				};
				validator.current.purgeFields();
				return {
					...prevData,
					admission: {
						...prevData.admission,
						respiteStatusList: updatedList,
					},
				};
			});
		}, []);

		const handleIncontChange = useCallback(
			(fundIndex: number, incontIndex: number, field: string, value: any) => {
				setResidentData((prev: any) => {
					const updatedFundDetails = [...prev.fundDetails];
					const updatedIncont = [...updatedFundDetails[fundIndex].incontDetails];
					updatedIncont[incontIndex] = {
						...updatedIncont[incontIndex],
						[field]: value,
					};
					updatedFundDetails[fundIndex] = {
						...updatedFundDetails[fundIndex],
						incontDetails: updatedIncont,
					};
					return { ...prev, fundDetails: updatedFundDetails };
				});
			},
			[],
		);

		const handleAddRespiteRow = useCallback(() => {
			setResidentData((prevData: any) => {
				const respiteList = prevData.admission.respiteStatusList || [];

				let newStartDate = '';

				// No existing rows → use admission.respiteEDate + 1 day
				if (respiteList.length === 0 && prevData.admission.respiteEDate) {
					const nextDate = moment(prevData.admission.respiteEDate)
						.add(1, 'days')
						.format('YYYY-MM-DD');
					newStartDate = nextDate;
				}

				// If there are existing rows → use last row’s eDate + 1 day
				if (respiteList.length > 0) {
					const lastRow = respiteList[respiteList.length - 1];
					if (lastRow.eDate) {
						const nextDate = moment(lastRow.eDate).add(1, 'days').format('YYYY-MM-DD');
						newStartDate = nextDate;
					}
				}

				// Create the new row
				const newRow = {
					id: generateUid(),
					status: '',
					sDate: newStartDate,
					eDate: '',
				};

				return {
					...prevData,
					admission: {
						...prevData.admission,
						respiteStatusList: [...respiteList, newRow],
					},
				};
			});
		}, [setResidentData]);

		const handleDeleteRespiteRow = useCallback((index: number) => {
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
			}).then((result) => {
				if (!result.isConfirmed) return;
				setResidentData((prevData: any) => {
					const updatedList = [...prevData.admission.respiteStatusList];
					updatedList.splice(index, 1);
					return {
						...prevData,
						admission: {
							...prevData.admission,
							respiteStatusList: updatedList,
						},
					};
				});
			});
		}, []);

		const handleAddIncontRow = useCallback((fundIndex: number) => {
			setResidentData((prev: any) => {
				const updatedFundDetails = [...prev.fundDetails];
				const fund = updatedFundDetails[fundIndex];

				// ✅ Add row only if last row is not empty (optional guard)
				if (
					fund.incontDetails.length === 0 ||
					fund.incontDetails[fund.incontDetails.length - 1].perWeek !== '' ||
					fund.incontDetails[fund.incontDetails.length - 1].sDate !== '' ||
					fund.incontDetails[fund.incontDetails.length - 1].eDate !== ''
				) {
					fund.incontDetails = [
						...fund.incontDetails,
						{ id: generateUid(), perWeek: '', sDate: '', eDate: '' },
					];
				}

				return { ...prev, fundDetails: updatedFundDetails };
			});
		}, []);

		const handleDeleteIncontRow = useCallback((fundIndex: number, incontIndex: number) => {
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
			}).then((result) => {
				if (!result.isConfirmed) return;
				setResidentData((prev: any) => {
					// Copy everything immutably
					const updatedFundDetails = prev.fundDetails.map((fund: any, idx: number) => {
						if (idx !== fundIndex) return fund; // leave others unchanged

						return {
							...fund,
							incontDetails: fund.incontDetails.filter(
								(_: any, idx: number) => idx !== incontIndex,
							),
						};
					});

					return { ...prev, fundDetails: updatedFundDetails };
				});
			});
		}, []);

		const handleRoomPriceChange = useCallback(
			(index: number, key: string, value: string) => {
				validator.current.purgeFields();

				setResidentData((prevData: any) => {
					const updatedList = [...prevData.roomPrice];

					// Build next state for the specific room price row
					const updatedRoomPrice = {
						...updatedList[index],
						[key]: value,
					};

					// ✅ Validate date range before committing update
					if (
						(key === 'sDate' || key === 'eDate') &&
						!isDateRangeValid(updatedRoomPrice) &&
						value
					) {
						// alert("❌ Selected date range conflicts with existing invoices.");
						// return prevData; // ⛔ Don't update state if invalid
					}

					updatedList[index] = updatedRoomPrice;

					return {
						...prevData,
						roomPrice: updatedList,
					};
				});
			},
			[isDateRangeValid, validator, setResidentData],
		);

		const handleAddRoomPriceRow = useCallback(() => {
			setResidentData((prevData: any) => {
				const updatedRoomPrice = prevData.roomPrice.map((row: any) => ({
					...row,
					status: PRICE_PERIOD_STATUS.INACTIVE,
				}));

				const newRow = {
					id: generateUid(),
					perWeek: '',
					sDate: moment(updatedRoomPrice[updatedRoomPrice.length - 1].eDate)
						.add(1, 'days')
						.format('YYYY-MM-DD'),
					eDate: '',
					status: PRICE_PERIOD_STATUS.ACTIVE,
					isBelowMinPrice: false,
					laContribution: 0,
				};

				return {
					...prevData,
					roomPrice: [...updatedRoomPrice, newRow],
				};
			});
		}, []);

		const handleDeleteRoomPriceRow = useCallback((index: number) => {
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
			}).then((result) => {
				if (!result.isConfirmed) return;
				setResidentData((prevData: any) => {
					const updatedList = [...prevData.roomPrice];
					if (updatedList.length > 1) {
						updatedList.splice(index, 1);
					}
					return {
						...prevData,
						roomPrice: updatedList,
					};
				});
			});
		}, []);

		const handleFundDetailChange = useCallback(
			(fundIndex: number, e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
				const { name, value } = e.target;

				setResidentData((prev: any) => {
					const updatedFundDetails = [...prev.fundDetails];
					const prevFund = updatedFundDetails[fundIndex] || {};

					let nextFund: any = {
						...prevFund,
						[name]: value,
					};
					let roomPrice = [...prev.roomPrice];

					// const bookingType = prev?.admission?.bookingType;
					// if (+nextFund.blockBedStatus === BLOCK_BEDS_TYPE.YES && +bookingType === BOOKING_TYPE.PRIVATE) {
					// 	showAlert({
					// 		title: 'Action Not Allowed',
					// 		text: 'Block Bed are not permitted for Single booking.',
					// 		icon: 'error',
					// 	});
					// 	return { ...prev };
					// }

					if (
						!isFromResidentPage &&
						+nextFund.blockBedStatus === BLOCK_BEDS_TYPE.YES &&
						(name === 'nameOfLa' || name === 'nameIbc')
					) {
						const fundingAuthorityDetails: any = getActiveFundDetailsByLAOrICB(
							nextFund,
							localAuthorityList,
							localICBList,
						); // correct

						const valid = isBlockBedsValidation(
							nextFund,
							fundingAuthorityDetails,
							residentData.id,
						);

						const activeBlockBed = getActiveFundBlockBed(
							fundingAuthorityDetails?.blockBeds || [],
							nextFund?.eDate,
						);

						if (+nextFund.blockBedStatus === BLOCK_BEDS_TYPE.YES) {
							const resolveActiveBlockBed = (fund: any) => {
								// For the fund being edited, use already resolved activeBlockBed
								// For others, resolve normally
								const authorityDetails = getActiveFundDetailsByLAOrICB(
									fund,
									localAuthorityList,
									localICBList,
								);
								return getActiveFundBlockBed(
									authorityDetails?.blockBeds || [],
									nextFund?.eDate,
								);
							};

							// Pass fundIndex as skipFundIndex so the current fund being edited is excluded,
							// and we check if OTHER funds already cover admission
							const otherFundsCoverResult = validateAdmissionFundCoverage(
								prev?.admission?.admissionDate,
								updatedFundDetails,
								resolveActiveBlockBed,
								fundIndex, // ← skip current fund being edited
							);
							if (!otherFundsCoverResult.valid) {
								const admissionDate = moment(prev?.admission?.admissionDate).format(
									'YYYY-MM-DD',
								);

								if (
									activeBlockBed?.sDate &&
									moment(admissionDate).isBefore(activeBlockBed.sDate)
								) {
									showAlert({
										title: 'Invalid Block Bed Date',
										text: `Block Bed starts on ${moment(activeBlockBed.sDate).format('DD-MM-YYYY')}, but admission date is ${moment(admissionDate).format('DD-MM-YYYY')}.`,
										icon: 'error',
									});
									return { ...prev };
								}

								if (
									activeBlockBed?.eDate &&
									moment(admissionDate).isAfter(activeBlockBed.eDate)
								) {
									showAlert({
										title: 'Invalid Block Bed Date',
										text: `Block Bed ended on ${moment(activeBlockBed.eDate).format('DD-MM-YYYY')}, but admission date is ${moment(admissionDate).format('DD-MM-YYYY')}.`,
										icon: 'error',
									});
									return { ...prev };
								}
							}

							// const admissionDate = prev?.admission?.admissionDate
							// 	? moment(prev.admission.admissionDate).format('YYYY-MM-DD')
							// 	: '';

							// const blockStartDate = activeBlockBed?.sDate;
							// const blockEndDate = activeBlockBed?.eDate;

							// // Before block start
							// if (blockStartDate && moment(admissionDate).isBefore(blockStartDate)) {
							// 	showAlert({
							// 		title: 'Invalid Admission Date',
							// 		text: `Block Bed start date is ${blockStartDate}. Admission date cannot be earlier than the Block Bed start date.`,
							// 		icon: 'error',
							// 	});
							// 	return { ...prev };
							// }

							// // After block end
							// if (blockEndDate && moment(admissionDate).isAfter(blockEndDate)) {
							// 	showAlert({
							// 		title: 'Invalid Admission Date',
							// 		text: `Admission date must fall within the Block Bed period (${blockStartDate} to ${blockEndDate}).`,
							// 		icon: 'error',
							// 	});
							// 	return { ...prev };
							// }
						}

						if (!valid) return { ...prev };
					}

					if (name === 'fundSource') {
						nextFund = {
							...nextFund,

							nameIbc: '',
							nameOfLa: '',

							// Clear fundType when fundSource changes
							fundType: '',

							clientId: '',
							icbClientId: '',

							// Clear the join fund amt
							jfLaRoomPrice: '', 
							jfIcbRoomPrice: '',

							// Clear all partial dependent fields
							clientContribution: '',
							clientContributionSdate: '',
							familyTopupStatus: '',
							familyTopupEffectiveDate: '',
							familyTopupPrice: '',
							thirdPartyTopupStatus: '',
							thirdPartyTopupEffectiveDate: '',
							thirdPartyTopupPrice: '',

							fncStatus: '',
							fncSdate: '',
							incontStatus: '',
						};

						if (+value === FUND_SOURCE_TYPE.PRIVATE) {
							nextFund.fundType = '';
						}
					}
					if (name === 'fundType') {
						if (+value !== FUND_TYPE.PARTIAL) {
							nextFund.clientContribution = '';
							nextFund.clientContributionSdate = '';

							nextFund.familyTopupStatus = '';
							nextFund.familyTopupEffectiveDate = '';
							nextFund.familyTopupPrice = '';

							nextFund.thirdPartyTopupStatus = '';
							nextFund.thirdPartyTopupEffectiveDate = '';
							nextFund.thirdPartyTopupPrice = '';
						}
					}

					if (name === 'fncStatus' && +value !== FNC_STATUS_TYPE.YES) {
						nextFund.fncSdate = '';
						nextFund.incontStatus = '';
					}

					if (
						name === 'familyTopupStatus' &&
						+value !== FAMILY_OR_THIRD_PARTY_TOPUP_STATUS.YES
					) {
						nextFund.familyTopupEffectiveDate = '';
						nextFund.familyTopupPrice = '';
					}

					if (
						name === 'thirdPartyTopupStatus' &&
						+value !== FAMILY_OR_THIRD_PARTY_TOPUP_STATUS.YES
					) {
						nextFund.thirdPartyTopupEffectiveDate = '';
						nextFund.thirdPartyTopupPrice = '';
					}

					updatedFundDetails[fundIndex] = nextFund;
					validator.current.purgeFields();

					return { ...prev, fundDetails: updatedFundDetails, roomPrice };
				});
			},
			[setResidentData, validator, localAuthorityList, localICBList],
		);

		const handleAddFundDetail = useCallback(() => {
			setResidentData((prev: any) => {
				const newFundDetail: any = {
					id: generateUid(),
					fundSource: '',
					sDate: '', //Date,
					eDate: '',
					status: '',
					incontDetails: [{ id: generateUid(), perWeek: '', sDate: '', eDate: '' }],
				};
				return {
					...prev,
					fundDetails: [...prev.fundDetails, newFundDetail],
				};
			});
		}, []);

		const handleDeleteFundDetail = useCallback((fundIndex: number) => {
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
			}).then((result) => {
				if (!result.isConfirmed) return;
				setResidentData((prev: any) => {
					const updatedFundDetails = prev.fundDetails.filter(
						(_: any, idx: number) => idx !== fundIndex,
					);
					return { ...prev, fundDetails: updatedFundDetails };
				});
			});
		}, []);

		const activeFundDetails = useMemo(() => {
			return getActiveFundDetails(residentData?.fundDetails);
		}, [residentData?.fundDetails]);

		const activeRespiteStatusList = useMemo(() => {
			return getActiveRespiteDetails(residentData?.admission?.respiteStatusList);
		}, [residentData?.admission?.respiteStatusList]);

		const handleFormSubmit = useCallback(() => {
			setIsSubmited(true);

			const isValid = validator.current.allValid();

			if (!isValid) {
				validator.current.showMessages();
				forceUpdate(1);

				showAlert({
					title: 'Incomplete Form',
					text: 'Some required fields are missing. Please fill in all mandatory fields before proceeding.',
					icon: 'error',
				});

				return null;
			}

			if (
				!isFromResidentPage &&
				RESIDENT_STATUS.LIVING === residentData?.admission?.residentStatus &&
				(!activeFundDetails || Object.keys(activeFundDetails).length === 0)
			) {
				showAlert({
					title: 'Missing Fund',
					text: 'At least one active fund period is required.',
					icon: 'error',
				});
				return null;
			}

			// if (
			// 	+residentData?.admission?.bookingType === BOOKING_TYPE.PRIVATE &&
			// 	activeFundDetails?.blockBedStatus === BLOCK_BEDS_TYPE.YES
			// ) {
			// 	showAlert({
			// 		title: 'Action Not Allowed',
			// 		text: 'Block Bed is not permitted for single booking.',
			// 		icon: 'error',
			// 	});
			// 	return null;
			// }

			// Joint Fund Validation for Mapped Room Price

			const isValidJoinFund = validateJointFundingPrices(residentData);

			if (!isValidJoinFund) {
				showAlert({
					title: 'Invalid Room Price',
					text: 'Joint funding (LA and ICB) amounts must be equal to the room price for overlapping periods.',
					icon: 'error',
				});
				return;
			}

			const activePricePeriod = residentData?.roomPrice?.find(
				({ status }: any) => +status === PRICE_PERIOD_STATUS.ACTIVE,
			);

			if (!activePricePeriod) {
				return { ...residentData };
			}

			const activeMinPrice = Number(activePricePeriod.pricePerWeek) || 0;

			const fundList = Array.isArray(residentData?.fundDetails)
				? residentData.fundDetails
				: [];

			const roomPrice = Array.isArray(residentData?.roomPrice) ? residentData.roomPrice : [];

			const updatedRoomPrice = roomPrice.map((price: any) => {
				const priceStart = moment(price.sDate);
				const priceEnd = moment(price.eDate);

				let laInfo = Array.isArray(price.laOrContributionInfo)
					? [...price.laOrContributionInfo]
					: [];
				const maxDate = (a: moment.Moment, b: moment.Moment) => (a.isAfter(b) ? a : b);
				const minDate = (a: moment.Moment, b: moment.Moment) => (a.isBefore(b) ? a : b);

				fundList.forEach((fund: any) => {
					const fundStart = moment(fund.sDate);
					const fundEnd = moment(fund.eDate);

					if (!fundStart.isValid() || !fundEnd.isValid()) return;

					// ⛔ No overlap
					if (fundEnd.isBefore(priceStart) || fundStart.isAfter(priceEnd)) return;

					// ✅ Overlap range
					const overlapStart = maxDate(priceStart, fundStart);
					const overlapEnd = minDate(priceEnd, fundEnd);

					const perWeek = Number(price.perWeek || 0);
					const isBelowMinPrice = perWeek < activeMinPrice;

					const isPartialFunding = fund.fundType === FUND_TYPE.PARTIAL;

					const clientContribution = Number(fund.clientContribution || 0);
					const familyTopupPrice = Number(fund.familyTopupPrice || 0);
					const thirdPartyTopupPrice = Number(fund.thirdPartyTopupPrice || 0);

					const laContribution = isPartialFunding
						? perWeek - (clientContribution + familyTopupPrice + thirdPartyTopupPrice)
						: 0;

					const contributionInfo = {
						sDate: overlapStart.format('YYYY-MM-DD'),
						eDate: overlapEnd.format('YYYY-MM-DD'),
						perWeek: isPartialFunding ? laContribution : '',
						// fundId: fund.id,
					};

					const index = laInfo.findIndex(
						(x: any) =>
							// x.fundId === fund.id &&
							x.sDate === contributionInfo.sDate &&
							x.eDate === contributionInfo.eDate,
						// !!x.perWeek,
					);

					if (index !== -1) {
						// 🔁 Update existing item at same index
						laInfo[index] = {
							...laInfo[index],
							...contributionInfo,
						};
					} else {
						// ➕ Add new item
						laInfo.push(contributionInfo);
					}

					if (isBelowMinPrice) {
						showNotification(
							'Price Below Minimum',
							`Weekly price (${perWeek}) is below minimum (${activeMinPrice})`,
							'warning',
						);
					}
				});

				return {
					...price,
					laOrContributionInfo: laInfo,
				};
			});

			// ✅ RETURN CLEAN OBJECT (NO MUTATION)
			return {
				...residentData,
				roomPrice: updatedRoomPrice,
			};
		}, [residentData, isFromResidentPage, activeFundDetails]);

		useImperativeHandle(ref, () => ({
			residentSubmitForm: handleFormSubmit,
			getResidentData: () => ({ ...residentData }),
		}));

		// fees increment functions
		// Add new Fees Increment row
		const handleAddFeesIncrement = useCallback(() => {
			const newRow = { id: generateUid(), percentage: '', date: '' };
			setResidentData((prevData: any) => ({
				...prevData,
				admission: {
					...prevData.admission,
					feesIncrementInfo: [...(prevData.admission.feesIncrementInfo || []), newRow],
				},
			}));
		}, []);

		// Delete a row (minimum one should remain)
		const handleDeleteFeesIncrement = useCallback((index: number) => {
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
			}).then((result) => {
				if (!result.isConfirmed) return;
				setResidentData((prevData: any) => {
					const updatedList = [...(prevData.admission.feesIncrementInfo || [])];
					if (updatedList.length > 1) updatedList.splice(index, 1);
					return {
						...prevData,
						admission: {
							...prevData.admission,
							feesIncrementInfo: updatedList,
						},
					};
				});
			});
		}, []);

		//  Handle value change
		const handleFeesIncrementChange = useCallback(
			(index: number, key: string, value: string) => {
				validator.current.purgeFields();
				setResidentData((prevData: any) => {
					const updatedList = [...(prevData.admission.feesIncrementInfo || [])];
					updatedList[index] = { ...updatedList[index], [key]: value };
					return {
						...prevData,
						admission: {
							...prevData.admission,
							feesIncrementInfo: updatedList,
						},
					};
				});
			},
			[],
		);

		const isDisableTypeOfPlacement = useMemo(() => {
			const list = residentData?.admission?.respiteStatusList || [];

			return list.some(
				(item: any) =>
					item.status?.toString().trim() !== '' ||
					item.sDate?.toString().trim() !== '' ||
					item.eDate?.toString().trim() !== '',
			);
		}, [residentData?.admission?.respiteStatusList]);

		const AdmissionSection = useMemo(
			() => (
				<Card>
					<CardHeader>
						<CardLabel icon='Phonelink' iconColor='danger'>
							<CardTitle tag='div' className='h5'>
								Admission
							</CardTitle>
							<CardSubTitle tag='div' className='h6'>
								Resident admission information
							</CardSubTitle>
						</CardLabel>
					</CardHeader>
					<CardBody>
						<div className='row g-4'>
							<div className='col-md-6'>
								<DateTimePicker
									id='admissionDate'
									label={'Admission Date'}
									isFloating
									// onKeyDown={(e) => e.preventDefault()}
									placeholder={'Admission Date'}
									maxDate={isFromResidentPage ? migrationToDate : ''}
									value={residentData.admission.admissionDate}
									onChange={handleAdmissionChange}
									isValid={validator.current.fieldValid('Admission Date')}
									isTouched={isSubmited}
									invalidFeedback={validator.current.message(
										'Admission Date',
										residentData.admission.admissionDate,
										'required',
									)}
								/>
							</div>

							<div className='col-6'>
								<FormGroup
									id='typeOfPlacement'
									label='Type of Placement'
									isFloating>
									<SearchableSelect
										disabled={isDisableTypeOfPlacement}
										id='typeOfPlacement'
										name='typeOfPlacement'
										onChange={handleAdmissionChange}
										value={residentData.admission.typeOfPlacement}
										isValid={validator.current.fieldValid('Type of Placement')}
										isTouched={isSubmited}
										invalidFeedback={validator.current.message(
											'Type of Placement',
											residentData.admission.typeOfPlacement,
											'required',
										)}
										options={PLACEMENT_LIST}
										placeholder='Select Type of Placement '
									/>
								</FormGroup>
							</div>
							{PLACEMENT_TYPE.RESPITE === +residentData.admission.typeOfPlacement && (
								<>
									<div className='col-md-6'>
										<FormGroup
											id='respiteSDate'
											label='Respite Start Date'
											isFloating>
											<DateTimePicker
												isFloating
												placeholder='Respite Start Date'
												minDate={residentData?.admission?.admissionDate}
												maxDate={isFromResidentPage ? migrationToDate : ''}
												value={
													residentData?.admission?.respiteSDate
														? residentData.admission.respiteSDate
														: residentData?.admission?.admissionDate
															? residentData.admission.admissionDate
															: ''
												}
												onChange={handleAdmissionChange}
												isValid={validator.current.fieldValid(
													'Respite Start Date',
												)}
												isTouched={isSubmited}
												invalidFeedback={validator.current.message(
													'Respite Start Date',
													residentData.admission.respiteSDate,
													'required',
												)}
											/>
										</FormGroup>
									</div>

									<div className='col-md-6'>
										<FormGroup
											id='respiteEDate'
											label='Respite End Date'
											isFloating>
											<DateTimePicker
												isFloating
												maxDate={isFromResidentPage ? migrationToDate : ''}
												minDate={
													residentData?.admission?.respiteSDate || ''
												}
												placeholder='Respite End Date'
												value={residentData?.admission?.respiteEDate}
												onChange={handleAdmissionChange}
												isValid={validator.current.fieldValid(
													'Respite End Date',
												)}
												isTouched={isSubmited}
												invalidFeedback={validator.current.message(
													'Respite End Date',
													residentData?.admission?.respiteEDate,
													'required',
												)}
											/>
										</FormGroup>
									</div>
									<div className='col-md-6'>
										<FormGroup
											id='noOfRespiteWeeks'
											label='No. of Respite Weeks'
											isFloating>
											<Input
												readOnly
												type='number'
												id='noOfRespiteWeeks'
												name='noOfRespiteWeeks'
												placeholder='Number of Respite Weeks'
												value={
													residentData?.admission?.noOfRespiteWeeks || ''
												}
											/>
										</FormGroup>
									</div>

									{residentData?.admission?.respiteEDate && (
										<div className='col-md-12'>
											<RespiteInfoTable
												data={residentData}
												onAdd={handleAddRespiteRow}
												onDelete={handleDeleteRespiteRow}
												onChange={handleRespiteChange}
												validator={validator.current}
												isSubmited={isSubmited}
												setResidentData={setResidentData}
											/>
										</div>
									)}
								</>
							)}

							<div className='col-6'>
								<FormGroup id='invoiceRequest' label='Invoice Request' isFloating>
									<SearchableSelect
										id='invoiceRequest'
										name='invoiceRequest'
										// ariaLabel='Invoice Request'
										onChange={handleAdmissionChange}
										value={residentData.admission.invoiceRequest}
										isValid={validator.current.fieldValid('Invoice Request')}
										isTouched={isSubmited}
										invalidFeedback={validator.current.message(
											'Invoice Request',
											residentData.admission.invoiceRequest,
											'required',
										)}
										placeholder='Select Invoice Request'
										options={INVOICE_REQUEST_LIST}
									/>
								</FormGroup>
								{}
							</div>

							<div className='col-6'>
								<FormGroup id='invoiceMode' label='Invoice Mode' isFloating>
									<SearchableSelect
										id='invoiceMode'
										name='invoiceMode'
										onChange={handleAdmissionChange}
										value={residentData.admission.invoiceMode}
										isValid={validator.current.fieldValid('Invoice Mode')}
										isTouched={isSubmited}
										invalidFeedback={validator.current.message(
											'Invoice Mode',
											residentData.admission.invoiceMode,
											'required',
										)}
										placeholder='Select Invoice Mode'
										options={INVOICE_MODE_LIST}
									/>
								</FormGroup>
							</div>

							<div className='col-6'>
								<FormGroup id='residentStatus' label='Resident Status' isFloating>
									<SearchableSelect
										id='residentStatus'
										name='residentStatus'
										onChange={handleAdmissionChange}
										value={residentData.admission.residentStatus}
										isValid={validator.current.fieldValid('Resident Status')}
										isTouched={isSubmited}
										invalidFeedback={validator.current.message(
											'Resident Status',
											residentData.admission.residentStatus,
											'required',
										)}
										placeholder='Select Resident Status'
										options={RESIDENT_STATUS_LIST}
									/>
								</FormGroup>
							</div>

							{[RESIDENT_STATUS_TYPE.RIP, RESIDENT_STATUS_TYPE.LEFT].includes(
								residentData.admission.residentStatus,
							) && (
								<div className='col-md-6'>
									<DateTimePicker
										id='dateDischargeAndRip'
										label='Date of Discharge/RIP'
										isFloating
										maxDate={isFromResidentPage ? migrationToDate : ''}
										placeholder='Date of Discharge/RIP'
										onChange={handleAdmissionChange}
										value={residentData.admission.dateDischargeAndRip}
										isValid={validator.current.fieldValid(
											'Date of Discharge/RIP',
										)}
										isTouched={isSubmited}
										invalidFeedback={validator.current.message(
											'Date of Discharge/RIP',
											residentData.admission.dateDischargeAndRip,
											'required',
										)}
										minDate={residentData?.admission?.admissionDate}
									/>
								</div>
							)}

							<div className='col-md-6'>
								<FormGroup id='contractStatus' label='Contract Status' isFloating>
									<SearchableSelect
										id='contractStatus'
										name='contractStatus'
										onChange={handleAdmissionChange}
										value={residentData.admission.contractStatus}
										isValid={validator.current.fieldValid('Contract Status')}
										isTouched={isSubmited}
										invalidFeedback={validator.current.message(
											'Contract Status',
											residentData.admission.contractStatus,
											'required',
										)}
										placeholder='Select Contract Status'
										options={CONTRACT_STATUS_LIST}
									/>
								</FormGroup>
							</div>
							<div className='col-6'>
								<FormGroup id='bookingType' label='Booking Type' isFloating>
									<SearchableSelect
										id='bookingType'
										name='bookingType'
										onChange={(
											e: React.ChangeEvent<
												HTMLInputElement | HTMLSelectElement
											>,
										) => {
											handleAdmissionChange(e);
											// checkRoomAvailability(e);
											setBookingType(+e.target.value);
										}}
										value={residentData?.admission?.bookingType}
										isValid={validator.current.fieldValid('Type of Booking')}
										isTouched={isSubmited}
										invalidFeedback={validator.current.message(
											'Type of Booking',
											residentData?.admission?.bookingType,
											'required',
										)}
										options={BOOKING_TYPE_LIST}
										placeholder='Select Booking Type'
									/>
								</FormGroup>
							</div>

							{isFromResidentPage && (
								<>
									<div className='col-6'>
										<FormGroup id='roomId' label='Room Number' isFloating>
											<SearchableSelect
												id='roomId'
												name='roomId'
												onChange={(e: any) => {
													setResidentData((prev: any) => ({
														...prev,
														roomId: e.target.value,
													}));
												}}
												value={residentData?.roomId || ''}
												isValid={validator.current.fieldValid(
													'Room Number',
												)}
												isTouched={isSubmited}
												invalidFeedback={validator.current.message(
													'Room Number',
													residentData.roomId,
													'required',
												)}
												placeholder='Select Room Number'
												labelKey='roomNumber'
												valueKey='id'
												options={roomsList}
											/>
										</FormGroup>
									</div>
									{residentData.roomId && (
										<div className='col-6'>
											<FormGroup id='bedId' label='Bed Number' isFloating>
												<SearchableSelect
													id='bedId'
													name='bedId'
													onChange={(e: any) => {
														setResidentData((prev: any) => ({
															...prev,
															bedId: e.target.value,
														}));
													}}
													value={residentData.bedId || ''}
													disabled={
														!residentData.roomId || !residentData.roomId
													}
													isValid={validator.current.fieldValid(
														'Bed Number',
													)}
													isTouched={isSubmited}
													invalidFeedback={validator.current.message(
														'Bed Number',
														residentData.bedId,
														'required',
													)}
													placeholder='Select Bed Number'
													options={
														roomsList?.find(
															(room: any) =>
																room.id == residentData.roomId,
														).beds
													}
													labelKey='bedName'
													valueKey='id'
												/>
											</FormGroup>
										</div>
									)}
								</>
							)}
							{(+(activeRespiteStatusList?.status || 0) ===
								RESPITE_STATUS_TYPE.EXTENDED_WITH_PERMANENT ||
								+residentData?.admission?.typeOfPlacement ===
									PLACEMENT_TYPE.PERMANENT) &&
								(+activeFundDetails?.fundSource === FUND_SOURCE_TYPE.PRIVATE ||
									+activeFundDetails?.familyTopupStatus ===
										FAMILY_OR_THIRD_PARTY_TOPUP_STATUS.YES) && (
									<div className='col-md-12'>
										<FeesIncrementInfoTable
											data={residentData}
											onAdd={handleAddFeesIncrement}
											onDelete={handleDeleteFeesIncrement}
											onChange={handleFeesIncrementChange}
											validator={validator.current}
											isSubmited={isSubmited}
										/>
									</div>
								)}
						</div>
					</CardBody>
				</Card>
			),
			[
				residentData,
				handleAdmissionChange,
				handleAddRespiteRow,
				handleDeleteRespiteRow,
				handleRespiteChange,
				isSubmited,
			],
		);

		function getMaxDate(dates: string[]) {
			if (!dates?.length) return null;

			return dates.reduce((max, current) =>
				moment(current).isAfter(moment(max)) ? current : max,
			);
		}

		const getMinMaxDateForFund = (fundInfo: any, fundIndex: number) => {
			const prevFund = residentData?.fundDetails?.[fundIndex - 1];
			const admission = residentData?.admission;

			const startDate =
				fundIndex > 0
					? moment(prevFund?.eDate || prevFund?.sDate)
							.add(1, 'day')
							.format('YYYY-MM-DD')
					: residentData?.admission?.admissionDate;

			const fallback = { min: startDate, max: isFromResidentPage ? migrationToDate : '' };

			if (
				+fundInfo.blockBedStatus !== BLOCK_BEDS_TYPE.YES &&
				admission.typeOfPlacement === PLACEMENT_TYPE.PERMANENT
			)
				return fallback;

			if (admission.typeOfPlacement === PLACEMENT_TYPE.RESPITE) {
				const allRespetEDate = admission?.respiteStatusList?.map((res: any) => res.eDate);
				const respiteMaxEdate = getMaxDate([admission.respiteEDate, ...allRespetEDate]);

				return {
					min: startDate,
					max: respiteMaxEdate || (isFromResidentPage ? migrationToDate : ''),
				};
			}
			const fundingAuthorityDetails = getActiveFundDetailsByLAOrICB(
				fundInfo,
				localAuthorityList,
				localICBList,
			);
			const activeBlockBed = getActiveFundBlockBed(
				fundingAuthorityDetails?.blockBeds,
				fundInfo?.eDate,
			);

			if (!fundingAuthorityDetails?.blockBeds?.length || !activeBlockBed) return fallback;

			return {
				min: moment.max(
					moment(residentData?.admission?.admissionDate),
					moment(activeBlockBed?.sDate),
				),

				max:
					activeBlockBed?.eDate && isFromResidentPage
						? moment.min(moment(activeBlockBed.eDate), moment(migrationToDate))
						: moment(activeBlockBed?.eDate ?? migrationToDate),
			};
		};

		const FundDetailsSection = useMemo(
			() => (
				<Card>
					<CardHeader>
						<CardLabel icon='Phonelink' iconColor='danger'>
							<CardTitle tag='div' className='h5'>
								Fund Details
							</CardTitle>
							<CardSubTitle tag='div' className='h6'>
								Resident fund information
							</CardSubTitle>
						</CardLabel>
						<div className='card-header-actions'>
							<Button
								color='info'
								icon='AddCircleOutline'
								size='sm'
								isLight
								onClick={handleAddFundDetail}>
								Add Fund Source
							</Button>
						</div>
					</CardHeader>
					<CardBody>
						{residentData?.fundDetails?.map((fundDetail: any, fundIndex: number) => {
							const isJointFunding =
								fundDetail?.fundSource === FUND_SOURCE_TYPE.JOINT_FUNDNG;
							const isPrivate = +fundDetail?.fundSource === FUND_SOURCE_TYPE.PRIVATE;

							const isICB = +fundDetail?.fundSource === FUND_SOURCE_TYPE.CHC;
							const isFncEnabled = fundDetail.fncStatus === FNC_STATUS_TYPE.YES;

							const clientIdBaseKey = isICB
								? 'icbClientId'
								: isJointFunding
									? 'clientId'
									: 'clientId';

							const clientIdLabel = isJointFunding ? 'LA Client Id' : 'Client Id';

							const clientIdKey = `${clientIdBaseKey}-${fundIndex + 1}`;

							const clientIdValue = isICB
								? fundDetail?.icbClientId
								: fundDetail?.clientId;

							// These Condition for Showing the Fnc Client Id or ICB Client Id
							const shouldShowClientId = (isFncEnabled && !isICB) || isJointFunding;

							const clientIdLabelForFncOrICB = isJointFunding
								? 'ICB Client Id'
								: 'FNC Client Id';

							return (
								<div className='row g-4' key={fundIndex}>
									<div className='col-12 d-flex justify-content-between align-items-center'>
										<h6 className='mb-0'>Fund Source #{fundIndex + 1}</h6>
										{residentData.fundDetails.length > 1 && (
											<Button
												color='danger'
												isLight
												icon='Delete'
												size='sm'
												isDisable={checkInvoiceOverlap(fundDetail)}
												onClick={() => handleDeleteFundDetail(fundIndex)}>
												Remove
											</Button>
										)}
									</div>
									<div className='col-6'>
										<FormGroup
											id={`blockBedStatus-${fundIndex + 1}`}
											label='Block Bed'
											isFloating>
											<SearchableSelect
												id='blockBedStatus'
												name='blockBedStatus'
												onChange={(e: ChangeEvent<HTMLSelectElement>) =>
													handleFundDetailChange(fundIndex, e)
												}
												value={fundDetail.blockBedStatus}
												isValid={validator.current.fieldValid(
													`Block Bed ${fundIndex + 1}`,
												)}
												isTouched={isSubmited}
												invalidFeedback={validator.current.message(
													`Block Bed ${fundIndex + 1}`,
													fundDetail.blockBedStatus,
													'required',
												)}
												placeholder='Select Block Bed'
												options={BLOCK_BEDS_TYPE_LIST}
											/>
										</FormGroup>
									</div>

									<div className='col-6'>
										<FormGroup
											id={`fundSource-${fundIndex + 1}`}
											label='Fund Source'
											isFloating>
											<SearchableSelect
												name='fundSource'
												id='fundSource'
												value={fundDetail.fundSource}
												onChange={(e: ChangeEvent<HTMLSelectElement>) =>
													handleFundDetailChange(fundIndex, e)
												}
												isValid={validator.current.fieldValid(
													`Fund Source ${fundIndex + 1}`,
												)}
												isTouched={isSubmited}
												invalidFeedback={validator.current.message(
													`Fund Source ${fundIndex + 1}`,
													fundDetail.fundSource,
													'required',
												)}
												placeholder='Select Fund Source'
												options={
													+fundDetail?.blockBedStatus ===
													BLOCK_BEDS_TYPE.YES
														? FUND_SOURCE_LIST.filter(
																(item) =>
																	item.value !==
																		FUND_SOURCE_TYPE.PRIVATE &&
																	item.value !==
																		FUND_SOURCE_TYPE.JOINT_FUNDNG,
															)
														: FUND_SOURCE_LIST
												}
											/>
										</FormGroup>
									</div>
									{/* CHC - Name of ICB */}
									{(+fundDetail.fundSource === FUND_SOURCE_TYPE.CHC ||
										+fundDetail.fundSource ===
											FUND_SOURCE_TYPE.JOINT_FUNDNG) && (
										<div className='col-6'>
											<FormGroup
												id={`nameIbc-${fundIndex + 1}`}
												label='Name of ICB'
												isFloating>
												<SearchableSelect
													name='nameIbc'
													id='nameIbc'
													value={fundDetail.nameIbc || ''}
													onChange={(
														e: ChangeEvent<HTMLSelectElement>,
													) => {
														handleFundDetailChange(fundIndex, e);
													}}
													isValid={validator.current.fieldValid(
														`Name of ICB ${fundIndex + 1}`,
													)}
													isTouched={isSubmited}
													invalidFeedback={validator.current.message(
														`Name of ICB ${fundIndex + 1}`,
														fundDetail.nameIbc,
														'required',
													)}
													options={localICBList}
													placeholder='Select ICB'
													valueKey='id'
													labelKey='name'
												/>
											</FormGroup>
										</div>
									)}

									{/* Local Authority - Name of LA */}
									{(+fundDetail.fundSource === FUND_SOURCE_TYPE.LOCAL_AUTHORITY ||
										+fundDetail.fundSource ===
											FUND_SOURCE_TYPE.JOINT_FUNDNG) && (
										<div className='col-6'>
											<FormGroup
												id={`nameOfLa-${fundIndex + 1}`}
												label='Name of the LA'
												isFloating>
												<SearchableSelect
													name='nameOfLa'
													id='nameOfLa'
													value={fundDetail.nameOfLa || ''}
													onChange={(
														e: ChangeEvent<HTMLSelectElement>,
													) => {
														handleFundDetailChange(fundIndex, e);
													}}
													isValid={validator.current.fieldValid(
														`Name of The LA ${fundIndex + 1}`,
													)}
													isTouched={isSubmited}
													invalidFeedback={validator.current.message(
														`Name of The LA ${fundIndex + 1}`,
														fundDetail.nameOfLa,
														'required',
													)}
													options={localAuthorityList}
													placeholder='Select Name Of LA'
													valueKey='id'
													labelKey='name'
												/>
											</FormGroup>
										</div>
									)}
									{+fundDetail.fundSource === FUND_SOURCE_TYPE.JOINT_FUNDNG && (
										<>
											<div className='col-6'>
												<FormGroup
													id={`jfIcbRoomPrice-${fundIndex + 1}`}
													label='Joint Fund ICB Price'
													isFloating>
													<Input
														name='jfIcbRoomPrice'
														type='number'
														placeholder='jfIcbRoomPrice'
														value={fundDetail?.jfIcbRoomPrice || ''}
														onChange={(
															e: ChangeEvent<HTMLInputElement>,
														) => handleFundDetailChange(fundIndex, e)}
														isValid={validator.current.fieldValid(
															`Joint Fund ICB Price ${fundIndex + 1}`,
														)}
														isTouched={isSubmited}
														invalidFeedback={validator.current.message(
															`Joint Fund ICB Price ${fundIndex + 1}`,
															fundDetail?.jfIcbRoomPrice,
															'required|numeric',
														)}
													/>
												</FormGroup>
											</div>
											<div className='col-6'>
												<FormGroup
													id={`jfLaRoomPrice-${fundIndex + 1}`}
													label='Joint Fund LA Price'
													isFloating>
													<Input
														name='jfLaRoomPrice'
														type='number'
														placeholder='jfLaRoomPrice'
														value={fundDetail?.jfLaRoomPrice || ''}
														onChange={(
															e: ChangeEvent<HTMLInputElement>,
														) => handleFundDetailChange(fundIndex, e)}
														isValid={validator.current.fieldValid(
															`Joint Fund LA Price ${fundIndex + 1}`,
														)}
														isTouched={isSubmited}
														invalidFeedback={validator.current.message(
															`Joint Fund LA Price ${fundIndex + 1}`,
															fundDetail?.jfLaRoomPrice,
															'required|numeric',
														)}
													/>
												</FormGroup>
											</div>
										</>
									)}

									{!isPrivate && (
										<div className='col-md-6'>
											<FormGroup
												id={clientIdBaseKey}
												label={clientIdLabel}
												isFloating>
												<Input
													id={clientIdKey}
													type='text'
													name={clientIdBaseKey}
													placeholder={clientIdLabel}
													value={clientIdValue || ''}
													onChange={(e: ChangeEvent<HTMLInputElement>) =>
														handleFundDetailChange(fundIndex, e)
													}
													isValid={validator.current.fieldValid(
														clientIdKey,
													)}
													isTouched={isSubmited}
													invalidFeedback={validator.current.message(
														clientIdKey,
														clientIdValue,
														'required',
													)}
												/>
											</FormGroup>
										</div>
									)}

									<div className='col-6'>
										<DateTimePicker
											id={`sdate-${fundIndex + 1}`}
											label='Start Date'
											isFloating
											maxDate={
												getMinMaxDateForFund(fundDetail, fundIndex)?.max
											}
											name='sDate'
											value={fundDetail.sDate}
											minDate={
												getMinMaxDateForFund(fundDetail, fundIndex)?.min
											}
											onChange={(e: ChangeEvent<HTMLSelectElement>) =>
												handleFundDetailChange(fundIndex, e)
											}
											isValid={validator.current.fieldValid(
												`Start Date ${fundIndex + 1}`,
											)}
											isTouched={isSubmited}
											invalidFeedback={validator.current.message(
												`Start Date ${fundIndex + 1}`,
												fundDetail.sDate,
												'required',
											)}
										/>
									</div>

									<div className='col-6'>
										<DateTimePicker
											id={`eDate-${fundIndex + 1}`}
											label='End Date'
											isFloating
											name='eDate'
											value={fundDetail.eDate}
											disabled={!fundDetail.sDate}
											minDate={fundDetail.sDate}
											maxDate={
												getMinMaxDateForFund(fundDetail, fundIndex)?.max
											}
											onChange={(e: ChangeEvent<HTMLSelectElement>) =>
												handleFundDetailChange(fundIndex, e)
											}
											isValid={validator.current.fieldValid(
												`End Date ${fundIndex + 1}`,
											)}
											isTouched={isSubmited}
											invalidFeedback={validator.current.message(
												`End Date ${fundIndex + 1}`,
												fundDetail.eDate,
												'required',
											)}
										/>
										{/* </FormGroup> */}
									</div>

									{/* Show Fund Type for both CHC and Local Authority */}
									{(
										[
											FUND_SOURCE_TYPE.LOCAL_AUTHORITY,
											FUND_SOURCE_TYPE.CHC,
											FUND_SOURCE_TYPE.JOINT_FUNDNG,
										] as number[]
									).includes(Number(fundDetail.fundSource)) && (
										<div className='col-6'>
											<FormGroup
												id={`fundType-${fundIndex + 1}`}
												label='Fund Type'
												isFloating>
												<SearchableSelect
													name='fundType'
													id='fundType'
													value={fundDetail.fundType || ''}
													onChange={(e: ChangeEvent<HTMLSelectElement>) =>
														handleFundDetailChange(fundIndex, e)
													}
													isValid={validator.current.fieldValid(
														`Fund Type ${fundIndex + 1}`,
													)}
													isTouched={isSubmited}
													invalidFeedback={validator.current.message(
														`Fund Type ${fundIndex + 1}`,
														fundDetail.fundType,
														'required',
													)}
													options={FUND_TYPE_LIST}
													placeholder='Select Fund Type'
												/>
											</FormGroup>
										</div>
									)}

									{/* Show Client Contribution for CHC & Local Authority when Fund Type = Partial */}
									{(
										[
											FUND_SOURCE_TYPE.LOCAL_AUTHORITY,
											FUND_SOURCE_TYPE.JOINT_FUNDNG,
										] as number[]
									).includes(Number(fundDetail.fundSource)) &&
										+fundDetail.fundType === FUND_TYPE.PARTIAL && (
											<>
												<div className='col-md-6'>
													<FormGroup
														id={`clientContribution-${fundIndex + 1}`}
														label='Client Contribution'
														isFloating>
														<Input
															name='clientContribution'
															placeholder='Client Contribution'
															value={
																fundDetail.clientContribution || ''
															}
															isValid={validator.current.fieldValid(
																`Client Contribution ${fundIndex + 1}`,
															)}
															isTouched={isSubmited}
															invalidFeedback={validator.current.message(
																`Client Contribution ${fundIndex + 1}`,
																fundDetail.clientContribution,
																'required',
															)}
															onChange={(
																e: ChangeEvent<HTMLInputElement>,
															) =>
																handleFundDetailChange(fundIndex, e)
															}
														/>
													</FormGroup>
												</div>

												<div className='col-md-6'>
													<DateTimePicker
														id={`clientContributionSdate-${fundIndex + 1}`}
														label='Client Contribution Start Date'
														isFloating
														name='clientContributionSdate'
														placeholder='Client Contribution Start Date'
														minDate={
															residentData?.fundDetails[fundIndex]
																.sDate || ''
														}
														maxDate={
															residentData?.fundDetails[fundIndex]
																.eDate || ''
														}
														value={
															fundDetail.clientContributionSdate || ''
														}
														onChange={(
															e: ChangeEvent<HTMLInputElement>,
														) => handleFundDetailChange(fundIndex, e)}
														isValid={validator.current.fieldValid(
															`Client Contribution Start Date ${fundIndex + 1}`,
														)}
														isTouched={isSubmited}
														invalidFeedback={validator.current.message(
															`Client Contribution Start Date ${fundIndex + 1}`,
															fundDetail.clientContributionSdate,
															'required',
														)}
													/>
												</div>
											</>
										)}

									{/* topup  */}
									{+fundDetail.fundType === FUND_TYPE.PARTIAL &&
										(+fundDetail.fundSource ===
											FUND_SOURCE_TYPE.LOCAL_AUTHORITY ||
											+fundDetail.fundSource === FUND_SOURCE_TYPE.CHC ||
											+fundDetail.fundSource ===
												FUND_SOURCE_TYPE.JOINT_FUNDNG) && (
											<>
												<div className='col-6'>
													<FormGroup
														id={`familyTopupStatus-${fundIndex + 1}`}
														label='Family Topup Status'
														isFloating>
														<SearchableSelect
															name='familyTopupStatus'
															id='familyTopupStatus'
															value={
																fundDetail.familyTopupStatus || ''
															}
															onChange={(
																e: ChangeEvent<HTMLSelectElement>,
															) =>
																handleFundDetailChange(fundIndex, e)
															}
															isValid={validator.current.fieldValid(
																`Family Topup Status ${fundIndex + 1}`,
															)}
															isTouched={isSubmited}
															invalidFeedback={validator.current.message(
																`Family Topup Status ${fundIndex + 1}`,
																fundDetail?.familyTopupStatus,
																'required',
															)}
															options={FAMILY_TOPUP_STATUS_LIST}
															placeholder='Select Family Topup Status'
														/>
														{/* <Option value=''>
															Select Family Topup Status
														</Option>
														{FAMILY_TOPUP_STATUS_LIST?.map((el) => (
															<Option key={el.value} value={el.value}>
																{el.label}
															</Option>
														))}
													</Select> */}
													</FormGroup>
												</div>

												{fundDetail?.familyTopupStatus ===
													FAMILY_OR_THIRD_PARTY_TOPUP_STATUS.YES && (
													<>
														<div className='col-md-6'>
															<DateTimePicker
																id={`familyTopupEffectiveDate-${fundIndex + 1}`}
																label='Family Topup Effective Date'
																isFloating
																name='familyTopupEffectiveDate'
																placeholder='Family Topup Effective Date'
																value={
																	fundDetail?.familyTopupEffectiveDate ||
																	''
																}
																onChange={(
																	e: ChangeEvent<HTMLInputElement>,
																) =>
																	handleFundDetailChange(
																		fundIndex,
																		e,
																	)
																}
																isValid={validator.current.fieldValid(
																	`Family Topup Effective Date ${fundIndex + 1}`,
																)}
																isTouched={isSubmited}
																invalidFeedback={validator.current.message(
																	`Family Topup Effective Date ${fundIndex + 1}`,
																	fundDetail?.familyTopupEffectiveDate,
																	'required',
																)}
																minDate={
																	residentData?.fundDetails[
																		fundIndex
																	]?.sDate || ''
																}
																maxDate={
																	residentData?.fundDetails[
																		fundIndex
																	]?.eDate || ''
																}
															/>
														</div>
														<div className='col-6'>
															<FormGroup
																id={`familyTopupPrice-${fundIndex + 1}`}
																label='Family TopupPrice'
																isFloating>
																<Input
																	name='familyTopupPrice'
																	type='number'
																	placeholder='familyTopupPrice'
																	value={
																		fundDetail?.familyTopupPrice ||
																		''
																	}
																	onChange={(
																		e: ChangeEvent<HTMLInputElement>,
																	) =>
																		handleFundDetailChange(
																			fundIndex,
																			e,
																		)
																	}
																	isValid={validator.current.fieldValid(
																		`Family TopupPrice ${fundIndex + 1}`,
																	)}
																	isTouched={isSubmited}
																	invalidFeedback={validator.current.message(
																		`Family TopupPrice ${fundIndex + 1}`,
																		fundDetail?.familyTopupPrice,
																		'required|numeric',
																	)}
																/>
															</FormGroup>
														</div>
													</>
												)}
											</>
										)}

									{(+fundDetail.fundSource === FUND_SOURCE_TYPE.LOCAL_AUTHORITY ||
										+fundDetail.fundSource === FUND_SOURCE_TYPE.JOINT_FUNDNG) &&
										+fundDetail.fundType === FUND_TYPE.PARTIAL && (
											<>
												<div className='col-6'>
													<FormGroup
														id={`thirdPartyTopupStatus-${fundIndex + 1}`}
														label='Third Party Topup Status'
														isFloating>
														<SearchableSelect
															name='thirdPartyTopupStatus'
															id='thirdPartyTopupStatus'
															value={
																fundDetail.thirdPartyTopupStatus ||
																''
															}
															onChange={(
																e: ChangeEvent<HTMLSelectElement>,
															) =>
																handleFundDetailChange(fundIndex, e)
															}
															isValid={validator.current.fieldValid(
																`Third Party Topup Status ${fundIndex + 1}`,
															)}
															isTouched={isSubmited}
															invalidFeedback={validator.current.message(
																`Third Party Topup Status ${fundIndex + 1}`,
																fundDetail?.thirdPartyTopupStatus,
																'required',
															)}
															options={FAMILY_TOPUP_STATUS_LIST}
															placeholder='Select Third Party Topup Status'
														/>
													</FormGroup>
												</div>

												{fundDetail?.thirdPartyTopupStatus ===
													FAMILY_OR_THIRD_PARTY_TOPUP_STATUS.YES && (
													<>
														<div className='col-md-6'>
															<DateTimePicker
																name='thirdPartyTopupEffectiveDate'
																placeholder='Third Party Topup Effective Date'
																id={`thirdPartyTopupEffectiveDate-${fundIndex + 1}`}
																label='Third Party Topup Effective Date'
																isFloating
																value={
																	fundDetail?.thirdPartyTopupEffectiveDate ||
																	''
																}
																onChange={(
																	e: ChangeEvent<HTMLInputElement>,
																) =>
																	handleFundDetailChange(
																		fundIndex,
																		e,
																	)
																}
																isValid={validator.current.fieldValid(
																	`Third Party Topup Effective Date ${fundIndex + 1}`,
																)}
																isTouched={isSubmited}
																invalidFeedback={validator.current.message(
																	`Third Party Topup Effective Date ${fundIndex + 1}`,
																	fundDetail?.thirdPartyTopupEffectiveDate,
																	'required',
																)}
																minDate={
																	residentData?.fundDetails[
																		fundIndex
																	]?.sDate || ''
																}
																maxDate={
																	residentData?.fundDetails[
																		fundIndex
																	]?.eDate || ''
																}
															/>
														</div>
														<div className='col-6'>
															<FormGroup
																id={`thirdPartyTopupPrice-${fundIndex + 1}`}
																label='Third Party TopupPrice'
																isFloating>
																<Input
																	name='thirdPartyTopupPrice'
																	type='number'
																	placeholder='thirdPartyTopupPrice'
																	value={
																		fundDetail?.thirdPartyTopupPrice ||
																		''
																	}
																	onChange={(
																		e: ChangeEvent<HTMLInputElement>,
																	) =>
																		handleFundDetailChange(
																			fundIndex,
																			e,
																		)
																	}
																	isValid={validator.current.fieldValid(
																		`Third Party TopupPrice ${fundIndex + 1}`,
																	)}
																	isTouched={isSubmited}
																	invalidFeedback={validator.current.message(
																		`Third Party TopupPrice ${fundIndex + 1}`,
																		fundDetail?.thirdPartyTopupPrice,
																		'required|numeric',
																	)}
																/>
															</FormGroup>
														</div>
													</>
												)}
											</>
										)}

									{/* {+fundDetail.fundSource !== FUND_SOURCE_TYPE.CHC && ( */}
									<div className='col-6'>
										<FormGroup
											id={`fncStatus-${fundIndex + 1}`}
											label='FNC Status'
											isFloating>
											<SearchableSelect
												name='fncStatus'
												id='fncStatus'
												value={fundDetail.fncStatus || ''}
												onChange={(e: ChangeEvent<HTMLSelectElement>) =>
													handleFundDetailChange(fundIndex, e)
												}
												isValid={validator.current.fieldValid(
													`FNC Status ${fundIndex + 1}`,
												)}
												isTouched={isSubmited}
												invalidFeedback={validator.current.message(
													`FNC Status ${fundIndex + 1}`,
													fundDetail.fncStatus,
													'required',
												)}
												options={FNC_STATUS_LIST}
												placeholder='Select FNC Status'
											/>
										</FormGroup>
									</div>
									{shouldShowClientId && (
										<div className='col-md-6'>
											<FormGroup
												id={`icbClientId-${fundIndex + 1}`}
												label={clientIdLabelForFncOrICB}
												isFloating>
												<Input
													id={`icbClientId-${fundIndex + 1}`}
													type='text'
													name='icbClientId'
													placeholder={clientIdLabelForFncOrICB}
													value={fundDetail?.icbClientId || ''}
													onChange={(e: ChangeEvent<HTMLInputElement>) =>
														handleFundDetailChange(fundIndex, e)
													}
													isValid={validator.current.fieldValid(
														`icbClientId-${fundIndex + 1}`,
													)}
													isTouched={isSubmited}
													invalidFeedback={validator.current.message(
														`icbClientId-${fundIndex + 1}`,
														fundDetail?.icbClientId,
														'required',
													)}
												/>
											</FormGroup>
										</div>
									)}

									{fundDetail.fncStatus === FNC_STATUS_TYPE.YES && (
										<>
											{/* {fundDetail?.fundSource !== FUND_SOURCE_TYPE.CHC && (
												<div className='col-md-6'>
													<FormGroup
														id={`icbClientId-${fundIndex + 1}`}
														label='FNC Client Id'
														isFloating>
														<Input
															id={`icbClientId-${fundIndex + 1}`}
															type='text'
															name='icbClientId'
															placeholder='FNC Client Id'
															value={fundDetail?.icbClientId || ''}
															onChange={(
																e: ChangeEvent<HTMLInputElement>,
															) =>
																handleFundDetailChange(fundIndex, e)
															}
															isValid={validator.current.fieldValid(
																`icbClientId-${fundIndex + 1}`,
															)}
															isTouched={isSubmited}
															invalidFeedback={validator.current.message(
																`icbClientId-${fundIndex + 1}`,
																fundDetail?.icbClientId,
																'required',
															)}
														/>
													</FormGroup>
												</div>
											)} */}

											<div className='col-md-6'>
												<DateTimePicker
													id={`fncSdate-${fundIndex + 1}`}
													label='FNC Start Date'
													isFloating
													name='fncSdate'
													placeholder='FNC Start Date'
													value={fundDetail.fncSdate || ''}
													onChange={(e: ChangeEvent<HTMLInputElement>) =>
														handleFundDetailChange(fundIndex, e)
													}
													isValid={validator.current.fieldValid(
														`FNC Start Date ${fundIndex + 1}`,
													)}
													isTouched={isSubmited}
													invalidFeedback={validator.current.message(
														`FNC Start Date ${fundIndex + 1}`,
														fundDetail.fncSdate,
														'required',
													)}
													minDate={
														residentData?.fundDetails[fundIndex]
															?.sDate || ''
													}
													maxDate={
														residentData?.fundDetails[fundIndex]
															?.eDate || ''
													}
												/>
											</div>

											<div className='col-6'>
												<FormGroup
													id={`incontStatus-${fundIndex + 1}`}
													label='Applicability of INCONT'
													isFloating>
													<SearchableSelect
														name='incontStatus'
														id='incontStatus'
														value={fundDetail.incontStatus || ''}
														onChange={(
															e: ChangeEvent<HTMLSelectElement>,
														) => handleFundDetailChange(fundIndex, e)}
														isValid={validator.current.fieldValid(
															`INCONT Status ${fundIndex + 1}`,
														)}
														isTouched={isSubmited}
														invalidFeedback={validator.current.message(
															`INCONT Status ${fundIndex + 1}`,
															fundDetail.incontStatus,
															'required',
														)}
														options={INCONT_STATUS_LIST}
														placeholder='Select INCONT Status'
													/>
												</FormGroup>
											</div>
										</>
									)}

									{+fundDetail.incontStatus === INCONT_STATUS_TYPE.YES && (
										<div className='col-md-12'>
											<IncontInfoTable
												fundIndex={fundIndex}
												data={fundDetail}
												onAdd={handleAddIncontRow}
												onDelete={handleDeleteIncontRow}
												onChange={handleIncontChange}
												validator={validator.current}
												isSubmited={isSubmited}
											/>
										</div>
									)}

									<div className='col-6'>
										<FormGroup
											id={`Status-${fundIndex + 1}`}
											label='Status'
											isFloating>
											<SearchableSelect
												name='status'
												id='status'
												value={fundDetail.status || ''}
												onChange={(e: ChangeEvent<any>) =>
													handleFundDetailChange(fundIndex, e)
												}
												isValid={validator.current.fieldValid(
													`Status ${fundIndex + 1}`,
												)}
												isTouched={isSubmited}
												invalidFeedback={validator.current.message(
													`Status ${fundIndex + 1}`,
													fundDetail.status,
													'required',
												)}
												placeholder='Select Status'
												options={FUND_SOURCE_STATUS_TYPE_LIST}
											/>
										</FormGroup>
									</div>

									{fundIndex < residentData.fundDetails.length - 1 && (
										<div className='col-12'>
											<hr className='my-4' />
										</div>
									)}
								</div>
							);
						})}
					</CardBody>
				</Card>
			),
			[
				residentData,
				handleFundDetailChange,
				handleAddIncontRow,
				handleDeleteIncontRow,
				handleIncontChange,
				isSubmited,
				localICBList,
				localAuthorityList,
			],
		);

		const ResidentNotesSection = useMemo(() => {
			return (
				<Card>
					<CardHeader>
						<CardLabel icon='notes' iconColor='danger'>
							<CardTitle tag='div' className='h5'>
								Notes
							</CardTitle>
							<CardSubTitle tag='div' className='h6'>
								Resident Notes
							</CardSubTitle>
						</CardLabel>
					</CardHeader>
					<CardBody>
						<div className='col-md-6 col-lg-12'>
							<FormGroup id='notes' label='Resident Notes' isFloating>
								<Textarea
									id='notes'
									// type='text'
									name='notes'
									placeholder='Notes'
									value={residentData?.notes || ''}
									onChange={handleNotesChange}
								/>
							</FormGroup>
						</div>
					</CardBody>
				</Card>
			);
		}, [residentData, handleNotesChange]);

		const activeFund = useMemo(() => {
			return getActiveFundDetails(residentData?.fundDetails);
		}, [residentData?.fundDetails]);

		const RoomPriceSection = useMemo(() => {
			const isBlockBed = +activeFund?.blockBedStatus === BLOCK_BEDS_TYPE.YES;
			// ❗ If no active fund → hide section entirely
			if (!activeFund || isBlockBed) return null;

			// ✅ Show Room Price section when active fund exists
			return (
				<Card>
					<CardHeader>
						<CardLabel icon='Phonelink' iconColor='danger'>
							<CardTitle tag='div' className='h5'>
								Room Price
							</CardTitle>
							<CardSubTitle tag='div' className='h6'>
								Room Price information
							</CardSubTitle>
						</CardLabel>
					</CardHeader>

					<CardBody>
						<div className='row g-4'>
							<div className='col-md-12'>
								<RoomPriceTable
									data={residentData}
									onAdd={handleAddRoomPriceRow}
									onDelete={handleDeleteRoomPriceRow}
									onChange={handleRoomPriceChange}
									validator={validator.current}
									isSubmited={isSubmited}
									invoiceList={invoiceList}
									hasInvoiceRoomPriceOverlap={checkInvoiceOverlap}
									setResidentData={setResidentData}
									isFromResidentPage={isFromResidentPage}
									migrationToDate={migrationToDate}
								/>
							</div>
						</div>
					</CardBody>
				</Card>
			);
		}, [
			activeFund,
			residentData,
			handleAddRoomPriceRow,
			handleDeleteRoomPriceRow,
			handleRoomPriceChange,
			isSubmited,
			invoiceList,
		]);

		if (isGetResidentLoading) return <h4>Loading...</h4>;

		return (
			<div className='row h-100 align-content-start'>
				<div className='col-md-12'>
					<PersonalInfoSection
						data={residentData}
						onChange={handlePersonalChange}
						validator={validator.current}
						isSubmited={isSubmited}
					/>

					<ContactInfoSection
						data={residentData}
						onChange={handlePersonalChange}
						validator={validator.current}
						isSubmited={isSubmited}
					/>

					<GuardianSection
						data={residentData}
						onChange={handleGuardianChange}
						validator={validator.current}
						isSubmited={isSubmited}
					/>

					{AdmissionSection}

					{FundDetailsSection}

					{RoomPriceSection}

					{(+activeFundDetails?.fundSource === FUND_SOURCE_TYPE.PRIVATE ||
						+activeFundDetails?.familyTopupStatus ===
							FAMILY_OR_THIRD_PARTY_TOPUP_STATUS.YES ||
						+activeFundDetails?.clientContribution > 0) && (
						<BillingSection
							data={residentData}
							onChange={handleBillingChange}
							validator={validator.current}
							isSubmited={isSubmited}
						/>
					)}

					{ResidentNotesSection}
				</div>
			</div>
		);
	},
);
