import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { createApi } from './src/server/api.ts';
import { createSubjects, subjectAssets } from './src/server/subjects.ts';

const root = fileURLToPath(new URL('.', import.meta.url));
export default defineConfig({
  root,
  resolve: { alias: { components: fileURLToPath(new URL('./fixtures/compat-app/vendor/react-shopping-cart/src/components', import.meta.url)), contexts: fileURLToPath(new URL('./fixtures/compat-app/vendor/react-shopping-cart/src/contexts', import.meta.url)), hooks: fileURLToPath(new URL('./fixtures/compat-app/vendor/react-shopping-cart/src/hooks', import.meta.url)) } },
  plugins: [{ name: 'local-crash-api', configureServer(server) { server.middlewares.use(createSubjects(root)); server.middlewares.use(createApi(root)); }, async generateBundle() { for (const asset of await subjectAssets(root)) this.emitFile({ type: 'asset', ...asset }); } }],
  server: { host: '127.0.0.1', port: 4173, watch: { ignored: ['**/artifacts/**', '**/examples/**'] } },
  build: { outDir: 'dist', rollupOptions: { input: { dashboard: fileURLToPath(new URL('./index.html', import.meta.url)), compat: fileURLToPath(new URL('./fixtures/compat-app/index.html', import.meta.url)), cart: fileURLToPath(new URL('./fixtures/compat-app/cart.html', import.meta.url)) } } },
});
