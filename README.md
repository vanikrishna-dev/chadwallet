# chadwallet

Solana memecoin trading wallet. Take-home for ChadWallet's mobile engineer role.

## demo

- live preview: https://appetize.io/app/b_cvznd43kcka36aust7lh7kwifu
- repo: https://github.com/vanikrishna-dev/chadwallet

The Appetize wallet is unfunded. The buy flow goes all the way through quoting, Privy signing, and submission — it gets rejected at the network with "insufficient funds", which I surface as a friendly error in the swap modal. Send some SOL to the address (green pill bottom-right of Account) to actually complete a swap.

Appetize streams the simulator from a cloud data center, so interactions feel laggier than running locally. For a smoother experience, clone + run via Expo Go (steps below).

## what's there

four screens, all three bonuses:

- login — Privy Google + email
- trending — pull to refresh, sparklines per row
- token detail — price chart with 5 timeframes, live price ticks, stats, recent trades feed, buy/sell
- portfolio — holdings, recent txs, floating address FAB, 13-day networth chart

swap goes through Jupiter v1 lite-api. Privy provider signs the versioned tx and submits via Alchemy RPC.

## running it locally

```bash
git clone https://github.com/vanikrishna-dev/chadwallet
cd chadwallet
npm install
cp .env.example .env   # fill in keys
npx expo start         # scan QR with Expo Go (SDK 54)
```

env vars you need:

- `EXPO_PUBLIC_PRIVY_APP_ID` + `EXPO_PUBLIC_PRIVY_CLIENT_ID` from Privy dashboard
- `EXPO_PUBLIC_CODEX_PROXY_URL` — your Cloudflare Worker URL that proxies Codex (Codex API key lives on the worker as a secret, not in the bundle)
- `EXPO_PUBLIC_SOLANA_RPC_URL` from Alchemy
- `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY` from Supabase

supabase table:

```sql
create table networth_snapshots (
  wallet text not null,
  date date not null,
  total_usd numeric not null,
  created_at timestamptz default now(),
  primary key (wallet, date)
);
alter table networth_snapshots enable row level security;
create policy "read" on networth_snapshots for select using (true);
create policy "insert" on networth_snapshots for insert with check (true);
create policy "update" on networth_snapshots for update using (true);
```

## stack

Expo 54, RN 0.81, JS (not TS). NativeWind for styling. React Navigation 7. Privy Expo SDK for auth + embedded Solana wallet. Codex GraphQL for everything token-data, fronted by a Cloudflare Worker so the API key stays out of the bundle. Jupiter v1 swap. Alchemy RPC for balances and signatures. Supabase for daily networth snapshots. react-query everywhere for caching. Built with Claude Code as the pair.

## things to flag

a few places where i deviated from the spec — figured being upfront beats getting called out.

**no Apple sign-in.** native Apple Sign-In needs an Apple Developer account ($99/yr). spec said all services have free tier, this one doesn't. Google login works fine and Privy supports both, so adding Apple is one config + half an hour once the dev account is paid for.

**live ticks are 5-second polling, not websocket.** first attempt used Codex's `onPricesUpdated` subscription. their free plan rejected the connection with `4403 Websockets are not enabled for your account`. polling `fetchTokenDetail` every 5s gives the same LIVE pill + price flash UX, just slightly less efficient.

**networth chart fallback.** the chart needs daily history. fresh wallets have none. so when there's <2 real data points it renders a clearly-labeled `DEMO_BARS` curve. that's why you'll see a "demo data" pill on the reviewer's first run — the actual feature works, the data just isn't there yet.

## what i'd do next

- add Apple sign-in (just needs the dev account)
- write tests around the swap flow — it's the highest-risk path
- background-aware polling — current implementation keeps polling when the screen isn't visible
- Sentry for crashes
- save swap signatures to Supabase, build a real per-trade pnl view

## known limitations

- no tests
- no error boundary, a crash unmounts the navigator
- activity feed shows latest 8, no pagination
- trending screen fires 31 parallel Codex queries (1 list + 30 sparklines) which occasionally hits the Codex Free plan rate limit on pull-to-refresh — react-query retries handle it, but a Cloudflare Worker cache would be the proper fix
