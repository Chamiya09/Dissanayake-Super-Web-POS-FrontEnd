import api from "@/lib/axiosInstance";

export interface MailboxMessage {
  id: number;
  from: string;
  fromEmail: string;
  subject: string;
  preview: string;
  body: string;
  category: "Inbox" | "Sent" | "Archive";
  sentAt: string;
  unread: boolean;
  starred: boolean;
  tags: string[];
}

export interface SendMailboxEmailPayload {
  to: string;
  subject: string;
  body: string;
}

export async function fetchInbox(limit = 25): Promise<MailboxMessage[]> {
  const { data } = await api.get<MailboxMessage[]>("/api/v1/mailbox/inbox", {
    params: { limit },
  });
  return data;
}

export async function fetchSent(limit = 25): Promise<MailboxMessage[]> {
  const { data } = await api.get<MailboxMessage[]>("/api/v1/mailbox/sent", {
    params: { limit },
  });
  return data;
}

export async function sendMailboxEmail(payload: SendMailboxEmailPayload): Promise<void> {
  await api.post("/api/v1/mailbox/send", payload);
}
