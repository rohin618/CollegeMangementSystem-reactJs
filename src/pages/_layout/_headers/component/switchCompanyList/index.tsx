import React from 'react';
import { Button, Spinner,  } from '../../../../../components/bootstrap';
import { getColorNameWithIndex } from '../../../../../common/data/enumColors';
import { getFirstLetter } from '../../../../../helpers/helpers';
import useDarkMode from '../../../../../hooks/useDarkMode';

interface SwitchCompanyListProps {
	isLoading: boolean;
	isError: boolean;
	error: any;
	companyList: any[];
	onClick: (company: any) => void;
}
const SwitchCompanyList: React.FC<SwitchCompanyListProps> = ({
	isLoading,
	isError,
	error,
	companyList,
	onClick,
}) => {

    const { darkModeStatus } = useDarkMode();
	return (
		<div className='row g-3'>
			<div className='col-12'>
				{/* Loader State */}
				{isLoading && (
					<div className='text-center py-5'>
						<Spinner color='primary' size='lg' />
					</div>
				)}

				{/* Error State */}
				{isError && (
					<div className='text-center text-danger'>
						Failed to load companies.
						<small className='d-block mt-1'>
							{(error as any)?.message || 'Please try again later.'}
						</small>
					</div>
				)}

				{/* Empty State */}
				{!isLoading && !isError && companyList.length === 0 && (
					<div className='text-center text-muted py-4'>No companies found.</div>
				)}

				{/* Company List */}
				{!isLoading &&
					!isError &&
					companyList?.map((company: any, i) => {
						const colorIndex = getColorNameWithIndex(i);
						return (
							<div className='row mb-4' key={company.id}>
								{/* Left Section - Avatar + Title */}
								<div className='col d-flex align-items-center cursor-pointer' onClick={() => onClick(company)}>
									{/* Avatar */}
									<div className='flex-shrink-0'>
										<div
											className='ratio ratio-1x1 me-3'
											style={{ width: '48px' }}>
											<div
												className={`bg-l${
													darkModeStatus ? 'o25' : '25'
												}-${colorIndex} text-${colorIndex} rounded-2 d-flex align-items-center justify-content-center`}>
												<span className='fw-bold'>
													{getFirstLetter(company?.tradeName)}
												</span>
											</div>
										</div>
									</div>

									{/* Title + Subtitle */}
									<div className='flex-grow-1'>
										<div className='fs-6'>{company?.tradeName || ''}</div>
										<div className='text-muted'>
											<small>C{company.code}</small>
										</div>
									</div>
								</div>

								{/* Right Section - Button */}
								<div className='col-auto text-end'>
									<Button
										icon='ArrowForwardIos'
										aria-label='Go To Company'
										hoverShadow='default'
										color={darkModeStatus ? 'dark' : undefined}
										onClick={() => onClick(company)}
									/>
								</div>
							</div>
						);
					})}
			</div>
		</div>
	);
};

export default SwitchCompanyList;
