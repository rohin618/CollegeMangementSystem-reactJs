import {
	FC,
	useState,
	ChangeEvent,
	forwardRef,
	useImperativeHandle,
	useEffect,
	useRef,
	useMemo,
} from 'react';
import {
	OffCanvasBody,
	OffCanvasHeader,
	OffCanvasTitle,
	OffCanvas,
	Textarea,
	Input,
	FormGroup,
	Button,
} from '../../../../../components/bootstrap';
import { createRoom, updateRoom } from '../../../../../common/api/room';
import { roomModel } from '../../../../../common/model/room';
import { useUpdateQueryListById } from '../../../../../hooks';
import SimpleReactValidator from 'simple-react-validator';
interface IRoomFormProps {
	isOpen: boolean;
	toggle: () => void;
	editRoomObject: any;
	roomsList: any;
}

export interface RoomFormData {
	roomNumber: string;
	floor: string;
	description: string;
	status: string;
}

export const RoomForm: FC<IRoomFormProps> = ({
	isOpen,
	toggle,
	editRoomObject = null,
	roomsList = [],
}) => {
	const updateRoomsList = useUpdateQueryListById<any>(['roomsList']);
	const [isLoading, setIsLoading] = useState(false);
	const [isSubmited, setIsSubmited] = useState(false);

	const validator = useRef(new SimpleReactValidator());
	const [roomData, setRoomData] = useState<any>({
		...roomModel,
	});

	useEffect(() => {
		if (!isOpen) return;
		setRoomData({
			...roomModel,
		});
	}, [isOpen]);

	useEffect(() => {
		if (editRoomObject) {
			setRoomData({ ...editRoomObject });
		}
	}, [isOpen, editRoomObject]);

	useEffect(() => {
		if (!isOpen) {
			validator.current.hideMessages();
			setIsSubmited(false);
			setRoomData({ ...roomModel });
		}
	}, [isOpen]);

	const handleChange =
		(field: keyof RoomFormData) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
			setRoomData((prev: any) => ({
				...prev,
				[field]: e.target.value,
			}));
		};
	// ✅ useMemo is correct here, but we must compute and return a string error message

	const isRoomNumberExist = useMemo(() => {
		// If no input or empty list, skip
		if (!roomData?.roomNumber || !roomsList?.length || isLoading) return '';
		const alreadyExists = roomsList.find(
			(r: any) =>
				r.roomNumber?.toLowerCase().trim() === roomData.roomNumber?.toLowerCase().trim() &&
				r.id !== roomData.id, // ✅ skip the same room while editing
		);

		return alreadyExists? `${roomData.roomNumber} already exists` : '';
	}, [roomsList, roomData?.roomNumber, roomData?.id,isOpen]);

	const handleSave = async () => {
		setIsSubmited(true);
		const isValid = validator.current.allValid();
		setIsSubmited(true);
		if (!isValid || isRoomNumberExist) {
			
			validator.current.showMessages();
			return;
		}
		setIsLoading(true);
		try {
			// setIsLoading(true);
			const body: any = {
				...roomData,
			};
						const resData = body?.id
				? await updateRoom(body?.id, roomData)
				: await createRoom(roomData);
			validator.current.hideMessages();
			updateRoomsList(resData);
			setIsLoading(false);
			setIsSubmited(false);
			toggle();
			// Send to Firebase or another backend service
		} catch (e) {
			console.error(e);
			validator.current.hideMessages();
		} finally {
			
		}
	};



	return (
		<OffCanvas
			setOpen={toggle}
			isOpen={isOpen}
			// onClose={() => setUpcomingEventsEditOffcanvas(false)
			titleId='upcomingEdit'
			isBodyScroll
			isBackdrop={false}
			placement='end'>
			<OffCanvasHeader setOpen={toggle}>
				<OffCanvasTitle id='upcomingEdit'>
					{roomData && roomData?.id ? 'Edit' : 'Create'} Room
				</OffCanvasTitle>
			</OffCanvasHeader>
			<OffCanvasBody>
				<div className='row g-3'>
					<div className='col-12'>
						<FormGroup id='roomNumber' label='Room Number' className='mb-2' isFloating>
							<Input
								isValid={
									validator.current.fieldValid('Room Number') &&
									!isRoomNumberExist
								}
								isTouched={isSubmited || !!isRoomNumberExist}
								invalidFeedback={
									validator.current.message(
										'Room Number',
										roomData.roomNumber,
										'required',
									) || isRoomNumberExist
								}
								value={roomData.roomNumber}
								onChange={handleChange('roomNumber')}
								disabled={isLoading}
							/>
						</FormGroup>
					</div>
					<div className='col-12'>
						<FormGroup id='floor' label='Floor' isFloating>
							<Input
								type='number'
								value={roomData.floor}
								onChange={handleChange('floor')}
							/>
						</FormGroup>
					</div>

					<div className='col-12'>
						<FormGroup id='description' label='Description' isFloating>
							<Textarea
								rows={3}
								isValid={validator.current.fieldValid('description')}
								isTouched={isSubmited}
								invalidFeedback={validator.current.message(
									'description',
									roomData.description,
									'required',
								)}
								value={roomData.description}
								onChange={handleChange('description')}
							/>
						</FormGroup>
					</div>
					{/* <FormGroup id='status' label='Status' className='col-12'>
                        <Input value={roomData.status} disabled />
                    </FormGroup> */}
				</div>
			</OffCanvasBody>
			<div className='row m-0'>
				<div className='col-12 p-3  pb-0'>
					<Button
						color='info'
						isDisable={!!isRoomNumberExist}
						isLoading={isLoading}
						className='w-100'
						onClick={handleSave}>
						{roomData?.id ? 'Update' : 'Save'}
					</Button>
				</div>
				<div className='col-12 p-3'>
					<Button
						isOutline
						isDisable={isLoading}
						color='danger'
						className='w-100'
						onClick={() => toggle()}>
						Close
					</Button>
				</div>
			</div>
		</OffCanvas>
	);
};
