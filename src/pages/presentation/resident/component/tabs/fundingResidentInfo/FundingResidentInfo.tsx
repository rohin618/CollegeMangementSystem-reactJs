import React from 'react';
import moment from 'moment';
import {
	Card,
	CardBody,
	CardTitle,
	CardSubTitle,
	CardLabel,
	CardHeader,
	Badge,
} from '../../../../../../components/bootstrap';

import {
	FUND_SOURCE_LIST,
	FUND_SOURCE_STATUS_TYPE_LIST,
	FUND_TYPE_LIST,
	FNC_STATUS_LIST,
	INCONT_STATUS_LIST,
} from '../../../../../../common/data/option';

import {
	FAMILY_OR_THIRD_PARTY_TOPUP_STATUS,
	FNC_STATUS_TYPE,
	FUND_SOURCE_TYPE,
	FUND_TYPE,
} from '../../../../../../common/constant/app';

import {
	getActiveFundDetailsByLAOrICB,
	getActiveIncontDetailsDetails,
	getLabelByValue,
	getResidentInvoiceAddress,
	priceFormat,
} from '../../../../../../helpers/helpers';
import { useMasterData } from '../../../../../../contexts/mastersContext';
import { getActiveFundDetailsByJointFund } from '../../../../../../helpers/resident';

const DisplayItem = ({ label, value }: any) => (
	<div className='col-md-6 col-sm-12 mb-3'>
		<div className='text-muted fw-medium mb-1 fs-6'>{label}</div>
		<div className='fw-semibold fs-6'>{value ?? '-'}</div>
	</div>
);

export const FundingResidentInfo = ({ residentData }: any) => {
	const fundDetails = residentData?.fundDetails || [];
	const {
		localAuthorityList = [],
		localICBList = [],
		fNCDetails,
		isLoading: isMasterLoading,
		isError: isMasterError,
	} = useMasterData();

	// Reverse to show newest first
	const displayList = [...fundDetails].reverse();

	const renderFundCard = (fundDetail: any, index: number, isActive = false) => {
		// Labels
		const fundSourceLabel = getLabelByValue(FUND_SOURCE_LIST, +fundDetail.fundSource);
		const fundTypeLabel = getLabelByValue(FUND_TYPE_LIST, +fundDetail.fundType);
		const fncStatusLabel = getLabelByValue(FNC_STATUS_LIST, +fundDetail.fncStatus);
		const incontLabel = getLabelByValue(INCONT_STATUS_LIST, +fundDetail.incontStatus);

		// Logic
		const isPrivate = +fundDetail.fundSource === FUND_SOURCE_TYPE.PRIVATE;
		const isLA = +fundDetail.fundSource === FUND_SOURCE_TYPE.LOCAL_AUTHORITY;
		const isCHC = +fundDetail.fundSource === FUND_SOURCE_TYPE.CHC;
		const isPartial = +fundDetail.fundType === FUND_TYPE.PARTIAL;

		const showFundType = !isPrivate;
		const showICB = isCHC;
		const showLA = isLA;
		const showClientContribution = isLA && isPartial;

		const isFNC = +fundDetail.fncStatus === FNC_STATUS_TYPE.YES;

		const showFamilyTopup = (isLA && isPartial) || (isCHC && isPartial);

		const showThirdPartyTopup = isLA && isPartial;

		const showIncont = +fundDetail.fncStatus === FNC_STATUS_TYPE.YES;

		const isJointFunding = +fundDetail.fundSource === FUND_SOURCE_TYPE.JOINT_FUNDNG;

		const activeIncont = getActiveIncontDetailsDetails(fundDetail?.incontDetails);

		const shortName =
			+fundDetail.fundSource !== FUND_SOURCE_TYPE.PRIVATE
				? getActiveFundDetailsByLAOrICB(fundDetail, localAuthorityList, localICBList)
						?.shortName
				: '';

		let jointFundShortName = '';
		if (isJointFunding) {
			const { la, icb } = getActiveFundDetailsByJointFund(
				fundDetail,
				localAuthorityList,
				localICBList,
			);

			jointFundShortName = `${la?.shortName || ''} & ${icb?.shortName || ''}`;
		}

		return (
			<Card
				key={index}
				className={`shadow-sm mb-3 ${isActive ? 'border-success border-2' : ''}`}>
				<CardHeader className='pb-2 pt-3'>
					<div className='d-flex justify-content-between align-items-center flex-wrap w-100'>
						<div className='flex-grow-1'>
							<h6 className='fw-semibold mb-1 text-primary fs-6'>
								{isActive
									? 'Current Active Fund Source'
									: `Fund Source #${index + 1}`}
							</h6>
							<div className='text-muted fw-medium fs-6'>
								{fundSourceLabel || 'N/A'}{' '}
								{isJointFunding
									? '- ' + jointFundShortName
									: shortName && '- ' + shortName}
							</div>
						</div>

						<div className='d-flex align-items-center gap-2 mt-2 mt-md-0'>
							{isActive && (
								<Badge color='success' isLight className='px-3 py-2 fs-6'>
									Active
								</Badge>
							)}
						</div>
					</div>
				</CardHeader>

				<CardBody>
					<div className='row'>
						<DisplayItem
							label='Start Date'
							value={
								fundDetail.sDate
									? moment(fundDetail.sDate).format('DD MMM YYYY')
									: '-'
							}
						/>

						<DisplayItem
							label='End Date'
							value={
								fundDetail.eDate
									? moment(fundDetail.eDate).format('DD MMM YYYY')
									: '-'
							}
						/>
						{/* <DisplayItem
							label='Client Id'
							value={fundDetail?.clientId || (isCHC ? fundDetail?.icbClientId : '-')}
						/> */}

						{/* LA / ICB / Joint Client Id */}
						{(isLA || isCHC || isJointFunding) && (
							<>
								{/* LA Client Id */}
								{(isLA || isJointFunding) && (
									<DisplayItem
										label='LA Client Id'
										value={fundDetail?.clientId || '-'}
									/>
								)}

								{/* ICB / FNC Client Id */}
								{(isCHC || isJointFunding) && (
									<DisplayItem
										label='ICB Client Id'
										value={fundDetail?.icbClientId || '-'}
									/>
								)}
							</>
						)}

						{isJointFunding && (
							<>
								<DisplayItem
									label='Joint Fund La Price'
									value={fundDetail?.jfLaRoomPrice || '-'}
								/>
								<DisplayItem
									label='Joint Fund ICB Price'
									value={fundDetail?.jfIcbRoomPrice || '-'}
								/>
							</>
						)}

						{showFundType && (
							<DisplayItem label='Fund Type' value={fundTypeLabel || '-'} />
						)}

						{showClientContribution && (
							<>
								<DisplayItem
									label='Client Contribution'
									value={
										fundDetail?.clientContribution
											? priceFormat(fundDetail.clientContribution)
											: '-'
									}
								/>

								<DisplayItem
									label='Client Contribution Start Date'
									value={
										fundDetail.clientContributionSdate
											? moment(fundDetail.clientContributionSdate).format(
													'DD MMM YYYY',
												)
											: '-'
									}
								/>
							</>
						)}

						{showFamilyTopup &&
							+fundDetail.familyTopupStatus ===
								FAMILY_OR_THIRD_PARTY_TOPUP_STATUS.YES && (
								<>
									<DisplayItem
										label='Family Top-up Effective Date'
										value={
											fundDetail.familyTopupEffectiveDate
												? moment(
														fundDetail.familyTopupEffectiveDate,
													).format('DD MMM YYYY')
												: '-'
										}
									/>
									<DisplayItem
										label='Family Top-up Price'
										value={
											fundDetail?.familyTopupPrice
												? priceFormat(fundDetail.familyTopupPrice)
												: '-'
										}
									/>
								</>
							)}

						{showThirdPartyTopup &&
							+fundDetail.thirdPartyTopupStatus ===
								FAMILY_OR_THIRD_PARTY_TOPUP_STATUS.YES && (
								<>
									<DisplayItem
										label='Third Party Top-up Effective Date'
										value={
											fundDetail.thirdPartyTopupEffectiveDate
												? moment(
														fundDetail.thirdPartyTopupEffectiveDate,
													).format('DD MMM YYYY')
												: '-'
										}
									/>
									<DisplayItem
										label='Third Party Top-up Price'
										value={
											fundDetail?.thirdPartyTopupPrice
												? priceFormat(fundDetail.thirdPartyTopupPrice)
												: '-'
										}
									/>
								</>
							)}

						<DisplayItem label='FNC Status' value={fncStatusLabel || '-'} />

						{isFNC && (
							<>
								<DisplayItem
									label='FNC Start Date'
									value={
										fundDetail.fncSdate
											? moment(fundDetail.fncSdate).format('DD MMM YYYY')
											: '-'
									}
								/>
								<DisplayItem
									label='FNC Client Id'
									value={
										!isCHC && !isJointFunding ? fundDetail?.icbClientId : '-'
									}
								/>
							</>
						)}

						{showIncont && (
							<DisplayItem label='INCONT Status' value={incontLabel || '-'} />
						)}
					</div>

					{showIncont && activeIncont && (
						<div className='mt-3'>
							<h6 className='fw-bold text-muted'>Incont Details</h6>

							<div className='row border p-2 rounded mb-2'>
								<DisplayItem
									label='Per Week'
									value={priceFormat(activeIncont.perWeek)}
								/>

								<DisplayItem
									label='Start'
									value={
										activeIncont.sDate
											? moment(activeIncont.sDate).format('DD MMM YYYY')
											: '-'
									}
								/>

								<DisplayItem
									label='End'
									value={
										activeIncont.eDate
											? moment(activeIncont.eDate).format('DD MMM YYYY')
											: '-'
									}
								/>
							</div>
						</div>
					)}
				</CardBody>
			</Card>
		);
	};

	return (
		<div>
			<Card className='shadow-3d-primary mb-4'>
				<CardBody>
					<CardLabel>
						<CardTitle tag='h5' className='mb-0 text-primary fw-semibold'>
							Funding Details
						</CardTitle>
						<CardSubTitle className='text-muted'>Resident funding</CardSubTitle>
					</CardLabel>
				</CardBody>
			</Card>

			{displayList.map((fund: any, i: number) => renderFundCard(fund, i, i === 0))}
		</div>
	);
};

export default FundingResidentInfo;
