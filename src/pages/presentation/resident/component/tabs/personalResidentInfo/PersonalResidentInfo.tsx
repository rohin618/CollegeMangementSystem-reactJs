import React from 'react';
import moment from 'moment';
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  CardLabel,
  CardTitle,
} from '../../../../../../components/bootstrap';
import { SALUTATION_LIST } from '../../../../../../common/data/option';
import { getLabelByValue } from '../../../../../../helpers/helpers';

type PersonalResidentInfoProps = {
  residentData: any;
};

export const PersonalResidentInfo = ({ residentData }: PersonalResidentInfoProps) => {
  const personal = residentData?.personal || {};

  const dob = personal?.dob ? moment(personal?.dob).format('DD MMM YYYY') : '-';
  const age =
    personal?.dob && moment().diff(moment(personal.dob), 'years') >= 0
      ? `${moment().diff(moment(personal.dob), 'years')} year old`
      : '-';

  const salutation = getLabelByValue(SALUTATION_LIST, personal?.salutation);

  return (
    <Card className="shadow-3d-primary">
      <CardHeader>
        <CardLabel icon="Person">
          <CardTitle tag="h5" className="mb-0 text-primary fw-semibold fs-5">
            Personal Information
          </CardTitle>
        </CardLabel>
      </CardHeader>

      <CardBody>
        <div className="row">
          {/* Left Column */}
          <div className="col-md-6 col-sm-12 mb-3">
            <div className="mb-3">
              <div className="text-muted fw-medium mb-1 fs-6">Full Name</div>
              <div className="fw-semibold fs-6">
                {salutation ? `${salutation} ${personal.name}` : personal.name || '-'}
              </div>
            </div>

            <div className="mb-3">
              <div className="text-muted fw-medium mb-1 fs-6">Gender</div>
              <div className="fw-semibold fs-6">{personal.gender || '-'}</div>
            </div>

            <div className="mb-3">
              <div className="text-muted fw-medium mb-1 fs-6">Date of Birth</div>
              <div className="fw-semibold fs-6">{dob}</div>
            </div>

            <div className="mb-3">
              <div className="text-muted fw-medium mb-1 fs-6">Age</div>
              <div className="fw-semibold fs-6">
                <Badge color="success" className="px-1 py-1 rounded-pill fs-5">
                  {age}
                </Badge>
              </div>
            </div>
          </div>

          <div className="col-md-6 col-sm-12 mb-3">
            <div className="mb-3">
              <div className="text-muted fw-medium mb-1 fs-6">Phone Number</div>
              <div className="fw-semibold fs-6">{personal.phone || '-'}</div>
            </div>

            <div className="mb-3">
              <div className="text-muted fw-medium mb-1 fs-6">Email Address</div>
              <div className="fw-semibold fs-6">{personal.email || '-'}</div>
            </div>

            <div className="mb-3">
              <div className="text-muted fw-medium mb-1 fs-6">Address</div>
              <div className="fw-semibold fs-6 ">{personal.addres || '-'}</div>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export default PersonalResidentInfo;
