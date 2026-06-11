import axios from "axios";

export type ForecastTimeframe = "weekly" | "monthly";
export type ForecastIdentifier = string | number;

export interface ForecastResponse {
  productId: string;
  timeframe: ForecastTimeframe;
  predictedDemand: number;
}

const mlApi = axios.create({
  baseURL: import.meta.env.VITE_ML_API_URL ?? "http://127.0.0.1:8000",
  headers: { "Content-Type": "application/json" },
});

type RawForecastResponse = {
  productId?: string | number;
  product_id?: string | number;
  timeframe?: ForecastTimeframe;
  predictedDemand?: number;
  predicted_demand?: number;
  expectedDemand?: number;
  demand?: number;
};

function normalizeForecastIdentifier(productId: ForecastIdentifier): string {
  const raw = String(productId ?? "").trim();
  if (!raw) return "";

  const numericOnly = raw.match(/^\d+$/);
  if (numericOnly) {
    return `PI${raw.padStart(5, "0")}`;
  }

  const prefixed = raw.match(/^PI(\d+)$/i);
  if (prefixed) {
    return `PI${prefixed[1].padStart(5, "0")}`;
  }

  return raw;
}

function normalizeForecastData(
  productId: ForecastIdentifier,
  timeframe: ForecastTimeframe,
  raw: RawForecastResponse,
): ForecastResponse {
  const normalizedDemand = Number(
    raw.predictedDemand ?? raw.predicted_demand ?? raw.expectedDemand ?? raw.demand ?? 0,
  );

  return {
    productId: String(raw.productId ?? raw.product_id ?? productId).trim(),
    timeframe: raw.timeframe ?? timeframe,
    predictedDemand: Number.isFinite(normalizedDemand) ? normalizedDemand : 0,
  };
}

export const forecastApi = {
  async getForecast(productId: ForecastIdentifier, timeframe: ForecastTimeframe): Promise<ForecastResponse> {
    const requestProductId = String(productId ?? "").trim();
    const normalizedId = normalizeForecastIdentifier(productId);
    if (!normalizedId) {
      throw new Error("product_id is empty. Cannot request forecast.");
    }

    console.log("Forecast Request Params:", {
      requested_product_id: requestProductId,
      product_id: normalizedId,
      timeframe,
    });

    const response = await mlApi.get<RawForecastResponse>("/api/forecast", {
      params: {
        product_id: normalizedId,
        timeframe,
      },
    });

    console.log("API Response:", response.data);

    return normalizeForecastData(requestProductId, timeframe, response.data ?? {});
  },

  async getForecastForProducts(
    productIds: ForecastIdentifier[],
    timeframe: ForecastTimeframe,
  ): Promise<Record<string, ForecastResponse>> {
    const uniqueProductIds = Array.from(
      new Set(
        productIds
          .map((id) => String(id ?? "").trim())
          .filter((id) => id.length > 0),
      ),
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
