import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath } from 'node:url';

// `npm run demo` swaps Supabase for an in-memory mock with sample data.
export default defineConfig(({ mode }) => ({
  ...(mode === 'demo' ? {
    resolve: { alias: { '@supabase/supabase-js': fileURLToPath(new URL('./mock/supabase-mock.js', import.meta.url)) } },
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('https://demo.local'),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify('demo'),
    },
  } : {}),
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: 'Daily Hundred',
        short_name: 'Daily 100',
        description: 'Health, habits and a daily score to chase.',
        theme_color: '#131926',
        background_color: '#F1F3F7',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      injectManifest: { globPatterns: ['**/*.{js,css,html,png,svg,woff2}'] },
      devOptions: { enabled: false },
    }),
  ],
}));
