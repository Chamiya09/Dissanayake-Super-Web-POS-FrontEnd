import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Mail,
  Inbox,
  Send,
  Archive,
  Search,
  Paperclip,
  Star,
  StarOff,
  Reply,
  Forward,
  Trash2,
  Sparkles,
  Clock3,
  CircleDot,
  X,
  Loader2,
} from "lucide-react";
import { AppHeader } from "@/components/Layout/AppHeader";
import { cn } from "@/lib/utils";
import { useToast } from "@/context/GlobalToastContext";
import { fetchInbox, fetchSent, sendMailboxEmail, type MailboxMessage } from "@/api/mailboxApi";

type MailCategory = "Inbox" | "Sent" | "Archive";

const FOLDERS: Array<{ key: MailCategory; label: string; icon: React.ElementType }> = [
  { key: "Inbox", label: "Inbox", icon: Inbox },
  { key: "Sent", label: "Sent", icon: Send },
  { key: "Archive", label: "Archive", icon: Archive },
];

interface ComposeState {
  to: string;
  subject: string;
  body: string;
}

type FolderMessages = Record<MailCategory, MailboxMessage[]>;
type FolderState = Record<MailCategory, boolean>;

const EMPTY_FOLDERS: FolderMessages = {
  Inbox: [],
  Sent: [],
  Archive: [],
};

const EMPTY_FOLDER_STATE: FolderState = {
  Inbox: false,
  Sent: false,
  Archive: true,
};

const MAILBOX_CACHE_KEY = "pos.mailbox.cache.v1";
const MAILBOX_CACHE_TTL_MS = 2 * 60 * 1000;

function normalizeMails(mails: MailboxMessage[], category: MailCategory): MailboxMessage[] {
  return mails.map((mail) => ({
    ...mail,
    category: (mail.category || category) as MailCategory,
    tags: Array.isArray(mail.tags) ? mail.tags : [],
  }));
}

function readMailboxCache(): FolderMessages | null {
  try {
    const raw = localStorage.getItem(MAILBOX_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as { savedAt?: number; folders?: Partial<FolderMessages> };
    if (!parsed?.savedAt || !parsed?.folders) return null;
    if (Date.now() - parsed.savedAt > MAILBOX_CACHE_TTL_MS) return null;

    return {
      Inbox: Array.isArray(parsed.folders.Inbox) ? normalizeMails(parsed.folders.Inbox, "Inbox") : [],
      Sent: Array.isArray(parsed.folders.Sent) ? normalizeMails(parsed.folders.Sent, "Sent") : [],
      Archive: Array.isArray(parsed.folders.Archive) ? normalizeMails(parsed.folders.Archive, "Archive") : [],
    };
  } catch {
    return null;
  }
}

function writeMailboxCache(folders: FolderMessages): void {
  try {
    localStorage.setItem(
      MAILBOX_CACHE_KEY,
      JSON.stringify({
        savedAt: Date.now(),
        folders,
      })
    );
  } catch {
    // Ignore cache write failures.
  }
}

function decodeEntities(input: string): string {
  if (!input) return "";
  return input
    .replace(/&mdash;/g, "-")
    .replace(/&nbsp;/g, " ")
    .replace(/&middot;/g, "·")
    .replace(/&#x23F3;/g, "⏳")
    .replace(/&#x2139;&#xFE0F;/g, "ℹ️")
    .replace(/&#x2713;/g, "✓")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

type PurchaseOrderEmailData = {
  orderRef: string;
  placedAt: string;
  senderName: string;
  supplierName: string;
  supplierEmail: string;
  placedBy: string;
  placedByRole: string;
  totalLkr: string;
};

type PurchaseOrderConfirmedEmailData = {
  orderRef: string;
  senderName: string;
  supplierEmail: string;
  confirmedAt: string;
  totalLkr: string;
  status: string;
};

type GenericFact = {
  label: string;
  value: string;
};

type MailThemeVariant = {
  title: string;
  subtitle: string;
  badge: string;
  shellClass: string;
  badgeClass: string;
  panelClass: string;
  highlightClass: string;
};

function normalizeFactLabel(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function dedupeFactsByLabel(facts: GenericFact[]): GenericFact[] {
  const seen = new Set<string>();
  const output: GenericFact[] = [];
  for (const fact of facts) {
    const key = normalizeFactLabel(fact.label);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    output.push(fact);
  }
  return output;
}

function filterFactsByExcludedLabels(facts: GenericFact[], excludedLabels: string[]): GenericFact[] {
  const excluded = new Set(excludedLabels.map(normalizeFactLabel));
  return facts.filter((fact) => !excluded.has(normalizeFactLabel(fact.label)));
}

function parsePurchaseOrderEmail(body: string): PurchaseOrderEmailData | null {
  const text = decodeEntities(body);
  if (!/new purchase order/i.test(text)) return null;

  const orderRef = text.match(/\bPO-\d{8,}\b/i)?.[0] ?? "";
  const datePlaced = text.match(/Date\s+Placed\s+(\d{4}-\d{2}-\d{2})/i)?.[1] ?? "";
  const supplierSection = text.match(/Supplier\s+(.+?)\s+([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/i);
  const placedBySection = text.match(/Placed\s+By\s+(.+?)\s+(Purchasing\s+Manager|Manager|Owner|Staff)/i);
  const total = text.match(/Order\s+Total\s+LKR\s*([\d,.]+)/i)?.[1] ?? "";

  if (!orderRef || !total) return null;

  return {
    orderRef,
    placedAt: datePlaced,
    senderName: "",
    supplierName: supplierSection?.[1]?.trim() ?? "Supplier",
    supplierEmail: supplierSection?.[2]?.trim() ?? "",
    placedBy: placedBySection?.[1]?.trim() ?? "",
    placedByRole: placedBySection?.[2]?.trim() ?? "Purchasing Manager",
    totalLkr: total,
  };
}

function parsePurchaseOrderConfirmedEmail(body: string): PurchaseOrderConfirmedEmailData | null {
  const text = decodeEntities(body);
  if (!/purchase order confirmed|confirmation received|status\s+confirmed/i.test(text)) return null;

  const orderRef = text.match(/\bPO-\d{8,}\b/i)?.[0] ?? "";
  const supplierEmail = text.match(/Supplier\s+Email\s+([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/i)?.[1] ?? "";
  const confirmedAt = text.match(/Confirmed\s+At\s+([0-9]{4}-[0-9]{2}-[0-9]{2}T[^\s]+)/i)?.[1] ?? "";
  const total = text.match(/Order\s+Total\s+LKR\s*([\d,.]+)/i)?.[1] ?? "";
  const status = text.match(/Status\s+([A-Z_]+)/i)?.[1] ?? "CONFIRMED";

  if (!orderRef || !total) return null;

  return {
    orderRef,
    senderName: "",
    supplierEmail,
    confirmedAt,
    totalLkr: total,
    status,
  };
}

function extractGenericFacts(text: string): GenericFact[] {
  const patterns: Array<{ label: string; regex: RegExp }> = [
    { label: "Order Reference", regex: /\b(PO-\d{8,})\b/i },
    { label: "Supplier Email", regex: /([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/i },
    { label: "Confirmed At", regex: /Confirmed\s+At\s+([0-9]{4}-[0-9]{2}-[0-9]{2}T[^\s]+)/i },
    { label: "Date Placed", regex: /Date\s+Placed\s+([0-9]{4}-[0-9]{2}-[0-9]{2})/i },
    { label: "Order Total", regex: /Order\s+Total\s+LKR\s*([\d,.]+)/i },
    { label: "Status", regex: /Status\s+([A-Z_]+)/i },
  ];

  const facts: GenericFact[] = [];
  for (const pattern of patterns) {
    const value = text.match(pattern.regex)?.[1]?.trim();
    if (value) {
      facts.push({ label: pattern.label, value: value });
    }
  }

  return facts;
}

function extractKeyValueFacts(text: string): GenericFact[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 120);

  const facts: GenericFact[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    const match = line.match(/^([A-Za-z][A-Za-z\s]{2,30}):\s*(.+)$/);
    if (!match) continue;

    const label = match[1].replace(/\s+/g, " ").trim();
    const value = match[2].trim();
    const key = `${label.toLowerCase()}::${value.toLowerCase()}`;

    if (value.length < 2 || value.length > 120 || seen.has(key)) continue;
    seen.add(key);
    facts.push({ label, value });
    if (facts.length >= 8) break;
  }

  return facts;
}

function classifyMailTheme(mail: MailboxMessage, text: string): MailThemeVariant {
  const source = `${mail.subject || ""} ${text}`.toLowerCase();

  if (/(supplier confirmed order|purchase order confirmed|confirmation received|status\s+confirmed)/.test(source)) {
    return {
      title: "Supplier Confirmation",
      subtitle: "This purchase order has already been confirmed by the supplier.",
      badge: "PO CONFIRMED",
      shellClass: "bg-emerald-700",
      badgeClass: "bg-emerald-100 text-emerald-800",
      panelClass: "border-emerald-200 bg-emerald-50 text-emerald-800",
      highlightClass: "border-emerald-200 bg-emerald-50",
    };
  }

  if (/(admin alerts|new purchase order placed|saved to db|reorder management|admin notification)/.test(source)) {
    return {
      title: "Admin Purchase Order Alert",
      subtitle: "A new purchase order was created and supplier notification has been sent.",
      badge: "PO ALERT",
      shellClass: "bg-indigo-700",
      badgeClass: "bg-indigo-100 text-indigo-800",
      panelClass: "border-indigo-200 bg-indigo-50 text-indigo-800",
      highlightClass: "border-indigo-200 bg-indigo-50",
    };
  }

  if (/(purchase order|po-\d{8,}|supplier action required|order total|authorised by|inventory system)/.test(source)) {
    return {
      title: "Supplier Purchase Order",
      subtitle: "Formal purchase order issued by Dissanayake Super purchasing workflow.",
      badge: "PO MAIL",
      shellClass: "bg-cyan-800",
      badgeClass: "bg-cyan-100 text-cyan-900",
      panelClass: "border-cyan-200 bg-cyan-50 text-cyan-900",
      highlightClass: "border-cyan-200 bg-cyan-50",
    };
  }

  if (/(confirmed|approved|accepted|success|completed|delivered)/.test(source)) {
    return {
      title: "Action Confirmed",
      subtitle: "This message contains a successful workflow update.",
      badge: "SUCCESS",
      shellClass: "bg-emerald-700",
      badgeClass: "bg-emerald-100 text-emerald-800",
      panelClass: "border-emerald-200 bg-emerald-50 text-emerald-800",
      highlightClass: "border-emerald-200 bg-emerald-50",
    };
  }

  if (/(failed|error|declined|rejected|cancelled|canceled|denied|unable)/.test(source)) {
    return {
      title: "Action Requires Attention",
      subtitle: "A failure or rejection was detected in this message.",
      badge: "ATTENTION",
      shellClass: "bg-rose-700",
      badgeClass: "bg-rose-100 text-rose-800",
      panelClass: "border-rose-200 bg-rose-50 text-rose-800",
      highlightClass: "border-rose-200 bg-rose-50",
    };
  }

  if (/(pending|awaiting|in progress|processing|follow-up|follow up|review)/.test(source)) {
    return {
      title: "Pending Update",
      subtitle: "This message indicates an item pending further action.",
      badge: "PENDING",
      shellClass: "bg-amber-700",
      badgeClass: "bg-amber-100 text-amber-800",
      panelClass: "border-amber-200 bg-amber-50 text-amber-800",
      highlightClass: "border-amber-200 bg-amber-50",
    };
  }

  if (/(invoice|purchase order|po-|supplier|stock|inventory|reorder)/.test(source)) {
    return {
      title: "Operational Mail",
      subtitle: "Inventory and supplier workflow message.",
      badge: "OPERATIONS",
      shellClass: "bg-indigo-700",
      badgeClass: "bg-indigo-100 text-indigo-800",
      panelClass: "border-indigo-200 bg-indigo-50 text-indigo-800",
      highlightClass: "border-indigo-200 bg-indigo-50",
    };
  }

  return {
    title: mail.category === "Sent" ? "Sent Mail" : "Mail Update",
    subtitle: "Unified themed view for all mailbox messages.",
    badge: mail.category.toUpperCase(),
    shellClass: mail.category === "Sent" ? "bg-teal-700" : "bg-slate-700",
    badgeClass: mail.category === "Sent" ? "bg-teal-100 text-teal-800" : "bg-slate-100 text-slate-800",
    panelClass: mail.category === "Sent" ? "border-teal-200 bg-teal-50 text-teal-800" : "border-slate-200 bg-slate-50 text-slate-700",
    highlightClass: mail.category === "Sent" ? "border-teal-200 bg-teal-50" : "border-slate-200 bg-slate-50",
  };
}

function formatMailTime(iso: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (sameDay) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString([], { day: "2-digit", month: "short" });
}

function formatConfirmedMailBody(text: string): string {
  if (!text) return "";
  return text
    .replace(/\s+(Order\s+Reference)\b/gi, "\n$1")
    .replace(/\s+(Supplier\s+Email)\b/gi, "\n$1")
    .replace(/\s+(Confirmed\s+At)\b/gi, "\n$1")
    .replace(/\s+(Order\s+Total)\b/gi, "\n$1")
    .replace(/\s+(Status\s+CONFIRMED)\b/gi, "\n$1")
    .replace(/\s+(Internal\s+confirmation\s+notice)\b/gi, "\n\n$1")
    .trim();
}

function PurchaseOrderEmailCard({ data }: { data: PurchaseOrderEmailData }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="bg-slate-900 px-5 py-4 text-white">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-300">Dissanayake Super - Admin Alerts</p>
            <h3 className="mt-1 text-lg font-bold">New Purchase Order Placed</h3>
          </div>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold text-amber-800">⏳ PENDING</span>
        </div>
      </div>

      <div className="border-l-4 border-blue-500 bg-blue-50 px-5 py-3 text-sm font-medium text-blue-800">
        ℹ️ A new purchase order has been created and the supplier has been notified automatically.
      </div>

      <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Order Reference</p>
          <p className="mt-1 text-base font-bold text-slate-900">{data.orderRef}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Date Placed</p>
          <p className="mt-1 text-base font-bold text-slate-900">{data.placedAt || "-"}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Name</p>
          <p className="mt-1 text-sm font-bold text-slate-900">{data.senderName || "Unknown"}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Supplier</p>
          <p className="mt-1 text-sm font-bold text-slate-900">{data.supplierName}</p>
          <p className="mt-0.5 text-xs text-slate-600">{data.supplierEmail || "-"}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Placed By</p>
          <p className="mt-1 text-sm font-bold text-slate-900">{data.placedBy || "-"}</p>
          <p className="mt-0.5 text-xs text-slate-600">{data.placedByRole}</p>
        </div>
      </div>

      <div className="mx-5 mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-700">Order Total</p>
            <p className="mt-1 text-2xl font-black text-slate-900">LKR {data.totalLkr}</p>
          </div>
          <span className="rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-bold text-white">✓ Saved to DB</span>
        </div>
      </div>

      <div className="border-t border-slate-100 bg-slate-50 px-5 py-3 text-xs text-slate-500">
        Dissanayake Super Inventory System · Admin notification · Do not reply
      </div>
    </div>
  );
}

function PurchaseOrderConfirmedEmailCard({ data }: { data: PurchaseOrderConfirmedEmailData }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="bg-emerald-700 px-5 py-4 text-white">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-100">Dissanayake Super - Supplier Updates</p>
            <h3 className="mt-1 text-lg font-bold">Purchase Order Confirmed</h3>
          </div>
          <span className="rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold text-white">CONFIRMED</span>
        </div>
      </div>

      <div className="border-l-4 border-emerald-500 bg-emerald-50 px-5 py-3 text-sm font-medium text-emerald-800">
        Supplier has confirmed this purchase order via the secure acceptance link.
      </div>

      <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Order Reference</p>
          <p className="mt-1 text-base font-bold text-slate-900">{data.orderRef}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Name</p>
          <p className="mt-1 text-base font-bold text-slate-900">{data.senderName || "Unknown"}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Status</p>
          <p className="mt-1 text-base font-bold text-emerald-700">{data.status}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Supplier Email</p>
          <p className="mt-1 text-sm font-bold text-slate-900 break-all">{data.supplierEmail || "-"}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Confirmed At</p>
          <p className="mt-1 text-sm font-bold text-slate-900 break-all">{data.confirmedAt || "-"}</p>
        </div>
      </div>

      <div className="mx-5 mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-700">Order Total</p>
            <p className="mt-1 text-2xl font-black text-slate-900">LKR {data.totalLkr}</p>
          </div>
          <span className="rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-bold text-white">Supplier Confirmed</span>
        </div>
      </div>

      <div className="border-t border-slate-100 bg-slate-50 px-5 py-3 text-xs text-slate-500">
        Internal confirmation notice from Dissanayake Super Inventory System
      </div>
    </div>
  );
}

function GenericMailDetailCard({
  mail,
  text,
}: {
  mail: MailboxMessage;
  text: string;
}) {
  const primaryFacts = extractGenericFacts(text);
  const keyValueFacts = extractKeyValueFacts(text);
  const facts = dedupeFactsByLabel(
    [...primaryFacts, ...keyValueFacts].filter(
      (fact, idx, arr) => arr.findIndex((f) => f.label.toLowerCase() === fact.label.toLowerCase() && f.value.toLowerCase() === fact.value.toLowerCase()) === idx
    )
  ).slice(0, 8);
  const theme = classifyMailTheme(mail, text);

  if (theme.badge === "PO CONFIRMED") {
    const orderRef = facts.find((f) => /order\s*reference/i.test(f.label))?.value || "-";
    const total = facts.find((f) => /order\s*total/i.test(f.label))?.value || "-";
    const status = facts.find((f) => /status/i.test(f.label))?.value || "CONFIRMED";

    const detailFacts = filterFactsByExcludedLabels(facts, ["Order Reference", "Order Total", "Status"]);
    const formattedBody = formatConfirmedMailBody(text);

    return (
      <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-sm">
        <div className="px-6 py-5 text-white bg-emerald-700">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-100">Dissanayake Super - Purchasing Department</p>
              <h3 className="mt-2 text-xl font-extrabold tracking-tight">Supplier Purchase Order Confirmed</h3>
              <p className="mt-1 text-sm text-emerald-100">{mail.subject || "Confirmation received"}</p>
            </div>
            <span className="rounded-full border border-emerald-300 bg-emerald-600 px-3 py-1 text-[11px] font-bold tracking-wide">CONFIRMED</span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-emerald-500 bg-emerald-600 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-100">Order Ref</p>
              <p className="mt-1 text-sm font-bold text-white break-all">{orderRef}</p>
            </div>
            <div className="rounded-lg border border-emerald-500 bg-emerald-600 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-100">Order Total</p>
              <p className="mt-1 text-sm font-bold text-white break-all">{total}</p>
            </div>
            <div className="rounded-lg border border-emerald-500 bg-emerald-600 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-100">Status</p>
              <p className="mt-1 text-sm font-bold text-white break-all">{status}</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-b border-emerald-100 bg-emerald-50 text-sm text-emerald-900">
          Supplier confirmation has been received and this order is now locked for revision.
        </div>

        <div className="px-6 py-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Sender</p>
            <p className="mt-1 text-sm font-bold text-slate-900 break-words">{mail.from || "Unknown"}</p>
            <p className="mt-1 text-xs text-slate-600 break-all">{mail.fromEmail || "-"}</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Mail Meta</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">{mail.category}</span>
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">{formatMailTime(mail.sentAt) || "-"}</span>
            </div>
          </div>

          {detailFacts.map((fact) => (
            <div key={`${fact.label}-${fact.value}`} className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">{fact.label}</p>
              <p className="mt-1 text-sm font-bold text-slate-900 break-all">{fact.value}</p>
            </div>
          ))}
        </div>

        <div className="mx-6 mb-6 overflow-hidden rounded-xl border border-emerald-200 bg-white">
          <div className="border-b border-emerald-100 bg-emerald-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Message Body</p>
          </div>
          <div className="px-4 py-4 space-y-3">
            <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
              Supplier confirmed this purchase order. Confirmation is recorded and visible in mailbox logs.
            </div>
            <p className="whitespace-pre-line text-sm leading-7 text-slate-700">{formattedBody || "No message body available"}</p>
          </div>
        </div>
      </div>
    );
  }

  if (theme.badge === "PO ALERT") {
    const orderRef = facts.find((f) => /order\s*reference/i.test(f.label))?.value || "-";
    const placedAt = facts.find((f) => /date\s*placed/i.test(f.label))?.value || "-";
    const total = facts.find((f) => /order\s*total/i.test(f.label))?.value || "-";

    const detailFacts = filterFactsByExcludedLabels(facts, ["Order Reference", "Date Placed", "Order Total"]);

    return (
      <div className="overflow-hidden rounded-2xl border border-indigo-200 bg-white shadow-sm">
        <div className="px-6 py-5 text-white bg-indigo-700">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-100">Dissanayake Super - Admin Alerts</p>
              <h3 className="mt-2 text-xl font-extrabold tracking-tight">New Purchase Order Placed</h3>
              <p className="mt-1 text-sm text-indigo-100">{mail.subject || "Purchase order alert"}</p>
            </div>
            <span className="rounded-full border border-indigo-300 bg-indigo-600 px-3 py-1 text-[11px] font-bold tracking-wide">PENDING</span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-indigo-500 bg-indigo-600 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-100">Order Ref</p>
              <p className="mt-1 text-sm font-bold text-white break-all">{orderRef}</p>
            </div>
            <div className="rounded-lg border border-indigo-500 bg-indigo-600 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-100">Date Placed</p>
              <p className="mt-1 text-sm font-bold text-white break-all">{placedAt}</p>
            </div>
            <div className="rounded-lg border border-indigo-500 bg-indigo-600 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-100">Order Total</p>
              <p className="mt-1 text-sm font-bold text-white break-all">{total}</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-b border-indigo-100 bg-indigo-50 text-sm text-indigo-900">
          Log in to Reorder Management to review, confirm, or cancel this order.
        </div>

        <div className="px-6 py-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Sender</p>
            <p className="mt-1 text-sm font-bold text-slate-900 break-words">{mail.from || "Unknown"}</p>
            <p className="mt-1 text-xs text-slate-600 break-all">{mail.fromEmail || "-"}</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Mail Meta</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">{mail.category}</span>
              <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-[11px] font-semibold text-indigo-800">{formatMailTime(mail.sentAt) || "-"}</span>
            </div>
          </div>

          {detailFacts.map((fact) => (
            <div key={`${fact.label}-${fact.value}`} className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">{fact.label}</p>
              <p className="mt-1 text-sm font-bold text-slate-900 break-all">{fact.value}</p>
            </div>
          ))}
        </div>

        <div className="mx-6 mb-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Message Body</p>
          </div>
          <div className="px-4 py-4">
            <p className="whitespace-pre-line text-sm leading-7 text-slate-700">{text || "No message body available"}</p>
          </div>
        </div>
      </div>
    );
  }

  if (theme.badge === "PO MAIL") {
    const orderRef = facts.find((f) => /order\s*reference/i.test(f.label))?.value || "-";
    const total = facts.find((f) => /order\s*total/i.test(f.label))?.value || "-";

    const detailFacts = filterFactsByExcludedLabels(facts, ["Order Reference", "Order Total"]);

    return (
      <div className="overflow-hidden rounded-2xl border border-cyan-200 bg-white shadow-sm">
        <div className="px-6 py-5 text-white bg-cyan-700">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-100">Dissanayake Super - Purchasing Department</p>
              <h3 className="mt-2 text-xl font-extrabold tracking-tight">Supplier Purchase Order</h3>
              <p className="mt-1 text-sm text-cyan-100">{mail.subject || "Purchase order notice"}</p>
            </div>
            <span className="rounded-full border border-cyan-100 bg-cyan-600 px-3 py-1 text-[11px] font-bold tracking-wide">ACTION REQUIRED</span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-cyan-500 bg-cyan-600 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-cyan-100">Order Reference</p>
              <p className="mt-1 text-base font-bold text-white break-all">{orderRef}</p>
            </div>
            <div className="rounded-lg border border-cyan-500 bg-cyan-600 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-cyan-100">Order Total (LKR)</p>
              <p className="mt-1 text-base font-bold text-white break-all">{total}</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-b border-cyan-100 bg-cyan-50 text-sm text-cyan-900">
          Please review this purchase order and use the supplier action link in the message body to confirm.
        </div>

        <div className="px-6 py-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Sender</p>
            <p className="mt-1 text-sm font-bold text-slate-900 break-words">{mail.from || "Unknown"}</p>
            <p className="mt-1 text-xs text-slate-600 break-all">{mail.fromEmail || "-"}</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Mail Meta</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">{mail.category}</span>
              <span className="rounded-full bg-cyan-100 px-2.5 py-1 text-[11px] font-semibold text-cyan-800">{formatMailTime(mail.sentAt) || "-"}</span>
            </div>
          </div>

          {detailFacts.map((fact) => (
            <div key={`${fact.label}-${fact.value}`} className="rounded-xl border border-cyan-100 bg-cyan-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">{fact.label}</p>
              <p className="mt-1 text-sm font-bold text-slate-900 break-all">{fact.value}</p>
            </div>
          ))}
        </div>

        <div className="mx-6 mb-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Message Body</p>
          </div>
          <div className="px-4 py-4">
            <p className="whitespace-pre-line text-sm leading-7 text-slate-700">{text || "No message body available"}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className={cn("px-5 py-4 text-white", theme.shellClass)}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-white/80">Dissanayake Super - Mail Center</p>
            <h3 className="mt-1 text-lg font-bold">{theme.title}</h3>
            <p className="mt-1 text-xs text-white/80">{mail.subject || "Message"}</p>
          </div>
          <span className={cn("rounded-full px-3 py-1 text-[11px] font-bold", theme.badgeClass)}>{theme.badge}</span>
        </div>
      </div>

      <div className={cn("border-l-4 px-5 py-3 text-sm font-medium", theme.panelClass)}>
        {theme.subtitle}
      </div>

      <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Name</p>
          <p className="mt-1 text-sm font-bold text-slate-900 break-words">{mail.from || "Unknown"}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">From Email</p>
          <p className="mt-1 text-sm font-bold text-slate-900 break-all">{mail.fromEmail || "-"}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Received Time</p>
          <p className="mt-1 text-sm font-bold text-slate-900 break-all">{mail.sentAt || "-"}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Labels</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {(mail.tags?.length ? mail.tags : [mail.category]).slice(0, 4).map((tag) => (
              <span key={tag} className="rounded-md bg-slate-200 px-2 py-1 text-[11px] font-medium text-slate-700">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {filterFactsByExcludedLabels(facts, ["Name", "From Email", "Received Time"]).length > 0 && (
        <div className="px-5 pb-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {filterFactsByExcludedLabels(facts, ["Name", "From Email", "Received Time"]).map((fact) => (
              <div key={`${fact.label}-${fact.value}`} className={cn("rounded-xl border p-4", theme.highlightClass)}>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">{fact.label}</p>
                <p className="mt-1 text-sm font-bold text-slate-900 break-all">{fact.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mx-5 mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Message Body</p>
        <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-700">{text || "No message body available"}</p>
      </div>

      <div className="border-t border-slate-100 bg-slate-50 px-5 py-3 text-xs text-slate-500">
        Themed mail detail renderer active for all mailbox message types
      </div>
    </div>
  );
}

export default function MailBox() {
  const { showToast } = useToast();
  const [folderMails, setFolderMails] = useState<FolderMessages>(EMPTY_FOLDERS);
  const [folderLoaded, setFolderLoaded] = useState<FolderState>(EMPTY_FOLDER_STATE);
  const [folderLoading, setFolderLoading] = useState<FolderState>(EMPTY_FOLDER_STATE);
  const [activeFolder, setActiveFolder] = useState<MailCategory>("Inbox");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeMailId, setActiveMailId] = useState<number | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [composeOpen, setComposeOpen] = useState(false);
  const [composeSending, setComposeSending] = useState(false);
  const [compose, setCompose] = useState<ComposeState>({
    to: "",
    subject: "",
    body: "",
  });

  const folderLoadedRef = useRef<FolderState>(EMPTY_FOLDER_STATE);
  const folderLoadingRef = useRef<FolderState>(EMPTY_FOLDER_STATE);
  const activeFolderRef = useRef<MailCategory>("Inbox");

  useEffect(() => {
    folderLoadedRef.current = folderLoaded;
  }, [folderLoaded]);

  useEffect(() => {
    folderLoadingRef.current = folderLoading;
  }, [folderLoading]);

  useEffect(() => {
    activeFolderRef.current = activeFolder;
  }, [activeFolder]);

  const updateFolders = useCallback((updater: (prev: FolderMessages) => FolderMessages) => {
    setFolderMails((prev) => {
      const next = updater(prev);
      writeMailboxCache(next);
      return next;
    });
  }, []);

  const loadFolder = useCallback(
    async (folder: MailCategory, forceRefresh = false) => {
      if (folder === "Archive") {
        setFolderLoaded((prev) => {
          const next = { ...prev, Archive: true };
          folderLoadedRef.current = next;
          return next;
        });
        return;
      }
      if (folderLoadingRef.current[folder]) return;
      if (folderLoadedRef.current[folder] && !forceRefresh) return;

      setFolderLoading((prev) => {
        const next = { ...prev, [folder]: true };
        folderLoadingRef.current = next;
        return next;
      });
      try {
        const data = folder === "Inbox" ? await fetchInbox(20) : await fetchSent(20);
        const normalized = normalizeMails(data, folder);

        updateFolders((prev) => ({
          ...prev,
          [folder]: normalized,
        }));

        setFolderLoaded((prev) => {
          const next = { ...prev, [folder]: true };
          folderLoadedRef.current = next;
          return next;
        });
        if (activeFolderRef.current === folder) setLoadError(null);
      } catch (error: any) {
        if (activeFolderRef.current === folder) {
          const msg = error?.response?.data?.message || "Failed to load Gmail mailbox.";
          setLoadError(msg);
        }
      } finally {
        setFolderLoading((prev) => {
          const next = { ...prev, [folder]: false };
          folderLoadingRef.current = next;
          return next;
        });
      }
    },
    [updateFolders]
  );

  useEffect(() => {
    const cached = readMailboxCache();
    if (cached) {
      setFolderMails(cached);
      setFolderLoaded({
        Inbox: cached.Inbox.length > 0,
        Sent: cached.Sent.length > 0,
        Archive: true,
      });
      setIsInitializing(false);
    }

    let disposed = false;
    const bootstrap = async () => {
      await loadFolder("Inbox", true);
      if (!disposed) {
        setIsInitializing(false);
        window.setTimeout(() => {
          if (!disposed) {
            loadFolder("Sent");
          }
        }, 250);
      }
    };

    bootstrap();
    return () => {
      disposed = true;
    };
  }, [loadFolder]);

  useEffect(() => {
    loadFolder(activeFolder);
  }, [activeFolder, loadFolder]);

  const allMails = useMemo(
    () => [...folderMails.Inbox, ...folderMails.Sent, ...folderMails.Archive],
    [folderMails]
  );

  const visibleMails = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return folderMails[activeFolder].filter((mail) => {
      if (!q) return true;
      return (
        (mail.from || "").toLowerCase().includes(q) ||
        (mail.subject || "").toLowerCase().includes(q) ||
        (mail.preview || "").toLowerCase().includes(q)
      );
    });
  }, [folderMails, activeFolder, searchTerm]);

  useEffect(() => {
    if (!visibleMails.length) {
      setActiveMailId(null);
      return;
    }
    if (activeMailId === null || !visibleMails.some((m) => m.id === activeMailId)) {
      setActiveMailId(visibleMails[0].id);
    }
  }, [visibleMails, activeMailId]);

  const activeMail = visibleMails.find((m) => m.id === activeMailId) ?? null;
  const activeMailText = useMemo(
    () => decodeEntities(activeMail?.body || activeMail?.preview || ""),
    [activeMail?.id, activeMail?.body, activeMail?.preview]
  );
  const parsedPoMail = useMemo(() => {
    if (!activeMail) return null;
    const parsed = parsePurchaseOrderEmail(activeMailText);
    if (!parsed) return null;
    return {
      ...parsed,
      senderName: activeMail.from || "Unknown",
    };
  }, [activeMail, activeMailText]);

  const parsedPoConfirmedMail = useMemo(() => {
    if (!activeMail) return null;
    const parsed = parsePurchaseOrderConfirmedEmail(activeMailText);
    if (!parsed) return null;
    return {
      ...parsed,
      senderName: activeMail.from || "Unknown",
    };
  }, [activeMail, activeMailText]);

  const folderCount = (folder: MailCategory) => folderMails[folder].length;
  const unreadInbox = folderMails.Inbox.filter((m) => m.unread).length;

  const toggleStar = (id: number) => {
    updateFolders((prev) => ({
      Inbox: prev.Inbox.map((mail) => (mail.id === id ? { ...mail, starred: !mail.starred } : mail)),
      Sent: prev.Sent.map((mail) => (mail.id === id ? { ...mail, starred: !mail.starred } : mail)),
      Archive: prev.Archive.map((mail) => (mail.id === id ? { ...mail, starred: !mail.starred } : mail)),
    }));
  };

  const markAsRead = (id: number) => {
    updateFolders((prev) => ({
      Inbox: prev.Inbox.map((mail) => (mail.id === id ? { ...mail, unread: false } : mail)),
      Sent: prev.Sent,
      Archive: prev.Archive,
    }));
  };

  const handleComposeSend = async () => {
    if (!compose.to.trim() || !compose.subject.trim() || !compose.body.trim()) {
      showToast({ type: "warning", title: "Missing fields", message: "To, Subject and Message are required." });
      return;
    }

    setComposeSending(true);
    try {
      await sendMailboxEmail({
        to: compose.to.trim(),
        subject: compose.subject.trim(),
        body: compose.body.trim(),
      });

      showToast({ type: "success", title: "Email Sent", message: "Your Gmail message was sent successfully." });

      const optimisticSent: MailboxMessage = {
        id: Date.now(),
        from: "You",
        fromEmail: "",
        subject: compose.subject.trim(),
        preview: compose.body.trim().slice(0, 160),
        body: compose.body.trim(),
        category: "Sent",
        sentAt: new Date().toISOString(),
        unread: false,
        starred: false,
        tags: ["Manual"],
      };

      updateFolders((prev) => ({
        ...prev,
        Sent: [optimisticSent, ...prev.Sent],
      }));
      setFolderLoaded((prev) => ({ ...prev, Sent: true }));
      setActiveFolder("Sent");
      setActiveMailId(optimisticSent.id);
      setCompose({ to: "", subject: "", body: "" });
      setComposeOpen(false);
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Failed to send Gmail email.";
      showToast({ type: "error", title: "Send Failed", message: msg });
    } finally {
      setComposeSending(false);
    }
  };

  const selectedFolderLoading = folderLoading[activeFolder];
  const hasAnyMails = allMails.length > 0;

  return (
    <div className="flex h-screen flex-col bg-background">
      <AppHeader />

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-600 shrink-0 border border-teal-100">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Mail Box</h1>
              <p className="text-sm text-slate-500 mt-1">Live Gmail Inbox and Sent mailbox inside your POS</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setComposeOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            Compose Email
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Inbox className="h-6 w-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-slate-500 whitespace-nowrap">Inbox Messages</span>
                <span className="mt-1 text-2xl font-bold text-slate-900 leading-none">{folderCount("Inbox")}</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100">
              <span className="text-sm text-slate-500">{unreadInbox} unread right now</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Send className="h-6 w-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-slate-500 whitespace-nowrap">Sent Emails</span>
                <span className="mt-1 text-2xl font-bold text-slate-900 leading-none">{folderCount("Sent")}</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100">
              <span className="text-sm text-slate-500">Outgoing real Gmail messages</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Clock3 className="h-6 w-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-slate-500 whitespace-nowrap">Pending Follow-ups</span>
                <span className="mt-1 text-2xl font-bold text-slate-900 leading-none">{unreadInbox}</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100">
              <span className="text-sm text-slate-500">Unread inbox messages awaiting action</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Star className="h-6 w-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-slate-500 whitespace-nowrap">Starred Threads</span>
                <span className="mt-1 text-2xl font-bold text-slate-900 leading-none">{allMails.filter((m) => m.starred).length}</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100">
              <span className="text-sm text-slate-500">Important operational mails</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50/70 px-4 sm:px-6 py-4">
            <div className="flex flex-col lg:flex-row lg:items-center gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {FOLDERS.map((folder) => (
                  <button
                    key={folder.key}
                    type="button"
                    onClick={() => setActiveFolder(folder.key)}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
                      activeFolder === folder.key
                        ? "border-teal-200 bg-teal-50 text-teal-700"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <folder.icon className="h-4 w-4" />
                    {folder.label}
                    <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">{folderCount(folder.key)}</span>
                  </button>
                ))}
              </div>

              <div className="relative w-full lg:ml-auto lg:max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by sender, subject, or preview"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-100"
                />
              </div>
            </div>
          </div>

          {isInitializing && !hasAnyMails ? (
            <div className="flex min-h-[520px] items-center justify-center">
              <div className="inline-flex items-center gap-2 text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin" />
                Fast loading mailbox...
              </div>
            </div>
          ) : loadError && !hasAnyMails ? (
            <div className="flex min-h-[520px] items-center justify-center p-6">
              <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{loadError}</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] min-h-[560px]">
              <div className="border-r border-slate-100 bg-white">
                <div className="h-full overflow-y-auto p-3 sm:p-4 space-y-2">
                  {selectedFolderLoading && (
                    <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Syncing {activeFolder.toLowerCase()}...
                    </div>
                  )}

                  {visibleMails.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                      {selectedFolderLoading ? "Loading emails..." : "No emails match your filter."}
                    </div>
                  ) : (
                    visibleMails.map((mail) => (
                      <button
                        key={`${mail.category}-${mail.id}-${mail.sentAt}`}
                        type="button"
                        onClick={() => {
                          setActiveMailId(mail.id);
                          if (mail.unread) markAsRead(mail.id);
                        }}
                        className={cn(
                          "w-full rounded-xl border p-3 text-left transition-all",
                          activeMail?.id === mail.id
                            ? "border-teal-200 bg-teal-50/60 shadow-sm"
                            : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 text-xs font-bold">
                            {(mail.from || "?").slice(0, 2).toUpperCase()}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className={cn("truncate text-sm", mail.unread ? "font-bold text-slate-900" : "font-semibold text-slate-700")}>{mail.from || "Unknown"}</p>
                              <span className="shrink-0 text-xs text-slate-400">{formatMailTime(mail.sentAt)}</span>
                            </div>

                            <p className={cn("mt-0.5 truncate text-sm", mail.unread ? "font-semibold text-slate-800" : "text-slate-600")}>{mail.subject || "(No Subject)"}</p>
                            <p className="mt-1 line-clamp-2 text-xs text-slate-500">{mail.preview || "No preview available"}</p>

                            <div className="mt-2 flex items-center gap-2">
                              {mail.unread && (
                                <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-1.5 py-0.5 text-[11px] font-medium text-blue-700">
                                  <CircleDot className="h-3 w-3" />
                                  Unread
                                </span>
                              )}
                              <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600">{mail.category}</span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-slate-50/40">
                {activeMail ? (
                  <div className="h-full flex flex-col">
                    <div className="border-b border-slate-100 bg-white px-4 sm:px-6 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h2 className="text-lg font-bold text-slate-900 tracking-tight">{activeMail.subject || "(No Subject)"}</h2>
                          <p className="mt-1 text-sm text-slate-500">
                            From <span className="font-medium text-slate-700">{activeMail.from || "Unknown"}</span>
                            {activeMail.fromEmail ? ` (${activeMail.fromEmail})` : ""}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleStar(activeMail.id)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-amber-600 hover:border-amber-200 hover:bg-amber-50 transition-colors"
                          >
                            {activeMail.starred ? <Star className="h-4 w-4 text-amber-500" /> : <StarOff className="h-4 w-4" />}
                          </button>
                          <button
                            type="button"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-teal-600 hover:border-teal-200 hover:bg-teal-50 transition-colors"
                          >
                            <Reply className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-teal-600 hover:border-teal-200 hover:bg-teal-50 transition-colors"
                          >
                            <Forward className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
                        <div className="mb-4 flex flex-wrap items-center gap-2">
                          <span className="rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700">{activeMail.category}</span>
                          <span className="ml-auto inline-flex items-center gap-1 text-xs text-slate-400">
                            <Paperclip className="h-3.5 w-3.5" />
                            Attachment parsing coming soon
                          </span>
                        </div>

                        <GenericMailDetailCard mail={activeMail} text={activeMailText} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center p-6">
                    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
                      <Mail className="mx-auto h-8 w-8 text-slate-400" />
                      <p className="mt-3 text-sm font-medium text-slate-700">No email selected</p>
                      <p className="mt-1 text-xs text-slate-500">Pick a message from the list to preview it here.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {composeOpen && (
        <div className="fixed inset-0 z-[70] bg-slate-950/40 px-4 py-6 sm:px-6 flex items-center justify-center">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h3 className="text-base font-bold text-slate-900">Compose Email</h3>
              <button
                type="button"
                onClick={() => setComposeOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">To</label>
                <input
                  value={compose.to}
                  onChange={(e) => setCompose((prev) => ({ ...prev, to: e.target.value }))}
                  placeholder="supplier@example.com"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Subject</label>
                <input
                  value={compose.subject}
                  onChange={(e) => setCompose((prev) => ({ ...prev, subject: e.target.value }))}
                  placeholder="Purchase Order Follow-up"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Message</label>
                <textarea
                  value={compose.body}
                  onChange={(e) => setCompose((prev) => ({ ...prev, body: e.target.value }))}
                  rows={9}
                  placeholder="Type your email..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-100 resize-y"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-4">
              <button
                type="button"
                onClick={() => setComposeOpen(false)}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleComposeSend}
                disabled={composeSending}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
              >
                {composeSending && <Loader2 className="h-4 w-4 animate-spin" />}
                Send Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
