import * as XLSX from "xlsx-js-style";
import moment, { fn } from "moment";
import { BLOCK_BEDS_TYPE, INCONT_STATUS_TYPE, INVOICE_STATUS, INVOICE_TO_TYPE, PLACEMENT_TYPE, RESPITE_STATUS_TYPE } from "../../common/constant";
import {
    CREDIT_TYPE_STAUS_LIST,
    INVOICE_STATUS_TYPE_LIST,
    INVOICE_TO_TYPE_LIST,
    PAYMENT_METHOD_LIST,
    PLACEMENT_LIST,
} from "../../common/data/option";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
    findRoomAndBedByid,
    getActiveFundDetailsByLAOrICB,
    getActiveResidentRoomPriceDetails,
    getActiveRespiteDetails,
    getActiveWeekInfoByEndDate,
    getCreditWalletsByPaymentId,
    getLabelByValue,
    getNearestByEndDateOrTodayOverLap,
    getResidentInvoiceAddress,
    getResidetByAllAvilableFundList,
    getUserMappedCompany,
    priceFormat,
    resolvePaymentStatus,
} from "../helpers";

/* ================================================================
   CONSTANTS
   ================================================================ */

const VALID_FUNDS = [
    INVOICE_TO_TYPE.CHC,
    INVOICE_TO_TYPE.LA,
    INVOICE_TO_TYPE.THIRD_PARTY_TOPUP,
];

const HEADER_STYLE = {
    font: { bold: true },
    alignment: { horizontal: "center", vertical: "center" },
    fill: { fgColor: { rgb: "E8EDF3" } },
    border: {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
    },
};

const TOTAL_STYLE = {
    font: { bold: true },
    fill: { fgColor: { rgb: "D9EAD3" } },
    border: {
        top: { style: "thin" },
        bottom: { style: "double" },
        left: { style: "thin" },
        right: { style: "thin" },
    },
    alignment: { horizontal: "right" },
};

const TOTAL_LABEL_STYLE = { ...TOTAL_STYLE, alignment: { horizontal: "left" } };

/* ================================================================
   SHARED HELPERS
   ================================================================ */

const sanitizeText = (value = "") =>
    value.replace(/[\\/:*?"<>|[\]]/g, "").substring(0, 31);

const getPendingAmount = (invoices: any[] = []) =>
    invoices
        .filter((inv) => inv.status === INVOICE_STATUS.PENDING)
        .reduce((sum, inv) => sum + Number(inv.totalPrice || 0), 0);

const getInvoiceStatus = (invoice: any) => {
    const invoiceDate = moment(invoice?.invoiceDate, "YYYY-MM-DD");
    const dueDate = moment(invoiceDate).add(Number(invoice?.dueDay || 0), "days");
    const today = moment();
    const totalPaid =
        invoice?.payedInfo?.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0) ?? 0;

    if (totalPaid >= Number(invoice?.totalPrice || 0))
        return { label: "Paid", type: "success", dueDate: dueDate.format("DD MMM YYYY") };

    if (today.isAfter(dueDate, "day")) {
        const days = today.diff(dueDate, "days");
        return { label: `Overdue (${days} day${days > 1 ? "s" : ""})`, type: "danger", dueDate: dueDate.format("DD MMM YYYY") };
    }

    if (today.isBetween(invoiceDate, dueDate, "day", "[]"))
        return { label: "Current", type: "warning", dueDate: dueDate.format("DD MMM YYYY") };

    return { label: "-", type: "secondary", dueDate: dueDate.format("DD MMM YYYY") };
};

const resolveInvoiceStatusLabel = (invoice: any): string => {
    const s = getInvoiceStatus(invoice);
    return s.label.startsWith("Overdue") ? s.label : getLabelByValue(INVOICE_STATUS_TYPE_LIST, invoice.status) ?? "";
};

/* ================================================================
   CELL FACTORIES
   ─────────────────────────────────────────────────────────────────
   WHY THIS MATTERS FOR FILTERS:
   Excel's column filter groups values by their *cell type*, not by
   display text.  If a date is stored as t:"s" (string) it appears
   as a plain text entry in the filter — no day/month/year grouping,
   no "Filter by date" submenu, and text-sort instead of date-sort.

   Fix:
     • Date columns  → t:"n" + Excel serial number + z format (works in Excel & Google Sheets)
     • Money columns → t:"n"  +  z format string  (real number)
     • Everything else → t:"s"                    (plain text)
   ================================================================ */

/** Plain text cell — codes, names, labels. Never mis-parsed. */
const strCell = (value: unknown): object => ({
    v: String(value ?? ""),
    t: "s",
    s: {},
});

/**
 * Date cell — compatible with Excel AND Google Sheets.
 *
 * WHY t:"n" instead of t:"d":
 *   xlsx-js-style's t:"d" works in desktop Excel but Google Sheets
 *   ignores the date type on import and renders the JS Date object as
 *   a plain string, breaking filter grouping entirely.
 *
 *   The universally-compatible approach is to store the value as an
 *   Excel date serial number (t:"n") with a date format code (z).
 *   Both Excel and Google Sheets recognise this as a real date and
 *   show the year → month → day filter tree + "Filter by date" menu.
 *
 * Excel date serial = days since 1899-12-30 (epoch used by xlsx spec).
 */
const EXCEL_EPOCH = moment("1899-12-30");

const dateCell = (raw: string | null | undefined): object => {
    if (!raw) return strCell("");
    const m = moment(raw);
    if (!m.isValid()) return strCell(String(raw));
    const serial = m.diff(EXCEL_EPOCH, "days");
    return {
        v: serial,
        t: "n",
        // xlsx-js-style requires numFmt inside `s` — top-level `z` is ignored
        s: { numFmt: "DD MMM YYYY" },
    };
};

/**
 * Currency cell.
 * Stores the raw number so Excel can SUM, sort numerically, and
 * filter by value ranges.  Displays as £#,##0.00.
 */
const currencyCell = (value: number | null | undefined): object => ({
    v: Number(value ?? 0),
    t: "n",
    // xlsx-js-style requires numFmt inside `s`
    s: { numFmt: '£#,##0.00' },
});

/* ================================================================
   WORKSHEET BUILDER
   ================================================================ */

export type ColType = "text" | "date" | "currency";

interface WorksheetOptions {
    /** Column type per index — unset defaults to "text". */
    colTypes?: Record<number, ColType>;
    /** Explicit column widths. Auto-sized when omitted. */
    colWidths?: { wch: number }[];
    /**
     * Column indices to sum in a green totals row.
     * Omit (or pass []) to skip the totals row.
     */
    totalCols?: number[];
    totalLabel?: string;
}

const buildWorksheet = (rows: any[][], options: WorksheetOptions = {}): XLSX.WorkSheet => {
    const { colTypes = {}, colWidths, totalCols = [], totalLabel = "TOTAL" } = options;
    const header = rows[0];
    const dataRows = rows.slice(1);

    /* 1 ── Header row */
    const wsRows: object[][] = [
        header.map((h: any) => ({ v: String(h ?? ""), t: "s", s: HEADER_STYLE })),
    ];

    /* 2 ── Data rows with typed cells */
    dataRows.forEach((row) => {
        wsRows.push(
            row.map((cell: any, i: number) => {
                const type = colTypes[i] ?? "text";
                if (type === "date") return dateCell(cell);
                if (type === "currency") return currencyCell(cell);
                return strCell(cell);
            })
        );
    });

    /* 3 ── Totals row (green) */
    if (totalCols.length > 0) {
        wsRows.push(
            header.map((_: any, i: number) => {
                if (i === 0) return { v: totalLabel, t: "s", s: TOTAL_LABEL_STYLE };
                if (totalCols.includes(i)) {
                    const sum = dataRows.reduce((acc, row) => acc + Number(row[i] ?? 0), 0);
                    return { v: sum, t: "n", s: { ...TOTAL_STYLE, numFmt: "£#,##0.00" } };
                }
                return { v: "", t: "s", s: TOTAL_STYLE };
            })
        );
    }

    /* 4 ── Build worksheet */
    const worksheet = XLSX.utils.aoa_to_sheet(wsRows);

    /* 5 ── AutoFilter (header row only — totals row is outside the filter range) */
    const lastCol = XLSX.utils.encode_col(header.length - 1);
    const filterLastRow = dataRows.length + 1; // header + data (excludes totals)
    worksheet["!autofilter"] = { ref: `A1:${lastCol}${filterLastRow}` };

    /* 6 ── Freeze header */
    worksheet["!freeze"] = { xSplit: 0, ySplit: 1 };

    /* 7 ── Column widths */
    worksheet["!cols"] =
        colWidths ??
        header.map((_: any, i: number) => ({
            wch: Math.max(...rows.map((row) => String(row[i] ?? "").length), 15),
        }));

    return worksheet;
};

const saveWorkbook = (worksheet: XLSX.WorkSheet, sheetName: string, fileName: string) => {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sanitizeText(sheetName));
    XLSX.writeFile(workbook, fileName, { cellStyles: true });
};

/* ================================================================
   PDF UTILITIES
   ================================================================ */

const createPDFDoc = (subtitle: string): jsPDF => {
    const company = getUserMappedCompany();
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "A4" });
    const pageWidth = doc.internal.pageSize.width;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(company?.tradeName || "Company Name", 40, 40);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`${subtitle} · Generated on ${moment().format("DD MMM YYYY HH:mm")}`, 40, 58);
    doc.setDrawColor(200);
    doc.line(40, 68, pageWidth - 40, 68);
    return doc;
};

const addPageFooters = (doc: jsPDF) => {
    const { width: pageWidth, height: pageHeight } = doc.internal.pageSize;
    const pageCount = doc.getNumberOfPages();
    doc.setFontSize(8);
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - 90, pageHeight - 20);
    }
};

/* ================================================================
   SHARED DATA RESOLVERS
   ================================================================ */

const resolveFundNames = (funds: any[], localAuthorityList: any[], localICBList: any[]): string =>
    funds.map((f: any) => {
        const fundValue: any = Number(f.value);
        if (!VALID_FUNDS.includes(fundValue))
            return getLabelByValue(INVOICE_TO_TYPE_LIST, fundValue, "shortName");
        const sourceList = fundValue === INVOICE_TO_TYPE.CHC ? localICBList : localAuthorityList;
        return (f.fundTypeIds || [])
            .map((id: any) => sourceList.find((item: any) => item.id === id)?.shortName)
            .filter(Boolean)
            .join(", ");
    }).join(", ");

const resolveUniqueResidentNames = (avatars: any[]): string =>
    Array.from(
        new Map(
            (avatars ?? [])
                .filter((item: any) => item?.invoice?.residentData?.id)
                .map((item: any) => [
                    item.invoice.residentData.id,
                    item.invoice.residentData.personal?.name || "",
                ])
        ).values()
    ).join(", ");

/* ================================================================
   1. RESIDENT LIST
   date cols  : 4=DOB, 6=Admission, 7=Discharge
   money cols : 5=Weekly Price, 8=Outstanding
   ================================================================ */

const buildResidentRows = (
    residentList: any[], localAuthorityList: any[], localICBList: any[], roomsList: any[], fNCDetails: any
): any[][] => {
    const header = [
        "Resident Name", "Room", "Fund Source", "Fund Names", "DOB",
        "Weekly Price", "Admission Date", "Discharge/RIP Date",
        "Outstanding", "Status", "Payment", "Type of Placement", "FNC/INC",
    ];

    const data = residentList.map((resident) => {
        const { room, bed } = findRoomAndBedByid(roomsList, resident?.roomId, resident?.bedId);
        const roomLabel = `${room?.roomNumber || "NA"}${bed?.bedName ? `-${bed.bedName}` : ""}`;
        const recentFundDetails = getNearestByEndDateOrTodayOverLap(
            resident?.allFundDetails || []
        );

        // create a new object (DO NOT mutate original resident)
        const tempResident = {
            ...resident,
            fundDetails: recentFundDetails ? [recentFundDetails] : [],
        };

        const funds = getResidetByAllAvilableFundList(tempResident, false) || [];
        
        let weeklyPrice = 0;

        //  Priority 1: Block Beds
        if (+recentFundDetails?.blockBedStatus === BLOCK_BEDS_TYPE.YES) {
            const authorityDetails: any = getActiveFundDetailsByLAOrICB(
                recentFundDetails,
                localAuthorityList,
                localICBList
            );

            weeklyPrice =
                getNearestByEndDateOrTodayOverLap(authorityDetails?.blockBeds || [])
                    ?.perWeek ?? 0;
        } else {
            //  Priority 2: Normal Room Price
            const active =
                getActiveResidentRoomPriceDetails(resident?.roomPrice)?.perWeek;

            weeklyPrice =
                active ??
                getNearestByEndDateOrTodayOverLap(resident?.roomPrice)?.perWeek ??
                0;
        }

        const invoices = resident?.invoices || [];
        const pendingAmount = getPendingAmount(invoices);
        const creditAmount = (resident?.creditWallets || []).reduce(
            (s: number, w: any) => s + Number(w.creditAmount || 0), 0
        );
        const paymentStatus = resolvePaymentStatus(invoices);
        const statusLabel =
            resident?.admission?.residentStatus === 1 ? "Active"
                : resident?.admission?.residentStatus === 2 ? "Inactive" : "Discharged";

        // Type of placement Logic
        const activeRespite = getActiveRespiteDetails(resident?.admission?.respiteStatusList);

        const placementType = activeRespite
            ? +activeRespite?.status === RESPITE_STATUS_TYPE.EXTENDED_WITH_PERMANENT
                ? PLACEMENT_TYPE.PERMANENT
                : PLACEMENT_TYPE.RESPITE
            : +resident?.admission?.typeOfPlacement;

        // FNC / INC Logic
        const fncFund = funds.find((f: any) => +f.value === INVOICE_TO_TYPE.FNC);
        const incFund = funds.find((f: any) => +f.value === INVOICE_TO_TYPE.INCONT);

        let fncAmount = 0;

        if (fncFund) {
            const nearestOrCurrent = getNearestByEndDateOrTodayOverLap(fNCDetails?.priceInfo);
            fncAmount = nearestOrCurrent?.perWeek ?? 0;
        }
        let incAmount = 0;
        if (incFund) {
            // Step 1: Build merged incont list
            const allIncontList = resident?.fundDetails?.flatMap((f: any) => {
                if (+f?.incontStatus !== INCONT_STATUS_TYPE.YES) return [];
                return f?.incontDetails;
            });

            // Step 2: Apply nearest logic
            if (allIncontList.length) {
                const nearestIncontOrCurrent = getNearestByEndDateOrTodayOverLap(allIncontList);

                incAmount = nearestIncontOrCurrent?.perWeek ?? 0;

            }
        }
        const fncIncAmount = (Number(fncAmount) + Number(incAmount)).toFixed(2);


        return [
            resident?.personal?.name || "",                       // 0  text
            roomLabel,                                            // 1  text
            funds.map((f: any) => f.label).join(", "),            // 2  text
            resolveFundNames(funds, localAuthorityList, localICBList), // 3 text
            resident?.personal?.dob || null,                      // 4  DATE ← raw ISO
            weeklyPrice,                                          // 5  CURRENCY ← raw number
            resident?.admission?.admissionDate || null,           // 6  DATE
            resident?.admission?.dateDischargeAndRip || null,     // 7  DATE
            pendingAmount - creditAmount,                          // 8  CURRENCY
            statusLabel,                                          // 9  text
            getLabelByValue(INVOICE_STATUS_TYPE_LIST, paymentStatus) || paymentStatus, // 10 text
            getLabelByValue(PLACEMENT_LIST, placementType) || "",     // 11 text
            fncIncAmount || 0,     // 12 text
        ];
    });

    return [header, ...data];
};

export const downloadResidentListAsExcel = (
    residentList: any[], localAuthorityList: any[], localICBList: any[], roomsList: any[], fNCDetails: any
) => {
    const company = getUserMappedCompany();
    const rows = buildResidentRows(residentList, localAuthorityList, localICBList, roomsList, fNCDetails);
    const ws = buildWorksheet(rows, {
        colTypes: { 4: "date", 5: "currency", 6: "date", 7: "date", 8: "currency" },
        colWidths: [
            { wch: 22 }, { wch: 12 }, { wch: 20 }, { wch: 24 }, { wch: 14 },
            { wch: 14 }, { wch: 16 }, { wch: 18 }, { wch: 14 }, { wch: 12 }, { wch: 16 },
        ],
        totalCols: [5, 8],
    });
    saveWorkbook(ws,
        `${company?.tradeName || "Company"} Resident List`,
        `${sanitizeText(company?.tradeName || "Company")}_Resident_List_${moment().format("YYYYMMDD_HHmm")}.xlsx`
    );
};

export const downloadResidentListAsPDF = (
    residentList: any[], localAuthorityList: any[], localICBList: any[], roomsList: any[], fNCDetails: any
) => {
    const company = getUserMappedCompany();
    const doc = createPDFDoc("Resident List");
    const rows = buildResidentRows(residentList, localAuthorityList, localICBList, roomsList, fNCDetails);
    const fmt = (v: any) => v ? moment(v).format("DD MMM YYYY") : "";
    const pdfBody = rows.slice(1).map((r) => [
        r[0], r[1], r[2], r[3], fmt(r[4]), priceFormat(r[5]),
        fmt(r[6]), fmt(r[7]), priceFormat(r[8]), r[9], r[10],
    ]);
    autoTable(doc, {
        startY: 80, head: [rows[0]], body: pdfBody,
        styles: { fontSize: 8, valign: "middle" },
        headStyles: { fillColor: [232, 237, 243], textColor: 20, fontStyle: "bold" },
        columnStyles: { 5: { halign: "right" }, 8: { halign: "right" } },
        margin: { left: 40, right: 40 },
    });
    addPageFooters(doc);
    doc.save(`${sanitizeText(company?.tradeName || "Company")}_Resident_List_${moment().format("YYYYMMDD_HHmm")}.pdf`);
};

/* ================================================================
   2. INVOICE LIST
   date cols  : 4=Invoice Date
   money cols : 6=Weekly, 7=Before VAT, 8=VAT, 9=Total, 10=Paid, 11=Balance
   ================================================================ */

const buildInvoiceRows = (
    invoiceList: any[], localAuthorityList: any[], localICBList: any[], fNCDetails: any, roomsList: any[]
): any[][] => {
    const header = [
        "Resident Name", "Room", "Category", "Invoice No", "Invoice Date",
        "Period", "Weekly Price", "Amount Before VAT", "VAT Amount",
        "Invoice Amount", "Paid", "Balance Due", "Status",
    ];

    const data = invoiceList.map((invoice: any) => {
        const { room, bed } = findRoomAndBedByid(roomsList, invoice.residentData?.roomId, invoice.residentData?.bedId);
        const roomLabel = `${room?.roomNumber || "NA"}${bed?.bedName ? `-${bed.bedName}` : ""}`;
        const invoiceAddress = getResidentInvoiceAddress(
            invoice.residentData, +invoice.invoiceTo, invoice?.fundTypeId,
            { localAuthorityList, localICBList, fNCDetails }
        );
        const period = `${invoice.sDate ? moment(invoice.sDate).format("DD MMM YYYY") : ""} - ${invoice.eDate ? moment(invoice.eDate).format("DD MMM YYYY") : ""}`;

        return [
            invoice.residentData?.personal?.name || "",    // 0  text
            roomLabel,                                     // 1  text
            invoiceAddress?.shortName || "",               // 2  text
            invoice?.code || "",                           // 3  text
            invoice?.invoiceDate || null,                  // 4  DATE
            period,                                        // 5  text
            invoice?.items?.[0]?.weekPrice ?? 0,           // 6  CURRENCY
            invoice?.subTotal ?? 0,                        // 7  CURRENCY
            invoice?.vatTotal ?? 0,                        // 8  CURRENCY
            invoice?.totalPrice ?? 0,                      // 9  CURRENCY
            invoice?.payedAmount ?? 0,                     // 10 CURRENCY
            (invoice?.totalPrice ?? 0) - ((invoice?.payedAmount ?? 0) + (invoice?.creditApplyAmount ?? 0)), // 11 CURRENCY
            resolveInvoiceStatusLabel(invoice),            // 12 text
        ];
    });

    return [header, ...data];
};

export const downloadOverAllInvoiceListAsExcel = (
    invoiceList: any[], localAuthorityList: any[], localICBList: any[], fNCDetails: any, roomsList: any[]
) => {
    const company = getUserMappedCompany();
    const rows = buildInvoiceRows(invoiceList, localAuthorityList, localICBList, fNCDetails, roomsList);
    const ws = buildWorksheet(rows, {
        colTypes: { 4: "date", 6: "currency", 7: "currency", 8: "currency", 9: "currency", 10: "currency", 11: "currency" },
        colWidths: [
            { wch: 22 }, { wch: 14 }, { wch: 22 }, { wch: 16 }, { wch: 15 },
            { wch: 32 }, { wch: 16 }, { wch: 20 }, { wch: 14 }, { wch: 18 },
            { wch: 14 }, { wch: 16 }, { wch: 22 },
        ],
        totalCols: [7, 8, 9, 10, 11],
    });
    saveWorkbook(ws, "Invoices", `${company?.tradeName || "Company"}_Invoice_List.xlsx`);
};

export const downloadOverAllInvoiceListAsPDF = (
    invoiceList: any[], localAuthorityList: any[], localICBList: any[], fNCDetails: any, roomsList: any[]
) => {
    const company = getUserMappedCompany();
    const doc = createPDFDoc("Invoice List");
    const rows = buildInvoiceRows(invoiceList, localAuthorityList, localICBList, fNCDetails, roomsList);
    const fmt = (v: any) => v ? moment(v).format("DD MMM YYYY") : "";
    const pdfBody = rows.slice(1).map((r) => [
        r[0], r[1], r[2], r[3], fmt(r[4]), r[5],
        priceFormat(r[6]), priceFormat(r[7]), priceFormat(r[8]),
        priceFormat(r[9]), priceFormat(r[10]), priceFormat(r[11]), r[12],
    ]);
    autoTable(doc, {
        startY: 80, head: [rows[0]], body: pdfBody,
        styles: { fontSize: 8, cellPadding: 4 },
        headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: "bold" },
        alternateRowStyles: { fillColor: [248, 248, 248] },
        columnStyles: {
            6: { halign: "right" }, 7: { halign: "right" }, 8: { halign: "right" },
            9: { halign: "right" }, 10: { halign: "right" }, 11: { halign: "right" },
        },
        margin: { left: 40, right: 40 },
    });
    addPageFooters(doc);
    doc.save(`${company?.tradeName || "Company"}_Invoice_List.pdf`);
};

/* ================================================================
   3. PAYMENT HISTORY LIST
   date cols  : 2=Date
   money cols : 4=Amount
   ================================================================ */

const buildPaymentHistoryRows = (paymentHistoryList: any[]): any[][] => {
    const header = ["Resident Name", "Category", "Date", "Payment Ref", "Amount", "Payment Method", "Bank"];
    const data = paymentHistoryList.map((ph) => [
        resolveUniqueResidentNames(ph?.avatars ?? []), // 0 text
        ph?.address || "",                             // 1 text
        ph?.date || null,                              // 2 DATE
        ph?.refNo || "",                               // 3 text
        ph?.total ?? 0,                                // 4 CURRENCY
        ph?.paymentMethod || "",                       // 5 text
        ph?.bankName || "",                            // 6 text
    ]);
    return [header, ...data];
};

export const downloadOverAllPaymentHistoryListAsExcel = (paymentHistoryList: any[]) => {
    const company = getUserMappedCompany();
    const rows = buildPaymentHistoryRows(paymentHistoryList);
    const ws = buildWorksheet(rows, {
        colTypes: { 2: "date", 4: "currency" },
        colWidths: [{ wch: 30 }, { wch: 18 }, { wch: 16 }, { wch: 22 }, { wch: 14 }, { wch: 20 }, { wch: 20 }],
        totalCols: [4],
    });
    saveWorkbook(ws, "Payment History", `${company?.tradeName || "Company"}_Payment_History.xlsx`);
};

export const downloadOverAllPaymentHistoryListAsPDF = (paymentHistoryList: any[]) => {
    const company = getUserMappedCompany();
    const doc = createPDFDoc("Payment History");
    const rows = buildPaymentHistoryRows(paymentHistoryList);
    const fmt = (v: any) => v ? moment(v).format("DD MMM YYYY") : "";
    const pdfBody = rows.slice(1).map((r) => [r[0], r[1], fmt(r[2]), r[3], priceFormat(r[4]), r[5], r[6]]);
    autoTable(doc, {
        startY: 80, head: [rows[0]], body: pdfBody,
        styles: { fontSize: 9, cellPadding: 4, valign: "middle" },
        headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: "bold" },
        alternateRowStyles: { fillColor: [248, 248, 248] },
        columnStyles: {
            0: { cellWidth: 140 }, 1: { cellWidth: 90 }, 2: { cellWidth: 80 },
            3: { cellWidth: 110 }, 4: { cellWidth: 80, halign: "right" },
            5: { cellWidth: 110 }, 6: { cellWidth: 110 },
        },
        margin: { left: 40, right: 40 },
    });
    addPageFooters(doc);
    doc.save(`${company?.tradeName || "Company"}_Payment_History.pdf`);
};

/* ================================================================
   4. CREDIT NOTES LIST
   date cols  : 2=Date
   money cols : 4=Before VAT, 5=VAT, 6=Credit Amount
   ================================================================ */

const buildCreditNoteRows = (creditNoteList: any[]): any[][] => {
    const header = [
        "Resident Name", "Credit Note No", "Credit Note Date", "Category",
        "Amount Before VAT", "VAT Amount", "Credit Note Amount",
        "Invoice Number Linked", "Status",
    ];
    const data = creditNoteList.map((cn) => [
        cn?.residentData?.personal?.name || "",                    // 0 text
        cn?.code || "",                                            // 1 text
        cn?.date || null,                                          // 2 DATE
        cn?.invoiceAddress?.shortName || "",                       // 3 text
        cn?.subTotal ?? 0,                                         // 4 CURRENCY
        cn?.vatTotal ?? 0,                                         // 5 CURRENCY
        cn?.creditAmount ?? 0,                                     // 6 CURRENCY
        cn?.invoices?.map((inv: any) => inv?.code).filter(Boolean).join(", ") || "NA", // 7 text
        getLabelByValue(CREDIT_TYPE_STAUS_LIST, Number(cn?.status)) || "",             // 8 text
    ]);
    return [header, ...data];
};

export const downloadOverAllCreditNotesListAsExcel = (creditNoteList: any[]) => {
    const company = getUserMappedCompany();
    const rows = buildCreditNoteRows(creditNoteList);
    const ws = buildWorksheet(rows, {
        colTypes: { 2: "date", 4: "currency", 5: "currency", 6: "currency" },
        colWidths: [
            { wch: 28 }, { wch: 18 }, { wch: 18 }, { wch: 22 },
            { wch: 20 }, { wch: 16 }, { wch: 22 }, { wch: 30 }, { wch: 16 },
        ],
        totalCols: [4, 5, 6],
    });
    saveWorkbook(ws, "Credit Notes", `${company?.tradeName || "Company"}_Credit_Notes_List.xlsx`);
};

export const downloadOverAllCreditNotesListAsPDF = (creditNoteList: any[]) => {
    const company = getUserMappedCompany();
    const doc = createPDFDoc("Credit Notes List");
    const rows = buildCreditNoteRows(creditNoteList);
    const fmt = (v: any) => v ? moment(v).format("DD MMM YYYY") : "";
    const pdfBody = rows.slice(1).map((r) => [
        r[0], r[1], fmt(r[2]), r[3],
        priceFormat(r[4]), priceFormat(r[5]), priceFormat(r[6]), r[7], r[8],
    ]);
    autoTable(doc, {
        startY: 80, head: [rows[0]], body: pdfBody,
        styles: { fontSize: 8, cellPadding: 4, valign: "middle" },
        headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: "bold" },
        alternateRowStyles: { fillColor: [248, 248, 248] },
        columnStyles: {
            0: { cellWidth: 120 }, 1: { cellWidth: 90 }, 2: { cellWidth: 90 },
            3: { cellWidth: 100 }, 4: { cellWidth: 90, halign: "right" },
            5: { cellWidth: 80, halign: "right" }, 6: { cellWidth: 100, halign: "right" },
            7: { cellWidth: 150 }, 8: { cellWidth: 90 },
        },
        margin: { left: 40, right: 40 },
    });
    addPageFooters(doc);
    doc.save(`${company?.tradeName || "Company"}_Credit_Notes_List.pdf`);
};

/* ================================================================
   5. OVERALL PAYMENT LIST
   date cols  : 1=Date
   money cols : 3=Amount
   ================================================================ */

const buildPaymentListRows = (
    filteredPaymentList: any[], localAuthorityList: any[], localICBList: any[], fNCDetails: any, bankList: any[]
): any[][] => {
    const header = ["Resident Name", "Date", "Payment Ref", "Amount", "Payment Method", "Invoice To", "Bank"];
    const data = filteredPaymentList.map((invoice) => {
        const firstPayment = invoice?.payments?.[0] || {};
        const payment = firstPayment?.payment || {};
        const invoiceAddress = getResidentInvoiceAddress(
            firstPayment?.invoice?.residentData, Number(invoice?.invoiceTo), invoice?.fundTypeId,
            { localAuthorityList, localICBList, fNCDetails }
        );
        const bank = bankList.find((b: any) => b.id === payment?.bankId);
        const totalPayed = invoice.payments.reduce(
            (sum: number, cur: any) => sum + (cur.payment.amount || 0),
            0
        );
        const creditWallets = invoice.payments.map(
            ({ creditWallets }: any) => ({ creditWallets })
        );

        const creditTotal = getCreditWalletsByPaymentId(creditWallets).reduce(
            (sum: number, { creditAmount }: any) =>
                sum + (Number(creditAmount) || 0),
            0
        );
        const total = totalPayed + creditTotal;
        return [
            resolveUniqueResidentNames(invoice.payments ?? []), // 0 text
            invoice?.date || null,                              // 1 DATE
            payment?.refNo ?? "",                               // 2 text
            total ?? 0,                                         // 3 CURRENCY
            getLabelByValue(
                PAYMENT_METHOD_LIST,
                payment?.paymentMethod
            ) ?? "",                                            // 4 text
            invoiceAddress?.shortName ?? "",                    // 5 text
            bank?.bankName ?? "",                               // 6 text
        ];
    });
    return [header, ...data];
};

export const downloadOverAllPaymentListAsExcel = (
    filteredPaymentList: any[] = [], localAuthorityList: any[] = [],
    localICBList: any[] = [], fNCDetails: any, bankList: any[] = []
) => {
    const company = getUserMappedCompany();
    const rows = buildPaymentListRows(filteredPaymentList, localAuthorityList, localICBList, fNCDetails, bankList);
    const ws = buildWorksheet(rows, {
        colTypes: { 1: "date", 3: "currency" },
        colWidths: [{ wch: 22 }, { wch: 14 }, { wch: 50 }, { wch: 16 }, { wch: 18 }, { wch: 20 }, { wch: 40 }],
        totalCols: [3],
    });
    saveWorkbook(ws, "Payments", `${company?.tradeName || "Company"}_Payment_History_List.xlsx`);
};

export const downloadOverAllPaymentListAsPDF = (
    filteredPaymentList: any[] = [], localAuthorityList: any[] = [],
    localICBList: any[] = [], fNCDetails: any, bankList: any[] = []
) => {
    const company = getUserMappedCompany();
    const doc = createPDFDoc("Payment History List");
    const rows = buildPaymentListRows(filteredPaymentList, localAuthorityList, localICBList, fNCDetails, bankList);
    const fmt = (v: any) => v ? moment(v).format("DD MMM YYYY") : "";
    const pdfBody = rows.slice(1).map((r) => [r[0], fmt(r[1]), r[2], priceFormat(r[3]), r[4], r[5], r[6]]);
    autoTable(doc, {
        startY: 80, head: [rows[0]], body: pdfBody,
        styles: { fontSize: 9, cellPadding: 4, valign: "middle" },
        headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: "bold" },
        alternateRowStyles: { fillColor: [248, 248, 248] },
        columnStyles: {
            0: { cellWidth: 140 }, 1: { cellWidth: 100 }, 2: { cellWidth: 140 },
            3: { cellWidth: 90, halign: "right" }, 4: { cellWidth: 120 },
            5: { cellWidth: 100 }, 6: { cellWidth: 180 },
        },
        margin: { left: 40, right: 40 },
    });
    addPageFooters(doc);
    doc.save(`${company?.tradeName || "Company"}_Payment_History_List.pdf`);
};