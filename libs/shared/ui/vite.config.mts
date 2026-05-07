/// <reference types='vitest' />
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../../node_modules/.vite/libs/shared/ui',
  plugins: [
    react(),
    nxViteTsPaths(),
    dts({
      entryRoot: 'src',
      tsconfigPath: resolve(import.meta.dirname, '../../../tsconfig.base.json'),
    }),
  ],
  build: {
    outDir: '../../../dist/libs/shared/ui',
    emptyOutDir: true,
    reportCompressedSize: true,
    lib: {
      entry: 'src/index.ts',
      name: 'ui',
      fileName: 'index',
      formats: ['es' as const],
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
    },
  },
}));
