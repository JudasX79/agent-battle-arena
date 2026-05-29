import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { hasState, loadState, seasonFor } from './store/store.ts';
import { computeScore } from './metrics/leaderboard.ts';
import { STRATEGIES } from './personalities/index.ts';
import type { AgentState } from './types.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, '..', 'public');
const HTML_PATH = join(PUBLIC_DIR, 'index.html');

const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.css': 'text/css',
  '.js': 'text/javascript',
};

// Serve a file from public/ safely (no path traversal). Returns true if handled.
function serveStatic(urlPath: string, res: import('node:http').ServerResponse): boolean {
  const clean = urlPath.replace(/^\/+/, '');
  if (!clean || clean.includes('..')) return false;
  const filePath = join(PUBLIC_DIR, clean);
  if (!filePath.startsWith(PUBLIC_DIR) || !existsSync(filePath)) return false;
  const ext = filePath.slice(filePath.lastIndexOf('.'));
  res.writeHead(200, { 'Content-Type': CONTENT_TYPES[ext] ?? 'application/octet-stream' });
  res.end(readFileSync(filePath));
  return true;
}

// Down-sample an equity curve to at most `max` points for compact sparklines.
function sample(curve: AgentState['equityCurve'], max = 80): number[] {
  if (curve.length <= max) return curve.map((p) => p.equityUsd);
  const step = curve.length / max;
  const out: number[] = [];
  for (let i = 0; i < max; i++) out.push(curve[Math.floor(i * step)].equityUsd);
  out.push(curve[curve.length - 1].equityUsd);
  return out;
}

function buildPayload() {
  if (!hasState()) {
    return { ok: false, message: 'No arena yet. Run: node src/cli.ts seed-demo' };
  }
  const state = loadState();
  const board = Object.values(state.agents)
    .map((a) => {
      const score = computeScore(state, a);
      const strat = STRATEGIES[a.personality];
      return {
        ...score,
        label: strat.label,
        blurb: strat.blurb,
        startingCashUsd: a.startingCashUsd,
        equityCurve: sample(a.equityCurve),
        openPositions: Object.values(a.positions)
          .filter((p) => p.qty > 0)
          .map((p) => ({ symbol: p.symbol, qty: p.qty, avgPrice: p.avgPrice })),
        recentTrades: a.trades.slice(-6).map((t) => ({
          tick: t.tick,
          side: t.side,
          symbol: t.symbol,
          usd: t.usd,
          realizedPnl: t.realizedPnl,
          reason: t.reason,
        })),
      };
    })
    .sort((a, b) => b.pnlPct - a.pnlPct);

  return {
    ok: true,
    season: {
      seasonId: state.seasonId,
      seed: state.seed,
      tick: state.tick,
      seasonTicks: state.seasonTicks,
      rugs: state.ruggedTokens,
      complete: state.tick >= state.seasonTicks,
      startedAt: state.startedAt,
    },
    board,
  };
}

export function startServer(port: number): void {
  const server = createServer((req, res) => {
    const url = (req.url ?? '/').split('?')[0];

    if (url === '/api/leaderboard') {
      try {
        const payload = buildPayload();
        res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        res.end(JSON.stringify(payload));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, message: err instanceof Error ? err.message : String(err) }));
      }
      return;
    }

    if (url === '/' || url === '/index.html') {
      if (!existsSync(HTML_PATH)) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('index.html not found at ' + HTML_PATH);
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(readFileSync(HTML_PATH));
      return;
    }

    if (serveStatic(url, res)) return;

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('not found');
  });

  server.listen(port, () => {
    console.log(`Arena dashboard → http://localhost:${port}`);
    console.log('API            → http://localhost:' + port + '/api/leaderboard');
    console.log('(run "node src/cli.ts run --all" in another shell, then refresh)');
  });
}
