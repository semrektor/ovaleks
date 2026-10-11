import { marked } from 'marked';
import products from '../data/urunler.json';
import categories from '../data/kategoriler.json';
// Her aromanın sos rengi, ürünün kendi etiketindeki sos görselinden okunur (scripts/sauce-colors.mjs).
import sauceColors from '../data/sos-renkleri.json';

import allPages from '../data/sayfalar.json';
import recipes from '../data/tarifler.json';

export { products, categories, recipes };

// Eski sitedeki kurumsal sayfalar (aynı adreslerle). Boş ve eklentiye ait sayfalar alınmadı.
const corporateSlugs = ['hakkimizda', 'firma-bilgilerimiz', 'sertifikalarimiz', 'insan-kaynaklari', 'oneri-sikayet-formu', 'iletisim', 'gizlilik-sozlesmesi'];
export const corporatePages = corporateSlugs.map((s) => allPages.find((p) => p.slug === s)).filter(Boolean);
export const corporateNav = [
  ['Hakkımızda', '/hakkimizda/'],
  ['Firma Bilgilerimiz', '/firma-bilgilerimiz/'],
  ['Sertifikalarımız', '/sertifikalarimiz/'],
  ['İnsan Kaynakları', '/insan-kaynaklari/'],
  ['Öneri / Şikâyet', '/oneri-sikayet-formu/'],
  ['Online Katalog', '/dosyalar/katalog.pdf'],
];
// Arşivde form alanları metin işaretleri olarak duruyor; sayfada göstermeyiz (formlar yeniden kurulacak).
export const hasForm = (text) => /\*\*\[FORM\]\*\*/.test(text || '');
export const stripForm = (text) => (text || '').replace(/\*\*\[FORM\]\*\*[\s\S]*?\*\*\[\/FORM\]\*\*/g, '').replace(/^\[(alan|seçim alanı|metin alanı|düğme)[^\n]*\]\s*$/gm, '').replace(/\[gömülü içerik \(iframe\)\]\([^)]*\)/g, '');

export const img = (p) => (p.gorseller_yerel?.[0] ? '/' + p.gorseller_yerel[0] : null);
export const productUrl = (p) => `/urunler/${p.slug}/`;
export const categoryUrl = (c) => new URL(c.url).pathname;
export const bySlug = new Map(products.map((p) => [p.slug, p]));

export const inCategory = (c) => products.filter((p) => p.kategoriler.some((k) => k.yol === c.yol || k.yol.startsWith(c.yol + ' > ')));
export const topCategories = categories.filter((c) => !c.ust_kategori && inCategory(c).length > 0);

// Eski sitedeki iç bağlantıları yeni sitede de çalışacak şekilde göreli yap.
// Görseller: eski yükleme adresi yerel klasöre, küçük boy kopyalar özgün dosyaya çevrilir.
const localize = (html) =>
  html
    .replace(/https:\/\/ovaleks\.com\//g, '/')
    .replace(/\/wp-content\/uploads\//g, '/gorseller/')
    .replace(/(\/gorseller\/[^"'\s)]*?)-\d+x\d+(\.(?:jpe?g|png|webp))/g, '$1$2');
export const md = (text) => localize(marked.parse(text || '', { async: false }));

// Açıklamanın başındaki "OVALEKS · ..." satırı ve ürün adını tekrar eden başlık sayfada zaten var.
export const cleanDescription = (p) =>
  (p.aciklama_md || '')
    .replace(/^\s*OVALEKS · [^\n]*\n+/i, '')
    .replace(/^\s*#{1,4} [^\n]*\n+/, '')
    .replace(/!\[[^\]]*\]\([^)]*\/wp-content\/[^)]*\)/g, '');

export const plain = (text) => (text || '').replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[*#>|]/g, '').replace(/\s+/g, ' ').trim();

// Waffle sos aromaları: her aromanın 10 kg kova ve 1 kg şişe ürünü var.
export const flavors = [
  { key: 'sutlu', ad: 'Sütlü', not: 'Sütlü kakaolu waffle sosu', bg: '#F1D7B5', ink: '#5B341C', kova: 'sutlu-kova-waffle-sos', sise: 'sutlu-waffle-sos-sise' },
  { key: 'bitter', ad: 'Bitter', not: 'Yağı azaltılmış kakao tozuyla bitter sos', bg: '#DCC1A6', ink: '#3A2015', kova: 'bitter-kova-waffle-sos', sise: 'bitter-waffle-sos-sise' },
  { key: 'beyaz', ad: 'Beyaz', not: 'Vanilya aromalı beyaz sos', bg: '#FAF1DC', ink: '#6A4A1E', kova: 'beyaz-kova-waffle-sos', sise: 'beyaz-waffle-sos-sise' },
  { key: 'antep', ad: 'Antep Fıstıklı', not: '%6 Antep fıstığı içerir', bg: '#DCE7B4', ink: '#3F4F17', kova: 'antep-fistikli-kova-waffle-sos', sise: 'antep-fistikli-waffle-sos' },
  { key: 'karamel', ad: 'Karamel', not: 'Karamel aromalı sos', bg: '#F5D193', ink: '#6B3F0E', kova: 'karamel-kova-waffle-sos', sise: 'karamel-aromali-waffle-sos' },
  { key: 'cilek', ad: 'Çilek', not: 'Çilek aromalı sos', bg: '#F8C6CC', ink: '#7A1627', kova: 'cilek-kova-waffle-sos', sise: 'cilek-aromali-waffle-sos' },
  { key: 'frambuaz', ad: 'Frambuaz', not: 'Frambuaz aromalı sos', bg: '#F0B2C4', ink: '#6E1238', kova: 'frambuaz-kova-waffle-sos', sise: 'frambuaz-aromali-waffle-sos' },
].map((f) => ({ ...f, kovaUrun: bySlug.get(f.kova), siseUrun: bySlug.get(f.sise) }));

// Koyu sahnede kullanılan aroma rengi ve zemini kesilmiş görseller (scripts/cutout.mjs üretir).
const deep = { sutlu: '#9A5A2B', bitter: '#5A2A16', beyaz: '#B08D4F', antep: '#4F6B1C', karamel: '#B5701A', cilek: '#B3202F', frambuaz: '#A01A52' };
export const stageFlavors = flavors.map((f) => ({
  key: f.key,
  ad: f.ad,
  not: f.not,
  fc: deep[f.key],
  sos: sauceColors[f.key],
  kova: `/gorseller/kesim/${f.key}-kova.webp`,
  sise: `/gorseller/kesim/${f.key}-sise.webp`,
  kovaUrl: productUrl(f.kovaUrun),
  siseUrl: productUrl(f.siseUrun),
  kovaKod: f.kovaUrun.sku,
  siseKod: f.siseUrun.sku,
}));

export const site = {
  ad: 'Ovaleks',
  firma: 'Ustalar Pasta Ürünleri Gıda San. ve Tic. Ltd. Şti.',
  adres: 'Firuzköy Mah. Bağlariçi Cad. No:81 34325 Avcılar / İstanbul',
  telefon: '+90 (212) 423 95 95',
  telefonHref: 'tel:+902124239595',
  eposta: 'satis@ovaleks.com',
  kayitNo: 'TR-34-K-203012',
  // Taslak yayındayken arama motorları siteyi dizine eklemez. ovaleks.com'a geçerken false yapın ve vercel.json'daki X-Robots-Tag başlığını kaldırın.
  taslak: true,
};
