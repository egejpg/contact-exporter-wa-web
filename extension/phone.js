// Telefon numarası ayrıştırma ve biçimlendirme. Ağ isteği yok, dış kütüphane yok.
//
// WhatsApp numaraları her zaman ülke koduyla gelir (ör. 905321234567).
// Ülke kodları (ITU E.164) önek çakışması olmayan bir küme olduğundan
// 1, 2 ve 3 haneli adayları sırayla denemek kodu kesin olarak bulur.

// ISO ülke kodu + telefon ülke kodu. Aynı kodu paylaşan ülkelerde (+1, +7, +44 …)
// listede ilk geçen o kodun "ana" ülkesi sayılır.
const RAW =
  'US1 CA1 RU7 KZ7 EG20 ZA27 GR30 NL31 BE32 FR33 ES34 HU36 IT39 VA39 RO40 CH41 AT43 GB44 GG44 IM44 JE44 ' +
  'DK45 SE46 NO47 SJ47 PL48 DE49 PE51 MX52 CU53 AR54 BR55 CL56 CO57 VE58 MY60 AU61 CX61 CC61 ID62 PH63 ' +
  'NZ64 SG65 TH66 JP81 KR82 VN84 CN86 TR90 IN91 PK92 AF93 LK94 MM95 IR98 SS211 MA212 EH212 DZ213 TN216 ' +
  'LY218 GM220 SN221 MR222 ML223 GN224 CI225 BF226 NE227 TG228 BJ229 MU230 LR231 SL232 GH233 NG234 TD235 ' +
  'CF236 CM237 CV238 ST239 GQ240 GA241 CG242 CD243 AO244 GW245 IO246 SC248 SD249 RW250 ET251 SO252 DJ253 ' +
  'KE254 TZ255 UG256 BI257 MZ258 ZM260 MG261 RE262 YT262 ZW263 NA264 MW265 LS266 BW267 SZ268 KM269 SH290 ' +
  'ER291 AW297 FO298 GL299 GI350 PT351 LU352 IE353 IS354 AL355 MT356 CY357 FI358 AX358 BG359 LT370 LV371 ' +
  'EE372 MD373 AM374 BY375 AD376 MC377 SM378 UA380 RS381 ME382 XK383 HR385 SI386 BA387 MK389 CZ420 SK421 ' +
  'LI423 FK500 BZ501 GT502 SV503 HN504 NI505 CR506 PA507 PM508 HT509 GP590 BL590 MF590 BO591 GY592 EC593 ' +
  'GF594 PY595 MQ596 SR597 UY598 CW599 BQ599 TL670 NF672 BN673 NR674 PG675 TO676 SB677 VU678 FJ679 PW680 ' +
  'WF681 CK682 NU683 WS685 KI686 NC687 TV688 PF689 TK690 FM691 MH692 KP850 HK852 MO853 KH855 LA856 BD880 ' +
  'TW886 MV960 LB961 JO962 SY963 IQ964 KW965 SA966 YE967 OM968 PS970 AE971 IL972 BH973 QA974 BT975 MN976 ' +
  'NP977 TJ992 TM993 AZ994 GE995 KG996 UZ998 ' +
  // +1 kodunu paylaşan Karayip ve Pasifik ülkeleri
  'AG1 AI1 AS1 BB1 BM1 BS1 DM1 DO1 GD1 GU1 JM1 KN1 KY1 LC1 MP1 MS1 PR1 SX1 TC1 TT1 VC1 VG1 VI1';

/** [{ iso, code }] — tüm ülkeler */
export const COUNTRIES = RAW.trim().split(/\s+/).map((s) => ({ iso: s.slice(0, 2), code: s.slice(2) }));

const CODE_OF = new Map(COUNTRIES.map((c) => [c.iso, c.code]));
const MAIN_ISO = new Map();
for (const c of COUNTRIES) if (!MAIN_ISO.has(c.code)) MAIN_ISO.set(c.code, c.iso);

/**
 * Yerel yazım kuralları. trunk: ülke içinde numaranın başına eklenen önek (TR'de 0).
 * groups: yerel numaranın hane grupları; 0 "kalan haneler" demek.
 * Burada olmayan ülkelerde önek eklenmez ve haneler uzunluğa göre gruplanır.
 */
const RULES = {
  TR: { trunk: '0', groups: [3, 3, 2, 2] },
  AZ: { trunk: '0', groups: [2, 3, 2, 2] },
  DE: { trunk: '0', groups: [3, 0] },
  AT: { trunk: '0', groups: [3, 0] },
  CH: { trunk: '0', groups: [2, 3, 2, 2] },
  NL: { trunk: '0', groups: [1, 0] },
  BE: { trunk: '0', groups: [3, 2, 2, 2] },
  FR: { trunk: '0', groups: [1, 2, 2, 2, 2] },
  GB: { trunk: '0', groups: [4, 0] },
  IE: { trunk: '0', groups: [2, 3, 0] },
  SE: { trunk: '0', groups: [2, 3, 2, 2] },
  FI: { trunk: '0', groups: [2, 3, 0] },
  ES: { groups: [3, 3, 3] },
  PT: { groups: [3, 3, 3] },
  IT: { groups: [3, 3, 0] },
  GR: { groups: [3, 3, 4] },
  PL: { groups: [3, 3, 3] },
  CZ: { groups: [3, 3, 3] },
  DK: { groups: [2, 2, 2, 2] },
  NO: { groups: [3, 2, 3] },
  RU: { trunk: '8', sep: ' ', groups: [3, 3, 2, 2] },
  KZ: { trunk: '8', sep: ' ', groups: [3, 3, 2, 2] },
  BY: { trunk: '8', sep: ' ', groups: [2, 3, 2, 2] },
  UA: { trunk: '0', groups: [2, 3, 2, 2] },
  GE: { trunk: '0', groups: [3, 2, 2, 2] },
  AM: { trunk: '0', groups: [2, 3, 0] },
  RO: { trunk: '0', groups: [3, 3, 3] },
  BG: { trunk: '0', groups: [2, 3, 0] },
  RS: { trunk: '0', groups: [2, 3, 0] },
  HR: { trunk: '0', groups: [2, 3, 0] },
  BA: { trunk: '0', groups: [2, 3, 0] },
  MK: { trunk: '0', groups: [2, 3, 0] },
  AL: { trunk: '0', groups: [2, 3, 0] },
  XK: { trunk: '0', groups: [2, 3, 0] },
  CY: { groups: [2, 6] },
  IL: { trunk: '0', groups: [2, 3, 4] },
  SA: { trunk: '0', groups: [2, 3, 4] },
  AE: { trunk: '0', groups: [2, 3, 4] },
  QA: { groups: [4, 4] },
  KW: { groups: [4, 4] },
  EG: { trunk: '0', groups: [2, 4, 4] },
  IR: { trunk: '0', groups: [3, 3, 4] },
  IQ: { trunk: '0', groups: [3, 3, 4] },
  SY: { trunk: '0', groups: [3, 3, 3] },
  LB: { trunk: '0', groups: [2, 3, 3] },
  JO: { trunk: '0', groups: [1, 4, 4] },
  MA: { trunk: '0', groups: [3, 2, 2, 2] },
  DZ: { trunk: '0', groups: [3, 2, 2, 2] },
  NG: { trunk: '0', groups: [3, 3, 4] },
  KE: { trunk: '0', groups: [3, 3, 3] },
  ZA: { trunk: '0', groups: [2, 3, 4] },
  IN: { trunk: '0', groups: [5, 5] },
  PK: { trunk: '0', groups: [3, 0] },
  BD: { trunk: '0', groups: [4, 0] },
  AF: { trunk: '0', groups: [2, 3, 4] },
  ID: { trunk: '0', groups: [3, 4, 0] },
  MY: { trunk: '0', groups: [2, 3, 0] },
  TH: { trunk: '0', groups: [2, 3, 4] },
  VN: { trunk: '0', groups: [2, 3, 0] },
  PH: { trunk: '0', groups: [3, 3, 4] },
  CN: { groups: [3, 4, 4] },
  JP: { trunk: '0', groups: [2, 4, 4] },
  KR: { trunk: '0', groups: [2, 4, 4] },
  TW: { trunk: '0', groups: [3, 3, 3] },
  AU: { trunk: '0', groups: [3, 3, 3] },
  NZ: { trunk: '0', groups: [2, 3, 0] },
  MX: { groups: [2, 4, 4] },
  BR: { groups: [2, 5, 4] },
  US: { nanp: true },
  CA: { nanp: true },
};

// Kuralı olmayan ülke, aynı kodu paylaştığı ana ülkenin kuralını kullanır (ör. Guernsey → Birleşik Krallık).
const ruleFor = (iso) => RULES[iso] || RULES[MAIN_ISO.get(CODE_OF.get(iso))] || {};

/** "905321234567" → { code: '90', national: '5321234567', iso: 'TR' } ya da null */
export function splitNumber(digits) {
  const d = String(digits ?? '').replace(/\D/g, '');
  for (let n = 1; n <= 3; n++) {
    const code = d.slice(0, n);
    if (MAIN_ISO.has(code) && d.length > n + 3) return { code, national: d.slice(n), iso: MAIN_ISO.get(code) };
  }
  return null;
}

/** Ülkenin telefon kodu: 'TR' → '90' */
export const codeOf = (iso) => CODE_OF.get(iso) || '';

function genericGroups(len) {
  if (len <= 4) return [len];
  if (len <= 7) return [3, 0];
  if (len === 8) return [4, 4];
  if (len === 9) return [3, 3, 3];
  if (len === 10) return [3, 3, 4];
  if (len === 11) return [3, 4, 4];
  return [4, 4, 0];
}

function group(national, groups) {
  const fixed = groups.filter((g) => g > 0).reduce((a, b) => a + b, 0);
  const open = groups.includes(0);
  // Kural bu uzunluğa uymuyorsa genel gruplamaya dön.
  if ((open && national.length <= fixed) || (!open && national.length !== fixed)) {
    groups = genericGroups(national.length);
  }
  const out = [];
  let i = 0;
  for (const g of groups) {
    if (i >= national.length) break;
    const part = g === 0 ? national.slice(i) : national.slice(i, i + g);
    out.push(part);
    i += part.length;
  }
  if (i < national.length) out.push(national.slice(i));
  return out.join(' ');
}

function nationalGrouped(iso, national) {
  const r = ruleFor(iso);
  if (r.nanp && national.length === 10) return `${national.slice(0, 3)} ${national.slice(3, 6)} ${national.slice(6)}`;
  return group(national, r.groups || genericGroups(national.length));
}

function localFormat(iso, national) {
  const r = ruleFor(iso);
  if (r.nanp && national.length === 10) return `(${national.slice(0, 3)}) ${national.slice(3, 6)}-${national.slice(6)}`;
  const body = nationalGrouped(iso, national);
  return r.trunk ? r.trunk + (r.sep || '') + body : body;
}

/**
 * Numara biçimleri:
 *  e164   +905321234567
 *  intl   +90 532 123 45 67
 *  local  0532 123 45 67   (yalnızca seçilen ülkenin numaraları; diğerleri intl)
 *  idd    00905321234567
 *  digits 905321234567
 * Eski sürümle uyumluluk: 'tr' = local + TR.
 */
export function formatNumber(digits, style = 'e164', country = 'TR') {
  const d = String(digits ?? '').replace(/\D/g, '');
  if (style === 'tr') { style = 'local'; country = 'TR'; }
  if (style === 'digits') return d;
  if (style === 'idd') return '00' + d;
  if (style === 'e164') return '+' + d;

  const p = splitNumber(d);
  if (!p) return '+' + d;
  if (style === 'local' && codeOf(country) === p.code) return localFormat(country, p.national);
  return `+${p.code} ${nationalGrouped(p.iso, p.national)}`;
}

/** Aramada eşleşecek rakam dizileri: tam numara, yerel kısım, yerel önekle birlikte. */
export function searchKeys(digits) {
  const p = splitNumber(digits);
  if (!p) return [digits];
  const trunk = ruleFor(p.iso).trunk || '';
  return [digits, p.national, trunk + p.national];
}

/** Listedeki numaraların ülke dağılımı, çoktan aza: [{ iso, code, count }] */
export function countryStats(list) {
  const counts = new Map();
  for (const x of list) {
    const p = splitNumber(x.digits);
    if (p) counts.set(p.code, (counts.get(p.code) || 0) + 1);
  }
  return [...counts]
    .map(([code, count]) => ({ iso: MAIN_ISO.get(code), code, count }))
    .sort((a, b) => b.count - a.count || a.code.localeCompare(b.code));
}

/** Ülke adı (tarayıcının yerleşik sözlüğünden): 'DE' → 'Almanya' */
export function countryName(iso, locale = 'tr') {
  try {
    return new Intl.DisplayNames([locale], { type: 'region' }).of(iso) || iso;
  } catch {
    return iso;
  }
}
