import React, { useMemo } from 'react';
import { Button } from '../../../../../../components/bootstrap';
import useDarkMode from '../../../../../../hooks/useDarkMode';
import { getColorNameWithIndex } from '../../../../../../common/data/enumColors';

interface Props {
	address: any;
	onEdit: () => void;
}

const CompanyAddressView: React.FC<Props> = ({ address, onEdit }) => {
	const { darkModeStatus } = useDarkMode();

	// convert single object → array
	const addressList = useMemo(() => {
		return address ? [address] : [];
	}, [address]);

	if (!addressList.length) {
		return <div className='text-center text-muted py-4'>No company address found.</div>;
	}

	return (
		<div className='row justify-content-center'>
			<div className='col-10'>
				{addressList.map((addr: any, i: number) => {
					const colorIndex = getColorNameWithIndex(i);

					return (
						<div
							key={addr?.id || i}
							className='row mb-4 border-bottom pb-2 align-items-center'>
							{/* Left side */}
							<div className='col d-flex align-items-center'>
								<div className='flex-shrink-0'>
									<div className='ratio ratio-1x1 me-3' style={{ width: 48 }}>
										<div
											className={`bg-l${darkModeStatus ? 'o25' : '25'}-${colorIndex}
											text-${colorIndex} rounded-2 d-flex align-items-center justify-content-center`}>
											<span className='fw-bold'>HO</span>
										</div>
									</div>
								</div>

								<div>
									<div>
										{[
											addr?.buildingNumber && `${addr.buildingNumber},`,
											addr?.area,
											addr?.address,
											addr?.postCode,
											addr?.country,
										]
											.filter(Boolean)
											.join(' ')}
									</div>
									{addr?.mdEmail && (
										<div className='text-muted small mt-1'>
											<span className='fw-semibold'>MD:</span> {addr.mdEmail}
										</div>
									)}
									{addr?.directorEmail && (
										<div className='text-muted small'>
											<span className='fw-semibold'>Director:</span> {addr.directorEmail}
										</div>
									)}
								</div>
							</div>

							{/* Right side actions */}
							<div className='col-auto text-end'>
								{/* <Button
									icon='Edit'
									color='info'
									isLight
									shadow='sm'
									onClick={onEdit}
								>
									Edit
								</Button> */}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
};

export default CompanyAddressView;
