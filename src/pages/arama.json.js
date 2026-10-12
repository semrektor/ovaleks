// Ürün arama dizini: /arama.json  (src/scripts/arama.js okur)
import { products, img, thumb, productUrl } from '../lib/catalog.js';
import { norm } from '../scripts/arama.js';

export function GET() {
  const list = products.map((p) => {
    const kat = (p.kategoriler || []).slice().sort((a, b) => b.yol.length - a.yol.length)[0];
    return {
      ad: p.ad,
      url: productUrl(p),
      gorsel: thumb(img(p)) || null,
      kat: kat?.ad || null,
      net: p.alanlar?.Net || p.alanlar?.['Net Miktar'] || null,
      kod: p.sku || null,
      // aranacak metin: ad, etiketler, kategoriler ve ürün kodu
      ara: norm([p.ad, ...(p.etiketler || []), ...(p.kategoriler || []).map((k) => k.ad), p.sku].join(' ')),
    };
  });
  return new Response(JSON.stringify(list), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
