import React, { UIEvent, useMemo, useRef, useState } from 'react';

interface Column {
	label: string;
	key: string;
	sortable?: boolean;
	className?: string;
	render?: (row: any) => React.ReactNode;
}

interface Props {
	columns: Column[];
	data: any[];

	fixed?: boolean;
	search?: boolean;

	isLoading?: boolean;
	isFetchingNextPage?: boolean;
	hasNextPage?: boolean;
	fetchNextPage?: () => void;

	noDataFound?: React.ReactNode;
	loaderText?: React.ReactNode;

	scrollHeight?: string;
	scrollThreshold?: number;
}

const LoadingDots = () => {
	return (
		<div className='d-flex align-items-center justify-content-center gap-2 py-3'>
			<span className='loading-dot'></span>
			<span className='loading-dot'></span>
			<span className='loading-dot'></span>

			<style>
				{`
          .loading-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #0d6efd;
            animation: bounce 1.4s infinite ease-in-out both;
          }

          .loading-dot:nth-child(1) {
            animation-delay: -0.32s;
          }

          .loading-dot:nth-child(2) {
            animation-delay: -0.16s;
          }

          @keyframes bounce {
            0%, 80%, 100% {
              transform: scale(0);
              opacity: 0.4;
            }
            40% {
              transform: scale(1);
              opacity: 1;
            }
          }
        `}
			</style>
		</div>
	);
};

export const InfiniteDataTable = ({
	columns,
	data,

	fixed = false,
	search = false,

	isLoading = false,
	isFetchingNextPage = false,
	hasNextPage = false,
	fetchNextPage = () => {},

	noDataFound = 'No records found',
	loaderText = 'Loading...',

	scrollHeight = 'calc(100vh - 260px)',
	scrollThreshold = 150,
}: Props) => {
	const [searchText, setSearchText] = useState('');
	const [sortKey, setSortKey] = useState('');
	const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

	const fetchLockRef = useRef(false);

	const filteredData = useMemo(() => {
		if (!search || !searchText) return data;

		return data.filter((row) =>
			Object.values(row)
				.join(' ')
				.toLowerCase()
				.includes(searchText.toLowerCase()),
		);
	}, [search, searchText, data]);

	const sortedData = useMemo(() => {
		if (!sortKey) return filteredData;

		return [...filteredData].sort((a, b) => {
			if (a[sortKey] > b[sortKey]) return sortDir === 'asc' ? 1 : -1;
			if (a[sortKey] < b[sortKey]) return sortDir === 'asc' ? -1 : 1;
			return 0;
		});
	}, [filteredData, sortKey, sortDir]);

	const handleSort = (key: string) => {
		if (sortKey === key) {
			setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
		} else {
			setSortKey(key);
			setSortDir('asc');
		}
	};

	const handleScroll = (event: UIEvent<HTMLDivElement>) => {
		if (!hasNextPage || isFetchingNextPage || fetchLockRef.current) return;

		const target = event.currentTarget;
		const { scrollTop, scrollHeight, clientHeight } = target;

		const isNearBottom =
			scrollTop + clientHeight >= scrollHeight - scrollThreshold;

		if (isNearBottom) {
			fetchLockRef.current = true;
			fetchNextPage();

			setTimeout(() => {
				fetchLockRef.current = false;
			}, 500);
		}
	};

	return (
		<div className='h-100'>
			<div className='d-flex flex-column h-100'>
				{search && (
					<input
						className='form-control mb-3'
						placeholder='Search...'
						value={searchText}
						onChange={(e) => setSearchText(e.target.value)}
					/>
				)}

				<div
					className={fixed ? 'table-responsive flex-grow-1' : ''}
					onScroll={handleScroll}
					style={
						fixed
							? {
									overflowY: 'auto',
									maxHeight: scrollHeight,
							  }
							: undefined
					}>
					<table className='table table-modern table-hover table-sm'>
						<thead className='table-light'>
							<tr>
								{columns.map((col) => (
									<th
										key={col.key}
										onClick={() => col.sortable && handleSort(col.key)}
										style={{
											cursor: col.sortable ? 'pointer' : 'default',
											position: fixed ? 'sticky' : 'static',
											top: fixed ? 0 : undefined,
											zIndex: fixed ? 10 : undefined,
											background: fixed ? '#fff' : undefined,
										}}
										className={col.className}>
										{col.label}

										{sortKey === col.key && (
											<span className='ms-1'>
												{sortDir === 'asc' ? '▲' : '▼'}
											</span>
										)}
									</th>
								))}
							</tr>
						</thead>

						<tbody>
							{isLoading && (
								<tr>
									<td colSpan={columns.length} className='text-center py-5'>
										<div className='text-muted'>{loaderText}</div>
									</td>
								</tr>
							)}

							{!isLoading &&
								sortedData.length > 0 &&
								sortedData.map((row, i) => (
									<tr key={row?.id || i}>
										{columns.map((col) => (
											<td key={col.key} style={{ whiteSpace: 'nowrap' }}>
												{col.render ? col.render(row) : row[col.key]}
											</td>
										))}
									</tr>
								))}

							{!isLoading && sortedData.length === 0 && (
								<tr>
									<td colSpan={columns.length} className='text-center py-5'>
										{noDataFound}
									</td>
								</tr>
							)}
						</tbody>
					</table>

					{isFetchingNextPage && <LoadingDots />}

					{!isLoading && !hasNextPage && sortedData.length > 0 && (
						<div className='text-center py-3 text-muted small border-top'>
							No more data
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default InfiniteDataTable;