import type { IncomingMessage, ServerResponse } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, sep, extname, basename } from 'node:path';
import { BASELINE, WORST_CASE, cloneInput } from "../demo/model.ts";
import type { RunStatus } from "../demo/report.ts";
import { compatBaseline } from '../../scenarios/compat.ts';
import { externalScenarios } from '../../scenarios/index.ts';
import { cartBaseline } from '../../scenarios/cart-preview.ts';

export function createApi(root: string) {
  const artifacts = resolve(root, 'artifacts');
  let status: RunStatus = { state: 'idle', phase: 'Ready', events: [] };
  let scenarioStatus: { state: 'idle' | 'running' | 'completed' | 'error'; events: string[]; error?: string } = { state: 'idle', events: [] };
  const json = (res: ServerResponse, code: number, value: unknown) => { res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); res.end(JSON.stringify(value)); };
  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const url = new URL(req.url ?? '/', 'http://127.0.0.1');
    if (!url.pathname.startsWith('/api/') && !url.pathname.startsWith('/artifacts/')) return next();
    try {
      if (url.pathname === '/api/compat-fixture' && req.method === 'GET') return json(res, 200, compatBaseline);
      if (url.pathname === '/api/cart-fixture' && req.method === 'GET') return json(res, 200, cartBaseline);
      if (url.pathname === '/api/controls' && req.method === 'GET') {
        let report, reportURL;
        try {
          const { id } = JSON.parse(await readFile(resolve(artifacts, 'controls-latest.json'), 'utf8'));
          if (!/^run-controls-[a-z0-9-]+$/.test(id)) throw new Error('Invalid controls run identifier');
          report = JSON.parse(await readFile(resolve(artifacts, id, 'report.json'), 'utf8'));
          reportURL = `/artifacts/${id}/report.html`;
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
          try { report = JSON.parse(await readFile(resolve(root, 'docs/evidence/controls/report.json'), 'utf8')); reportURL = '/docs/evidence/controls/report.json'; }
          catch (fallback) { if ((fallback as NodeJS.ErrnoException).code === 'ENOENT') return json(res, 200, { available: false }); throw fallback; }
        }
        const sources = await Promise.all(['src/core/action-rule.ts', 'fixtures/controls/cases.ts'].map(async path => ({ path, sha256: createHash('sha256').update(await readFile(resolve(root, path))).digest('hex') })));
        const currentHash = createHash('sha256').update(JSON.stringify(sources)).digest('hex');
        return json(res, 200, { available: true, reportURL, summary: report.summary, createdAt: report.createdAt, stale: report.sourceHash !== currentHash });
      }
      if (url.pathname === '/api/scenarios' && req.method === 'GET') {
        const scenarios = await Promise.all(externalScenarios.map(async config => {
          let latest = null;
          try {
            const { id } = JSON.parse(await readFile(resolve(artifacts, `scenario-${config.id}.json`), 'utf8'));
            if (!/^run-[a-z0-9-]+$/.test(id)) throw new Error('Invalid scenario run identifier');
            const report = JSON.parse(await readFile(resolve(artifacts, id, 'report.json'), 'utf8'));
            latest = { id, outcome: report.outcome, summary: report.summary, sourceHash: report.environment.sourceHash, createdAt: report.createdAt };
          } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
          return { id: config.id, name: config.name, description: config.description, provenance: config.provenance, latest };
        }));
        return json(res, 200, { scenarios, status: scenarioStatus });
      }
      if (url.pathname === '/api/scenarios/run' && req.method === 'POST') {
        const host = req.headers.host ?? '';
        if (!/^(127\.0\.0\.1|localhost):\d+$/.test(host) || (req.headers.origin && req.headers.origin !== `http://${host}`)) return json(res, 403, { error: 'Runs are only accepted from this local workspace.' });
        let raw = '';
        for await (const chunk of req) { raw += chunk; if (raw.length > 4096) return json(res, 413, { error: 'Request too large.' }); }
        let body;
        try { body = JSON.parse(raw || '{}'); } catch { return json(res, 400, { error: 'The request body must be valid JSON.' }); }
        if (!body || typeof body !== 'object' || Array.isArray(body)) return json(res, 400, { error: 'The request body must be an object.' });
        const seed = body.seed ?? 42;
        const selected = body.scenario === undefined || body.scenario === 'all' ? externalScenarios : externalScenarios.filter(config => config.id === body.scenario);
        if (!selected.length || !Number.isInteger(seed) || seed < 0 || seed > 2147483647) return json(res, 400, { error: 'Choose a known scenario and a whole-number seed from 0 to 2147483647.' });
        if (scenarioStatus.state === 'running' || status.state === 'running') return json(res, 409, { error: 'A campaign is already running.' });
        scenarioStatus = { state: 'running', events: [] };
        json(res, 202, { accepted: true });
        void import('../scenario/run.ts').then(async ({ runScenario }) => {
          for (const config of selected) await runScenario(config, { root, appURL: `http://${host}`, seed, onProgress: message => { scenarioStatus.events.push(message); } });
          scenarioStatus.state = 'completed';
        }).catch(error => { scenarioStatus.state = 'error'; scenarioStatus.error = String(error); });
        return;
      }
      if (url.pathname === '/api/members' && req.method === 'GET') return json(res, 200, cloneInput(url.searchParams.get('profile') === 'stress' ? WORST_CASE : BASELINE));
      if (url.pathname === '/api/status' && req.method === 'GET') return json(res, 200, status);
      if (url.pathname === '/api/report' && req.method === 'GET') {
        try {
          const latest = JSON.parse(await readFile(resolve(artifacts, 'latest.json'), 'utf8'));
          if (!/^run-[a-z0-9-]+$/.test(latest.id)) throw new Error('Invalid run identifier.');
          return json(res, 200, { report: JSON.parse(await readFile(resolve(artifacts, latest.id, 'report.json'), 'utf8')) });
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code === 'ENOENT') return json(res, 200, { report: null });
          throw error;
        }
      }
      if (url.pathname === '/api/run' && req.method === 'POST') {
        const host = req.headers.host ?? '';
        if (!/^(127\.0\.0\.1|localhost):\d+$/.test(host) || (req.headers.origin && req.headers.origin !== `http://${host}`)) return json(res, 403, { error: 'Runs are only accepted from this local workspace.' });
        let raw = '';
        for await (const chunk of req) { raw += chunk; if (raw.length > 4096) return json(res, 413, { error: 'Request too large.' }); }
        let body;
        try { body = JSON.parse(raw || '{}'); } catch { return json(res, 400, { error: 'The request body must be valid JSON.' }); }
        if (!body || typeof body !== 'object' || Array.isArray(body)) return json(res, 400, { error: 'The request body must be an object.' });
        const seed = body.seed ?? 42, width = body.width ?? 360;
        if (!Number.isInteger(seed) || seed < 0 || seed > 2147483647 || !Number.isInteger(width) || width < 320 || width > 640) return json(res, 400, { error: 'Use a seed from 0–2147483647 and width from 320–640.' });
        if (status.state === 'running' || scenarioStatus.state === 'running') return json(res, 409, { error: 'A campaign is already running.' });
        status = { state: 'running', phase: 'Starting Chromium', events: [] };
        json(res, 202, { accepted: true });
        void import("../demo/campaign.ts").then(async ({ runCampaign }) => {
          const report = await runCampaign({ root, baseURL: `http://${host}`, seed, width, onProgress: event => { status.phase = event.phase; status.events.push(event); } });
          status.state = 'completed'; status.phase = report.regression?.verified ? 'Regression verified' : report.outcome === 'inconclusive' ? 'Some cases inconclusive' : 'No failure discovered'; status.runId = report.id;
        }).catch(error => { status.state = 'error'; status.phase = 'Run stopped'; status.error = String(error); });
        return;
      }
      if (url.pathname.startsWith('/artifacts/') && req.method === 'GET') {
        const path = resolve(root, `.${decodeURIComponent(url.pathname)}`);
        if (!path.startsWith(artifacts + sep)) return json(res, 403, { error: 'Path outside artifacts.' });
        const info = await stat(path);
        if (!info.isFile()) return json(res, 404, { error: 'Artifact not found.' });
        const types: Record<string, string> = { '.png': 'image/png', '.json': 'application/json', '.html': 'text/html; charset=utf-8', '.ts': 'text/plain; charset=utf-8', '.md': 'text/plain; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.zip': 'application/zip' };
        if (!types[extname(path)]) return json(res, 403, { error: 'Unsupported artifact.' });
        res.writeHead(200, { 'Content-Type': types[extname(path)], 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store', ...(url.searchParams.has('download') ? { 'Content-Disposition': `attachment; filename="${basename(path)}"` } : {}) });
        res.end(await readFile(path)); return;
      }
      return json(res, 404, { error: 'Unknown endpoint.' });
    } catch (error) {
      return json(res, (error as NodeJS.ErrnoException).code === 'ENOENT' ? 404 : 500, { error: String(error) });
    }
  };
}
