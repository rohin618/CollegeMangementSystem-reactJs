import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { RATING_OPTIONS } from "../../config/ratings";
import { formatDateToDDMMYYYY } from "../../utils/enumColors";
import { FeedbackAnalysisData } from "./FeedbackPDFGenerator";

interface GeneratePDFParams {
  data: FeedbackAnalysisData;
  feedbackType: "staff" | "professionals" | "residents" | "relatives";
  companyName: string;
}

export function generateFeedbackPDF({
  data,
  feedbackType,
  companyName,
}: GeneratePDFParams) {
  const doc = new jsPDF("l", "mm", "a4"); // Landscape A4
  const pageWidth = doc.internal.pageSize.getWidth();

  /* ================= HEADER ================= */

  doc.setFontSize(18);
  doc.text(companyName, 15, 18);

  doc.setFontSize(14);
  doc.setTextColor(51, 65, 255);

  const titleMap: Record<string, string> = {
    staff: "Staff Questionnaire",
    professionals: "Professionals Questionnaire",
    residents: "Residents Questionnaire",
    relatives: "Relatives Questionnaire",
  };

  doc.text(titleMap[feedbackType], 15, 26);

  doc.setDrawColor(51, 65, 255);
  doc.line(15, 30, pageWidth - 15, 30);

  /* ================= META ================= */

  doc.setFontSize(10);
  doc.setTextColor(0);

  doc.text(
    `Date Range: ${formatDateToDDMMYYYY(
      data.dateRange.startDate
    )} to ${formatDateToDDMMYYYY(data.dateRange.endDate)}`,
    15,
    38
  );

  doc.text(`Total Responses: ${data.totalRecords}`, 15, 44);

  /* ================= TABLE ================= */

  const tableHead = [
    [
      "Statement",
      ...RATING_OPTIONS.map((r) => r.label),
      "Total",
    ],
  ];

  const tableBody = data.analysisData.map((q, i) => [
    `${String.fromCharCode(65 + i)}. ${q.question}`,
    ...RATING_OPTIONS.map(
      (r) => q.ratingCounts[r.value.toString()] || 0
    ),
    q.totalResponses,
  ]);

  autoTable(doc, {
    head: tableHead,
    body: tableBody,
    startY: 50,
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [243, 244, 246],
      textColor: 0,
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: 110 }, // Statement column
    },
    theme: "grid",
    didDrawPage: () => {
      doc.setFontSize(9);
      doc.setTextColor(150);
      doc.text(
        "This report was generated automatically",
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: "center" }
      );
    },
  });

  /* ================= COMMENTS ================= */

  const comments = data.analysisData
    .map((q, i) => ({
      index: i,
      question: q.question,
      comments: q.comments || [],
    }))
    .filter((q) => q.comments.length > 0);

  if (comments.length) {
    doc.addPage();

    let y = 20;
    doc.setFontSize(16);
    doc.text("Feedback Comments", 15, y);
    y += 8;

    comments.forEach((q) => {
      doc.setFontSize(11);
      doc.setTextColor(51, 65, 255);
      doc.text(
        `Q${q.index + 1}. ${q.question}`,
        15,
        y
      );
      y += 6;

      doc.setTextColor(0);

      q.comments.forEach((c, i) => {
        const text = `${i + 1}. ${c.comment} — ${
          c.name || "Anonymous"
        } (${new Date(c.date).toLocaleDateString()})`;

        const lines = doc.splitTextToSize(text, pageWidth - 30);

        if (y + lines.length * 5 > 190) {
          doc.addPage();
          y = 20;
        }

        doc.text(lines, 20, y);
        y += lines.length * 5 + 4;
      });

      y += 4;
    });
  }

  /* ================= SAVE ================= */

  doc.save(
    `feedback-analysis-${feedbackType}-${new Date()
      .toISOString()
      .split("T")[0]}.pdf`
  );
}
