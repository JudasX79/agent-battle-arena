# ⚔️ Agent Battle Arena

AI agents compete with trading strategies. **You don't need to know how to
trade** — you create one agent, pick a personality, and watch it climb (or tank)
the weekly leaderboard.

Built for the [Bankr](https://github.com/BankrBot/skills) agent ecosystem.
Ships as both a **Bankr skill** ([`SKILL.md`](SKILL.md)) and a runnable
**TypeScript engine**. Paper-trading by default; real trading via Bankr is opt-in.

## Run it

Requires Node ≥ 22.6 (the engine runs TypeScript directly — no build, no runtime deps).

```bash
node src/cli.ts seed-demo     # arena with all 5 personalities
node src/cli.ts run --all     # play out the week (paper trades)
node src/cli.ts leaderboard   # ranked board + highlights
```

One-shot: `npm run demo`.

## Personalities

`meme-hunter` · `conservative-dca` · `degen-sniper` · `whale-follower` · `ai-narrative-trader`

`node src/cli.ts personalities` describes each.

## Leaderboard

Ranks agents on **PnL · max drawdown · win rate · rugs avoided · best call ·
worst trade**.

```
  #   AGENT          STYLE                      PnL     PnL%    MaxDD    Win   Rug✓
  🥇  PepeRadar      meme-hunter            $619.36   +61.9%    -5.2%    60%      2
  🥈  NarrativeMax   ai-narrative-trader    $585.50   +58.5%   -13.9%    98%      0
  🥉  ApeFirst       degen-sniper           $374.85   +37.5%   -16.5%    60%      2
   4. WhaleWatch     whale-follower         $296.20   +29.6%    -9.4%    62%      0
   5. SteadyHands    conservative-dca        $76.21    +7.6%    -1.7%     —       4
```

## Web dashboard

```bash
node src/cli.ts serve          # http://localhost:4173
```

A self-contained dark dashboard (no build, no CDN): branded header with logo,
stat tiles, a top-3 podium, ranked table with equity sparklines, PnL coloring,
rug badges, and a click-to-expand card per agent (positions, recent trades,
best/worst). Auto-refreshes every 4s — leave it open while you `run` the season
in another shell and watch the board move.

Branding lives in `public/`: `favicon.svg` (logo mark), `og.svg` (source) and
`og.png` (1200×630 social card, regenerate with `scripts/build-og.sh`). The
server serves these and exposes the social/OG meta tags on the page.

The header/footer link out to **X, DexScreener, Basescan, Uniswap, and GitHub**.
Edit the `PROJECT` config near the top of `public/index.html`'s script — set
`token` to your arena token's Base address and the DexScreener / Basescan /
Uniswap links auto-target that token (otherwise they point at the platforms).

## Real trading (opt-in)

```bash
export ARENA_LIVE=1
export BANKR_API_KEY=bk_your_write_enabled_key   # from https://bankr.bot/api
node src/cli.ts add-agent --name LiveBot --personality whale-follower --mode real
```

Refuses to run without the opt-in. Per-trade cap defaults to $25. Use a
dedicated agent wallet. See [references/trading-modes.md](references/trading-modes.md).

## Docs

- [SKILL.md](SKILL.md) — Bankr skill manifest + command reference
- [references/personalities.md](references/personalities.md) — strategy logic
- [references/leaderboard.md](references/leaderboard.md) — metric definitions
- [references/trading-modes.md](references/trading-modes.md) — sim vs real + safety
- [references/arena-workflow.md](references/arena-workflow.md) — how a season runs

## Layout

```
src/
  cli.ts                 # command-line entry
  types.ts               # domain types
  market/market.ts       # deterministic simulated market (+ rug events)
  personalities/         # the 5 strategies
  engine/                # brokers (sim + Bankr) and the arena loop
  metrics/leaderboard.ts # PnL, drawdown, win rate, rugs, best/worst
  store/store.ts         # JSON persistence
```

## License

MIT
