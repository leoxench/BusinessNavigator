(function(){
  const app = document.querySelector('[data-match-app]');
  if (!app) return;

  const decisionKey = 'businessnavigator-match-decisions-v1';
  const publicProfileKey = 'businessnavigator-local-public-profile';
  const profiles = {
    candidate: [
      { id:'candidate-anna', name:'Анна Новак', title:'Growth Product Manager', city:'Варшава', country:'Польща', image:'assets/images/match-anna.jpg', focus:'center 35%', fit:94, intent:'Шукає SaaS-команду для виходу на ринок ЄС', tags:['Product','B2B SaaS','Poland'], mutual:true },
      { id:'candidate-david', name:'Давид Кляйн', title:'Фінансовий директор', city:'Берлін', country:'Німеччина', image:'assets/images/match-david.jpg', focus:'center 30%', fit:88, intent:'Готовий долучитися до технологічної компанії як CFO', tags:['Finance','Scale-up','DACH'], mutual:false },
      { id:'candidate-sofia', name:'Софія Марін', title:'UX Research Lead', city:'Торонто', country:'Канада', image:'assets/images/match-sofia.jpg', focus:'center 28%', fit:86, intent:'Шукає продуктову команду у fintech або healthtech', tags:['Research','Fintech','Leadership'], mutual:true },
      { id:'candidate-marek', name:'Марек Зелінський', title:'B2B Sales Director', city:'Берлін', country:'Німеччина', image:'assets/images/match-marek.jpg', focus:'center 30%', fit:82, intent:'Допомагає українським продуктам будувати продажі в Європі', tags:['Sales','Enterprise','Europe'], mutual:false },
    ],
    partner: [
      { id:'partner-nordline', name:'Nordline Studio', title:'Product design agency', city:'Берлін', country:'Німеччина', image:'assets/images/match-business-1.jpg', focus:'center 48%', fit:96, intent:'Шукає технологічного партнера для спільних B2B-проєктів', tags:['Design','Product','B2B'], mutual:true },
      { id:'partner-varta', name:'Varta Foods', title:'Food export company', city:'Варшава', country:'Польща', image:'assets/images/match-business-2.jpg', focus:'center 45%', fit:91, intent:'Шукає дистриб’юторів і партнерів у Центральній Європі', tags:['Export','Retail','FMCG'], mutual:false },
      { id:'partner-cloud', name:'Toronto Cloud Lab', title:'Cloud engineering team', city:'Торонто', country:'Канада', image:'assets/images/match-business-3.jpg', focus:'center 42%', fit:89, intent:'Відкриті до delivery-партнерства з європейськими агенціями', tags:['Cloud','AI','Delivery'], mutual:true },
      { id:'partner-robotics', name:'Kyiv Robotics', title:'Industrial automation', city:'Київ', country:'Україна', image:'assets/images/match-business-4.jpg', focus:'center 44%', fit:84, intent:'Шукає виробничого партнера та пілотних клієнтів', tags:['Robotics','Industry','Ukraine'], mutual:false },
    ],
  };

  const cityCenters = {
    kyiv: [50.4501, 30.5234], warsaw: [52.2297, 21.0122], berlin: [52.52, 13.405], toronto: [43.6532, -79.3832],
  };
  const cityLabels = { kyiv:'Київ', warsaw:'Варшава', berlin:'Берлін', toronto:'Торонто' };
  const sectorLabels = { tech:'Tech', export:'Експорт', finance:'Фінанси', creative:'Креатив', education:'Освіта', logistics:'Логістика' };
  const businesses = [
    { id:'map-kyiv-robotics', name:'Kyiv Robotics', city:'kyiv', sector:'tech', position:[50.455,30.515], looking:'Пілотні клієнти та виробничі партнери' },
    { id:'map-misto', name:'Misto Education', city:'kyiv', sector:'education', position:[50.441,30.528], looking:'Корпоративні клієнти та ментори' },
    { id:'map-varta', name:'Varta Foods', city:'warsaw', sector:'export', position:[52.234,21.019], looking:'Дистриб’ютори у Польщі та Німеччині' },
    { id:'map-bluebridge', name:'BlueBridge Logistics', city:'warsaw', sector:'logistics', position:[52.221,21.002], looking:'Партнери для міжнародної доставки' },
    { id:'map-nordline', name:'Nordline Studio', city:'berlin', sector:'creative', position:[52.526,13.398], looking:'Tech-партнери для B2B-проєктів' },
    { id:'map-finch', name:'Finch Finance', city:'berlin', sector:'finance', position:[52.513,13.418], looking:'Fintech-продукти та інвестори' },
    { id:'map-cloud', name:'Toronto Cloud Lab', city:'toronto', sector:'tech', position:[43.659,-79.377], looking:'Delivery-партнери у Європі' },
    { id:'map-maple', name:'Maple Trade Hub', city:'toronto', sector:'export', position:[43.646,-79.392], looking:'Українські бренди для канадського ринку' },
  ];

  let mode = 'candidate';
  let history = [];
  let activeProfile = null;
  let isDeciding = false;
  let map = null;
  let markerLayer = null;
  const markerById = new Map();
  const deck = app.querySelector('[data-swipe-deck]');
  const progress = app.querySelector('[data-match-progress]');
  const modeLabel = app.querySelector('[data-match-mode-label]');
  const log = app.querySelector('[data-match-log]');
  const undo = app.querySelector('[data-match-undo]');
  const modal = document.querySelector('[data-match-modal]');

  function readDecisions(){
    try { return JSON.parse(localStorage.getItem(decisionKey) || '{}'); } catch (_) { return {}; }
  }

  function writeDecisions(value){
    localStorage.setItem(decisionKey, JSON.stringify(value));
  }

  function createTag(value){
    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.textContent = value;
    return tag;
  }

  function createSwipeCard(profile, position){
    const card = document.createElement('article');
    card.className = 'swipe-card';
    card.dataset.cardId = profile.id;
    card.style.setProperty('--stack-position', String(position));

    const image = document.createElement('img');
    image.src = profile.image;
    image.alt = mode === 'candidate' ? `Профіль ${profile.name}` : `Команда ${profile.name}`;
    image.draggable = false;
    image.style.objectPosition = profile.focus;

    const shade = document.createElement('div');
    shade.className = 'swipe-card-shade';
    const pass = document.createElement('span');
    pass.className = 'swipe-stamp swipe-stamp-pass';
    pass.textContent = 'ПРОПУСТИТИ';
    const like = document.createElement('span');
    like.className = 'swipe-stamp swipe-stamp-like';
    like.textContent = 'ЦІКАВО';

    const copy = document.createElement('div');
    copy.className = 'swipe-card-copy';
    const score = document.createElement('strong');
    score.className = 'match-score';
    score.textContent = `${profile.fit}% збіг`;
    const heading = document.createElement('h3');
    heading.textContent = profile.name;
    const meta = document.createElement('p');
    meta.className = 'swipe-card-meta';
    meta.textContent = `${profile.title} · ${profile.city}, ${profile.country}`;
    const intent = document.createElement('p');
    intent.className = 'swipe-card-intent';
    intent.textContent = profile.intent;
    const tags = document.createElement('div');
    tags.className = 'tags';
    profile.tags.forEach((value) => tags.append(createTag(value)));
    copy.append(score, heading, meta, intent, tags);
    shade.append(pass, like, copy);
    card.append(image, shade);
    return card;
  }

  function availableProfiles(){
    const decisions = readDecisions();
    return profiles[mode].filter((profile) => !decisions[profile.id]);
  }

  function attachDrag(card){
    let startX = 0;
    let currentX = 0;
    let dragging = false;

    card.addEventListener('pointerdown', (event) => {
      startX = event.clientX;
      currentX = 0;
      dragging = true;
      card.classList.add('dragging');
      card.setPointerCapture(event.pointerId);
    });
    card.addEventListener('pointermove', (event) => {
      if (!dragging) return;
      currentX = event.clientX - startX;
      const rotate = currentX / 24;
      card.style.transform = `translateX(${currentX}px) rotate(${rotate}deg)`;
      card.style.setProperty('--swipe-strength', String(Math.min(Math.abs(currentX) / 120, 1)));
      card.dataset.direction = currentX > 0 ? 'right' : 'left';
    });
    card.addEventListener('pointerup', () => {
      if (!dragging) return;
      dragging = false;
      card.classList.remove('dragging');
      if (Math.abs(currentX) >= 82) {
        performDecision(currentX > 0 ? 'like' : 'pass', currentX > 0 ? 1 : -1);
      } else {
        card.style.transform = '';
        card.style.removeProperty('--swipe-strength');
        delete card.dataset.direction;
      }
    });
    card.addEventListener('pointercancel', () => {
      dragging = false;
      card.classList.remove('dragging');
      card.style.transform = '';
      card.style.removeProperty('--swipe-strength');
      delete card.dataset.direction;
    });
  }

  function renderDeck(){
    const available = availableProfiles();
    activeProfile = available[0] || null;
    deck.replaceChildren();
    modeLabel.textContent = mode === 'candidate' ? 'Кандидати' : 'Бізнес-партнери';
    progress.textContent = activeProfile ? `${profiles[mode].length - available.length + 1} / ${profiles[mode].length}` : `${profiles[mode].length} / ${profiles[mode].length}`;

    if (!activeProfile) {
      const empty = document.createElement('div');
      empty.className = 'swipe-empty';
      const heading = document.createElement('h3');
      heading.textContent = 'ВИ ПЕРЕГЛЯНУЛИ ВСІ ПРОФІЛІ';
      const copy = document.createElement('p');
      copy.textContent = 'Поверніть рішення або почніть добірку спочатку.';
      const reset = document.createElement('button');
      reset.type = 'button';
      reset.className = 'secondary-btn';
      reset.textContent = 'ПОЧАТИ ЗНОВУ';
      reset.addEventListener('click', resetMode);
      empty.append(heading, copy, reset);
      deck.append(empty);
      return;
    }

    available.slice(0, 3).reverse().forEach((profile, reverseIndex, visible) => {
      const position = visible.length - reverseIndex - 1;
      const card = createSwipeCard(profile, position);
      deck.append(card);
      if (position === 0) attachDrag(card);
    });
  }

  function renderLog(){
    log.replaceChildren();
    if (!history.length) {
      const empty = document.createElement('p');
      empty.textContent = 'Ще немає рішень.';
      log.append(empty);
      undo.disabled = true;
      return;
    }
    history.slice(-5).reverse().forEach((entry) => {
      const row = document.createElement('div');
      row.className = 'match-log-row';
      const name = document.createElement('strong');
      name.textContent = entry.profile.name;
      const decision = document.createElement('span');
      decision.dataset.decision = entry.decision;
      decision.textContent = entry.decision === 'like' ? 'Цікаво' : entry.decision === 'save' ? 'Збережено' : 'Пропущено';
      row.append(name, decision);
      log.append(row);
    });
    undo.disabled = false;
  }

  function animateOut(card, direction, callback){
    card.classList.add(direction > 0 ? 'swipe-out-right' : 'swipe-out-left');
    window.setTimeout(callback, 260);
  }

  function performDecision(decision, direction){
    if (!activeProfile || isDeciding) return;
    isDeciding = true;
    const profile = activeProfile;
    const card = deck.querySelector('.swipe-card[data-card-id="' + profile.id + '"]');
    const decisions = readDecisions();
    const decidedAt = Date.now();
    decisions[profile.id] = { decision, at:decidedAt, mode };
    writeDecisions(decisions);
    history.push({ profile, decision, mode, at:decidedAt });
    const finish = () => {
      isDeciding = false;
      renderDeck();
      renderLog();
      if (decision === 'like' && profile.mutual) openMatchModal(profile);
    };
    if (card) animateOut(card, direction || (decision === 'pass' ? -1 : 1), finish);
    else finish();
  }

  function resetMode(){
    const decisions = readDecisions();
    profiles[mode].forEach((profile) => delete decisions[profile.id]);
    writeDecisions(decisions);
    history = history.filter((entry) => entry.mode !== mode);
    renderDeck();
    renderLog();
  }

  function openMatchModal(profile){
    modal.hidden = false;
    modal.querySelector('[data-match-modal-copy]').textContent = `${profile.name} теж зацікавлені у знайомстві. Надішліть запит, і контакт відкриється після підтвердження.`;
    modal.querySelector('[data-match-request-note]').textContent = '';
    modal.querySelector('[data-match-request]').disabled = false;
    modal.querySelector('[data-match-request]').focus();
  }

  function closeMatchModal(){
    modal.hidden = true;
  }

  app.querySelectorAll('[data-match-mode]').forEach((button) => {
    button.addEventListener('click', () => {
      mode = button.dataset.matchMode;
      app.querySelectorAll('[data-match-mode]').forEach((item) => item.classList.toggle('active', item === button));
      renderDeck();
    });
  });

  app.querySelectorAll('[data-swipe-action]').forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.dataset.swipeAction;
      performDecision(action, action === 'pass' ? -1 : 1);
    });
  });

  undo.addEventListener('click', () => {
    const last = history.pop();
    if (!last) return;
    const decisions = readDecisions();
    delete decisions[last.profile.id];
    writeDecisions(decisions);
    if (last.mode !== mode) {
      mode = last.mode;
      app.querySelectorAll('[data-match-mode]').forEach((item) => item.classList.toggle('active', item.dataset.matchMode === mode));
    }
    renderDeck();
    renderLog();
  });

  document.addEventListener('keydown', (event) => {
    if (event.target.matches('input,select,textarea')) return;
    if (!modal.hidden) {
      if (event.key === 'Escape') closeMatchModal();
      return;
    }
    if (event.key === 'ArrowLeft') performDecision('pass', -1);
    if (event.key === 'ArrowRight') performDecision('like', 1);
  });

  modal.querySelectorAll('[data-match-close]').forEach((control) => control.addEventListener('click', closeMatchModal));
  modal.querySelector('[data-match-request]').addEventListener('click', (event) => {
    event.currentTarget.disabled = true;
    modal.querySelector('[data-match-request-note]').textContent = 'Запит на контакт надіслано. Ви отримаєте сповіщення після підтвердження.';
  });

  function readLocalBusiness(){
    try {
      const profile = JSON.parse(localStorage.getItem(publicProfileKey) || 'null');
      if (!profile || profile.profileType !== 'company' || !profile.publications?.profile || !profile.publications?.map) return null;
      const center = cityCenters[profile.locationCode];
      if (!center) return null;
      return { id:'current-business', name:profile.displayName || 'Мій бізнес', city:profile.locationCode, sector:'tech', position:[center[0] + .009, center[1] - .011], looking:'Публічний профіль користувача', isCurrent:true };
    } catch (_) { return null; }
  }

  function popupNode(business){
    const wrap = document.createElement('div');
    wrap.className = 'map-popup';
    const heading = document.createElement('strong');
    heading.textContent = business.name;
    const meta = document.createElement('span');
    meta.textContent = `${cityLabels[business.city]} · ${sectorLabels[business.sector]}`;
    const copy = document.createElement('p');
    copy.textContent = business.looking;
    wrap.append(heading, meta, copy);
    return wrap;
  }

  function selectedBusinesses(){
    const city = app.querySelector('[data-map-city]').value;
    const sector = app.querySelector('[data-map-sector]').value;
    const local = readLocalBusiness();
    return businesses.concat(local ? [local] : []).filter((business) => (city === 'all' || business.city === city) && (sector === 'all' || business.sector === sector));
  }

  function focusBusiness(id){
    const marker = markerById.get(id);
    if (!marker || !map) return;
    map.flyTo(marker.getLatLng(), 13, { duration:.65 });
    marker.openPopup();
  }

  function renderMapList(items){
    const list = app.querySelector('[data-map-list]');
    list.replaceChildren();
    const count = document.createElement('div');
    count.className = 'map-result-count';
    count.textContent = `${items.length} публічних бізнесів`;
    list.append(count);
    if (!items.length) {
      const empty = document.createElement('p');
      empty.className = 'map-list-empty';
      empty.textContent = 'За цими фільтрами профілів поки немає.';
      list.append(empty);
      return;
    }
    items.forEach((business) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'map-business-card';
      const title = document.createElement('strong');
      title.textContent = business.name;
      const meta = document.createElement('span');
      meta.textContent = `${cityLabels[business.city]} · ${sectorLabels[business.sector]}`;
      const copy = document.createElement('p');
      copy.textContent = business.looking;
      const action = document.createElement('b');
      action.textContent = business.isCurrent ? 'ВАШ ПРОФІЛЬ' : 'ПОКАЗАТИ НА МАПІ';
      button.append(title, meta, copy, action);
      button.addEventListener('click', () => focusBusiness(business.id));
      list.append(button);
    });
  }

  function updateMap(){
    const items = selectedBusinesses();
    renderMapList(items);
    if (!map || !window.L) return;
    markerLayer.clearLayers();
    markerById.clear();
    const bounds = [];
    items.forEach((business, index) => {
      const icon = window.L.divIcon({ className:'business-map-marker', html:`<span>${index + 1}</span>`, iconSize:[36,36], iconAnchor:[18,18] });
      const marker = window.L.marker(business.position, { icon }).bindPopup(popupNode(business));
      marker.addTo(markerLayer);
      markerById.set(business.id, marker);
      bounds.push(business.position);
    });
    if (bounds.length === 1) map.setView(bounds[0], 12);
    if (bounds.length > 1) map.fitBounds(bounds, { padding:[42,42], maxZoom:11 });
  }

  function initializeMap(){
    const container = document.getElementById('business-map');
    if (!window.L) {
      container.innerHTML = '<div class="map-loading">МАПА НЕДОСТУПНА. СПИСОК БІЗНЕСІВ ПРАЦЮЄ ПРАВОРУЧ.</div>';
      renderMapList(selectedBusinesses());
      return;
    }
    container.replaceChildren();
    map = window.L.map(container, {
      scrollWheelZoom:true,
      zoomControl:true,
      touchZoom:true,
      doubleClickZoom:true,
      boxZoom:true,
      keyboard:true,
      minZoom:3,
      maxZoom:18,
      wheelDebounceTime:24,
      wheelPxPerZoomLevel:80
    }).setView([50.4, 19.2], 5);
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom:18, attribution:'&copy; OpenStreetMap contributors' }).addTo(map);
    const zoomInButton = container.querySelector('.leaflet-control-zoom-in');
    const zoomOutButton = container.querySelector('.leaflet-control-zoom-out');
    if (zoomInButton) {
      zoomInButton.setAttribute('aria-label', 'Збільшити масштаб карти');
      zoomInButton.setAttribute('title', 'Збільшити масштаб карти');
    }
    if (zoomOutButton) {
      zoomOutButton.setAttribute('aria-label', 'Зменшити масштаб карти');
      zoomOutButton.setAttribute('title', 'Зменшити масштаб карти');
    }
    markerLayer = window.L.layerGroup().addTo(map);
    updateMap();
  }

  app.querySelectorAll('[data-map-city],[data-map-sector]').forEach((select) => select.addEventListener('change', updateMap));

  history = Object.entries(readDecisions()).map(([id, entry]) => {
    const profile = profiles[entry.mode]?.find((item) => item.id === id);
    return profile ? { profile, decision:entry.decision, mode:entry.mode, at:entry.at || 0 } : null;
  }).filter(Boolean).sort((a, b) => a.at - b.at);
  renderDeck();
  renderLog();
  initializeMap();
})();
