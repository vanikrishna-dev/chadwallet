import { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, ScrollView, Image, ActivityIndicator, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTokenDetail, useTokenBars } from '../hooks/useToken';
import { useLivePrice } from '../hooks/useLivePrice';
import PriceChart from '../components/PriceChart';

const TIMEFRAMES = ['1D', '1W', '1M', '3M', '1Y'];

function formatPrice(p) {
  const n = Number(p);
  if (!isFinite(n) || n === 0) return '—';
  if (n >= 1) return `$${n.toFixed(2)}`;
  if (n >= 0.01) return `$${n.toFixed(4)}`;
  return `$${n.toPrecision(3)}`;
}

function formatBigNum(n) {
  const x = Number(n);
  if (!isFinite(x)) return '—';
  if (x >= 1e9) return `$${(x / 1e9).toFixed(2)}B`;
  if (x >= 1e6) return `$${(x / 1e6).toFixed(2)}M`;
  if (x >= 1e3) return `$${(x / 1e3).toFixed(2)}K`;
  return `$${x.toFixed(0)}`;
}

function StatCell({ label, value }) {
  return (
    <View className="flex-1 py-3">
      <Text className="text-neutral-500 text-xs">{label}</Text>
      <Text className="text-white font-semibold mt-1">{value}</Text>
    </View>
  );
}

export default function TokenDetailScreen({ route, navigation }) {
  const { address, symbol: passedSymbol } = route.params ?? {};
  const [timeframe, setTimeframe] = useState('1D');
  const { data: detail, isLoading: detailLoading } = useTokenDetail(address);
  const { data: bars, isLoading: barsLoading } = useTokenBars(address, timeframe);
  const live = useLivePrice(address);

  const basePrice = Number(detail?.priceUSD);
  const livePrice = live?.price;
  const displayPrice = livePrice ?? basePrice;
  const [flash, setFlash] = useState(null);
  const prevPriceRef = useRef(null);

  useEffect(() => {
    if (livePrice == null) return;
    const prev = prevPriceRef.current;
    if (prev != null && livePrice !== prev) {
      setFlash(livePrice > prev ? 'up' : 'down');
      const t = setTimeout(() => setFlash(null), 600);
      return () => clearTimeout(t);
    }
    prevPriceRef.current = livePrice;
  }, [livePrice]);

  const token = detail?.token;
  const symbol = token?.symbol ?? passedSymbol;
  const change = Number(detail?.change24);
  const positive = change >= 0;
  const screenWidth = Dimensions.get('window').width;

  const handleBuySell = (side) => {
    Alert.alert(`${side} ${symbol}`, 'Jupiter swap wiring coming next', [{ text: 'OK' }]);
  };

  return (
    <SafeAreaView className="flex-1 bg-black" edges={['top']}>
      <View className="flex-row items-center px-4 py-3 border-b border-neutral-900">
        <Pressable onPress={navigation.goBack} className="pr-3 py-1">
          <Text className="text-white text-2xl">‹</Text>
        </Pressable>
        <View className="w-8 h-8 rounded-full bg-neutral-800 overflow-hidden mr-2">
          {token?.info?.imageThumbUrl ? (
            <Image source={{ uri: token.info.imageThumbUrl }} className="w-full h-full" />
          ) : null}
        </View>
        <Text className="text-white text-lg font-semibold flex-1">{symbol ?? 'Token'}</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View className="px-4 pt-4">
          <View className="flex-row items-center">
            <Text className={`text-4xl font-bold ${flash === 'up' ? 'text-green-500' : flash === 'down' ? 'text-red-500' : 'text-white'}`}>
              {formatPrice(displayPrice)}
            </Text>
            {live ? (
              <View className="ml-3 flex-row items-center bg-neutral-900 px-2 py-1 rounded-full">
                <View className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5" />
                <Text className="text-neutral-400 text-xs">LIVE</Text>
              </View>
            ) : null}
          </View>
          <Text className={positive ? 'text-green-500 mt-1' : 'text-red-500 mt-1'}>
            {isFinite(change) ? `${positive ? '+' : ''}${(change * 100).toFixed(2)}% (24h)` : '—'}
          </Text>
        </View>

        <View className="mt-4 px-4">
          {barsLoading ? (
            <View style={{ width: screenWidth - 32, height: 180 }} className="items-center justify-center">
              <ActivityIndicator color="#fff" />
            </View>
          ) : (
            <PriceChart
              bars={bars}
              width={screenWidth - 32}
              height={180}
              color={positive ? '#00E676' : '#FF3B30'}
            />
          )}
        </View>

        <View className="flex-row px-4 mt-3 gap-2">
          {TIMEFRAMES.map((tf) => (
            <Pressable
              key={tf}
              onPress={() => setTimeframe(tf)}
              className={`flex-1 py-2 rounded-xl ${timeframe === tf ? 'bg-neutral-800' : 'bg-transparent'}`}
            >
              <Text className={`text-center text-xs ${timeframe === tf ? 'text-white font-semibold' : 'text-neutral-500'}`}>
                {tf}
              </Text>
            </Pressable>
          ))}
        </View>

        <View className="mt-6 mx-4 bg-neutral-900 rounded-2xl px-4">
          <View className="flex-row border-b border-neutral-800">
            <StatCell label="Market cap" value={formatBigNum(detail?.marketCap)} />
            <StatCell label="Volume 24h" value={formatBigNum(detail?.volume24)} />
          </View>
          <View className="flex-row border-b border-neutral-800">
            <StatCell label="Liquidity" value={formatBigNum(detail?.liquidity)} />
            <StatCell label="Holders" value={detail?.holders?.toLocaleString() ?? '—'} />
          </View>
          <View className="flex-row">
            <StatCell label="Buys 24h" value={detail?.buyCount24?.toLocaleString() ?? '—'} />
            <StatCell label="Sells 24h" value={detail?.sellCount24?.toLocaleString() ?? '—'} />
          </View>
        </View>

        <View className="mx-4 mt-6">
          <Text className="text-neutral-500 text-xs">Contract</Text>
          <Text className="text-white text-xs mt-1" selectable numberOfLines={1}>{address}</Text>
        </View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 px-4 pb-8 pt-3 bg-black border-t border-neutral-900 flex-row gap-3">
        <Pressable
          onPress={() => handleBuySell('Buy')}
          className="flex-1 bg-green-500 rounded-2xl py-4 items-center active:opacity-70"
        >
          <Text className="text-black font-bold">Buy</Text>
        </Pressable>
        <Pressable
          onPress={() => handleBuySell('Sell')}
          className="flex-1 bg-red-500 rounded-2xl py-4 items-center active:opacity-70"
        >
          <Text className="text-white font-bold">Sell</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
