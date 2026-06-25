import { View, ActivityIndicator } from 'react-native';
import { usePrivy } from '@privy-io/expo';
import LoginScreen from '../screens/LoginScreen';
import TrendingScreen from '../screens/TrendingScreen';

export default function RootNavigator() {
  const { isReady, user } = usePrivy();

  if (!isReady) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  return user ? <TrendingScreen /> : <LoginScreen />;
}
