// Тести логіки пошуку та фільтрів каталогу. Запуск: node --test scripts/catalog-filter.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { normalize, matchesQuery, matchesFacets, facetValues, filterItems } = require('../assets/catalog-filter.js');

const item = (text, facets = {}) => ({ text, facets: { type: '', city: '', sphere: '', format: '', ...facets } });

test('normalize lowercases, unifies apostrophes and collapses spaces', () => {
  assert.equal(normalize('  Ім’я   ТА  Прізвище '), "ім'я та прізвище");
});

test('empty query matches every card', () => {
  assert.equal(matchesQuery('Anna Koval Product Designer', '   '), true);
});

test('Ukrainian keyword finds card with English role title', () => {
  assert.equal(matchesQuery('Анна Коваль Product Designer · Toronto', 'дизайнер'), true);
  assert.equal(matchesQuery('Venture UA Investment · Europe', 'інвестор'), true);
  assert.equal(matchesQuery('Бухгалтер для ФОП · Львів', 'бухгалтер'), true);
});

test('partial word of at least four letters uses synonyms', () => {
  assert.equal(matchesQuery('Product Designer', 'дизай'), true);
});

test('all query words must match', () => {
  assert.equal(matchesQuery('Product Designer Toronto', 'дизайнер toronto'), true);
  assert.equal(matchesQuery('Product Designer Toronto', 'дизайнер berlin'), false);
});

test('short synonyms match whole words only', () => {
  // "дизайнер" expands to "ui", which must not match inside "build" or "UIBC".
  assert.equal(matchesQuery('We build software', 'дизайнер'), false);
  assert.equal(matchesQuery('UIBC Business community', 'дизайнер'), false);
  assert.equal(matchesQuery('Senior UI engineer', 'дизайнер'), true);
});

test('unrelated query does not match', () => {
  assert.equal(matchesQuery('Backend Engineer Berlin', 'бухгалтер'), false);
});

test('facets: empty selection is no restriction, otherwise exact match', () => {
  const facets = { city: 'Київ', format: 'Гібрид' };
  assert.equal(matchesFacets(facets, { city: '', format: '' }), true);
  assert.equal(matchesFacets(facets, { city: 'Київ', format: '' }), true);
  assert.equal(matchesFacets(facets, { city: 'Львів' }), false);
});

test('facetValues returns unique sorted non-empty values', () => {
  const items = [item('a', { city: 'Торонто' }), item('b', { city: 'Київ' }), item('c', { city: 'Київ' }), item('d')];
  assert.deepEqual(facetValues(items, 'city'), ['Київ', 'Торонто']);
});

test('filterItems combines query and facets', () => {
  const items = [
    item('Product Designer', { city: 'Торонто', format: 'Віддалено' }),
    item('UX Designer', { city: 'Київ', format: 'Офіс' }),
    item('Backend Engineer', { city: 'Київ', format: 'Віддалено' }),
  ];
  assert.deepEqual(filterItems(items, { q: 'дизайнер', facets: { city: 'Київ' } }), [false, true, false]);
  assert.deepEqual(filterItems(items, { q: '', facets: { format: 'Віддалено' } }), [true, false, true]);
});
