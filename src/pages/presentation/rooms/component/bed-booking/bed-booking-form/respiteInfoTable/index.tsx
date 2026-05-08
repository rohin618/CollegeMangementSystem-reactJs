import moment from 'moment';
import { RESPITE_STATUS_TYPE } from '../../../../../../../common/constant';
import { RESPITE_STATUS_LIST } from '../../../../../../../common/data/option';
import {
	Card,
	CardBody,
	CardHeader,
	CardLabel,
	CardTitle,
	Select,
	Option,
	Input,
	Button,
	CardActions,
} from '../../../../../../../components/bootstrap';
import { getMinStartDate } from '../../../../../../../helpers/helpers';
import { useEffect } from 'react';
import { DateTimePicker, SearchableSelect } from '../../../../../../../components/common';

export const RespiteInfoTable = ({
	data,
	onAdd,
	onDelete,
	onChange,
	validator,
	isSubmited,
	setResidentData,
}: any) => {
	const respiteList = data.admission.respiteStatusList || [];

	useEffect(() => {
		if (
			data?.admission?.respiteStatusList?.length > 0 &&
			!data.admission.respiteStatusList[0].sDate &&
			data?.admission?.respiteEDate
		) {
			setResidentData((prev: any) => {
				const updatedList = [...prev.admission.respiteStatusList];

				updatedList[0] = {
					...updatedList[0],
					sDate: moment(prev.admission.respiteEDate).add(1, 'day').format('YYYY-MM-DD'),
				};

				return {
					...prev,
					admission: {
						...prev.admission,
						respiteStatusList: updatedList,
					},
				};
			});
		}
	}, [data?.admission?.respiteEDate]);

	return (
		<Card shadow={'none'} borderSize={1}>
			<CardHeader>
				<CardLabel iconColor='danger'>
					<CardTitle tag='div' className='h6'>
						Respite Info
					</CardTitle>
				</CardLabel>
				<CardActions>
					<Button color='info' isLight icon='AddCircle' onClick={onAdd}>
						Add
					</Button>
				</CardActions>
			</CardHeader>
			<CardBody>
				<table className='table table-modern table-hover mb-5'>
					<thead>
						<tr>
							<th>Status</th>
							<th>Start Date</th>
							<th>End Date</th>
							<th>Action</th>
						</tr>
					</thead>
					<tbody>
						{respiteList.map((respite: any, index: number) => {
							const minStartDate: any = getMinStartDate(respiteList, index);
							const minEndDate: any = respite.sDate || ''; // End date must be >= selected start date
							const isSelectDisabled = respite?.status === '';
							return (
								<tr key={index}>
									<td>
										<SearchableSelect
											id='status'
											value={respite.status}
											onChange={(e: any) =>
												onChange(index, 'status', e.target.value)
											}
											// isValid={validator.fieldValid(`Respite Status ${index + 1}`)}
											isTouched={isSubmited}
											// invalidFeedback={validator.message(
											//   `Respite Status ${index + 1}`,
											//   respite.status,
											//   "required"
											// )}
											options={RESPITE_STATUS_LIST}  placeholder='Select Respite'
										/>
											
									</td>
									<td>
										<DateTimePicker
											// type='date'
											// onKeyDown={(e) => e.preventDefault()}
											disabled={isSelectDisabled}
											placeholder='Respite Start Date'
											value={respite.sDate || ''}
											minDate={
												minStartDate
													? minStartDate
													: moment(data?.admission?.respiteEDate)
															.add(1, 'days')
															.format('YYYY-MM-DD')
											}
											onChange={(e: any) =>
												onChange(index, 'sDate', e.target.value)
											}
											isValid={
												!respite.status ||
												validator.fieldValid(
													`Respite Start Date ${index + 1}`,
												)
											}
											isTouched={isSubmited}
											invalidFeedback={
												respite.status
													? validator.message(
															`Respite Start Date ${index + 1}`,
															respite.sDate,
															'required',
														)
													: ''
											}
										/>
									</td>
									<td>
										<DateTimePicker
											// type='date'
											// placeholder='Respite End Date'
											disabled={isSelectDisabled}
											value={respite.eDate}
											minDate={minEndDate}
											onChange={(e: any) =>
												onChange(index, 'eDate', e.target.value)
											}
											isValid={
												!respite.status ||
												+respite.status ===
													RESPITE_STATUS_TYPE.EXTENDED_WITH_PERMANENT ||
												validator.fieldValid(
													`Respite End Date ${index + 1}`,
												)
											}
											isTouched={isSubmited}
											invalidFeedback={
												!respite.status
													? ''
													: +respite.status ===
														  RESPITE_STATUS_TYPE.EXTENDED_WITH_PERMANENT
														? ''
														: validator.message(
																`Respite End Date ${index + 1}`,
																respite.eDate,
																'required',
															)
											}
										/>
									</td>

									<td>
										<Button
											isDisable={respiteList.length <= 1}
											color='danger'
											isLight
											icon='Delete'
											className='ms-2'
											onClick={() => onDelete(index)}
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
