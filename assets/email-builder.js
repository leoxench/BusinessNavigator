/*
 * Email builder (email-builder.html): блоки, drag & drop, undo/redo, інспектор, перегляд desktop/mobile,
 * експорт HTML / тексту / JSON. Шаблони зберігаються в localStorage браузера.
 * Рендер листа — assets/email-render.js (window.BNEmail).
 */
(function () {
  const app = document.querySelector('[data-email-builder]');
  if (!app || !window.BNEmail) return;
  const E = window.BNEmail;
  const esc = E.esc;

  const DRAFT_KEY = 'bn-email-draft-v1';
  const TEMPLATES_KEY = 'bn-email-templates-v1';
  const MIME_NEW = 'application/x-bn-new-block';
  const MIME_MOVE = 'application/x-bn-move-block';

  const PALETTE = [
    ['heading', 'H', 'H1–H3'],
    ['text', '¶', 'Абзаци, посилання'],
    ['button', '▭', 'Заклик до дії'],
    ['image', '▣', 'За URL'],
    ['columns', '‖', '2 колонки'],
    ['divider', '—', 'Лінія'],
    ['spacer', '↕', 'Порожнє місце'],
    ['footer', '▁', 'Дрібний текст'],
  ];

  const ALIGN = ['align', 'choice', 'Вирівнювання', [['left', 'Ліворуч'], ['center', 'Центр'], ['right', 'Праворуч']]];
  const PAD = ['padding', 'range', 'Відступ зверху/знизу', 0, 60, 'px'];
  const MD_HINT = '**жирний**, *курсив*, [текст](https://…); порожній рядок — новий абзац';

  /** Поля інспектора: [ключ, тип, підпис, ...параметри]. */
  const FIELDS = {
    heading: [['text', 'textarea', 'Текст'], ['level', 'choice', 'Рівень', [[1, 'H1'], [2, 'H2'], [3, 'H3']]], ALIGN, ['color', 'color', 'Колір'], PAD],
    text: [['text', 'textarea', 'Текст', MD_HINT, 'tall'], ALIGN, ['fontSize', 'range', 'Розмір шрифту', 12, 24, 'px'], ['color', 'color', 'Колір тексту'], PAD],
    button: [
      ['label', 'text', 'Напис'],
      ['url', 'text', 'Посилання', 'https://…'],
      ALIGN,
      ['bg', 'color', 'Фон'],
      ['color', 'color', 'Колір тексту'],
      ['radius', 'range', 'Заокруглення', 0, 30, 'px'],
      ['fullWidth', 'toggle', 'На всю ширину'],
      PAD,
    ],
    image: [
      ['src', 'text', 'URL зображення', 'https://…/image.jpg', 'Пошта не показує локальні файли — потрібне публічне посилання https://'],
      ['alt', 'text', 'Альтернативний текст'],
      ['href', 'text', 'Посилання при кліку', 'необов’язково'],
      ['width', 'range', 'Ширина', 10, 100, '%'],
      ALIGN,
      ['radius', 'range', 'Заокруглення', 0, 40, 'px'],
      PAD,
    ],
    columns: [
      ['left', 'textarea', 'Ліва колонка', MD_HINT],
      ['right', 'textarea', 'Права колонка', 'На телефоні колонки стануть одна під одною'],
      ['fontSize', 'range', 'Розмір шрифту', 12, 22, 'px'],
      ['color', 'color', 'Колір тексту'],
      PAD,
    ],
    divider: [['color', 'color', 'Колір'], ['thickness', 'range', 'Товщина', 1, 6, 'px'], PAD],
    spacer: [['height', 'range', 'Висота', 4, 120, 'px']],
    footer: [['text', 'textarea', 'Текст'], ALIGN, ['color', 'color', 'Колір'], PAD],
  };

  const SETTINGS_FIELDS = [
    ['subject', 'text', 'Тема листа', 'Про що цей лист?'],
    ['preheader', 'text', 'Текст-прев’ю', '', 'Показується в списку листів поруч із темою'],
    ['fontFamily', 'select', 'Шрифт', E.FONTS.map((f) => [f.value, f.label])],
    ['bodyBg', 'color', 'Фон навколо листа'],
    ['contentBg', 'color', 'Фон листа'],
    ['brandColor', 'color', 'Колір посилань'],
    ['width', 'range', 'Ширина листа', 480, 720, 'px', 10],
    ['gutter', 'range', 'Бічні поля', 0, 48, 'px'],
    ['radius', 'range', 'Заокруглення', 0, 32, 'px'],
  ];

  // ---------- Стан ----------

  const storage = {
    get(key, fallback) {
      try {
        const v = JSON.parse(localStorage.getItem(key));
        return v ?? fallback;
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch {
        return false;
      }
    },
  };

  const draft = storage.get(DRAFT_KEY, null);
  const state = {
    design: (draft && E.cleanDesign(draft.design)) || E.STARTERS[1].build(),
    name: (draft && draft.name) || 'Новий лист',
    templateId: (draft && draft.templateId) || null,
    selectedId: null,
    view: 'edit',
    device: 'desktop',
    side: 'blocks',
    past: [],
    future: [],
    dirty: false,
    dropAt: null,
  };
  let lastChange = { key: '', at: 0 };

  const $ = (sel) => app.querySelector(sel);
  const els = {
    name: $('[data-eb-name]'),
    status: $('[data-eb-status]'),
    undo: $('[data-eb-undo]'),
    redo: $('[data-eb-redo]'),
    views: app.querySelectorAll('[data-eb-view]'),
    side: $('[data-eb-side]'),
    sideTabs: app.querySelectorAll('[data-eb-sidetab]'),
    stage: $('[data-eb-stage]'),
    inspector: $('[data-eb-inspector]'),
    exportMenu: $('[data-eb-export-menu]'),
    importFile: $('[data-eb-import-file]'),
    toast: $('[data-eb-toast]'),
  };

  const selected = () => state.design.blocks.find((b) => b.id === state.selectedId) || null;

  /** Зміна дизайну з історією. key — для злиття послідовних змін одного поля в один крок. */
  function commit(mutate, key) {
    const now = Date.now();
    const merge = key && lastChange.key === key && now - lastChange.at < 800;
    lastChange = { key: key || '', at: now };
    if (!merge) {
      state.past.push(JSON.stringify(state.design));
      if (state.past.length > 80) state.past.shift();
    }
    state.future = [];
    mutate(state.design);
    state.dirty = true;
    persist();
    renderStage();
    renderChrome();
  }

  function undo() {
    if (!state.past.length) return;
    state.future.unshift(JSON.stringify(state.design));
    state.design = JSON.parse(state.past.pop());
    afterHistory();
  }
  function redo() {
    if (!state.future.length) return;
    state.past.push(JSON.stringify(state.design));
    state.design = JSON.parse(state.future.shift());
    afterHistory();
  }
  function afterHistory() {
    lastChange = { key: '', at: 0 };
    if (!selected()) state.selectedId = null;
    state.dirty = true;
    persist();
    renderAll();
  }

  function persist() {
    storage.set(DRAFT_KEY, { design: state.design, name: state.name, templateId: state.templateId });
  }

  let toastTimer;
  function toast(msg, isError) {
    els.toast.textContent = msg;
    els.toast.dataset.state = isError ? 'error' : 'ok';
    els.toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (els.toast.hidden = true), 2600);
  }

  // ---------- Операції з блоками ----------

  function insertBlock(type, index) {
    const block = E.newBlock(type, state.design.settings);
    commit((d) => {
      const sel = d.blocks.findIndex((b) => b.id === state.selectedId);
      const at = index ?? (sel >= 0 ? sel + 1 : d.blocks.length);
      d.blocks.splice(at, 0, block);
    });
    select(block.id);
  }

  function moveBlock(id, to) {
    commit((d) => {
      const from = d.blocks.findIndex((b) => b.id === id);
      if (from < 0) return;
      const [b] = d.blocks.splice(from, 1);
      d.blocks.splice(to > from ? to - 1 : to, 0, b);
    });
  }

  function duplicateBlock(id) {
    const copyId = E.uid();
    commit((d) => {
      const i = d.blocks.findIndex((b) => b.id === id);
      d.blocks.splice(i + 1, 0, Object.assign({}, d.blocks[i], { id: copyId }));
    });
    select(copyId);
  }

  function removeBlock(id) {
    commit((d) => {
      d.blocks = d.blocks.filter((b) => b.id !== id);
    });
    select(null);
  }

  function select(id) {
    state.selectedId = id;
    renderStage();
    renderInspector();
  }

  // ---------- Шаблони (localStorage) ----------

  const templates = () => storage.get(TEMPLATES_KEY, []).filter((t) => t && t.id && t.design);

  function openDesign(design, name, templateId) {
    state.design = E.cleanDesign(design) || E.STARTERS[0].build();
    state.name = name;
    state.templateId = templateId;
    state.past = [];
    state.future = [];
    state.selectedId = null;
    state.view = 'edit';
    state.dirty = false;
    persist();
    renderAll();
  }

  const confirmDiscard = () => !state.dirty || window.confirm('Незбережені зміни буде втрачено. Продовжити?');

  function save(asNew) {
    const list = templates();
    const now = new Date().toISOString();
    const name = state.name.trim() || 'Без назви';
    let t = !asNew && state.templateId && list.find((x) => x.id === state.templateId);
    if (t) Object.assign(t, { name, design: state.design, updatedAt: now });
    else {
      t = { id: E.uid(), name, design: state.design, createdAt: now, updatedAt: now };
      list.unshift(t);
    }
    if (!storage.set(TEMPLATES_KEY, list)) return toast('Не вдалося зберегти: сховище браузера недоступне або переповнене', true);
    state.templateId = t.id;
    state.name = name;
    state.dirty = false;
    persist();
    renderChrome();
    renderSide();
    toast('Шаблон збережено в цьому браузері');
  }

  function deleteTemplate(id) {
    const t = templates().find((x) => x.id === id);
    if (!t || !window.confirm(`Видалити шаблон «${t.name}»?`)) return;
    storage.set(TEMPLATES_KEY, templates().filter((x) => x.id !== id));
    if (state.templateId === id) state.templateId = null;
    persist();
    renderChrome();
    renderSide();
    toast('Шаблон видалено');
  }

  // ---------- Експорт / імпорт ----------

  const slug = () => (state.name.trim() || 'email').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').toLowerCase() || 'email';

  function download(text, filename, type) {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function copy(text, msg) {
    try {
      await navigator.clipboard.writeText(text);
      toast(msg);
    } catch {
      toast('Не вдалося скопіювати — браузер заборонив доступ до буфера обміну', true);
    }
  }

  const EXPORTS = {
    'copy-html': () => copy(E.renderEmail(state.design), 'HTML листа скопійовано'),
    'download-html': () => download(E.renderEmail(state.design), `${slug()}.html`, 'text/html;charset=utf-8'),
    'copy-text': () => copy(E.renderPlainText(state.design), 'Текстову версію скопійовано'),
    'download-json': () => download(JSON.stringify({ name: state.name, design: state.design }, null, 2), `${slug()}.bn-email.json`, 'application/json'),
    'import-json': () => els.importFile.click(),
  };

  els.importFile.addEventListener('change', async () => {
    const file = els.importFile.files[0];
    els.importFile.value = '';
    if (!file || !confirmDiscard()) return;
    try {
      const data = JSON.parse(await file.text());
      const design = E.cleanDesign(data.design || data);
      if (!design) throw new Error();
      openDesign(design, String(data.name || file.name.replace(/\..*$/, '')).slice(0, 120), null);
      state.dirty = true;
      renderChrome();
      toast('Шаблон імпортовано');
    } catch {
      toast('Файл не схожий на шаблон Email builder', true);
    }
  });

  // ---------- Рендер інтерфейсу ----------

  function renderChrome() {
    if (document.activeElement !== els.name) els.name.value = state.name;
    els.status.textContent = state.templateId ? (state.dirty ? 'є незбережені зміни' : 'збережено в браузері') : 'чернетка';
    els.undo.disabled = !state.past.length;
    els.redo.disabled = !state.future.length;
    els.views.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.ebView === state.view)));
    app.querySelector('[data-eb-save-new]').hidden = !state.templateId;
  }

  function renderSide() {
    els.sideTabs.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.ebSidetab === state.side)));
    if (state.side === 'blocks') {
      els.side.innerHTML =
        `<div class="eb-palette">${PALETTE.map(
          ([type, glyph, hint]) =>
            `<button type="button" class="eb-tile" draggable="true" data-eb-add="${type}" title="${E.LABELS[type]}: клацніть або перетягніть на лист"><span class="eb-glyph">${glyph}</span><b>${E.LABELS[type]}</b><small>${hint}</small></button>`,
        ).join('')}</div>` +
        `<p class="eb-note">Перетягніть блок на лист або клацніть — він додасться після вибраного. Плейсхолдери на кшталт <code>{{ім’я}}</code> підставить ваш сервіс розсилки.</p>`;
      return;
    }
    const list = templates();
    els.side.innerHTML =
      `<p class="eb-label">Почати з шаблону</p><div class="eb-list">${E.STARTERS.map(
        (s) => `<button type="button" class="eb-item" data-eb-starter="${s.key}"><b>${esc(s.name)}</b><small>${esc(s.description)}</small></button>`,
      ).join('')}</div>` +
      `<p class="eb-label" style="margin-top:22px">Мої шаблони</p>` +
      (list.length
        ? `<div class="eb-list">${list
            .map(
              (t) =>
                `<div class="eb-item eb-saved${t.id === state.templateId ? ' is-active' : ''}"><button type="button" data-eb-open="${esc(t.id)}"><b>${esc(t.name)}</b><small>${new Date(t.updatedAt).toLocaleString('uk-UA')}</small></button><button type="button" class="eb-del" data-eb-delete="${esc(t.id)}" title="Видалити" aria-label="Видалити шаблон">✕</button></div>`,
            )
            .join('')}</div>`
        : '<p class="eb-note">Збережених шаблонів ще немає. Вони зберігаються в цьому браузері; для перенесення використайте «Експорт → JSON».</p>');
  }

  function renderStage() {
    const d = state.design;
    const s = d.settings;
    if (state.view === 'preview') {
      els.stage.innerHTML = `<div class="eb-preview">
        <div class="eb-preview-head">
          <div><b>${s.subject ? esc(s.subject) : '<span class="eb-muted">(без теми)</span>'}</b><small>${esc(s.preheader || 'Текст-прев’ю не задано')}</small></div>
          <div class="eb-seg"><button type="button" data-eb-device="desktop" aria-pressed="${state.device === 'desktop'}">Десктоп</button><button type="button" data-eb-device="mobile" aria-pressed="${state.device === 'mobile'}">Мобільний</button></div>
        </div>
        <div class="eb-preview-body"><iframe title="Попередній перегляд листа" sandbox="allow-popups allow-popups-to-escape-sandbox" class="eb-frame${state.device === 'mobile' ? ' is-mobile' : ''}"></iframe></div>
      </div>`;
      els.stage.querySelector('iframe').srcdoc = E.renderEmail(d);
      return;
    }

    const edge = Math.min(s.gutter, 24);
    const blocks = d.blocks
      .map((b, i) => {
        const active = b.id === state.selectedId;
        return `<div class="eb-block${active ? ' is-active' : ''}${b.type === 'spacer' ? ' is-spacer' : ''}" draggable="true" data-eb-block="${b.id}" data-index="${i}">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tbody>${E.renderBlock(b, s)}</tbody></table>
          <div class="eb-tools">
            <span class="eb-grip" title="Перетягніть, щоб перемістити">⠿</span><span class="eb-tname">${E.LABELS[b.type]}</span>
            <button type="button" data-eb-act="up" title="Вгору" ${i === 0 ? 'disabled' : ''}>↑</button>
            <button type="button" data-eb-act="down" title="Вниз" ${i === d.blocks.length - 1 ? 'disabled' : ''}>↓</button>
            <button type="button" data-eb-act="dup" title="Дублювати">⧉</button>
            <button type="button" data-eb-act="del" title="Видалити" class="eb-danger">✕</button>
          </div>
        </div>`;
      })
      .join('');

    els.stage.innerHTML = `<div class="eb-canvas" style="background:${s.bodyBg}">
      <div class="eb-sheet" style="max-width:${s.width}px;background:${s.contentBg};border-radius:${s.radius}px;padding:${edge}px 0">
        ${d.blocks.length ? blocks + '<div class="eb-tail" data-eb-tail></div>' : `<div class="eb-empty"><b>Лист порожній</b><span>Перетягніть сюди блок або клацніть на нього в панелі ліворуч</span></div>`}
      </div>
    </div>`;
  }

  function field(def, value, scope) {
    const [key, type, label, a, b, c, d] = def;
    const id = `eb-${scope}-${key}`;
    const attrs = `id="${id}" data-eb-field="${key}" data-eb-scope="${scope}"`;
    const wrap = (inner, hint) => `<div class="eb-field"><label for="${id}">${label}</label>${inner}${hint ? `<small>${hint}</small>` : ''}</div>`;
    switch (type) {
      case 'text':
        return wrap(`<input type="text" ${attrs} value="${esc(value ?? '')}" placeholder="${esc(a || '')}">`, b);
      case 'textarea':
        return wrap(`<textarea ${attrs} rows="${b === 'tall' ? 8 : 4}">${esc(value ?? '')}</textarea>`, a && a !== 'tall' ? a : '');
      case 'color':
        return wrap(`<div class="eb-color"><input type="color" ${attrs} value="${/^#[0-9a-f]{6}$/i.test(value) ? value : '#000000'}" aria-label="${label}"><input type="text" data-eb-hex="${key}" data-eb-scope="${scope}" value="${esc(value)}" maxlength="7" spellcheck="false"></div>`);
      case 'range':
        return `<div class="eb-field"><label for="${id}">${label}<output data-eb-out="${key}">${value}${c || ''}</output></label><input type="range" ${attrs} min="${a}" max="${b}" step="${d || 1}" value="${value}" data-suffix="${c || ''}"></div>`;
      case 'choice':
        return `<div class="eb-field"><span class="eb-flabel">${label}</span><div class="eb-seg eb-seg-full">${a
          .map(([v, l]) => `<button type="button" data-eb-choice="${key}" data-eb-scope="${scope}" data-value="${v}" aria-pressed="${String(v) === String(value)}">${l}</button>`)
          .join('')}</div></div>`;
      case 'select':
        return wrap(`<select ${attrs}>${a.map(([v, l]) => `<option value="${esc(v)}"${v === value ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select>`);
      case 'toggle':
        return `<label class="eb-toggle"><span>${label}</span><input type="checkbox" ${attrs}${value ? ' checked' : ''}></label>`;
    }
    return '';
  }

  function renderInspector() {
    const b = selected();
    if (b) {
      els.inspector.innerHTML = `<div class="eb-insp-head"><h3>${E.LABELS[b.type]}</h3><button type="button" class="eb-link" data-eb-deselect>Налаштування листа →</button></div>
        ${FIELDS[b.type].map((f) => field(f, b[f[0]], 'block')).join('')}
        <div class="eb-insp-actions"><button type="button" class="eb-btn" data-eb-insp-act="dup">Дублювати</button><button type="button" class="eb-btn eb-danger" data-eb-insp-act="del">Видалити</button></div>`;
    } else {
      els.inspector.innerHTML = `<div class="eb-insp-head"><h3>Налаштування листа</h3></div>${SETTINGS_FIELDS.map((f) => field(f, state.design.settings[f[0]], 'settings')).join('')}`;
    }
  }

  function renderAll() {
    renderChrome();
    renderSide();
    renderStage();
    renderInspector();
  }

  // ---------- Зміни з інспектора ----------

  function setValue(scope, key, value, mergeKey) {
    commit((d) => {
      if (scope === 'settings') d.settings[key] = value;
      else {
        const b = d.blocks.find((x) => x.id === state.selectedId);
        if (b) b[key] = value;
      }
    }, mergeKey ? `${scope}:${state.selectedId}:${key}` : '');
  }

  els.inspector.addEventListener('input', (e) => {
    const t = e.target;
    if (t.dataset.ebHex) {
      if (/^#[0-9a-f]{6}$/i.test(t.value)) {
        const picker = els.inspector.querySelector(`[data-eb-field="${t.dataset.ebHex}"]`);
        if (picker) picker.value = t.value;
        setValue(t.dataset.ebScope, t.dataset.ebHex, t.value, true);
      }
      return;
    }
    const key = t.dataset.ebField;
    if (!key || t.type === 'checkbox' || t.tagName === 'SELECT') return;
    let value = t.value;
    if (t.type === 'range') {
      value = Number(value);
      const out = els.inspector.querySelector(`[data-eb-out="${key}"]`);
      if (out) out.textContent = value + (t.dataset.suffix || '');
    }
    if (t.type === 'color') {
      const hex = els.inspector.querySelector(`[data-eb-hex="${key}"]`);
      if (hex) hex.value = value;
    }
    setValue(t.dataset.ebScope, key, value, true);
  });

  els.inspector.addEventListener('change', (e) => {
    const t = e.target;
    if (t.type === 'checkbox') setValue(t.dataset.ebScope, t.dataset.ebField, t.checked);
    else if (t.tagName === 'SELECT') setValue(t.dataset.ebScope, t.dataset.ebField, t.value);
  });

  els.inspector.addEventListener('click', (e) => {
    const choice = e.target.closest('[data-eb-choice]');
    if (choice) {
      const raw = choice.dataset.value;
      setValue(choice.dataset.ebScope, choice.dataset.ebChoice, /^\d+$/.test(raw) ? Number(raw) : raw);
      choice.parentElement.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b === choice)));
      return;
    }
    if (e.target.closest('[data-eb-deselect]')) return select(null);
    const act = e.target.closest('[data-eb-insp-act]');
    if (act && state.selectedId) act.dataset.ebInspAct === 'dup' ? duplicateBlock(state.selectedId) : removeBlock(state.selectedId);
  });

  // ---------- Полотно ----------

  els.stage.addEventListener('click', (e) => {
    const device = e.target.closest('[data-eb-device]');
    if (device) {
      state.device = device.dataset.ebDevice;
      return renderStage();
    }
    const block = e.target.closest('[data-eb-block]');
    const act = e.target.closest('[data-eb-act]');
    if (block) e.preventDefault(); // не переходимо за посиланнями всередині листа
    if (act && block) {
      const id = block.dataset.ebBlock;
      const i = Number(block.dataset.index);
      return { up: () => moveBlock(id, i - 1), down: () => moveBlock(id, i + 2), dup: () => duplicateBlock(id), del: () => removeBlock(id) }[act.dataset.ebAct]();
    }
    if (block) select(block.dataset.ebBlock);
    else if (e.target.closest('.eb-canvas')) select(null);
  });

  const isOurDrag = (e) => e.dataTransfer && (e.dataTransfer.types.includes(MIME_NEW) || e.dataTransfer.types.includes(MIME_MOVE));
  /** Індикатор місця вставки — лише класами, без перерендеру (інакше браузер може обірвати перетягування). */
  function setDrop(at) {
    if (state.dropAt === at) return;
    state.dropAt = at;
    els.stage.querySelectorAll('.eb-drop-before, .eb-drop-after').forEach((n) => n.classList.remove('eb-drop-before', 'eb-drop-after'));
    const blocks = els.stage.querySelectorAll('[data-eb-block]');
    const empty = els.stage.querySelector('.eb-empty');
    if (empty) empty.classList.toggle('is-over', at !== null);
    if (at === null || !blocks.length) return;
    if (at < blocks.length) blocks[at].classList.add('eb-drop-before');
    else blocks[blocks.length - 1].classList.add('eb-drop-after');
  }

  els.stage.addEventListener('dragstart', (e) => {
    const block = e.target.closest('[data-eb-block]');
    if (!block) return;
    e.dataTransfer.setData(MIME_MOVE, block.dataset.ebBlock);
    e.dataTransfer.effectAllowed = 'move';
  });
  els.stage.addEventListener('dragover', (e) => {
    if (!isOurDrag(e)) return;
    e.preventDefault();
    const block = e.target.closest('[data-eb-block]');
    if (block) {
      const r = block.getBoundingClientRect();
      const i = Number(block.dataset.index);
      setDrop(e.clientY < r.top + r.height / 2 ? i : i + 1);
    } else if (e.target.closest('[data-eb-tail]') || !state.design.blocks.length) setDrop(state.design.blocks.length);
  });
  els.stage.addEventListener('dragleave', (e) => {
    if (!els.stage.contains(e.relatedTarget)) setDrop(null);
  });
  els.stage.addEventListener('drop', (e) => {
    if (!isOurDrag(e)) return;
    e.preventDefault();
    const at = state.dropAt ?? state.design.blocks.length;
    const type = e.dataTransfer.getData(MIME_NEW);
    const moveId = e.dataTransfer.getData(MIME_MOVE);
    setDrop(null);
    if (type && FIELDS[type]) insertBlock(type, at);
    else if (moveId) moveBlock(moveId, at);
    else renderStage();
  });
  document.addEventListener('dragend', () => state.dropAt !== null && setDrop(null));

  // ---------- Ліва панель ----------

  els.side.addEventListener('dragstart', (e) => {
    const tile = e.target.closest('[data-eb-add]');
    if (!tile) return;
    e.dataTransfer.setData(MIME_NEW, tile.dataset.ebAdd);
    e.dataTransfer.effectAllowed = 'copy';
  });
  els.side.addEventListener('click', (e) => {
    const add = e.target.closest('[data-eb-add]');
    if (add) return insertBlock(add.dataset.ebAdd);
    const starter = e.target.closest('[data-eb-starter]');
    if (starter && confirmDiscard()) {
      const s = E.STARTERS.find((x) => x.key === starter.dataset.ebStarter);
      return openDesign(s.build(), s.name, null);
    }
    const open = e.target.closest('[data-eb-open]');
    if (open && confirmDiscard()) {
      const t = templates().find((x) => x.id === open.dataset.ebOpen);
      if (t) {
        openDesign(t.design, t.name, t.id);
        toast(`Відкрито «${t.name}»`);
      }
      return;
    }
    const del = e.target.closest('[data-eb-delete]');
    if (del) deleteTemplate(del.dataset.ebDelete);
  });
  els.sideTabs.forEach((b) =>
    b.addEventListener('click', () => {
      state.side = b.dataset.ebSidetab;
      renderSide();
    }),
  );

  // ---------- Верхня панель ----------

  els.name.addEventListener('input', () => {
    state.name = els.name.value;
    state.dirty = true;
    persist();
    renderChrome();
  });
  els.undo.addEventListener('click', undo);
  els.redo.addEventListener('click', redo);
  els.views.forEach((b) =>
    b.addEventListener('click', () => {
      state.view = b.dataset.ebView;
      state.dropAt = null;
      renderChrome();
      renderStage();
    }),
  );
  app.querySelector('[data-eb-save]').addEventListener('click', () => save(false));
  app.querySelector('[data-eb-save-new]').addEventListener('click', () => save(true));
  app.querySelector('[data-eb-export]').addEventListener('click', () => (els.exportMenu.hidden = !els.exportMenu.hidden));
  els.exportMenu.addEventListener('click', (e) => {
    const item = e.target.closest('[data-eb-exp]');
    if (!item) return;
    els.exportMenu.hidden = true;
    EXPORTS[item.dataset.ebExp]();
  });
  document.addEventListener('mousedown', (e) => {
    if (!els.exportMenu.hidden && !e.target.closest('[data-eb-export-wrap]')) els.exportMenu.hidden = true;
  });

  // Гарячі клавіші: Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y; Delete — видалити вибраний блок.
  document.addEventListener('keydown', (e) => {
    const typing = e.target.closest && e.target.closest('input, textarea, select, [contenteditable]');
    if (typing) return;
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      e.shiftKey ? redo() : undo();
    } else if (mod && e.key.toLowerCase() === 'y') {
      e.preventDefault();
      redo();
    } else if ((e.key === 'Delete' || e.key === 'Backspace') && state.selectedId) {
      e.preventDefault();
      removeBlock(state.selectedId);
    } else if (e.key === 'Escape' && state.selectedId) select(null);
  });

  window.addEventListener('beforeunload', (e) => {
    if (state.dirty && state.templateId) e.preventDefault();
  });

  renderAll();
})();
