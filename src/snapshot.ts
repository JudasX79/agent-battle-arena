// Generate a static leaderboard snapshot for hosting (e.g. Vercel).
// Runs the deterministic demo season in-memory and writes the same payload the
// live /api/leaderboard endpoint returns to public/leaderboard.json.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { addAgent, createArena, runRounds } from './engine/arena.ts';
import { generateSeason } from './market/market.ts';
import { payloadFromState } from './server.ts';
import { PERSONALITIES, type Personality } from './types.ts';

const SEED = Number(process.env.ARENA_SEED ?? 42);
const TICKS = Number(process.env.ARENA_TICKS ?? 168);

const names: Record<Personality, string> = {
  'meme-hunter': 'PepeRadar',
  'conservative-dca': 'SteadyHands',
  'degen-sniper': 'ApeFirst',
  'whale-follower': 'WhaleWatch',
  'ai-narrative-trader': 'NarrativeMax',
};

const state = createArena(SEED, TICKS);
for (const p of PERSONALITIES) {
  addAgent(state, { name: names[p], owner: 'demo', personality: p, mode: 'sim', startingCashUsd: 1000 });
}
await runRounds(state, generateSeason(SEED, TICKS), TICKS);

const payload = payloadFromState(state);
const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'leaderboard.json');
writeFileSync(out, JSON.stringify(payload));
console.log(`wrote ${out} — ${payload.board?.length ?? 0} agents, tick ${state.tick}/${state.seasonTicks}`);
