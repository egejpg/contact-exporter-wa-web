// Contact Exporter for WA Web — veri okuma ve dışa aktarma mantığı.
// Hiçbir fonksiyon ağ isteği yapmaz; her şey tarayıcı içinde kalır.

/**
 * WhatsApp Web sekmesinin içinde çalıştırılır (chrome.scripting.executeScript).
 * Kendi kendine yeterli olmalı: dışarıdaki hiçbir değişkene erişemez.
 * Sadece okur, hiçbir şey yazmaz.
 */
export async function extractContacts() {
  const DB = 'model-storage';
  const STORE = 'contact';

  // Veritabanı yoksa açmaya çalışma (open() boş bir veritabanı yaratırdı).
  if (indexedDB.databases) {
    const dbs = await indexedDB.databases();
    if (!dbs.some((d) => d.name === DB)) return { ok: false, code: 'NO_DB' };
  }

  const db = await new Promise((resolve, reject) => {
    const req = indexedDB.open(DB);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onupgradeneeded = () => { req.transaction.abort(); };
  }).catch(() => null);
  if (!db) return { ok: false, code: 'NO_DB' };

  try {
    if (!db.objectStoreNames.contains(STORE)) {
      return { ok: false, code: 'NO_STORE', stores: [...db.objectStoreNames] };
    }
    const rows = await new Promise((resolve, reject) => {
      const req = db.transaction(STORE, 'readonly').objectStore(STORE).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });

    const idStr = (v) =>
      typeof v === 'string' ? v : (v && (v._serialized || (v.user && v.server ? v.user + '@' + v.server : ''))) || '';

    const contacts = [];
    for (const c of rows) {
      // Yeni hesaplarda kimlik "@lid" olabilir; gerçek numara phoneNumber alanında durur.
      const id = idStr(c.phoneNumber) || idStr(c.id);
      if (!/@c\.us$/.test(id)) continue; // gruplar, yayın listeleri vb. değil
      const digits = id.split('@')[0].replace(/\D/g, '');
      if (digits.length < 7) continue;
      contacts.push({
        name: String(c.name || c.shortName || '').trim(),
        pushname: String(c.pushname || c.verifiedName || '').trim(),
        digits,
      });
    }
    return {
      ok: true,
      total: rows.length,
      contacts,
      sampleKeys: rows[0] ? Object.keys(rows[0]).slice(0, 30) : [],
    };
  } finally {
    db.close(); // WhatsApp'ın kendi işlemlerini bloklamamak için
  }
}

/**
 * Kontrol karakterlerini (satır sonu dahil) ve yazı yönünü değiştiren Unicode
 * karakterlerini temizler. Profil adlarını (pushname) karşı taraf belirler;
 * bunlar CSV/VCF'ye satır sonu ya da ters yazılmış sahte metin sızdırmamalı.
 */
export function cleanName(s) {
  return String(s ?? '')
    .replace(/[\u0000-\u001f\u007f-\u009f‎‏‪-‮⁦-⁩]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Ham kişi kayıtlarını tekilleştirir ve sıralar. */
export function buildList(contacts, { includeUnsaved = false } = {}) {
  const byNumber = new Map();
  for (const c of contacts) {
    const saved = !!cleanName(c.name);
    if (!saved && !includeUnsaved) continue;
    const name = cleanName(c.name) || cleanName(c.pushname);
    const prev = byNumber.get(c.digits);
    // Aynı numara birden çok kez gelirse rehberde kayıtlı olanı tercih et.
    if (!prev || (!prev.saved && saved)) {
      byNumber.set(c.digits, { name, digits: c.digits, saved });
    }
  }
  return [...byNumber.values()].sort((a, b) => {
    if (a.saved !== b.saved) return a.saved ? -1 : 1;
    return (a.name || '\uffff').localeCompare(b.name || '\uffff', 'tr');
  });
}

/** Numarayı istenen biçime çevirir. style: 'e164' | 'tr' */
export function formatNumber(digits, style = 'e164') {
  if (style === 'tr' && digits.length === 12 && digits.startsWith('90')) {
    const d = digits.slice(2); // 5321234567
    return `0${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8)}`;
  }
  return '+' + digits;
}

/**
 * CSV üretir.
 * excel=true: Türkçe Excel için ';' ayırıcı; numaralar metin olarak korunur
 * (yoksa Excel +905321234567'yi 9,05E+11'e çevirir).
 * Her iki modda da =,+,-,@ ile başlayan isimler formül olarak çalıştırılmaz:
 * "Excel'de açacağım" kapalı olsa bile dosya sonunda bir tablo programında açılabilir.
 */
export function toCSV(list, { excel = false, style = 'e164' } = {}) {
  const sep = excel ? ';' : ',';
  const q = (s) => {
    const v = String(s ?? '');
    return /["\r\n,;]/.test(v) || v !== v.trim() ? '"' + v.replace(/"/g, '""') + '"' : v;
  };
  const safeName = (n) => (/^[=+\-@\t\r]/.test(n) ? "'" + n : n);
  const phone = (d) => {
    const v = formatNumber(d, style);
    return excel ? '"=""' + v + '"""' : q(v);
  };
  const lines = [['Ad', 'Telefon'].join(sep)];
  for (const x of list) lines.push([q(safeName(x.name)), phone(x.digits)].join(sep));
  return '\uFEFF' + lines.join('\r\n') + '\r\n'; // BOM: Excel Türkçe karakterleri doğru göstersin
}

/** vCard 3.0 üretir. Telefonların hepsi bunu doğrudan içe aktarır. */
export function toVCF(list) {
  const esc = (s) => String(s ?? '').replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  return list
    .map((x) => {
      const name = x.name || '+' + x.digits;
      return [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `N:;${esc(name)};;;`,
        `FN:${esc(name)}`,
        `TEL;TYPE=CELL:+${x.digits}`, // içe aktarmada her ülkede doğru çalışması için uluslararası biçim
        'END:VCARD',
      ].join('\r\n');
    })
    .join('\r\n') + '\r\n';
}
