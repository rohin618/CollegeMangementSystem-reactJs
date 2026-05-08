import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
	FormGroup,
	Input,
	Button,
	Modal,
	ModalHeader,
	ModalBody,
	ModalFooter,
	ModalTitle,
} from '../../../../../../../components/bootstrap';
import { laAndICBModel } from '../../../../../../../common/model/laAndICB';
import {
	createLocalAuthority,
	updateLocalAuthority,
} from '../../../../../../../common/api/localAuthority';
import { createICB, updateICB } from '../../../../../../../common/api/ibc';
import { useParams } from 'react-router-dom';
import SimpleReactValidator from 'simple-react-validator';
import { useMasterData } from '../../../../../../../contexts/mastersContext';
import VATConfiguration from '../../../VatConfiguration';
import { generateUid, getActiveFundBlockBed, notifyEntity, showAlert } from '../../../../../../../helpers/helpers';
import {
	BLOCK_BEDS_STATUS,
	NOTIFY_TYPE,
	VAT_CONFIG_STATUS,
} from '../../../../../../../common/constant';
import BlockBedConfiguration from '../../../blockBeds';
import moment from 'moment';

export const NameOfLAForm = ({
	isOpen = false,
	toggle = () => { },
	onCloseSuccess = () => { },
	laEditObject = null,
	isFromICBTab = false,
}: any) => {
	const { vatList, isLoading: isVATLoading } = useMasterData();
	const [isLoading, setIsLoading] = useState(false);
	const [isSubmitted, setIsSubmitted] = useState(false);
	const params = useParams();
	const [formData, setFormData] = useState<any>({
		...laAndICBModel,
		companyId: params?.companyId,
	});

	const validator = useRef(new SimpleReactValidator());

	useEffect(() => {
		if (laEditObject && Object.keys(laEditObject).length > 0) {
			setFormData({ ...laAndICBModel, ...laEditObject });
		}
		return () => {
			setFormData({ ...laAndICBModel });
		};
	}, [laEditObject]);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { id, value } = e.target;
		setFormData((prev: any) => ({ ...prev, [id]: value }));
	};

	const handleSave = async () => {
		setIsSubmitted(true);

		if (!validator.current.allValid()) {
			validator.current.showMessages();
			return;
		}

		const activeToday = getActiveFundBlockBed(formData?.blockBeds);

		let updatedBlockBeds = formData.blockBeds;
		if (activeToday) {
			const activeId = activeToday.id;

			updatedBlockBeds = formData.blockBeds.map((item: any) => ({
				...item,
				status:
					item.id === activeId ? BLOCK_BEDS_STATUS.ACTIVE : BLOCK_BEDS_STATUS.INACTIVE,
			}));
		}

		const vatConfigList = formData.vatConfigList.map((item: any) => ({
			...item,
			id: item?.id ? item?.id : generateUid()
		}));
		const reqBody = {
			...formData,
			blockBeds: updatedBlockBeds,
			companyId: params?.companyId,
			vatConfigList
		};

		setIsLoading(true);

		try {
			let response;

			if (isFromICBTab) {
				response = formData?.id
					? await updateICB(formData.id, reqBody)
					: await createICB(reqBody);
			} else {
				response = formData?.id
					? await updateLocalAuthority(formData.id, reqBody)
					: await createLocalAuthority(reqBody);
			}

			onCloseSuccess(response);
		} catch (err) {
			console.error('Error creating LA:', err);
		} finally {
			setIsLoading(false);
			setFormData({ ...laAndICBModel });
			setIsSubmitted(false);
			validator.current.hideMessages();
		}
	};

	const companyVATs = useMemo(() => {
		if (!params?.companyId) return [];
		return vatList.filter((vat: any) =>
			vat?.companyIds?.some(
				(c: any) => c.id === params?.companyId && !c.endDate && c.isActive,
			),
		);
	}, [vatList, params?.companyId]);

	// useEffect(() => {
	//   setFormData((prev: any) => ({
	//     ...prev,
	//     vatConfigList: prev.vatConfigList?.length
	//       ? prev.vatConfigList
	//       : [{ id: generateUid(), vatId: '', vatEffectiveDate: '' }],
	//   }));
	// }, []);

	const handleVATAdd = () => {
		setFormData((prev: any) => ({
			...prev,
			vatConfigList: [
				...prev.vatConfigList,
				{
					id: '',
					vatId: '',
					vatEffectiveDate: '',
					status: VAT_CONFIG_STATUS.ACTIVE,
				},
			],
		}));
	};

	const handleVATDelete = (index: number) => {
		setFormData((prev: any) => ({
			...prev,
			vatConfigList: prev.vatConfigList.map((item: any, i: number) => {

				if (i === index) {
					if (!item.id) return
					return {
						...item,
						status: VAT_CONFIG_STATUS.DELETE,
					};
				}
				validator.current.purgeFields();
				return item;
			}).filter(Boolean),
		}));
		notifyEntity('This Vat Configuration Mark as deleted', NOTIFY_TYPE.DELETE);
	};

	const handleVATChange = (index: number, field: string, value: any) => {
		setFormData((prev: any) => ({
			...prev,
			vatConfigList: prev.vatConfigList.map((item: any, i: number) =>
				i === index ? { ...item, [field]: value } : item,
			),
		}));
	};

	// here is a block bed handlers
	const handleBlockBedChange = (index: number, field: string, value: any) => {
		setFormData((prev: any) => ({
			...prev,
			blockBeds: prev.blockBeds.map((item: any, i: number) =>
				i === index ? { ...item, [field]: value } : item,
			),
		}));
	};

	const handleBlockBedAdd = () => {
		const activeBed = getActiveFundBlockBed(formData?.blockBeds);
		if (activeBed) {
			showAlert({
				title: "Active Block Beds Found",
				text: "You already have active block beds.",
				icon: "warning"
			});

			return;
		}
		setFormData((prev: any) => {
			const list = prev.blockBeds;

			const last = list[list.length - 1];

			return {
				...prev,
				blockBeds: [
					...list,
					{
						id: generateUid(),
						perWeek: '',
						sDate: last?.eDate
							? moment(last.eDate).add(1, 'day').format('YYYY-MM-DD')
							: '',
						eDate: '',
						status: BLOCK_BEDS_STATUS.ACTIVE,
					},
				],
			};
		});
	};
	const handleBlockBedDelete = (id: string) => {
		setFormData((prev: any) => {
			const list = prev.blockBeds;
			const blockBedHistory = prev.blockBedHistory || [];
			const blockBedUsedIndex = blockBedHistory.findIndex(
				(item: any) => item.blockBedId === id,
			);
			if (blockBedUsedIndex !== -1) {
				showAlert({
					title: "Action Not Allowed",
					text: "This block bed is referenced in the Block Bed History and cannot be deleted.",
					icon: "error" // change to "success" if you want green tick ✔
				});


				return prev;
			}
			const blockBeds = list.filter((item: any) => item.id !== id);
			validator.current.purgeFields();
			return {
				...prev,
				blockBeds,
			};
		});
	};

	return (
		<Modal
			// id="companyCanvas"
			titleId='companyCanvasLabel'
			// placement="end"
			isOpen={isOpen}
			setIsOpen={toggle}
			size='lg'>
			<ModalHeader setIsOpen={toggle}>
				<ModalTitle id='companyCanvasLabel'>
					{formData?.id ? 'Update' : 'Create'} {isFromICBTab ? 'ICB' : 'LA'}
				</ModalTitle>
			</ModalHeader>

			<ModalBody>
				<div className='row g-3'>
					<div className='col-6'>
						<FormGroup id='name' label='Name'>
							<Input
								id='name'
								placeholder='Enter Name'
								value={formData.name}
								onChange={handleChange}
								isValid={validator.current.fieldValid('Name')}
								isTouched={isSubmitted}
								invalidFeedback={validator.current.message(
									'Name',
									formData.name,
									'required',
								)}
							/>
						</FormGroup>
					</div>

					<div className='col-6'>
						<FormGroup id='shortName' label='Short Name'>
							<Input
								id='shortName'
								placeholder='Enter Short Name'
								value={formData.shortName}
								onChange={handleChange}
								isValid={validator.current.fieldValid('Short Name')}
								isTouched={isSubmitted}
								invalidFeedback={validator.current.message(
									'Short Name',
									formData.shortName,
									'required',
								)}
							/>
						</FormGroup>
					</div>

					<div className='col-6'>
						<FormGroup id='buildingNumber' label='Building Number'>
							<Input
								id='buildingNumber'
								placeholder='Enter Building Number'
								value={formData.buildingNumber}
								onChange={handleChange}
							// isValid={validator.current.fieldValid('Building Number')}
							// isTouched={isSubmitted}
							// invalidFeedback={validator.current.message('Building Number', formData.buildingNumber, 'required')}
							/>
						</FormGroup>
					</div>

					<div className='col-6'>
						<FormGroup id='address' label='Address'>
							<Input
								id='address'
								placeholder='Enter Address'
								value={formData.address}
								onChange={handleChange}
							// isValid={validator.current.fieldValid('Address')}
							// isTouched={isSubmitted}
							// invalidFeedback={validator.current.message('Address', formData.address, 'required')}
							/>
						</FormGroup>
					</div>

					<div className='col-6'>
						<FormGroup id='area' label='Area'>
							<Input
								id='area'
								placeholder='Enter Area'
								value={formData.area}
								onChange={handleChange}
							// isValid={validator.current.fieldValid('Area')}
							// isTouched={isSubmitted}
							// invalidFeedback={validator.current.message('Area', formData.area, 'required')}
							/>
						</FormGroup>
					</div>

					<div className='col-6'>
						<FormGroup id='postCode' label='Post Code'>
							<Input
								id='postCode'
								placeholder='Enter Post Code'
								value={formData.postCode}
								onChange={handleChange}
							// isValid={validator.current.fieldValid('Post Code')}
							// isTouched={isSubmitted}
							// invalidFeedback={validator.current.message('Post Code', formData.postCode, 'required')}
							/>
						</FormGroup>
					</div>

					<div className='col-6'>
						<FormGroup id='phone' label='Phone'>
							<Input
								id='phone'
								placeholder='Enter Phone Number'
								value={formData.phone}
								onChange={handleChange}
							// isValid={validator.current.fieldValid('Phone')}
							// isTouched={isSubmitted}
							// invalidFeedback={validator.current.message('Phone', formData.phone, 'required|numeric')}
							/>
						</FormGroup>
					</div>

					<div className='col-6'>
						<FormGroup id='country' label='Country'>
							<Input
								id='country'
								placeholder='Enter Country'
								value={formData.country}
								onChange={handleChange}
								disabled
							// isValid={validator.current.fieldValid('Country')}
							// isTouched={isSubmitted}
							// invalidFeedback={validator.current.message('Country', formData.country, 'required')}
							/>
						</FormGroup>
					</div>

					<div className='col-12'>
						<VATConfiguration
							vatConfigList={formData?.vatConfigList}
							companyVATs={companyVATs}
							onAdd={handleVATAdd}
							onDelete={handleVATDelete}
							onChange={handleVATChange}
							validator={validator.current}
							isSubmited={isSubmitted}
						/>
					</div>
					<div className='col-12'>
						<BlockBedConfiguration
							blockBeds={formData?.blockBeds}
							onAdd={handleBlockBedAdd}
							onDelete={handleBlockBedDelete}
							onChange={handleBlockBedChange}
							validator={validator.current}
							isSubmited={isSubmitted}
						/>
					</div>
				</div>
			</ModalBody>
			<ModalFooter>
				<div className='row mt-3'>
					<div className='col-6 p-3 pb-0'>
						<Button
							color='info'
							className='w-100'
							onClick={handleSave}
							isLoading={isLoading}
							isDisable={isLoading}>
							{formData?.id ? 'Update' : 'Save'}
						</Button>
					</div>
					<div className='col-6 p-3'>
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
			</ModalFooter>
		</Modal>
	);
};
