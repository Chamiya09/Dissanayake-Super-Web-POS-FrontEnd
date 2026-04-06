import api from "@/lib/axiosInstance";

export type ForecastTimeframe = "weekly" | "monthly";

export interface ForecastResponse {
  productId: number;
  timeframe: ForecastTimeframe;
  predictedDemand: number;
}

type RawForecastResponse = {
  productId?: number;
  product_id?: number;
  timeframe?: ForecastTimeframe;
  predictedDemand?: number;
  predicted_demand?: number;
  expectedDemand?: number;
  demand?: number;
};

function normalizeForecastData(
  productId: number,
  timeframe: ForecastTimeframe,
  raw: RawForecastResponse,
): ForecastResponse {
  const normalizedDemand = Number(
    raw.predictedDemand ?? raw.predicted_demand ?? raw.expectedDemand ?? raw.demand ?? 0,
  );

  return {
    productId: Number(raw.productId ?? raw.product_id ?? productId),
    timeframe: raw.timeframe ?? timeframe,
    predictedDemand: Number.isFinite(normalizedDemand) ? normalizedDemand : 0,
  };
}

export const forecastApi = {
  async getForecast(productId: number, timeframe: ForecastTimeframe): Promise<ForecastResponse> {
    const response = await api.get<RawForecastResponse>("/api/forecast", {
      params: {
        product_id: productId,
        timeframe,
      },
    });

    return normalizeForecastData(productId, timeframe, response.data ?? {});
  },

  async getForecastForProducts(
    productIds: number[],
    timeframe: ForecastTimeframe,
  ): Promise<Record<number, ForecastResponse>> {
    const uniqueProductIds = Array.from(
      new Set(productIds.filter((id) => Number.isFinite(id) && id > 0)),
    );

    if (uniqueProductIds.length === 0) {
      return {};
    }

    const responses = await Promise.all(
      uniqueProductIds.map(async (id) => {
        const forecast = await this.getForecast(id, timeframe);
        return [id, forecast] as const;
      }),
    );

    return Object.fromEntries(responses);
  },
};
