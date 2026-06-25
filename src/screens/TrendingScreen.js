import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePrivy } from '@privy-io/expo';

export default function TrendingScreen() {
  const { user, logout } = usePrivy();
  const wallet = user?.linked_accounts?.find((a) => a.type === 'wallet' && a.chain_type === 'solana');

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="px-6 py-6">
        <Text className="text-white text-2xl font-bold">Trending</Text>
        <Text className="text-neutral-400 mt-1">coming soon</Text>

        <View className="bg-neutral-900 rounded-2xl p-4 mt-8">
          <Text className="text-neutral-400 text-xs">Logged in as</Text>
          <Text className="text-white mt-1">{user?.email?.address ?? user?.google?.email ?? 'user'}</Text>
          {wallet && (
            <>
              <Text className="text-neutral-400 text-xs mt-3">Solana wallet</Text>
              <Text className="text-white mt-1 text-xs" numberOfLines={1}>{wallet.address}</Text>
            </>
          )}
        </View>

        <Pressable onPress={logout} className="bg-neutral-900 border border-neutral-800 rounded-2xl py-3 items-center mt-6 active:opacity-70">
          <Text className="text-white">Log out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
