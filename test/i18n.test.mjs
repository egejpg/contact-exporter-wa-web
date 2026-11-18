import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { toCSV } from '../extension/lib.js';
import { countryName } from '../extension/phone.js';

const read = (p) => readFileSync(new URL('../extension/' + p, import.meta.url), 'utf8');
const en = JSON.parse(read('_locales/en/messages.json'));
const tr = JSON.parse(read('_locales/tr/messages.json'));
const manifest = JSON.parse(read('manifest.json'));

test('iki dil dosyası aynı anahtarlara ve yer tutuculara sahip', () => {
  assert.deepEqual(Object.keys(tr).sort(), Object.keys(en).sort());
  for (const k of Object.keys(en)) {
    assert.deepEqual(Object.keys(tr[k].placeholders || {}), Object.keys(en[k].placeholders || {}), k);
  }
});

test('popup.html ve popup.js içindeki her anahtarın çevirisi var', () => {
  const html = read('popup.html');
  const js = read('popup.js');
  const keys = new Set([
    ...[...html.matchAll(/data-i18n(?:-placeholder)?="([^"]+)"/g)].map((m) => m[1]),
    ...[...js.matchAll(/\bt\('([A-Za-z]+)'/g)].map((m) => m[1]),
    ...[...js.matchAll(/'(fmt[A-Z][a-z0-9]+)'/gi)].map((m) => m[1]),
  ]);
  assert.ok(keys.size > 30, 'anahtarlar bulunamadı');
  for (const k of keys) {
    assert.ok(en[k], `en: ${k} eksik`);
    assert.ok(tr[k], `tr: ${k} eksik`);
  }
});

test('manifest dil dosyalarına bağlı, ad ve açıklama mağaza sınırlarında', () => {
  assert.equal(manifest.default_locale, 'en');
  for (const field of ['name', 'description']) {
    const key = manifest[field].match(/^__MSG_(\w+)__$/)[1];
    for (const m of [en, tr]) assert.ok(m[key], key);
  }
  for (const m of [en, tr]) {
    assert.ok(m.extName.message.length <= 75, 'ad 75 karakteri geçmemeli');
    assert.ok(m.extDescription.message.length <= 132, 'açıklama 132 karakteri geçmemeli');
  }
});

test('toCSV: İngilizce başlık ve virgül ayırıcıyla Excel modu', () => {
  const csv = toCSV([{ name: 'John', digits: '12025550123' }], { excel: true, sep: ',', headers: ['Name', 'Phone'] });
  assert.ok(csv.startsWith('\uFEFFName,Phone\r\n'));
  assert.ok(csv.includes('John,"=""+12025550123"""'));
});

test('ülke adları arayüz diline göre', () => {
  assert.equal(countryName('DE', 'en'), 'Germany');
  assert.equal(countryName('DE', 'tr'), 'Almanya');
});
