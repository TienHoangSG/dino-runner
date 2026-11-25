import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';

export default defineConfig({
  base: '/dino/',
  plugins: [react(), federation({
    name: 'dino', filename: 'remoteEntry.js',
    exposes: { './DinoGame': './src/DinoGame.tsx' },
    shared: ['react', 'react-dom']
  })],
  build: { target: 'esnext', outDir: 'dist-hub' }
});
