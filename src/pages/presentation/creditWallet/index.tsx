import React, { useContext, useEffect, useState } from 'react';
import {
	SubHeaderLeft,
	SubheaderSeparator,
	SubHeader,
	Page,
	PageWrapper,
	SubHeaderRight,
} from '../../../layout';
import Icon from '../../../components/icon';
import {
	Button,
	Input,
	Card,
	CardBody,
	CardHeader,
	CardLabel,
	CardTitle,
	CardTabItem,
} from '../../../components/bootstrap';

import { AdvanceCreditForm, CreditWalletListByCompanyIdCard } from './component';
import { CREDIT_TYPE } from '../../../common/constant';
import { useSearch } from '../../../hooks';

const CreditWalletPage = () => {
	const [isOpenAddAdvanceModel, setIsOpenAddAdvanceModel] = useState(false);

	const handleOpenCreateAdvanceModal = () => {
		setIsOpenAddAdvanceModel((prev) => !prev);
	};
	const [searchValue, setSearchValue] = useState<string>('');

	return (
		<PageWrapper title={'Credit Wallet'}>
			<SubHeader>
				<SubHeaderLeft>
					<label
						className='border-0 bg-transparent cursor-pointer me-0'
						htmlFor='searchInput'>
						<Icon icon='Search' size='2x' color='primary' />
					</label>
					<Input
						id='searchInput'
						type='search'
						className='border-0 shadow-none bg-transparent'
						placeholder='Search Credit Wallet Code,Resident Name...'
						onChange={(e: any) => setSearchValue(e.target.value)}
						value={searchValue}
					/>
					{/* <SubheaderSeparator /> */}
					<SubheaderSeparator />
				</SubHeaderLeft>
				<SubHeaderRight>
					<Button
						color='info'
						isLight
						// onClick={() => navigate('/rooms/create')}
						onClick={handleOpenCreateAdvanceModal}
						icon='AddCircle'>
						Add Payment
					</Button>
				</SubHeaderRight>
			</SubHeader>
			<Page container='fluid'>
				{/* <CreditWalletListByCompanyIdCard activeTab={CREDIT_TYPE.ADVANCE_CREDIT} /> */}
				<Card hasTab tabButtonColor='primary'>
					{/* --- Tab 1: ALL --- */}
					<CardTabItem id='all' title='ALL' icon='AccountBalanceWallet'>
						<CreditWalletListByCompanyIdCard
							activeTab='ALL'
							searchValue={searchValue}
						/>
					</CardTabItem>

					{/* --- Tab 2: ADVANCE CREDIT --- */}
					<CardTabItem id='advance' title='Payment' icon='CreditCard'>
						<CreditWalletListByCompanyIdCard
							activeTab={CREDIT_TYPE.ADVANCE_CREDIT}
							searchValue={searchValue}
						/>
					</CardTabItem>

					{/* --- Tab 3: ADJUSTMENT CREDIT --- */}
					<CardTabItem id='adjustment' title='Credit Note' icon='CompareArrows'>
						<CreditWalletListByCompanyIdCard
							activeTab={CREDIT_TYPE.ADJUSTMENT_CREDIT}
							searchValue={searchValue}
						/>
					</CardTabItem>
					<CardTabItem
						id='vatAdjustment'
						title='VAT ADJUSTMENT CREDIT'
						icon='CompareArrows'>
						<CreditWalletListByCompanyIdCard
							activeTab={CREDIT_TYPE.VAT_ADJUSTMENT_CREDIT}
							searchValue={searchValue}
						/>
					</CardTabItem>
					<CardTabItem
						id='openingBalance'
						title='OPENING BALANCE CREDIT'
						icon='CompareArrows'>
						<CreditWalletListByCompanyIdCard
							activeTab={CREDIT_TYPE.OPENING_BALANCE_CREDIT}
							searchValue={searchValue}
						/>
					</CardTabItem>
				</Card>

				<AdvanceCreditForm
					isOpen={isOpenAddAdvanceModel}
					toggle={handleOpenCreateAdvanceModal}
				/>
			</Page>
		</PageWrapper>
	);
};

export default CreditWalletPage;
