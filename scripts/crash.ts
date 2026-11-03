import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
import { runCampaign } from '../src/core/campaign.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const args = process.argv.slice(2);
const value = (flag: string, fallback: number) => { const i = args.indexOf(flag); return i < 0 ? fallback : Number(args[i + 1]); };
if (args.includes('--help')) {
  console.log('UI Crash Test\n\nnpm run crash -- [--seed 42] [--width 360]\n\nRuns the local member-list experiment, reduces a valid failure and verifies its exported regression.');
  process.exit(0);
}
if (args.some((arg, index) => index % 2 === 0 && !['--seed', '--width'].includes(arg))) throw new Error('Unknown option. Use --help.');
const server = await createServer({ configFile: fileURLToPath(new URL('../vite.config.ts', import.meta.url)), server: { port: 0, host: '127.0.0.1', open: false } });
try {
  await server.listen();
  const address = server.httpServer!.address();
  if (!address || typeof address === 'string') throw new Error('No local server address.');
  console.log('\n  UI CRASH TEST  /  local experiment\n');
  const report = await runCampaign({ root, baseURL: `http://127.0.0.1:${address.port}`, seed: value('--seed', 42), width: value('--width', 360), onProgress: event => console.log(`  ${event.phase.padEnd(10)} ${event.message}`) });
  console.log(`\n  ${report.summary.checked} cases · ${report.summary.failed} failing cases · ${report.reduction?.evaluations ?? 0} reduction probes`);
  console.log(`  Exported regression: ${report.regression?.verified ? 'RED → GREEN verified' : 'No failing case to export'}`);
  console.log(`  Report: ${root}/artifacts/${report.id}/report.html\n`);
} finally {
  await server.close();
}
