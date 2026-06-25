const CODEX_URL = 'https://graph.codex.io/graphql';
const CODEX_KEY = process.env.EXPO_PUBLIC_CODEX_API_KEY;

export const SOLANA_NETWORK_ID = 1399811149;

export async function codexQuery(query, variables) {
  const res = await fetch(CODEX_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      Authorization: CODEX_KEY,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0]?.message ?? 'codex error');
  return json.data;
}

const TRENDING_QUERY = `
  query Trending($networkId: Int!, $limit: Int!) {
    filterTokens(
      filters: { network: [$networkId] }
      rankings: [{ attribute: trendingScore24, direction: DESC }]
      limit: $limit
    ) {
      results {
        token {
          address
          name
          symbol
          info { imageThumbUrl }
        }
        priceUSD
        change24
        volume24
        marketCap
        liquidity
      }
    }
  }
`;

export async function fetchTrendingTokens(limit = 30) {
  const data = await codexQuery(TRENDING_QUERY, {
    networkId: SOLANA_NETWORK_ID,
    limit,
  });
  return data.filterTokens.results;
}
