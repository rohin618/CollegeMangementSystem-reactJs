// src/pages/productCategory/components/ProductCategoryList.tsx
import React, { useMemo, useState } from 'react';
import {
	Button,
	Spinner,
	Dropdown,
	DropdownToggle,
	DropdownMenu,
	DropdownItem,
} from '../../../../../../components/bootstrap';
import useDarkMode from '../../../../../../hooks/useDarkMode';
import { getColorNameWithIndex } from '../../../../../../common/data/enumColors';
import { getFirstLetter } from '../../../../../../helpers/helpers';
import { PRODUCT_CATEGORY_STATUS } from '../../../../../../common/constant';

interface ProductCategoryListProps {
	productCategoryList: any[];
	onEdit: (item: any) => void;
	onDelete: (item: any) => void;
	isLoading: boolean;
	handleToggleProductStatus: (category: any) => void;
}

const ProductCategoryList: React.FC<ProductCategoryListProps> = ({
	productCategoryList,
	onEdit,
	onDelete,
	isLoading,
	handleToggleProductStatus,
}) => {
	const { darkModeStatus } = useDarkMode();

	const activeCategories = useMemo(() => {
		return productCategoryList || [];
	}, [productCategoryList]);

	return (
		<div className='row justify-content-center'>
			<div className='col-10'>
				{/* Loader */}
				{isLoading && (
					<div className='text-center py-5'>
						<Spinner color='primary' size='lg' />
					</div>
				)}

				{/* Empty State */}
				{!isLoading && activeCategories.length === 0 && (
					<div className='text-center text-muted py-4'>No Product Category found.</div>
				)}

				{/* List */}
				{!isLoading &&
					activeCategories.map((category: any, i: number) => {
						const colorIndex = getColorNameWithIndex(i);

						return (
							<div
								key={category.id}
								className='row mb-4 border-bottom pb-2 align-items-center'>
								{/* Left: Avatar + Text */}
								<div className='col d-flex align-items-center'>
									<div className='flex-shrink-0'>
										<div className='ratio ratio-1x1 me-3' style={{ width: 48 }}>
											<div
												className={`bg-l${darkModeStatus ? 'o25' : '25'}-${colorIndex}
                            text-${colorIndex} rounded-2 d-flex align-items-center justify-content-center`}>
												<span className='fw-bold'>
													{getFirstLetter(category?.name)}
												</span>
											</div>
										</div>
									</div>

									<div className='flex-grow-1'>
										<div className='fs-6 fw-semibold'>
											{category?.name || 'NA'}
										</div>
										<div className='text-muted'>
											<small>Category Code: {category?.code || '-'}</small>
										</div>
									</div>
								</div>

								{/* Right: Actions */}
								<div className='col-auto text-end'>
									<Dropdown>
										<DropdownToggle hasIcon={false}>
											<Button
												icon='MoreHoriz'
												color='dark'
												isLight
												shadow='sm'
											/>
										</DropdownToggle>

										<DropdownMenu isAlignmentEnd>
											<DropdownItem>
												<Button
													icon='Edit'
													onClick={() => onEdit(category)}>
													Edit
												</Button>
											</DropdownItem>

											<DropdownItem isDivider />

											<DropdownItem>
												<Button
													icon='Delete'
													onClick={() => onDelete(category)}>
													Delete
												</Button>
											</DropdownItem>

											<DropdownItem>
												<Button
													icon={
														+category.status ===
														PRODUCT_CATEGORY_STATUS.ACTIVE
															? 'Block'
															: 'CheckCircle'
													}
													onClick={() =>
														handleToggleProductStatus(category)
													}>
													{+category.status ===
													PRODUCT_CATEGORY_STATUS.ACTIVE
														? 'Deactivate'
														: 'Activate'}
												</Button>
											</DropdownItem>
										</DropdownMenu>
									</Dropdown>
								</div>
							</div>
						);
					})}
			</div>
		</div>
	);
};

export default ProductCategoryList;
