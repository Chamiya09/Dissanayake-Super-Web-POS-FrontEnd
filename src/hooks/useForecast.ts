import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  forecastApi,
  type ForecastIdentifier,
  type ForecastResponse,
  type ForecastTimeframe,
} from "@/api/forecastApi";

export function useForecastMap(productIds: ForecastIdentifier[], timeframe: ForecastTimeframe) {
  const normalizedProductIds = useMemo(
    () =>
      Array.from(
        new Set(
          productIds
            .map((id) => String(id ?? "").trim())
            .filter((id) => id.length > 0),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [productIds],
  );

  return useQuery<Record<string, ForecastResponse>>({
    queryKey: ["forecast", timeframe, normalizedProductIds],
    queryFn: () => forecastApi.getForecastForProducts(normalizedProductIds, timeframe),
    enabled: normalizedProductIds.length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 1,
  });
}

export function useProductForecast(
  productId: ForecastIdentifier | null | undefined,
  timeframe: ForecastTimeframe,
) {
  const normalizedId = String(productId ?? "").trim();

  return useQuery<ForecastResponse>({
    queryKey: ["forecast", timeframe, normalizedId],
    queryFn: () => forecastApi.getForecast(normalizedId, timeframe),
    enabled: normalizedId.length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 1,
  });
}
