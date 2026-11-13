/*
 * Пошук за словом і прості фільтри для каталогів (компанії, кандидати, вакансії, стартапи).
 *
 * Розмітка: контейнер з атрибутом data-catalog, картки всередині мають
 *   data-type, data-city, data-sphere, data-format  (значення фільтрів)
 *   data-keywords                                    (додаткові слова для пошуку)
 * Фільтр показується лише тоді, коли в картках є щонайменше два різні значення.
 * Стан пошуку синхронізується з URL (?q=дизайнер&city=Київ), тож посиланням можна поділитися.
 */
(function (root) {
  'use strict';

  const FACETS = [
    { key: 'type', label: 'Тип', all: 'Усі типи' },
    { key: 'city', label: 'Місто', all: 'Усі міста' },
    { key: 'sphere', label: 'Сфера', all: 'Усі сфери' },
    { key: 'format', label: 'Формат роботи', all: 'Будь-який формат' },
  ];

  // Слова, які люди вводять українською, а в картках стоїть англійська назва ролі, і навпаки.
  const SYNONYMS = [
    ['дизайнер', 'дизайн', 'designer', 'design', 'figma', 'ux', 'ui'],
    ['бухгалтер', 'бухгалтерія', 'облік', 'accountant', 'accounting', 'фінанси'],
    ['інвестор', 'інвестиції', 'інвестувати', 'investor', 'investment', 'venture', 'vc'],
    ['розробник', 'програміст', 'developer', 'engineer', 'software', 'backend', 'frontend', 'full stack'],
    ['менеджер', 'manager', 'management', 'pm'],
    ['продажі', 'sales', 'business development', 'b2b'],
    ['рекрутер', 'recruiter', 'hiring', 'hr'],
    ['аналітик', 'analyst', 'data', 'аналітика'],
    ['тестувальник', 'qa', 'тестування', 'testing'],
    ['маркетинг', 'маркетолог', 'marketing'],
    ['засновник', 'founder', 'стартап', 'startup'],
    ['віддалено', 'remote', 'дистанційно'],
    ['гібрид', 'hybrid'],
    ['офіс', 'office', 'onsite'],
  ];

  const MIN_FACET_VALUES = 2;

  /** Нижній регістр, єдиний апостроф, без зайвих пробілів. */
  function normalize(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/[’ʼ`']/g, "'")
      .replace(/ё/g, 'е')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /** Варіанти слова: саме слово плюс синоніми з групи, де воно (або його початок) зустрічається. */
  function expandToken(token) {
    const variants = new Set([token]);
    SYNONYMS.forEach((group) => {
      if (group.some((word) => word === token || (token.length >= 4 && word.startsWith(token)))) {
        group.forEach((word) => variants.add(word));
      }
    });
    return Array.from(variants);
  }

  const SHORT_WORD = 3;
  const LETTER = "a-z0-9а-щьюяґєії'";

  /** Короткі синоніми (ui, hr, vc) шукаємо як окреме слово, щоб «ui» не знаходило «build». */
  function containsVariant(text, variant, isOwnToken) {
    if (isOwnToken || variant.length > SHORT_WORD) return text.includes(variant);
    return new RegExp(`(^|[^${LETTER}])${variant}($|[^${LETTER}])`).test(text);
  }

  /** Кожне слово запиту має знайтися в тексті картки (саме або через синонім). */
  function matchesQuery(haystack, query) {
    const tokens = normalize(query).split(' ').filter(Boolean);
    if (!tokens.length) return true;
    const text = normalize(haystack);
    return tokens.every((token) => expandToken(token).some((variant) => containsVariant(text, variant, variant === token)));
  }

  /** Значення фільтрів картки збігаються з вибраними (порожнє значення = без обмеження). */
  function matchesFacets(itemFacets, selected) {
    return Object.keys(selected).every((key) => !selected[key] || itemFacets[key] === selected[key]);
  }

  /** Унікальні значення фільтра в порядку алфавіту (українська локаль). */
  function facetValues(items, key) {
    const values = new Set(items.map((item) => item.facets[key]).filter(Boolean));
    return Array.from(values).sort((a, b) => a.localeCompare(b, 'uk'));
  }

  function filterItems(items, state) {
    return items.map((item) => matchesQuery(item.text, state.q) && matchesFacets(item.facets, state.facets));
  }

  // ---------- DOM ----------

  function readItem(card) {
    const facets = {};
    FACETS.forEach(({ key }) => {
      facets[key] = (card.dataset[key] || '').trim();
    });
    const text = [card.textContent, card.dataset.keywords, ...Object.values(facets)].join(' ');
    return { card, facets, text };
  }

  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([name, value]) => {
      if (name === 'text') node.textContent = value;
      else node.setAttribute(name, value);
    });
    (children || []).forEach((child) => node.appendChild(child));
    return node;
  }

  function readUrlState() {
    try {
      const params = new URLSearchParams(root.location.search);
      const facets = {};
      FACETS.forEach(({ key }) => {
        facets[key] = params.get(key) || '';
      });
      return { q: params.get('q') || '', facets };
    } catch (error) {
      return { q: '', facets: {} };
    }
  }

  function writeUrlState(state) {
    try {
      const params = new URLSearchParams(root.location.search);
      params.delete('q');
      FACETS.forEach(({ key }) => params.delete(key));
      if (state.q.trim()) params.set('q', state.q.trim());
      Object.entries(state.facets).forEach(([key, value]) => value && params.set(key, value));
      const query = params.toString();
      root.history.replaceState(null, '', `${root.location.pathname}${query ? `?${query}` : ''}${root.location.hash}`);
    } catch (error) {
      // Без History API (наприклад, у file://) фільтри працюють, просто без збереження в URL.
    }
  }

  function buildSelect(facet, values, current) {
    const select = el('select', { 'data-facet': facet.key }, [
      el('option', { value: '', text: facet.all }),
      ...values.map((value) => el('option', { value, text: value })),
    ]);
    select.value = values.includes(current) ? current : '';
    return el('label', {}, [document.createTextNode(facet.label), select]);
  }

  function initCatalog(container, index) {
    const items = Array.from(container.children).map(readItem);
    if (!items.length) return;

    const urlState = readUrlState();
    const activeFacets = FACETS.filter(({ key }) => facetValues(items, key).length >= MIN_FACET_VALUES);
    const searchId = `catalog-search-${index}`;
    const placeholder = container.dataset.catalogPlaceholder || 'Наприклад: дизайнер, бухгалтер, інвестор';

    const input = el('input', { type: 'search', id: searchId, placeholder, autocomplete: 'off', enterkeyhint: 'search' });
    input.value = urlState.q;
    const selects = activeFacets.map((facet) => buildSelect(facet, facetValues(items, facet.key), urlState.facets[facet.key]));
    const count = el('p', { class: 'catalog-count', 'aria-live': 'polite' });
    const reset = el('button', { type: 'button', class: 'catalog-reset', text: 'Скинути' });
    const toolbar = el('form', { class: 'catalog-toolbar', role: 'search' }, [
      el('label', { class: 'catalog-search', for: searchId }, [document.createTextNode('Пошук'), input]),
      ...selects,
      reset,
    ]);
    const empty = el('div', { class: 'catalog-empty', hidden: '' }, [
      el('h3', { text: 'Нічого не знайдено' }),
      el('p', { text: 'Спробуйте інше слово або приберіть частину фільтрів.' }),
    ]);

    container.parentNode.insertBefore(toolbar, container);
    container.parentNode.insertBefore(count, container);
    container.parentNode.insertBefore(empty, container.nextSibling);

    function currentState() {
      const facets = {};
      toolbar.querySelectorAll('select[data-facet]').forEach((select) => {
        facets[select.dataset.facet] = select.value;
      });
      return { q: input.value, facets };
    }

    function apply() {
      const state = currentState();
      const visible = filterItems(items, state);
      let shown = 0;
      items.forEach((item, i) => {
        item.card.hidden = !visible[i];
        if (visible[i]) shown += 1;
      });
      const isFiltered = Boolean(state.q.trim()) || Object.values(state.facets).some(Boolean);
      count.textContent = isFiltered ? `Знайдено: ${shown} з ${items.length}` : `Усього: ${items.length}`;
      empty.hidden = shown > 0;
      reset.disabled = !isFiltered;
      writeUrlState(state);
    }

    toolbar.addEventListener('input', apply);
    toolbar.addEventListener('change', apply);
    toolbar.addEventListener('submit', (event) => {
      event.preventDefault();
      apply();
    });
    reset.addEventListener('click', () => {
      input.value = '';
      toolbar.querySelectorAll('select').forEach((select) => {
        select.value = '';
      });
      apply();
      input.focus();
    });
    apply();
  }

  const api = { FACETS, normalize, expandToken, matchesQuery, matchesFacets, facetValues, filterItems };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
    return;
  }
  root.BNCatalogFilter = api;
  const start = () => document.querySelectorAll('[data-catalog]').forEach(initCatalog);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})(typeof window !== 'undefined' ? window : globalThis);
