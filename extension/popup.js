import { extractContacts, buildList, formatNumber, toCSV, toVCF } from './lib.js';

const WA_URL = 'https://web.whatsapp.com/';
const $ = (id) => document.getElementById(id);

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

const openWhatsApp = { label: "WhatsApp Web'i aç", run: () => chrome.tabs.create({ url: WA_URL }) };

// ---------- Okuma ----------
async function load() {
  show('state-loading');
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab || !tab.url || !tab.url.startsWith(WA_URL)) {
    return message(
      "Önce WhatsApp Web'i aç",
      "Bu sekme WhatsApp Web değil. web.whatsapp.com'u açıp sohbetlerin yüklenmesini bekle, sonra eklenti simgesine tekrar tıkla.",
      openWhatsApp,
    );
  }

  let result;
  try {
    const [inj] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: extractContacts });
    result = inj && inj.result;
  } catch (e) {
    return message('Sekmeye erişilemedi', 'Sayfayı yenileyip tekrar dene.', null, String(e && e.message || e));
  }

  if (!result || !result.ok) {
    const code = result && result.code;
    if (code === 'NO_DB') {
      return message(
        'Giriş yapılmamış görünüyor',
        'WhatsApp Web’de oturum açık değil ya da henüz yüklenmedi. QR kodla giriş yapıp sohbetler göründükten sonra tekrar dene.',
      );
    }
    return message(
      'Kişi verisi bulunamadı',
      'WhatsApp Web yapısını değiştirmiş olabilir. Aşağıdaki teknik ayrıntıyı geliştiriciye iletirsen düzeltilebilir.',
      null,
      JSON.stringify(result || {}, null, 1),
    );
  }

  raw = result.contacts;
  rebuild();
  if (!list.length && !$('opt-unsaved').checked) {
    return message(
      'Kayıtlı kişi bulunamadı',
      `${result.total} kayıt okundu ama hiçbirinde rehber ismi yok. Rehberde kayıtlı olmayan numaraları da almak ister misin?`,
      { label: 'Kayıtsızları da göster', run: () => { $('opt-unsaved').checked = true; rebuild(); show('state-result'); } },
      'Alanlar: ' + (result.sampleKeys || []).join(', '),
    );
  }
  show('state-result');
}

// ---------- Liste ----------
function rebuild() {
  list = buildList(raw, { includeUnsaved: $('opt-unsaved').checked });
  render();
}

function visible() {
  const q = $('search').value.trim().toLocaleLowerCase('tr');
  if (!q) return list;
  const qDigits = q.replace(/\D/g, '');
  return list.filter((x) =>
    x.name.toLocaleLowerCase('tr').includes(q) ||
    (qDigits.length >= 3 && (x.digits.includes(qDigits) || ('0' + x.digits.slice(2)).includes(qDigits))),
  );
}

function selected() {
  return list.filter((x) => !deselected.has(x.digits));
}

function render() {
  const style = $('opt-format').value;
  const items = visible();
  const ul = $('list');
  ul.replaceChildren();

  if (!items.length) {
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = 'Eşleşen kişi yok';
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
    name.textContent = x.name || '(isimsiz)'; // textContent: isimlerdeki HTML asla çalıştırılmaz
    const num = document.createElement('span');
    num.className = 'num';
    num.textContent = formatNumber(x.digits, style);
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
$('search').addEventListener('input', render);
$('opt-format').addEventListener('change', render);
$('opt-unsaved').addEventListener('change', rebuild);
$('select-all').addEventListener('change', (e) => {
  for (const x of visible()) e.target.checked ? deselected.delete(x.digits) : deselected.add(x.digits);
  render();
});
$('dl-csv').addEventListener('click', () => {
  const excel = $('opt-excel').checked;
  download(toCSV(selected(), { excel, style: $('opt-format').value }), 'csv', 'text/csv;charset=utf-8');
});
$('dl-vcf').addEventListener('click', () => {
  download(toVCF(selected()), 'vcf', 'text/vcard;charset=utf-8');
});

load().catch((e) => message('Beklenmeyen hata', 'Sayfayı yenileyip tekrar dene.', null, String(e && e.stack || e)));
