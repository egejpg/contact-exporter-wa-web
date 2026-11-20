import { extractContacts, buildList, formatNumber, toCSV, toVCF } from './lib.js';
import { COUNTRIES, codeOf, countryName, countryStats, searchKeys, splitNumber } from './phone.js';

const WA_URL = 'https://web.whatsapp.com/';
// WhatsApp Web eşitleme yaparken veritabanına yazar; okuma o yazmalar bitene kadar sırada bekler.
const SLOW_MS = 3000;    // bu süreden sonra "meşgul görünüyor" açıklaması
const LIMIT_MS = 20000;  // bu süreden sonra sonsuz bekleme yerine "tekrar dene"
const TIMEOUT = Symbol('timeout');
const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(TIMEOUT), ms))]);
const $ = (id) => document.getElementById(id);

// ---------- Dil ----------
// Metinler _locales/<dil>/messages.json'dan gelir; Chrome tarayıcının diline göre seçer.
const t = (key, ...subs) => chrome.i18n.getMessage(key, subs.map(String)) || key;
// Eklentinin gerçekten gösterdiği dil (tarayıcı Almancaysa bile arayüz İngilizce olabilir).
const uiLang = t('langCode') === 'tr' ? 'tr' : 'en';

function translatePage() {
  document.documentElement.lang = uiLang;
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => { el.placeholder = t(el.dataset.i18nPlaceholder); });
}

// Excel'in liste ayırıcısı bölge ayarına bağlı: ondalık virgül kullanan yerlerde ';', diğerlerinde ','.
const excelSeparator = new Intl.NumberFormat(navigator.language || uiLang).format(1.5).includes(',') ? ';' : ',';

// Biçim tercihleri yalnızca bu tarayıcıda, eklentinin kendi deposunda tutulur.
const pref = {
  get(k, d) { try { return localStorage.getItem('ce.' + k) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem('ce.' + k, v); } catch { /* gizli pencere vb. */ } },
};
const fmt = () => ({ style: $('opt-format').value, country: $('opt-country').value || 'TR' });

let raw = [];               // sekmeden okunan ham kayıtlar
let list = [];              // tekilleştirilmiş, gösterilen liste
const deselected = new Set(); // kullanıcının işaretini kaldırdığı numaralar

// ---------- Ekran durumları ----------
function show(id) {
  for (const s of ['state-loading', 'state-message', 'state-result']) $(s).hidden = s !== id;
}

function message(title, body, action, details) {
  $('msg-title').textContent = title;
  $('msg-body').textContent = body;
  const btn = $('msg-action');
  btn.hidden = !action;
  if (action) {
    btn.textContent = action.label;
    btn.onclick = action.run;
  }
  $('msg-details').hidden = !details;
  $('msg-pre').textContent = details || '';
  show('state-message');
}

// ---------- Okuma ----------
async function load() {
  show('state-loading');
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab || !tab.url || !tab.url.startsWith(WA_URL)) {
    return message(t('errNotWaTitle'), t('errNotWaBody'),
      { label: t('openWhatsApp'), run: () => chrome.tabs.create({ url: WA_URL }) });
  }

  let result;
  $('loading-hint').hidden = true;
  const slow = setTimeout(() => { $('loading-hint').hidden = false; }, SLOW_MS);
  try {
    const run = chrome.scripting.executeScript({ target: { tabId: tab.id }, func: extractContacts });
    const [inj] = await withTimeout(run, LIMIT_MS);
    result = inj && inj.result;
  } catch (e) {
    if (e === TIMEOUT) return message(t('errSlowTitle'), t('errSlowBody'), { label: t('tryAgain'), run: start });
    return message(t('errTabTitle'), t('retry'), null, String(e && e.message || e));
  } finally {
    clearTimeout(slow);
  }

  if (!result || !result.ok) {
    if (result && result.code === 'NO_DB') return message(t('errLoginTitle'), t('errLoginBody'));
    return message(t('errNoDataTitle'), t('errNoDataBody'), null, JSON.stringify(result || {}, null, 1));
  }

  raw = result.contacts;
  rebuild();
  if (!list.length && !$('opt-unsaved').checked) {
    return message(
      t('errNoSavedTitle'),
      t('errNoSavedBody', result.total),
      { label: t('showUnsaved'), run: () => { $('opt-unsaved').checked = true; rebuild(); show('state-result'); } },
      t('fields') + ': ' + (result.sampleKeys || []).join(', '),
    );
  }
  show('state-result');
}

// ---------- Liste ----------
function rebuild() {
  list = buildList(raw, { includeUnsaved: $('opt-unsaved').checked });
  fillCountries();
  updateFormatUI();
  render();
}

// ---------- Numara biçimi ----------
function fillCountries() {
  const sel = $('opt-country');
  const current = sel.value || pref.get('country', '');
  const stats = countryStats(list);
  sel.replaceChildren();

  if (stats.length) {
    const g = document.createElement('optgroup');
    g.label = t('inYourContacts');
    for (const s of stats) {
      g.append(new Option(`${countryName(s.iso, uiLang)} (+${s.code}) · ${t('contactsCount', s.count)}`, s.iso));
    }
    sel.append(g);
  }
  const all = document.createElement('optgroup');
  all.label = t('allCountries');
  COUNTRIES
    .map((c) => ({ ...c, name: countryName(c.iso, uiLang) }))
    .sort((a, b) => a.name.localeCompare(b.name, uiLang))
    .forEach((c) => all.append(new Option(`${c.name} (+${c.code})`, c.iso)));
  sel.append(all);

  // Varsayılan: önceki seçim, yoksa rehberde en çok görülen ülke.
  sel.value = codeOf(current) ? current : (stats[0] ? stats[0].iso : 'TR');
}

/** Seçeneklerdeki örnekleri kullanıcının kendi numaralarından birine göre günceller. */
function updateFormatUI() {
  const { style, country } = fmt();
  const local = style === 'local';
  $('row-country').hidden = !local;
  $('country-note').hidden = !local;

  const code = codeOf(country);
  const own = list.find((x) => (splitNumber(x.digits) || {}).code === code);
  const sample = (own || list[0] || { digits: '905321234567' }).digits;
  const labels = { e164: 'fmtE164', intl: 'fmtIntl', local: 'fmtLocal', idd: 'fmtIdd', digits: 'fmtDigits' };
  for (const opt of $('opt-format').options) {
    const example = opt.value === 'local'
      ? (own ? formatNumber(own.digits, 'local', country) : t('pickCountry'))
      : formatNumber(sample, opt.value, country);
    opt.textContent = `${t(labels[opt.value])} (${example})`;
  }
}

function visible() {
  const q = $('search').value.trim();
  if (!q) return list;
  // Hem Türkçe (I→ı) hem genel küçük harf kuralıyla karşılaştır; iki dilde de doğru eşleşsin.
  const lower = (s) => [s.toLocaleLowerCase('tr'), s.toLowerCase()];
  const needles = lower(q);
  const qDigits = q.replace(/\D/g, '');
  return list.filter((x) => {
    const hay = lower(x.name);
    return hay.some((h) => needles.some((n) => h.includes(n))) ||
      (qDigits.length >= 3 && searchKeys(x.digits).some((k) => k.includes(qDigits)));
  });
}

function selected() {
  return list.filter((x) => !deselected.has(x.digits));
}

function render() {
  const { style, country } = fmt();
  const items = visible();
  const ul = $('list');
  ul.replaceChildren();

  if (!items.length) {
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = t('noMatch');
    ul.append(li);
  }

  const frag = document.createDocumentFragment();
  for (const x of items) {
    const li = document.createElement('li');
    const label = document.createElement('label');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = !deselected.has(x.digits);
    cb.addEventListener('change', () => {
      cb.checked ? deselected.delete(x.digits) : deselected.add(x.digits);
      updateCounts();
    });
    const name = document.createElement('span');
    name.className = 'name' + (x.saved ? '' : ' unsaved');
    name.textContent = x.name || t('noName'); // textContent: isimlerdeki HTML asla çalıştırılmaz
    const num = document.createElement('span');
    num.className = 'num';
    num.textContent = formatNumber(x.digits, style, country);
    label.append(cb, name, num);
    li.append(label);
    frag.append(li);
  }
  ul.append(frag);
  updateCounts();
}

function updateCounts() {
  const sel = selected().length;
  $('count-selected').textContent = sel;
  $('count-total').textContent = list.length;
  const vis = visible();
  const allVisSelected = vis.length > 0 && vis.every((x) => !deselected.has(x.digits));
  const someVisSelected = vis.some((x) => !deselected.has(x.digits));
  $('select-all').checked = allVisSelected;
  $('select-all').indeterminate = !allVisSelected && someVisSelected;
  $('dl-csv').disabled = $('dl-vcf').disabled = sel === 0;
}

// ---------- İndirme ----------
function download(text, ext, type) {
  const date = new Date().toISOString().slice(0, 10);
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `contacts-${date}.${ext}`;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

// ---------- Olaylar ----------
translatePage();
{
  const saved = pref.get('format', 'e164');
  const value = saved === 'tr' ? 'local' : saved; // 1.0.1 ve öncesi
  if ([...$('opt-format').options].some((o) => o.value === value)) $('opt-format').value = value;
}

$('search').addEventListener('input', render);
$('opt-format').addEventListener('change', () => {
  pref.set('format', $('opt-format').value);
  updateFormatUI();
  render();
});
$('opt-country').addEventListener('change', () => {
  pref.set('country', $('opt-country').value);
  updateFormatUI();
  render();
});
$('opt-unsaved').addEventListener('change', rebuild);
$('select-all').addEventListener('change', (e) => {
  for (const x of visible()) e.target.checked ? deselected.delete(x.digits) : deselected.add(x.digits);
  render();
});
$('dl-csv').addEventListener('click', () => {
  const excel = $('opt-excel').checked;
  const csv = toCSV(selected(), {
    excel,
    sep: excel ? excelSeparator : ',',
    headers: [t('csvName'), t('csvPhone')],
    ...fmt(),
  });
  download(csv, 'csv', 'text/csv;charset=utf-8');
});
$('dl-vcf').addEventListener('click', () => {
  download(toVCF(selected()), 'vcf', 'text/vcard;charset=utf-8');
});

function start() {
  load().catch((e) => message(t('errUnexpected'), t('retry'), null, String(e && e.stack || e)));
}
start();
