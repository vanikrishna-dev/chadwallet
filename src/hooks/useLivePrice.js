import { useQuery } from '@tanstack/react-query';
import { fetchTokenDetail } from '../lib/codex';

export function useLivePrice(address) {
  const q = useQuery({
    queryKey: ['live-price', address],
    queryFn: async () => {
      const d = await fetchTokenDetail(address);
      return Number(d?.priceUSD);
    },
    enabled: !!address,
    refetchInterval: 5_000,
    staleTime: 0,
  });

  if (q.data == null || !isFinite(q.data)) return null;
  return { price: q.data, at: q.dataUpdatedAt };
}
