import { useQuery } from '@tanstack/react-query';
import { getSolBalance, getTokenAccounts, getRecentSignatures } from '../lib/solana';
import { fetchTokensByAddresses } from '../lib/codex';

const SOL_MINT = 'So11111111111111111111111111111111111111112';

export function useHoldings(address) {
  return useQuery({
    queryKey: ['holdings', address],
    queryFn: async () => {
      if (!address) return { sol: 0, tokens: [], totalUsd: 0 };
      const [sol, tokenAccounts] = await Promise.all([
        getSolBalance(address),
        getTokenAccounts(address),
      ]);

      const mints = [SOL_MINT, ...tokenAccounts.map((t) => t.mint)];
      const priced = await fetchTokensByAddresses(mints);

      const priceByMint = Object.fromEntries(
        priced.map((p) => [p.token.address, p])
      );

      const solRow = {
        mint: SOL_MINT,
        amount: sol,
        token: priceByMint[SOL_MINT]?.token ?? { symbol: 'SOL', name: 'Solana', info: {} },
        priceUSD: Number(priceByMint[SOL_MINT]?.priceUSD ?? 0),
      };

      const tokenRows = tokenAccounts.map((t) => ({
        mint: t.mint,
        amount: t.amount,
        token: priceByMint[t.mint]?.token ?? { symbol: t.mint.slice(0, 4), name: 'Unknown', info: {} },
        priceUSD: Number(priceByMint[t.mint]?.priceUSD ?? 0),
      }));

      const all = [solRow, ...tokenRows]
        .map((r) => ({ ...r, valueUsd: r.amount * r.priceUSD }))
        .sort((a, b) => b.valueUsd - a.valueUsd);

      const totalUsd = all.reduce((s, r) => s + r.valueUsd, 0);

      return { sol, tokens: all, totalUsd };
    },
    enabled: !!address,
    staleTime: 30_000,
  });
}

export function useRecentActivity(address) {
  return useQuery({
    queryKey: ['activity', address],
    queryFn: () => getRecentSignatures(address, 10),
    enabled: !!address,
    staleTime: 60_000,
  });
}
