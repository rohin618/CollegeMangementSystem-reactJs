import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
	Page,
	PageWrapper,
	SubHeader,
	SubHeaderLeft,
	SubHeaderRight,
	SubheaderSeparator,
} from '../../../layout';
import { useSearch } from '../../../hooks';
import Icon from '../../../components/icon';
import { Button, Input, Popovers } from '../../../components/bootstrap';

// 👉 API
import { getAllDebitNotes } from '../../../common/api/debitNote';
import { QUERY_KEY } from '../../../common/constant';
import { getAllVendors } from '../../../common/api/vendor';
import { useMapById } from '../../../hooks/useMapById';
import { getAllPurchaseOrders } from '../../../common/api/purchaseOrder';
import DebitNoteList from './components/debitNoteList';

const DebitNotePage = () => {
	const [isFilterOpen, setFilterOpen] = useState<boolean>(false);
	const [filterDataSize, setFilterDataSize] = useState(0);
	const [isOpenAddDebitModel, setIsOpenAddDebitModel] = useState(false);

	// ✅ React Query
	const {
		data: debitNotesList = [],
		isLoading,
		isError,
		refetch,
	} = useQuery({
		queryKey: [QUERY_KEY.DEBIT_NOTE],
		queryFn: getAllDebitNotes,
		staleTime: 5 * 60 * 1000,
		retry: 1,
	});
	const { data: vendorList = [], isLoading: isVendorLoading } = useQuery({
		queryKey: [QUERY_KEY.VENDOR_LIST],
		queryFn: getAllVendors,
		staleTime: 5 * 60 * 1000,
	});
	const { data: purchaseOrderList = [], isLoading: isPurchaseOrderList } = useQuery({
		queryKey: [QUERY_KEY.PURCHASE_ORDER],
		queryFn: () => getAllPurchaseOrders(),
		staleTime: 5 * 60 * 1000,
	});

	const vendorMapById = useMapById<any>(vendorList);
	const purchaseOrderMapById = useMapById<any>(purchaseOrderList);

	// ✅ (Optional) filtering like credit page
	const enrichedDebitList = useMemo(() => {
		return debitNotesList.map((debitNote: any) => ({
			debitNote,
			vendorName: vendorMapById[debitNote.vendorId]?.name || '',
		}));
	}, [debitNotesList, vendorMapById]);

	// ✅ Search hook
	const {
		searchValue,
		setSearchValue,
		filteredList: debitNotesFilteredData,
	} = useSearch(enrichedDebitList as any[], [
		'vendorName', // adjust if needed
	]);
	const groupByVendor = (list: any[]) => {
		const map: Record<string, any> = {};

		list.forEach((note) => {
			const debitNote = note.debitNote;
			const vendorId = debitNote.vendorId || 'unknown';

			if (!map[vendorId]) {
				map[vendorId] = {
					vendorId,
					debitNotes: [],
				};
			}

			map[vendorId].debitNotes.push(debitNote);
		});

		return Object.values(map);
	};
	const groupedDebitNotes = useMemo(() => {
		return groupByVendor(debitNotesFilteredData).filter(
			(group: any) => group.debitNotes?.length > 0,
		);
	}, [debitNotesFilteredData]);

	return (
		<PageWrapper>
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
						placeholder='Search by Vendor Name...'
						onChange={(e: any) => setSearchValue(e.target.value)}
						value={searchValue}
					/>

					<SubheaderSeparator />
				</SubHeaderLeft>

				<SubHeaderRight>
					<Button
						icon='FilterAlt'
						color='dark'
						isLight
						className='btn-only-icon position-relative'
						aria-label='Filter'
						onClick={() => setFilterOpen(!isFilterOpen)}>
						{debitNotesFilteredData.length !== enrichedDebitList.length && (
							<Popovers desc='Filtering applied' trigger='hover'>
								<span className='position-absolute top-0 start-100 translate-middle badge border border-light rounded-circle bg-danger p-2'>
									<span className='visually-hidden'>filter active</span>
								</span>
							</Popovers>
						)}
					</Button>

				</SubHeaderRight>
			</SubHeader>

			<Page container='fluid'>
				<div>
					<DebitNoteList
						groupedDebitNotes={groupedDebitNotes}
						isLoading={isLoading}
						vendorMapById={vendorMapById}
						purchaseOrderMapById={purchaseOrderMapById}
					/>

					{/* <DebitNotesForm
						isOpen={isOpenAddDebitModel}
						toggle={() => setIsOpenAddDebitModel(false)}
					/> */}
				</div>
			</Page>
		</PageWrapper>
	);
};

export default DebitNotePage;
