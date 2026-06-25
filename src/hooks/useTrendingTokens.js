import { useQuery } from '@tanstack/react-query';
import { fetchTrendingTokens } from '../lib/codex';

export function useTrendingTokens() {
  return useQuery({
    queryKey: ['trending-tokens'],
    queryFn: () => fetchTrendingTokens(30),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
