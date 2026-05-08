import React, { useMemo, useState } from 'react';
import { Page, PageWrapper, SubHeader, SubHeaderLeft, SubHeaderRight } from '../../../layout';
import { Button, Card, CardTabItem } from '../../../components/bootstrap';
import { getUserMappedCompanyId } from '../../../helpers/helpers';
import { LaAndIcbList } from './component/laAndIcbList';
import { FUND_SOURCE_TYPE } from '../../../common/constant';
import { LaAndIcbForm } from './component/laAndIcbForm';
import { useUpdateQueryListById } from '../../../hooks';
import { ILaAndICBModel } from '../../../common/interface';

type TTabs = 'Local Authority' | 'ICB';

const TABS_CONFIG = [
	{
		id: FUND_SOURCE_TYPE.LOCAL_AUTHORITY,
		title: 'Local Authority',
		icon: 'homeWork',
	},
	{
		id: FUND_SOURCE_TYPE.CHC,
		title: 'ICB',
		icon: 'homeWork',
	},
] as const;

const LaAndIcbPage: React.FC = () => {
	const companyId = getUserMappedCompanyId()?.companyId;
	const [activeTab, setActiveTab] = useState(0);
	const [isOpenLaFormModule, setIsOpenLaFormModule] = useState(false);
	const [laEditObject, setLaEditObject] = useState<ILaAndICBModel | null>(null);
	const updateLocalICBList = useUpdateQueryListById<any>(['localICBList']);
	const updateLocalAuthorityList = useUpdateQueryListById<any>(['localAuthorityList']);

	const isFromICBTab = useMemo(() => {
		return TABS_CONFIG[activeTab].id === FUND_SOURCE_TYPE.CHC;
	}, [activeTab]);
	const handleOpenLaFromModule = () => {
		setLaEditObject(null);
		setIsOpenLaFormModule(true);
	};

	const handleCloseLaFromModule = () => {
		setIsOpenLaFormModule(false);
	};
	const handleCloseSuccessLa = (data: ILaAndICBModel) => {
		updateQueryList(data);
		setLaEditObject(null);
		setIsOpenLaFormModule(false);
	};
	const updateQueryList = (data: ILaAndICBModel) => {
		isFromICBTab ? updateLocalICBList(data) : updateLocalAuthorityList(data);
	};
	const handleOpenEditModalLaFrom = (editObject: ILaAndICBModel) => {
		setLaEditObject(editObject);
		setIsOpenLaFormModule(true);
	};

	return (
		<PageWrapper title='LA/ICB'>
			<SubHeader>
				<SubHeaderLeft>
					<div className='my-2'>
						<div className='h3 mb-0 fw-bold'>Name of the LA / ICB</div>
					</div>
				</SubHeaderLeft>

				<SubHeaderRight>
					<Button color='info' isLight icon='AddCircle' onClick={handleOpenLaFromModule}>
						Add New {isFromICBTab ? 'ICB' : 'LA'}
					</Button>
				</SubHeaderRight>
			</SubHeader>

			<Page container='fluid'>
				<Card hasTab className='h-100' onTabChange={setActiveTab}>
					{TABS_CONFIG.map((tab) => (
						<CardTabItem key={tab.id} id={tab.id} title={tab.title} icon={tab.icon}>
							<LaAndIcbList
								isFromICBTab={isFromICBTab}
								onEdit={handleOpenEditModalLaFrom}
								updateQueryList={updateQueryList}
							/>
						</CardTabItem>
					))}
				</Card>

				<LaAndIcbForm
					toggle={handleCloseLaFromModule}
					onCloseSuccess={handleCloseSuccessLa}
					isOpen={isOpenLaFormModule}
					laEditObject={laEditObject}
					isFromICBTab={isFromICBTab}
					companyId={companyId}
				/>


			</Page>
		</PageWrapper>
	);
};

export default LaAndIcbPage;
