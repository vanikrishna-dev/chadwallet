import { useState } from 'react';
import { View, Text, Pressable, Modal, ActivityIndicator, TextInput, Alert } from 'react-native';
import { VersionedTransaction, Connection } from '@solana/web3.js';

const RPC_URL = process.env.EXPO_PUBLIC_SOLANA_RPC_URL;
import { useEmbeddedSolanaWallet } from '@privy-io/expo';
import { getQuote, getSwapTransaction, SOL_MINT, USDC_MINT, USDC_DECIMALS } from '../lib/jupiter';

const CHIPS = [10, 50, 100];

function formatAmount(n, decimals = 6) {
  const x = Number(n) / Math.pow(10, decimals);
  if (!isFinite(x)) return '0';
  if (x >= 1) return x.toFixed(3);
  return x.toPrecision(3);
}

export default function SwapModal({ visible, onClose, side, token }) {
  const { wallets } = useEmbeddedSolanaWallet();
  const wallet = wallets?.[0];
  const [amount, setAmount] = useState('10');
  const [stage, setStage] = useState('input');
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState(null);
  const [signature, setSignature] = useState(null);

  if (!token) return null;

  const isBuy = side === 'Buy';
  const inputMint = isBuy ? USDC_MINT : token.address;
  const outputMint = isBuy ? token.address : USDC_MINT;
  const inputDecimals = isBuy ? USDC_DECIMALS : (token.decimals ?? 6);
  const outputDecimals = isBuy ? (token.decimals ?? 6) : USDC_DECIMALS;
  const inputSymbol = isBuy ? 'USDC' : token.symbol;
  const outputSymbol = isBuy ? token.symbol : 'USDC';

  const reset = () => {
    setStage('input');
    setQuote(null);
    setError(null);
    setSignature(null);
    setAmount('10');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleQuote = async () => {
    setError(null);
    const usd = Number(amount);
    if (!usd || usd <= 0) return Alert.alert('Enter an amount');
    const lamportAmount = Math.floor(usd * Math.pow(10, inputDecimals));
    setStage('quoting');
    try {
      const q = await getQuote({ inputMint, outputMint, amount: lamportAmount });
      setQuote(q);
      setStage('review');
    } catch (e) {
      setError(e.message ?? 'Quote failed');
      setStage('input');
    }
  };

  const handleConfirm = async () => {
    setError(null);
    if (!wallet) return setError('No wallet');
    setStage('swapping');
    try {
      const swapTxBase64 = await getSwapTransaction({
        quoteResponse: quote,
        userPublicKey: wallet.address,
      });
      const txBytes = Buffer.from(swapTxBase64, 'base64');
      const tx = VersionedTransaction.deserialize(txBytes);
      const provider = await wallet.getProvider();
      const connection = new Connection(RPC_URL, 'confirmed');
      const result = await provider.request({
        method: 'signAndSendTransaction',
        params: { transaction: tx, connection },
      });
      setSignature(result?.signature ?? 'submitted');
      setStage('done');
    } catch (e) {
      const msg = e?.message ?? 'Swap failed';
      const friendly = /no record of a prior credit|insufficient funds|insufficient lamports/i.test(msg)
        ? 'Insufficient SOL — fund this wallet to trade'
        : msg.length > 120 ? msg.slice(0, 120) + '…' : msg;
      setError(friendly);
      setStage('review');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable onPress={handleClose} className="flex-1 bg-black/70 justify-end">
        <Pressable className="bg-neutral-950 rounded-t-3xl px-6 pt-6 pb-10 border-t border-neutral-900" onPress={(e) => e.stopPropagation?.()}>
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-white text-xl font-bold">
              {isBuy ? 'Buy' : 'Sell'} {token.symbol}
            </Text>
            <Pressable onPress={handleClose}>
              <Text className="text-neutral-400 text-2xl">×</Text>
            </Pressable>
          </View>

          {stage === 'input' && (
            <>
              <Text className="text-neutral-500 text-xs">amount in {inputSymbol}</Text>
              <View className="flex-row items-baseline mt-1">
                <Text className="text-white text-3xl font-bold mr-1">{isBuy ? '$' : ''}</Text>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                  placeholderTextColor="#525252"
                  className="text-white text-3xl font-bold flex-1"
                />
              </View>

              {isBuy ? (
                <View className="flex-row gap-2 mt-4">
                  {CHIPS.map((c) => (
                    <Pressable
                      key={c}
                      onPress={() => setAmount(String(c))}
                      className="flex-1 bg-neutral-900 rounded-xl py-2 items-center active:opacity-70"
                    >
                      <Text className="text-white">${c}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}

              {error ? <Text className="text-red-500 text-xs mt-4">{error}</Text> : null}

              <Pressable
                onPress={handleQuote}
                className={`rounded-2xl py-4 mt-6 items-center active:opacity-70 ${isBuy ? 'bg-green-500' : 'bg-red-500'}`}
              >
                <Text className={`font-bold ${isBuy ? 'text-black' : 'text-white'}`}>Review</Text>
              </Pressable>
            </>
          )}

          {stage === 'quoting' && (
            <View className="py-8 items-center">
              <ActivityIndicator color="#fff" />
              <Text className="text-neutral-500 mt-2">getting best price…</Text>
            </View>
          )}

          {stage === 'review' && quote && (
            <>
              <View className="bg-neutral-900 rounded-2xl p-4">
                <Text className="text-neutral-500 text-xs">You pay</Text>
                <Text className="text-white text-lg mt-1">{formatAmount(quote.inAmount, inputDecimals)} {inputSymbol}</Text>
                <View className="h-px bg-neutral-800 my-3" />
                <Text className="text-neutral-500 text-xs">You receive (est.)</Text>
                <Text className="text-white text-lg mt-1">{formatAmount(quote.outAmount, outputDecimals)} {outputSymbol}</Text>
                <Text className="text-neutral-500 text-xs mt-2">
                  Price impact {Number(quote.priceImpactPct ?? 0).toFixed(2)}% · Slippage 1%
                </Text>
              </View>

              {error ? <Text className="text-red-500 text-xs mt-4">{error}</Text> : null}

              <View className="flex-row gap-3 mt-6">
                <Pressable onPress={() => setStage('input')} className="flex-1 bg-neutral-900 rounded-2xl py-4 items-center active:opacity-70">
                  <Text className="text-white">Back</Text>
                </Pressable>
                <Pressable
                  onPress={handleConfirm}
                  className={`flex-1 rounded-2xl py-4 items-center active:opacity-70 ${isBuy ? 'bg-green-500' : 'bg-red-500'}`}
                >
                  <Text className={`font-bold ${isBuy ? 'text-black' : 'text-white'}`}>Confirm</Text>
                </Pressable>
              </View>
            </>
          )}

          {stage === 'swapping' && (
            <View className="py-8 items-center">
              <ActivityIndicator color="#fff" />
              <Text className="text-neutral-500 mt-2">signing & submitting…</Text>
            </View>
          )}

          {stage === 'done' && (
            <View className="py-4">
              <Text className="text-green-500 text-lg font-bold text-center">Swap submitted</Text>
              <Text className="text-neutral-500 text-xs mt-2 text-center" numberOfLines={1} selectable>{signature}</Text>
              <Pressable onPress={handleClose} className="bg-neutral-900 rounded-2xl py-3 mt-6 items-center active:opacity-70">
                <Text className="text-white">Done</Text>
              </Pressable>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
