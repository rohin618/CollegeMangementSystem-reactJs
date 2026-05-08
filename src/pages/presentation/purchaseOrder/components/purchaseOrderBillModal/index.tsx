import {
	Button,
	Modal,
	ModalBody,
	ModalHeader,
	ModalTitle,
	Popovers,
} from '../../../../../components/bootstrap';
import { useMemo, useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import { showAlert } from '../../../../../helpers/alerts';
import { getUserMappedCompany, getUserMappedCompanyId } from '../../../../../helpers/helpers';

// 🔥 Inline CSS (same approach as invoice)
import PurchaseBill from './purchaseBill';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '../../../../../common/constant';
import { getAllVendors } from '../../../../../common/api/vendor';
import { getAllProduct } from '../../../../../common/api/product';
import { useGetPrimaryBank } from '../../../../../hooks/useGetPrimaryBank';
import html2pdf from 'html2pdf.js';
import Icon from '../../../../../components/icon';

type Props = {
	isOpen: boolean;
	toggle: () => void;
	purchaseOrderData: any;
};

export const PurchaseOrderDetailViewModal: React.FC<Props> = ({
	isOpen = false,
	toggle,
	purchaseOrderData,
}) => {
	const { companyId } = getUserMappedCompanyId() || {};
	const { data: vendorList = [], isLoading: isVendorLoading } = useQuery({
		queryKey: [QUERY_KEY.VENDOR_LIST],
		queryFn: getAllVendors,
		staleTime: 5 * 60 * 1000,
	});

	const { data: productList = [], isLoading: isProductLoading } = useQuery({
		queryKey: [QUERY_KEY.PRODUCT_LIST],
		queryFn: () => getAllProduct(),
		staleTime: 5 * 60 * 1000,
	});

	const { data: primaryBankAcct } = useGetPrimaryBank(companyId);

	const [isLoading, setIsLoading] = useState(false);
	const sectionRef = useRef<HTMLDivElement>(null);

	const companyDetails = getUserMappedCompany();

	// 🖨 Print
	const handlePrint = useReactToPrint({
		contentRef: sectionRef,
		documentTitle: purchaseOrderData?.code || 'Purchase Order',
	});

	const { vendorInfo, productMap } = useMemo(() => {
		const vendorInfo = vendorList?.find((ven: any) => ven.id === purchaseOrderData?.vendorId);
		const productMap = new Map(productList?.map((p: any) => [p.id, p]));
		return { vendorInfo, productMap };
	}, [vendorList, productList, purchaseOrderData]);



	const handleDownloadPurchaseBill = async () => {
		try {
			if (!sectionRef.current) {
				return;
			}

			setIsLoading(true);

			const fileName = (purchaseOrderData?.code || 'purchase-bill') + '.pdf';

			const options: any = {
				filename: fileName,
				image: { type: 'jpeg', quality: 0.98 },
				html2canvas: {
					scale: 2,
					useCORS: true,
					logging: false,
				},
				jsPDF: {
					unit: 'mm',
					format: 'a4',
					orientation: 'portrait',
				},
			};

			await html2pdf().from(sectionRef.current).set(options).save();
		} catch (error) {
			console.error(error);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Modal
			setIsOpen={toggle}
			isOpen={isOpen}
			fullScreen
			titleId='purchase-bill-modal'
			isStaticBackdrop>
			<ModalHeader setIsOpen={toggle}>
				<ModalTitle id='purchase-bill-modal'>Purchase Order</ModalTitle>
				<div className='d-flex align-items-center gap-3 text-right ms-3'>
					<Popovers trigger='hover' title='Print'>
						<Button icon='Print' color='info' isLight onClick={handlePrint} />
					</Popovers>

					<Popovers trigger='hover' title='Download'>
						<Button
							color='info'
							isLight
							isDisable={isLoading}
							onClick={handleDownloadPurchaseBill}>
							{isLoading ? (
								<span className='spinner-border spinner-border-sm' />
							) : (
								<Icon icon='download' size='lg' />
							)}
						</Button>
					</Popovers>
				</div>
			</ModalHeader>

			<ModalBody>
				<div ref={sectionRef}>
					<PurchaseBill
						purchaseOrderData={purchaseOrderData}
						companyDetails={companyDetails}
						vendorInfo={vendorInfo}
						productMap={productMap}
						primaryBank={primaryBankAcct}
					/>
				</div>
			</ModalBody>
		</Modal>
	);
};
