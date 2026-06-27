const CODEX_URL = process.env.EXPO_PUBLIC_CODEX_PROXY_URL;

export const SOLANA_NETWORK_ID = 1399811149;

export async function codexQuery(query, variables) {
  const res = await fetch(CODEX_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
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

const TOKEN_DETAIL_QUERY = `
  query TokenDetail($tokens: [String!]!) {
    filterTokens(tokens: $tokens, limit: 1) {
      results {
        token {
          address
          name
          symbol
          decimals
          info { imageThumbUrl }
        }
        priceUSD
        change24
        volume24
        marketCap
        liquidity
        buyCount24
        sellCount24
        uniqueBuys24
        uniqueSells24
        holders
      }
    }
  }
`;

export async function fetchTokenDetail(address) {
  const data = await codexQuery(TOKEN_DETAIL_QUERY, {
    tokens: [`${address}:${SOLANA_NETWORK_ID}`],
  });
  return data.filterTokens.results[0] ?? null;
}

const BARS_QUERY = `
  query Bars($symbol: String!, $from: Int!, $to: Int!, $resolution: String!) {
    getBars(symbol: $symbol, from: $from, to: $to, resolution: $resolution) {
      t
      c
    }
  }
`;

const TOKENS_BY_ADDRESS_QUERY = `
  query TokensByAddress($tokens: [String!]!) {
    filterTokens(tokens: $tokens, limit: 50) {
      results {
        token {
          address
          name
          symbol
          info { imageThumbUrl }
        }
        priceUSD
        change24
      }
    }
  }
`;

export async function fetchTokensByAddresses(addresses) {
  if (!addresses.length) return [];
  const ids = addresses.map((a) => `${a}:${SOLANA_NETWORK_ID}`);
  const data = await codexQuery(TOKENS_BY_ADDRESS_QUERY, { tokens: ids });
  return data.filterTokens.results;
}

const TOKEN_EVENTS_QUERY = `
  query GetTokenEvents($query: EventsQueryInput!, $limit: Int) {
    getTokenEvents(query: $query, limit: $limit) {
      items {
        eventType
        timestamp
        maker
        transactionHash
      }
    }
  }
`;

export async function fetchTokenEvents(address, limit = 20) {
  const data = await codexQuery(TOKEN_EVENTS_QUERY, {
    query: { address, networkId: SOLANA_NETWORK_ID },
    limit,
  });
  return data.getTokenEvents?.items ?? [];
}

export async function fetchTokenBars(address, { from, to, resolution }) {
  const data = await codexQuery(BARS_QUERY, {
    symbol: `${address}:${SOLANA_NETWORK_ID}`,
    from,
    to,
    resolution,
  });
  const bars = data.getBars;
  if (!bars) return [];
  return bars.t.map((t, i) => ({ t, c: bars.c[i] })).filter((b) => b.c != null);
}
