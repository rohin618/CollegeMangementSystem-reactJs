import { useNavigate } from 'react-router-dom';
import Card, { CardBody } from '../../../../../components/bootstrap/Card';
import Button from '../../../../../components/bootstrap/Button';
import Icon from '../../../../../components/icon';
import { BED_STATUS, PRICE_PERIOD_STATUS } from '../../../../../common/constant';
import { priceFormat } from '../../../../../helpers/helpers';

// Type Definitions
interface PricePeriod {
  sDate: string;
  eDate: string;
  pricePerWeek: number;
  minPricePerWeek: number;
  status: string;
}

interface BedInfo {
  roomId: string;
  id: string;
  bedName: string;
  bedStatus: string;
  pricePeriods: PricePeriod[];
}

interface BedBookingDetailInfoModelProps {
  bedInfo: BedInfo;
  onClose?: (id: number) => void;
}

const BedBookingDetailInfoModel = ({
  bedInfo: { roomId, id, bedName, bedStatus, pricePeriods },
  onClose = () => { },
}: BedBookingDetailInfoModelProps) => {
  const navigate = useNavigate();

  const activePeriod = pricePeriods.find(
    ({ status }) => +status === PRICE_PERIOD_STATUS.ACTIVE
  );

  if (!activePeriod) return <h4>No Detail</h4>;

  const { pricePerWeek, minPricePerWeek } = activePeriod;

  return (
    <Card className="offcanvas-modal-style">
      <CardBody className="row">
        <div className="col-md-12">
          <button
            type="button"
            className="btn-close float-end"
            aria-label="Close"
            onClick={() => onClose(-1)}
          />
          <h5 className="fs-5 card-title">
            <Icon icon="bed" size="2x" color="dark" /> {bedName}
          </h5>
        </div>

        <div className="col-md-12">
          <table className="table table-sm table-borderless">
            <tbody>
              <tr>
                <th className="bg-transparent">Price Per Week</th>
                <td className="bg-transparent">{priceFormat(pricePerWeek)}</td>
              </tr>
              <tr>
                <th className="bg-transparent">Minimum Price Per Week</th>
                <td className="bg-transparent">{priceFormat(minPricePerWeek)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="col-md-12 text-end">
          {/* <Button
            icon="close"
            className="me-2"
            color="danger"
            onClick={() => onClose(-1)}
            isLight
          >
            Close
          </Button> */}

          {+bedStatus === BED_STATUS.AVAILABLE && (
            <Button
              icon="ArrowForwardIos"
              color="info"
              className="me-2"
              isLight
              onClick={() => navigate(`/rooms/bedBook/${roomId}/${id}`)}
            >
              Book Now
            </Button>
          )}
          {/* {+bedStatus === BED_STATUS.AVAILABLE && (
            <Button
              icon="DateRange"
              color='dark'
              isLight
              onClick={() => navigate(`/rooms/preBook/${roomId}/${id}`)}
            >
              block bed
            </Button>
          )} */}
        </div>
      </CardBody>
    </Card>
  );
};

export default BedBookingDetailInfoModel;
