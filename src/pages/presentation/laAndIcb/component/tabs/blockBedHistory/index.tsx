import React from 'react';
import moment from 'moment';
import classNames from 'classnames';
import {
	Button,
	Card,
	CardBody,
	CardHeader,
	CardTitle,
} from '../../../../../../components/bootstrap';
import { getColorByValue, getLabelByValue } from '../../../../../../helpers/helpers';
import { BLOCK_BEDS_STATUS_LIST, RESIDENT_STATUS_LIST } from '../../../../../../common/data/option';
import { useGetAllRoomsWithBeds } from '../../../../../../hooks/useGetAllRoomsWithBed';
import { BLOCK_BEDS_STATUS, PREBOOK_HISTORY_STATUS } from '../../../../../../common/constant';
import { ResidentProfileCard } from '../../../../../../components/common';
import { getColorNameWithIndex } from '../../../../../../common/data/enumColors';

interface BlockBedHistoryProps {
	blockBeds: any[];
}

const BlockBedHistory: React.FC<BlockBedHistoryProps> = ({ blockBeds }) => {
	const formatDate = (date: string | null) => {
		if (!date) return '-';
		return moment(date).format('DD MMM YYYY');
	};

	return (
		<div className='h-100'>
			<Card className='h-100'>
				<CardHeader>
					<CardTitle className='h5'>Block Bed History</CardTitle>
				</CardHeader>

				<CardBody isScrollable className='table-responsive h-100'>
					{(!blockBeds || blockBeds.length === 0) && (
						<div className='text-muted'>No Block Bed History Found</div>
					)}

					{blockBeds?.length > 0 && (
						<table className='table table-modern table-hover table-sm mt-3'>
							<thead>
								<tr>
									<th>Resident</th>
									<th>Period</th>
									<th>Resident Status</th>
									<th>Block Bed Status</th>
								</tr>
							</thead>

							<tbody>
								{blockBeds?.map((entry: any, i: number) => {
									const resident = entry.residentData;

									const sDate = formatDate(entry.sDate);
									const eDate = entry.eDate ? formatDate(entry.eDate) : 'Present';

									const residentStatusValue = resident?.admission?.residentStatus;
									const colorIndex = getColorNameWithIndex(i);
									return (
										<tr key={entry.id}>
											<td>
												{resident?.personal?.name ? <ResidentProfileCard
													resident={resident}
													colorIndex={colorIndex}
												/> : 'NA'}
											</td>

											<td>
												{resident ? `${sDate} - ${eDate}` : 'NA'}
											</td>

											<td>
												{residentStatusValue ? (
													<Button
														isLink
														color={getColorByValue(
															RESIDENT_STATUS_LIST,
															residentStatusValue,
														)}
														size='sm'
														icon='circle'
														className='text-nowrap'>
														{getLabelByValue(
															RESIDENT_STATUS_LIST,
															residentStatusValue,
														)}
													</Button>
												) : (
													
														'NA'
													
												)}
											</td>

											<td>
												<Button
													isLink
													onClick={() => {}}
													color={getColorByValue(
														BLOCK_BEDS_STATUS_LIST,
														+entry.status,
													)}
													size='sm'
													className='text-nowrap'
													icon='circle'>
													{getLabelByValue(
														BLOCK_BEDS_STATUS_LIST,
														+entry.status,
													)}
												</Button>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					)}
				</CardBody>
			</Card>
		</div>
	);
};

export default BlockBedHistory;
