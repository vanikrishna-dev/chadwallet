const JUP_BASE = 'https://lite-api.jup.ag/swap/v1';

export const SOL_MINT = 'So11111111111111111111111111111111111111112';
export const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
export const USDC_DECIMALS = 6;

export async function getQuote({ inputMint, outputMint, amount, slippageBps = 100 }) {
  const params = new URLSearchParams({
    inputMint,
    outputMint,
    amount: String(amount),
    slippageBps: String(slippageBps),
  });
  const res = await fetch(`${JUP_BASE}/quote?${params}`);
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json;
}

export async function getSwapTransaction({ quoteResponse, userPublicKey }) {
  const res = await fetch(`${JUP_BASE}/swap`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      quoteResponse,
      userPublicKey,
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
      prioritizationFeeLamports: 'auto',
    }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json.swapTransaction;
}
