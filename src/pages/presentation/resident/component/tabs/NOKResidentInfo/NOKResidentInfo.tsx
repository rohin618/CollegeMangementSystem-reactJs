import React from "react";
import moment from "moment";
import {
  Card,
  CardBody,
  CardHeader,
  CardLabel,
  CardTitle,
  Badge,
} from "../../../../../../components/bootstrap";
import {
  RELATION_TYPE_LIST,
  SALUTATION_LIST,
  NOK_INVOICE_REQUIRED_LIST,
  LPA_TYPE_LIST,
} from "../../../../../../common/data/option";
import { getLabelByValue } from "../../../../../../helpers/helpers";
import Icon from "../../../../../../components/icon";
import { INVOICE_REQUEST_TYPE, LPA_TYPE } from "../../../../../../common/constant";

type NOKResidentInfoProps = {
  residentData: any;
};

export const NOKResidentInfo = ({ residentData }: NOKResidentInfoProps) => {
  const nokList = residentData?.nok || [];

  if (!nokList.length) {
    return (
      <Card className="shadow-3d-primary mb-4">
        <CardHeader>
          <CardLabel icon="FamilyRestroom">
            <CardTitle tag="h5" className="mb-0 text-primary fw-semibold fs-5">
              Next of Kin Information
            </CardTitle>
          </CardLabel>
        </CardHeader>
        <CardBody>
          <p className="text-muted fs-6 mb-0">
            No Next of Kin details found.
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="shadow-3d-primary mb-4">
      <CardHeader>
        <CardLabel icon="FamilyRestroom">
          <CardTitle tag="h5" className="mb-0 text-primary fw-semibold fs-5">
            Next of Kin Information
          </CardTitle>
        </CardLabel>
      </CardHeader>

      <CardBody>
        <p className="text-muted mb-4 fs-6">
          Registered contact and relationship details for the resident.
        </p>

        {nokList.map((nok: any, index: number) => {
          const salutationLabel = getLabelByValue(SALUTATION_LIST, +nok.salutation);
          const relationLabel = getLabelByValue(RELATION_TYPE_LIST, +nok.relation);
          const invoiceLabel = getLabelByValue(NOK_INVOICE_REQUIRED_LIST, +nok.invoiceRequired);
          const lpaLabel = getLabelByValue(LPA_TYPE_LIST, +nok.lpa);

          const formattedData = [
            ["Full Name", `${salutationLabel ? salutationLabel + " " : ""}${nok.name || "-"}`],
            ["Relation", relationLabel || "-"],
            ["Email", nok.email || "-"],
            ["Phone", nok.phone || "-"],
            ["Invoice Required", invoiceLabel || "-"],
            ["LPA", lpaLabel || "-"],
            [
              "LPA Start Date",
              nok.lpaSdate ? moment(nok.lpaSdate).format("DD MMM YYYY") : "-",
            ],
            ["Address", nok.address || "-"],
            ["Town / City", nok.townOrCity || "-"],
            ["County", nok.county || "-"],
            ["Postcode", nok.postcode || "-"],
          ];

          const displayItems = formattedData.filter(([_, value]) => value && value !== "-");
          const showLPA = +nok.lpa === LPA_TYPE.YES;
          const showInvoiceRequired = +nok.invoiceRequired === INVOICE_REQUEST_TYPE.YES;
          return (
            <div key={index} className="border rounded p-3 mb-4">
              {/* Header with Badges */}
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-semibold mb-0 text-dark fs-6">
                  <Icon icon="Person" className="me-2 text-primary" />
                  NOK #{index + 1}
                </h6>

                <div className="d-flex gap-2">
                  {showLPA && (
                    <Badge color="success" isLight pill className='px-2 py-2 fs-6'>
                      LPA
                    </Badge>
                  )}
                  {showInvoiceRequired && (
                    <Badge color="info" isLight pill className='px-2 py-2 fs-6'>
                      Invoice Required
                    </Badge>
                  )}
                </div>
              </div>

              {/* Details */}
              <div className="row">
                {displayItems.map(([label, value], i) => (
                  <div className="col-md-6 col-sm-12 mb-3" key={i}>
                    <div className="text-muted fw-medium mb-1 fs-6">{label}</div>
                    <div className="fw-semibold fs-6">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </CardBody>
    </Card>
  );
};

export default NOKResidentInfo;
