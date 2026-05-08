import {
  CardBody, Card, CardHeader, CardTitle,
  CardLabel
} from '../../../../components/bootstrap';
import Icon from '../../../../components/icon';
import Avatar from '../../../../components/Avatar';
import moment from 'moment';
import { PRICE_PERIOD_STATUS } from '../../../../common/constant';
import { getActiveWeekInfoByEndDate, getFundTypes, priceFormat } from '../../../../helpers/helpers';
import useDarkMode from '../../../../hooks/useDarkMode';
import { useMemo } from 'react';
import { TColor } from '../../../../type/color-type';

type ResidentDetailCardsProps = {
  residentData: any;
};

// 🔹 Small reusable block for displaying info with an icon
const InfoItem = ({ icon, label, value }: { icon: string; label: string; value: any }) => (
  <div className="col-6">
    <div className="d-flex align-items-center">
      <div className="flex-shrink-0">
        <Icon icon={icon} size="3x" color="primary" />
      </div>
      <div className="flex-grow-1 ms-3">
        <div className="fw-bold fs-5 mb-0">{value || '-'}</div>
        <div className="text-muted">{label}</div>
      </div>
    </div>
  </div>
);

// 🔹 Small reusable block for payment cards
const PaymentCard = ({ icon, color, value, label }: { icon: string; color: TColor; value: any; label: string }) => {
  const { darkModeStatus } = useDarkMode();
  return (
    <div className="col-xl-6">
      <div className={`d-flex align-items-center bg-l${darkModeStatus ? 'o25' : '10'}-${color} rounded-2 p-3`}>
        <div className="flex-shrink-0">
          <Icon icon={icon} size="3x" color={color} />
        </div>
        <div className="flex-grow-1 ms-3">
          <div className="fw-bold fs-3 mb-0">{value}</div>
          <div className="text-muted mt-n2 truncate-line-1">{label}</div>
        </div>
      </div>
    </div>
  );
};

export const ResidentDetailCards = ({ residentData }: ResidentDetailCardsProps) => {
  // const validRoomPrice: any = useMemo(() => {
  //   return residentData?.roomPrice?.find(
  //     ({ status }: any) => status == PRICE_PERIOD_STATUS.ACTIVE
  //   ) || null;
  // }, [residentData?.roomPrice]);


  const validRoomPrice = getActiveWeekInfoByEndDate(residentData?.roomPrice)

  const fundTypes = getFundTypes(residentData);
  const admissionDate = residentData?.admission?.admissionDate
    ? moment(residentData.admission.admissionDate).format('DD MMM YYYY')
    : '-';
  const dischargeDate = residentData?.admission?.dateDischargeAndRip
    ? moment(residentData.admission.dateDischargeAndRip).format('DD MMM YYYY')
    : '-';

  // Example: values could come from props or backend instead of hardcoded
  const totalPending = 1260;
  const fromFNM = 300;
  const paid = 135;
  const fromResident = totalPending - fromFNM;

  return (
    <>
      {/* Resident Info Card */}
      <Card className="shadow-3d-primary">
        <CardBody>
          <div className="row g-5 py-3">
            <div className="col-12 d-flex justify-content-center">
              <Avatar
                src="https://facit-zen.omtanke.studio/static/media/wanna3.3ae77f2526857e4c2185.webp"
                color="primary"
              />
            </div>

            <div className="col-12">
              <div className="row g-3">
                <InfoItem icon="login" label="Admission Date" value={admissionDate} />
                <InfoItem icon="logout" label="Discharge/RIP Date" value={dischargeDate} />
                <InfoItem
                  icon="Money"
                  label="Fund Source"
                  value={`${fundTypes?.fundName || ''}${fundTypes?.fnc ? `, ${fundTypes.fnc}` : ''}`}
                />
                <InfoItem
                  icon="MonetizationOn"
                  label="Room Rate (Week)"
                  value={priceFormat(+validRoomPrice?.perWeek || 0)}
                />
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Payment Info Card */}
      {/* <Card>
        <CardHeader>
          <CardLabel icon="StackedLineChart">
            <CardTitle tag="div" className="h5">
              Payment Info
            </CardTitle>
          </CardLabel>
        </CardHeader>
        <CardBody>
          <div className="row g-4 align-items-center">
            <PaymentCard icon="DoneAll" color="warning" value={priceFormat(paid)} label="Paid" />
            <PaymentCard icon="Savings" color="danger" value={priceFormat(totalPending)} label="Pending" />
            <PaymentCard icon="MonetizationOn" color="primary" value={priceFormat(fromFNM)} label="From FNM" />
            <PaymentCard icon="Timer" color="success" value={priceFormat(fromResident)} label="From Resident" />
          </div>
        </CardBody>
      </Card> */}
    </>
  );
};
