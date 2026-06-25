const RPC_URL = process.env.EXPO_PUBLIC_SOLANA_RPC_URL;
const TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';

async function rpc(method, params) {
  const res = await fetch(RPC_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  return json.result;
}

export async function getSolBalance(address) {
  const result = await rpc('getBalance', [address]);
  return (result?.value ?? 0) / 1e9;
}

export async function getTokenAccounts(address) {
  const result = await rpc('getTokenAccountsByOwner', [
    address,
    { programId: TOKEN_PROGRAM_ID },
    { encoding: 'jsonParsed' },
  ]);
  const accounts = result?.value ?? [];
  return accounts
    .map((a) => {
      const info = a.account.data.parsed.info;
      return {
        mint: info.mint,
        amount: Number(info.tokenAmount.uiAmount ?? 0),
        decimals: info.tokenAmount.decimals,
      };
    })
    .filter((t) => t.amount > 0);
}

export async function getRecentSignatures(address, limit = 10) {
  const result = await rpc('getSignaturesForAddress', [
    address,
    { limit },
  ]);
  return result ?? [];
}
