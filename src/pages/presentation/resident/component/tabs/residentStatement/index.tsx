import {
	priceFormat,
	downloadResidentStatement,
	downloadResidentStatementExcel,
	findRoomAndBedByid,
	getActiveFundDetails,
	getActiveFundDetailsByLAOrICB,
} from '../../../../../../helpers/helpers';
import {
	Badge,
	Button,
	Card,
	CardActions,
	CardBody,
	CardHeader,
	CardTitle,
	FormGroup,
	Popovers,
	Select,
	Option,
	Dropdown,
	DropdownToggle,
	DropdownMenu,
	DropdownItem,
} from '../../../../../../components/bootstrap';

import {
	useInvoiceListByResident,
	useMultiSearch,
	useResidentStatement,
} from '../../../../../../hooks';
import { useEffect, useMemo, useState } from 'react';

import moment from 'moment';
import Icon from '../../../../../../components/icon';
import useDarkMode from '../../../../../../hooks/useDarkMode';
import { TColor } from '../../../../../../type/color-type';
import { INVOICE_TO_TYPE_LIST } from '../../../../../../common/data/option';
import { FUND_SOURCE_TYPE, INVOICE_TO_TYPE, QUERY_KEY } from '../../../../../../common/constant';
import { DateRangePickerPopover, SearchableSelect } from '../../../../../../components/common';
import { useGetAllRoomsWithBeds } from '../../../../../../hooks/useGetAllRoomsWithBed';
import { useQuery } from '@tanstack/react-query';
import { getHeadOfficeAddress } from '../../../../../../common/api/headOfficeAddress';
import { useGetHeadOfficeAddress } from '../../../../../../hooks/useGetHeadOfficeAddress';

type ResidentStatementProps = {
	residentData: any;
	fNCDetails: any;
	localICBList: any[];
	localAuthorityList: any[];
	vatList: any;
};

export const ResidentStatement = ({
	residentData,
	fNCDetails,
	localICBList,
	localAuthorityList,
	vatList,
}: ResidentStatementProps) => {
	const { id }: any = residentData;

	// -------------------------------
	// INVOICE QUERY
	// -------------------------------
	const {
		data: invoiceList = [],
		isLoading: invoicesLoading,
		refetch: reloadInvoiceList,
	} = useInvoiceListByResident(id);

	const {
		data: roomsList = [],
		isLoading: roomListIsLoading,
		isError,
	} = useGetAllRoomsWithBeds();
	
	const {data:headOfficeAddress,isLoading:isHeadOfficeLoading} = useGetHeadOfficeAddress();

	const [filterFromObject, setFilterFromObject] = useState<any>({
		invoiceTo: '',
		status: '',
		// fundTypeId: ""
	});

	/** 🔹 Derived Data */
	const memoFilter = useMemo(() => filterFromObject, [filterFromObject]);

	const { creditTo, ...invoiceFilters } = memoFilter;
	const { invoiceTo, ...walletFilters } = memoFilter;

	const filteredinvoiceList = useMultiSearch(invoiceList ?? [], invoiceFilters);

	const filteredResidentCreditWalletList = useMultiSearch(
		residentData?.creditWallets ?? [],
		walletFilters,
	);

	// -------------------------------
	// DATE PICKER STATE
	// -------------------------------
	const [datePickerValue, setDatePickerValue] = useState({
		startDate: moment('2025-01-01').toDate(),
		endDate: moment().add(1, 'year').endOf('year').toDate(),
	});

	const getTransactionType = (description: string) => {
		if (description.toLowerCase().includes('payment')) return 'payment';
		if (description.toLowerCase().includes('credit')) return 'credit';
		if (description.toLowerCase().includes('invoice')) return 'invoice';
		if (description.toLowerCase().includes('deposit')) return 'Deposit';
		return 'other';
	};
	// const { statement: residentStatement, loading: statementLoading }: any = {}

	// -------------------------------
	// STATEMENT HOOK — FULLY OPTIMIZED
	// -------------------------------
	const { statement: residentStatement, loading: statementLoading }: any = useResidentStatement(
		filteredinvoiceList,
		filteredResidentCreditWalletList || [],
		datePickerValue.startDate,
		datePickerValue.endDate,
	);

	//
	// -------------------------------
	// TRANSACTION ROWS MEMO
	// -------------------------------

const statementRows = useMemo(() => {
  if (statementLoading || invoicesLoading) {
    // ✅ Skeleton rows — prevents white screen / layout jump
    return Array.from({ length: 5 }).map((_, i) => (
      <tr key={`skeleton-${i}`}>
        {Array.from({ length: 4 }).map((_, j) => (
          <td key={j}>
            <div
              className="placeholder-glow"
              style={{ height: 16, borderRadius: 4 }}
            >
              <span className="placeholder col-8" />
            </div>
          </td>
        ))}
      </tr>
    ));
  }

  if (!residentStatement?.transactions?.length) {
    return (
      <tr>
        <td colSpan={4} className="text-center text-muted py-3">
          No transactions in this date range.
        </td>
      </tr>
    );
  }

  return residentStatement.transactions.map((st: any, i: number) => {
    const type:any = getTransactionType(st.description);
    return (
      <tr key={st.id || i}>
        <td>{moment(st.date).format("DD MMM YYYY")}</td>
        <td>
          {st.code}
          <span className="ms-2">
            {type === "payment" && (
              <Badge isLight color="success" className="px-3 py-2">
                <Icon icon="CreditCard" className="me-1" /> Payment
              </Badge>
            )}
            {type === "credit" && (
              <Badge isLight color="info" className="px-3 py-2">
                Credit
              </Badge>
            )}
			 {/* {type === "credit" && (
              <Badge isLight color="info" className="px-3 py-2">
                Credit
              </Badge>
            )} */}
			{type === "Deposit" && (
              <Badge isLight color="info" className="px-3 py-2">
                Deposit
              </Badge>
            )}
          </span>
        </td>
		<td>
          {st.notes}
         
        </td>
        <td>{priceFormat(st.amount)}</td>
        <td>{priceFormat(st.balance)}</td>
      </tr>
    );
  });
}, [residentStatement, statementLoading, invoicesLoading]);

	// -------------------------------
	// DOWNLOAD
	// -------------------------------
	const handleDownloadStatement = async () => {
		if (residentStatement?.transactions?.length === 0) return;
		const residentName = residentData?.personal?.name;
				const { room, bed } = findRoomAndBedByid(
					roomsList,
					residentData?.roomId,
					residentData?.bedId,
				);
		const activeFund = getActiveFundDetails(residentData?.fundDetails);
		const fundingName = getActiveFundDetailsByLAOrICB(activeFund, localAuthorityList, localICBList)?.shortName;
		
		const fileName = `${bed?.bedName ?? (room?.roomNumber || '')} ${residentName || ''} ${+activeFund?.fundSource === FUND_SOURCE_TYPE.PRIVATE ? 'PVT' : fundingName || ''} Statement ${residentStatement?.statement_no || ''}`
		await downloadResidentStatement(residentStatement, residentData, fileName, headOfficeAddress);
	};

	const handleDownloadStatementExcel = async () => {
		if (residentStatement?.transactions?.length === 0) return;
		await downloadResidentStatementExcel(residentStatement, residentData,headOfficeAddress);
	};

	// -------------------------------
	// SUMMARY CARD COMPONENT
	// -------------------------------
	const PaymentCard = ({
		icon,
		color,
		value,
		label,
	}: {
		icon: string;
		color?: TColor;
		value: any;
		label: string;
	}) => {
		const { darkModeStatus } = useDarkMode();
		return (
			<div className='col-xl-3 mb-4'>
				<div
					className={`d-flex align-items-center bg-l${
						darkModeStatus ? 'o25' : '10'
					}-${color} rounded-2 p-3 border border-1`}>
					<div className='flex-grow-1 ms-3'>
						<div className='text-muted mt-n2'>{label}</div>
						<div className={`fw-bold fs-3 mb-0`}>{priceFormat(value)}</div>
					</div>
				</div>
			</div>
		);
	};

	const handleChangeFilter = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = event.target;

		setFilterFromObject((prev: any) => ({
			...prev,
			[name]: value, // ✅ keep string for search
			...(name === 'invoiceTo' && {
				creditTo: value, // ✅ keep string
				fundTypeId: '', // reset
			}),
		}));
	};

	const handleResetFilter = () => {
		setFilterFromObject({
			invoiceTo: '',
			status: '',
			fundTypeId: '',
		});
	};

	// -------------------------------
	// RENDER
	// -------------------------------
	return (
		<div>
			<Card className='shadow-3d-primary mb-4'>
				<CardHeader>
					<CardTitle>Account Summary</CardTitle>

					<CardActions className='d-flex'>
						<DateRangePickerPopover
							value={datePickerValue}
							onApply={setDatePickerValue}
						/>

						{/* <Button
                            color="info"
                            isLight
                            icon="Download"
                            onClick={handleDownloadStatement}
                        >
                            
                        </Button> */}
						<Dropdown>
							<DropdownToggle hasIcon={false}>
								<Button
									icon='Download'
									color='info'
									isLight
									shadow='sm'
									aria-label='More actions'>
									Export
								</Button>
							</DropdownToggle>
							<DropdownMenu isAlignmentEnd>
								<DropdownItem>
									<Button
										icon='PDF'
										color='info'
										isLight
										onClick={handleDownloadStatement}>
										PDF
									</Button>
								</DropdownItem>
								<DropdownItem>
									<Button icon='Excel' onClick={handleDownloadStatementExcel}>
										Excel
									</Button>
								</DropdownItem>
							</DropdownMenu>
						</Dropdown>
					</CardActions>
				</CardHeader>

				<CardBody className='py-4'>
					<div className='row mb-4'>
						<div className='col-md-12'>
							<div className='row'>
								<div className='col-4'>
									<FormGroup id='InvoiceTo' label='Statement of'>
										<SearchableSelect
											id='InvoiceTo'
											name='invoiceTo'
											value={filterFromObject.invoiceTo}
											onChange={handleChangeFilter}
											options={INVOICE_TO_TYPE_LIST}
											placeholder='Select statement of'
										/>
									</FormGroup>
								</div>

								{(+filterFromObject.invoiceTo === INVOICE_TO_TYPE.LA ||
									+filterFromObject.invoiceTo === INVOICE_TO_TYPE.CHC) && (
									<div className='col-4'>
										<FormGroup
											id={
												+filterFromObject.invoiceTo === INVOICE_TO_TYPE.LA
													? 'fundTypeId'
													: 'fundTypeId'
											}
											label='Fund Name'>
											<SearchableSelect
												name='fundTypeId'
												id={
													+filterFromObject.invoiceTo ===
													INVOICE_TO_TYPE.LA
														? 'fundTypeId'
														: 'fundTypeId'
												}
												value={filterFromObject.fundTypeId}
												options={
													+filterFromObject.invoiceTo ===
													INVOICE_TO_TYPE.LA
														? localAuthorityList
														: localICBList
												}
												valueKey='id'
												labelKey='name'
												onChange={handleChangeFilter}
												placeholder={`Select ${+filterFromObject.invoiceTo === INVOICE_TO_TYPE.LA ? 'Local Authority' : 'ICB'}`}
											/>
										</FormGroup>
									</div>
								)}
								<div className='col-md-4 d-flex align-items-end'>
									<Button
										color='link'
										className='text-decoration-none text-primary fw-semibold p-0 d-flex align-items-center gap-1 justify-content-center'
										onClick={handleResetFilter}>
										<Icon icon='Refresh' size='lg' className='text-primary' />
										Reset
									</Button>
								</div>
							</div>
						</div>
					</div>
					<div className='row mb-4'>
						<PaymentCard
							icon=''
							value={residentStatement?.summary?.current_due}
							label='Current Due'
						/>
						<PaymentCard
							icon=''
							value={residentStatement?.summary?.past_due_1_30}
							label='Past Due (1–30)'
						/>
						<PaymentCard
							icon=''
							value={residentStatement?.summary?.past_due_31_60}
							label='Past Due (31–60)'
						/>
						<PaymentCard
							icon=''
							value={residentStatement?.summary?.past_due_61_90}
							label='Past Due (61–90)'
						/>
						<PaymentCard
							icon=''
							value={residentStatement?.summary?.past_due_90_plus}
							label='Past Due (91+)'
						/>
						<PaymentCard
							icon=''
							color='success'
							value={residentStatement?.summary?.total_due}
							label='Total Due'
						/>
					</div>

					<table className='table table-modern table-hover'>
						<thead>
							<tr>
								<th>Date</th>
								<th>Code</th>
								<th>Description</th>
								<th>Amount</th>
								<th>Balance To</th>
							</tr>
						</thead>
						<tbody>{statementRows}</tbody>
					</table>
				</CardBody>
			</Card>
		</div>
	);
};
