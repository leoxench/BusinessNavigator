#!/usr/bin/env node
/**
 * Генерує статичні дані для каталогу ФОП (fops.html) з відкритих даних ЄДР Мін'юсту.
 *
 * Джерело: https://data.gov.ua/dataset/03cc1239-3988-4451-aa0d-aadb77448714 (ліцензія CC BY)
 * Файл fop.zip ≈ 470 МБ, усередині FOP.xml ≈ 5,4 ГБ у windows-1251 (~7 млн записів).
 *
 * Використання (Node 20+, без залежностей):
 *   node scripts/build-fop-data.mjs --download                 # завантажити fop.zip у .cache/ і згенерувати дані
 *   node scripts/build-fop-data.mjs --file path/to/fop.zip     # з уже завантаженого архіву
 *   node scripts/build-fop-data.mjs --file FOP.xml --months 3  # з розпакованого XML, лише за 3 останні місяці
 *
 * Параметри:
 *   --months N   брати ФОП, зареєстрованих за останні N місяців до дати набору (за замовчуванням 6)
 *   --since D    або явна дата початку, YYYY-MM-DD (має пріоритет над --months)
 *   --out DIR    куди писати (за замовчуванням data/fops)
 *   --date D     дата набору для підпису «станом на» (за замовчуванням — дата зміни файлу)
 *
 * У каталог потрапляють лише ФОП у стані «зареєстровано». Результат:
 *   data/fops/meta.json         — дата набору, кількість, перелік шардів, розподіл за місяцями
 *   data/fops/recent.json       — 240 найновіших реєстрацій (перший екран каталогу)
 *   data/fops/s-XX.json         — шарди за першою літерою прізвища, відсортовані за ПІБ
 * Запис: [id, "ПІБ", "YYYY-MM-DD", flags], flags: 1 — на обліку в ДПС, 2 — платник ЄСВ.
 */
import { spawn, spawnSync } from 'node:child_process';
import { createReadStream, createWriteStream, existsSync, mkdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const DATASET = 'https://data.gov.ua/dataset/03cc1239-3988-4451-aa0d-aadb77448714';
const ZIP_URL = `${DATASET}/resource/c262938f-cce7-4489-a805-2fd7c5a44e0b/download/fop.zip`;

const args = process.argv.slice(2);
const arg = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};

const OUT = resolve(arg('out') ?? 'data/fops');
let file = arg('file') ?? '.cache/fop.zip';

if (args.includes('--download')) {
  file = resolve(arg('file') ?? '.cache/fop.zip');
  mkdirSync(dirname(file), { recursive: true });
  console.log(`Завантаження ${ZIP_URL} (~470 МБ)…`);
  const res = await fetch(ZIP_URL, { headers: { 'User-Agent': 'BusinessNavigator/1.0 (open data)' } });
  if (!res.ok || !res.body) throw new Error(`data.gov.ua відповів ${res.status}`);
  await pipeline(Readable.fromWeb(res.body), createWriteStream(file));
}
file = resolve(file);
if (!existsSync(file)) {
  console.error(`Файл ${file} не знайдено. Запустіть з --download або вкажіть --file.`);
  process.exit(1);
}

// ---------- Потік XML: .zip розпаковуємо системним unzip/tar (обидва вміють ZIP64), .xml читаємо напряму ----------

function openXml(path) {
  if (!/\.zip$/i.test(path)) return createReadStream(path);
  // unzip є в Git Bash / Linux / macOS; tar (bsdtar) — у Windows 10+ і macOS.
  const hasUnzip = spawnSync('unzip', ['-v'], { stdio: 'ignore' }).status === 0;
  const proc = hasUnzip
    ? spawn('unzip', ['-p', path], { stdio: ['ignore', 'pipe', 'inherit'] })
    : spawn('tar', ['-xOf', path], { stdio: ['ignore', 'pipe', 'inherit'] });
  proc.on('error', (e) => {
    console.error(`Не вдалося розпакувати архів (потрібен unzip або tar): ${e.message}`);
    process.exit(1);
  });
  return proc.stdout;
}

// ---------- Розбір ----------

const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
const unescape = (s) =>
  s.replace(/&(#x?[0-9a-f]+|\w+);/gi, (m, e) =>
    e[0] === '#' ? String.fromCodePoint(parseInt(e.slice(e[1] === 'x' ? 2 : 1), e[1] === 'x' ? 16 : 10)) : ENT[e] ?? m,
  );
const tag = (xml, name) => {
  const m = xml.match(new RegExp(`<${name}>([^<]*)</${name}>`));
  return m ? unescape(m[1]).trim() : '';
};

const TODAY = new Date().toISOString().slice(0, 10);
/** «18.07.2001» → «2001-07-18»; описки на кшталт 3003 року відкидаємо. */
function isoDate(s) {
  const m = s?.trim().match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!m) return null;
  const iso = `${m[3]}-${m[2]}-${m[1]}`;
  const ok = +m[2] >= 1 && +m[2] <= 12 && +m[1] >= 1 && +m[1] <= 31;
  return ok && iso >= '1990-01-01' && iso <= TODAY ? iso : null;
}

const lower = (s) => s.toLocaleLowerCase('uk-UA');
/** «ПОСОХОВА ОЛЕНА ВЛАДЛЕНІВНА» → «Посохова Олена Владленівна». */
const titleCase = (name) =>
  lower(name.replace(/\s+/g, ' ').trim()).replace(/(^|[\s\-'’ʼ(])(\p{L})/gu, (_, sep, ch) => sep + ch.toLocaleUpperCase('uk-UA'));

// ---------- Основний прохід ----------

// Дата набору: --date, інакше дата зміни файлу.
const sourceDate = arg('date') ?? statSync(file).mtime.toISOString().slice(0, 10);
let since = arg('since');
if (!since) {
  const months = Number(arg('months') ?? 6);
  const d = new Date(`${sourceDate}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() - months, 1); // з 1-го числа місяця
  since = d.toISOString().slice(0, 10);
}
console.log(`Відбір: зареєстровані ФОП з датою реєстрації від ${since}`);

const rows = [];
let scanned = 0;
const started = Date.now();
const decoder = new TextDecoder('windows-1251');
const stream = openXml(file);
let buf = '';

for await (const chunk of stream) {
  buf += decoder.decode(chunk, { stream: true });
  let end;
  while ((end = buf.indexOf('</SUBJECT>')) >= 0) {
    const xml = buf.slice(buf.indexOf('<SUBJECT>'), end);
    buf = buf.slice(end + 10);
    scanned++;
    if (scanned % 250000 === 0) process.stdout.write(`\r  переглянуто ${scanned.toLocaleString('uk-UA')}, відібрано ${rows.length.toLocaleString('uk-UA')}   `);

    if (tag(xml, 'STAN') !== 'зареєстровано') continue;
    const regDate = isoDate(tag(xml, 'REGISTRATION').split(';')[0]);
    if (!regDate || regDate < since) continue;
    const id = Number(tag(xml, 'RECORD'));
    const name = tag(xml, 'NAME');
    if (!id || !name) continue;

    let flags = 0;
    for (const m of xml.matchAll(/<EXCHANGE_ANSWER>([\s\S]*?)<\/EXCHANGE_ANSWER>/g)) {
      if (tag(m[1], 'END_DATE')) continue;
      const type = tag(m[1], 'TAX_PAYER_TYPE');
      if (type === 'Реєстр платників податків') flags |= 1;
      else if (type === 'Реєстр платників єдиного внеску') flags |= 2;
    }
    rows.push([id, titleCase(name), regDate, flags]);
  }
}
console.log(`\nПереглянуто ${scanned.toLocaleString('uk-UA')} записів, відібрано ${rows.length.toLocaleString('uk-UA')} за ${Math.round((Date.now() - started) / 1000)} с`);

// ---------- Запис ----------

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
const write = (name, data) => writeFileSync(resolve(OUT, name), JSON.stringify(data));

const collator = new Intl.Collator('uk-UA');
rows.sort((a, b) => collator.compare(a[1], b[1]));

const shards = {};
for (const r of rows) {
  const letter = r[1][0]?.toLocaleUpperCase('uk-UA') ?? '#';
  (shards[letter] ??= []).push(r);
}

const shardMeta = Object.keys(shards)
  .sort(collator.compare)
  .map((letter, i) => {
    const key = `s-${String(i + 1).padStart(2, '0')}`;
    write(`${key}.json`, shards[letter]);
    return { letter, file: `${key}.json`, count: shards[letter].length };
  });

const byDate = [...rows].sort((a, b) => (a[2] === b[2] ? b[0] - a[0] : a[2] < b[2] ? 1 : -1));
write('recent.json', byDate.slice(0, 240));

const months = {};
for (const r of rows) months[r[2].slice(0, 7)] = (months[r[2].slice(0, 7)] ?? 0) + 1;

write('meta.json', {
  source: DATASET,
  license: 'CC BY 4.0',
  sourceDate,
  generatedAt: new Date().toISOString(),
  since,
  total: rows.length,
  taxPayers: rows.filter((r) => r[3] & 1).length,
  months: Object.entries(months)
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([month, count]) => ({ month, count })),
  shards: shardMeta,
});

console.log(`Готово: ${OUT} (${shardMeta.length} шардів)`);
