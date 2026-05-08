import React, { useMemo } from 'react';
import PageWrapper from '../../../layout/PageWrapper/PageWrapper';
import SubHeader, {
	SubHeaderLeft,
	
} from '../../../layout/SubHeader';
import Page from '../../../layout/Page';

import {  ResidentCountCard, MissingResidentInvoiceInfoCard, MonthSalesInfo, YearlySalesInfo, RoomBedReportCard, FeesIncrementInfoCard, ResidentFollowupsInfo } from './components';
import { useQuery } from '@tanstack/react-query';
import { getAllResidentWithInvoice } from '../../../common/api/resident';
import {  RESIDENT_STATUS_TYPE } from '../../../common/constant';
import { useMasterData } from '../../../contexts/mastersContext';
import { BlockBedInfoCard } from './components/blockBedInfoCard';
import { DepositResidentInvoiceInfoCard } from './components/depositeInvoiceInfoCard';

const DashboardPage = () => {
	const { fNCDetails, isLoading: isMasterLoading }:any= useMasterData();


	const { data: residentListWithInvoice, isLoading, isError, error }: any = useQuery({
		queryKey: ['residentListWithInvoice'],
		queryFn: getAllResidentWithInvoice
	});



	const liveCounts = useMemo(() => {
		if (!residentListWithInvoice) {
			return {
				overAllResidentCount: 0,
				overAllResidentList: [],
				activeResidentCount: 0,
				activeResidentList: [],
				leftResidentCount: 0,
				leftResidentList: [],
				ripResidentCount: 0,
				ripResidentList: [],
			};
		}

		let activeResidentList: any[] = [];
		let leftResidentList: any[] = [];
		let ripResidentList: any[] = [];

		for (const resident of residentListWithInvoice) {
			const status = Number(resident.admission?.residentStatus);

			if (status === Number(RESIDENT_STATUS_TYPE.ACTIVE)) {
				activeResidentList.push(resident);
			} else if (status === Number(RESIDENT_STATUS_TYPE.LEFT)) {
				leftResidentList.push(resident);
			} else if (status === Number(RESIDENT_STATUS_TYPE.RIP)) {
				ripResidentList.push(resident);
			}
		}

		return {
			overAllResidentCount: residentListWithInvoice.length,
			overAllResidentList: residentListWithInvoice,
			activeResidentCount: activeResidentList.length,
			activeResidentList,
			leftResidentCount: leftResidentList.length,
			leftResidentList,
			ripResidentCount: ripResidentList.length,
			ripResidentList,
		};
	}, [residentListWithInvoice]);










	return (
		<PageWrapper title={'Dashboard'}>
			<SubHeader>
				<SubHeaderLeft>
					<span className='h4 mb-0 fw-bold'>Overview</span>
					{/* <SubheaderSeparator /> */}

				</SubHeaderLeft>

			</SubHeader>
			<Page container='fluid'>

				
				<div className='row mb-4'>

					<div className='col-12'>
						<RoomBedReportCard />

					</div>

				</div>
				<div className='row'>
					<div className='col-md-3'>
						<ResidentCountCard title='Over All Resident' residentList={liveCounts.overAllResidentList} count={liveCounts.overAllResidentCount} />
					</div>
					<div className='col-md-3'>
						<ResidentCountCard title='Active Resident' residentList={liveCounts.activeResidentList} count={liveCounts.activeResidentCount}  status={RESIDENT_STATUS_TYPE.ACTIVE}/>
					</div>
					<div className='col-md-3'>
						<ResidentCountCard title='Left Resident' residentList={liveCounts.leftResidentList} count={liveCounts.leftResidentCount} status={RESIDENT_STATUS_TYPE.LEFT}/>
					</div>
					<div className='col-md-3'>
						<ResidentCountCard title='RIP Resident' residentList={liveCounts.ripResidentList} count={liveCounts.ripResidentCount} status={RESIDENT_STATUS_TYPE.RIP}/>
					</div>

				</div>

				<div className='row'>
					<div className='col-md-8'>
						<MonthSalesInfo />
					</div>
					<div className='col-md-4'>
						<MissingResidentInvoiceInfoCard fNCDetails={fNCDetails} />
					</div>


				</div>

				<div className='row'>
					<div className='col-md-8'>
						<YearlySalesInfo />

					</div>
					<div className='col-md-4'>
						<FeesIncrementInfoCard residentInfo={residentListWithInvoice} />
						{/* <OverAllIncomeDetails activeTab='Yearly' /> */}
						{/* <MissingResidentInvoiceInfoCard fNCDetails={fNCDetails} /> */}
					</div>


				</div>
				<div className='row mb-4'>

					<div className='col-4'>
						<BlockBedInfoCard/>

					</div>
					<div className='col-4'>
						<ResidentFollowupsInfo residentInfo={residentListWithInvoice}/>

					</div>
					<div className='col-4'>
						<DepositResidentInvoiceInfoCard/>

					</div>

				</div>
				
			</Page>
		</PageWrapper>
	);
};

export default DashboardPage;
