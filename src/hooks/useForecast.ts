import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { forecastApi, type ForecastResponse, type ForecastTimeframe } from "@/api/forecastApi";

export function useForecastMap(productIds: number[], timeframe: ForecastTimeframe) {
  const normalizedProductIds = useMemo(
    () => Array.from(new Set(productIds.filter((id) => Number.isFinite(id) && id > 0))).sort((a, b) => a - b),
    [productIds],
  );

  return useQuery<Record<number, ForecastResponse>>({
    queryKey: ["forecast", timeframe, normalizedProductIds],
    queryFn: () => forecastApi.getForecastForProducts(normalizedProductIds, timeframe),
    enabled: normalizedProductIds.length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 1,
  });
}

export function useProductForecast(productId: number | null | undefined, timeframe: ForecastTimeframe) {
  return useQuery<ForecastResponse>({
    queryKey: ["forecast", timeframe, productId],
    queryFn: () => forecastApi.getForecast(Number(productId), timeframe),
    enabled: Number.isFinite(productId) && Number(productId) > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 1,
  });
}
