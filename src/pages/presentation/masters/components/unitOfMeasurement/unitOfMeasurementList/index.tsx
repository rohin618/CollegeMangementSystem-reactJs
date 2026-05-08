import React, { useMemo } from 'react';
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
import { UNIT_OF_MEASUREMENT_STATUS } from '../../../../../../common/constant';

interface UnitOfMeasurementListProps {
	unitOfMeasurementList: any[];
	onEdit: (item: any) => void;
	onDelete: (item: any) => void;
	isLoading: boolean;
	handleToggleUnitStatus: (unit: any) => void;
}

const UnitOfMeasurementList: React.FC<UnitOfMeasurementListProps> = ({
	unitOfMeasurementList,
	onEdit,
	onDelete,
	isLoading,
	handleToggleUnitStatus,
}) => {
	const { darkModeStatus } = useDarkMode();

	const activeUnits = useMemo(() => {
		return unitOfMeasurementList || [];
	}, [unitOfMeasurementList]);

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
				{!isLoading && activeUnits.length === 0 && (
					<div className='text-center text-muted py-4'>
						No Unit Of Measurement found.
					</div>
				)}

				{/* List */}
				{!isLoading &&
					activeUnits.map((unit: any, i: number) => {
						const colorIndex = getColorNameWithIndex(i);

						return (
							<div
								key={unit.id}
								className='row mb-4 border-bottom pb-2 align-items-center'>
								
								{/* Left: Avatar + Text */}
								<div className='col d-flex align-items-center'>
									<div className='flex-shrink-0'>
										<div className='ratio ratio-1x1 me-3' style={{ width: 48 }}>
											<div
												className={`bg-l${darkModeStatus ? 'o25' : '25'}-${colorIndex}
												text-${colorIndex} rounded-2 d-flex align-items-center justify-content-center`}>
												<span className='fw-bold'>
													{getFirstLetter(unit?.name)}
												</span>
											</div>
										</div>
									</div>

									<div className='flex-grow-1'>
										<div className='fs-6 fw-semibold'>
											{unit?.name || 'NA'}
										</div>
										<div className='text-muted'>
											<small>Unit Code: {unit?.code || '-'}</small>
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
													onClick={() => onEdit(unit)}>
													Edit
												</Button>
											</DropdownItem>

											<DropdownItem isDivider />

											<DropdownItem>
												<Button
													icon='Delete'
													onClick={() => onDelete(unit)}>
													Delete
												</Button>
											</DropdownItem>

											<DropdownItem>
												<Button
													icon={
														+unit.status ===
														UNIT_OF_MEASUREMENT_STATUS.ACTIVE
															? 'Block'
															: 'CheckCircle'
													}
													onClick={() =>
														handleToggleUnitStatus(unit)
													}>
													{+unit.status ===
													UNIT_OF_MEASUREMENT_STATUS.ACTIVE
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

export default UnitOfMeasurementList;
