import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useMasterData } from '../../../../../contexts/mastersContext';
import { useParams } from 'react-router-dom';
import SimpleReactValidator from 'simple-react-validator';
import { generateUid, getActiveFundBlockBed, notifyEntity, showAlert } from '../../../../../helpers/helpers';
import {
	BLOCK_BEDS_STATUS,
	NOTIFY_TYPE,
	PREBOOK_HISTORY_STATUS,
	VAT_CONFIG_STATUS,
} from '../../../../../common/constant';
import { createICB, updateICB } from '../../../../../common/api/ibc';
import {
	createLocalAuthority,
	updateLocalAuthority,
} from '../../../../../common/api/localAuthority';
import { laAndICBModel } from '../../../../../common/model/laAndICB';
import moment from 'moment';
import {
	Button,
	FormGroup,
	Input,
	Modal,
	ModalBody,
	ModalFooter,
	ModalHeader,
	ModalTitle,
} from '../../../../../components/bootstrap';
import VATConfigurations from '../VATConfigurations';
import BlockBedConfigurations from '../blockBeds';
import { ILaAndICBModel } from '../../../../../common/interface';
import { IBlockBed, IBlockBedHistory, IVatConfig } from '../../../../../common/interface/laAndICB';
import showNotification from '../../../../../components/extras/showNotification';
interface laAndIcbFormprops {
	isOpen: boolean;
	toggle: () => void;
	onCloseSuccess: (data: ILaAndICBModel) => void;
	laEditObject: ILaAndICBModel | null;
	isFromICBTab: boolean;
	companyId: string;
}
export const LaAndIcbForm: React.FC<laAndIcbFormprops> = ({
	isOpen = false,
	toggle,
	onCloseSuccess,
	laEditObject = null,
	isFromICBTab = false,
	companyId = '',
}) => {
	const { vatList, isLoading: isVATLoading } = useMasterData();
	const [isLoading, setIsLoading] = useState(false);
	const [isSubmitted, setIsSubmitted] = useState(false);
	const [formData, setFormData] = useState<ILaAndICBModel>({ ...laAndICBModel });

	const validator = useRef(new SimpleReactValidator());

	useEffect(() => {
		if (laEditObject && Object.keys(laEditObject).length > 0) {
			setFormData({ ...laAndICBModel, ...laEditObject });
			validator.current.purgeFields();
		}
		return () => {
			setFormData({ ...laAndICBModel });
		};
	}, [laEditObject, isOpen]);

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

		const activeBlockBed = getActiveFundBlockBed(formData?.blockBeds);

		// validate noOfblockbed changes
		const noOfBlockBedCount = activeBlockBed?.noOfBlockBed ?? 0;

		const blockBedUserCount =
			formData?.blockBedHistory?.filter(
				(bbh: IBlockBedHistory) =>
					bbh.blockBedId === activeBlockBed?.id &&
					+bbh.status === PREBOOK_HISTORY_STATUS.ACTIVE,
			).length ?? 0;

		if (activeBlockBed && formData?.id && noOfBlockBedCount < blockBedUserCount) {
			showNotification(
				"You can't reduce Block Bed Count. Some residents are already mapped with these Block Beds.",
				'',
				'warning',
			);
			return;
		}

		// set remaining blockbed as inactive
		let updatedBlockBeds = formData.blockBeds;
		if (activeBlockBed) {
			const activeId = activeBlockBed.id;

			updatedBlockBeds = formData.blockBeds.map((item: any) => ({
				...item,
				status:
					item.id === activeId ? BLOCK_BEDS_STATUS.ACTIVE : BLOCK_BEDS_STATUS.INACTIVE,
			}));
		}

		// while update it generate the id
		const vatConfigList = formData.vatConfigList.map((item: any) => ({
			...item,
			id: item?.id ? item?.id : generateUid(),
		}));

		// while update it generate the id
		const BlockBedConfigList = updatedBlockBeds.map((item: any) => ({
			...item,
			id: item?.id ? item?.id : generateUid(),
		}));

		//Emtpy the resident Data
		const blockBedHistory = formData.blockBedHistory.map((item:any) => ({
			...item,
			residentData:'',
		}))

		const reqBody = {
			...formData,
			blockBedHistory,
			blockBeds: BlockBedConfigList,
			vatConfigList,
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
		if (!companyId) return [];
		return vatList.filter((vat: any) =>
			vat?.companyIds?.some((c: any) => c.id === companyId && !c.endDate && c.isActive),
		);
	}, [vatList, companyId]);

	const handleVATAdd = () => {
		setFormData((prev: ILaAndICBModel) => ({
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
		setFormData((prev: ILaAndICBModel) => ({
			...prev,
			vatConfigList: prev.vatConfigList
				.map((item: any, i: number) => {
					if (i === index) {
						if (!item.id) return;
						return {
							...item,
							status: VAT_CONFIG_STATUS.DELETE,
						};
					}
					validator.current.purgeFields();
					return item;
				})
				.filter(Boolean),
		}));
		notifyEntity('VAT Configuration',NOTIFY_TYPE.DELETE,'This Vat Configuration Mark as deleted');
	};

	const handleVATChange = (index: number, field: string, value: any) => {
		setFormData((prev: ILaAndICBModel) => ({
			...prev,
			vatConfigList: prev.vatConfigList.map((item: IVatConfig, i: number) =>
				i === index ? { ...item, [field]: value } : item,
			),
		}));
	};

	// here is a block bed handlers
	const handleBlockBedChange = (index: number, field: string, value: any) => {
		setFormData((prev: ILaAndICBModel) => {
			return {
				...prev,
				blockBeds: prev.blockBeds.map((item: IBlockBed, i: number) =>
					i === index ? { ...item, [field]: value } : item,
				),
			};
		});
	};

	const handleBlockBedAdd = () => {
		const activeBed = getActiveFundBlockBed(formData?.blockBeds);
		if (activeBed) {
			showAlert({
				title: "Active Block Beds Already Exist",
				text: "You already have active block beds.",
				icon: "warning"
			});

			return;
		}
		setFormData((prev: ILaAndICBModel) => {
			const list = prev.blockBeds;

			const last = list[list.length - 1];

			if (!last.id) {
				showAlert({
					title: "Action Not Allowed",
					text: "You cannot add another block bed. You already added one.",
					icon: "warning"
				});

				return prev;
			}

			return {
				...prev,
				blockBeds: [
					...list,
					{
						id: '',
						noOfBlockBed: '',
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
		setFormData((prev: ILaAndICBModel) => {
			const list = prev.blockBeds;
			const blockBedHistory = prev.blockBedHistory || [];
			const blockBedUsedIndex = blockBedHistory.findIndex(
				(item: IBlockBedHistory) => item.blockBedId === id,
			);
			if (blockBedUsedIndex !== -1) {
				showAlert({
					title: "Cannot Delete Block Bed",
					text: "This block bed is referenced in the Block Bed History and cannot be deleted.",
					icon: "error"
				});

				return prev;
			}
			const blockBeds = list.filter((item: IBlockBed) => item.id !== id);
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
			isStaticBackdrop
			isOpen={isOpen}
			setIsOpen={toggle}
			size='xl'>
			<ModalHeader setIsOpen={toggle}>
				<ModalTitle id='companyCanvasLabel'>
					{formData?.id ? 'Update' : 'Create'} {isFromICBTab ? 'ICB' : 'LA'}
				</ModalTitle>
			</ModalHeader>

			<ModalBody>
				<div className='row g-3'>
					<div className='col-6'>
						<FormGroup id='name' label='Name' isFloating>
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
						<FormGroup id='shortName' label='Short Name' isFloating>
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
						<FormGroup id='buildingNumber' label='Building Number' isFloating>
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
						<FormGroup id='address' label='Address' isFloating>
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
						<FormGroup id='area' label='Area' isFloating>
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
						<FormGroup id='postCode' label='Post Code' isFloating>
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
						<FormGroup id='phone' label='Phone' isFloating>
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
						<FormGroup id='email' label='Email' isFloating>
							<Input
								id='email'
								placeholder='Enter Email Number'
								value={formData.email}
								onChange={handleChange}
							// isValid={validator.current.fieldValid('Phone')}
							// isTouched={isSubmitted}
							// invalidFeedback={validator.current.message('Phone', formData.phone, 'required|numeric')}
							/>
						</FormGroup>
					</div>

					<div className='col-6'>
						<FormGroup id='country' label='Country' isFloating>
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
						<VATConfigurations
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
						<BlockBedConfigurations
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
