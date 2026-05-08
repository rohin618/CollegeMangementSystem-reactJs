import classNames from 'classnames';
import { Badge, Button, Card } from '../../../../../components/bootstrap';
import Icon from '../../../../../components/icon';
import { priceFormat } from '../../../../../helpers/helpers';
import useDarkMode from '../../../../../hooks/useDarkMode';

interface BasicStatCardProps {
	title: string;
	value: string | number;
	icon: string;
	color: string;
}

export const BasicStatCard = ({ title, value, icon, color }: BasicStatCardProps) => {
	const { darkModeStatus } = useDarkMode();
	return (
		<Card className='shadow-sm border-0'>
			<div className='card-body p-4 ' style={{ height: '150px' }}>
				<div className='d-flex justify-content-between align-items-center'>
					<div className='flex-grow-1'>
						<p className='text-muted text-uppercase small fw-semibold mb-2 letter-spacing-1'>
							{title}
						</p>
						<h2
							className={classNames('fw-bold mb-0', {
								'text-dark': !darkModeStatus,
								'text-light': darkModeStatus,
							})}>
							{priceFormat(value)}
						</h2>
					</div>
					<div
						className={` d-flex align-items-center justify-content-center p-3`}
						style={{ width: '56px', height: '56px' }}>
						<Icon icon={icon} className={color} size='3x' />
					</div>
				</div>
				<hr className='my-3 opacity-25' />
				{title === 'overDue' && +value > 0 && (
					<Badge isLight color='danger'>
						Requires attention
					</Badge>
				)}
			</div>
		</Card>
	);
};

interface ResidentStats {
	totalResidents: number;
	activeResident: number;
	normalResidents: number;
	blockBedResidents: number;
}

interface TotalResidentsCardProps {
	stats: ResidentStats;
	noOfBlockBeds: number;
}

export const TotalResidentsCard = ({ stats, noOfBlockBeds }: TotalResidentsCardProps) => {
	const { darkModeStatus } = useDarkMode();
	return (
		<Card className=' shadow-sm border-0'>
			<div className='card-body p-4'>
				<div className='d-flex justify-content-between align-items-center'>
					<div className='flex-grow-1'>
						<p className='text-muted text-uppercase small fw-semibold mb-2 letter-spacing-1'>
							Total Resident
						</p>
						<h2
							className={classNames('fw-bold mb-0', {
								'text-dark': !darkModeStatus,
								'text-light': darkModeStatus,
							})}>
							{stats?.activeResident ?? 0}
						</h2>
					</div>

					<div
						className={` d-flex align-items-center justify-content-center p-3`}
						style={{ width: '56px', height: '56px' }}>
						<Icon icon='person' className='text-primary' size='3x' />
					</div>
				</div>

				<hr className=' opacity-25' />

				{/* Category Breakdown */}
				<div className='d-flex justify-content-between'>
					{/* Normal Residents */}
					<Button isLink size='sm' icon='circle' color='primary'>
						Normal {': '}
						{stats?.normalResidents ?? 0}
					</Button>

					{/* Block Beds */}
					<Button isLink size='sm' icon='circle' color='warning'>
						Block Beds {': '}
						{noOfBlockBeds ?? 0}
					</Button>
				</div>
			</div>
		</Card>
	);
};

interface BlockBedsCardProps {
	noOfActiveResidents: number;
	noOfBlockBeds: number;
}

export const BlockBedsCard = ({ noOfActiveResidents, noOfBlockBeds }: BlockBedsCardProps) => {
	const unoccupied = noOfBlockBeds - noOfActiveResidents;
	const occupancyRate = noOfBlockBeds
		? Math.round((noOfActiveResidents / noOfBlockBeds) * 100)
		: 0;
	const { darkModeStatus } = useDarkMode();
	return (
		<Card className='shadow-sm border-0'>
			<div className='card-body p-4'>
				{/* <p className='text-muted text-uppercase small fw-semibold mb-2 letter-spacing-1'>
					Block Beds
				</p> */}

				<div className='d-flex justify-content-between align-items-center'>
					<div className='flex-grow-1'>
						<p className='text-muted text-uppercase small fw-semibold mb-2 letter-spacing-1'>
							Block Beds
						</p>
						<h2
							className={classNames('fw-bold mb-0', {
								'text-dark': !darkModeStatus,
								'text-light': darkModeStatus,
							})}>
							{noOfBlockBeds ?? 0}
						</h2>
					</div>

					<div
						className={` d-flex align-items-center justify-content-center p-3`}
						style={{ width: '56px', height: '56px' }}>
						<Icon icon='bed' className='text-secondary' size='3x' />
					</div>
				</div>

				<hr className=' opacity-25' />

				{/* Occupancy Stats */}
				<div className='d-flex justify-content-between'>
					<Button isLink size='sm' icon='circle' color='danger'>
						Occupied {': '}
						{noOfActiveResidents}
					</Button>

					<Button isLink size='sm' icon='circle' color='success'>
						Vacant {': '} {unoccupied}
					</Button>
				</div>
			</div>
		</Card>
	);
};
