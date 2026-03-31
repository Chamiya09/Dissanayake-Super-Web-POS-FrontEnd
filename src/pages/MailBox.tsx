import { useEffect, useMemo, useState } from "react";
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
  User,
  AtSign,
  CalendarClock,
  FileText,
  BadgeInfo,
  AlignLeft,
  ClipboardList,
  Building2,
  CircleDollarSign,
  ShieldCheck,
  Hash,
  Tag,
} from "lucide-react";
import { AppHeader } from "@/components/Layout/AppHeader";
import { cn } from "@/lib/utils";
import { useToast } from "@/context/GlobalToastContext";
import { fetchInbox, fetchSent, sendMailboxEmail, type MailboxMessage } from "@/api/mailboxApi";
import { getHistory } from "@/api/reorderApi";

type MailCategory = "Inbox" | "Sent" | "Archive";
type ReorderStatus = "Pending" | "Confirmed" | "Cancelled" | "Received";

const FOLDERS: Array<{ key: MailCategory; label: string; icon: React.ElementType }> = [
  { key: "Inbox", label: "Inbox", icon: Inbox },
  { key: "Sent", label: "Sent", icon: Send },
  { key: "Archive", label: "Archive", icon: Archive },
];

const MAILBOX_CACHE_KEY = "webpos_mailbox_cache_v2";
const INITIAL_MAIL_LIMIT = 15;

interface ComposeState {
  to: string;
  subject: string;
  body: string;
}

function normalizeDash(value: string): string {
  return value.replace(/[\u2013\u2014]/g, "-").toLowerCase();
}

function isWebPosMailFrontend(mail: MailboxMessage): boolean {
  const sender = normalizeDash((mail.from || "").trim());
  const senderEmail = (mail.fromEmail || "").trim().toLowerCase();
  const subject = (mail.subject || "").toLowerCase();
  const body = `${mail.body || ""} ${mail.preview || ""}`.toLowerCase();

  const senderLooksPos =
    sender.includes("dissanayake super - orders") ||
    sender.includes("dissanayake super") ||
    sender.includes("orders");

  const subjectLooksPos =
    subject.includes("purchase order") ||
    subject.includes("updated purchase order") ||
    subject.includes("new purchase order") ||
    subject.includes("outgoing mail") ||
    subject.includes("admin alert") ||
    subject.includes("supplier confirmed order") ||
    subject.includes("purchase order confirmed");

  const emailLooksPos = senderEmail.includes("dissanayake") || senderEmail.includes("orders");

  const bodyLooksPos =
    body.includes("dissanayake super inventory system") ||
    body.includes("this email was sent by the dissanayake super mailbox service") ||
    body.includes("supplier action required") ||
    body.includes("purchase order confirmation received") ||
    body.includes("internal confirmation notice");

  return senderLooksPos || (subjectLooksPos && emailLooksPos) || (emailLooksPos && bodyLooksPos);
}

function toMailSignature(mail: MailboxMessage): string {
  const normalize = (value: string) =>
    decodeEntities(value || "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();

  const subject = normalize(mail.subject || "");
  const from = normalize(mail.from || "");
  const fromEmail = normalize(mail.fromEmail || "");
  const bodyOrPreview = normalize(mail.body || mail.preview || "").slice(0, 240);
  const sentMinute = (() => {
    if (!mail.sentAt) return "";
    const d = new Date(mail.sentAt);
    if (Number.isNaN(d.getTime())) return "";
    d.setSeconds(0, 0);
    return d.toISOString();
  })();

  return `${subject}|${from}|${fromEmail}|${bodyOrPreview}|${sentMinute}`;
}

function deduplicateMails(mails: MailboxMessage[]): MailboxMessage[] {
  const bySignature = new Map<string, MailboxMessage>();

  for (const mail of mails) {
    const key = toMailSignature(mail);
    const existing = bySignature.get(key);
    if (!existing) {
      bySignature.set(key, mail);
      continue;
    }

    const bestBody = (mail.body || "").length >= (existing.body || "").length ? mail.body : existing.body;
    const bestPreview = (mail.preview || "").length >= (existing.preview || "").length ? mail.preview : existing.preview;
    const bestFromEmail = (existing.fromEmail || "").length >= (mail.fromEmail || "").length ? existing.fromEmail : mail.fromEmail;
    const bestFrom = (existing.from || "").length >= (mail.from || "").length ? existing.from : mail.from;

    const existingTime = existing.sentAt ? new Date(existing.sentAt).getTime() : 0;
    const incomingTime = mail.sentAt ? new Date(mail.sentAt).getTime() : 0;
    const primary = incomingTime > existingTime ? mail : existing;
    const secondary = primary === mail ? existing : mail;

    bySignature.set(key, {
      ...primary,
      body: bestBody || primary.body || secondary.body,
      preview: bestPreview || primary.preview || secondary.preview,
      from: bestFrom || primary.from || secondary.from,
      fromEmail: bestFromEmail || primary.fromEmail || secondary.fromEmail,
      unread: primary.unread || secondary.unread,
      starred: primary.starred || secondary.starred,
      category:
        primary.category === "Inbox" || secondary.category === "Inbox"
          ? "Inbox"
          : primary.category,
      tags: Array.from(new Set([...(primary.tags || []), ...(secondary.tags || [])])),
    });
  }

  return Array.from(bySignature.values()).sort((a, b) => {
    const at = a.sentAt ? new Date(a.sentAt).getTime() : 0;
    const bt = b.sentAt ? new Date(b.sentAt).getTime() : 0;
    return bt - at;
  });
}

type ParsedPurchaseOrderMessage = {
  orderRef: string;
  datePlaced: string;
  supplierName: string;
  supplierEmail: string;
  placedBy: string;
  placedByRole: string;
  totalLkr: string;
  status: "Pending" | "Confirmed" | "Cancelled" | "Received";
  infoText: string;
};

function detectReorderStatusFromMail(subject: string, body: string): ParsedPurchaseOrderMessage["status"] {
  const text = `${decodeEntities(subject)} ${decodeEntities(body)}`.toLowerCase();

  if (/\breceived\b/.test(text) || /\bmarked as received\b/.test(text)) {
    return "Received";
  }
  if (/\bcancelled\b/.test(text)) {
    return "Cancelled";
  }
  if (/supplier confirmed order/.test(text) || /\bconfirmed\b/.test(text) || /\baccepted\b/.test(text) || /\blocked\b/.test(text)) {
    return "Confirmed";
  }
  return "Pending";
}

function resolveStatusForOrderRef(
  orderRef: string,
  allMails: MailboxMessage[],
  fallback: ParsedPurchaseOrderMessage["status"],
  orderStatusByRef: Record<string, ReorderStatus>
): ParsedPurchaseOrderMessage["status"] {
  if (!orderRef || !allMails.length) return fallback;

  const mapped = orderStatusByRef[orderRef];
  if (mapped) return mapped;

  const related = allMails.filter((m) => {
    const combined = `${m.subject || ""} ${m.body || ""} ${m.preview || ""}`.toLowerCase();
    return combined.includes(orderRef.toLowerCase());
  });

  if (!related.length) return fallback;

  const statuses = related.map((m) => detectReorderStatusFromMail(m.subject || "", m.body || m.preview || ""));

  if (statuses.includes("Received")) return "Received";
  if (statuses.includes("Cancelled")) return "Cancelled";
  if (statuses.includes("Confirmed")) return "Confirmed";
  return "Pending";
}

function parsePurchaseOrderMessage(subject: string, message: string): ParsedPurchaseOrderMessage | null {
  const text = decodeEntities(message);
  const subjectText = decodeEntities(subject);

  if (!/purchase\s+order/i.test(text) && !/purchase\s+order/i.test(subjectText)) {
    return null;
  }

  const orderRef =
    subjectText.match(/\bPO-\d{6,}\b/i)?.[0] ??
    text.match(/\bPO-\d{6,}\b/i)?.[0] ??
    "";

  const datePlaced =
    text.match(/Date\s+Placed\s*:?\s*(\d{4}-\d{2}-\d{2})/i)?.[1] ??
    text.match(/Date\s*:?\s*(\d{1,2}\s+[A-Za-z]+\s+\d{4})/i)?.[1] ??
    text.match(/(\d{4}-\d{2}-\d{2})/)?.[1] ??
    "";

  const supplierBlock = text.match(/Supplier\s+([\s\S]*?)\s+Placed\s+By/i)?.[1] ?? "";
  const supplierEmailFromBlock =
    supplierBlock.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/)?.[0] ?? "";
  const supplierNameFromBlock = supplierBlock
    .replace(supplierEmailFromBlock, "")
    .replace(/\s+/g, " ")
    .trim();

  const supplierSection = text.match(
    /Supplier\s+(.+?)\s+([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/i
  );

  const supplierEmailFromTo =
    text.match(/\bTo\s*:?\s*([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/i)?.[1] ?? "";

  const supplierNameFromGreeting =
    text.match(/\bDear\s+([^,]+),/i)?.[1]?.trim() ?? "";

  const placedBySection = text.match(
    /Placed\s+By\s+(.+?)\s+(Purchasing\s+Manager|Manager|Owner|Staff)/i
  );

  const authorisedBy =
    text.match(/Authori[sz]ed\s+by\s*:?\s*(.+?)\s+Purchasing\s+Department/i)?.[1]?.trim() ??
    text.match(/Authori[sz]ed\s+by\s*:?\s*(.+)/i)?.[1]?.trim() ??
    "";

  const totalLkr =
    text.match(/Order\s+Total\s+LKR\s*([\d,.]+(?:\.\d{1,2})?)/i)?.[1] ??
    text.match(/LKR\s*([\d,.]+(?:\.\d{1,2})?)/i)?.[1] ??
    "";

  const infoText =
    text.match(/Info\s+(.+?)\s+Order\s+Reference/i)?.[1]?.trim() ??
    "A purchase order has been created and supplier has been notified.";

  let status: ParsedPurchaseOrderMessage["status"] = "Pending";
  if (/\breceived\b/i.test(text) || /\bmarked as received\b/i.test(text)) {
    status = "Received";
  } else if (/\bconfirmed\b/i.test(text) || /\baccepted\b/i.test(text) || /\blocked\b/i.test(text)) {
    status = "Confirmed";
  } else if (/\bcancelled\b/i.test(text)) {
    status = "Cancelled";
  }

  if (!orderRef && !totalLkr) {
    return null;
  }

  return {
    orderRef: orderRef || "N/A",
    datePlaced: datePlaced || "N/A",
    supplierName:
      supplierNameFromBlock ||
      supplierNameFromGreeting ||
      supplierSection?.[1]?.trim() ||
      "Supplier",
    supplierEmail:
      supplierEmailFromBlock ||
      supplierEmailFromTo ||
      supplierSection?.[2]?.trim() ||
      "N/A",
    placedBy: placedBySection?.[1]?.trim() || authorisedBy || "N/A",
    placedByRole: placedBySection?.[2]?.trim() || (authorisedBy ? "Purchasing Department" : "N/A"),
    totalLkr: totalLkr || "0.00",
    status,
    infoText,
  };
}

function MessageContentCard({
  subject,
  message,
  allMails,
  orderStatusByRef,
}: {
  subject: string;
  message: string;
  allMails: MailboxMessage[];
  orderStatusByRef: Record<string, ReorderStatus>;
}) {
  const parsedPurchaseOrder = parsePurchaseOrderMessage(subject, message);

  if (parsedPurchaseOrder) {
    const effectiveStatus = resolveStatusForOrderRef(
      parsedPurchaseOrder.orderRef,
      allMails,
      parsedPurchaseOrder.status,
      orderStatusByRef
    );

    const reorderStatusStyles: Record<ParsedPurchaseOrderMessage["status"], string> = {
      Pending: "bg-amber-50 text-amber-700 border-amber-200",
      Confirmed: "bg-blue-50 text-blue-700 border-blue-200",
      Received: "bg-emerald-50 text-emerald-700 border-emerald-200",
      Cancelled: "bg-red-50 text-red-600 border-red-200",
    };

    const statusColor =
      reorderStatusStyles[effectiveStatus] ?? "bg-slate-50 text-slate-700 border-slate-200";

    return (
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50 px-4 py-2.5">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <FileText className="h-3.5 w-3.5" />
            Subject
          </div>
          <p className="mt-1 text-sm font-semibold text-slate-900">{subject || "No Subject"}</p>
        </div>

        <div className="p-4 sm:p-5 space-y-4">
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
            <p className="text-sm text-blue-800">{parsedPurchaseOrder.infoText}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <ClipboardList className="h-3.5 w-3.5" />
                Order Reference
              </div>
              <p className="mt-1 text-sm font-semibold text-slate-900">{parsedPurchaseOrder.orderRef}</p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <CalendarClock className="h-3.5 w-3.5" />
                Date Placed
              </div>
              <p className="mt-1 text-sm font-semibold text-slate-900">{parsedPurchaseOrder.datePlaced}</p>
            </div>

            <div className={cn("rounded-lg border p-3", statusColor)}>
              <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider">
                <ShieldCheck className="h-3.5 w-3.5" />
                Status
              </div>
              <p className="mt-1 text-sm font-semibold">{effectiveStatus}</p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 sm:col-span-2">
              <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <Building2 className="h-3.5 w-3.5" />
                Supplier
              </div>
              <p className="mt-1 text-sm font-semibold text-slate-900">{parsedPurchaseOrder.supplierName}</p>
              <p className="mt-0.5 text-xs text-slate-600">{parsedPurchaseOrder.supplierEmail}</p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <User className="h-3.5 w-3.5" />
                Placed By
              </div>
              <p className="mt-1 text-sm font-semibold text-slate-900">{parsedPurchaseOrder.placedBy}</p>
              <p className="mt-0.5 text-xs text-slate-600">{parsedPurchaseOrder.placedByRole}</p>
            </div>
          </div>

          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
            <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
              <CircleDollarSign className="h-3.5 w-3.5" />
              Order Total
            </div>
            <p className="mt-1 text-lg font-bold text-slate-900">LKR {parsedPurchaseOrder.totalLkr}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="border-b border-slate-100 bg-slate-50 px-4 py-2.5">
        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          <FileText className="h-3.5 w-3.5" />
          Subject
        </div>
        <p className="mt-1 text-sm font-semibold text-slate-900">{subject || "No Subject"}</p>
      </div>

      <div className="p-4 sm:p-5">
        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
          <AlignLeft className="h-3.5 w-3.5" />
          Message
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
          <p className="whitespace-pre-line text-sm leading-7 text-slate-700">{message || "No message body available"}</p>
        </div>
      </div>
    </div>
  );
}

function decodeEntities(input: string): string {
  if (!input) return "";
  return input
    .replace(/&mdash;/g, "-")
    .replace(/&nbsp;/g, " ")
    .replace(/&middot;/g, "·")
    .replace(/&#x23F3;/g, "Pending")
    .replace(/&#x2139;&#xFE0F;/g, "Info")
    .replace(/&#x2713;/g, "Confirmed")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
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


export default function MailBox() {
  const { showToast } = useToast();
  const [mails, setMails] = useState<MailboxMessage[]>([]);
  const [orderStatusByRef, setOrderStatusByRef] = useState<Record<string, ReorderStatus>>({});
  const [activeFolder, setActiveFolder] = useState<MailCategory>("Inbox");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeMailId, setActiveMailId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [composeOpen, setComposeOpen] = useState(false);
  const [composeSending, setComposeSending] = useState(false);
  const [compose, setCompose] = useState<ComposeState>({
    to: "",
    subject: "",
    body: "",
  });

  useEffect(() => {
    let mounted = true;

    const applyCachedMailbox = () => {
      try {
        const raw = sessionStorage.getItem(MAILBOX_CACHE_KEY);
        if (!raw) return false;

        const cached = JSON.parse(raw) as MailboxMessage[];
        if (!Array.isArray(cached) || cached.length === 0) return false;

        const cachedUnique = deduplicateMails(cached).filter(isWebPosMailFrontend);
        if (!cachedUnique.length) return false;

        setMails(cachedUnique);
        const firstInbox = cachedUnique.find((m) => m.category === "Inbox");
        const fallback = cachedUnique[0] ?? null;
        setActiveMailId((firstInbox ?? fallback)?.id ?? null);
        return true;
      } catch {
        return false;
      }
    };

    const hasCachedData = applyCachedMailbox();
    setIsLoading(!hasCachedData);

    const loadMailbox = async () => {
      if (!hasCachedData) {
        setIsLoading(true);
      }
      setLoadError(null);
      try {
        const [inboxResult, sentResult, historyResult] = await Promise.allSettled([
          fetchInbox(INITIAL_MAIL_LIMIT),
          fetchSent(INITIAL_MAIL_LIMIT),
          getHistory([]),
        ]);

        if (inboxResult.status !== "fulfilled" || sentResult.status !== "fulfilled") {
          throw new Error("Failed to fetch mailbox messages");
        }

        const inbox = inboxResult.value;
        const sent = sentResult.value;

        if (historyResult.status === "fulfilled") {
          const statusMap: Record<string, ReorderStatus> = {};
          for (const order of historyResult.value || []) {
            const ref = (order?.orderRef || "").trim();
            const status = (order?.status || "").trim();
            if (!ref) continue;
            if (status === "Pending" || status === "Confirmed" || status === "Cancelled" || status === "Received") {
              statusMap[ref] = status;
            }
          }
          setOrderStatusByRef(statusMap);
        }

        if (!mounted) return;

        const normalized = [...inbox, ...sent]
          .map((mail) => ({
            ...mail,
            category: (mail.category || "Inbox") as MailCategory,
            tags: Array.isArray(mail.tags) ? mail.tags : [],
          }))
          .filter(isWebPosMailFrontend);

        const uniqueMails = deduplicateMails(normalized);

        setMails(uniqueMails);
        sessionStorage.setItem(MAILBOX_CACHE_KEY, JSON.stringify(uniqueMails));

        const firstInbox = uniqueMails.find((m) => m.category === "Inbox");
        const fallback = uniqueMails[0] ?? null;
        setActiveMailId((firstInbox ?? fallback)?.id ?? null);
      } catch (error: any) {
        if (!mounted) return;
        const msg = error?.response?.data?.message || "Failed to load Gmail mailbox.";
        setLoadError(msg);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadMailbox();
    return () => {
      mounted = false;
    };
  }, []);

  const visibleMails = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return mails.filter((mail) => {
      if (mail.category !== activeFolder) return false;
      if (!q) return true;
      return (
        (mail.from || "").toLowerCase().includes(q) ||
        (mail.subject || "").toLowerCase().includes(q) ||
        (mail.preview || "").toLowerCase().includes(q)
      );
    });
  }, [mails, activeFolder, searchTerm]);

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
  const activeMailText = decodeEntities(activeMail?.body || activeMail?.preview || "");

  const folderCount = (folder: MailCategory) => mails.filter((m) => m.category === folder).length;
  const unreadInbox = mails.filter((m) => m.category === "Inbox" && m.unread).length;

  const toggleStar = (id: number) => {
    setMails((prev) => prev.map((mail) => (mail.id === id ? { ...mail, starred: !mail.starred } : mail)));
  };

  const markAsRead = (id: number) => {
    setMails((prev) => prev.map((mail) => (mail.id === id ? { ...mail, unread: false } : mail)));
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

      setMails((prev) => deduplicateMails([optimisticSent, ...prev]));
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
                <span className="mt-1 text-2xl font-bold text-slate-900 leading-none">{Math.max(0, unreadInbox - 1)}</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100">
              <span className="text-sm text-slate-500">Unread vendor replies</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Star className="h-6 w-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-slate-500 whitespace-nowrap">Starred Threads</span>
                <span className="mt-1 text-2xl font-bold text-slate-900 leading-none">{mails.filter((m) => m.starred).length}</span>
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

          {isLoading ? (
            <div className="flex min-h-[520px] items-center justify-center">
              <div className="inline-flex items-center gap-2 text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading Gmail mailbox...
              </div>
            </div>
          ) : loadError ? (
            <div className="flex min-h-[520px] items-center justify-center p-6">
              <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{loadError}</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] min-h-[560px]">
              <div className="border-r border-slate-100 bg-white">
                <div className="h-full overflow-y-auto p-3 sm:p-4 space-y-2">
                  {visibleMails.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                      No emails match your filter.
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

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-5">
                          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                              <User className="h-3.5 w-3.5" />
                              Sender
                            </div>
                            <p className="mt-1.5 text-sm font-semibold text-slate-900 truncate">{activeMail.from || "Unknown"}</p>
                          </div>

                          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                              <AtSign className="h-3.5 w-3.5" />
                              Email
                            </div>
                            <p className="mt-1.5 text-sm font-semibold text-slate-900 truncate">{activeMail.fromEmail || "N/A"}</p>
                          </div>

                          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                              <CalendarClock className="h-3.5 w-3.5" />
                              Received
                            </div>
                            <p className="mt-1.5 text-sm font-semibold text-slate-900 truncate">{activeMail.sentAt ? new Date(activeMail.sentAt).toLocaleString() : "N/A"}</p>
                          </div>

                          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                              <BadgeInfo className="h-3.5 w-3.5" />
                              Status
                            </div>
                            <p className="mt-1.5 text-sm font-semibold text-slate-900">{activeMail.unread ? "Unread" : "Read"}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mb-5">
                          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                              <Hash className="h-3.5 w-3.5" />
                              Message ID
                            </div>
                            <p className="mt-1.5 text-sm font-semibold text-slate-900">{activeMail.id}</p>
                          </div>

                          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                              <Tag className="h-3.5 w-3.5" />
                              Real Mail States
                            </div>
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              {(activeMail.tags?.length ? activeMail.tags : [activeMail.category, activeMail.unread ? "Unread" : "Read", activeMail.starred ? "Starred" : "Unstarred"]).map((stateTag, idx) => (
                                <span
                                  key={`${stateTag}-${idx}`}
                                  className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700"
                                >
                                  {stateTag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <MessageContentCard
                          subject={activeMail.subject || "No Subject"}
                          message={activeMailText || "No message body available"}
                          allMails={mails}
                          orderStatusByRef={orderStatusByRef}
                        />
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
