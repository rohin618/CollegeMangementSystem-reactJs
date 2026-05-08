import { useEffect } from 'react';
import { FUND_SOURCE_STATUS_TYPE } from '../../../../../../../common/constant';
import { PRICE_PERIOD_STATUS_LIST } from '../../../../../../../common/data/option';
import { Select, Option, Input, Button } from '../../../../../../../components/bootstrap';
import { getMaxActiveFundEDate, getMinStartDate } from '../../../../../../../helpers/helpers';
import moment from 'moment';
import { DateTimePicker, SearchableSelect } from '../../../../../../../components/common';





export const RoomPriceTable = ({
	data,
	onAdd,
	onDelete,
	onChange,
	validator,
	isSubmited,
	hasInvoiceRoomPriceOverlap = () => false,
	setResidentData,
	isFromResidentPage,
	migrationToDate,
}: any) => {
	useEffect(() => {
		const admissionDate = data?.admission?.admissionDate;
		if (data?.roomPrice?.length > 0 && !data.roomPrice[0].sDate && admissionDate) {
			setResidentData((prev: any) => ({
				...prev,
				roomPrice: prev.roomPrice.map((rp: any, i: number) =>
					i === 0
						? { ...rp, sDate: moment(admissionDate).format('YYYY-MM-DD') }
						: rp
				),
			}));
		}
	}, [data?.admission?.admissionDate]);

	const maxEDate = getMaxActiveFundEDate(data?.fundDetails);
	const maxDate = maxEDate || (isFromResidentPage ? migrationToDate : '');
	const admissionDate = data?.admission?.admissionDate
		? moment(data.admission.admissionDate).format('YYYY-MM-DD')
		: '';

	return (
		<table className='table table-modern table-hover mb-5'>
			<thead>
				<tr>
					<th>Price Per Week</th>
					<th>Start Date</th>
					<th>End Date</th>
					<th>Status</th>
					<th></th>
				</tr>
			</thead>
			<tbody>
				{data.roomPrice.map((roomPrice: any, index: number) => {
					const minStartDate = getMinStartDate(data.roomPrice, index);
					const formattedMinStart = minStartDate
						? moment(minStartDate).format('YYYY-MM-DD')
						: admissionDate;

					const showError = (label: string, value: any, rule: string) => (
						<div className='invalid-feedback d-block'>
							{validator.message(`${label} ${index}`, value, rule)}
						</div>
					);

					return (
						<tr key={roomPrice.id ?? index}>
							<td>
								<Input
									placeholder='Price Per Week'
									value={roomPrice.perWeek}
									onChange={(e: any) => onChange(index, 'perWeek', e.target.value)}
									isValid={validator.fieldValid(`Price Per Week ${index}`)}
									isTouched={isSubmited}
								/>
								{showError('Price Per Week', roomPrice.perWeek, 'required|numeric')}
							</td>

							<td>
								<DateTimePicker
									placeholder='Start Date'
									value={roomPrice.sDate || ''}
									minDate={formattedMinStart}
									maxDate={maxDate}
									onChange={(e: any) => onChange(index, 'sDate', e.target.value)}
									isValid={validator.fieldValid(`Start Date ${index + 1}`)}
									isTouched={isSubmited}
									invalidFeedback={validator.message(
										`Start Date ${index + 1}`,
										roomPrice.sDate,
										'required',
									)}
								/>
							</td>

							<td>
								<DateTimePicker
									placeholder='End Date'
									value={roomPrice.eDate}
									minDate={roomPrice.sDate || ''}
									maxDate={maxDate}
									onChange={(e: any) => onChange(index, 'eDate', e.target.value)}
									isValid={validator.fieldValid(`End Date ${index}`)}
									isTouched={isSubmited}
								/>
								{showError('End Date', roomPrice.eDate, 'required')}
							</td>

							<td>
								<SearchableSelect
									id='status'
									value={roomPrice.status}
									onChange={(e: any) => onChange(index, 'status', e.target.value)}
									isValid={validator.fieldValid(`Status ${index}`)}
									isTouched={isSubmited}
									options={PRICE_PERIOD_STATUS_LIST}
									placeholder='Select Status'
								/>
								{showError('Status', roomPrice.status, 'required')}
							</td>

							<td>
								<Button color='info' isLight icon='AddCircle' onClick={onAdd} />
								{data.roomPrice.length > 1 && (
									<Button
										color='danger'
										isLight
										icon='Delete'
										className='ms-2'
										isDisable={hasInvoiceRoomPriceOverlap(roomPrice)}
										onClick={() => onDelete(index)}
									/>
								)}
							</td>
						</tr>
					);
				})}
			</tbody>
		</table>
	);
};