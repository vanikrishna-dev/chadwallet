import { useState } from 'react';
import { View, Text, FlatList, Pressable, Image, RefreshControl, ActivityIndicator, Modal, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { usePrivy, useEmbeddedSolanaWallet } from '@privy-io/expo';
import { useHoldings, useRecentActivity } from '../hooks/usePortfolio';
import { useNetworthHistory, useRecordNetworth } from '../hooks/useNetworthHistory';
import PriceChart from '../components/PriceChart';

const DEMO_BARS = [
  { t: 0, c: 50.00 },
  { t: 1, c: 48.20 },
  { t: 2, c: 67.40 },
  { t: 3, c: 59.80 },
  { t: 4, c: 84.10 },
  { t: 5, c: 112.50 },
  { t: 6, c: 95.30 },
  { t: 7, c: 128.70 },
  { t: 8, c: 176.40 },
  { t: 9, c: 158.20 },
  { t: 10, c: 204.90 },
  { t: 11, c: 187.60 },
  { t: 12, c: 241.30 },
];

function formatUsd(n) {
  const x = Number(n);
  if (!isFinite(x)) return '$0.00';
  if (x >= 1e6) return `$${(x / 1e6).toFixed(2)}M`;
  if (x >= 1e3) return `$${(x / 1e3).toFixed(2)}K`;
  return `$${x.toFixed(2)}`;
}

function formatAmount(n) {
  const x = Number(n);
  if (!isFinite(x)) return '0';
  if (x === 0) return '0';
  if (x >= 1) return x.toFixed(4);
  return x.toPrecision(3);
}

function shorten(addr) {
  if (!addr) return '';
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

function HoldingRow({ row }) {
  const change = Number(row.change24);
  const positive = change >= 0;
  return (
    <View className="flex-row items-center px-4 py-3">
      <View className="w-10 h-10 rounded-full bg-neutral-800 mr-3 overflow-hidden">
        {row.token.info?.imageThumbUrl ? (
          <Image source={{ uri: row.token.info.imageThumbUrl }} className="w-full h-full" />
        ) : null}
      </View>
      <View className="flex-1">
        <Text className="text-white font-semibold" numberOfLines={1}>{row.token.symbol}</Text>
        <Text className="text-neutral-500 text-xs" numberOfLines={1}>{formatAmount(row.amount)} {row.token.symbol}</Text>
      </View>
      <View className="items-end">
        <Text className="text-white font-semibold">{formatUsd(row.valueUsd)}</Text>
      </View>
    </View>
  );
}

function ActivityRow({ sig }) {
  const ts = sig.blockTime ? new Date(sig.blockTime * 1000) : null;
  return (
    <View className="flex-row items-center px-4 py-3">
      <View className="w-10 h-10 rounded-full bg-neutral-800 mr-3 items-center justify-center">
        <Text className="text-neutral-400 text-xs">tx</Text>
      </View>
      <View className="flex-1">
        <Text className="text-white text-sm" numberOfLines={1}>{shorten(sig.signature)}</Text>
        <Text className="text-neutral-500 text-xs">{ts ? ts.toLocaleString() : '—'}</Text>
      </View>
      {sig.err ? (
        <Text className="text-red-500 text-xs">failed</Text>
      ) : (
        <Text className="text-green-500 text-xs">success</Text>
      )}
    </View>
  );
}

export default function PortfolioScreen() {
  const { logout } = usePrivy();
  const { wallets, create } = useEmbeddedSolanaWallet();
  const wallet = wallets?.[0];
  const address = wallet?.address ?? wallet?.publicKey;

  const [addressOpen, setAddressOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const holdings = useHoldings(address);
  const activity = useRecentActivity(address);
  const networth = useNetworthHistory(address);
  useRecordNetworth(address, holdings.data?.totalUsd);

  const realBars = (networth.data ?? []).map((row) => ({ t: row.date, c: Number(row.total_usd) }));
  const isDemo = realBars.length < 2;
  const chartBars = isDemo ? DEMO_BARS : realBars;
  const networthChange = chartBars[chartBars.length - 1].c - chartBars[0].c;
  const chartColor = networthChange >= 0 ? '#00E676' : '#FF3B30';
  const screenWidth = Dimensions.get('window').width;

  const copyAddress = async () => {
    if (!address) return;
    await Clipboard.setStringAsync(address);
    Alert.alert('Copied', 'Wallet address copied to clipboard');
  };

  const handleCreateWallet = async () => {
    setCreating(true);
    try {
      await create();
    } catch (e) {
      Alert.alert('Could not create wallet', e?.message ?? 'Try again');
    } finally {
      setCreating(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black" edges={['top']}>
      <View className="px-4 pt-3 pb-2 flex-row items-center justify-between">
        <Text className="text-white text-2xl font-bold">Account</Text>
        <Pressable onPress={logout} className="px-3 py-1 rounded-xl bg-neutral-900">
          <Text className="text-neutral-400 text-xs">Log out</Text>
        </Pressable>
      </View>

      <FlatList
        data={holdings.data?.tokens ?? []}
        keyExtractor={(r) => r.mint}
        renderItem={({ item }) => <HoldingRow row={item} />}
        ItemSeparatorComponent={() => <View className="h-px bg-neutral-900 ml-16" />}
        refreshControl={
          <RefreshControl
            refreshing={holdings.isRefetching}
            onRefresh={() => { holdings.refetch(); activity.refetch(); }}
            tintColor="#fff"
          />
        }
        ListHeaderComponent={
          <View>
            <View className="px-4 py-6 items-center">
              <Text className="text-neutral-500 text-xs">total balance</Text>
              {holdings.isLoading ? (
                <ActivityIndicator color="#fff" className="mt-2" />
              ) : (
                <Text className="text-white text-4xl font-bold mt-1">{formatUsd(holdings.data?.totalUsd)}</Text>
              )}
            </View>
            <View className="px-4 pb-4">
              <View className="flex-row justify-end mb-1">
                {isDemo ? (
                  <View className="bg-neutral-800 px-2 py-0.5 rounded-full">
                    <Text className="text-neutral-400 text-[10px]">demo data</Text>
                  </View>
                ) : null}
              </View>
              <PriceChart bars={chartBars} width={screenWidth - 32} height={120} color={chartColor} />
              <Text className="text-neutral-600 text-xs text-center mt-2">
                {isDemo ? 'sample 13-day curve · real chart populates daily' : `last ${chartBars.length} days`}
              </Text>
            </View>
            <View className="px-4 pb-3">
              <Text className="text-neutral-500 text-xs uppercase">Holdings</Text>
            </View>
          </View>
        }
        ListFooterComponent={
          <View className="mt-6">
            <View className="px-4 pb-3 flex-row items-center justify-between">
              <Text className="text-neutral-500 text-xs uppercase">Activity</Text>
              {activity.isLoading ? <ActivityIndicator color="#fff" /> : null}
            </View>
            {(activity.data ?? []).length === 0 ? (
              <View className="px-4 py-6">
                <Text className="text-neutral-500 text-xs text-center">no transactions yet</Text>
              </View>
            ) : (
              <View>
                {activity.data.map((sig) => (
                  <View key={sig.signature}>
                    <ActivityRow sig={sig} />
                    <View className="h-px bg-neutral-900 ml-16" />
                  </View>
                ))}
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          holdings.isLoading ? null : (
            <View className="px-4 py-8">
              <Text className="text-neutral-500 text-xs text-center">no tokens in this wallet yet</Text>
              <Text className="text-neutral-600 text-xs text-center mt-2">deposit SOL to start trading</Text>
            </View>
          )
        }
      />

      {address ? (
        <Pressable
          onPress={() => setAddressOpen(true)}
          className="absolute bottom-8 right-6 bg-green-500 rounded-full px-5 py-3 active:opacity-70"
          style={{ elevation: 4, shadowColor: '#00E676', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 }}
        >
          <Text className="text-black font-bold">{shorten(address)}</Text>
        </Pressable>
      ) : (
        <Pressable
          onPress={handleCreateWallet}
          disabled={creating}
          className="absolute bottom-8 right-6 bg-green-500 rounded-full px-5 py-3 active:opacity-70"
        >
          <Text className="text-black font-bold">{creating ? 'Creating…' : 'Create wallet'}</Text>
        </Pressable>
      )}

      <Modal visible={addressOpen} transparent animationType="fade" onRequestClose={() => setAddressOpen(false)}>
        <Pressable onPress={() => setAddressOpen(false)} className="flex-1 bg-black/80 items-center justify-center px-6">
          <View className="bg-neutral-900 rounded-3xl px-6 py-6 w-full">
            <Text className="text-white text-lg font-bold text-center">Your Solana wallet</Text>
            <Text className="text-white text-xs text-center mt-4" selectable>{address}</Text>
            <Pressable onPress={copyAddress} className="bg-green-500 rounded-2xl py-3 mt-6 items-center active:opacity-70">
              <Text className="text-black font-bold">Copy address</Text>
            </Pressable>
            <Pressable onPress={() => setAddressOpen(false)} className="py-3 mt-2 items-center">
              <Text className="text-neutral-500">Close</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
