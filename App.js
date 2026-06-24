import './global.css';
import { Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  return (
    <View className="flex-1 items-center justify-center bg-black">
      <Text className="text-white text-3xl font-bold">ChadWallet</Text>
      <Text className="text-green-500 text-sm mt-2">setup complete</Text>
      <StatusBar style="light" />
    </View>
  );
}
