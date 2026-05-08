import React, { useMemo } from 'react';
import moment from 'moment';
import {
	Button,
	Card,
	CardBody,
	CardHeader,
	CardTitle,
	Input,
	Select,
	Option,
	CardLabel,
	CardActions,
} from '../../../../../components/bootstrap';
import { BLOCK_BEDS_STATUS } from '../../../../../common/constant';
import { BLOCK_BEDS_STATUS_LIST } from '../../../../../common/data/option';
import { SearchableSelect } from '../../../../../components/common';

const BlockBedConfiguration = ({
	blockBeds = [],
	onAdd,
	onDelete,
	onChange,
	validator,
	isSubmited,
}: any) => {
	return (
		<Card>
			<CardHeader>
				<CardLabel>
					<CardTitle tag='div' className='h6'>
						Block Bed Configuration
					</CardTitle>
				</CardLabel>
				<CardActions>
					<Button color='info' isLight icon='AddCircle' onClick={onAdd}>
						Add Block Bed
					</Button>
				</CardActions>
			</CardHeader>

			<CardBody>
				<table className='table table-modern table-hover mb-3 scrollable-vertical'>
					<thead>
						<tr>
							<th>Per Week Fee</th>
							<th>No Of Block Beds</th>
							<th>Start Date</th>
							<th>End Date</th>
							<th>Status</th>
							<th>Action</th>
						</tr>
					</thead>

					<tbody>
						{blockBeds.map((item: any, index: number) => {
							return (
								<tr key={item.id}>
									{/* PER WEEK */}
									<td>
										<Input
											type='number'
											value={item.perWeek || ''}
											onChange={(e: any) =>
												onChange(index, 'perWeek', e.target.value)
											}
											placeholder='Weekly Cost'
											isValid={validator.fieldValid(`Per Week ${index + 1}`)}
											isTouched={isSubmited}
										/>
										{validator.message(
											`Per Week ${index + 1}`,
											item.perWeek,
											'required|numeric',
										)}
									</td>
									<td>
										<Input
											type='number'
											value={item.noOfBlockBed || ''}
											onChange={(e: any) =>
												onChange(index, 'noOfBlockBed', e.target.value)
											}
											placeholder='No Of Block Beds'
											isValid={validator.fieldValid(`Block Beds ${index + 1}`)}
											isTouched={isSubmited}
										/>
										{validator.message(
											`Block Beds ${index + 1}`,
											item.perWeek,
											'required|numeric',
										)}
									</td>

									{/* START DATE */}
									<td>
										<Input
											type='date'
											value={item.sDate || ''}
											min={
												index > 0
													? moment(blockBeds[index - 1]?.eDate)
														.add(1, 'day')
														.format('YYYY-MM-DD')
													: ''
											}
											onChange={(e: any) =>
												onChange(index, 'sDate', e.target.value)
											}
											onKeyDown={(e) => e.preventDefault()}
											isValid={validator.fieldValid(
												`Start Date ${index + 1}`,
											)}
											isTouched={isSubmited}
										/>
										{validator.message(
											`Start Date ${index + 1}`,
											item.sDate,
											'required',
										)}
									</td>

									{/* END DATE */}
									<td>
										<Input
											type='date'
											value={item.eDate || ''}
											min={item.sDate || ''}
											onChange={(e: any) =>
												onChange(index, 'eDate', e.target.value)
											}
											onKeyDown={(e) => e.preventDefault()}
											isValid={validator.fieldValid(`End Date ${index + 1}`)}
											isTouched={isSubmited}
										/>
										{validator.message(
											`End Date ${index + 1}`,
											item.eDate,
											'required',
										)}
									</td>

									{/* STATUS */}
									<td>
										<SearchableSelect
											value={item.status}
											disabled={true}
											onChange={(e: any) =>
												onChange(index, 'status', +e.target.value)
											} options={BLOCK_BEDS_STATUS_LIST} placeholder='Select Status' />

									</td>

									{/* ACTION BUTTONS */}
									<td>
										{blockBeds.length > 1 && (
											<Button
												color='danger'
												isLight
												className='ms-2'
												icon='Delete'
												onClick={() => onDelete(item.id)}
											/>
										)}
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</CardBody>
		</Card>
	);
};

export default BlockBedConfiguration;
