import React, { useEffect, useMemo, useState } from 'react';
import {
	Button,
	Modal,
	ModalBody,
	ModalHeader,
	ModalTitle,
	Spinner,
} from '../../../../../../components/bootstrap';
import {
	getAllVendorsAcrossCompanies,
	importVendorToCurrentCompany,
} from '../../../../../../common/api/vendor';

interface VendorImportModalProps {
	isOpen: boolean;
	toggle: () => void;
	currentCompanyId: string;
	allCompanyIds: string[];
	allCompanyList: any[];
	existingVendorList: any[];
	onImport: (vendor: any) => void;
}

const VendorImportModal: React.FC<VendorImportModalProps> = ({
	isOpen,
	toggle,
	currentCompanyId,
	allCompanyIds,
	allCompanyList,
	existingVendorList,
	onImport,
}) => {
	const [crossVendors, setCrossVendors] = useState<any[]>([]);
	const [isFetching, setIsFetching] = useState(false);
	const [importingId, setImportingId] = useState<string | null>(null);
	const [search, setSearch] = useState('');

	// Quick lookups
	const companyNameMap = useMemo(
		() => new Map(allCompanyList.map((c: any) => [c.id, c.name || c.companyName || c.id])),
		[allCompanyList],
	);

	const existingTradeNames = useMemo(
		() => new Set(existingVendorList.map((v: any) => v.tradeName?.toLowerCase().trim())),
		[existingVendorList],
	);
	const existingImportedIds = useMemo(
		() => new Set(existingVendorList.map((v: any) => v.importedFromVendorId).filter(Boolean)),
		[existingVendorList],
	);

	useEffect(() => {
		if (!isOpen) return;

		const otherIds = allCompanyIds.filter((id) => id !== currentCompanyId);
		if (otherIds.length === 0) {
			setCrossVendors([]);
			return;
		}

		setIsFetching(true);
		setCrossVendors([]);
		setSearch('');

		getAllVendorsAcrossCompanies(otherIds)
			.then((vendors) => {
				// Filter out already imported or trade-name duplicates
				const filtered = vendors.filter((v) => {
					if (existingImportedIds.has(v.id)) return false;
					if (existingTradeNames.has(v.tradeName?.toLowerCase().trim())) return false;
					return true;
				});
				setCrossVendors(filtered);
			})
			.catch(console.error)
			.finally(() => setIsFetching(false));
	}, [isOpen]);

	const filteredList = useMemo(() => {
		const q = search.toLowerCase().trim();
		if (!q) return crossVendors;
		return crossVendors.filter(
			(v) =>
				v.name?.toLowerCase().includes(q) ||
				v.tradeName?.toLowerCase().includes(q) ||
				companyNameMap.get(v.companyId)?.toLowerCase().includes(q),
		);
	}, [crossVendors, search, companyNameMap]);

	const handleImport = async (vendor: any) => {
		setImportingId(vendor.id);
		try {
			const imported = await importVendorToCurrentCompany(vendor, currentCompanyId);
			onImport(imported);
		} catch (err) {
			console.error('Import failed:', err);
		} finally {
			setImportingId(null);
		}
	};

	const primaryEmail = (v: any) =>
		v.emails?.find((e: any) => e.isPrimary)?.email || v.emailId || '—';

	return (
		<Modal isOpen={isOpen} setIsOpen={toggle} isCentered size='lg'>
			<ModalHeader setIsOpen={toggle}>
				<ModalTitle id='vendorImportTitle'>Import Vendor from Another Home</ModalTitle>
			</ModalHeader>

			<ModalBody>
				{isFetching ? (
					<div className='text-center py-5'>
						<Spinner color='info' size='2x' />
						<div className='mt-2 text-muted small'>
							Loading vendors from other homes…
						</div>
					</div>
				) : (
					<>
						{/* Search */}
						<div className='mb-3'>
							<input
								type='search'
								className='form-control form-control-sm'
								placeholder='Search by name, trade name or home…'
								value={search}
								onChange={(e) => setSearch(e.target.value)}
							/>
						</div>

						{filteredList.length === 0 ? (
							<p className='text-muted text-center py-3 mb-0'>
								{crossVendors.length === 0
									? 'No vendors available to import from other homes.'
									: 'No vendors match your search.'}
							</p>
						) : (
							<div className='table-responsive'>
								<table className='table table-sm table-hover align-middle mb-0'>
									<thead className='table-light'>
										<tr>
											<th>Vendor Name</th>
											<th>Trade Name</th>
											<th>Home</th>
											<th>Primary Email</th>
											<th></th>
										</tr>
									</thead>
									<tbody>
										{filteredList.map((v) => (
											<tr key={v.id}>
												<td className='fw-semibold'>{v.name || '—'}</td>
												<td>{v.tradeName || '—'}</td>
												<td>
													<span className='badge bg-secondary'>
														{companyNameMap.get(v.companyId) ||
															v.companyId}
													</span>
												</td>
												<td className='text-muted small'>
													{primaryEmail(v)}
												</td>
												<td>
													<Button
														color='info'
														size='sm'
														isLight
														isDisable={importingId !== null}
														isLoading={importingId === v.id}
														onClick={() => handleImport(v)}>
														Import
													</Button>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
					</>
				)}
			</ModalBody>
		</Modal>
	);
};

export default VendorImportModal;
