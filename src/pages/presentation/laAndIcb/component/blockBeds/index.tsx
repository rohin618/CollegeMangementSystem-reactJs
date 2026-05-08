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
import { BLOCK_BEDS_STATUS_LIST } from '../../../../../common/data/option';
import { DateTimePicker, SearchableSelect } from '../../../../../components/common';

const BlockBedConfigurations = ({
	blockBeds = [],
	onAdd,
	onDelete,
	onChange,
	validator,
	isSubmited,
}: any) => {

	
	const canAdd = blockBeds?.every(
		(bed: any, index: number) =>
			bed.perWeek.trim() &&
			bed.noOfBlockBed.trim() &&
			bed.sDate.trim() &&
			bed.eDate.trim() &&
			bed.status !== '',
	);

	return (
		<Card>
			<CardHeader>
				<CardLabel>
					<CardTitle tag='div' className='h6'>
						Block Bed Configuration
					</CardTitle>
				</CardLabel>
				<CardActions>
					<Button color='info' isLight icon='AddCircle' onClick={onAdd} isDisable={!canAdd}>
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
											// isValid={validator.fieldValid(`Per Week ${index + 1}`)}
											// isTouched={isSubmited}
										/>
					
									</td>
									<td>
										<Input
											type='number'
											value={item.noOfBlockBed || ''}
											onChange={(e: any) =>
												onChange(index, 'noOfBlockBed', e.target.value)
											}
											placeholder='No Of Block Beds'
								
										/>
									
									</td>

									{/* START DATE */}
									<td>
										<DateTimePicker
											
											value={item.sDate || ''}
											minDate={
												index > 0
													? moment(blockBeds[index - 1]?.eDate)
															.add(1, 'day')
															.format('YYYY-MM-DD')
													: ''
											}
											onChange={(e: any) =>
												onChange(index, 'sDate', e.target.value)
											}
										
											// isValid={validator.fieldValid(
											// 	`Start Date ${index + 1}`,
											// )}
											// isTouched={isSubmited}
										/>
						
									</td>

									{/* END DATE */}
									<td>
										<DateTimePicker
											
											value={item.eDate || ''}
											minDate={item.sDate || ''}
											onChange={(e: any) =>
												onChange(index, 'eDate', e.target.value)
											}
											
											// isValid={validator.fieldValid(`End Date ${index + 1}`)}
											// isTouched={isSubmited}
										/>
									
									</td>

									{/* STATUS */}
									<td>
										<SearchableSelect
											value={item?.status}
											disabled={true}
											onChange={(e: any) => onChange(index, 'status', +e.target.value)} options={BLOCK_BEDS_STATUS_LIST}  />
											{/* {BLOCK_BEDS_STATUS_LIST?.map((el) => (
												<Option key={el.value} value={el.value}>
													{el.label}
												</Option>
											))}
										</Select> */}
									</td>

									{/* ACTION BUTTONS */}
									<td>
										
											<Button
												isDisable={blockBeds.length <= 1}
												color='danger'
												isLight
												className='ms-2'
												icon='Delete'
												onClick={() => onDelete(item.id)}
											/>
									
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

export default BlockBedConfigurations;
