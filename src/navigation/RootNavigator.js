import { View, Text, ActivityIndicator } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { usePrivy } from '@privy-io/expo';
import LoginScreen from '../screens/LoginScreen';
import TrendingScreen from '../screens/TrendingScreen';
import TokenDetailScreen from '../screens/TokenDetailScreen';
import PortfolioScreen from '../screens/PortfolioScreen';

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#000', borderTopColor: '#171717', height: 72, paddingTop: 8, paddingBottom: 10 },
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: '#737373',
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="Memes"
        component={TrendingScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="flame" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="Account"
        component={PortfolioScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="wallet-outline" size={size} color={color} />,
        }}
      />
    </Tabs.Navigator>
  );
}

const navTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: '#000', card: '#000', text: '#fff', border: '#000', primary: '#00E676', notification: '#FF3B30' },
};

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
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#000' } }}>
        {user ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="TokenDetail" component={TokenDetailScreen} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
