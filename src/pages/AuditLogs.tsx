import { useCallback, useEffect, useState } from "react";
import { ShieldCheck, Search, RotateCcw } from "lucide-react";
import { AppHeader } from "@/components/Layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { auditLogApi, type AuditLog } from "@/api/auditLogApi";
import { useToast } from "@/context/GlobalToastContext";

export default function AuditLogs() {
  const { showToast } = useToast();
  const [rows, setRows] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);

  const [action, setAction] = useState("");
  const [userId, setUserId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await auditLogApi.getLogs({
        action: action.trim() || undefined,
        userId: userId.trim() ? Number(userId) : undefined,
        from: from ? new Date(from).toISOString() : undefined,
        to: to ? new Date(to).toISOString() : undefined,
        page,
        size: 20,
      });

      setRows(data.content || []);
      setTotalPages(data.totalPages || 0);
    } catch {
      showToast("Failed to load audit logs.", "error", "Error");
    } finally {
      setLoading(false);
    }
  }, [action, from, page, showToast, to, userId]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleReset = () => {
    setAction("");
    setUserId("");
    setFrom("");
    setTo("");
    setPage(0);
  };

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <AppHeader />

      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto w-full max-w-7xl space-y-6">
          <div className="flex items-center gap-3 rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Audit Logs</h1>
              <p className="text-sm text-slate-500">Track sensitive system actions across the POS.</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
              <Input
                placeholder="Filter action (DELETE, VOID...)"
                value={action}
                onChange={(e) => setAction(e.target.value)}
                className="h-10"
              />
              <Input
                type="number"
                min="1"
                placeholder="User ID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="h-10"
              />
              <Input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} className="h-10" />
              <Input type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} className="h-10" />
              <div className="flex gap-2">
                <Button onClick={() => { setPage(0); loadLogs(); }} className="h-10 flex-1 bg-indigo-600 hover:bg-indigo-700">
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </Button>
                <Button variant="outline" onClick={handleReset} className="h-10">
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">User ID</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {!loading && rows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                        No logs found for the current filters.
                      </td>
                    </tr>
                  ) : (
                    rows.map((log) => (
                      <tr key={log.id} className="border-t border-slate-100 text-slate-700">
                        <td className="px-4 py-3">{new Date(log.timestamp).toLocaleString()}</td>
                        <td className="px-4 py-3">{log.userId ?? "--"}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 max-w-[520px] truncate" title={log.details ?? ""}>
                          {log.details || "--"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
              <p className="text-xs text-slate-500">Page {page + 1} of {Math.max(totalPages, 1)}</p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={totalPages > 0 ? page >= totalPages - 1 : rows.length === 0}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
