import React, { useCallback, useEffect, useRef, useState } from 'react';

import {
	Button,
	Input,
	OffCanvas,
	OffCanvasHeader,
	OffCanvasTitle,
	OffCanvasBody,
	FormGroup,
	Select,
	Option,
} from '../../../../../components/bootstrap';
import { miscellaneousServicesModel } from '../../../../../common/model/miscellaneous';
import SimpleReactValidator from 'simple-react-validator';
import {
	createMiscellaneousMaster,
	updateMiscellaneous,
} from '../../../../../common/api/miscellaneous';
import { useUpdateQueryListById } from '../../../../../hooks';
import { useMasterData } from '../../../../../contexts/mastersContext';
import { SearchableSelect } from '../../../../../components/common';

export const MiscellaneousServicesForm = ({
	isOpen = false,
	toggle = () => {},
	lastLargeNumer = 1001,
	editMiscellaneousObject = {},
}) => {
	const [formData, setFormData] = useState<any>({ ...miscellaneousServicesModel });
	const [isLoading, setIsLoading] = useState(false);

	const validator = useRef(new SimpleReactValidator({ autoForceUpdate: this }));
	const [isSubmited, setIsSubmited] = useState(false);
	const updateMiscellaneousList = useUpdateQueryListById<any>(['miscellaneousList']);
	const { vatList = [], isLoading: isVATLoading } = useMasterData();

	useEffect(() => {
		if (!isOpen && !editMiscellaneousObject && !lastLargeNumer) return;
		setFormData({
			...formData,
			code: `${lastLargeNumer}`,
		});
	}, [lastLargeNumer, isOpen]);

	useEffect(() => {
		if (isOpen && editMiscellaneousObject) {
			setFormData({
				...miscellaneousServicesModel,
				...editMiscellaneousObject,
			});
		}
	}, [editMiscellaneousObject, isOpen]);

	useEffect(() => {
		if (!isOpen) {
			setFormData({
				...miscellaneousServicesModel,
			});
			setIsLoading(false);
			setIsSubmited(false);
			validator.current.hideMessages();
		}
	}, [editMiscellaneousObject, isOpen]);

	const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const { id, value } = e.target;
		setFormData((prev: any) => ({
			...prev,
			[id]: value,
		}));
	}, []);

	const handleFormSubmit = useCallback(async () => {
		try {
			setIsSubmited(true);
			setIsLoading(true);
			const isValid = validator.current.allValid();
			if (!isValid) {
				validator.current.showMessages();
				return;
			}
			const body: any = {
				...formData,
			};
			const res = formData?.id
				? await updateMiscellaneous(body.id, body)
				: await createMiscellaneousMaster(body);
			updateMiscellaneousList(res);
			toggle();
			setIsSubmited(false);
		} catch (err) {
			console.error('Error saving company:', err);
		} finally {
			setIsLoading(false);
		}
	}, [formData, toggle]);

	return (
		<OffCanvas
			id='miscellaneousServices'
			titleId='miscellaneousServices'
			placement='end'
			isOpen={isOpen}
			isBackdrop={false}
			setOpen={toggle}>
			<OffCanvasHeader setOpen={toggle}>
				<OffCanvasTitle id='companyCanvasLabel'>
					Miscellaneous {formData?.id ? 'Update' : 'Create'}
				</OffCanvasTitle>
			</OffCanvasHeader>

			<OffCanvasBody>
				<div className='row'>
					<div className='col-12 mb-3'>
						<FormGroup id='name' label='Miscellaneous Name' isFloating>
							<Input
								id='name'
								value={formData.name}
								onChange={handleChange}
								disabled={isLoading}
								isValid={validator.current.fieldValid('name')}
								isTouched={isSubmited}
								invalidFeedback={validator.current.message(
									'name',
									formData.name,
									'required',
								)}
							/>
						</FormGroup>
					</div>
					<div className='col-12'>
						<FormGroup id={'vatId'} label={'VAT'} isFloating>
							<SearchableSelect
								id={'vatId'}
								value={formData.vatId}
								onChange={handleChange}
								disabled={isVATLoading} // ✅ disable select while loading
								isLoading={isVATLoading} // ✅ disable select while loading
								isValid={validator.current.fieldValid('vatId')}
								isTouched={isSubmited}
								invalidFeedback={validator.current.message(
									'vatId',
									formData.vatId,
									'required',
								)}
								placeholder='Select VAT'
								options={vatList}
								labelKey='rate'
								valueKey='id'
								renderLabel={(vat) =>
									`${Number(vat.rate).toFixed(1)}% - ${vat.name}`
								}
							/>
						</FormGroup>
					</div>
				</div>

				<div className='row m-0'>
					<div className='col-12 p-3 pb-0'>
						<Button
							color='info'
							className='w-100'
							onClick={handleFormSubmit}
							isLoading={isLoading}
							isDisable={isLoading}>
							{formData.id ? 'Update' : 'Save'}
						</Button>
					</div>
					<div className='col-12 p-3'>
						<Button
							isOutline
							color='danger'
							className='w-100'
							onClick={toggle}
							isDisable={isLoading}>
							Close
						</Button>
					</div>
				</div>
			</OffCanvasBody>
		</OffCanvas>
	);
};
