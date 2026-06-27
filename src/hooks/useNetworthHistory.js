import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function useNetworthHistory(wallet) {
  return useQuery({
    queryKey: ['networth-history', wallet],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('networth_snapshots')
        .select('date,total_usd')
        .eq('wallet', wallet)
        .order('date', { ascending: true })
        .limit(60);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!wallet,
    staleTime: 60_000,
  });
}

export function useRecordNetworth(wallet, totalUsd) {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!wallet || totalUsd == null || !isFinite(totalUsd) || totalUsd <= 0) return;
    let cancelled = false;
    (async () => {
      const { error } = await supabase
        .from('networth_snapshots')
        .upsert({ wallet, date: todayKey(), total_usd: totalUsd }, { onConflict: 'wallet,date' });
      if (!cancelled && !error) {
        queryClient.invalidateQueries({ queryKey: ['networth-history', wallet] });
      }
    })();
    return () => { cancelled = true; };
  }, [wallet, totalUsd, queryClient]);
}
