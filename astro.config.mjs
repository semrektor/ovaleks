import { defineConfig } from 'astro/config';

// Eski sitedeki adresler (/urunler/<slug>/, /urun-kategori/<yol>/) aynen korunuyor.
export default defineConfig({
  site: 'https://ovaleks.com',
  trailingSlash: 'always',
  server: { port: 4321 },
});
