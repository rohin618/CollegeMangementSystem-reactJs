// src/pages/product/components/ProductList.tsx
import React, { useMemo } from 'react';
import useDarkMode from '../../../../../../hooks/useDarkMode';
import { getColorNameWithIndex } from '../../../../../../common/data/enumColors';
import {
	getColorByValue,
	getFirstLetter,
	getLabelByValue,
} from '../../../../../../helpers/helpers';
import {
	Badge,
	Button,
	Dropdown,
	DropdownItem,
	DropdownMenu,
	DropdownToggle,
	Popovers,
} from '../../../../../../components/bootstrap';
import { DataTable } from '../../../../../../components/common';
import { PRODUCT_STATUS_LIST } from '../../../../../../common/data/option';
import { PRODUCT_STATUS } from '../../../../../../common/constant';
import { IUnitOfMeasurementModal } from '../../../../../../common/interface/unitOfMeasurement';
import { useMasterData } from '../../../../../../contexts/mastersContext';

type Props = {
	productList: any[];
	onEdit: (item: any) => void;
	onDelete: (item: any) => void;
	isLoading: boolean;
	handleToggleProductStatus: (product: any) => void;
	productCategoryList: any[];
	unitOfMeasurementList: any[];
	vendorList:any[];
};

const ProductList: React.FC<Props> = ({
	productList,
	onEdit,
	onDelete,
	isLoading,
	handleToggleProductStatus,
	productCategoryList,
	unitOfMeasurementList,
	vendorList,
}) => {
	const { darkModeStatus } = useDarkMode();

	const { vatList, isLoading: isVatLoading, isError: isVatError } = useMasterData();

	// prepare table data
	const productTableData = useMemo(() => {
		const productCategoryMap = new Map(
			productCategoryList.map((category: any) => [category.id, category.name]),
		);
		const UomMap = new Map(unitOfMeasurementList.map((uom: any) => [uom.id, uom.name]));
		const vendorMap = new Map(vendorList.map((vendor: any) => [vendor.id, vendor.name]));

		return productList.map((item: any, index: number) => ({
			...item,
			productCategoryName: productCategoryMap.get(item.categoryId) || '-',
			id: item.id,
			colorIndex: getColorNameWithIndex(index),
			unitOfMeasurementName: UomMap.get(item?.unitOfMeasurementId) || '',
			vendorName: vendorMap.get(item?.vendorId) || '',
		}));
	}, [productList, productCategoryList]);

	const removeUnncessaryKeys = (row: any) => {
		const {unitOfMeasurementName, productCategoryName,vendorName, colorIndex, ...cleanProduct } = row;
		return cleanProduct;
	};

	// table columns
	const productColumns = [
		{
			label: 'Product Name',
			key: 'name',
			sortable: true,
			render: (row: any) => (
				<div className='d-flex align-items-center'>
					<div className='flex-shrink-0'>
						<div className='ratio ratio-1x1 me-3' style={{ width: 48 }}>
							<div
								className={`bg-l${darkModeStatus ? 'o25' : '25'}-${row?.colorIndex}
                text-${row?.colorIndex} rounded-2 d-flex align-items-center justify-content-center`}>
								<span className='fw-bold'>{getFirstLetter(row?.name)}</span>
							</div>
						</div>
					</div>

					<div className='flex-grow-1'>
						<div className='fs-6 fw-bold'>{row?.name || 'NA'}</div>
						<small className='text-muted'>{row?.productCode || '-'}</small>
					</div>
				</div>
			),
		},

		{
			label: 'Category',
			key: 'productCategoryName',
			render: (row: any) => row?.productCategoryName || '-',
		},
		{
			label: 'Unit Of Measurement',
			key: 'unitOfMeasurementName',
			render: (row: any) => row?.unitOfMeasurementName || '-',
		},
		// {
		// 	label: 'Product Code',
		// 	key: 'productCode',
		// 	render: (row: any) => row?.productCode || '-',
		// },
		{
			label: 'VAT',
			key: 'vatId',
			render: (row: any) => {
				const vat = vatList?.find((v: any) => v.id === row.vatId);
				return vat?.rate !== undefined ? `${vat.rate}%` : '-';
			},
		},
			{
			label: 'Vendor',
			key: 'vendorName',
			render: (row: any) => row?.vendorName || '-',
		},
		{
			label: 'Description',
			key: 'description',
			render: (row: any) => {
				const fullDesc = row?.description || '';
				const shortDesc = fullDesc.length > 80 ? fullDesc.slice(0, 80) + '…' : fullDesc;

				return (
					<>
						<Popovers desc={fullDesc} trigger='hover'>
							<div style={{ textWrap: 'wrap' }}>{shortDesc}</div>
						</Popovers>
					</>
				);
			},
		},

		{
			label: 'Status',
			key: 'status',
			render: (row: any) => (
				<Badge
					isLight
					color={getColorByValue(PRODUCT_STATUS_LIST, row.status)}
					className='px-3 py-1 rounded-pill'>
					{getLabelByValue(PRODUCT_STATUS_LIST, row.status)}
				</Badge>
			),
		},

		{
			label: 'Actions',
			key: 'actions',
			render: (row: any) => (
				<Dropdown>
					<DropdownToggle hasIcon={false}>
						<Button icon='MoreHoriz' color='dark' isLight shadow='sm' />
					</DropdownToggle>

					<DropdownMenu>
						<DropdownItem>
							<Button
								size='sm'
								color='info'
								isLight
								icon='edit'
								onClick={() => onEdit(removeUnncessaryKeys(row))}>
								Edit
							</Button>
						</DropdownItem>

						<DropdownItem>
							<Button
								size='sm'
								color='danger'
								isLight
								icon='delete'
								onClick={() => onDelete(removeUnncessaryKeys(row))}>
								Delete
							</Button>
						</DropdownItem>

						<DropdownItem>
							<Button
								icon={
									+row.status === PRODUCT_STATUS.ACTIVE ? 'Block' : 'CheckCircle'
								}
								onClick={() =>
									handleToggleProductStatus(removeUnncessaryKeys(row))
								}>
								{+row.status === PRODUCT_STATUS.ACTIVE ? 'Deactivate' : 'Activate'}
							</Button>
						</DropdownItem>
					</DropdownMenu>
				</Dropdown>
			),
		},
	];

	return (
		<DataTable
			fixed
			columns={productColumns}
			data={productTableData}
			search={false}
			isLoading={isLoading}
			pagination={false}
			noDataFound={'No products found'}
		/>
	);
};

export default ProductList;
