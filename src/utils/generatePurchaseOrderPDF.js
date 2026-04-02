import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const SYSTEM_SENDER_EMAIL = "dissanayakasuperorder@gmail.com";
const THEME = {
  slate950: [15, 23, 42],
  slate800: [30, 41, 59],
  slate600: [71, 85, 105],
  slate500: [100, 116, 139],
  slate300: [203, 213, 225],
  slate200: [226, 232, 240],
  slate100: [241, 245, 249],
  slate50: [248, 250, 252],
  cyan700: [14, 116, 144],
  cyan600: [8, 145, 178],
  cyan100: [207, 250, 254],
  white: [255, 255, 255],
};

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function toNullableNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function toText(value, fallback = "") {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text || fallback;
}

function buildProductIndex(products = []) {
  const index = new Map();
  products.forEach((p) => {
    const key = toText(p?.productName).toLowerCase();
    if (key) index.set(key, p);
  });
  return index;
}

function buildPdfItems(order, productIndex) {
  const rawItems = Array.isArray(order?.items) ? order.items : [];

  if (!rawItems.length) {
    const fallbackName = toText(order?.productName, "Unnamed Item");
    const fallbackQty = toNumber(order?.quantity);
    const fallbackUnit = toText(order?.unit, "units");
    const fallbackUnitPrice = toNullableNumber(order?.unitPrice);
    const fallbackSku = toText(order?.sku, "N/A");

    return [{
      productName: fallbackName,
      sku: fallbackSku,
      quantity: fallbackQty,
      unit: fallbackUnit,
      unitPrice: fallbackUnitPrice,
      lineTotal: fallbackUnitPrice === null ? null : fallbackUnitPrice * fallbackQty,
    }];
  }

  return rawItems.map((item) => {
    const itemName = toText(item?.productName ?? item?.name, "Unnamed Item");
    const productMeta = productIndex.get(itemName.toLowerCase());

    const quantity = toNumber(item?.quantity);
    const unit = toText(item?.unit ?? order?.unit ?? productMeta?.unit, "units");
    const unitPrice = toNullableNumber(item?.unitPrice ?? item?.price ?? order?.unitPrice);
    const sku = toText(item?.sku ?? order?.sku ?? productMeta?.sku, "N/A");
    const lineTotal = toNullableNumber(item?.lineTotal);

    return {
      productName: itemName,
      sku,
      quantity,
      unit,
      unitPrice,
      lineTotal: lineTotal === null && unitPrice !== null ? unitPrice * quantity : lineTotal,
    };
  });
}

function formatOrderDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function summarizeOrderForAccounting(order, productIndex) {
  const items = buildPdfItems(order, productIndex);
  const lkrFmt = new Intl.NumberFormat("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const totalQty = items.reduce((sum, item) => sum + toNumber(item.quantity), 0);
  const lineTotal = items.reduce((sum, item) => {
    if (item.lineTotal != null) return sum + item.lineTotal;
    if (item.unitPrice != null) return sum + item.unitPrice * item.quantity;
    return sum;
  }, 0);
  const avgUnitPrice = totalQty > 0 ? lineTotal / totalQty : 0;

  const itemNames = items.map((item) => item.productName).filter(Boolean).join(", ") || "-";
  const skuNames = items.map((item) => item.sku).filter(Boolean).join(", ") || "-";

  return {
    orderId: toText(order?.id ?? order?.orderRef, "-"),
    orderDate: formatOrderDate(order?.orderDate ?? order?.createdAt),
    supplierName: toText(order?.supplierName, "-"),
    products: itemNames,
    skus: skuNames,
    qty: totalQty,
    unitPriceLabel: avgUnitPrice > 0 ? lkrFmt.format(avgUnitPrice) : "N/A",
    lineTotal,
    lineTotalLabel: lineTotal > 0 ? lkrFmt.format(lineTotal) : "N/A",
    status: toText(order?.status, "Pending"),
  };
}

export function generateReorderAccountingPDF(orders, managerName = "Store Manager") {
  const list = Array.isArray(orders) ? orders : [];
  if (!list.length) return;

  const options = arguments[2] ?? {};
  const productIndex = buildProductIndex(options.products ?? []);

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const PH = doc.internal.pageSize.getHeight();
  const margin = 12;

  const rows = list.map((order, index) => {
    const s = summarizeOrderForAccounting(order, productIndex);
    return [
      String(index + 1),
      s.orderId,
      s.orderDate,
      s.supplierName,
      s.products,
      s.skus,
      String(s.qty),
      s.unitPriceLabel,
      s.lineTotalLabel,
      s.status,
    ];
  });

  const reportTotal = list.reduce((sum, order) => {
    const s = summarizeOrderForAccounting(order, productIndex);
    return sum + s.lineTotal;
  }, 0);
  const lkrFmt = new Intl.NumberFormat("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  doc.setFillColor(...THEME.slate950);
  doc.rect(0, 0, W, 24, "F");
  doc.setFillColor(...THEME.cyan600);
  doc.rect(0, 21.5, W, 2.5, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...THEME.white);
  doc.text("Reorder Accounting Report", margin, 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...THEME.cyan100);
  doc.text(`Prepared by: ${managerName}`, margin, 18);
  doc.text(`Generated: ${new Date().toLocaleString("en-GB")}`, W - margin, 18, { align: "right" });

  autoTable(doc, {
    startY: 30,
    margin: { left: margin, right: margin },
    head: [["#", "Order ID", "Date", "Supplier", "Products", "SKU", "Qty", "Avg Unit (LKR)", "Total (LKR)", "Status"]],
    body: rows,
    headStyles: {
      fillColor: THEME.cyan700,
      textColor: THEME.white,
      fontStyle: "bold",
      fontSize: 8,
    },
    bodyStyles: { fontSize: 8, textColor: THEME.slate950 },
    alternateRowStyles: { fillColor: THEME.slate50 },
    columnStyles: {
      0: { cellWidth: 9 },
      1: { cellWidth: 27 },
      2: { cellWidth: 18 },
      3: { cellWidth: 28 },
      4: { cellWidth: 56 },
      5: { cellWidth: 40 },
      6: { cellWidth: 14, halign: "right" },
      7: { cellWidth: 26, halign: "right" },
      8: { cellWidth: 26, halign: "right" },
      9: { cellWidth: 18, halign: "center" },
    },
    styles: { overflow: "linebreak", valign: "middle", cellPadding: { top: 2, right: 1.6, bottom: 2, left: 1.6 } },
    tableLineColor: THEME.slate200,
    tableLineWidth: 0.25,
  });

  const endY = (doc.lastAutoTable?.finalY ?? 36) + 8;
  doc.setFillColor(...THEME.slate50);
  doc.setDrawColor(...THEME.slate200);
  doc.roundedRect(W - 88, endY - 5, 76, 8, 2, 2, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...THEME.cyan700);
  doc.text(`Report Total (LKR): ${lkrFmt.format(reportTotal)}`, W - 14, endY, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...THEME.slate500);
  doc.text("Generated by Dissanayake Super Inventory System", W / 2, PH - 5, { align: "center" });

  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  doc.save(`Reorder_Accounting_Report_${datePart}.pdf`);
}

/**
 * Generates and downloads a professional Purchase Order PDF.
 * @param {object} order       - The order object from ReorderContext
 * @param {string} managerName - Name of the logged-in manager
 */
export function generatePurchaseOrderPDF(order, managerName = "Store Manager") {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const PH = doc.internal.pageSize.getHeight();
  const PAGE_MARGIN = 14;
  const CONTENT_W = W - PAGE_MARGIN * 2;
  const FOOTER_H = 14;
  const options = arguments[2] ?? {};
  const productIndex = buildProductIndex(options.products ?? []);

  const dateStr = new Date(order.orderDate).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const supplierEmail =
    order.supplierEmail ??
    "orders@" + order.supplierName.toLowerCase().replace(/\s+/g, "") + ".lk";

  const ensureSpace = (requiredHeight) => {
    if (requiredHeight <= 0) return;
    const nextY = (doc.lastAutoTable?.finalY ?? 0) + requiredHeight;
    if (nextY > PH - FOOTER_H - PAGE_MARGIN) {
      doc.addPage();
      return true;
    }
    return false;
  };

  // ── Branded top bar ───────────────────────────────────────────────────────
  doc.setFillColor(...THEME.slate950);
  doc.rect(0, 0, W, 28, "F");
  doc.setFillColor(...THEME.cyan600);
  doc.rect(0, 24.5, W, 3.5, "F");

  // Store name (left)
  doc.setTextColor(...THEME.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Dissanayake Super", 14, 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...THEME.cyan100);
  doc.text("No. 45, Main Street, Colombo 03, Sri Lanka", 14, 18);
  doc.text("From: " + SYSTEM_SENDER_EMAIL, 14, 23);

  // PO label (right)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...THEME.white);
  doc.text("PURCHASE ORDER", W - PAGE_MARGIN, 16, { align: "right" });

  // ── Metadata block ────────────────────────────────────────────────────────
  let y = 38;
  const supplierCardX = PAGE_MARGIN;
  const supplierCardY = y - 5;
  const supplierCardW = 104;
  const supplierCardH = 20;
  const metaCardW = 72;
  const metaCardX = W - PAGE_MARGIN - metaCardW;
  const metaCardY = y - 7;
  const metaCardH = 27;

  // Supplier card
  doc.setFillColor(...THEME.slate50);
  doc.setDrawColor(...THEME.slate200);
  doc.roundedRect(supplierCardX, supplierCardY, supplierCardW, supplierCardH, 2, 2, "FD");

  // Meta card
  doc.roundedRect(metaCardX, metaCardY, metaCardW, metaCardH, 2, 2, "FD");

  // Left: Supplier info
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...THEME.slate500);
  doc.text("SUPPLIER", supplierCardX + 2, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...THEME.slate950);
  const supplierNameLines = doc.splitTextToSize(order.supplierName ?? "—", supplierCardW - 6);
  doc.text(supplierNameLines, supplierCardX + 2, y + 6);

  doc.setFontSize(8.5);
  doc.setTextColor(...THEME.slate600);
  const supplierEmailLines = doc.splitTextToSize(supplierEmail, supplierCardW - 6);
  doc.text(supplierEmailLines, supplierCardX + 2, y + 12);

  // Right: Order metadata
  const metaLabelX = metaCardX + 3;
  const metaValueX = metaCardX + metaCardW - 3;
  const metaBaseY = y;
  const metaRows = [
    ["Order ID",   order.id],
    ["Order Date", dateStr],
    ["Manager",    managerName],
    ["Status",     order.status ?? "Pending"],
  ];

  metaRows.forEach(function (row, i) {
    var label = row[0];
    var value = toText(row[1], "-");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...THEME.slate500);
    doc.text(label + ":", metaLabelX, metaBaseY + i * 6);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...THEME.slate950);
    const truncated = value.length > 20 ? `${value.slice(0, 17)}...` : value;
    doc.text(truncated, metaValueX, metaBaseY + i * 6, { align: "right" });
  });

  // ── Divider ───────────────────────────────────────────────────────────────
  y += 30;
  doc.setDrawColor(...THEME.slate300);
  doc.setLineWidth(0.4);
  doc.line(PAGE_MARGIN, y, W - PAGE_MARGIN, y);
  y += 8;

  // ── Items table ───────────────────────────────────────────────────────────
  const pdfItems = buildPdfItems(order, productIndex);
  var lkrFmt = new Intl.NumberFormat("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const tableRows = pdfItems.map((item, index) => {
    const qtyLabel = `${item.quantity} ${item.unit}`;
    const unitPriceVal = item.unitPrice == null ? "N/A" : lkrFmt.format(item.unitPrice);
    const totalVal = item.lineTotal == null ? "N/A" : lkrFmt.format(item.lineTotal);

    return [
      String(index + 1),
      item.productName,
      item.sku,
      qtyLabel,
      unitPriceVal,
      totalVal,
    ];
  });

  const computedGrandTotal = pdfItems.reduce((sum, item) => {
    if (item.lineTotal != null) return sum + item.lineTotal;
    if (item.unitPrice != null) return sum + item.unitPrice * item.quantity;
    return sum;
  }, 0);
  const fallbackGrandTotal = toNullableNumber(order?.totalAmount);
  const grandTotal = computedGrandTotal > 0 ? computedGrandTotal : fallbackGrandTotal;

  autoTable(doc, {
    startY: y,
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
    head: [["#", "Product Name", "SKU", "Quantity", "Unit Price (LKR)", "Total (LKR)"]],
    body: tableRows,
    headStyles: {
      fillColor: THEME.cyan700,
      textColor: THEME.white,
      fontStyle: "bold",
      fontSize: 8,
    },
    bodyStyles: { fontSize: 9, textColor: THEME.slate950 },
    alternateRowStyles: { fillColor: THEME.slate50 },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 54 },
      2: { cellWidth: 24 },
      3: { cellWidth: 26 },
      4: { cellWidth: 34 },
      5: { cellWidth: 34 },
    },
    styles: { valign: "middle", overflow: "linebreak", cellPadding: { top: 2.2, right: 2, bottom: 2.2, left: 2 } },
    tableLineColor: THEME.slate200,
    tableLineWidth: 0.3,
  });

  var tableEndY = doc.lastAutoTable.finalY + 10;

  if (grandTotal != null) {
    doc.setFillColor(...THEME.slate50);
    doc.setDrawColor(...THEME.slate200);
    doc.roundedRect(W - 91, tableEndY - 6, 77, 8, 2, 2, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...THEME.cyan700);
    doc.text(`Grand Total (LKR): ${lkrFmt.format(grandTotal)}`, W - PAGE_MARGIN, tableEndY, { align: "right" });
    tableEndY += 8;
  }

  if (ensureSpace(42)) {
    tableEndY = PAGE_MARGIN + 8;
  }

  // ── Notes ─────────────────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...THEME.slate500);
  doc.text("NOTES", PAGE_MARGIN, tableEndY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...THEME.slate600);
  const notesLines = doc.splitTextToSize(
    "Please confirm receipt of this Purchase Order and advise on expected delivery date.",
    CONTENT_W
  );
  doc.text(
    notesLines,
    PAGE_MARGIN,
    tableEndY + 6,
    { maxWidth: CONTENT_W }
  );

  // ── Signature block ───────────────────────────────────────────────────────
  var sigY = tableEndY + 10 + notesLines.length * 4;
  doc.setDrawColor(...THEME.slate600);
  doc.setLineWidth(0.4);
  doc.line(PAGE_MARGIN, sigY, PAGE_MARGIN + 66, sigY);
  doc.line(W - PAGE_MARGIN - 66, sigY, W - PAGE_MARGIN, sigY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...THEME.slate500);
  doc.text("Authorized Signature", PAGE_MARGIN, sigY + 5);
  doc.text(managerName, W - PAGE_MARGIN, sigY + 5, { align: "right" });
  doc.setFontSize(7.5);
  doc.text("Purchasing Department", W - PAGE_MARGIN, sigY + 10, { align: "right" });

  // ── Footer strip ──────────────────────────────────────────────────────────
  doc.setFillColor(...THEME.slate50);
  doc.rect(0, PH - 14, W, 14, "F");
  doc.setDrawColor(...THEME.slate200);
  doc.setLineWidth(0.3);
  doc.line(0, PH - 14, W, PH - 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...THEME.slate500);
  doc.text(
    "Generated by Dissanayake Super Inventory System",
    W / 2,
    PH - 5,
    { align: "center" }
  );
  doc.text(
    "Order ID: " + order.id + "  \u00b7  Generated: " + new Date().toLocaleString("en-GB"),
    W / 2,
    PH - 1,
    { align: "center" }
  );

  // ── Save ──────────────────────────────────────────────────────────────────
  var fileDate = new Date(order.orderDate)
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "");
  doc.save("PurchaseOrder_" + order.id + "_" + fileDate + ".pdf");
}
