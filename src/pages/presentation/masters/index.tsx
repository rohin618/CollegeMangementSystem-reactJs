import React, { useState } from 'react';
import { SubHeaderLeft, SubHeader, Page, PageWrapper } from '../../../layout';
import Icon from '../../../components/icon';
import { Card, CardTabItem, Input } from '../../../components/bootstrap';
import {
	BillingPattern,
	Discount,
	MiscellaneousServicesList,
	Product,
	ProductCategory,
	RelationshipList,
	UnitOfMeasurement,
	VatList,
} from './components';
import DueDateList from './components/dueDateList';
import VendorPage from './components/vendor';
import HeadOfficeAddress from './components/companyAddress';

const Masters = () => {
	const [onTabChange, setOnTabChange] = useState(0);
	const [search, setSearch] = useState();
	return (
		<PageWrapper title={'Masters'}>
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
						placeholder='Search by name...'
						onChange={(e: any) => setSearch(e.target.value)}
						value={search}
					/>
				</SubHeaderLeft>
			</SubHeader>
			<Page container='fluid'>
				<Card hasTab onTabChange={setOnTabChange}>
					<CardTabItem id='vat' title='VAT' icon='Receipt'>
						<VatList search={search} />
					</CardTabItem>
					<CardTabItem
						id='miscellaneousServices'
						title='Miscellaneous Services'
						icon='HolidayVillage'>
						<MiscellaneousServicesList search={search} />
					</CardTabItem>
					<CardTabItem id='profile2' title='Due Date' icon='DateRange'>
						<>
							<DueDateList search={search} />
						</>
					</CardTabItem>
					<CardTabItem id='profile2' title='Billing Pattern' icon='Calculate'>
						<>
							<BillingPattern search={search} />
						</>
					</CardTabItem>
					<CardTabItem id='relationship' title='Relationship' icon='PersonAddAlt'>
						<>
							<RelationshipList search={search} />
						</>
					</CardTabItem>
					<CardTabItem id='vendor' title='Vendor' icon='Storefront'>
						<>
							<VendorPage search={search} />
						</>
					</CardTabItem>
					<CardTabItem id='productCategory' title='Product Category' icon='Category'>
						<>
							<ProductCategory search={search} />
						</>
					</CardTabItem>
					<CardTabItem id='product' title='Product' icon='Inventory2'>
						<>
							<Product search={search} />
						</>
					</CardTabItem>
					<CardTabItem
						id='unitOfMeasurement'
						title='Unit Of Measurement'
						icon='Inventory2'>
						<>
							<UnitOfMeasurement search={search} />
						</>
					</CardTabItem>
					<CardTabItem id='companyAddress' title='Head Office Address' icon='LocationOn'>
						<>
							<HeadOfficeAddress search={search} />
						</>
					</CardTabItem>
					<CardTabItem id='promotions' title='Promotions' icon='LocalOffer'>
						<Discount search={search} />
					</CardTabItem>
				</Card>
			</Page>
		</PageWrapper>
	);
};

export default Masters;
