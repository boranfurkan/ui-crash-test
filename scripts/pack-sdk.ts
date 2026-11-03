import { readFile, mkdir, writeFile, cp, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = fileURLToPath(new URL('..', import.meta.url));
const pkg = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
const staging = resolve(root, 'artifacts', 'sdk-package');
await rm(staging, { recursive: true, force: true });
await mkdir(staging, { recursive: true });
await cp(resolve(root, 'lib'), resolve(staging, 'lib'), { recursive: true });
await writeFile(resolve(staging, 'README.md'), await readFile(resolve(root, 'SDK.md')));
await writeFile(resolve(staging, 'LICENSE'), await readFile(resolve(root, 'LICENSE')));
const manifest = {
  name: pkg.name, version: pkg.version, private: true, type: 'module', description: pkg.description,
  exports: pkg.exports, bin: pkg.bin, engines: pkg.engines, license: 'MIT', files: ['lib', 'README.md', 'LICENSE'],
  dependencies: { fflate: pkg.dependencies.fflate, tsx: pkg.devDependencies.tsx },
  peerDependencies: { '@playwright/test': pkg.dependencies['@playwright/test'] },
};
await writeFile(resolve(staging, 'package.json'), JSON.stringify(manifest, null, 2) + '\n');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const packed = spawnSync(npm, ['pack', '--json', '--ignore-scripts', '--cache', resolve(root, 'artifacts/npm-cache'), '--pack-destination', resolve(root, '..')], { cwd: staging, encoding: 'utf8', shell: process.platform === 'win32' });
if (packed.status !== 0) throw new Error(packed.stderr || packed.stdout);
const [result] = JSON.parse(packed.stdout);
if (result.files.some((file: { path: string }) => /(^|\/)(node_modules|fixtures|artifacts|src|dist|examples)(\/|$)/.test(file.path))) throw new Error('Unexpected source/demo files in SDK package.');
await writeFile(resolve(root, 'artifacts', 'sdk-package.json'), JSON.stringify({ filename: result.filename, version: pkg.version, size: result.size, unpackedSize: result.unpackedSize, integrity: result.integrity, files: result.files.map((file: { path: string }) => file.path), private: true }, null, 2) + '\n');
console.log(JSON.stringify({ tarball: resolve(root, '..', result.filename), size: result.size, files: result.files.length, private: true }, null, 2));
