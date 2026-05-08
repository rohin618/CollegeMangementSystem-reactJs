import React, { Fragment, useMemo, useState } from 'react';
import moment from 'moment';
import Icon from '../../../../../components/icon';
import { Button } from '../../../../../components/bootstrap';
import { INVOICE_TO_TYPE } from '../../../../../common/constant';
import { INVOICE_TO_TYPE_LIST } from '../../../../../common/data/option';
import { formatMoney, getLabelByValue } from '../../../../../helpers/helpers';
import { useMasterData } from '../../../../../contexts/mastersContext';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

/* ======================================================
   HELPER - Generate months for a specific year
====================================================== */

const getMonthsForYear = (year: number) =>
    Array.from({ length: 12 }, (_, i) =>
        moment().year(year).month(i).format('MMM-YY')
    );

const emptyMonths = (months: string[]) =>
    months.reduce((a: any, m) => {
        a[m] = 0;
        return a;
    }, {});

/* ======================================================
   HELPER FUNCTIONS
====================================================== */

const getFundName = (
    invoiceTo: number,
    fundTypeId: any,
    localAuthorityList: any[],
    localICBList: any[]
): string => {
    const typeLabel = getLabelByValue(INVOICE_TO_TYPE_LIST, invoiceTo);

    if (invoiceTo === INVOICE_TO_TYPE.LA) {
        return (
            localAuthorityList.find((l: any) => l.id === fundTypeId)?.shortName ||
            `${typeLabel} List`
        );
    }

    if (invoiceTo === INVOICE_TO_TYPE.CHC) {
        return (
            localICBList.find((l: any) => l.id === fundTypeId)?.shortName ||
            `${typeLabel} List`
        );
    }

    return `${typeLabel} List`;
};

/* ======================================================
   COMPONENT
====================================================== */

export const IncomeAnalysisReport = ({
    reportsList = [],
    isLoading,
    year,
}: any) => {
    const { localAuthorityList = [], localICBList = [] } = useMasterData();
    const [expanded, setExpanded] = useState<any>({});

    // Generate months based on selected year
    const MONTHS = useMemo(() => getMonthsForYear(year), [year]);

    const toggle = (k: string) =>
        setExpanded((p: any) => ({ ...p, [k]: !p[k] }));

    /* ======================================================
       BUILD TREE DATA WITH TYPE → FUND → MONTHLY AMOUNTS
    ====================================================== */

    const tree = useMemo(() => {
        const t: any = {};

        reportsList.forEach((r: any) => {
            (r.invoices || []).forEach((inv: any) => {
                if (!inv.invoiceDate) return;

                const d = moment(inv.invoiceDate);
                if (d.year() !== year) return;

                const m = d.format('MMM-YY');
                const amt = Number(inv.totalPrice || 0);

                // Get type label
                const type = getLabelByValue(INVOICE_TO_TYPE_LIST, inv.invoiceTo) || 'Unknown';

                // Initialize type if not exists
                if (!t[type]) {
                    t[type] = {
                        funds: {},
                        total: emptyMonths(MONTHS),
                    };
                }

                // Get fund name
                const fund = getFundName(
                    inv.invoiceTo,
                    inv.fundTypeId,
                    localAuthorityList,
                    localICBList
                );

                // Initialize fund if not exists
                if (!t[type].funds[fund]) {
                    t[type].funds[fund] = emptyMonths(MONTHS);
                }

                // Add amount to fund and type total
                t[type].funds[fund][m] = (t[type].funds[fund][m] || 0) + amt;
                t[type].total[m] = (t[type].total[m] || 0) + amt;
            });
        });

        return t;
    }, [reportsList, year, localAuthorityList, localICBList, MONTHS]);

    /* ======================================================
       CALCULATE TOTALS
    ====================================================== */

    const rowTotal = (row: any) =>
        MONTHS.reduce((s, m) => s + (row[m] || 0), 0);

    const grandTotals = useMemo(() => {
        const totals = emptyMonths(MONTHS);
        Object.values(tree).forEach((typeData: any) => {
            MONTHS.forEach((m) => {
                totals[m] += typeData.total[m] || 0;
            });
        });
        return totals;
    }, [tree, MONTHS]);

    /* ======================================================
       CHECK IF DATA EXISTS
    ====================================================== */

    const hasReportData = (reportsList: any[]): boolean => {
        if (!Array.isArray(reportsList) || reportsList.length === 0) return false;
        return reportsList.some((r) => r.invoices && r.invoices.length > 0);
    };

    /* ======================================================
       EXCEL EXPORT
    ====================================================== */

    const exportIncomeAnalysis = () => {
        if (!hasReportData(reportsList)) {
            alert('No data to export');
            return;
        }

        const rows: any[] = [];

        // Export each type and its funds
        Object.entries(tree).forEach(([type, typeData]: any) => {
            // Type header
            rows.push({
                Category: type,
                ...MONTHS.reduce((a: any, m) => {
                    a[m] = '';
                    return a;
                }, {}),
                Total: '',
            });

            // Fund rows
            Object.entries(typeData.funds).forEach(([fund, fundData]: any) => {
                const row: any = { Category: `  ${fund}` };
                MONTHS.forEach((m) => {
                    row[m] = `£${formatMoney(fundData[m])}`;
                });
                row.Total = `£${formatMoney(rowTotal(fundData))}`;
                rows.push(row);
            });

            // Type total
            const typeTotalRow: any = { Category: `${type} Total` };
            MONTHS.forEach((m) => {
                typeTotalRow[m] = `£${formatMoney(typeData.total[m])}`;
            });
            typeTotalRow.Total = `£${formatMoney(rowTotal(typeData.total))}`;
            rows.push(typeTotalRow);

            // Empty row for spacing
            rows.push({
                Category: '',
                ...MONTHS.reduce((a: any, m) => {
                    a[m] = '';
                    return a;
                }, {}),
                Total: '',
            });
        });

        // Grand total row
        const grandTotalRow: any = { Category: 'GRAND TOTAL' };
        MONTHS.forEach((m) => {
            grandTotalRow[m] = `£${formatMoney(grandTotals[m])}`;
        });
        grandTotalRow.Total = `£${formatMoney(rowTotal(grandTotals))}`;
        rows.push(grandTotalRow);

        const worksheet = XLSX.utils.json_to_sheet(rows, {
            header: ['Category', ...MONTHS, 'Total'],
        });

        // Set column widths
        worksheet['!cols'] = [
            { wch: 30 }, // Category
            ...MONTHS.map(() => ({ wch: 12 })), // Month columns
            { wch: 15 }, // Total
        ];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Income Analysis');

        const buffer = XLSX.write(workbook, {
            bookType: 'xlsx',
            type: 'array',
        });

        saveAs(
            new Blob([buffer], { type: 'application/octet-stream' }),
            `Income_Analysis_${year}_${moment().format('YYYYMMDD_HHmmss')}.xlsx`
        );
    };

    /* ======================================================
       RENDER
    ====================================================== */

    return (
        <>
            <div className="text-end mb-3">
                <Button color="success" onClick={exportIncomeAnalysis}>
                    <Icon icon="Download" /> Export Excel
                </Button>
            </div>

            <table className="table table-modern table-hover align-middle">
                <thead className="table-primary">
                    <tr>
                        <th style={{ minWidth: 220 }}>Category</th>
                        {MONTHS.map((m) => (
                            <th key={m} className="text-end">
                                {m}
                            </th>
                        ))}
                        <th className="text-end">Total</th>
                    </tr>
                </thead>

                <tbody>
                    {isLoading ? (
                        <tr>
                            <td colSpan={MONTHS.length + 2} className="text-center">
                                Loading…
                            </td>
                        </tr>
                    ) : !hasReportData(reportsList) ? (
                        <tr>
                            <td colSpan={MONTHS.length + 2} className="text-center text-muted py-4">
                                No data available
                            </td>
                        </tr>
                    ) : (
                        <>
                            {Object.entries(tree).map(([type, typeData]: any) => {
                                const typeKey = `type-${type}`;
                                const hasFunds = Object.keys(typeData.funds).length > 0;

                                return (
                                    <Fragment key={typeKey}>
                                        {/* TYPE HEADER */}
                                        <tr
                                            className="table-primary fw-bold cursor-pointer"
                                            onClick={() => toggle(typeKey)}
                                        >
                                            <td>
                                                <Icon
                                                    icon={
                                                        expanded[typeKey]
                                                            ? 'ArrowDropUp'
                                                            : 'ArrowDropDown'
                                                    }
                                                />{' '}
                                                {type}
                                            </td>
                                            {MONTHS.map((m) => (
                                                <td key={m} className="text-end">
                                                    £{formatMoney(typeData.total[m])}
                                                </td>
                                            ))}
                                            <td className="text-end">
                                                £{formatMoney(rowTotal(typeData.total))}
                                            </td>
                                        </tr>

                                        {/* FUND ROWS */}
                                        {expanded[typeKey] &&
                                            hasFunds &&
                                            Object.entries(typeData.funds).map(
                                                ([fund, fundData]: any) => (
                                                    <tr key={`${typeKey}-${fund}`}>
                                                        <td className="ps-4">{fund}</td>
                                                        {MONTHS.map((m) => (
                                                            <td key={m} className="text-end">
                                                                £{formatMoney(fundData[m])}
                                                            </td>
                                                        ))}
                                                        <td className="text-end">
                                                            £{formatMoney(rowTotal(fundData))}
                                                        </td>
                                                    </tr>
                                                )
                                            )}
                                    </Fragment>
                                );
                            })}

                            {/* GRAND TOTAL */}
                            <tr className="table-success fw-bold">
                                <td>Grand Total</td>
                                {MONTHS.map((m) => (
                                    <td key={m} className="text-end">
                                        £{formatMoney(grandTotals[m])}
                                    </td>
                                ))}
                                <td className="text-end">
                                    £{formatMoney(rowTotal(grandTotals))}
                                </td>
                            </tr>
                        </>
                    )}
                </tbody>
            </table>
        </>
    );
};