import { spawn } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { readFile, writeFile, mkdir, symlink, unlink } from 'node:fs/promises';
import { createRequire } from 'node:module';

export async function runExportedTest(root: string, directory: string, baseURL: string, layout: 'broken' | 'fixed'): Promise<{ passed: number; failed: number }> {
  const localRequire = createRequire(import.meta.url);
  const installedTest = localRequire.resolve('@playwright/test/package.json');
  let resolvedFromOutput: string | undefined;
  try { resolvedFromOutput = createRequire(resolve(directory, '__resolve__.cjs')).resolve('@playwright/test/package.json'); } catch { /* An absolute output directory may sit outside the application. */ }
  const dependencyLink = resolve(directory, 'node_modules/@playwright/test');
  let linked = false;
  try {
    if (resolvedFromOutput !== installedTest) {
      await mkdir(dirname(dependencyLink), { recursive: true });
      await symlink(dirname(installedTest), dependencyLink, process.platform === 'win32' ? 'junction' : 'dir');
      linked = true;
    }
    const output = await new Promise<string>((resolveOutput, reject) => {
      const cli = createRequire(import.meta.url).resolve('@playwright/test/cli');
      const child = spawn(process.execPath, [cli, 'test', '--config', resolve(directory, 'playwright.config.ts'), '--reporter=json'], {
        cwd: root, env: { ...process.env, UI_CRASH_BASE_URL: baseURL, UI_CRASH_LAYOUT: layout, FORCE_COLOR: '0' }, stdio: ['ignore', 'pipe', 'pipe'],
      });
      let stdout = '', stderr = '', killed = false;
      const timer = setTimeout(() => { killed = true; child.kill('SIGTERM'); }, 40000);
      child.stdout.on('data', chunk => { stdout += chunk; });
      child.stderr.on('data', chunk => { stderr += chunk; });
      child.on('error', error => { clearTimeout(timer); reject(error); });
      child.on('close', code => {
        clearTimeout(timer);
        if (killed || (code !== 0 && code !== 1)) return reject(new Error(`Exported test did not execute normally (${code}): ${stderr}`));
        resolveOutput(stdout);
      });
    });
    await writeFile(resolve(directory, `test-${layout}.json`), output);
    const result = JSON.parse(output);
    if (result.errors?.length || result.stats?.skipped || result.stats?.flaky) throw new Error('The exported test had an infrastructure error, skip, or retry.');
    const specs = (result.suites ?? []).flatMap(function flatten(suite: { specs?: unknown[]; suites?: unknown[] }): unknown[] { return [...suite.specs ?? [], ...(suite.suites ?? []).flatMap(item => flatten(item as typeof suite))]; });
    if (specs.length !== 1 || result.stats.expected + result.stats.unexpected !== 1) throw new Error('Expected exactly one exported test to run.');
    const executed = (specs[0] as { tests: { results: { attachments: { name: string; path?: string; body?: string }[] }[] }[] }).tests[0].results;
    if (executed.length !== 1) throw new Error('Expected one attempt with no retries.');
    const attachment = executed[0].attachments.find(item => item.name === 'action-finding');
    if (!attachment || (!attachment.path && !attachment.body)) throw new Error('The exported test did not attach a measured rule result.');
    const measured = JSON.parse(attachment.path ? await readFile(attachment.path, 'utf8') : Buffer.from(attachment.body!, 'base64').toString('utf8'));
    const saved = JSON.parse(await readFile(resolve(directory, 'case.json'), 'utf8'));
    if (layout === 'broken' && (measured.status !== 'failed' || measured.signature !== saved.failureSignature)) throw new Error('The exported test did not reproduce the same saved failure.');
    if (layout === 'fixed' && measured.status !== 'passed') throw new Error('The fixed variant did not pass the saved rule.');
    return { passed: result.stats.expected, failed: result.stats.unexpected };
  } finally {
    // Verification-only dependency resolution is never bundled and never retained as an artifact link.
    if (linked) await unlink(dependencyLink);
  }
}
