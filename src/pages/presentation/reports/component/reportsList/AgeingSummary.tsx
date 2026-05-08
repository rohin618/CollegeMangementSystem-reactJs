import React, { Fragment, useState } from 'react';
import moment from 'moment';
import Icon from '../../../../../components/icon';
import {
    INVOICE_TO_TYPE_LIST,
    INVOICE_TYPE_LIST,
} from '../../../../../common/data/option';
import { formatMoney, getLabelByValue } from '../../../../../helpers/helpers';
import { Button } from '../../../../../components/bootstrap';
import { useMasterData } from '../../../../../contexts/mastersContext';
import { INVOICE_TO_TYPE } from '../../../../../common/constant';
import { getShortName } from '../../../../../helpers/residentInvoiceAddress';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

/* ======================================================
   COMPONENT
====================================================== */

export const AgeingSummary = ({
    reportsList = [],
    isLoading,
    onRowClick,
}: any) => {
    const { localAuthorityList, localICBList } = useMasterData();

    const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
    const [expandedCustomers, setExpandedCustomers] =
        useState<Map<string, string>>(new Map());

    /* ======================================================
       MAPS
    ====================================================== */

    const LA_MAP = Object.fromEntries(
        localAuthorityList.map((l: any) => [l.id, l.shortName || l.name])
    );
    const CHC_MAP = Object.fromEntries(
        localICBList.map((l: any) => [l.id, l.shortName || l.name])
    );

    /* ======================================================
       TOGGLES
    ====================================================== */

    const toggleType = (key: string) => {
        const s = new Set(expandedTypes);
        s.has(key) ? s.delete(key) : s.add(key);
        setExpandedTypes(s);
    };

    const toggleGroup = (key: string) => {
        const s = new Set(expandedGroups);
        s.has(key) ? s.delete(key) : s.add(key);
        setExpandedGroups(s);
    };

    const toggleAgeingView = (custKey: string, bucket: string) => {
        const map = new Map(expandedCustomers);

        // if same bucket clicked → close
        if (map.get(custKey) === bucket) {
            map.delete(custKey);
        } else {
            // open ONLY this bucket
            map.set(custKey, bucket);
        }

        setExpandedCustomers(map);
    };


    /* ======================================================
       HELPERS
    ====================================================== */

    const getDueDate = (inv: any) =>
        inv.invoiceDate
            ? moment(inv.invoiceDate).add(Number(inv.dueDay || 0), 'days')
            : null;

    const getWalletDate = (w: any) => {
        if (w?.created?.date) return moment(w.created.date.toDate());
        if (w?.date) return moment(w.date, 'YYYY-MM-DD');
        return null;
    };

    const getInvoiceOpenBalance = (inv: any) => {
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

    const getBucket = (date: moment.Moment | null) => {
        if (!date) return 'current';
        const diff = moment().diff(date, 'days');
        if (diff <= 0) return 'current';
        if (diff <= 30) return 'days1to30';
        if (diff <= 60) return 'days31to60';
        if (diff <= 90) return 'days61to90';
        return 'days90plus';
    };

    /* ======================================================
       BUILD STRUCTURE
    ====================================================== */

    const groupedByType = reportsList.reduce((acc: any, report: any) => {
        const customerId = report.personal?.id || report.id;
        const customerName = report.personal?.name || 'Blocked Bed';

        /* -------- INVOICES -------- */
        (report.invoices || []).forEach((inv: any) => {
            const typeLabel =
                getLabelByValue(INVOICE_TO_TYPE_LIST, inv.invoiceTo) || 'Unknown';

            acc[typeLabel] ||= {};
            let groupKey = `${typeLabel} ${'List'}`;

            if (
                inv.invoiceTo === INVOICE_TO_TYPE.LA ||
                inv.invoiceTo === INVOICE_TO_TYPE.CHC
            ) {
                groupKey =
                    LA_MAP[inv.fundTypeId] ||
                    CHC_MAP[inv.fundTypeId] ||
                    'Unknown Fund';
            }

            acc[typeLabel][groupKey] ||= {};
            acc[typeLabel][groupKey][customerId] ||= {
                name: customerName,
                invoices: [],
                wallets: [],
            };

            acc[typeLabel][groupKey][customerId].invoices.push(inv);
        });

        /* -------- CREDIT WALLETS -------- */
        (report.creditWallets || []).forEach((w: any) => {
            const remaining = getWalletRemaining(w);
            if (remaining <= 0) return;

            const typeLabel =
                getLabelByValue(INVOICE_TO_TYPE_LIST, w.creditTo) || 'Credit';

            acc[typeLabel] ||= {};
            const groupKey =
                LA_MAP[w.fundTypeId] ||
                CHC_MAP[w.fundTypeId] ||
                `${typeLabel} ${'List'}`;

            acc[typeLabel][groupKey] ||= {};
            acc[typeLabel][groupKey][customerId] ||= {
                name: customerName,
                invoices: [],
                wallets: [],
            };

            acc[typeLabel][groupKey][customerId].wallets.push({
                ...w,
                remainingAmount: remaining,
                walletDate: getWalletDate(w),
            });
        });

        return acc;
    }, {});



    const sumManyTotals = (customers: any[]) => {
        return customers.reduce(
            (acc, cust: any) => {
                const t = calcTotals(cust);
                acc.current += t.current;
                acc.days1to30 += t.days1to30;
                acc.days31to60 += t.days31to60;
                acc.days61to90 += t.days61to90;
                acc.days90plus += t.days90plus;
                acc.total += t.total;
                return acc;
            },
            {
                current: 0,
                days1to30: 0,
                days31to60: 0,
                days61to90: 0,
                days90plus: 0,
                total: 0,
            }
        );
    };


    /* ======================================================
       CUSTOMER TOTALS
    ====================================================== */

    const calcTotals = (cust: any) => {
        const t = {
            current: 0,
            days1to30: 0,
            days31to60: 0,
            days61to90: 0,
            days90plus: 0,
            total: 0,
        };

        cust.invoices.forEach((inv: any) => {
            const open = getInvoiceOpenBalance(inv);
            if (!open) return;
            const b = getBucket(getDueDate(inv));
            t[b] += open;
            t.total += open;
        });

        cust.wallets.forEach((w: any) => {
            const b = getBucket(w.walletDate);
            t[b] -= w.remainingAmount;
            t.total -= w.remainingAmount;
        });

        return t;
    };
    const getRoomLabelFromCustomer = (cust: any) => {
        const inv = cust?.invoices?.[0];
        if (!inv?.roomData) return '';

        return (
            inv.roomData.roomNumber ||
            inv.roomData.roomNo ||
            inv.roomData.name ||
            ''
        );
    };

    /* ======================================================
       RENDER
    ====================================================== */


    const grandTotals = sumManyTotals(
        Object.values(groupedByType).flatMap((type: any) =>
            Object.values(type).flatMap((grp: any) => Object.values(grp))
        )
    );

    const hasReportData = (reportsList: any[]): boolean => {
        if (!Array.isArray(reportsList) || reportsList.length === 0) return false;

        return reportsList.some((r) =>
            (r.invoices && r.invoices.length > 0) ||
            (r.creditWallets && r.creditWallets.length > 0)
        );
    };
    const exportAgeingSummary = () => {
        if (!hasReportData(reportsList)) {
            alert('No data to export');
            return;
        }

        const rows: any[] = [];

        /* =========================
           BUILD ROWS
        ========================= */
        Object.entries(groupedByType).forEach(([typeLabel, fundGroups]: any) => {
            // ---- TYPE TOTAL ----
            const typeTotals = sumManyTotals(
                Object.values(fundGroups).flatMap((g: any) => Object.values(g))
            );

            rows.push({
                Customer: typeLabel,
                Current: formatMoney(typeTotals.current),
                '1–30': formatMoney(typeTotals.days1to30),
                '31–60': formatMoney(typeTotals.days31to60),
                '61–90': formatMoney(typeTotals.days61to90),
                '91+': formatMoney(typeTotals.days90plus),
                Total: formatMoney(typeTotals.total),

            });

            Object.entries(fundGroups).forEach(([groupKey, customers]: any) => {
                const groupTotals = sumManyTotals(Object.values(customers));

                // ---- GROUP TOTAL ----
                rows.push({
                    Customer: `  ${groupKey}`,
                    Current: formatMoney(groupTotals.current),
                    '1–30': formatMoney(groupTotals.days1to30),
                    '31–60': formatMoney(groupTotals.days31to60),
                    '61–90': formatMoney(groupTotals.days61to90),
                    '91+': formatMoney(groupTotals.days90plus),
                    Total: formatMoney(groupTotals.total),

                });

                Object.entries(customers)
                    .sort(([, aCust]: any, [, bCust]: any) => {
                        const aRoom = getRoomLabelFromCustomer(aCust);
                        const bRoom = getRoomLabelFromCustomer(bCust);
                        return aRoom.localeCompare(bRoom, undefined, { numeric: true, sensitivity: 'base' });
                    })
                    .forEach(([_, cust]: any) => {
                    const totals = calcTotals(cust);
                    if (totals.total === 0) return;

                    rows.push({
                        Customer: `    ${getRoomLabelFromCustomer(cust)} ${cust.name}`,
                        Current: formatMoney(totals.current),
                        '1–30': formatMoney(totals.days1to30),
                        '31–60': formatMoney(totals.days31to60),
                        '61–90': formatMoney(totals.days61to90),
                        '91+': formatMoney(totals.days90plus),
                        Total: formatMoney(totals.total),

                    });
                });
            });

            rows.push({}); // spacer
        });

        /* =========================
           GRAND TOTAL
        ========================= */
        rows.push({
            Customer: 'GRAND TOTAL',
            Current: formatMoney(grandTotals.current),
            '1–30': formatMoney(grandTotals.days1to30),
            '31–60': formatMoney(grandTotals.days31to60),
            '61–90': formatMoney(grandTotals.days61to90),
            '91+': formatMoney(grandTotals.days90plus),
            Total: formatMoney(grandTotals.total),

        });

        /* =========================
           EXCEL
        ========================= */
        const worksheet = XLSX.utils.json_to_sheet(rows, {
            header: ['Customer', 'Current', '1–30', '31–60', '61–90', '91+', 'Total'],
        });

        worksheet['!cols'] = [
            { wch: 45 },
            { wch: 16 },
            { wch: 16 },
            { wch: 16 },
            { wch: 16 },
            { wch: 16 },
            { wch: 18 },
        ];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Ageing Summary');

        const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

        saveAs(
            new Blob([buffer], { type: 'application/octet-stream' }),
            `Ageing_Summary_${moment().format('YYYYMMDD_HHmmss')}.xlsx`
        );
    };

    return (
        <>
            <div className="text-end mb-3">
                <Button color="success" onClick={exportAgeingSummary}>
                    <Icon icon="Download" /> Export Ageing Summary
                </Button>
            </div>

            <table className="table table-modern table-hover align-middle">
                <thead>
                    <tr>
                        <th>CUSTOMER</th>
                        <th className='text-end'>CURRENT</th>
                        <th className='text-end'>1–30</th>
                        <th className='text-end'>31–60</th>
                        <th className='text-end'>61–90</th>
                        <th className='text-end'>91+ Over </th>
                        <th className='text-end'>TOTAL</th>
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
                            {Object.entries(groupedByType).map(([typeLabel, fundGroups]: any) => {
                                const typeKey = `type-${typeLabel}`;
                                const isTypeOpen = expandedTypes.has(typeKey);
                                const typeTotals = sumManyTotals(
                                    Object.values(fundGroups).flatMap((g: any) => Object.values(g))
                                );


                                return (
                                    <Fragment key={typeKey}>
                                        <tr
                                            className="table-primary cursor-pointer fw-bold"
                                            onClick={() => toggleType(typeKey)}
                                        >
                                            <td>
                                                <Icon
                                                    icon={isTypeOpen ? 'ArrowDropUp' : 'ArrowDropDown'}
                                                    className="me-2"
                                                />
                                                {typeLabel}
                                            </td>
                                            <td className='text-end'>£{formatMoney(typeTotals.current)}</td>
                                            <td className='text-end'>£{formatMoney(typeTotals.days1to30)}</td>
                                            <td className='text-end'>£{formatMoney(typeTotals.days31to60)}</td>
                                            <td className='text-end'>£{formatMoney(typeTotals.days61to90)}</td>
                                            <td className='text-end'>£{formatMoney(typeTotals.days90plus)}</td>
                                            <td className='text-end'>£{formatMoney(typeTotals.total)}</td>

                                        </tr>


                                        {isTypeOpen &&
                                            Object.entries(fundGroups).map(([groupKey, customers]: any) => {
                                                const groupKeyId = `${typeKey}-${groupKey}`;
                                                const isGroupOpen = expandedGroups.has(groupKeyId);
                                                const groupTotals = sumManyTotals(Object.values(customers));

                                                return (
                                                    <Fragment key={groupKeyId}>
                                                        <tr
                                                            className="table-secondary cursor-pointer fw-semibold"
                                                            onClick={() => toggleGroup(groupKeyId)}
                                                        >
                                                            <td className="ps-4">
                                                                <Icon
                                                                    icon={isGroupOpen ? 'ArrowDropUp' : 'ArrowDropDown'}
                                                                    className="me-2"
                                                                />
                                                                {groupKey}
                                                            </td>
                                                            <td className='text-end'>£{formatMoney(groupTotals.current)}</td>
                                                            <td className='text-end'>£{formatMoney(groupTotals.days1to30)}</td>
                                                            <td className='text-end'>£{formatMoney(groupTotals.days31to60)}</td>
                                                            <td className='text-end'>£{formatMoney(groupTotals.days61to90)}</td>
                                                            <td className='text-end'>£{formatMoney(groupTotals.days90plus)}</td>
                                                            <td className='text-end'>£{formatMoney(groupTotals.total)}</td>

                                                        </tr>


                                                            {isGroupOpen &&
                                                                Object.entries(customers)
                                                                    .sort(([, aCust]: any, [, bCust]: any) => {
                                                                        const aRoom = getRoomLabelFromCustomer(aCust);
                                                                        const bRoom = getRoomLabelFromCustomer(bCust);
                                                                        return aRoom.localeCompare(bRoom, undefined, { numeric: true, sensitivity: 'base' });
                                                                    })
                                                                    .map(
                                                                        ([custId, cust]: any) => {
                                                                    const totals = calcTotals(cust);
                                                                    if (totals.total === 0) return null;

                                                                    const custKey = `${groupKeyId}-${custId}`;
                                                                    const activeBucket = expandedCustomers.get(custKey);
                                                                    const filteredInvoices = cust.invoices.filter(
                                                                        (inv: any) =>
                                                                            activeBucket === 'total' ||
                                                                            getBucket(getDueDate(inv)) === activeBucket
                                                                    );

                                                                    const filteredWallets = cust.wallets.filter(
                                                                        (w: any) =>
                                                                            activeBucket === 'total' ||
                                                                            getBucket(w.walletDate) === activeBucket
                                                                    );

                                                                    return (
                                                                        <Fragment key={custKey}>
                                                                            <tr>
                                                                                <td className="ps-5">
                                                                                    {getRoomLabelFromCustomer(cust) && (
                                                                                        <span className="text-muted me-2">
                                                                                            {getRoomLabelFromCustomer(cust)}
                                                                                        </span>
                                                                                    )}
                                                                                    {cust.name} {" "}
                                                                                    {groupKey}
                                                                                    {/* {getShortName(Number(cust?.invoices[0]?.invoiceTo))
                                                                                        ||
                                                                                        getLabelByValue(
                                                                                            INVOICE_TO_TYPE_LIST,
                                                                                            cust?.invoices[0]?.invoiceTo
                                                                                        ) || ""} */}

                                                                                </td>

                                                                                {['current', 'days1to30', 'days31to60', 'days61to90', 'days90plus', 'total'].map(k => (
                                                                                    <td
                                                                                        key={k}
                                                                                        onClick={() => toggleAgeingView(custKey, k)}
                                                                                        className="cursor-pointer hover-underline text-end"
                                                                                    >
                                                                                        £{formatMoney(totals[k].toFixed(2))}
                                                                                        {activeBucket === k && (
                                                                                            <Icon icon="ArrowDropUp" className="ms-1" />
                                                                                        )}
                                                                                    </td>

                                                                                ))}

                                                                            </tr>

                                                                            {/* EXPANDED DETAIL */}
                                                                            {activeBucket && (
                                                                                <tr>
                                                                                    <td colSpan={7} className="ps-5 p-0">
                                                                                        <table className="table  table-modern mb-0">
                                                                                            <thead className="table-light">
                                                                                                <tr>
                                                                                                    <th>Date</th>
                                                                                                    <th>Invoice No</th>
                                                                                                    <th>Transaction Type</th>
                                                                                                    <th>Due Date</th>
                                                                                                    <th className='text-end'>Total</th>
                                                                                                    <th className='text-end'>Open Balance</th>
                                                                                                    {/* <th>Ageing</th> */}
                                                                                                </tr>
                                                                                            </thead>
                                                                                            <tbody>
                                                                                                {/* NO DATA */}
                                                                                                {filteredInvoices.length === 0 && filteredWallets.length === 0 && (
                                                                                                    <tr>
                                                                                                        <td colSpan={7} className="text-center text-muted py-3">
                                                                                                            No data found
                                                                                                        </td>
                                                                                                    </tr>
                                                                                                )}

                                                                                                {/* INVOICES */}
                                                                                                {filteredInvoices.map((inv: any, i: number) => (
                                                                                                    <tr key={`i-${i}`} onClick={() =>
                                                                                                        onRowClick({
                                                                                                            inv,
                                                                                                            residentId: inv.id || null,
                                                                                                        })
                                                                                                    }
                                                                                                    >
                                                                                                        <td>{moment(inv.invoiceDate).format('DD MMM YYYY')}</td>
                                                                                                        <td>{inv.code}</td>
                                                                                                        <td>{getLabelByValue(INVOICE_TYPE_LIST, inv.type)}</td>
                                                                                                        <td>
                                                                                                            {moment(inv.invoiceDate)
                                                                                                                .add(inv.dueDay || 0, 'days')
                                                                                                                .format('DD MMM YYYY')}
                                                                                                        </td>
                                                                                                        <td className='text-end'>£{formatMoney(inv.totalPrice)}</td>
                                                                                                        <td className='text-end'>£{formatMoney(getInvoiceOpenBalance(inv))}</td>

                                                                                                        {/* <td>{activeBucket.replace('days', '').toUpperCase()}</td> */}
                                                                                                    </tr>
                                                                                                ))}

                                                                                                {/* CREDIT WALLETS */}
                                                                                                {filteredWallets.map((w: any, i: number) => (
                                                                                                    <tr key={`w-${i}`} className="table-warning"
                                                                                                        onClick={() =>
                                                                                                            onRowClick({
                                                                                                                w,
                                                                                                                residentId: w.id || null,
                                                                                                            })}>
                                                                                                        <td>{moment(w.walletDate).format('DD MMM YYYY')}</td>
                                                                                                        <td>{w.code}</td>
                                                                                                        <td>Credit Note</td>
                                                                                                        <td>-</td>
                                                                                                        <td className="text-danger text-end">
                                                                                                            -£{formatMoney(w.creditAmount)}
                                                                                                        </td>
                                                                                                        <td className="text-danger text-end">
                                                                                                            -£{formatMoney(w.remainingAmount)}
                                                                                                        </td>
                                                                                                        {/* <td>{activeBucket.replace('days', '').toUpperCase()}</td> */}
                                                                                                    </tr>
                                                                                                ))}
                                                                                            </tbody>

                                                                                        </table>
                                                                                    </td>
                                                                                </tr>
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
                            })}
                            <tr className="table-success fw-bold">
                                <td>Grand Total</td>
                                <td className='text-end'>£{formatMoney(grandTotals.current)}</td>
                                <td className='text-end'>£{formatMoney(grandTotals.days1to30)}</td>
                                <td className='text-end'>£{formatMoney(grandTotals.days31to60)}</td>
                                <td className='text-end'>£{formatMoney(grandTotals.days61to90)}</td>
                                <td className='text-end'>£{formatMoney(grandTotals.days90plus)}</td>
                                <td className='text-end'>£{formatMoney(grandTotals.total)}</td>

                            </tr>
                        </>
                    )}

                </tbody>
            </table>
        </>

    );
};
