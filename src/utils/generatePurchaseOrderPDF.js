import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const SYSTEM_SENDER_EMAIL = "dissanayakasuperorder@gmail.com";

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

/**
 * Generates and downloads a professional Purchase Order PDF.
 * @param {object} order       - The order object from ReorderContext
 * @param {string} managerName - Name of the logged-in manager
 */
export function generatePurchaseOrderPDF(order, managerName = "Store Manager") {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const PH = doc.internal.pageSize.getHeight();
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

  // ── Branded top bar ───────────────────────────────────────────────────────
  doc.setFillColor(30, 27, 75); // indigo-950
  doc.rect(0, 0, W, 28, "F");

  // Store name (left)
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Dissanayake Super", 14, 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(199, 210, 254); // indigo-200
  doc.text("No. 45, Main Street, Colombo 03, Sri Lanka", 14, 18);
  doc.text("From: " + SYSTEM_SENDER_EMAIL, 14, 23);

  // PO label (right)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text("PURCHASE ORDER", W - 14, 16, { align: "right" });

  // ── Metadata block ────────────────────────────────────────────────────────
  let y = 38;

  // Left: Supplier info
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text("SUPPLIER", 14, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42); // slate-950
  doc.text(order.supplierName ?? "—", 14, y + 6);

  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text(supplierEmail, 14, y + 12);

  // Right: Order metadata
  const metaX = W - 14;
  const metaRows = [
    ["Order ID",   order.id],
    ["Order Date", dateStr],
    ["Manager",    managerName],
    ["Status",     order.status ?? "Pending"],
  ];

  metaRows.forEach(function (row, i) {
    var label = row[0];
    var value = row[1];
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(label + ":", metaX - 55, y + i * 7);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(String(value ?? ""), metaX, y + i * 7, { align: "right" });
  });

  // ── Divider ───────────────────────────────────────────────────────────────
  y += 30;
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.4);
  doc.line(14, y, W - 14, y);
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
    margin: { left: 14, right: 14 },
    head: [["#", "Product Name", "SKU", "Quantity", "Unit Price (LKR)", "Total (LKR)"]],
    body: tableRows,
    headStyles: {
      fillColor: [30, 27, 75],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    bodyStyles: { fontSize: 9, textColor: [15, 23, 42] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: "auto" },
      2: { cellWidth: 26 },
      3: { cellWidth: 28 },
      4: { cellWidth: 32 },
      5: { cellWidth: 32 },
    },
    tableLineColor: [226, 232, 240],
    tableLineWidth: 0.3,
  });

  var tableEndY = doc.lastAutoTable.finalY + 10;

  if (grandTotal != null) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(`Grand Total (LKR): ${lkrFmt.format(grandTotal)}`, W - 14, tableEndY, { align: "right" });
    tableEndY += 8;
  }

  // ── Notes ─────────────────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("NOTES", 14, tableEndY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    "Please confirm receipt of this Purchase Order and advise on expected delivery date.",
    14,
    tableEndY + 6,
    { maxWidth: W - 28 }
  );

  // ── Signature block ───────────────────────────────────────────────────────
  var sigY = tableEndY + 28;
  doc.setDrawColor(71, 85, 105);
  doc.setLineWidth(0.4);
  doc.line(14, sigY, 80, sigY);
  doc.line(W - 80, sigY, W - 14, sigY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("Authorized Signature", 14, sigY + 5);
  doc.text(managerName, W - 14, sigY + 5, { align: "right" });
  doc.setFontSize(7.5);
  doc.text("Purchasing Department", W - 14, sigY + 10, { align: "right" });

  // ── Footer strip ──────────────────────────────────────────────────────────
  doc.setFillColor(248, 250, 252);
  doc.rect(0, PH - 14, W, 14, "F");
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(0, PH - 14, W, PH - 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184); // slate-400
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
