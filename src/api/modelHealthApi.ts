import axios from "axios";

const mlApi = axios.create({
  baseURL: import.meta.env.VITE_ML_API_URL ?? "http://127.0.0.1:8000",
  headers: { "Content-Type": "application/json" },
});

export type ModelHealthResponse = {
  weekly_R2: number;
  monthly_R2: number;
  weekly_MAPE: number;
  monthly_MAPE: number;
  weekly_MAE?: number;
  monthly_MAE?: number;
  weekly_RMSE?: number;
  monthly_RMSE?: number;
  status: string;
};

export const modelHealthApi = {
  async getModelHealth(): Promise<ModelHealthResponse> {
    const response = await mlApi.get<ModelHealthResponse>("/api/model-health");
    return response.data;
  },
};
