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
import { getLabelByValue, getIdByName, getFundTypes, priceFormat } from "../../../../helpers/helpers";
import { useActivePriceInfoByEndDate } from "../../../../hooks";



export const ResidentAdmissionInfoCard = ({ residentData, localICBList = [], localAuthorityList, fNCDetails = {} }: any) => {
  const admission = residentData?.admission || {};

  const validFNC:any = useActivePriceInfoByEndDate(fNCDetails?.priceInfo);
  const validIncontDetails:any = useActivePriceInfoByEndDate(admission?.incontDetails);
  const validRespiteStatus:any = useActivePriceInfoByEndDate(admission?.respiteStatusList);


  const fundDetail = getFundTypes(residentData);

 


  const tableData = [
    ["Name of the LA", getIdByName(localAuthorityList, fundDetail.nameOfLa, 'name')],
    ["Name of ICB", getIdByName(localICBList, fundDetail.nameIbc, 'name')],
    ["Fund Type", getLabelByValue(FUND_TYPE_LIST, fundDetail.fundType)],
    ["Client Contribution", fundDetail.clientContribution],
    ["Type of Placement", getLabelByValue(PLACEMENT_LIST, admission.typeOfPlacement)],
    ["Respite Start Date", admission?.respiteSDate && moment(admission?.respiteSDate).format("DD MMM YYYY")],
    ["Respite End Date",admission?.respiteEDate && moment(admission?.respiteEDate).format("DD MMM YYYY")],
    ["Respite Status", getLabelByValue(RESPITE_STATUS_LIST, validRespiteStatus?.status)],
    ["Respite Status Start Date", validRespiteStatus?.sDate ? moment(validRespiteStatus?.sDate).format("DD MMM YYYY") : ''],
    ["Respite Status End Date", validRespiteStatus?.eDate ? moment(validRespiteStatus?.eDate).format("DD MMM YYYY") : ''],
    ["FNC Status", getLabelByValue(FNC_STATUS_LIST, fundDetail.fncStatus)],
    ["FNC Amount per week", priceFormat(+validFNC?.perWeek)],
    ["Applicability of INCONT", getLabelByValue(INCONT_STATUS_LIST, fundDetail.incontStatus)],
    ["INCONT Amount Per Week", validIncontDetails?.perWeek ?priceFormat(+validIncontDetails?.perWeek):''],
    ["INCONT expected End date", validIncontDetails?.eDate],
    ["Invoice Request", getLabelByValue(INVOICE_REQUEST_LIST, admission.invoiceRequest)],
    ["Invoice Mode", getLabelByValue(INVOICE_MODE_LIST, admission.invoiceMode)],
    ["Contract Status", getLabelByValue(CONTRACT_STATUS_LIST, admission.contractStatus)],
  ];
  return (
    <Card className="shadow-3d-primary">
      <CardHeader>
        <CardLabel icon="Receipt">
          <CardTitle tag="div" className="h5">
            Admission
          </CardTitle>
          <CardActions tag="div" className="text-muted">
            Admission Information
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
