import moment from 'moment';
import { Fragment, useMemo, useState } from 'react';
import {
    CREDIT_TYPE_LIST,
    INVOICE_TYPE_LIST
} from '../../../../../common/data/option';
import Icon from '../../../../../components/icon';
import { useMasterData } from '../../../../../contexts/mastersContext';
import { formatMoney, getLabelByValue } from '../../../../../helpers/helpers';
import { getShortName } from '../../../../../helpers/residentInvoiceAddress';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

/* ======================================================
   COMPONENT
====================================================== */

export const AR_AgeingDetail = ({
    reportsList = [],
    isLoading,
    onRowClick,
}: any) => {
    const { localAuthorityList, localICBList } = useMasterData();

    const [expandedSections, setExpandedSections] = useState<any>({
        current: true,
        days1to30: true,
        days31to60: true,
        days61to90: true,
        days90plus: true,
    });

    const toggleSection = (key: string) =>
        setExpandedSections((p: any) => ({ ...p, [key]: !p[key] }));

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

    /** Invoice open balance */
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

    const getRoomLabelFromInvoice = (inv: any) => {
        if (!inv?.roomData) return '';
        return (
            inv.roomData.roomNumber ||
            inv.roomData.roomNo ||
            inv.roomData.name ||
            ''
        );
    };

    /* ======================================================
       AGEING GROUPS
    ====================================================== */

    const ageingGroups = useMemo(() => {
        const groups: any = {
            current: { invoices: [], wallets: [] },
            days1to30: { invoices: [], wallets: [] },
            days31to60: { invoices: [], wallets: [] },
            days61to90: { invoices: [], wallets: [] },
            days90plus: { invoices: [], wallets: [] },
        };

        const today = moment();

        reportsList.forEach((report: any) => {
            /* -------- INVOICES -------- */
            (report.invoices || []).forEach((inv: any) => {
                const due = getDueDate(inv);
                if (!due) return;

                const diff = today.diff(due, 'days');
                const bucket =
                    diff <= 0
                        ? 'current'
                        : diff <= 30
                            ? 'days1to30'
                            : diff <= 60
                                ? 'days31to60'
                                : diff <= 90
                                    ? 'days61to90'
                                    : 'days90plus';

                groups[bucket].invoices.push({
                    ...inv,
                    personal: report.personal,
                    residentId: report.id,
                    dueDate: due,
                });
            });

            /* -------- CREDIT WALLETS -------- */
            (report.creditWallets || []).forEach((w: any) => {
                const date = getWalletDate(w);
                if (!date) return;

                const remaining = getWalletRemaining(w);
                if (remaining <= 0) return;

                const diff = today.diff(date, 'days');
                const bucket =
                    diff <= 0
                        ? 'current'
                        : diff <= 30
                            ? 'days1to30'
                            : diff <= 60
                                ? 'days31to60'
                                : diff <= 90
                                    ? 'days61to90'
                                    : 'days90plus';

                groups[bucket].wallets.push({
                    ...w,
                    remainingAmount: remaining,
                    personal: report.personal,
                    walletDate: date,
                });
            });
        });

        Object.values(groups).forEach((grp: any) => {
            grp.invoices.sort((a: any, b: any) => {
                const aRoom = getRoomLabelFromInvoice(a);
                const bRoom = getRoomLabelFromInvoice(b);
                return aRoom.localeCompare(bRoom, undefined, { numeric: true, sensitivity: 'base' });
            });
        });

        return groups;
    }, [reportsList]);

    /* ======================================================
       UI CONFIG
    ====================================================== */

    const sections = [
        { key: 'days90plus', label: '91+ Days Overdue' },
        { key: 'days61to90', label: '61–90 Days Overdue' },
        { key: 'days31to60', label: '31–60 Days Overdue' },
        { key: 'days1to30', label: '1–30 Days Overdue' },
        { key: 'current', label: 'Current (Not Due)' },
    ];
    const ageingGrandTotals = useMemo(() => {
        let amount = 0;
        let balance = 0;

        Object.values(ageingGroups).forEach((grp: any) => {
            const invoiceAmount = grp.invoices.reduce(
                (s: number, i: any) => s + Number(i.totalPrice || 0),
                0
            );

            const creditAmount = grp.wallets.reduce(
                (s: number, w: any) => s + Number(w.creditAmount || 0),
                0
            );

            const invoiceOpen = grp.invoices.reduce(
                (s: number, i: any) => s + getInvoiceOpenBalance(i),
                0
            );

            const creditRemaining = grp.wallets.reduce(
                (s: number, w: any) => s + Number(w.remainingAmount || 0),
                0
            );

            amount += invoiceAmount - creditAmount;
            balance += invoiceOpen - creditRemaining;
        });

        return { amount, balance };
    }, [ageingGroups]);


    /* ======================================================
       RENDER
    ====================================================== */
    const hasReportData = (reportsList: any[]): boolean => {
        if (!Array.isArray(reportsList) || reportsList.length === 0) return false;

        return reportsList.some((r) =>
            (r.invoices && r.invoices.length > 0) ||
            (r.creditWallets && r.creditWallets.length > 0)
        );
    };

    const exportToExcel = () => {
        if (!hasReportData(reportsList)) {
            alert('No data to export');
            return;
        }

        const excelRows: any[] = [];

        sections.forEach(({ key, label }) => {
            const { invoices, wallets } = ageingGroups[key];
            if (!invoices.length && !wallets.length) return;

            // ---- Section Header ----
            excelRows.push({
                Date: label,
                Type: '',
                Customer: '',
                'Due Date': '',
                Amount: '',
                'Open Balance': '',
            });

            /* ---------------- INVOICES ---------------- */
            invoices.forEach((inv: any) => {
                excelRows.push({
                    Date: moment(inv.invoiceDate).format('DD/MM/YYYY'),
                    Type: getLabelByValue(INVOICE_TYPE_LIST, inv.type),
                    Customer: `${getRoomLabelFromInvoice(inv)} ${inv.personal?.name} ${LA_MAP[inv.fundTypeId] ||
                        CHC_MAP[inv.fundTypeId] ||
                        getShortName(inv.invoiceTo)
                        }`,
                    'Due Date': moment(inv.dueDate).format('DD/MM/YYYY'),
                    Amount: formatMoney(inv.totalPrice || 0),
                    'Open Balance': formatMoney(getInvoiceOpenBalance(inv)),
                });
            });

            /* ---------------- CREDIT NOTES ---------------- */
            wallets.forEach((w: any) => {
                excelRows.push({
                    Date: moment(w.walletDate).format('DD/MM/YYYY'),
                    Type: getLabelByValue(CREDIT_TYPE_LIST, w.type),
                    Customer: `${w.personal?.name} ${LA_MAP[w.fundTypeId] ||
                        CHC_MAP[w.fundTypeId] ||
                        getShortName(w.creditTo)
                        }`,
                    'Due Date': '',
                    Amount: `-${formatMoney(w.creditAmount || 0)}`,
                    'Open Balance': `-${formatMoney(w.remainingAmount || 0)}`,

                });
            });

            // ---- Section Total ----
            const invoiceTotal = invoices.reduce(
                (s: number, i: any) => s + Number(i.totalPrice || 0),
                0
            );

            const creditTotal = wallets.reduce(
                (s: number, w: any) => s + Number(w.creditAmount || 0),
                0
            );

            const invoiceOpen = invoices.reduce(
                (s: number, i: any) => s + getInvoiceOpenBalance(i),
                0
            );

            const creditRemaining = wallets.reduce(
                (s: number, w: any) => s + Number(w.remainingAmount || 0),
                0
            );

            excelRows.push({
                Date: `${label} Total`,
                Type: '',
                Customer: '',
                'Due Date': '',
                Amount: formatMoney(invoiceTotal - creditTotal),
                'Open Balance': formatMoney(invoiceOpen - creditRemaining),

            });

            excelRows.push({}); // spacer row
        });

        // ---- Grand Total ----
        excelRows.push({
            Date: 'GRAND TOTAL',
            Type: '',
            Customer: '',
            'Due Date': '',
            Amount: formatMoney(ageingGrandTotals.amount),
            'Open Balance': formatMoney(ageingGrandTotals.balance),

        });

        /* =========================
           CREATE WORKBOOK
        ========================= */
        const worksheet = XLSX.utils.json_to_sheet(excelRows, {
            header: ['Date', 'Type', 'Customer', 'Due Date', 'Amount', 'Open Balance'],
        });

        worksheet['!cols'] = [
            { wch: 18 },
            { wch: 18 },
            { wch: 40 },
            { wch: 16 },
            { wch: 16 },
            { wch: 18 },
        ];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'AR Ageing');

        const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

        saveAs(
            new Blob([buffer], { type: 'application/octet-stream' }),
            `AR_Ageing_${moment().format('YYYYMMDD_HHmmss')}.xlsx`
        );
    };


    return (
        <>
            <div className="text-end mb-3">
                <button className="btn btn-success" onClick={exportToExcel}>
                    <Icon icon="Download" /> Export Excel
                </button>
            </div>

            <table className="table table-modern table-hover">
                <thead>
                    <tr>
                        <th>DATE</th>
                        <th>TYPE</th>
                        <th>CUSTOMER</th>
                        <th>DUE DATE</th>
                        <th className='text-end'>AMOUNT</th>
                        <th className='text-end'>OPEN BALANCE</th>
                    </tr>
                </thead>

                <tbody>
                    {isLoading ? (
                        <tr>
                            <td colSpan={6} className="text-center">Loading…</td>
                        </tr>
                    ) : !hasReportData(reportsList) ? (
                        <tr>
                            <td colSpan={6} className="text-center text-muted py-4">
                                No data available
                            </td>
                        </tr>
                    ) : (
                        <>
                            {sections.map(({ key, label }) => {
                                const { invoices, wallets } = ageingGroups[key];
                                if (!invoices.length && !wallets.length) return null;

                                /* ===== TOTALS ===== */

                                // INVOICE TOTAL (original)
                                const invoiceAmountTotal = invoices.reduce(
                                    (s: number, i: any) => s + Number(i.totalPrice || 0),
                                    0
                                );

                                // CREDIT TOTAL (original credit)
                                const creditAmountTotal = wallets.reduce(
                                    (s: number, w: any) => s + Number(w.creditAmount || 0),
                                    0
                                );

                                // 👉 AMOUNT = Invoice total - Credit total
                                const amountTotal = invoiceAmountTotal - creditAmountTotal;

                                // INVOICE OPEN BALANCE (after payments)
                                const invoiceOpenTotal = invoices.reduce(
                                    (s: number, i: any) => s + getInvoiceOpenBalance(i),
                                    0
                                );

                                // CREDIT REMAINING (unused credit)
                                const creditRemainingTotal = wallets.reduce(
                                    (s: number, w: any) => s + Number(w.remainingAmount || 0),
                                    0
                                );

                                // 👉 OPEN BALANCE = Invoice open - Remaining credit
                                const openBalanceTotal = invoiceOpenTotal - creditRemainingTotal;

                                return (
                                    <Fragment key={key}>
                                        {/* SECTION HEADER */}
                                        <tr
                                            className="table-primary fw-bold cursor-pointer"
                                            onClick={() => toggleSection(key)}
                                        >
                                            <td colSpan={4}>
                                                <Icon
                                                    icon={
                                                        expandedSections[key]
                                                            ? 'ArrowDropUp'
                                                            : 'ArrowDropDown'
                                                    }
                                                />{' '}
                                                {label}
                                            </td>
                                            <td className='text-end'>£{formatMoney(amountTotal)}</td>
                                            <td className='text-end'>£{formatMoney(openBalanceTotal)}</td>

                                        </tr>

                                        {/* INVOICES */}
                                        {expandedSections[key] &&
                                            invoices.map((inv: any, i: number) => (
                                                <tr key={`inv-${i}`}
                                                    onClick={() =>
                                                        onRowClick({
                                                            inv,
                                                            residentId: inv.id || null,
                                                        })
                                                    }
                                                >
                                                    <td>{moment(inv.invoiceDate).format('DD MMM YYYY')}</td>
                                                    <td>{getLabelByValue(INVOICE_TYPE_LIST, inv.type)}</td>
                                                    <td>
                                                        {getRoomLabelFromInvoice(inv) && (
                                                            <span className="text-muted me-2">
                                                                {getRoomLabelFromInvoice(inv)}
                                                            </span>
                                                        )}
                                                        {inv.personal?.name}

                                                        <span className="text-muted ms-1">

                                                            {LA_MAP[inv.fundTypeId] ||
                                                                CHC_MAP[inv.fundTypeId] ||
                                                                getShortName(inv.invoiceTo)}

                                                        </span>
                                                    </td>
                                                    <td>{moment(inv.dueDate).format('DD MMM YYYY')}</td>
                                                    <td className='text-end'>£{formatMoney(inv.totalPrice)}</td>
                                                    <td className='text-end'>£{formatMoney(getInvoiceOpenBalance(inv))}</td>

                                                </tr>
                                            ))}

                                        {/* CREDIT NOTES */}
                                        {expandedSections[key] &&
                                            wallets.map((w: any, i: number) => (
                                                <tr key={`w-${i}`} className="table-warning"
                                                    onClick={() =>
                                                        onRowClick({
                                                            w,
                                                            residentId: w.id || null,
                                                        })}>
                                                    <td>{moment(w.walletDate).format('DD MMM YYYY')}</td>
                                                    <td>{getLabelByValue(CREDIT_TYPE_LIST, w.type)}</td>
                                                    <td>{w.personal?.name}
                                                        <span className="text-muted ms-2">
                                                            {LA_MAP[w.fundTypeId] ||
                                                                CHC_MAP[w.fundTypeId] ||
                                                                getShortName(w.creditTo)}
                                                        </span>
                                                    </td>
                                                    <td>-</td>
                                                    <td className="text-danger text-end">
                                                        -£{formatMoney(w.creditAmount)}
                                                    </td>
                                                    <td className="text-danger text-end">
                                                        -£{formatMoney(w.remainingAmount)}
                                                    </td>

                                                </tr>
                                            ))}
                                    </Fragment>
                                );
                            })}
                            <tr className="fw-bold table-success">
                                <td colSpan={4}>Grand Total</td>
                                <td className='text-end'>£{formatMoney(ageingGrandTotals.amount)}</td>
                                <td className='text-end'>£{formatMoney(ageingGrandTotals.balance)}</td>

                            </tr>
                        </>
                    )}


                </tbody>
            </table>
        </>

    );
};
