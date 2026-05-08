import {
  CardBody,
  Card,
  CardHeader,
  CardTitle,
  CardLabel,
  CardActions,
} from "../../../../components/bootstrap";
import moment from "moment";
import {
  PLACEMENT_LIST,
  FUND_SOURCE_LIST,
  RESPITE_STATUS_LIST,
  FUND_TYPE_LIST,
  FNC_STATUS_LIST,
  INCONT_STATUS_LIST,
  INVOICE_REQUEST_LIST,
  INVOICE_MODE_LIST,
  RESIDENT_STATUS_LIST,
  CONTRACT_STATUS_LIST,
  PRICE_PERIOD_STATUS_LIST,
} from "../../../../common/data/option";
import { useMemo } from "react";
import { getLabelByValue } from "../../../../helpers/helpers";




export const ResidentBillingInfoCard = ({ residentData }: any) => {
  const billing = residentData?.billing || {};

  const tableData = [
    ["Name", billing.name],
    ["Phone Line 2", billing.phoneNumber],
    ["Address Line 1", billing.addressLine1],
    ["Address Line 2", billing.addressLine2],
    ["Town / City", billing.townOrCity],
    ["County", billing.county],
    ["Postcode", billing.postcode],
    ["Country", billing.country],
  ];

  return (
    <Card className="shadow-3d-primary">
      <CardHeader>
        <CardLabel icon="Receipt">
          <CardTitle tag="div" className="h5">
            Billing
          </CardTitle>
          <CardActions tag="div" className="text-muted">
            Billing Information
          </CardActions>
        </CardLabel>
      </CardHeader>
      <CardBody>
        <table className="table">
          <tbody>
            {tableData.map(([label, value], idx) => value && (
              <tr key={idx}>
                <td>{label}</td>
                <td>{value || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardBody>
    </Card>
  );
};
