import path from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({
      outDir: path.resolve(__dirname, 'dist/types'),
      copyDtsFiles: true,
      staticImport: true,
      rollupTypes: true,
    }),
  ],
  server: {
    port: 8081,
    open: true,
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'App',
      fileName: format => `cluster-crush.${format}.js`,
    },
  },
  define: {
    APP_VERSION: JSON.stringify(process.env.npm_package_version),
  },
});
