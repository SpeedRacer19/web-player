import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';

// Shown on the head unit's faceplate. Read from package.json so a version bump
// is the only change a release needs.
const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
  version: string;
};

// https://vite.dev/config/
export default defineConfig({
  // Sub-path the site is served from. '/' for a root domain; GitHub Pages
  // project sites live under '/<repo>/' (the deploy workflow sets this).
  base: process.env.BASE_PATH || '/',
  plugins: [react(), tailwindcss()],
  define: { __APP_VERSION__: JSON.stringify(version) },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
});
