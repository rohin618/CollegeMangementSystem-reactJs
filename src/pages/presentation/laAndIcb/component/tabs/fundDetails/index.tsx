import React, { useMemo } from 'react';
import moment from 'moment';
import {
	Card,
	CardHeader,
	CardTitle,
	CardBody,
	Badge,
	Button,
} from '../../../../../../components/bootstrap';
import { useMasterData } from '../../../../../../contexts/mastersContext';
import { get } from 'http';
import {
	getActiveFundBlockBed,
	getColorByValue,
	getLabelByValue,
	getUserMappedCompany,
} from '../../../../../../helpers/helpers';
import {
	BLOCK_BEDS_STATUS,
	FUND_SOURCE_TYPE,
	VAT_CONFIG_STATUS,
} from '../../../../../../common/constant';
import {
	BLOCK_BEDS_STATUS_LIST,
	VAT_CONFIG_STATUS_LIST,
} from '../../../../../../common/data/option';
import { createBlockBedInvoiceByDate } from '../../../../../../helpers/createBlockBedInvoice';

const FundDetailsOfLaAndIcb = ({ data, fundType }: any) => {
	if (!data) return null;

	const { vatList, isLoading: isVATLoading } = useMasterData();

	const companyId = getUserMappedCompany()?.companyId || '';

	const activeVATConfigs = data?.vatConfigList?.filter(
		(item: any) => +item.status === VAT_CONFIG_STATUS.ACTIVE,
	);

	const formatDate = (d: string) => {
		if (!d) return '-';
		return moment(d).format('DD/MM/YYYY');
	};

	const companyVATs = useMemo(() => {
		if (!companyId) return [];
		return vatList.filter((vat: any) =>
			vat?.companyIds?.some((c: any) => c.id === companyId && !c.endDate && c.isActive),
		);
	}, [vatList, companyId]);

	return (
		<div className='row'>
			<div className='col-md-6'>
				<Card className='mb-4' stretch>
					<CardHeader>
						<CardTitle className='h5'>VAT Configurations</CardTitle>
						{/* <Button onClick={handleCretaInv}>Get Invoice</Button> */}
					</CardHeader>

					<CardBody className='table-responsive'>
						{activeVATConfigs?.length === 0 && (
							<div className='text-muted'>No active VAT configurations.</div>
						)}

						{activeVATConfigs?.length > 0 && (
							<table className='table table-modern table-hover table-sm mt-3'>
								<thead>
									<tr>
										<th>VAT Rate</th>
										<th>Effective Date</th>
										<th>Status</th>
									</tr>
								</thead>

								<tbody>
									{activeVATConfigs?.map((vat: any) => (
										<tr key={vat.id}>
											<td>
												{companyVATs.find((v: any) => v.id === vat.vatId)
													?.rate + '%' || 'NA'}
											</td>
											<td>{formatDate(vat.vatEffectiveDate)}</td>
											<td>
												<Button
													isLink
													onClick={() => {}}
													color={getColorByValue(
														VAT_CONFIG_STATUS_LIST,
														vat.status,
													)}
													size='sm'
													className='text-nowrap'
													icon='circle'>
													{getLabelByValue(
														VAT_CONFIG_STATUS_LIST,
														vat.status,
													)}
												</Button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						)}
					</CardBody>
				</Card>
			</div>

			<div className='col-md-6'>
				<Card className='mb-4' stretch>
					<CardHeader>
						<CardTitle className='h5'>Block Beds</CardTitle>
					</CardHeader>

					<CardBody className='table-responsive'>
						{(data?.blockBeds?.length === 0 || data?.blockBeds === null) && (
							<div className='text-muted text-center'>No active Block Beds.</div>
						)}

						{data?.blockBeds?.length > 0 && (
							<table className='table table-modern table-hover table-sm mt-3'>
								<thead>
									<tr>
										<th>No. of Beds</th>
										<th>Per Week</th>
										<th>Start Date</th>
										<th>End Date</th>
										<th>Status</th>
									</tr>
								</thead>

								<tbody>
									{data?.blockBeds?.map((bb: any) => (
										<tr key={bb?.id}>
											<td>{bb?.noOfBlockBed || '-'}</td>
											<td>{bb?.perWeek || '-'}</td>
											<td>{formatDate(bb?.sDate)}</td>
											<td>{bb?.eDate ? formatDate(bb?.eDate) : 'Present'}</td>
											<td>
												<Button
													isLink
													onClick={() => {}}
													color={getColorByValue(
														BLOCK_BEDS_STATUS_LIST,
														bb?.status,
													)}
													size='sm'
													className='text-nowrap'
													icon='circle'>
													{getLabelByValue(
														BLOCK_BEDS_STATUS_LIST,
														bb?.status,
													)}
												</Button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						)}
					</CardBody>
				</Card>
			</div>
		</div>
	);
};

export default FundDetailsOfLaAndIcb;
