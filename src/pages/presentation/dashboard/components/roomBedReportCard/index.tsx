import {
  CardActions, CardBody, CardHeader, CardLabel,
  CardSubTitle, CardTitle, Card, Button, Progress,
} from '../../../../../components/bootstrap';
import useDarkMode from '../../../../../hooks/useDarkMode';
import Icon from '../../../../../components/icon';
import { useQuery } from '@tanstack/react-query';
import moment from 'moment';
import {  getRoomReportLive } from '../../../../../common/api/reports';
import { useMemo, useState } from 'react';
import { BED_STATUS } from '../../../../../common/constant';
import { DayWiseRoomReport } from './dayWiseRoomReport';
import { getLabelByValue } from '../../../../../helpers/helpers';
import { BED_STATUS_LIST } from '../../../../../common/data/option';

// ─── Constants (outside component — never recreated) ──────────────────────────

const TODAY = moment().format('YYYY-MM-DD');
const TODAY_DISPLAY = moment().format('DD MMMM YYYY');

// Static query object — stable reference, won't cause query key churn
const REQ_ROOM_QUERY = { sDate: TODAY, eDate: TODAY };

// ─── Types ────────────────────────────────────────────────────────────────────
interface Metrics {
  totalRooms: number;
  totalBeds: number;
  occupiedBeds: number;
  occupiedNonBlock: number;  // ✅ NEW
  availableBeds: number;
  reservedBeds: number;
  privateOccupied: number;
  occupancyRate: number;
  availabilityRate: number;
  overAllOccupied: number;
}

const EMPTY_METRICS: Metrics = {
  totalRooms: 0,
  totalBeds: 0,
  occupiedBeds: 0,
  occupiedNonBlock: 0,  // ✅ NEW
  availableBeds: 0,
  reservedBeds: 0,
  privateOccupied: 0,
  occupancyRate: 0,
  availabilityRate: 0,
  overAllOccupied: 0,
};



interface BlockBedSummary {
  totalBlockBeds: number;
  usedBlockBeds: number;
  remainingBlockBeds: number;
  occupancyPercentage: number;
}



const EMPTY_SUMMARY: BlockBedSummary = {
  totalBlockBeds: 0,
  usedBlockBeds: 0,
  remainingBlockBeds: 0,
  occupancyPercentage: 0,
};

// ─── Pure metric calculators (outside component) ─────────────────────────────

function calcMetrics(roomReport: any[]): Metrics {
  if (!roomReport?.length) return EMPTY_METRICS;

  let overAllOccupied = 0;
  let occupiedNonBlock = 0;
  let availableBeds = 0;
  let reservedBeds = 0;
  let privateOccupied = 0;
  let totalBeds = 0;

  for (const room of roomReport) {
    const beds = room?.beds ?? [];

    for (const bed of beds) {
      totalBeds++;

      switch (bed.bedMasterStatus) {
        case BED_STATUS.AVAILABLE:       // 1
          availableBeds++;
          break;
        case BED_STATUS.OCCUPIED:        // 3
          occupiedNonBlock++;
          overAllOccupied++;
          break;
        case BED_STATUS.BLOCK_BED_OCCUPIED: // 2
          reservedBeds++;
          overAllOccupied++;
          break;
        case BED_STATUS.PRIVATE_OCCUPIED:   // 4
          privateOccupied++;
          overAllOccupied++;
          break;
        default:
          break;
      }
    }
  }

  const totalRooms = roomReport.length;
  // overAllOccupied = occupiedNonBlock + reservedBeds + privateOccupied

  const occupancyRate = totalBeds
    ? +((overAllOccupied / totalBeds) * 100).toFixed(1)
    : 0;

  const availabilityRate = totalBeds
    ? +((availableBeds / totalBeds) * 100).toFixed(1)
    : 0;

  return {
    totalRooms,
    totalBeds,
    occupiedBeds: occupiedNonBlock,
    occupiedNonBlock,
    availableBeds,
    reservedBeds,
    privateOccupied,
    occupancyRate,
    availabilityRate,
    overAllOccupied,
  };
}
function calcBlockBedSummary(blockBedReports: any[]): BlockBedSummary {
  if (!Array.isArray(blockBedReports) || !blockBedReports.length) return EMPTY_SUMMARY;

  let totalBlockBeds = 0;
  let usedBlockBeds = 0;
  let remainingBlockBeds = 0;

  for (const curr of blockBedReports) {
    totalBlockBeds += Number(curr?.totalBlockBeds) || 0;
    usedBlockBeds += Number(curr?.usedBlockBeds) || 0;
    remainingBlockBeds += Number(curr?.remainingBlockBeds) || 0;
  }

  const occupancyPercentage = totalBlockBeds > 0
    ? Number(((usedBlockBeds / totalBlockBeds) * 100).toFixed(2))
    : 0;

  return { totalBlockBeds, usedBlockBeds, remainingBlockBeds, occupancyPercentage };
}

// ─── Stat tile config (static, defined once) ─────────────────────────────────

const getStatTiles = (metrics: Metrics, summary: BlockBedSummary) => [
  { value: metrics.totalRooms, color: 'text-dark', label: 'Total Rooms' },
  { value: metrics.totalBeds, color: 'text-dark', label: 'Total Beds' },  // ✅ ADD THIS
  { value: metrics.occupiedNonBlock, color: 'text-danger', label: 'Occupied (Non Block)' },
  { value: metrics.privateOccupied, color: 'text-info', label: 'Single' },
  { value: summary.usedBlockBeds, color: 'text-info', label: 'Block Bed' },
  { value: metrics.availableBeds, color: 'text-success', label: 'Vacant Beds' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export const RoomBedReportCard = () => {
  const { darkModeStatus } = useDarkMode();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // const { data: roomReportData = {} } = useQuery({
  //   queryKey: ['todayRoomReportData', REQ_ROOM_QUERY],
  //   queryFn: () => getRoomReportByBed(REQ_ROOM_QUERY),
  //   enabled: true,
  //   staleTime: 5 * 60 * 1000,
  //   refetchOnWindowFocus: false,
  // });

  const { data: roomReportData = {}, isLoading }: any = useQuery({
    queryKey: ["dayWiseRoomReportList", REQ_ROOM_QUERY],
    queryFn: () => getRoomReportLive(REQ_ROOM_QUERY),  // ← only change this
    enabled: true,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const metrics = useMemo(
    () => calcMetrics(roomReportData?.roomReport),
    [roomReportData?.roomReport]
  );

  const summary = useMemo(
    () => calcBlockBedSummary(roomReportData?.blockBedReports),
    [roomReportData?.blockBedReports]
  );

  const statTiles = useMemo(() => getStatTiles(metrics, summary), [metrics, summary]);

  const iconBgClass = `bg-l${darkModeStatus ? 'o25' : '25'}-success`;

  return (
    <>
      <Card stretch>
        <CardHeader>
          <CardLabel icon="Bed" iconColor="success">
            <CardTitle tag="div" className="h5">Today's Bed Occupancy</CardTitle>
            <CardSubTitle tag="div" className="h6">
              Current bed availability across all rooms as of {TODAY_DISPLAY}
            </CardSubTitle>
          </CardLabel>
          <CardActions>
            <Button color="info" isLight onClick={() => setIsModalOpen(true)}>
              View More
            </Button>
          </CardActions>
        </CardHeader>

        <CardBody>
          <div className="row">
            {/* Occupancy header */}
            <div className="col-12 mb-4">
              <div className="d-flex align-items-center">
                <div className="flex-shrink-0">
                  <div className="ratio ratio-1x1 me-3" style={{ width: 48 }}>
                    <div className={`${iconBgClass} text-success rounded-2 d-flex align-items-center justify-content-center`}>
                      <span className="fw-bold fs-2"><Icon icon="CheckCircle" /></span>
                    </div>
                  </div>
                </div>
                <div className="flex-grow-1">
                  <div className="fs-6 fw-bold">Occupied Capacity</div>
                  <div className="text-muted">
                    {metrics.totalRooms} Rooms within {metrics.totalBeds} beds  {/* ✅ now shows real value */}
                  </div>
                </div>
                <div className="me-3">
                  <div className="fs-2 fw-bold">{metrics.occupancyRate}%</div>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="col-12 mb-4">
              <Progress height={18} color="success" value={metrics.occupancyRate} />
            </div>

            {/* Stat tiles */}
            <div className="col-12">
              <div className="row pt-4 border-top text-center">
                {statTiles.map(({ value, color, label }) => (
                  <div className="col" key={label}>
                    <div className={`h4 fw-bold mb-0 ${color}`}>{value}</div>
                    <div className="small text-muted">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      <DayWiseRoomReport
        isOpen={isModalOpen}
        toggle={() => setIsModalOpen(p => !p)}
      />
    </>
  );
};