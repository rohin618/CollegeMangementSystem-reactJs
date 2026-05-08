import React, { useMemo, useState } from 'react';
import moment from 'moment';
import {
	Card,
	CardTabItem,
	CardBody,
	CardHeader,
	CardTitle,
	CardSubTitle,
	CardLabel,
} from '../../../../../components/bootstrap';
import { useMasterData } from '../../../../../contexts/mastersContext';
import Icon from '../../../../../components/icon';
import Button from '../../../../../components/bootstrap/Button';
import { useNavigate } from 'react-router-dom';
import { IBlockBed } from '../../../../../common/interface/laAndICB';
import { getActiveFundBlockBed } from '../../../../../helpers/helpers';
import { FUND_SOURCE_TYPE } from '../../../../../common/constant';
import useDarkMode from '../../../../../hooks/useDarkMode';
import classNames from 'classnames';

// identify active blockBed & check if expiring in next 30 days
const getExpiringBlockBed = (blockBeds: IBlockBed[] = []) => {
	const active = getActiveFundBlockBed(blockBeds);

	if (!active?.eDate) return null;

	const diff = moment(active.eDate).diff(moment(), 'days');

	return diff <= 30 && diff >= 0 ? { ...active, daysLeft: diff } : null;
};

export const BlockBedInfoCard: React.FC = () => {
	const { localAuthorityList = [], localICBList = [] } = useMasterData();
	const navigate = useNavigate();
	const [activeTab, setActiveTab] = useState(0);
	const { darkModeStatus } = useDarkMode();
	const laOrICBFundType = useMemo(() => {
		return +activeTab === 0 ? FUND_SOURCE_TYPE.LOCAL_AUTHORITY : FUND_SOURCE_TYPE.CHC;
	}, [activeTab]);

	const LA = localAuthorityList
		?.map((la: any) => ({
			...la,
			expiring: getExpiringBlockBed(la.blockBeds),
		}))
		.filter((la) => la.expiring);

	const ICB = localICBList
		?.map((i: any) => ({
			...i,
			expiring: getExpiringBlockBed(i.blockBeds),
		}))
		.filter((i) => i.expiring);

	const renderRow = (item: any) => (
		<div
			key={item.id}
			className='border rounded p-3 mb-2 d-flex justify-content-between align-items-center'>
			<div className='me-3'>
				<div
					className={classNames('fw-bold', {
						'text-dark': !darkModeStatus,
						'text-light': darkModeStatus,
					})}>
					{item.name}
				</div>

				<div className='small text-danger fw-semibold'>
					<Icon icon='Event' className='me-1' />
					Ends: {moment(item.expiring.eDate).format('DD MMM YYYY')}
				</div>

				<div className='small text-muted'>{item.expiring.daysLeft} days remaining</div>
			</div>

			<Button
				color='info'
				isLight
				size='sm'
				icon='RemoveRedEye'
				onClick={() => navigate(`/laAndIcb/details/${laOrICBFundType}/${item.id}`)}>
				View
			</Button>
		</div>
	);

	return (
		<Card stretch>
			<CardHeader>
				<CardLabel icon='HomeWork'>
					<CardTitle className='h4 mb-1'>Block Beds Status Info</CardTitle>
					<CardSubTitle tag='div' className='h6 text-muted'>
						Block Beds ending within next 30 days.
					</CardSubTitle>
				</CardLabel>
			</CardHeader>

			<CardBody className='p-0'>
				<Card hasTab onTabChange={setActiveTab} className='h-100' shadow='none'>
					<CardTabItem id={0} title={`LA (${LA?.length})`} icon='Apartment'>
						<CardBody className='p-0'>
							{LA?.length ? (
								LA?.map(renderRow)
							) : (
								<div className='py-5 text-center text-muted'>
									No Local Authority Block beds expiring soon.
								</div>
							)}
						</CardBody>
					</CardTabItem>

					<CardTabItem id={1} title={`ICB (${ICB?.length})`} icon='CorporateFare'>
						<CardBody className='p-0'>
							{ICB?.length ? (
								ICB?.map(renderRow)
							) : (
								<div className='py-5 text-center text-muted'>
									No ICB Block Bed Expiry Soon
								</div>
							)}
						</CardBody>
					</CardTabItem>
				</Card>
			</CardBody>
		</Card>
	);
};
