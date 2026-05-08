import React, { useMemo, useState } from 'react';
import { Button, Spinner } from '../../../../../../components/bootstrap';

interface VendorRatingProps {
	vendorId: string;
	vendorData: any;
	onSave: (rating: any) => Promise<void>;
}

const RATING_PARAMS = [
	{ key: 'qualityScore', label: 'Quality of Goods/Services' },
	{ key: 'pricingScore', label: 'Pricing (value for money)' },
	{ key: 'behaviourScore', label: 'Behaviour & Documentation' },
	{ key: 'externalScore', label: 'External Rating (Google / Market)' },
	{ key: 'postDeliveryScore', label: 'Post Delivery Service' },
] as const;

type ScoreKey = (typeof RATING_PARAMS)[number]['key'];

const VendorRating: React.FC<VendorRatingProps> = ({ vendorData, onSave }) => {
	const [scores, setScores] = useState<Record<ScoreKey, number>>({
		qualityScore: vendorData?.qualityScore || 0,
		pricingScore: vendorData?.pricingScore || 0,
		behaviourScore: vendorData?.behaviourScore || 0,
		externalScore: vendorData?.externalScore || 0,
		postDeliveryScore: vendorData?.postDeliveryScore || 0,
	});
	const [isSaving, setIsSaving] = useState(false);

	const overallRating = useMemo(() => {
		const vals = Object.values(scores).filter((v) => v > 0);
		if (!vals.length) return 0;
		return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
	}, [scores]);

	const overallColor =
		overallRating >= 4 ? 'success' : overallRating >= 3 ? 'warning' : 'danger';

	const handleStar = (key: ScoreKey, value: number) => {
		setScores((prev) => ({ ...prev, [key]: value }));
	};

	const handleSave = async () => {
		setIsSaving(true);
		try {
			await onSave({ ...scores, overallRating });
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className='p-3'>
			{/* Overall badge */}
			<div className='d-flex justify-content-center mb-4'>
				{overallRating > 0 ? (
					<span className={`badge bg-${overallColor} fs-5 px-4 py-2`}>
						Overall: {overallRating} / 5
					</span>
				) : (
					<span className='badge bg-secondary fs-5 px-4 py-2'>
						Overall: — / 5
					</span>
				)}
			</div>

			{/* Star rows */}
			<div className='d-flex flex-column gap-3 mb-4'>
				{RATING_PARAMS.map(({ key, label }) => {
					const score = scores[key];
					return (
						<div key={key} className='d-flex align-items-center gap-2'>
							{/* Label */}
							<div style={{ minWidth: 210, flex: '0 0 210px' }} className='fw-semibold small'>
								{label}
							</div>

							{/* Stars */}
							<div className='d-flex gap-1'>
								{[1, 2, 3, 4, 5].map((star) => (
									<button
										key={star}
										type='button'
										className='btn btn-sm p-0 border-0 lh-1'
										style={{
											fontSize: '1.6rem',
											color: star <= score ? '#f5a623' : '#ccc',
											background: 'none',
											cursor: 'pointer',
										}}
										onClick={() => handleStar(key, star)}
										disabled={isSaving}>
										★
									</button>
								))}
							</div>

							{/* Numeric score */}
							<div className='ms-1 text-muted small fw-bold' style={{ minWidth: 30 }}>
								{score > 0 ? `${score}/5` : '—'}
							</div>
						</div>
					);
				})}
			</div>

			{/* Save button */}
			<Button
				color='info'
				className='w-100'
				onClick={handleSave}
				isDisable={isSaving || overallRating === 0}>
				{isSaving ? (
					<>
						<Spinner size='sm' isSmall inButton /> Saving...
					</>
				) : (
					'Save Rating'
				)}
			</Button>
		</div>
	);
};

export default VendorRating;
