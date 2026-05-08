import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
	Button,
	FormGroup,
	Input,
	OffCanvas,
	OffCanvasBody,
	OffCanvasHeader,
	OffCanvasTitle,
} from '../../../../../components/bootstrap';
import SimpleReactValidator from 'simple-react-validator';
import { useUpdateQueryListById } from '../../../../../hooks';
import { Relationship } from '../../../../../common/model/relationsWithResident/Relationship';
import { createRelationship, updateRelationship } from '../../../../../common/api/relationship';

interface RelationshipFormProps {
	isOpen: boolean;
	relationshipEditData?: any;
	toggle: () => void;
}

export const RelationshipForm: React.FC<RelationshipFormProps> = ({
	isOpen,
	relationshipEditData,
	toggle,
}) => {
	const [formData, setFormData] = useState<any>({ ...Relationship });
	const [open, setOpen] = useState(isOpen);
	const [isLoading, setIsLoading] = useState(false);
	const [isSubmitted, setIsSubmitted] = useState(false);

	const updateRelationshipList = useUpdateQueryListById<any>(['relationshipList']);
	const validator = useRef(new SimpleReactValidator({ autoForceUpdate: this }));

	useEffect(() => {
		setOpen(isOpen);
		if (relationshipEditData) {
			setFormData(relationshipEditData);
		} else {
			setFormData(Relationship);
		}
	}, [isOpen, relationshipEditData]);

	useEffect(() => {
		if (!isOpen) {
			setFormData({ ...Relationship });
			setIsSubmitted(false);
			validator.current.hideMessages();
		}
	}, [isOpen]);

	const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const { id, value } = e.target;
		setFormData((prev: any) => ({
			...prev,
			[id]: value,
		}));
	}, []);

	const handleFormSubmit = useCallback(async () => {
		setIsLoading(true);
		setIsSubmitted(true);
		const isValid = validator.current.allValid();

		if (!isValid) {
			validator.current.showMessages();
			setIsLoading(false);
			return;
		}

		try {
			const body = { ...formData };
			const res = formData.id
				? await updateRelationship(body.id, body)
				: await createRelationship(body);

			updateRelationshipList(res);
			toggle();
			setIsSubmitted(false);
		} catch (error) {
			console.error('Error saving relationship:', error);
		} finally {
			setIsLoading(false);
		}
	}, [formData, toggle, updateRelationshipList]);

	return (
		<OffCanvas isOpen={isOpen} setOpen={toggle} isBackdrop={false}>
			<OffCanvasHeader setOpen={toggle}>
				<OffCanvasTitle id='relationshipCanvasLabel'>Relationship</OffCanvasTitle>
			</OffCanvasHeader>
			<OffCanvasBody>
				<div className='row'>
					<div className='col-12 mb-3'>
						<FormGroup id='name' label='Relationship Name' isFloating>
							<Input
								id='name'
								value={formData.name}
								onChange={handleChange}
								disabled={isLoading}
								isValid={validator.current.fieldValid('name')}
								isTouched={isSubmitted}
								invalidFeedback={validator.current.message(
									'name',
									formData.name,
									'required',
								)}
							/>
						</FormGroup>
					</div>
				</div>

				{/* Buttons */}
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
