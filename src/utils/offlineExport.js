// Downloads offline bookings as CSV, Excel (.xlsx) or PDF.
// The CSV/Excel headers match the import format, so an export can be edited
// and re-imported (existing membership numbers are skipped on import).
// exceljs and jspdf are loaded only when an export is requested.

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`;
};

const COLUMNS = [
  { header: "Name", width: 30, pdf: 34, value: (b) => b.memberDetails?.fullname },
  { header: "Phone", width: 14, pdf: 22, value: (b) => b.memberDetails?.phone },
  { header: "Email", width: 26, value: (b) => b.memberDetails?.email },
  { header: "Membership No", width: 16, pdf: 24, value: (b) => b.membershipNumber },
  { header: "Edition", width: 16, pdf: 22, value: (b) => b.membershipPlanId?.name },
  { header: "Date", width: 12, pdf: 18, value: (b) => formatDate(b.startDate) },
  { header: "Valid Till", width: 12, pdf: 18, value: (b) => formatDate(b.endDate) },
  { header: "Source", width: 16, pdf: 22, value: (b) => b.leadSource },
  { header: "Sales Person", width: 14, pdf: 20, value: (b) => b.salesPerson },
  { header: "Branch", width: 10, pdf: 13, value: (b) => b.branch },
  { header: "Amount", width: 10, pdf: 15, numeric: true, value: (b) => Number(b.sellingCost ?? 0) },
  { header: "Received", width: 10, numeric: true, value: (b) => Number(b.paymentReceived ?? 0) },
  { header: "Pending", width: 10, pdf: 15, numeric: true, value: (b) => Number(b.paymentPending ?? 0) },
  { header: "Payment Mode", width: 14, pdf: 20, value: (b) => b.paymentMode || "" },
  { header: "Payment Status", width: 14, value: (b) => b.paymentStatus },
  { header: "Complimentary", width: 13, value: (b) => (b.isComplimentary ? "Yes" : "No") },
  { header: "Claim Status", width: 12, pdf: 17, value: (b) => b.claimStatus },
  { header: "Remarks", width: 36, pdf: 34, value: (b) => b.remarks },
];

const cellText = (value) => (value === undefined || value === null ? "" : String(value));
const fileStamp = () => formatDate(new Date());

function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportOfflineCsv(bookings) {
  const escape = (value) => {
    let text = cellText(value);
    // Stop spreadsheet apps treating names/remarks as formulas.
    if (/^[=+\-@]/.test(text)) text = "'" + text;
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const lines = [COLUMNS.map((c) => escape(c.header)).join(",")];
  bookings.forEach((b) => lines.push(COLUMNS.map((c) => escape(c.value(b))).join(",")));
  saveBlob(new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" }), `offline-memberships-${fileStamp()}.csv`);
}

export async function exportOfflineExcel(bookings) {
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Offline Memberships", { views: [{ state: "frozen", ySplit: 1 }] });
  sheet.columns = COLUMNS.map((c) => ({ header: c.header, width: c.width, style: c.numeric ? { numFmt: "#,##0" } : {} }));
  bookings.forEach((b) => sheet.addRow(COLUMNS.map((c) => (c.numeric ? c.value(b) : cellText(c.value(b))))));
  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF465FFF" } };
  header.alignment = { vertical: "middle" };
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: COLUMNS.length } };
  const buffer = await workbook.xlsx.writeBuffer();
  saveBlob(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `offline-memberships-${fileStamp()}.xlsx`);
}

export async function exportOfflinePdf(bookings) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const columns = COLUMNS.filter((c) => c.pdf);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 8;
  const scale = (pageWidth - margin * 2) / columns.reduce((sum, c) => sum + c.pdf, 0);
  const widths = columns.map((c) => c.pdf * scale);
  const pad = 1.5;
  const lineHeight = 3.4;
  let y = margin;

  const totals = bookings.reduce((acc, b) => ({ amount: acc.amount + Number(b.sellingCost || 0), pending: acc.pending + Number(b.paymentPending || 0) }), { amount: 0, pending: 0 });
  doc.setFont("helvetica", "bold").setFontSize(13).text("Offline Memberships", margin, y + 4);
  doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(100);
  doc.text(`${bookings.length} members · Total Rs.${totals.amount.toLocaleString("en-IN")} · Pending Rs.${totals.pending.toLocaleString("en-IN")} · Generated ${formatDate(new Date())}`, margin, y + 9);
  y += 14;

  const drawRow = (cells, { head = false, shade = false } = {}) => {
    doc.setFont("helvetica", head ? "bold" : "normal").setFontSize(7);
    const wrapped = cells.map((text, i) => doc.splitTextToSize(cellText(text), widths[i] - pad * 2));
    const height = Math.max(...wrapped.map((lines) => lines.length)) * lineHeight + pad * 2;
    if (y + height > pageHeight - margin) {
      doc.addPage();
      y = margin;
      if (!head) drawRow(columns.map((c) => c.header), { head: true });
      doc.setFont("helvetica", "normal").setFontSize(7);
    }
    if (head || shade) {
      doc.setFillColor(...(head ? [70, 95, 255] : [245, 246, 250]));
      doc.rect(margin, y, pageWidth - margin * 2, height, "F");
    }
    doc.setTextColor(...(head ? [255, 255, 255] : [40, 40, 40]));
    let x = margin;
    wrapped.forEach((lines, i) => {
      const right = columns[i].numeric && !head;
      doc.text(lines, right ? x + widths[i] - pad : x + pad, y + pad + 2.6, right ? { align: "right" } : undefined);
      x += widths[i];
    });
    doc.setDrawColor(225).line(margin, y + height, pageWidth - margin, y + height);
    y += height;
  };

  drawRow(columns.map((c) => c.header), { head: true });
  bookings.forEach((b, index) => drawRow(columns.map((c) => (c.numeric ? Number(c.value(b)).toLocaleString("en-IN") : c.value(b))), { shade: index % 2 === 1 }));

  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page).setFontSize(7).setTextColor(120).text(`Page ${page} of ${pages}`, pageWidth - margin, pageHeight - 4, { align: "right" });
  }
  doc.save(`offline-memberships-${fileStamp()}.pdf`);
}
