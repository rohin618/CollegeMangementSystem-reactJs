import React from "react";
import {
  Card,
  CardBody,
  CardHeader,
  CardLabel,
  CardTitle,
} from "../../../../../../components/bootstrap";
import { getLabelByValue } from "../../../../../../helpers/helpers";
import { SALUTATION_LIST } from "../../../../../../common/data/option";

type BillingResidentInfoProps = {
  residentData: any;
};

export const BillingResidentInfo = ({ residentData }: BillingResidentInfoProps) => {
  const billing = residentData?.billing || {};

  const formattedData = [
    ["Full Name", `${getLabelByValue(SALUTATION_LIST,billing?.salutation)} ${billing?.name || "-"} `],
    ["Phone Number", billing?.phoneNumber || "-"],
    ["Email", billing?.email || "-"],
    ["Address Line 1", billing?.addressLine1 || "-"],
    ["Address Line 2", billing?.addressLine2 || "-"],
    ["Town / City", billing?.townOrCity || "-"],
    ["County", billing?.county || "-"],
    ["Postcode", billing?.postcode || "-"],
    ["Country", billing?.country || "-"],
  ];

  const displayItems = formattedData.filter(([_, value]) => value && value !== "-");

  return (
    <Card className="shadow-3d-primary mb-4">
      <CardHeader>
        <CardLabel icon="ReceiptLong">
          <CardTitle tag="h5" className="mb-0 text-primary fw-semibold fs-5">
            Billing Information
          </CardTitle>
        </CardLabel>
      </CardHeader>

      <CardBody>
        <p className="text-muted mb-4 fs-6">
          Resident&apos;s billing and address information.
        </p>

        {displayItems.length > 0 ? (
          <div className="row">
            {displayItems.map(([label, value], index) => (
              <div className="col-md-6 col-sm-12 mb-3" key={index}>
                <div className="text-muted fw-medium mb-1 fs-6">{label}</div>
                <div className="fw-semibold fs-6">{value}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted fs-6">No billing details found.</p>
        )}
      </CardBody>
    </Card>
  );
};

export default BillingResidentInfo;
