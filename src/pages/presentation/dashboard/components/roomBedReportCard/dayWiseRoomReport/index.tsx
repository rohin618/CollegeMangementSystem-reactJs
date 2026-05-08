import moment from "moment";
import { useState, useMemo, useCallback } from "react";
import {
	Badge, Card, CardBody, CardHeader, CardLabel,
	FormGroup, Modal, ModalBody, ModalHeader, ModalTitle, Spinner,
} from "../../../../../../components/bootstrap";
import { getRoomReportLive } from "../../../../../../common/api/reports";
import { useQuery } from "@tanstack/react-query";
import {
	getActiveFundDetails, getActiveWeekInfoByEndDate,
	getResidentInvoiceAddress, priceFormat,
} from "../../../../../../helpers/helpers";
import { BED_STATUS, FNC_STATUS_TYPE, FUND_SOURCE_TYPE, RESIDENT_STATUS, ROOM_STATUS } from "../../../../../../common/constant";
import React from "react";
import './RoomResports.scss';
import { DateTimePicker, ResidentProfileCard } from "../../../../../../components/common";
import { getColorNameWithIndex } from "../../../../../../common/data/enumColors";
import { useMasterData } from "../../../../../../contexts/mastersContext";
import Icon from "../../../../../../components/icon";
import { useActivePriceInfoByEndDate } from "../../../../../../hooks";

interface DayWiseRoomReportProps {
	toggle: () => void;
	isOpen: boolean;
}

const OCCUPIED_STATUSES = new Set([
	BED_STATUS.OCCUPIED,
	BED_STATUS.BLOCK_BED_OCCUPIED,
	BED_STATUS.PRIVATE_OCCUPIED,
]);

// ─── Pure helper: total daily occupancy (all statuses) ───────────────────────
function calculateDailyOccupancy(
	rooms: any[],
	daysHeader: { fullDate: string }[]
): number[] {
	const dailyMap = new Map<string, Set<string>>(
		daysHeader.map(d => [d.fullDate, new Set()])
	);

	for (const room of rooms) {
		if (!room?.roomId) continue;
		for (const bed of room.beds ?? []) {
			for (const occ of bed.occupancies ?? []) {
				for (const d of occ.data ?? []) {
					if (!OCCUPIED_STATUSES.has(d?.status)) continue;
					const daySet = dailyMap.get(d.date);
					if (!daySet || daySet.has(bed?.bedId)) continue;
					daySet.add(bed?.bedId);
				}
			}
		}
	}

	return daysHeader.map(d => dailyMap.get(d.fullDate)?.size ?? 0);
}

// ─── Pure helper: non-block daily occupancy ──────────────────────────────────
function calculateNonBlockDailyOccupancy(
	rooms: any[],
	daysHeader: { fullDate: string }[]
): number[] {
	const dailyMap = new Map<string, Set<string>>(
		daysHeader.map(d => [d.fullDate, new Set()])
	);

	for (const room of rooms) {
		if (!room?.roomId) continue;
		for (const bed of room.beds ?? []) {
			for (const occ of bed.occupancies ?? []) {
				for (const d of occ.data ?? []) {
					if (d?.status !== BED_STATUS.OCCUPIED) continue;
					const daySet = dailyMap.get(d.date);
					if (!daySet || daySet.has(bed?.bedId)) continue;
					daySet.add(bed?.bedId);
				}
			}
		}
	}

	return daysHeader.map(d => dailyMap.get(d.fullDate)?.size ?? 0);
}

// ─── Pure helper: stats ───────────────────────────────────────────────────────
function getStats(rooms: any[], daily: number[], totalDays: number) {
	let totalBeds = 0;
	let residentChanges = 0;
	const uniqueRoomIds = new Set<string>();

	for (const room of rooms ?? []) {
		if (room?.roomId) uniqueRoomIds.add(room.roomId);
		for (const bed of room.beds ?? []) {
			totalBeds++;
			const uniqueResidents = new Set(
				bed.occupancies?.map((o: any) => o.residentId).filter(Boolean)
			);
			if (uniqueResidents.size > 1) residentChanges++;
		}
	}

	const avgOcc = totalBeds && totalDays
		? (daily.reduce((a, b) => a + b, 0) / (totalBeds * totalDays)) * 100
		: 0;

	const peakOcc = daily.length ? Math.max(...daily) : 0;

	return {
		totalBeds,
		totalRooms: uniqueRoomIds.size,
		avgOcc: avgOcc.toFixed(2),
		peakOcc,
		residentChanges,
	};
}

// ─── Per-occupancy cell map (date → status) ───────────────────────────────────
function buildOccupancyCellMap(
	occ: any,
	daysHeader: { fullDate: string }[]
): Map<string, { status: number; momentDate: moment.Moment }> {
	const map = new Map<string, { status: number; momentDate: moment.Moment }>();
	for (const d of occ.data ?? []) {
		map.set(d.date, { status: +d.status, momentDate: moment(d.date) });
	}
	return map;
}

// ─── Occupancy date bounds ────────────────────────────────────────────────────
function getOccBounds(occ: any): { startDate: moment.Moment | null; endDate: moment.Moment | null } {
	const dates = occ.data
		?.map((d: any) => moment(d.date))
		.filter((d: moment.Moment) => d.isValid()) ?? [];
	return {
		startDate: dates.length ? moment.min(dates) : null,
		endDate: dates.length ? moment.max(dates) : null,
	};
}

// ─── Main Component ───────────────────────────────────────────────────────────
export const DayWiseRoomReport = ({ toggle, isOpen }: DayWiseRoomReportProps) => {
	const { localAuthorityList = [], localICBList = [], fNCDetails={} }:any = useMasterData();
 const validFNC:any = useActivePriceInfoByEndDate(fNCDetails?.priceInfo);
	const [dateRange, setDateRange] = useState({
		sDate: moment().format("YYYY-MM-DD"),
		eDate: moment().format("YYYY-MM-DD"),
	});
	const [changedField, setChangedField] = useState("");

	const reqRoomQuery = useMemo(
		() => ({ ...dateRange, isGrouping: true }),
		[dateRange, changedField]
	);

	const isDateRangeValid = Boolean(dateRange.sDate && dateRange.eDate);

	const { data: dayWiseRoomReportList = {}, isLoading }: any = useQuery({
		queryKey: ["dayWiseRoomReportList", reqRoomQuery],
		queryFn: () => getRoomReportLive(reqRoomQuery),
		enabled: isDateRangeValid,
		staleTime: 5 * 60 * 1000,
		refetchOnWindowFocus: false,
		retry: 1,
	});

	const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = event.target;
		setChangedField(name);
		setDateRange(prev => ({ ...prev, [name]: value }));
	}, []);

	// ─── Derived: day headers ─────────────────────────────────────────────────
	const daysHeader = useMemo(() => {
		if (!dateRange.sDate || !dateRange.eDate) return [];
		const start = moment(dateRange.sDate);
		const end = moment(dateRange.eDate);
		const days: { day: number; fullDate: string }[] = [];
		const current = start.clone();
		while (current.isSameOrBefore(end, "day")) {
			days.push({ day: current.date(), fullDate: current.format("YYYY-MM-DD") });
			current.add(1, "day");
		}
		return days;
	}, [dateRange.sDate, dateRange.eDate]);

	const rooms: any[] = dayWiseRoomReportList?.roomReport ?? [];

	// ─── Derived: daily occupancy counts ─────────────────────────────────────
	const dailyOccupancy = useMemo(
		() => calculateDailyOccupancy(rooms, daysHeader),
		[rooms, daysHeader]
	);

	const dailyNonBlockOccupancy = useMemo(
		() => calculateNonBlockDailyOccupancy(rooms, daysHeader),
		[rooms, daysHeader]
	);

	// ─── Derived: stats ───────────────────────────────────────────────────────
	const stats = useMemo(
		() => getStats(rooms, dailyOccupancy, daysHeader.length),
		[rooms, dailyOccupancy, daysHeader.length]
	);

	const totalBeds = stats.totalBeds;

	// ─── Derived: block bed map (date_authorityId → entry) ───────────────────
	// Used for: individual cell lookup per authority per date
	const blockBedMap = useMemo(() => {
		const map = new Map<string, any>();
		for (const r of dayWiseRoomReportList?.blockBedReports ?? []) {
			if (!r?.date || !r?.authorityId) continue;
			const dateKey = moment(r.date).format("YYYY-MM-DD");
			map.set(`${dateKey}_${r.authorityId}`, r);
		}
		return map;
	}, [dayWiseRoomReportList?.blockBedReports]);

	// ─── Derived: block bed date-wise summary ─────────────────────────────────
	// Used for: Total Block Beds / Occupied / Vacant / Rate rows in table
	// Aggregates ALL authorities per date into one summary
	const blockBedSummaryMap = useMemo(() => {
		const map = new Map<string, {
			total: number;
			used: number;
			vacant: number;
			rate: number;
		}>();

		for (const item of dayWiseRoomReportList?.blockBedReports ?? []) {
			if (!item?.date) continue;

			const dateKey = moment(item.date).format("YYYY-MM-DD");
			const existing = map.get(dateKey) ?? { total: 0, used: 0, vacant: 0, rate: 0 };

			existing.total += Number(item.totalBlockBeds) || 0;
			existing.used += Number(item.usedBlockBeds) || 0;

			map.set(dateKey, existing);
		}

		// ✅ Compute vacant + rate AFTER all authorities aggregated per date
		for (const [dateKey, entry] of map.entries()) {
			entry.vacant = Math.max(0, entry.total - entry.used);
			entry.rate = entry.total > 0
				? Number(((entry.used / entry.total) * 100).toFixed(2))
				: 0;
			map.set(dateKey, entry);
		}

		return map;
	}, [dayWiseRoomReportList?.blockBedReports]);

	// ─── Derived: block bed overall stats ─────────────────────────────────────
	// Used for: stats cards + Average Monthly Occupancy Rate (Block Bed) row
	const blockBedOverallStats = useMemo(() => {
		if (!daysHeader.length) {
			return { total: 0, used: 0, vacant: 0, avgRate: "0.00" };
		}

		const dailyRates: number[] = [];

		for (const { fullDate } of daysHeader) {
			const entry = blockBedSummaryMap.get(fullDate);
			dailyRates.push(entry?.rate ?? 0);
		}

		const avgRate = dailyRates.length
			? (dailyRates.reduce((a, b) => a + b, 0) / dailyRates.length).toFixed(2)
			: "0.00";

		// ✅ Use latest day snapshot for total/used/vacant (not cumulative sum)
		const lastDate = daysHeader[daysHeader.length - 1]?.fullDate;
		const lastEntry = blockBedSummaryMap.get(lastDate ?? "") ?? { total: 0, used: 0, vacant: 0 };

		return {
			total: lastEntry.total,
			used: lastEntry.used,
			vacant: lastEntry.vacant,
			avgRate,
		};
	}, [blockBedSummaryMap, daysHeader]);

	// ─── Derived: non-block overall stats ─────────────────────────────────────
	const nonBlockOverallStats = useMemo(() => {
		if (!daysHeader.length) return { avgRate: "0.00" };

		const dailyRates = daysHeader.map(({ fullDate }, i) => {
			const blockTotal = blockBedSummaryMap.get(fullDate)?.total ?? 0;
			const nonBlockTotal = Math.max(0, totalBeds - blockTotal);
			return nonBlockTotal
				? (dailyNonBlockOccupancy[i] / nonBlockTotal) * 100
				: 0;
		});

		const avgRate = dailyRates.length
			? (dailyRates.reduce((a, b) => a + b, 0) / dailyRates.length).toFixed(2)
			: "0.00";

		return { avgRate };
	}, [daysHeader, dailyNonBlockOccupancy, blockBedSummaryMap, totalBeds]);

	// ─── Derived: snapshot stats (single reference day) ───────────────────────
	const snapshotStats = useMemo(() => {
		const todayKey = moment().format("YYYY-MM-DD");
		const rangeKeys = daysHeader.map(d => d.fullDate);

		// Use today if in range, else last day of range
		const refDate = rangeKeys.includes(todayKey)
			? todayKey
			: rangeKeys[rangeKeys.length - 1] ?? todayKey;

		const refIndex = daysHeader.findIndex(d => d.fullDate === refDate);

		const nonBlockOccupied = refIndex >= 0 ? dailyNonBlockOccupancy[refIndex] : 0;
		const blockTotalOnRefDay = blockBedSummaryMap.get(refDate)?.total ?? 0;
		const nonBlockBeds = Math.max(0, totalBeds - blockTotalOnRefDay);

		return { nonBlockOccupied, nonBlockBeds, refDate };
	}, [daysHeader, dailyNonBlockOccupancy, blockBedSummaryMap, totalBeds]);

	// ─── Render ────────────────────────────────────────────────────────────────
	return (
		<Modal setIsOpen={toggle} isOpen={isOpen} fullScreen titleId="transfer-modal">
			<ModalHeader setIsOpen={toggle}>
				<ModalTitle id="transfer-modal">Room Booking Detail</ModalTitle>
			</ModalHeader>

			<ModalBody className="report-page">
				{/* Date Filter */}
				<Card className="mb-4">
					<CardHeader><CardLabel icon="CalendarMonth">Date Range Filter</CardLabel></CardHeader>
					<CardBody>
						<div className="row">
							{(["sDate", "eDate"] as const).map((field, i) => (
								<div className="col-3" key={field}>
									<FormGroup id={field} label={i === 0 ? "Start Date" : "End Date"}>
										<DateTimePicker name={field} value={dateRange[field]} onChange={handleChange} />
									</FormGroup>
								</div>
							))}
						</div>
					</CardBody>
				</Card>

				{/* Legend */}
				<Card className="mb-4">
					<CardBody>
						<div className="d-flex align-items-center gap-4 legend-row">
							{[
								["legend-start", "Occupancy Start"],
								["legend-end", "Occupancy End"],
								["legend-vacant", "Vacant"],
								["occupiedWithBlockBed-primary", "Occupied With Block Bed"],
								["bg-warning-subtle", "Fund Invalid"],
							].map(([cls, label]) => (
								<div className="legend-item" key={cls}>
									<span className={`legend-box ${cls}`} />
									<span>{label}</span>
								</div>
							))}
						</div>
					</CardBody>
				</Card>

				{isLoading ? (
					<div className="text-center p-5"><Spinner /></div>
				) : (
					<>
						<div className="card table-container">
							<table className="table">
								<thead>
									<tr>
										<th className="sticky col-room">Room</th>
										<th className="sticky col-room">Bed</th>
										<th className="sticky col-name">Resident</th>
										<th className="sticky col-fee">Min Weekly Fee</th>
										<th className="sticky col-fee">FNC Weekly Fee</th>
										<th className="sticky col-fund">Fund</th>
										{daysHeader.map(d => (
											<th key={d.fullDate}>{moment(d.fullDate).format("DD MMM")}</th>
										))}
									</tr>
								</thead>

								<tbody>
									{rooms.map((room: any, index: number) => {
										const colorIndex = getColorNameWithIndex(index);
										const isPrivateRoom = room.roomStatus === ROOM_STATUS.PRIVATE_OCCUPIED;

										return room.beds.map((bed: any, bedIndex: number) =>
											bed.occupancies.map((occ: any, i: number) => {
												const fundInfo: any = getActiveFundDetails(occ.residentData?.fundDetails);
												const fncInfo: any = getActiveFundDetails(fNCDetails?.priceInfo);
												
												const validRoomPrice = getActiveWeekInfoByEndDate(occ.residentData?.roomPrice);
												const isLA = +fundInfo?.fundSource === FUND_SOURCE_TYPE.LOCAL_AUTHORITY;
												const isCHC = +fundInfo?.fundSource === FUND_SOURCE_TYPE.CHC;
												const isFNC = +fundInfo?.fncStatus === FNC_STATUS_TYPE.YES;
												const idValue = isLA ? fundInfo?.nameOfLa : isCHC ? fundInfo?.nameIbc : "";
												const invoiceAddress: any = getResidentInvoiceAddress(
													occ.residentData, +fundInfo?.fundSource, idValue,
													{ localAuthorityList, localICBList, fNCDetails }
												);

												const isPrivateBed = bed.bedMasterStatus === BED_STATUS.PRIVATE_OCCUPIED;
												const residentStatus = +occ.residentData?.admission?.residentStatus;
												const isNotLiving = residentStatus !== RESIDENT_STATUS.LIVING;

												const { startDate, endDate } = getOccBounds(occ);
												const cellMap = buildOccupancyCellMap(occ, daysHeader);

												return (
													<tr key={`${room.roomId}-${bed.bedId}-${i}`}>
														{i === 0 && (
															<td className="sticky col-room align-middle" rowSpan={bed.occupancies.length}>
																{bedIndex === 0 && (
																	<><Icon icon="Home" /> {room.roomNumber}</>
																)}
															</td>
														)}
														{i === 0 && (
															<td className="sticky col-room align-middle" rowSpan={bed.occupancies.length}>
																<Icon icon="Bed" /> {bed.bedName}
															</td>
														)}

														{!isPrivateBed && (
															<>
																<td className="sticky col-name align-middle" rowSpan={isPrivateRoom ? room.beds?.length : undefined}>
																	<ResidentProfileCard resident={occ.residentData} colorIndex={colorIndex} />
																</td>
																<td className="sticky col-fee align-middle" rowSpan={isPrivateRoom ? room.beds?.length : undefined}>
																	{priceFormat(validRoomPrice?.perWeek ?? 0)}
																</td>
																<td className="sticky col-fee align-middle" rowSpan={isPrivateRoom ? room.beds?.length : undefined}>
																	{  isFNC && priceFormat(+validFNC?.perWeek)}
																</td>
																<td className="sticky col-fund align-middle" rowSpan={isPrivateRoom ? room.beds?.length : undefined}>
																	{invoiceAddress.shortName || "-"}
																</td>
															</>
														)}

														{daysHeader.map(({ day, fullDate }) => {
															const cell = cellMap.get(fullDate);
															const status = cell?.status ?? BED_STATUS.AVAILABLE;

															const isOccupied = status === BED_STATUS.OCCUPIED || status === BED_STATUS.PRIVATE_OCCUPIED;
															const isBlockBed = status === BED_STATUS.BLOCK_BED_OCCUPIED;
															const isPrivateOcc = status === BED_STATUS.PRIVATE_OCCUPIED;

															if (isPrivateOcc) return null;

															const validCellPrice = getActiveWeekInfoByEndDate(occ.residentData?.roomPrice, fullDate);
															const showYellow = isOccupied && !validCellPrice && !isPrivateOcc;

															const isStart = startDate ? moment(fullDate).isSame(startDate, "day") : false;
															const isEnd = endDate && isNotLiving ? moment(fullDate).isSame(endDate, "day") : false;

															let cls = "vacant";
															if (isOccupied) {
																cls = "occupied-primary";
																if (isStart) cls += " start";
																if (isEnd) cls += " end";
															} else if (isBlockBed) {
																cls = "occupiedWithBlockBed-primary";
																if (isStart) cls += " start";
																if (isEnd) cls += " end";
															}

															// ✅ Use blockBedMap for per-authority per-date lookup
															const blockBedInfo = isBlockBed
																? blockBedMap.get(`${fullDate}_${idValue}`)
																: null;

															return (
																<td
																	key={day}
																	className={`${cls} align-middle${showYellow ? "bg-warning-subtle" : ""}`}
																>
																	{cell && validCellPrice ? (
																		<span><strong>{priceFormat(validCellPrice.perWeek ?? 0)}</strong></span>
																	) : isBlockBed && blockBedInfo ? (
																		<span><strong>{priceFormat(blockBedInfo.perWeek)}</strong></span>
																	) : null}
																</td>
															);
														})}
													</tr>
												);
											})
										);
									})}

									{/* ── Block Bed Summary Rows ── */}
									<tr className="summary-row total-occupied">
										<td colSpan={6} className="sticky left-footer">Total Block Beds</td>
										{daysHeader.map(({ fullDate }) => (
											<td key={fullDate}>{blockBedSummaryMap.get(fullDate)?.total ?? 0}</td>
										))}
									</tr>

									<tr className="summary-row total-occupied">
										<td colSpan={6} className="sticky left-footer">Total Occupied (Block Bed)</td>
										{daysHeader.map(({ fullDate }) => (
											<td key={fullDate}>{blockBedSummaryMap.get(fullDate)?.used ?? 0}</td>
										))}
									</tr>

									<tr className="summary-row total-vacant">
										<td colSpan={6} className="sticky left-footer">Total Vacant (Block Bed)</td>
										{daysHeader.map(({ fullDate }) => (
											<td key={fullDate}>{blockBedSummaryMap.get(fullDate)?.vacant ?? 0}</td>
										))}
									</tr>

									<tr className="summary-row occupancy-rate">
										<td colSpan={6} className="sticky left-footer">Occupancy Rate per Day (Block Bed)</td>
										{daysHeader.map(({ fullDate }) => (
											<td key={fullDate}>{blockBedSummaryMap.get(fullDate)?.rate ?? 0}%</td>
										))}
									</tr>

									<tr className="summary-row occupancy-rate">
										<td colSpan={6} className="sticky left-footer">Average Monthly Occupancy Rate (Block Bed)</td>
										<td colSpan={daysHeader.length}>{blockBedOverallStats.avgRate}%</td>
									</tr>

									{/* ── Non-Block Bed Summary Rows ── */}
									<tr className="summary-row total-occupied">
										<td colSpan={6} className="sticky left-footer">Total Non Block Beds</td>
										{daysHeader.map(({ fullDate }) => {
											const blockTotal = blockBedSummaryMap.get(fullDate)?.total ?? 0;
											return <td key={fullDate}>{Math.max(0, totalBeds - blockTotal)}</td>;
										})}
									</tr>

									<tr className="summary-row total-occupied">
										<td colSpan={6} className="sticky left-footer">Total Occupied (Non Block Bed)</td>
										{dailyNonBlockOccupancy.map((n, i) => <td key={i}>{n}</td>)}
									</tr>

									<tr className="summary-row total-vacant">
										<td colSpan={6} className="sticky left-footer">Total Vacant (Non Block Bed)</td>
										{daysHeader.map(({ fullDate }, i) => {
											const blockTotal = blockBedSummaryMap.get(fullDate)?.total ?? 0;
											const nonBlockTotal = Math.max(0, totalBeds - blockTotal);
											return (
												<td key={fullDate}>
													{Math.max(0, nonBlockTotal - dailyNonBlockOccupancy[i])}
												</td>
											);
										})}
									</tr>

									<tr className="summary-row occupancy-rate">
										<td colSpan={6} className="sticky left-footer">Occupancy Rate per Day (Non Block Bed)</td>
										{daysHeader.map(({ fullDate }, i) => {
											const blockTotal = blockBedSummaryMap.get(fullDate)?.total ?? 0;
											const nonBlockTotal = Math.max(0, totalBeds - blockTotal);
											const rate = nonBlockTotal
												? ((dailyNonBlockOccupancy[i] / nonBlockTotal) * 100).toFixed(2)
												: "0.00";
											return <td key={fullDate}>{rate}%</td>;
										})}
									</tr>

									<tr className="summary-row occupancy-rate">
										<td colSpan={6} className="sticky left-footer">Average Monthly Occupancy Rate (Non Block Bed)</td>
										<td colSpan={daysHeader.length}>{nonBlockOverallStats.avgRate}%</td>
									</tr>
								</tbody>
							</table>
						</div>

						{/* ── Stats Cards ── */}
						<div className="stats-grid">
							{[
								["Total Rooms", String(stats.totalRooms)],
								["Total Beds", String(stats.totalBeds)],
								["Non-Block Occupied", String(snapshotStats.nonBlockOccupied)],


								// ✅ Block bed stats — latest day snapshot
								["Total Block Beds", String(blockBedOverallStats.total)],
								["Block Occupied", String(blockBedOverallStats.used)],
								["Block Vacant", String(blockBedOverallStats.vacant)],
								["Avg Occupancy Rate (Block Bed)", `${blockBedOverallStats.avgRate}%`],
								["Average Occupancy", `${stats.avgOcc}%`],

								// ✅ Non-block stats — single reference day
								["Total Non-Block Beds", String(snapshotStats.nonBlockBeds)],

								["Avg Occupancy Rate (Non-Block Bed)", `${nonBlockOverallStats.avgRate}%`],
							].map(([label, value]) => (
								<div className="stat-card" key={label}>
									<p className="stat-label">{label}</p>
									<p className="stat-value">{value}</p>
								</div>
							))}
						</div>
					</>
				)}
			</ModalBody>
		</Modal>
	);
};