import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
	SubHeaderLeft,
	SubHeader,
	SubHeaderRight,
	PageWrapper,
	SubheaderSeparator,
} from '../../../layout';

import {
	Button,
	Breadcrumb,
	Card,
	CardTabItem,
	CardHeader,
	CardBody,
	CardLabel,
	CardTitle,
	CardSubTitle,
} from '../../../components/bootstrap';

import Page from '../../../layout/Page';

import { pagesMenu } from '../../../menu';

import { useResidentDetailsById } from '../../../hooks';

import { ResidentInvoiceListCard, ResidentDocuments, ResidentStatement } from './component';

import { getActiveFundDetails } from '../../../helpers/helpers';

import { DATA_MIGRATION_TO_DATE, FUND_SOURCE_TYPE, RESIDENT_STATUS } from '../../../common/constant';
import { useMasterData } from '../../../contexts/mastersContext';
import { ResidentNameInfo } from './component/tabs/residentNameInfo/ResidentNameInfo';
import PersonalResidentInfo from './component/tabs/personalResidentInfo/PersonalResidentInfo';
import AdmissionResidentInfo from './component/tabs/admissionResidentInfo/AdmissionResidentInfo';
import RoomAndBedResidentInfo from './component/tabs/roomAndBedResidentInfo/RoomAndBedResidentInfo';
import { FundingResidentInfo } from './component/tabs/fundingResidentInfo/FundingResidentInfo';
import NOKResidentInfo from './component/tabs/NOKResidentInfo/NOKResidentInfo';
import BillingResidentInfo from './component/tabs/billingResidentInfo/BillingResidentInfo';
import RoomHistoryResidentInfo from './component/tabs/roomHistoryResidentInfo/RoomHistoryResidentInfo';
import { ResidentNotesInfo, ResidentPaymentHistory } from './component/tabs';
import moment from 'moment';

const ResidentDetailsPage = () => {
	const navigate = useNavigate();
	const { residentId }: any = useParams();

	const {
		vatList = [],
		localAuthorityList = [],
		localICBList = [],
		fNCDetails,
		bankList = [],
		isLoading: isMasterLoading,
	} = useMasterData();

	const {
		data: residentData,
		isLoading,
		refetch: residentGetDataFetch,
	}: any = useResidentDetailsById(residentId);

	const activeFundDetails = useMemo(() => {
		return getActiveFundDetails(residentData?.fundDetails);
	}, [residentData?.fundDetails]);

	// ✅ Handle loading state before rendering the page
	if (isLoading) {
		return (
			<PageWrapper title='Loading Resident Details...'>
				<h4 className='text-center py-5'>Loading...</h4>
			</PageWrapper>
		);
	}

	const handleEditResidentForm = () => {
		if(!residentData)return;

		const isMigration =
			+residentData.admission.residentStatus !== RESIDENT_STATUS.LIVING &&
			moment(residentData?.admission?.dateDischargeAndRip).isSameOrBefore(
				DATA_MIGRATION_TO_DATE,
			);
		if (!isMigration) {
			navigate(`/resident/edit/${residentId}`);
		} else {
			navigate(`/resident/fromResidentPage/${residentId}`);
		}
	};


	return (
		<PageWrapper title={`${residentData?.personal?.name} | Resident Details`}>
			<SubHeader>
				<SubHeaderLeft>
					<Breadcrumb
						list={[
							{
								title: pagesMenu.operations.subMenu.resident.text,
								to: `/${pagesMenu.operations.subMenu.resident.path}`,
							},
							{
								title: 'Details',
								to: `/${pagesMenu.operations.subMenu.resident.path}/create`,
							},
						]}
					/>
					<SubheaderSeparator />
					<span>
						Staying in room <strong>{residentData?.roomDetails?.roomNumber}</strong>,
						bed number <strong>{residentData?.bedDetails?.bedName}</strong>.
					</span>
				</SubHeaderLeft>

				<SubHeaderRight>
					<Button
						color='dark'
						isLight
						icon='Edit'
						// isDisable={!residentData}
						onClick={handleEditResidentForm}>
						Edit
					</Button>
					<Button color='info' isLight icon='save' onClick={residentGetDataFetch}>
						Refresh
					</Button>
				</SubHeaderRight>
			</SubHeader>

			<Page>
				<ResidentNameInfo residentData={residentData} />

				<Card hasTab tabButtonColor='info' className='mb-4'>
					<CardTabItem id='personal' title='Personal' icon='Person'>
						<PersonalResidentInfo residentData={residentData} />
					</CardTabItem>

					<CardTabItem id='admission' title='Admission' icon='Login'>
						<AdmissionResidentInfo
							fNCDetails={fNCDetails}
							localICBList={localICBList}
							localAuthorityList={localAuthorityList}
							residentData={residentData}
						/>
					</CardTabItem>

					<CardTabItem id='roomBed' title='Room & Bed' icon='Bed'>
						<RoomAndBedResidentInfo residentData={residentData} />
					</CardTabItem>

					<CardTabItem id='funding' title='£ Funding'>
						<FundingResidentInfo residentData={residentData} />
					</CardTabItem>

					<CardTabItem id='invoice' title='Invoice' icon='Receipt'>
						<ResidentInvoiceListCard
							residentGetDataFetch={residentGetDataFetch}
							fNCDetails={fNCDetails}
							localICBList={localICBList}
							localAuthorityList={localAuthorityList}
							residentData={residentData}
							bankList={bankList}
							vatList={vatList}
						/>
					</CardTabItem>
					<CardTabItem id='paymentHistory' title='Payment History' icon='Receipt'>
						<ResidentPaymentHistory
							residentGetDataFetch={residentGetDataFetch}
							fNCDetails={fNCDetails}
							localICBList={localICBList}
							localAuthorityList={localAuthorityList}
							residentData={residentData}
							vatList={vatList}
							bankList={bankList}
						/>
					</CardTabItem>

					<CardTabItem
						id='residentStatement'
						title='Resident Statement'
						icon='RoomPreferences'>
						<ResidentStatement
							fNCDetails={fNCDetails}
							localICBList={localICBList}
							localAuthorityList={localAuthorityList}
							residentData={residentData}
							vatList={vatList}
						/>
					</CardTabItem>
					<CardTabItem id='nextOfKin' title='Next of Kin' icon='FamilyRestroom'>
						<NOKResidentInfo residentData={residentData} />
					</CardTabItem>

					{+activeFundDetails?.fundSource === FUND_SOURCE_TYPE.PRIVATE ? (
						<CardTabItem id='billing' title='Billing' icon='AccountBalance'>
							<BillingResidentInfo residentData={residentData} />
						</CardTabItem>
					) : (
						''
					)}
					<CardTabItem id='roomHistory' title='RoomHistory' icon='RoomPreferences'>
						<RoomHistoryResidentInfo residentData={residentData} />
					</CardTabItem>
					<CardTabItem id='residentNotes' title='Resident Notes' icon='notes'>
						<><ResidentNotesInfo residentData={residentData}/></>
					</CardTabItem>
				</Card>

				<div className='row'>
					<div className='col-lg-12 h-100'>
						<ResidentDocuments residentData={residentData} />
					</div>
				</div>
			</Page>
		</PageWrapper>
	);
};

export default ResidentDetailsPage;
