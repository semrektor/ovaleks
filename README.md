# ovaleks

Ovaleks web sitesinin taslağı. [Astro](https://astro.build) ile üretilen statik bir sitedir.

## Çalıştırma

```bash
npm install
npm run dev
```

Site http://localhost:4321 adresinde açılır. Yayına hazır dosyalar için:

```bash
npm run build
```

Çıktı `dist/` klasörüne yazılır.

## Klasörler

- `src/` — sayfalar, bileşenler, stiller ve veriler
- `public/` — görseller, katalog ve ana sayfa filminin kareleri

## Taslak: arama motorlarına kapalı

Site taslak olduğu sürece arama motorları dizine eklemez. `ovaleks.com` adresine geçerken iki yer değişir:

- `src/lib/catalog.js` içinde `taslak: true` → `false`
- `vercel.json` içindeki `X-Robots-Tag` başlığı kaldırılır

## Sonradan doldurulacak veriler

- `src/data/sosyal-baglantilar.json` — firmanın sosyal medya hesapları ve WhatsApp numarası
- `src/data/tarif-baglantilari.json` — tariflerin sosyal medya bağlantıları
