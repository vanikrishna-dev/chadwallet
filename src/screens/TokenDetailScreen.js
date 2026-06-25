import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TokenDetailScreen({ route, navigation }) {
  const { address, symbol } = route.params ?? {};

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-row items-center px-4 py-3 border-b border-neutral-900">
        <Pressable onPress={navigation.goBack} className="pr-3 py-1">
          <Text className="text-white text-2xl">‹</Text>
        </Pressable>
        <Text className="text-white text-lg font-semibold">{symbol ?? 'Token'}</Text>
      </View>

      <View className="px-4 py-6">
        <Text className="text-neutral-400 text-xs">contract</Text>
        <Text className="text-white text-xs mt-1" selectable>{address}</Text>
        <Text className="text-neutral-500 text-xs mt-8">chart, stats, activity coming next</Text>
      </View>
    </SafeAreaView>
  );
}
