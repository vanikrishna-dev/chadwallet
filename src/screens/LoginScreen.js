import { useState } from 'react';
import { View, Text, Pressable, Image, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLoginWithOAuth, useLoginWithEmail } from '@privy-io/expo';

export default function LoginScreen() {
  const [mode, setMode] = useState('choose');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');

  const { login: oauthLogin, state: oauthState } = useLoginWithOAuth({
    onError: (err) => Alert.alert('Login failed', err.message ?? 'Try again'),
  });

  const { sendCode, loginWithCode, state: emailState } = useLoginWithEmail({
    onError: (err) => Alert.alert('Email login failed', err.message ?? 'Try again'),
  });

  const oauthLoading = oauthState.status === 'loading';
  const emailSending = emailState.status === 'sending-code';
  const emailVerifying = emailState.status === 'submitting-code';

  const handleGoogle = () => oauthLogin({ provider: 'google' });

  const handleSendCode = async () => {
    if (!email.includes('@')) return Alert.alert('Invalid email');
    await sendCode({ email });
    setMode('code');
  };

  const handleVerify = async () => {
    if (code.length < 4) return Alert.alert('Enter the code');
    await loginWithCode({ code });
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-1 px-6 justify-between py-12">
        <View className="items-center mt-16">
          <Image source={require('../../design/logo/light.png')} className="w-24 h-24 mb-4" resizeMode="contain" />
          <Text className="text-white text-4xl font-bold">ChadWallet</Text>
          <Text className="text-neutral-400 text-base mt-2">memecoin trading</Text>
        </View>

        {mode === 'choose' && (
          <View className="gap-3">
            <Pressable
              onPress={handleGoogle}
              disabled={oauthLoading}
              className="bg-white rounded-2xl py-4 items-center active:opacity-70"
            >
              {oauthLoading ? <ActivityIndicator color="#000" /> : (
                <Text className="text-black font-semibold text-base">Continue with Google</Text>
              )}
            </Pressable>

            <Pressable
              onPress={() => setMode('email')}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl py-4 items-center active:opacity-70"
            >
              <Text className="text-white font-semibold text-base">Continue with Email</Text>
            </Pressable>
          </View>
        )}

        {mode === 'email' && (
          <View className="gap-3">
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor="#525252"
              autoCapitalize="none"
              keyboardType="email-address"
              className="bg-neutral-900 border border-neutral-800 rounded-2xl px-4 py-4 text-white text-base"
            />
            <Pressable
              onPress={handleSendCode}
              disabled={emailSending}
              className="bg-white rounded-2xl py-4 items-center active:opacity-70"
            >
              {emailSending ? <ActivityIndicator color="#000" /> : (
                <Text className="text-black font-semibold text-base">Send code</Text>
              )}
            </Pressable>
            <Pressable onPress={() => setMode('choose')} className="py-2 items-center">
              <Text className="text-neutral-400">Back</Text>
            </Pressable>
          </View>
        )}

        {mode === 'code' && (
          <View className="gap-3">
            <Text className="text-neutral-400 text-center">Code sent to {email}</Text>
            <TextInput
              value={code}
              onChangeText={setCode}
              placeholder="6-digit code"
              placeholderTextColor="#525252"
              keyboardType="number-pad"
              maxLength={6}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl px-4 py-4 text-white text-base text-center tracking-widest"
            />
            <Pressable
              onPress={handleVerify}
              disabled={emailVerifying}
              className="bg-white rounded-2xl py-4 items-center active:opacity-70"
            >
              {emailVerifying ? <ActivityIndicator color="#000" /> : (
                <Text className="text-black font-semibold text-base">Verify</Text>
              )}
            </Pressable>
            <Pressable onPress={() => setMode('email')} className="py-2 items-center">
              <Text className="text-neutral-400">Use different email</Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
