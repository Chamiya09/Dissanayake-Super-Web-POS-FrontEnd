import api from "@/lib/axiosInstance";

export type AuditLog = {
  id: number;
  userId: number | null;
  action: string;
  timestamp: string;
  details: string | null;
};

export type AuditLogPage = {
  content: AuditLog[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
};

export type AuditLogFilters = {
  userId?: number;
  action?: string;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
};

export const auditLogApi = {
  getLogs(filters: AuditLogFilters): Promise<AuditLogPage> {
    return api
      .get<AuditLogPage>("/api/audit-logs", { params: filters })
      .then((r) => r.data);
  },
};
