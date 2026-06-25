import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { usePrivy } from '@privy-io/expo';
import LoginScreen from '../screens/LoginScreen';
import TrendingScreen from '../screens/TrendingScreen';
import TokenDetailScreen from '../screens/TokenDetailScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { isReady, user } = usePrivy();

  if (!isReady) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={{ ...DarkTheme, colors: { ...DarkTheme.colors, background: '#000', card: '#000', text: '#fff', border: '#000', primary: '#00E676', notification: '#FF3B30' } }}>
      <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#000' } }}>
        {user ? (
          <>
            <Stack.Screen name="Trending" component={TrendingScreen} />
            <Stack.Screen name="TokenDetail" component={TokenDetailScreen} options={{ presentation: 'card' }} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
