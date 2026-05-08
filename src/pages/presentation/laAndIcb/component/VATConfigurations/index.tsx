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
import { VAT_CONFIG_STATUS } from '../../../../../common/constant';
import { DateTimePicker, SearchableSelect } from '../../../../../components/common';

const VATConfigurations = ({
	vatConfigList = [],
	companyVATs,
	onAdd,
	onDelete,
	onChange,
	validator,
	isSubmited,
}: any) => {
	const activeVatList = useMemo(() => {
		return vatConfigList
			?.map((item: any, index: number) => ({
				...item,
				indexOfOriginal: index,
			}))
			.filter((item: any) => +item.status === VAT_CONFIG_STATUS.ACTIVE);
	}, [vatConfigList]);

	const canAdd = activeVatList.every(
		(vat: any, index: number) => vat.vatId !== '' && vat.vatEffectiveDate !== '',
	);

	return (
		<Card>
			<CardHeader>
				<CardLabel>
					<CardTitle tag='div' className='h6'>
						VAT Configuration
					</CardTitle>
				</CardLabel>
				<CardActions>
					<Button color='info' isLight icon='AddCircle' onClick={onAdd} isDisable={!canAdd}>
						Add VAT
					</Button>
				</CardActions>
			</CardHeader>

			<CardBody>
				<table className='table table-modern table-hover mb-3'>
					<thead>
						<tr>
							<th>VAT</th>
							<th>VAT Effective Date</th>
							<th>Action</th>
						</tr>
					</thead>

					<tbody>
						{activeVatList?.map((item: any, index: number) => {
							const fieldVat = `vatConfig_vatId_${index}`;
							const fieldDate = `vatConfig_vatEffectiveDate_${index}`;
							return (
								<tr key={item.id}>
									<td>
										<SearchableSelect
											placeholder='Select VAT'
											value={item.vatId || ''}
											onChange={(e: any) =>
												onChange(
													item?.indexOfOriginal,
													'vatId',
													e.target.value,
												)
											}
											isValid={validator.fieldValid(fieldVat)}
											isTouched={isSubmited}
											invalidFeedback={validator.message(
												fieldVat,
												item.vatId,
												'required',
											)} options={companyVATs}
											labelKey='rate'
											valueKey='id'
											renderLabel={(vat) =>
												`${Number(vat.rate).toFixed(1)}% - ${vat.name}`
											} />

									</td>

									{/* VAT Effective Date */}
									<td>
										<DateTimePicker

											value={item.vatEffectiveDate || ''}
											minDate={
												index > 0
													? moment(
														activeVatList[index - 1]
															.vatEffectiveDate,
													)
														.add(1, 'day')
														.format('YYYY-MM-DD')
													: ''
											}

											onChange={(e: any) =>
												onChange(
													item?.indexOfOriginal,
													'vatEffectiveDate',
													e.target.value,
												)
											}
											isValid={validator.fieldValid(fieldDate)}
											isTouched={isSubmited}
											invalidFeedback={validator.message(
												fieldDate,
												item.vatEffectiveDate,
												'required',
											)}
										/>
									</td>

									{/* ACTIONS */}
									<td>

										<Button
											isDisable={activeVatList.length <= 1}
											color='danger'
											isLight
											className='ms-2'
											icon='Delete'
											onClick={() => onDelete(item?.indexOfOriginal)}
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

export default VATConfigurations;
