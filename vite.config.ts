import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';
import path from 'path';

const resolvePath = (pathName: string) => path.resolve(__dirname, pathName);

// https://vite.dev/config/
export default defineConfig({
  resolve: { alias: { 'vue-chunkify': resolvePath('./src/index.ts') } },
  plugins: [
    vue(),
    dts({
      include: 'src',
      rollupTypes: true,
    })
  ],
  build: {
    lib: {
      entry: resolvePath('src/index.ts'),
      name: 'Chunkify',
      fileName: (format) => `vue-chunkify.${format}.js`,
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue',
        },
        exports: 'named',
        format: 'es',
      },
    },
  }
})
