import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildList, cleanName, formatNumber, toCSV, toVCF } from '../extension/lib.js';

const sample = [
  { name: 'Ahmet Kılıç', pushname: '', digits: '905321234567' },
  { name: '', pushname: 'Ahmet profil', digits: '905321234567' }, // aynı numara, kayıtsız kopya
  { name: '', pushname: 'Zeynep', digits: '4915112345678' },
  { name: 'Çağla Öz', pushname: '', digits: '905551112233' },
];

test('buildList: varsayılan olarak yalnızca rehberde kayıtlı kişiler', () => {
  const list = buildList(sample);
  assert.deepEqual(list.map((x) => x.name), ['Ahmet Kılıç', 'Çağla Öz']);
});

test('buildList: aynı numarada kayıtlı isim kayıtsız profil adına tercih edilir', () => {
  const list = buildList(sample, { includeUnsaved: true });
  assert.equal(list.length, 3);
  assert.equal(list.find((x) => x.digits === '905321234567').name, 'Ahmet Kılıç');
  assert.equal(list.at(-1).saved, false); // kayıtsızlar sonda
});

test('cleanName: satır sonu, kontrol ve yön değiştirme karakterleri temizlenir', () => {
  assert.equal(cleanName('Ali\r\nVeli'), 'Ali Veli');
  assert.equal(cleanName('‮gnp.exe'), 'gnp.exe');
  assert.equal(cleanName('  \n '), '');
});

test('formatNumber: Türk numarası yerel biçime, diğerleri uluslararası', () => {
  assert.equal(formatNumber('905321234567', 'tr'), '0532 123 45 67');
  assert.equal(formatNumber('4915112345678', 'tr'), '+4915112345678');
  assert.equal(formatNumber('905321234567'), '+905321234567');
});

test('toCSV: Excel modunda ; ayırıcı, BOM ve metin olarak korunan numara', () => {
  const csv = toCSV(buildList(sample), { excel: true, style: 'tr' });
  assert.ok(csv.startsWith('﻿Ad;Telefon\r\n'));
  assert.ok(csv.includes('Ahmet Kılıç;"=""0532 123 45 67"""'));
});

test('toCSV: formül gibi başlayan isimler her iki modda da etkisizleştirilir', () => {
  const evil = buildList([{ name: '', pushname: '=HYPERLINK("http://x","a")', digits: '905000000001' }], { includeUnsaved: true });
  for (const excel of [true, false]) {
    const row = toCSV(evil, { excel }).split('\r\n')[1];
    assert.match(row, /^"'=HYPERLINK/, `excel=${excel}`);
  }
});

test('toVCF: profil adı yeni bir vCard kaydı enjekte edemez', () => {
  const evil = buildList(
    [{ name: '', pushname: 'Ali\rEND:VCARD\rBEGIN:VCARD\rFN:Sahte', digits: '905000000002' }],
    { includeUnsaved: true },
  );
  const vcf = toVCF(evil);
  assert.equal(vcf.match(/^BEGIN:VCARD$/gm).length, 1);
  assert.ok(!/\r(?!\n)/.test(vcf), 'tek başına \\r kalmamalı');
});

test('toVCF: özel karakterler kaçırılır, numara uluslararası biçimde', () => {
  const vcf = toVCF([{ name: 'Ayşe; Fatma, Hanım', digits: '905321234567', saved: true }]);
  assert.ok(vcf.includes('FN:Ayşe\\; Fatma\\, Hanım\r\n'));
  assert.ok(vcf.includes('TEL;TYPE=CELL:+905321234567\r\n'));
});
