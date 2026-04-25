import { useCallback, useEffect, useMemo, useState } from "react";
import { Wallet, PlayCircle, StopCircle, Clock3 } from "lucide-react";
import { AppHeader } from "@/components/Layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { shiftApi, type Shift } from "@/api/shiftApi";
import { useToast } from "@/context/GlobalToastContext";
import { formatCurrency } from "@/utils/formatCurrency";

const asMoney = (value: string) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Number(parsed.toFixed(2));
};

export default function ShiftManagement() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [currentShift, setCurrentShift] = useState<Shift | null>(null);
  const [history, setHistory] = useState<Shift[]>([]);
  const [openingCash, setOpeningCash] = useState("");
  const [closingCash, setClosingCash] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [historyData, currentData] = await Promise.all([
        shiftApi.getShiftHistory(),
        shiftApi.getCurrentShift().catch(() => null),
      ]);
      setHistory(historyData);
      setCurrentShift(currentData);
    } catch {
      showToast("Unable to load shift data.", "error", "Error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const shiftDuration = useMemo(() => {
    if (!currentShift?.startTime) return "--";
    const start = new Date(currentShift.startTime).getTime();
    const now = Date.now();
    const diffMin = Math.max(0, Math.floor((now - start) / 60000));
    const h = Math.floor(diffMin / 60);
    const m = diffMin % 60;
    return `${h}h ${m}m`;
  }, [currentShift]);

  const handleStartShift = async () => {
    const amount = asMoney(openingCash);
    if (amount === null) {
      showToast("Please enter a valid opening cash amount.", "warning", "Invalid Input");
      return;
    }

    setLoading(true);
    try {
      await shiftApi.startShift(amount);
      showToast("Shift started successfully.", "success", "Shift Started");
      setOpeningCash("");
      await loadData();
    } catch (err: any) {
      const message = err?.response?.data?.message || "Failed to start shift.";
      showToast(message, "error", "Error");
    } finally {
      setLoading(false);
    }
  };

  const handleEndShift = async () => {
    const amount = asMoney(closingCash);
    if (amount === null) {
      showToast("Please enter a valid closing cash amount.", "warning", "Invalid Input");
      return;
    }

    setLoading(true);
    try {
      const ended = await shiftApi.endShift(amount);
      showToast(
        `Shift closed. Total sales for this shift: ${formatCurrency(Number(ended.totalSales || 0))}`,
        "success",
        "Shift Closed"
      );
      setClosingCash("");
      await loadData();
    } catch (err: any) {
      const message = err?.response?.data?.message || "Failed to end shift.";
      showToast(message, "error", "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <AppHeader />

      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto w-full max-w-6xl space-y-6">
          <div className="flex items-center gap-3 rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Clock3 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Shift Management</h1>
              <p className="text-sm text-slate-500">Start and close cashier shifts with cash tracking.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Shift Status</p>
              <p className="mt-2 text-lg font-bold text-slate-900">
                {currentShift ? "Open" : "No active shift"}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current Duration</p>
              <p className="mt-2 text-lg font-bold text-slate-900">{currentShift ? shiftDuration : "--"}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Shift Sales</p>
              <p className="mt-2 text-lg font-bold text-slate-900">
                {formatCurrency(Number(currentShift?.totalSales || 0))}
              </p>
            </div>
          </div>

          {!currentShift ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2 text-indigo-700">
                <PlayCircle className="h-5 w-5" />
                <h2 className="text-lg font-semibold">Start Shift</h2>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto]">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Opening Cash (LKR)</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={openingCash}
                    onChange={(e) => setOpeningCash(e.target.value)}
                    placeholder="0.00"
                    className="h-11"
                  />
                </div>
                <div className="self-end">
                  <Button
                    onClick={handleStartShift}
                    disabled={loading}
                    className="h-11 bg-indigo-600 px-6 hover:bg-indigo-700"
                  >
                    <Wallet className="mr-2 h-4 w-4" />
                    Start Shift
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2 text-rose-700">
                <StopCircle className="h-5 w-5" />
                <h2 className="text-lg font-semibold">End Shift</h2>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Total Sales This Shift</p>
                  <p className="mt-2 text-2xl font-bold text-indigo-900">
                    {formatCurrency(Number(currentShift.totalSales || 0))}
                  </p>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Closing Cash (LKR)</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={closingCash}
                    onChange={(e) => setClosingCash(e.target.value)}
                    placeholder="0.00"
                    className="h-11"
                  />
                  <Button
                    onClick={handleEndShift}
                    disabled={loading}
                    className="mt-4 h-11 w-full bg-rose-600 hover:bg-rose-700"
                  >
                    End Shift
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-lg font-semibold text-slate-900">Shift History</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Start Time</th>
                    <th className="px-4 py-3">End Time</th>
                    <th className="px-4 py-3">Opening</th>
                    <th className="px-4 py-3">Closing</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 && !loading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                        No shifts recorded yet.
                      </td>
                    </tr>
                  ) : (
                    history.map((shift) => (
                      <tr key={shift.id} className="border-t border-slate-100 text-slate-700">
                        <td className="px-4 py-3">{new Date(shift.startTime).toLocaleString()}</td>
                        <td className="px-4 py-3">{shift.endTime ? new Date(shift.endTime).toLocaleString() : "--"}</td>
                        <td className="px-4 py-3">{formatCurrency(Number(shift.initialCash || 0))}</td>
                        <td className="px-4 py-3">{shift.finalCash !== null ? formatCurrency(Number(shift.finalCash)) : "--"}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                              shift.status === "OPEN"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {shift.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
