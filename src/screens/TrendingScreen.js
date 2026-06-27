import { View, Text, FlatList, Pressable, Image, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTrendingTokens } from '../hooks/useTrendingTokens';
import { useSparkline } from '../hooks/useToken';
import Sparkline from '../components/Sparkline';

function formatPrice(p) {
  const n = Number(p);
  if (!isFinite(n) || n === 0) return '—';
  if (n >= 1) return `$${n.toFixed(2)}`;
  if (n >= 0.01) return `$${n.toFixed(4)}`;
  return `$${n.toPrecision(3)}`;
}

function formatChange(c) {
  const n = Number(c);
  if (!isFinite(n)) return '—';
  const sign = n >= 0 ? '+' : '';
  return `${sign}${(n * 100).toFixed(2)}%`;
}

function TokenRow({ row, onPress }) {
  const t = row.token;
  const change = Number(row.change24);
  const positive = change >= 0;
  const { data: bars } = useSparkline(t.address);
  return (
    <Pressable onPress={onPress} className="flex-row items-center px-4 py-3 active:bg-neutral-900">
      <View className="w-10 h-10 rounded-full bg-neutral-800 mr-3 overflow-hidden">
        {t.info?.imageThumbUrl ? (
          <Image source={{ uri: t.info.imageThumbUrl }} className="w-full h-full" />
        ) : null}
      </View>
      <View className="flex-1 mr-2">
        <Text className="text-white font-semibold" numberOfLines={1}>{t.symbol}</Text>
        <Text className="text-neutral-500 text-xs" numberOfLines={1}>{t.name}</Text>
      </View>
      <View className="mr-3">
        <Sparkline bars={bars} width={56} height={24} color={positive ? '#00E676' : '#FF3B30'} />
      </View>
      <View className="items-end">
        <Text className="text-white font-semibold">{formatPrice(row.priceUSD)}</Text>
        <Text className={positive ? 'text-green-500 text-xs' : 'text-red-500 text-xs'}>
          {formatChange(change)}
        </Text>
      </View>
    </Pressable>
  );
}

export default function TrendingScreen({ navigation }) {
  const { data, isLoading, isRefetching, refetch, error } = useTrendingTokens();

  return (
    <SafeAreaView className="flex-1 bg-black" edges={['top']}>
      <View className="px-4 py-3 border-b border-neutral-900">
        <Text className="text-white text-2xl font-bold">Memes</Text>
        <Text className="text-neutral-500 text-xs">trending on solana</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#fff" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="alert-circle-outline" size={36} color="#737373" />
          <Text className="text-white text-base mt-3 mb-1">Couldn't load trending tokens.</Text>
          <Text className="text-neutral-500 text-xs text-center">{String(error.message)}</Text>
          <Pressable onPress={refetch} className="mt-4 bg-neutral-900 px-4 py-2 rounded-xl">
            <Text className="text-white">Tap to retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(r) => r.token.address}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TokenRow
              row={item}
              onPress={() => navigation.navigate('TokenDetail', {
                address: item.token.address,
                symbol: item.token.symbol,
              })}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#fff"
            />
          }
          ItemSeparatorComponent={() => <View className="h-px bg-neutral-900 ml-16" />}
        />
      )}
    </SafeAreaView>
  );
}
