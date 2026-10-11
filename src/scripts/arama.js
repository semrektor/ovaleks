// Ürün arama: dizin /arama.json adresinden gelir (src/pages/arama.json.js üretir).
// Üst menüdeki arama penceresi ve Tüm Ürünler sayfasındaki süzgeç aynı eşleştirmeyi kullanır.

// Büyük/küçük harf ve Türkçe karakter farkını yok sayar: "ŞANTİ", "santi", "Şanti" aynı sayılır
export const norm = (s) =>
  String(s || '').toLocaleLowerCase('tr').replace(/ı/g, 'i').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

let dizin;
export function yukle() {
  dizin ||= fetch('/arama.json').then((r) => r.json()).then((list) => list.map((u) => ({ ...u, n: norm(u.ad) })));
  return dizin;
}

// Yazılan her kelime üründe geçmeli; adı o kelimeyle başlayan ürünler öne gelir
export function bul(index, q) {
  const kelimeler = norm(q).split(' ').filter(Boolean);
  if (!kelimeler.length) return [];
  return index
    .filter((u) => kelimeler.every((k) => u.ara.includes(k)))
    .map((u) => ({ u, puan: kelimeler.reduce((p, k) => p + (u.n.startsWith(k) ? 3 : (' ' + u.n).includes(' ' + k) ? 2 : u.n.includes(k) ? 1 : 0), 0) }))
    .sort((a, b) => b.puan - a.puan || a.u.ad.localeCompare(b.u.ad, 'tr'))
    .map((x) => x.u);
}

const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  return e;
};

// Üst menüdeki arama penceresi
export function kur() {
  const dlg = document.querySelector('[data-search]');
  if (!dlg) return;
  const input = dlg.querySelector('input');
  const out = dlg.querySelector('[data-search-results]');
  const status = dlg.querySelector('[data-search-status]');
  const all = dlg.querySelector('[data-search-all]');
  const GOSTER = 8;
  let index = [];
  let aktif = -1;

  const ciz = () => {
    const q = input.value.trim();
    const liste = q ? bul(index, q) : [];
    aktif = -1;
    out.replaceChildren(
      ...liste.slice(0, GOSTER).map((u) => {
        const a = el('a', 'sonuc');
        a.href = u.url;
        if (u.gorsel) {
          const im = el('img');
          im.src = u.gorsel;
          im.alt = '';
          im.width = im.height = 56;
          im.loading = 'lazy';
          a.append(im);
        }
        const s = el('span');
        s.append(el('b', '', u.ad), el('small', '', [u.kat, u.net, u.kod && `Kod ${u.kod}`].filter(Boolean).join(' · ')));
        a.append(s);
        return a;
      }),
    );
    status.textContent = !q ? `${index.length} ürün içinde arayın: ürün adı, aroma ya da ürün kodu.` : liste.length ? `${liste.length} ürün bulundu` : 'Sonuç bulunamadı. Başka bir kelime deneyin.';
    all.hidden = liste.length <= GOSTER;
    all.href = '/urunler/?q=' + encodeURIComponent(q);
    all.textContent = `Tüm sonuçları gör (${liste.length})`;
  };

  const ac = async () => {
    document.querySelectorAll('details.mobile-nav[open]').forEach((d) => (d.open = false));
    dlg.showModal();
    input.select();
    if (!index.length) {
      index = await yukle();
      ciz();
    }
  };
  document.querySelectorAll('[data-search-open]').forEach((b) => b.addEventListener('click', ac));
  dlg.querySelector('[data-search-close]').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); }); // pencerenin dışına tıklanınca kapanır
  input.addEventListener('input', ciz);
  input.addEventListener('keydown', (e) => {
    const items = [...out.children];
    if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && items.length) {
      e.preventDefault();
      aktif = e.key === 'ArrowDown' ? (aktif + 1) % items.length : aktif <= 0 ? items.length - 1 : aktif - 1;
      items.forEach((it, i) => it.classList.toggle('aktif', i === aktif));
      items[aktif].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter' && aktif >= 0) {
      e.preventDefault();
      location.href = items[aktif].href;
    }
  });
}
