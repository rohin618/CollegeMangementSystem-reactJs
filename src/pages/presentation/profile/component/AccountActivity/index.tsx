import React from 'react';
import { Card, CardBody, CardHeader } from '../../../../../components/bootstrap';

interface AccountActivityProps {
  createdAt: string;
  lastUpdated: string;
}

export const AccountActivity: React.FC<AccountActivityProps> = ({
  createdAt,
  lastUpdated,
}) => {
  return (
    <Card className='shadow-sm border-0'>
      <CardHeader className='fw-bold'>Account Activity</CardHeader>
      <CardBody>
        <div className='d-flex justify-content-between mb-2'>
          <span className='text-muted'>Created At:</span>
          <span className='fw-semibold'>{createdAt}</span>
        </div>
        <div className='d-flex justify-content-between'>
          <span className='text-muted'>Last Updated:</span>
          <span className='fw-semibold'>{lastUpdated}</span>
        </div>
      </CardBody>
    </Card>
  );
};
