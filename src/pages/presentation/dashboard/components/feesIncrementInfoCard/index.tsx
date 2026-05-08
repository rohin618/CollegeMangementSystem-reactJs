import React from 'react';
import moment from 'moment';
import {
	Button,
	Card,
	CardBody,
	CardHeader,
	CardLabel,
	CardSubTitle,
	CardTitle,
	Popovers,
} from '../../../../../components/bootstrap';
import { getFirstLetter, getFundTypes } from '../../../../../helpers/helpers';
import useDarkMode from '../../../../../hooks/useDarkMode';
import { getColorNameWithIndex } from '../../../../../common/data/enumColors';
import Icon from '../../../../../components/icon';
import { useNavigate } from 'react-router-dom';
import { PREBOOK_TYPE, RESIDENT_STATUS_TYPE } from '../../../../../common/constant';

interface FeesIncrementInfoCardProps {
	residentInfo?: any[];
}

export const FeesIncrementInfoCard: React.FC<FeesIncrementInfoCardProps> = ({
	residentInfo = [],
}) => {
	const today = moment();
	const { darkModeStatus } = useDarkMode();
	const navigate = useNavigate();

	const getLatestIncrementDate = (infoArray: any[] = []) => {
		if (!Array.isArray(infoArray) || infoArray.length === 0) return null;
		const validDates = infoArray
			.map((i) => moment(i?.date))
			.filter((d) => d.isValid());
		if (validDates.length === 0) return null;
		return moment.max(validDates);
	};

	const upcomingResidents = residentInfo.filter((resident) => {
		const feesArray = resident?.admission?.feesIncrementInfo;
		const latestDate = getLatestIncrementDate(feesArray);

		if (!latestDate) return false;

		const daysDiff = latestDate.diff(today, 'days');
		return daysDiff <= 30 && daysDiff >= 0;
	});

	return (
		<Card stretch>
			<CardHeader>
				<CardLabel icon='AccessTime' iconColor='danger'>
					<CardTitle tag='div' className='h5'>
						Next Fee Increment Info
					</CardTitle>
					<CardSubTitle tag='div' className='h6 text-muted'>
						Residents with upcoming fee increment dates within 30 days.
					</CardSubTitle>
				</CardLabel>
			</CardHeader>

			<CardBody
				style={{
					maxHeight: '350px',
					overflowY: 'auto',
					scrollbarWidth: 'thin',
				}}>
				{upcomingResidents.length > 0 ? (
					<div className='row g-3'>
						{upcomingResidents.map((resident, index) => {
							const colorIndex = getColorNameWithIndex(index);
							const fundInfo = getFundTypes(resident);
							if (+resident?.admission?.residentStatus !== RESIDENT_STATUS_TYPE.ACTIVE)
								return null;

							const latestDate = getLatestIncrementDate(
								resident?.admission?.feesIncrementInfo,
							);

							return (
								<div key={index} className='col-12'>
									<div className='row g-2 align-items-center'>
										{/* Left Section */}
										<div className='col d-flex'>
											<div className='d-flex align-items-center'>
												{/* Avatar */}
												<div className='flex-shrink-0'>
													<div
														className='ratio ratio-1x1 me-3'
														style={{ width: 48 }}>
														<div
															className={`bg-l${darkModeStatus ? 'o25' : '25'}-${colorIndex} text-${colorIndex} rounded-2 d-flex align-items-center justify-content-center`}>
															<span className='fw-bold'>
																{getFirstLetter(resident?.personal?.name)}
															</span>
														</div>
													</div>
												</div>

												{/* Resident Info */}
												<div className='flex-grow-1'>
													<div className='fs-6 fw-bold text-dark'>
														{resident?.personal?.name}
													</div>
													<div className='text-muted small'>
														<Icon icon='MonetizationOn' className='me-1' />
														<span>
															{fundInfo?.fundName || 'N/A'}
															{fundInfo?.fnc ? `, ${fundInfo?.fnc}` : ''}
														</span>
													</div>
												</div>
											</div>
										</div>

										{/* Right Section */}
										<div className='col-auto'>
											<div className='d-flex align-items-center'>
												<Popovers desc='Latest Fees Increment Date' trigger='hover'>
													<div className='text-muted me-3 small text-nowrap'>
														<span className='fw-bold text-danger'>
															{latestDate
																? latestDate.format('DD MMM YYYY')
																: 'N/A'}
														</span>
													</div>
												</Popovers>

												<Button
													color='info'
													isLight
													icon='RemoveRedEye'
													className='text-nowrap px-2 py-1'
													onClick={() =>
														navigate(`/resident/details/${resident.id}`)
													}>
													View
												</Button>
											</div>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				) : (
					<div className='text-center text-muted py-5'>
						<i className='bi bi-inbox fs-2 mb-2'></i>
						<p className='mb-0'>No upcoming fee increments within 30 days.</p>
					</div>
				)}
			</CardBody>
		</Card>
	);
};
