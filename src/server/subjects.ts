import type { IncomingMessage, ServerResponse } from 'node:http';
import { readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { resolve, extname } from 'node:path';

const prefix = '/subjects/todomvc/';
export function createSubjects(root: string) {
  const manifest = JSON.parse(readFileSync(resolve(root, 'fixtures/todomvc/provenance.json'), 'utf8'));
  const allowed = new Set<string>(manifest.files.map((file: { path: string }) => file.path).filter((path: string) => path.startsWith('examples/vue/dist/') || path === 'learn.json'));
  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const url = new URL(req.url ?? '/', 'http://127.0.0.1');
    if (!url.pathname.startsWith(prefix)) return next();
    try {
      let path = decodeURIComponent(url.pathname.slice(prefix.length));
      if (path.endsWith('/')) path += 'index.html';
      if (!allowed.has(path) || !['GET', 'HEAD'].includes(req.method ?? '')) { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('Subject file not found'); return; }
      const types: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.ico': 'image/x-icon' };
      const data = await readFile(resolve(root, 'fixtures/todomvc', path));
      res.writeHead(200, { 'Content-Type': types[extname(path)] ?? 'application/octet-stream', 'Content-Length': data.length, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
      res.end(req.method === 'HEAD' ? undefined : data);
    } catch (error) { res.writeHead((error as NodeJS.ErrnoException).code === 'ENOENT' ? 404 : 500, { 'Content-Type': 'text/plain' }); res.end('Unable to serve subject file'); }
  };
}

export async function subjectAssets(root: string) {
  const manifest = JSON.parse(await readFile(resolve(root, 'fixtures/todomvc/provenance.json'), 'utf8'));
  return Promise.all(manifest.files.filter((file: { path: string }) => file.path.startsWith('examples/vue/dist/') || file.path === 'learn.json').map(async (file: { path: string }) => ({ fileName: `subjects/todomvc/${file.path}`, source: await readFile(resolve(root, 'fixtures/todomvc', file.path)) })));
}
