import classNames from 'classnames';

import {
	Card,
	CardBody,
	CardHeader,
	CardLabel,
	CardTitle,
	Button,
	CardSubTitle,
	CardActions,
	Dropdown,
	DropdownItem,
	DropdownMenu,
	DropdownToggle,
} from '../../../../../../../components/bootstrap';

import useDarkMode from '../../../../../../../hooks/useDarkMode';
import COLORS from '../../../../../../../common/data/enumColors';
import { NameOfLAForm } from '../nameOfLAForm';
import { deleteLocalAuthority } from '../../../../../../../common/api/localAuthority';
import { deleteICB } from '../../../../../../../common/api/ibc';
import { useState } from 'react';

import { useUpdateQueryListById } from '../../../../../../../hooks';
import { useParams } from 'react-router-dom';
import { useMasterData } from '../../../../../../../contexts/mastersContext';
export const NameOfLAList = ({ isFromICBTab = false, companyId = '' }: any) => {
	const { darkModeStatus } = useDarkMode();
	const params = useParams();
	const updateLocalICBList = useUpdateQueryListById<any>(['localICBList', companyId]);
	const updateLocalAuthorityList = useUpdateQueryListById<any>(['localAuthorityList', companyId]);
	const [isOpenLaFormModule, setIsOpenLaFormModule] = useState(false);
	const [laEditObject, setLaEditObject] = useState(null);

	const { localAuthorityList = [], localICBList = [], isLoading } = useMasterData();

	const listData = isFromICBTab ? localICBList : localAuthorityList;

	const handleOpenLaFromModule = () => {
		setLaEditObject(null);
		setIsOpenLaFormModule(true);
	};

	const handleCloseLaFromModule = () => {
		setIsOpenLaFormModule(false);
	};

	const handleOpenEditModalLaFrom = (editObject: any) => {
		setLaEditObject(editObject);
		setIsOpenLaFormModule(true);
	};

	const handleCloseSuccessLa = (data: any) => {
		updateQueryList(data);
		setLaEditObject(null);
		setIsOpenLaFormModule(false);
	};

	const updateQueryList = (data: any) => {
		isFromICBTab ? updateLocalICBList(data) : updateLocalAuthorityList(data);
	};

	const handleDelete = async (body: any) => {
		try {
			const apiFn = isFromICBTab ? deleteICB : deleteLocalAuthority;
			const res = await apiFn(body?.id, body);
			if (res) updateQueryList(res);
		} catch (error) {
			console.error('Something went wrong');
		}
	};

	return (
		<Card stretch tag='form' noValidate onSubmit={() => {}}>
			<CardHeader>
				<CardLabel icon='Contacts' iconColor='info'>
					<CardTitle tag='div' className='h5'>
						{isFromICBTab ? 'Name of ICB' : 'Name of Local Authority'}
					</CardTitle>
				</CardLabel>
				<CardActions>
					<Button color='info' isLight onClick={handleOpenLaFromModule} icon='AddCircle'>
						Add New
					</Button>
				</CardActions>
			</CardHeader>
			<CardBody isScrollable>
				{isLoading && <div>Loading...</div>}
				{listData?.length === 0 && !isLoading && <div>No Data Found...</div>}

				<div className='row'>
					{listData?.map((item: any) => (
						<div className='col-md-6' key={item.id}>
							<Card
								className={`shadow-3d-${
									darkModeStatus ? COLORS.LIGHT.name : COLORS.DARK.name
								}`}>
								<CardHeader>
									<CardLabel>
										<CardTitle
											tag='div'
											className={classNames('h6', 'cursor-pointer', {
												'link-dark': !darkModeStatus,
												'link-light': darkModeStatus,
											})}>
											{item?.name}
										</CardTitle>
										<CardSubTitle className='text-muted'>
											{item?.shortName}
										</CardSubTitle>
									</CardLabel>
									<CardActions>
										<Dropdown>
											<DropdownToggle hasIcon={false}>
												<Button
													icon='MoreVert'
													color={darkModeStatus ? 'dark' : undefined}
													aria-label='More actions'
												/>
											</DropdownToggle>
											<DropdownMenu isAlignmentEnd>
												<DropdownItem>
													<Button
														icon='Edit'
														onClick={() =>
															handleOpenEditModalLaFrom(item)
														}>
														Edit
													</Button>
												</DropdownItem>

												<DropdownItem isDivider />
												<DropdownItem>
													<Button
														icon='Delete'
														onClick={() => handleDelete(item)}>
														Delete
													</Button>
												</DropdownItem>
											</DropdownMenu>
										</Dropdown>
									</CardActions>
								</CardHeader>

								<CardBody>
									{item?.buildingNumber} {item?.address} {item?.area}{' '}
									{item?.postCode} {item?.country}
								</CardBody>
							</Card>
						</div>
					))}

					<NameOfLAForm
						toggle={handleCloseLaFromModule}
						onCloseSuccess={handleCloseSuccessLa}
						isOpen={isOpenLaFormModule}
						laEditObject={laEditObject}
						isFromICBTab={isFromICBTab}
					/>
				</div>
			</CardBody>
		</Card>
	);
};
