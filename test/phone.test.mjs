import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COUNTRIES, countryName, countryStats, formatNumber, searchKeys, splitNumber } from '../extension/phone.js';
import { toCSV } from '../extension/lib.js';

test('ülke kodları önek çakışması içermez (ayrıştırma kesin olmalı)', () => {
  const codes = [...new Set(COUNTRIES.map((c) => c.code))];
  for (const a of codes) for (const b of codes) {
    if (a !== b) assert.ok(!b.startsWith(a), `${a} ile ${b} çakışıyor`);
  }
  assert.ok(COUNTRIES.length >= 240);
});

test('splitNumber: 1, 2 ve 3 haneli ülke kodları', () => {
  assert.deepEqual(splitNumber('905321234567'), { code: '90', national: '5321234567', iso: 'TR' });
  assert.deepEqual(splitNumber('12025550123'), { code: '1', national: '2025550123', iso: 'US' });
  assert.deepEqual(splitNumber('994501234567'), { code: '994', national: '501234567', iso: 'AZ' });
  assert.deepEqual(splitNumber('4915123456789'), { code: '49', national: '15123456789', iso: 'DE' });
  assert.equal(splitNumber('999'), null);
});

test('tüm biçimler: Türk numarası', () => {
  const d = '905321234567';
  assert.equal(formatNumber(d, 'e164'), '+905321234567');
  assert.equal(formatNumber(d, 'intl'), '+90 532 123 45 67');
  assert.equal(formatNumber(d, 'local', 'TR'), '0532 123 45 67');
  assert.equal(formatNumber(d, 'idd'), '00905321234567');
  assert.equal(formatNumber(d, 'digits'), '905321234567');
});

test('eski "tr" ayarı yerel Türkiye biçimine karşılık gelir', () => {
  assert.equal(formatNumber('905321234567', 'tr'), '0532 123 45 67');
});

test('yerel biçim: farklı ülkeler', () => {
  const cases = [
    ['4915123456789', 'DE', '0151 23456789'],
    ['447700900123', 'GB', '07700 900123'],
    ['33612345678', 'FR', '06 12 34 56 78'],
    ['31612345678', 'NL', '06 12345678'],
    ['994501234567', 'AZ', '050 123 45 67'],
    ['79123456789', 'RU', '8 912 345 67 89'],
    ['12025550123', 'US', '(202) 555-0123'],
    ['12025550123', 'CA', '(202) 555-0123'],
    ['34612345678', 'ES', '612 345 678'],
    ['966501234567', 'SA', '050 123 4567'],
    ['8613800138000', 'CN', '138 0013 8000'],
  ];
  for (const [d, iso, want] of cases) assert.equal(formatNumber(d, 'local', iso), want, iso);
});

test('kodu paylaşan ülke ana ülkenin kuralını kullanır', () => {
  assert.equal(formatNumber('447781123456', 'local', 'GG'), '07781 123456');
  assert.equal(formatNumber('18765551234', 'local', 'JM'), '(876) 555-1234');
});

test('yerel biçimde seçili ülke dışındaki numaralar uluslararası boşluklu kalır', () => {
  assert.equal(formatNumber('4915123456789', 'local', 'TR'), '+49 151 23456789');
  assert.equal(formatNumber('905321234567', 'local', 'DE'), '+90 532 123 45 67');
});

test('kuralı olmayan ülke ve beklenmedik uzunluk genel gruplamaya düşer', () => {
  assert.equal(formatNumber('59899123456', 'intl'), '+598 9912 3456'); // Uruguay: kural yok, 8 hane → 4-4
  assert.equal(formatNumber('9053212345', 'local', 'TR'), '05321 2345'); // 8 haneli bozuk TR numarası: kural uymaz, 4-4
});

test('searchKeys: tam, yerel ve önekli yerel numara', () => {
  assert.deepEqual(searchKeys('905321234567'), ['905321234567', '5321234567', '05321234567']);
  assert.deepEqual(searchKeys('4915123456789'), ['4915123456789', '15123456789', '015123456789']);
});

test('countryStats: rehberdeki ülkeler çoktan aza', () => {
  const list = ['905321234567', '905551112233', '4915123456789', '12025550123', '905000000000'].map((digits) => ({ digits }));
  assert.deepEqual(countryStats(list).map((s) => [s.iso, s.count]), [['TR', 3], ['US', 1], ['DE', 1]]);
});

test('countryName: tarayıcı sözlüğünden Türkçe ad', () => {
  assert.equal(countryName('DE'), 'Almanya');
  assert.equal(countryName('TR'), 'Türkiye');
});

test('toCSV seçilen ülkeyi kullanır', () => {
  const csv = toCSV([{ name: 'Hans', digits: '4915123456789' }], { style: 'local', country: 'DE' });
  assert.ok(csv.includes('Hans,0151 23456789'));
});
