import { fileURLToPath } from 'node:url';
import { extname, resolve } from 'node:path';

/** Works in the source checkout and in the compiled, installed library. */
export const runtimeRoot = fileURLToPath(new URL('..', import.meta.url));
export const runtimeExtension = extname(fileURLToPath(import.meta.url));
export const runtimePath = (path: string) => resolve(runtimeRoot, path + runtimeExtension);
