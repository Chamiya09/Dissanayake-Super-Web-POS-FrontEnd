import { useQuery } from "@tanstack/react-query";
import { modelHealthApi, type ModelHealthResponse } from "@/api/modelHealthApi";

export function useModelHealth() {
  return useQuery<ModelHealthResponse>({
    queryKey: ["model-health"],
    queryFn: () => modelHealthApi.getModelHealth(),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 1,
  });
}
