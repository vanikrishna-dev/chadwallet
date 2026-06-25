import { useQuery } from '@tanstack/react-query';
import { fetchTokenDetail, fetchTokenBars } from '../lib/codex';

export function useTokenDetail(address) {
  return useQuery({
    queryKey: ['token', address],
    queryFn: () => fetchTokenDetail(address),
    enabled: !!address,
    staleTime: 15_000,
  });
}

const RESOLUTION = {
  '1D': { resolution: '5', window: 24 * 60 * 60 },
  '1W': { resolution: '60', window: 7 * 24 * 60 * 60 },
  '1M': { resolution: '240', window: 30 * 24 * 60 * 60 },
  '3M': { resolution: '1D', window: 90 * 24 * 60 * 60 },
  '1Y': { resolution: '1D', window: 365 * 24 * 60 * 60 },
};

export function useTokenBars(address, timeframe = '1D') {
  return useQuery({
    queryKey: ['token-bars', address, timeframe],
    queryFn: () => {
      const cfg = RESOLUTION[timeframe];
      const to = Math.floor(Date.now() / 1000);
      const from = to - cfg.window;
      return fetchTokenBars(address, { from, to, resolution: cfg.resolution });
    },
    enabled: !!address,
    staleTime: 30_000,
  });
}
