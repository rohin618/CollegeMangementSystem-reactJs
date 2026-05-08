import React from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import moment from "moment";
import { Button } from "../../../../../components/bootstrap";
import Icon from "../../../../../components/icon";

import { ResidentProfileCard } from "../../../../../components/common";
import { getColorNameWithIndex } from "../../../../../common/data/enumColors";
import { useMasterData } from "../../../../../contexts/mastersContext";

import { FNC_STATUS_TYPE, INVOICE_STATUS, INVOICE_TO_TYPE, PAYMENT_STATUS } from "../../../../../common/constant";
import { formatMoney, IInvoice } from "../../../../../helpers/helpers";

export default function FNCReport({ reportsList }: any) {
    const {
        fNCDetails,
        isLoading: isMasterLoading,
    } = useMasterData();

    // -----------------------------------------
    // 🔹 CREATE FNC ROWS (ONE ROW PER RESIDENT)
    // -----------------------------------------
    const generateFNCRows = () => {
        try {
            const rows: any[] = [];

            reportsList.forEach((resident: any, index: number) => {
                const invoices = resident?.invoices || [];


                // 🔹 ONLY FNC INVOICES
                const fncInvoices: IInvoice =
                    invoices.filter(
                        (inv: any) =>
                            Number(inv.invoiceTo) === INVOICE_TO_TYPE.FNC
                    ) || [];



                const fund = resident?.fundDetails?.[0] || {};
                const name = resident?.personal?.name || "";

                const fundType =
                    Number(fund?.fundType) === 1 ? "PVT" : "LA";

                const admissionDate = resident?.admission?.admissionDate
                    ? moment(resident.admission.admissionDate).format("DD MMM YYYY")
                    : "";

                const dischargeDate = resident?.admission?.dateDischargeAndRip
                    ? moment(resident.admission.dateDischargeAndRip).format("DD MMM YYYY")
                    : "NA";

                const fncEffectiveDate =
                    fund?.fncSdate || fund?.topupEffectiveDate || null;

                const fncEffective = fncEffectiveDate
                    ? moment(fncEffectiveDate).format("DD MMM YYYY")
                    : "-";

                const fncWeeklyRate =
                    fNCDetails?.priceInfo?.[0]?.perWeek
                        ? formatMoney(fNCDetails.priceInfo[0].perWeek)
                        : "-";

                const incWeeklyRate =
                    fund?.incontDetails?.[0]?.perWeek
                        ? formatMoney(fund.incontDetails[0].perWeek)
                        : "-";

                const fncEligibility =
                    fund?.fncStatus === FNC_STATUS_TYPE.YES ? "Yes" : "No";

                const incEligibility =
                    fund?.incontStatus === FNC_STATUS_TYPE.YES ? "Yes" : "No";

                // -----------------------------------------
                // 🔹 UPDATED STATUS LOGIC (FNC ONLY)
                // -----------------------------------------
                let status = "";

                if (fncInvoices.length > 0) {
              
                    // If ANY FNC invoice is pending or partial → payment not received
                    const hasPendingFnc = fncInvoices.some(
                        (inv: any) =>
                            inv.status === INVOICE_STATUS.PENDING ||
                            inv.status === INVOICE_STATUS.PARTIAL
                    );

                    if (hasPendingFnc) {
                        status = "Invoice raised but Payment not received";
                    } else {
                        status = "Invoice raised and Payment received";
                    }
                } else {
                    // No FNC invoice → check payments
                    const anyPayment =
                        resident?.payments?.reduce(
                            (s: number, p: any) => s + Number(p.amount || 0),
                            0
                        ) > 0;

                    if (anyPayment) {
                        status = "Invoice not raised but Payment received";
                    } else {
                        status = "Invoice not raised and Payment not received";
                    }
                }

                rows.push({
                    resident,
                    index,

                    "Room No": fncInvoices?.[0]?.roomData?.roomNumber || "",
                    "Resident Name": name,
                    "Fund Type": fundType,
                    "Admission Date": admissionDate,
                    "Discharge/RIP Date": dischargeDate,
                    "FNC Effective Date": fncEffective,
                    "FNC Weekly Rate": fncWeeklyRate,
                    "INC Weekly Rate": incWeeklyRate,
                    "FNC Eligibility": fncEligibility,
                    "INC Eligibility": incEligibility,
                    "Status": status,
                });
            });

            return rows;
        } catch (err) {
            console.error("FNC report error:", err);
            return [];
        }
    };

    const rows = generateFNCRows();

    // -----------------------------------------
    // 🔹 EXPORT TO EXCEL
    // -----------------------------------------
    const exportToExcel = () => {
        if (!rows.length) {
            alert("No residents found");
            return;
        }

        const exportRows = rows.map((r: any) => {
            const { resident, index, ...cleanRow } = r;
            return cleanRow;
        });

        const worksheet = XLSX.utils.json_to_sheet(exportRows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "FNC Report");

        worksheet["!cols"] = [
            { wch: 10 },
            { wch: 25 },
            { wch: 18 },
            { wch: 16 },
            { wch: 18 },
            { wch: 18 },
            { wch: 16 },
            { wch: 16 },
            { wch: 14 },
            { wch: 14 },
            { wch: 45 },
        ];

        const buf = XLSX.write(workbook, {
            bookType: "xlsx",
            type: "array",
        });

        saveAs(
            new Blob([buf], { type: "application/octet-stream" }),
            `FNC_Report_${moment().format("YYYYMMDD_HHmmss")}.xlsx`
        );
    };

    // -----------------------------------------
    // 🔹 RENDER
    // -----------------------------------------
    return (
        <div>
            <div className="text-end mb-3">
                <Button color="success" onClick={exportToExcel}>
                    <Icon icon="Download" /> Export FNC Report
                </Button>
            </div>

            <table className="table table-modern table-hover">
                <thead className="table-primary">
                    <tr>
                        <th>Resident Name</th>
                        <th>Admission Date</th>
                        <th>FNC Effective Date</th>
                        <th>Discharge/RIP Date</th>
                        <th className='text-end'>FNC Weekly Rate</th>
                        <th className='text-end'>INC Weekly Rate</th>
                        <th>FNC Eligibility</th>
                        <th>INC Eligibility</th>
                        <th>Status</th>
                    </tr>
                </thead>

                <tbody>
                    {rows.map((r: any, i: number) => (
                        <tr key={i}>
                            <td>
                                <ResidentProfileCard
                                    resident={r.resident}
                                    colorIndex={getColorNameWithIndex(r.index)}
                                />
                            </td>
                            <td>{r["Admission Date"]}</td>
                            <td>{r["FNC Effective Date"]}</td>
                            <td>{r["Discharge/RIP Date"]}</td>
                            <td className="text-end"> £{r["FNC Weekly Rate"]}</td>
                            <td className="text-end"> £{r["INC Weekly Rate"]}</td>
                            <td>{r["FNC Eligibility"]}</td>
                            <td>{r["INC Eligibility"]}</td>
                            <td>{r["Status"]}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
