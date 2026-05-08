import React from "react";
import {
  Card,
  CardBody,
  CardHeader,
  CardLabel,
  CardTitle,
} from "../../../../../../components/bootstrap";
import { getLabelByValue } from "../../../../../../helpers/helpers";
import {
  BED_STATUS_LIST,
  ROOM_STATUS_LIST,
} from "../../../../../../common/data/option";

type RoomAndBedResidentInfoProps = {
  residentData: any;
};

const InfoRow = ({
  label,
  value,
}: {
  label: string;
  value: any;
}) => (
  <div className="col-md-6 col-sm-12 mb-3">
    <div className="mb-2">
      <div className="text-muted fw-medium mb-1 fs-6">{label}</div>
      <div className="fw-semibold fs-6">{value || "N/A"}</div>
    </div>
  </div>
);

export const RoomAndBedResidentInfo = ({
  residentData,
}: RoomAndBedResidentInfoProps) => {
  const room = residentData?.roomDetails || {};
  const bed = residentData?.bedDetails || {};

  return (
    <>
      {/* Room Information Card */}
      <Card className="shadow-3d-primary mb-4">
        <CardHeader>
          <CardLabel icon="Home">
            <CardTitle tag="h5" className="mb-0 text-primary fw-semibold fs-5">
              Room Information
            </CardTitle>
          </CardLabel>
        </CardHeader>

        <CardBody>
          <p className="text-muted mb-4 fs-6">
            Current room allocation details
          </p>

          <div className="row">
            <InfoRow label="Room Number" value={room.roomNumber} />
            <InfoRow label="Floor" value={room.floor} />
            <InfoRow
              label="Status"
              value={getLabelByValue(ROOM_STATUS_LIST, room.status) || "Inactive"}
            />
            <InfoRow label="Description" value={room.description} />
          </div>
        </CardBody>
      </Card>

      {/* Bed Information Card */}
      <Card className="shadow-3d-primary">
        <CardHeader>
          <CardLabel icon="Bed">
            <CardTitle tag="h5" className="mb-0 text-primary fw-semibold fs-5">
              Bed Information
            </CardTitle>
          </CardLabel>
        </CardHeader>

        <CardBody>
          <p className="text-muted mb-4 fs-6">
            Current bed allocation details
          </p>

          <div className="row">
            <InfoRow label="Bed Name" value={bed.bedName} />
            <InfoRow
              label="Bed Status"
              value={
                getLabelByValue(BED_STATUS_LIST, bed.bedStatus) || "Reserved"
              }
            />
          </div>
        </CardBody>
      </Card>
    </>
  );
};

export default RoomAndBedResidentInfo;
