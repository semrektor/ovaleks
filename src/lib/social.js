// Firmanın resmi sosyal medya hesapları ve WhatsApp hattı (src/data/sosyal-baglantilar.json)
import veri from '../data/sosyal-baglantilar.json';

const url = (v) => {
  const s = String(v || '').trim();
  return /^https?:\/\//i.test(s) ? s : null;
};

// Numara nasıl yazılırsa yazılsın (0532…, +90 532…, 532…) wa.me adresine çevrilir
export function whatsappUrl(numara, mesaj) {
  let d = String(numara || '').replace(/\D/g, '');
  if (d.length === 11 && d.startsWith('0')) d = '9' + d;
  if (d.length === 10) d = '90' + d;
  if (d.length < 11) return null;
  return `https://wa.me/${d}` + (mesaj ? `?text=${encodeURIComponent(mesaj)}` : '');
}

export const sosyal = {
  instagram: url(veri.instagram),
  youtube: url(veri.youtube),
  linkedin: url(veri.linkedin),
  facebook: url(veri.facebook),
  whatsapp: whatsappUrl(veri.whatsapp, veri.whatsappMesaj),
};
