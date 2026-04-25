import api from "@/lib/axiosInstance";

export type ShiftStatus = "OPEN" | "CLOSED";

export type Shift = {
  id: number;
  userId: number;
  startTime: string;
  endTime: string | null;
  initialCash: number;
  finalCash: number | null;
  status: ShiftStatus;
  totalSales: number;
};

export const shiftApi = {
  startShift(initialCash: number): Promise<Shift> {
    return api.post<Shift>("/api/shifts/start", { initialCash }).then((r) => r.data);
  },

  endShift(finalCash: number): Promise<Shift> {
    return api.post<Shift>("/api/shifts/end", { finalCash }).then((r) => r.data);
  },

  getCurrentShift(): Promise<Shift> {
    return api.get<Shift>("/api/shifts/current").then((r) => r.data);
  },

  getShiftHistory(): Promise<Shift[]> {
    return api.get<Shift[]>("/api/shifts/history").then((r) => r.data);
  },
};
