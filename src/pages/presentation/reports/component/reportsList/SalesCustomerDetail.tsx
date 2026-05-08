import moment from 'moment';
import { Fragment, useState } from 'react';
import {
    INVOICE_CATEGORY,
    INVOICE_TO_TYPE,
} from '../../../../../common/constant';
import {
    CREDIT_TYPE_LIST,
    INVOICE_TO_TYPE_LIST,
    INVOICE_TYPE_LIST,
} from '../../../../../common/data/option';
import { Button } from '../../../../../components/bootstrap';
import Icon from '../../../../../components/icon';
import { formatMoney, getLabelByValue, priceFormat } from '../../../../../helpers/helpers';
import { getShortName } from '../../../../../helpers/residentInvoiceAddress';
import { useGetMiscellaneousList } from '../../../../../hooks';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

/* ======================================================
   HELPERS
====================================================== */

const getOpenBalance = (inv: any) => {
    const paid =
        inv.payedInfo?.reduce(
            (s: number, p: any) => s + Number(p.amount || 0),
            0
        ) || 0;

    return Number(inv.totalPrice || 0) - paid;
};

const getWalletRemaining = (w: any) => {
    const applied =
        w.creditApply?.reduce(
            (s: number, c: any) => s + Number(c.amount || 0),
            0
        ) || 0;

    return Number(w.creditAmount || 0) - applied;
};

const calcCustomerTotals = (cust: any) => {
    const invoiceAmount = cust.invoices.reduce(
        (s: number, i: any) => s + Number(i.totalPrice || 0),
        0
    );

    const creditAmount = cust.wallets.reduce(
        (s: number, w: any) => s + Number(w.creditAmount || 0),
        0
    );

    const invoiceBalance = cust.invoices.reduce(
        (s: number, i: any) => s + getOpenBalance(i),
        0
    );

    const creditRemaining = cust.wallets.reduce(
        (s: number, w: any) => s + Number(w.remainingAmount || 0),
        0
    );

    return {
        amount: invoiceAmount - creditAmount,
        balance: invoiceBalance - creditRemaining,
    };
};

/* ======================================================
   COMPONENT
====================================================== */

export const SalesCustomerDetail = ({
    reportsList = [],
    isLoading,
    onRowClick,
    localAuthorityList = [],
    localICBList = [],
}: any) => {
    const [expanded, setExpanded] = useState<any>({});
    const { data: miscellaneousList }: any = useGetMiscellaneousList();

    const toggleExpand = (key: string) =>
        setExpanded((p: any) => ({ ...p, [key]: !p[key] }));

    /* ======================================================
       DESCRIPTION
    ====================================================== */

    const getMiscellaneousName = (id: string) =>
        miscellaneousList?.find((m: any) => m.id === id)?.name ?? '';

    const getDescription = (item: any, inv: any) => {
        if (!item) return '';
        if (item.category !== INVOICE_CATEGORY.BED) {
            return `${getMiscellaneousName(item.miscellaneousId)} ${item.description ? `(${item.description})` : ''
                }`;
        }

        const weekPrice = priceFormat(Number(item.weekPrice || 0));
        return `Monthly ${getShortName(inv.invoiceTo)} @ ${weekPrice} per week`;
    };

    /* ======================================================
       BUILD TREE (Type → Fund → Customer)
    ====================================================== */

    const groupedByType = reportsList.reduce((acc: any, report: any) => {
        const customerId =
            report.personal?.id || `unknown-${report.id}`;
        const customerName =
            report.personal?.name || 'Blocked Bed';

        /* INVOICES */
        (report.invoices || []).forEach((inv: any) => {
            const type =
                getLabelByValue(INVOICE_TO_TYPE_LIST, inv.invoiceTo) ||
                'Unknown';

            acc[type] ||= {};

            let fund = `${type} List`;
            if (inv.invoiceTo === INVOICE_TO_TYPE.LA) {
                fund =
                    localAuthorityList.find(
                        (l: any) => l.id === inv.fundTypeId
                    )?.shortName || fund;
            } else if (inv.invoiceTo === INVOICE_TO_TYPE.CHC) {
                fund =
                    localICBList.find(
                        (l: any) => l.id === inv.fundTypeId
                    )?.shortName || fund;
            }

            acc[type][fund] ||= {};
            acc[type][fund][customerId] ||= {
                name: customerName,
                invoices: [],
                wallets: [],
            };

            acc[type][fund][customerId].invoices.push(inv);
        });

        /* CREDIT WALLETS */
        (report.creditWallets || []).forEach((w: any) => {
            const remaining = getWalletRemaining(w);
            if (remaining <= 0) return;

            const type =
                getLabelByValue(INVOICE_TO_TYPE_LIST, w.creditTo) ||
                'Credit';

            acc[type] ||= {};
            let fund = `${type} List`;

            if (w.creditTo === INVOICE_TO_TYPE.LA) {
                fund =
                    localAuthorityList.find(
                        (l: any) => l.id === w.fundTypeId
                    )?.shortName || fund;
            } else if (w.creditTo === INVOICE_TO_TYPE.CHC) {
                fund =
                    localICBList.find(
                        (l: any) => l.id === w.fundTypeId
                    )?.shortName || fund;
            }

            acc[type][fund] ||= {};
            acc[type][fund][customerId] ||= {
                name: customerName,
                invoices: [],
                wallets: [],
            };

            acc[type][fund][customerId].wallets.push({
                ...w,
                remainingAmount: remaining,
            });
        });

        return acc;
    }, {});

    /* ======================================================
       RENDER
    ====================================================== */

    const getRoomLabelFromCustomer = (cust: any) => {
        const inv = cust?.invoices?.[0];
        if (!inv?.roomData) return '';

        return (
            inv.roomData.roomNumber ||
            ''
        );
    };


    const grandTotals = Object.values(groupedByType).reduce(
        (acc: any, typeData: any) => {
            Object.values(typeData).forEach((fund: any) => {
                Object.values(fund).forEach((cust: any) => {
                    const invoiceAmount = cust.invoices.reduce(
                        (s: number, i: any) => s + Number(i.totalPrice || 0),
                        0
                    );

                    const creditAmount = cust.wallets.reduce(
                        (s: number, w: any) => s + Number(w.creditAmount || 0),
                        0
                    );

                    const invoiceBalance = cust.invoices.reduce(
                        (s: number, i: any) => s + getOpenBalance(i),
                        0
                    );

                    const creditRemaining = cust.wallets.reduce(
                        (s: number, w: any) => s + Number(w.remainingAmount || 0),
                        0
                    );

                    acc.amount += invoiceAmount - creditAmount;
                    acc.balance += invoiceBalance - creditRemaining;
                });
            });
            return acc;
        },
        { amount: 0, balance: 0 }
    );

    const hasReportData = (reportsList: any[]): boolean => {
        if (!Array.isArray(reportsList) || reportsList.length === 0) return false;

        return reportsList.some((r) =>
            (r.invoices && r.invoices.length > 0) ||
            (r.creditWallets && r.creditWallets.length > 0)
        );
    };
    const getFundCategory = (to: number) =>
        getLabelByValue(INVOICE_TO_TYPE_LIST, to) || '';

    const getFundingName = (to: number, fundTypeId: any) => {
        if (to === INVOICE_TO_TYPE.LA) {
            return (
                localAuthorityList.find((l: any) => l.id === fundTypeId)
                    ?.shortName || ''
            );
        }
        if (to === INVOICE_TO_TYPE.CHC) {
            return (
                localICBList.find((l: any) => l.id === fundTypeId)
                    ?.shortName || ''
            );
        }
        return 'Private';
    };
    const getResidentDisplayName = (
        cust: any,
        fundType: number
    ) => {
        const room = getRoomLabelFromCustomer(cust); // "09"
        const name = cust.name || '';               // "John"
        const fundCategory = getFundCategory(fundType); // "CHC"

        return `${room ? room + ' ' : ''}${name} ${fundCategory}`.trim();
    };



    const exportSalesCustomerDetail = () => {
        if (!hasReportData(reportsList)) {
            alert('No data to export');
            return;
        }

        const rows: any[] = [];

        Object.entries(groupedByType).forEach(([type, funds]: any) => {
            Object.entries(funds).forEach(([fund, customers]: any) => {
                Object.values(customers)
                    .sort((aCust: any, bCust: any) => {
                        const aRoom = getRoomLabelFromCustomer(aCust);
                        const bRoom = getRoomLabelFromCustomer(bCust);
                        return aRoom.localeCompare(bRoom, undefined, { numeric: true, sensitivity: 'base' });
                    })
                    .forEach((cust: any) => {

                    /* -------- INVOICES -------- */
                    cust.invoices.forEach((inv: any) => {
                        rows.push({
                            Date: moment(inv.sDate).format('DD/MM/YYYY'),
                            'Resident Name': getResidentDisplayName(cust, inv.invoiceTo),
                            'Funding Name': getFundingName(
                                inv.invoiceTo,
                                inv.fundTypeId
                            ),
                            'Transaction Type': getLabelByValue(
                                INVOICE_TYPE_LIST,
                                inv.type
                            ),
                            No: inv.code || '-',
                            Description: getDescription(inv.items?.[0], inv),
                            Amount: Number(inv.totalPrice || 0),
                            Balance: getOpenBalance(inv),
                        });
                    });

                    /* -------- CREDIT NOTES -------- */
                    cust.wallets.forEach((w: any) => {
                        rows.push({
                            Date: moment(
                                w.date || w.created?.date?.toDate()
                            ).format('DD/MM/YYYY'),
                            'Resident Name': getResidentDisplayName(cust, w.creditTo),
                            'Funding Name': getFundingName(
                                w.creditTo,
                                w.fundTypeId
                            ),
                            'Transaction Type': getLabelByValue(
                                CREDIT_TYPE_LIST,
                                w.type
                            ),
                            No: w.code || '-',
                            Description: 'Credit Note',
                            Amount: -Number(w.creditAmount || 0),
                            Balance: -Number(w.remainingAmount || 0),
                        });
                    });
                });
            });
        });

        /* ===== GRAND TOTAL ===== */
        rows.push({
            Date: '',
            'Resident Name': 'GRAND TOTAL',
            'Funding Name': '',
            'Transaction Type': '',
            No: '',
            Description: '',
            Amount: grandTotals.amount,
            Balance: grandTotals.balance,
        });

        const worksheet = XLSX.utils.json_to_sheet(rows, {
            header: [
                'Date',
                'Resident Name',
                'Funding Name',
                'Transaction Type',
                'No',
                'Description',
                'Amount',
                'Balance',
            ],
        });

        worksheet['!cols'] = [
            { wch: 14 },
            { wch: 25 },
            { wch: 25 },
            { wch: 22 },
            { wch: 14 },
            { wch: 40 },
            { wch: 16 },
            { wch: 16 },
        ];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(
            workbook,
            worksheet,
            'Sales Customer Detail'
        );

        const buffer = XLSX.write(workbook, {
            bookType: 'xlsx',
            type: 'array',
        });

        saveAs(
            new Blob([buffer], { type: 'application/octet-stream' }),
            `Sales_Customer_Detail_${moment().format(
                'YYYYMMDD_HHmmss'
            )}.xlsx`
        );
    };




    return (
        <>
            <div className="text-end mb-3">
                <Button color="success" onClick={exportSalesCustomerDetail}>
                    <Icon icon="Download" /> Export Excel
                </Button>
            </div>

            <table className="table table-modern table-hover align-middle">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Transaction Type</th>
                        <th>No</th>
                        <th>Invoice Type</th>
                        <th>Description</th>
                        <th className='text-end'>Amount</th>
                        <th className='text-end'>Balance</th>
                    </tr>
                </thead>

                <tbody>
                    {isLoading ? (
                        <tr>
                            <td colSpan={7} className="text-center">
                                Loading…
                            </td>
                        </tr>
                    ) : !hasReportData(reportsList) ? (
                        <tr>
                            <td colSpan={7} className="text-center text-muted py-4">
                                No data available
                            </td>
                        </tr>
                    ) : (
                        <>
                            {
                                Object.entries(groupedByType).map(([type, funds]: any) => {
                                    const typeKey = `type-${type}`;
                                    const typeTotals = { amount: 0, balance: 0 };

                                    Object.values(funds).forEach((grp: any) =>
                                        Object.values(grp).forEach((cust: any) => {
                                            const t = calcCustomerTotals(cust);
                                            typeTotals.amount += t.amount;
                                            typeTotals.balance += t.balance;
                                        })
                                    );




                                    return (
                                        <Fragment key={typeKey}>
                                            <tr
                                                className="table-primary fw-bold cursor-pointer"
                                                onClick={() => toggleExpand(typeKey)}
                                            >
                                                <td colSpan={5}>
                                                    <Icon
                                                        icon={
                                                            expanded[typeKey]
                                                                ? 'ArrowDropUp'
                                                                : 'ArrowDropDown'
                                                        }
                                                    />{' '}
                                                    {type}
                                                </td>
                                                <td className='text-end'>
                                                    £{formatMoney(typeTotals.amount)}
                                                </td>
                                                <td className='text-end'>
                                                    £{formatMoney(typeTotals.balance)}
                                                </td>

                                            </tr>

                                            {expanded[typeKey] &&
                                                Object.entries(funds).map(([fund, customers]: any) => {
                                                    const fundKey = `${typeKey}-${fund}`;

                                                    return (
                                                        <Fragment key={fundKey}>
                                                            <tr
                                                                className="table-secondary cursor-pointer"
                                                                onClick={() => toggleExpand(fundKey)}
                                                            >
                                                                <td colSpan={7}>{fund}</td>
                                                            </tr>

                                                            {expanded[fundKey] &&
                                                                Object.entries(customers)
                                                                    .sort(([, aCust]: any, [, bCust]: any) => {
                                                                        const aRoom = getRoomLabelFromCustomer(aCust);
                                                                        const bRoom = getRoomLabelFromCustomer(bCust);
                                                                        return aRoom.localeCompare(bRoom, undefined, { numeric: true, sensitivity: 'base' });
                                                                    })
                                                                    .map(([custId, cust]: any) => {
                                                                        const custKey = `${fundKey}-${custId}`;
                                                                        const totals = calcCustomerTotals(cust);

                                                                        return (
                                                                            <Fragment key={custKey}>
                                                                                <tr
                                                                                    className="fw-semibold cursor-pointer"
                                                                                    onClick={() =>
                                                                                        toggleExpand(custKey)
                                                                                    }
                                                                                >
                                                                                    <td colSpan={5}>
                                                                                        {getRoomLabelFromCustomer(cust) && (
                                                                                            <span className="text-muted me-2">
                                                                                                {getRoomLabelFromCustomer(cust)}
                                                                                            </span>
                                                                                        )}
                                                                                        {cust.name} {fund}
                                                                                    </td>

                                                                                    <td className='text-end'>
                                                                                        £{formatMoney(totals.amount)}
                                                                                    </td>
                                                                                    <td className='text-end'>
                                                                                        £{formatMoney(totals.balance)}
                                                                                    </td>

                                                                                </tr>

                                                                                {expanded[custKey] && (
                                                                                    <>
                                                                                        {cust.invoices.map(
                                                                                            (inv: any, i: number) => (
                                                                                                <tr key={`i-${i}`}
                                                                                                    onClick={() =>
                                                                                                        onRowClick({
                                                                                                            inv,
                                                                                                            residentId: inv.id || null,
                                                                                                        })
                                                                                                    }
                                                                                                >
                                                                                                    <td>
                                                                                                        {moment(inv.sDate).format(
                                                                                                            'DD MMM YYYY'
                                                                                                        )}
                                                                                                    </td>
                                                                                                    <td>
                                                                                                        {getLabelByValue(
                                                                                                            INVOICE_TYPE_LIST,
                                                                                                            inv.type
                                                                                                        )}
                                                                                                    </td>
                                                                                                    <td>{inv.code || "-"}</td>
                                                                                                    <td>
                                                                                                        {getShortName(Number(inv.invoiceTo))
                                                                                                            ||
                                                                                                            getLabelByValue(
                                                                                                                INVOICE_TO_TYPE_LIST,
                                                                                                                inv.invoiceTo
                                                                                                            ) || '-'}
                                                                                                    </td>
                                                                                                    <td>
                                                                                                        {getDescription(
                                                                                                            inv.items?.[0],
                                                                                                            inv
                                                                                                        )}
                                                                                                    </td>
                                                                                                    <td className='text-end'>
                                                                                                        £{formatMoney(inv.totalPrice)}
                                                                                                    </td>
                                                                                                    <td className='text-end'>
                                                                                                        £{formatMoney(getOpenBalance(inv))}
                                                                                                    </td>

                                                                                                </tr>
                                                                                            )
                                                                                        )}

                                                                                        {cust.wallets.map(
                                                                                            (w: any, i: number) => (
                                                                                                <tr
                                                                                                    key={`w-${i}`}
                                                                                                    className="table-warning"
                                                                                                    onClick={() =>
                                                                                                        onRowClick({
                                                                                                            w,
                                                                                                            residentId: w.id || null,
                                                                                                        })}>
                                                                                                    <td>
                                                                                                        {moment(
                                                                                                            w.date ||
                                                                                                            w.created?.date?.toDate()
                                                                                                        ).format('DD MMM YYYY')}
                                                                                                    </td>
                                                                                                    <td>{getLabelByValue(CREDIT_TYPE_LIST, w.type)}</td>
                                                                                                    <td>{w.code || '-'}</td>
                                                                                                    <td>
                                                                                                        {getShortName(
                                                                                                            w.creditTo
                                                                                                        )}
                                                                                                    </td>
                                                                                                    <td>{"-"}</td>
                                                                                                    <td className="text-danger text-end">
                                                                                                        -£{formatMoney(w.creditAmount)}
                                                                                                    </td>
                                                                                                    <td className="text-danger text-end">
                                                                                                        -£{formatMoney(w.remainingAmount)}
                                                                                                    </td>

                                                                                                </tr>
                                                                                            )
                                                                                        )}
                                                                                    </>
                                                                                )}
                                                                            </Fragment>
                                                                        );
                                                                    }
                                                                )}
                                                        </Fragment>
                                                    );
                                                })}
                                        </Fragment>
                                    );

                                })
                            }

                            <tr className="fw-bold table-success">
                                <td colSpan={5}>Grand Total</td>
                                <td className='text-end'>
                                    £{formatMoney(grandTotals.amount)}
                                </td>
                                <td className='text-end'>
                                    £{formatMoney(grandTotals.balance)}
                                </td>
                            </tr>

                        </>)}
                </tbody>

            </table >
        </>
    );
};
