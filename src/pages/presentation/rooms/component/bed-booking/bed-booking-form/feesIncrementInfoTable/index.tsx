import React from 'react';
import {
	Card,
	CardBody,
	CardHeader,
	CardLabel,
	CardTitle,
	Input,
	Button,
	CardActions,
} from '../../../../../../../components/bootstrap';
import { DateTimePicker } from '../../../../../../../components/common';

export const FeesIncrementInfoTable = ({
	data,
	onAdd,
	onDelete,
	onChange,
	validator,
	isSubmited,
}: any) => {
	const incrementList =
		data?.admission?.feesIncrementInfo?.length > 0
			? data.admission.feesIncrementInfo
			: [
					{
						percentage: '',
						date: '',
					},
				];

	return (
		<Card shadow={'none'} borderSize={1}>
			<CardHeader>
				<CardLabel iconColor='primary'>
					<CardTitle tag='div' className='h6'>
						Fees Increment Info
					</CardTitle>
				</CardLabel>
				<CardActions>
					<Button color='info' isLight icon='AddCircle' onClick={onAdd}>
						Add
					</Button>
				</CardActions>
			</CardHeader>

			<CardBody>
				<table className='table table-modern table-hover mb-3'>
					<colgroup>
						<col style={{ width: '40%' }} />
						<col style={{ width: '40%' }} />
						<col style={{ width: '10%' }} />
					</colgroup>
					<thead>
						<tr>
							<th>Increment (%)</th>
							<th>Increment Date</th>
							<th>Action</th>
						</tr>
					</thead>
					<tbody>
						{incrementList.map((item: any, index: number) => (
							<tr key={index}>
								<td>
									<Input
										type='number'
										placeholder='Enter Percentage %'
										value={item.percentage || ''}
										min={0}
										max={100}
										onChange={(e: any) =>
											onChange(index, 'percentage', e.target.value)
										}
										isValid={validator.fieldValid(
											`Increment Percentage ${index + 1}`,
										)}
										isTouched={isSubmited}
										invalidFeedback={validator.message(
											`Increment Percentage ${index + 1}`,
											item.percentage,
											'required|numeric|min:1,num',
											{
												numeric: 'Enter a valid number.',
												min: 'Percentage must be greater than 0.',
											},
										)}
									/>
								</td>
								<td>
									{/* <Input
										type='date'
										onKeyDown={(e) => e.preventDefault()}
										placeholder='Increment Date'
										value={item.date || ''}
										onChange={(e: any) =>
											onChange(index, 'date', e.target.value)
										}
										isValid={validator.fieldValid(
											`Increment Date ${index + 1}`,
										)}
										isTouched={isSubmited}
										invalidFeedback={validator.message(
											`Increment Date ${index + 1}`,
											item.date,
											'required',
										)}
									/> */}

									<DateTimePicker
										value={item.date || ''}
										onChange={(e: any) =>
											onChange(index, 'date', e.target.value)
										}
										minDate={data?.admission?.admissionDate || ''}
										isValid={validator.fieldValid(
											`Increment Date ${index + 1}`,
										)}
										isTouched={isSubmited}
										invalidFeedback={validator.message(
											`Increment Date ${index + 1}`,
											item.date,
											'required',
										)}></DateTimePicker>
								</td>

								{/* Add / Delete Buttons */}
								<td>
									<Button
										isDisable={incrementList.length <= 1}
										color='danger'
										isLight
										icon='Delete'
										className='ms-2'
										onClick={() => onDelete(index)}
									/>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</CardBody>
		</Card>
	);
};
