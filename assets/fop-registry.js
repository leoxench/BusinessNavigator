/*
 * Каталог справжніх ФОП з Єдиного державного реєстру (відкриті дані Мін'юсту, CC BY).
 * Дані — статичні JSON у data/fops/, їх генерує scripts/build-fop-data.mjs.
 * Запис: [id, "ПІБ", "YYYY-MM-DD", flags]; flags: 1 — облік у ДПС, 2 — платник ЄСВ.
 */
(function () {
  const root = document.querySelector('[data-fop-registry]');
  if (!root) return;

  const BASE = root.getAttribute('data-src') || 'data/fops/';
  const PAGE = 24;
  const $ = (sel) => root.querySelector(sel);
  const els = {
    total: $('[data-fr-total]'),
    tax: $('[data-fr-tax]'),
    period: $('[data-fr-period]'),
    date: $('[data-fr-date]'),
    search: $('[data-fr-search]'),
    month: $('[data-fr-month]'),
    sort: $('[data-fr-sort]'),
    taxOnly: $('[data-fr-taxonly]'),
    letters: $('[data-fr-letters]'),
    summary: $('[data-fr-summary]'),
    grid: $('[data-fr-grid]'),
    more: $('[data-fr-more]'),
  };

  // sorted — чи base вже впорядкований за ПІБ (шарди та їх склейка в порядку meta.shards)
  const state = { meta: null, base: [], baseLabel: '', sorted: false, letter: null, shown: PAGE, query: '' };
  const cache = new Map();
  const collator = new Intl.Collator('uk-UA');
  const lower = (s) => s.toLocaleLowerCase('uk-UA');
  const fmtNum = (n) => n.toLocaleString('uk-UA');
  const fmtDate = (iso) => (iso ? iso.split('-').reverse().join('.') : '—');
  const MONTHS = ['січень', 'лютий', 'березень', 'квітень', 'травень', 'червень', 'липень', 'серпень', 'вересень', 'жовтень', 'листопад', 'грудень'];
  const fmtMonth = (ym) => `${MONTHS[Number(ym.slice(5, 7)) - 1]} ${ym.slice(0, 4)}`;
  const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  async function getJson(name) {
    if (!cache.has(name)) {
      cache.set(
        name,
        fetch(BASE + name).then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        }),
      );
    }
    return cache.get(name);
  }

  function shardFor(letter) {
    return state.meta.shards.find((s) => s.letter === letter);
  }

  /** Увесь реєстр: склейка всіх шардів (вони йдуть в алфавітному порядку, тож результат відсортований за ПІБ). */
  let allPromise = null;
  function getAll(onProgress) {
    if (!allPromise) {
      let done = 0;
      const files = state.meta.shards.map((s) => s.file);
      allPromise = Promise.all(
        files.map((f) =>
          getJson(f).then((rows) => {
            onProgress(++done, files.length);
            return rows;
          }),
        ),
      )
        .then((parts) => parts.flat())
        .catch((err) => {
          allPromise = null; // дати змогу повторити спробу
          throw err;
        });
    }
    return allPromise;
  }

  // ---------- Рендер ----------

  function initials(name) {
    return name
      .split(' ')
      .slice(0, 2)
      .map((p) => p[0] || '')
      .join('');
  }

  function highlight(name, words) {
    let html = esc(name);
    for (const w of words) {
      if (!w) continue;
      const i = lower(html).indexOf(lower(esc(w)));
      if (i >= 0) html = `${html.slice(0, i)}<mark class="fr-hl">${html.slice(i, i + esc(w).length)}</mark>${html.slice(i + esc(w).length)}`;
    }
    return html;
  }

  function card([id, name, date, flags], words) {
    return `<article class="fr-card">
      <div class="logo-box" aria-hidden="true">${esc(initials(name))}</div>
      <div>
        <h3>${highlight(name, words)}</h3>
        <p>ФОП · зареєстровано ${fmtDate(date)}</p>
        <div class="tags">
          <span class="tag fr-tag-ok">Зареєстровано</span>
          ${flags & 1 ? '<span class="tag">ДПС</span>' : ''}
          ${flags & 2 ? '<span class="tag">ЄСВ</span>' : ''}
          <span class="tag fr-id" title="Ідентифікатор запису в ЄДР">ID ${id}</span>
        </div>
      </div>
    </article>`;
  }

  // Кеш останнього результату, щоб «Показати ще» не фільтрував і не сортував увесь реєстр заново
  let memo = { key: null, value: null };

  function filtered() {
    const words = lower(state.query).split(/\s+/).filter(Boolean);
    const month = els.month.value;
    const taxOnly = els.taxOnly.checked;
    const key = [state.base, state.query, month, taxOnly, els.sort.value];
    if (memo.key && key.every((v, i) => v === memo.key[i])) return memo.value;
    let rows = state.base.filter(
      (r) =>
        (!month || r[2].startsWith(month)) &&
        (!taxOnly || r[3] & 1) &&
        words.every((w) => lower(r[1]).includes(w)),
    );
    if (els.sort.value === 'newest') rows = [...rows].sort((a, b) => (a[2] === b[2] ? b[0] - a[0] : a[2] < b[2] ? 1 : -1));
    else if (els.sort.value === 'oldest') rows = [...rows].sort((a, b) => (a[2] === b[2] ? a[0] - b[0] : a[2] > b[2] ? 1 : -1));
    // 'name' — шарди вже відсортовані за ПІБ; для «найновіших» сортуємо явно
    else if (!state.sorted) rows = [...rows].sort((a, b) => collator.compare(a[1], b[1]));
    memo = { key, value: { rows, words } };
    return memo.value;
  }

  function render() {
    const { rows, words } = filtered();
    const visible = rows.slice(0, state.shown);
    els.grid.innerHTML = visible.length
      ? visible.map((r) => card(r, words)).join('')
      : `<div class="fr-empty" style="grid-column:1/-1">${
          state.query ? 'За цим запитом нікого не знайдено. Спробуйте ввести прізвище повністю або іншу частину ПІБ.' : 'За цими фільтрами нікого не знайдено.'
        }</div>`;
    els.summary.innerHTML = `<span>${esc(state.baseLabel)} · знайдено <b>${fmtNum(rows.length)}</b></span>${
      state.query || state.letter || els.month.value || els.taxOnly.checked ? '<button type="button" class="fr-reset" data-fr-reset>Скинути фільтри</button>' : ''
    }`;
    els.more.hidden = rows.length <= state.shown;
  }

  function setLoading(text) {
    els.grid.innerHTML = `<div class="fr-loading" style="grid-column:1/-1">${esc(text)}</div>`;
    els.more.hidden = true;
  }

  function pressLetter(letter) {
    els.letters.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.letter === letter)));
  }

  // ---------- Джерела даних ----------

  // Кожне перемикання джерела даних (найновіші / весь реєстр / літера / пошук) отримує свій номер.
  // Після кожного await перевіряємо, що номер досі актуальний, інакше пізня відповідь
  // попереднього запиту перезапише вже показаний результат.
  let loadSeq = 0;
  const isStale = (seq) => seq !== loadSeq;

  /** recent.json — лише 240 найновіших; будь-який фільтр чи інше сортування потребує всього реєстру. */
  function needsAll() {
    return Boolean(els.month.value) || els.taxOnly.checked || els.sort.value !== 'newest';
  }

  async function loadDefault(seq) {
    if (needsAll()) {
      if (!allPromise) setLoading('Завантаження реєстру…');
      const rows = await getAll((done, total) => {
        if (!isStale(seq)) setLoading(`Завантаження реєстру… ${done} з ${total}`);
      });
      if (isStale(seq)) return false;
      state.base = rows;
      state.sorted = true;
      state.baseLabel = 'Увесь реєстр';
    } else {
      const rows = await getJson('recent.json');
      if (isStale(seq)) return false;
      state.base = rows;
      state.sorted = false;
      state.baseLabel = 'Найновіші реєстрації';
    }
    return true;
  }

  async function showRecent() {
    const seq = ++loadSeq;
    state.letter = null;
    state.query = '';
    pressLetter(null);
    state.shown = PAGE;
    if (await loadDefault(seq)) render();
  }

  async function showLetter(letter) {
    const shard = shardFor(letter);
    if (!shard) return;
    const seq = ++loadSeq;
    state.letter = letter;
    state.query = '';
    els.search.value = '';
    pressLetter(letter);
    setLoading(`Завантаження ФОП на літеру «${letter}»…`);
    const rows = await getJson(shard.file);
    if (isStale(seq)) return;
    state.base = rows;
    state.sorted = true;
    state.baseLabel = `Прізвища на «${letter}»`;
    state.shown = PAGE;
    if (els.sort.value === 'newest') els.sort.value = 'name';
    render();
  }

  async function search(query) {
    const q = query.trim();
    if (!q) return state.letter ? showLetter(state.letter) : showRecent();
    const seq = ++loadSeq;
    state.query = q;
    state.shown = PAGE;

    // Шукаємо в шардах за першими літерами слів запиту: «Олена Коваленко» знайде і «Коваленко Олена…»
    const letters = [...new Set(q.split(/\s+/).map((w) => w[0].toLocaleUpperCase('uk-UA')))].slice(0, 3);
    const files = letters.map(shardFor).filter(Boolean).map((s) => s.file);
    if (!files.length) {
      state.base = [];
      state.baseLabel = `Пошук «${q}»`;
      return render();
    }
    if (files.some((f) => !cache.has(f))) setLoading('Шукаємо в реєстрі…');
    const parts = await Promise.all(files.map(getJson));
    if (isStale(seq)) return; // користувач уже ввів інший запит або вибрав літеру
    const seen = new Set();
    state.base = parts.flat().filter((r) => (seen.has(r[0]) ? false : seen.add(r[0])));
    state.sorted = true;
    state.letter = null;
    pressLetter(null);
    state.baseLabel = `Пошук «${q}»`;
    render();
  }

  /** Зміна фільтра чи сортування: на стартовому виді може знадобитися перейти на весь реєстр. */
  async function applyFilters() {
    state.shown = PAGE;
    if (state.letter || state.query) return render();
    const seq = ++loadSeq;
    if (await loadDefault(seq)) render();
  }

  // ---------- Події ----------

  let timer;
  els.search.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => search(els.search.value).catch(fail), 250);
  });
  [els.month, els.sort, els.taxOnly].forEach((el) => el.addEventListener('change', () => applyFilters().catch(fail)));
  els.letters.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-letter]');
    if (!btn) return;
    if (btn.dataset.letter === state.letter) showRecent().catch(fail);
    else showLetter(btn.dataset.letter).catch(fail);
  });
  els.more.addEventListener('click', () => {
    state.shown += PAGE * 2;
    render();
  });
  root.addEventListener('click', (e) => {
    if (!e.target.closest('[data-fr-reset]')) return;
    els.search.value = '';
    els.month.value = '';
    els.taxOnly.checked = false;
    els.sort.value = 'newest';
    showRecent().catch(fail);
  });

  function fail(err) {
    console.error('FOP registry:', err);
    els.grid.innerHTML = `<div class="fr-empty" style="grid-column:1/-1">Не вдалося завантажити дані реєстру. ${
      location.protocol === 'file:' ? 'Відкрийте сайт через локальний сервер: <b>node scripts/serve.mjs</b>.' : 'Оновіть сторінку.'
    }</div>`;
  }

  // ---------- Старт ----------

  getJson('meta.json')
    .then((meta) => {
      state.meta = meta;
      els.total.textContent = fmtNum(meta.total);
      els.tax.textContent = fmtNum(meta.taxPayers);
      els.period.textContent = `з ${fmtDate(meta.since)}`;
      els.date.textContent = fmtDate(meta.sourceDate);
      els.month.insertAdjacentHTML(
        'beforeend',
        meta.months.map((m) => `<option value="${m.month}">${fmtMonth(m.month)} (${fmtNum(m.count)})</option>`).join(''),
      );
      els.letters.innerHTML = meta.shards
        .filter((s) => /\p{L}/u.test(s.letter))
        .map((s) => `<button type="button" data-letter="${esc(s.letter)}" aria-pressed="false" title="${fmtNum(s.count)} ФОП">${esc(s.letter)}</button>`)
        .join('');
      return showRecent();
    })
    .catch(fail);
})();
