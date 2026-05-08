import React, { useContext, useEffect, useMemo, useState } from 'react';
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
	Card,
	CardActions,
	CardBody,
	CardHeader,
	CardLabel,
	CardTitle,
	Input,
	Spinner,
} from '../../../components/bootstrap';
import PurchaseOrderForm from './components/purchaseOrderForm';
import PurchaseOrderList from './components/purchaseOrderList';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '../../../common/constant';
import { deletePurchaseOrder, getAllPurchaseOrders } from '../../../common/api/purchaseOrder';
import { IPurchaseOrderModal } from '../../../common/interface/purchaseOrder';
import { purchaseorderModal } from '../../../common/model/purchaseorder';
import { useRemoveItemQueryListById, useSearch } from '../../../hooks';
import { showAlert } from '../../../helpers/alerts';
import { PurchaseOrderDetailViewModal } from './components/purchaseOrderBillModal';
import { getAllVendors } from '../../../common/api/vendor';
import { getColorNameWithIndex } from '../../../common/data/enumColors';
import BulkPurchaseOrder from './components/bulkPurchaseOrder';
import { useNavigate } from 'react-router-dom';
import { getAllProduct } from '../../../common/api/product';
import PurchaseOrderReports from './components/purchaseOrderReports';
const PurchaseOrder: React.FC = () => {
	const [isPurchaseOrderFormOpen, setIsPurchaseOrderFormOpen] = useState(false);
	const [isReportsOpen, setIsReportsOpen] = useState(false);


	const navigate = useNavigate();

	const [purchaseOrderEditData, setPurchaseOrderEditData] = useState<IPurchaseOrderModal>({
		...purchaseorderModal,
	});

	const { data: purchaseOrderList = [], isLoading: isPurchaseOrderListLoading } = useQuery({
		queryKey: [QUERY_KEY.PURCHASE_ORDER],
		queryFn: getAllPurchaseOrders,
		staleTime:5 * 60 * 1000,
	});

	const { data: vendorList = [] } = useQuery({
		queryKey: [QUERY_KEY.VENDOR_LIST],
		queryFn: getAllVendors,
		staleTime: 5 * 60 * 1000,
	});

	const { data: productList = [] } = useQuery({
		queryKey: [QUERY_KEY.PRODUCT_LIST],
		queryFn: () => getAllProduct(),
		staleTime: 5 * 60 * 1000,
	});

	const { removeItemById: removePurchaseOrder } = useRemoveItemQueryListById<any>({
		queryKey: [QUERY_KEY.PURCHASE_ORDER],
	});

	const togglePurchaseOrderForm = () => {
		setIsPurchaseOrderFormOpen(!isPurchaseOrderFormOpen);
		setPurchaseOrderEditData({ ...purchaseorderModal });
	};

	const handleDeletePurchaseOrder = async (item: any) => {
		const id = item?.id;
		if (!id) return;

		showAlert({
			title: 'Are you sure?',
			text: "You won't be able to revert this!",
			icon: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Yes, delete it!',
			cancelButtonText: 'Cancel',

			onConfirm: async () => {
				try {
					await deletePurchaseOrder(id);
					removePurchaseOrder(id);
				} catch (e) {
					console.error(e);
				}
			},
		});
	};

	const handleEditPurchaseOrder = (item: IPurchaseOrderModal) => {
		setPurchaseOrderEditData(item);
		setIsPurchaseOrderFormOpen(true);
	};

	const modifiedPurchaseOrderList = useMemo(() => {
		const vendorMap = new Map(
			vendorList.map((v: any) => [
				v.id,
				{
					name: v.name,
					email: v.emailId,
				},
			]),
		);

		return purchaseOrderList.map((purchaseOrder: any, index: number) => {
			const vendor = vendorMap.get(purchaseOrder.vendorId);
			return {
				purchaseOrder,
				vendorName: vendor?.name || '-',
				vendorEmail: vendor?.email || '-',
				colorIndex: getColorNameWithIndex(index),
				totalPrice:purchaseOrder?.totalPrice,
				vatTotal:purchaseOrder?.vatTotal,
				code:purchaseOrder?.code,
			};
		});
	}, [purchaseOrderList, vendorList]);

	const {
		searchValue,
		setSearchValue,
		filteredList: filteredPurchaseOrder,
	} = useSearch(modifiedPurchaseOrderList || [], ['vendorName', 'code']);

	return (
		<PageWrapper title={'Purchase Orders'}>
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
						placeholder='Search Vendor,Code...'
						onChange={(e: any) => setSearchValue(e.target.value)}
						value={searchValue}
					/>
					<SubheaderSeparator />
				
					<SubHeaderRight>
						{/* <Button
                                icon='FilterAlt'
                                color='dark'
                                isLight
                                className='btn-only-icon position-relative'
                                aria-label='Filter'
                                onClick={() => setFilterOpen(!isFilterOpen)}>
                                {list?.length !== filteredOpeningBalance?.length && (
                                    <Popovers desc='Filtering applied' trigger='hover'>
                                        <span className='position-absolute top-0 start-100 translate-middle badge border border-light rounded-circle bg-danger p-2'>
                                            <span className='visually-hidden'>there is filtering</span>
                                        </span>
                                    </Popovers>
                                )}
                            </Button> */}
						{/* <SubheaderSeparator /> */}
						<Button
							color='info'
							icon='AddCircle'
							isLight
							onClick={() => togglePurchaseOrderForm()}>
							Add Purchase Order
						</Button>
						{/* <SubheaderSeparator /> */}
						<Button
							color='dark'
							icon='AddCircle'
							isLight
							onClick={() => navigate('/bulkPurchaseOrder')}>
							Bulk Purchase Order
						</Button>
						<Button
							color={isReportsOpen ? 'info' : 'dark'}
							icon='BarChart'
							isLight={!isReportsOpen}
							onClick={() => setIsReportsOpen((v) => !v)}>
							{isReportsOpen ? 'Hide Reports' : 'View Reports'}
						</Button>
					</SubHeaderRight>
				</SubHeaderLeft>
			</SubHeader>
			<Page container='fluid'>
				<div className='row'>
					<Card stretch>
						<CardHeader>
							<CardLabel>
								<CardTitle tag='div' className='h5'>
									Purchase Order List
								</CardTitle>
								<CardActions tag='div' className='text-muted'>
									Total records: {filteredPurchaseOrder.length || 0}
								</CardActions>
							</CardLabel>
						</CardHeader>

						<CardBody>
							{isPurchaseOrderListLoading ? (
								<div className='text-center py-5'>
									<Spinner color='info' size='3x' />
									<div className='mt-2'>Loading Purchasing Order...</div>
								</div>
							) : (
								<>
									<PurchaseOrderList
										purchaseOrderList={filteredPurchaseOrder}
										isLoading={isPurchaseOrderListLoading}
										onEdit={handleEditPurchaseOrder}
										onDelete={handleDeletePurchaseOrder}
										
									/>
								</>
							)}
						</CardBody>
					</Card>
				</div>

				<PurchaseOrderForm
					isOpen={isPurchaseOrderFormOpen}
					toggle={togglePurchaseOrderForm}
					purchaseOrderDataEdit={purchaseOrderEditData}
				/>

				{isReportsOpen && (
					<PurchaseOrderReports
						purchaseOrderList={purchaseOrderList}
						productList={productList}
						vendorList={vendorList}
					/>
				)}
			</Page>
		</PageWrapper>
	);
};

export default PurchaseOrder;
