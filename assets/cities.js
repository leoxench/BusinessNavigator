(function(){
  const localPublicProfileKey = 'businessnavigator-local-public-profile';
  const cityData = {
    kyiv: {
      name: 'КИЇВ',
      country: 'Україна',
      description: 'Київ об’єднує продуктові команди, технологічні компанії, креативні індустрії, сервісний бізнес і сильну підприємницьку спільноту.',
      opportunities: ['Робота і команди', 'Продуктовий бізнес', 'Партнерства і події'],
      members: [
        { name: 'Марта Савчук', role: 'Product Designer', skills: ['Fintech', 'Design systems'] },
        { name: 'Андрій Бондар', role: 'Засновник стартапу', skills: ['SaaS', 'B2B'] },
        { name: 'Олена Кравець', role: 'Рекрутерка', skills: ['Tech hiring', 'People'] },
        { name: 'Данило Горбач', role: 'Backend Engineer', skills: ['Node.js', 'Cloud'] },
      ],
    },
    warsaw: {
      name: 'ВАРШАВА',
      country: 'Польща',
      description: 'Варшава є зручним центром для виходу на європейські ринки, розвитку локальних команд, B2B-продажів і професійних зв’язків.',
      opportunities: ['Європейські ринки', 'Компанії і таланти', 'Українська спільнота'],
      members: [
        { name: 'Ірина Левчук', role: 'Business Development', skills: ['B2B', 'Poland'] },
        { name: 'Максим Орлик', role: 'Frontend Engineer', skills: ['React', 'TypeScript'] },
        { name: 'Софія Романюк', role: 'Community Lead', skills: ['Events', 'Partnerships'] },
        { name: 'Тарас Коваль', role: 'Фінансовий консультант', skills: ['Finance', 'SME'] },
      ],
    },
    toronto: {
      name: 'ТОРОНТО',
      country: 'Канада',
      description: 'Торонто поєднує міжнародні компанії, технологічний сектор, фінанси, інвестиції та активну українську бізнес-спільноту.',
      opportunities: ['Кар’єра в Канаді', 'Нові ринки', 'Інвестиції і партнерства'],
      members: [
        { name: 'Наталія Козак', role: 'Product Manager', skills: ['Product', 'AI'] },
        { name: 'Роман Гнатюк', role: 'Інвестор', skills: ['Early stage', 'Canada'] },
        { name: 'Катерина Лис', role: 'Career Mentor', skills: ['Career', 'Leadership'] },
        { name: 'Юрій Мельник', role: 'Sales Lead', skills: ['Enterprise', 'Growth'] },
      ],
    },
    berlin: {
      name: 'БЕРЛІН',
      country: 'Німеччина',
      description: 'Берлін розвиває міжнародні стартапи, технологічні продукти, креативний бізнес і професійні спільноти з глобальним фокусом.',
      opportunities: ['Стартапи', 'Tech і продукт', 'Креативні індустрії'],
      members: [
        { name: 'Олексій Марчук', role: 'Software Architect', skills: ['Platform', 'Cloud'] },
        { name: 'Вікторія Нечай', role: 'Засновниця', skills: ['Climate tech', 'Impact'] },
        { name: 'Марко Ткач', role: 'UX Researcher', skills: ['Research', 'Mobility'] },
        { name: 'Анна Руденко', role: 'Partnership Manager', skills: ['DACH', 'Business'] },
      ],
    },
  };

  const directory = document.querySelector('[data-city-directory]');
  if (!directory) return;

  function readLocalProfile() {
    try {
      const value = localStorage.getItem(localPublicProfileKey);
      return value ? JSON.parse(value) : null;
    } catch (_) {
      return null;
    }
  }

  function initials(name) {
    return String(name || 'BN').split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part.charAt(0)).join('').toUpperCase();
  }

  function createMemberCard(member) {
    const card = document.createElement('article');
    card.className = 'network-person-card';
    if (member.isCurrentUser) card.dataset.currentUser = 'true';

    const avatar = document.createElement('div');
    avatar.className = 'network-person-avatar';
    if (member.photoURL) {
      const image = document.createElement('img');
      image.src = member.photoURL;
      image.alt = '';
      image.referrerPolicy = 'no-referrer';
      avatar.append(image);
    } else {
      avatar.textContent = initials(member.name);
    }

    const copy = document.createElement('div');
    copy.className = 'network-person-copy';
    const meta = document.createElement('span');
    meta.className = 'network-person-meta';
    meta.textContent = member.isCurrentUser ? 'ВАШ ПУБЛІЧНИЙ ПРОФІЛЬ' : 'ДЕМО ПРОФІЛЬ';
    const name = document.createElement('h3');
    name.textContent = member.name;
    const role = document.createElement('p');
    role.textContent = member.role;
    const tags = document.createElement('div');
    tags.className = 'tags';
    (member.skills || []).forEach((skill) => {
      const tag = document.createElement('span');
      tag.className = 'tag';
      tag.textContent = skill;
      tags.append(tag);
    });
    copy.append(meta, name, role, tags);
    card.append(avatar, copy);
    return card;
  }

  function renderCity(cityCode) {
    const city = cityData[cityCode] || cityData.kyiv;
    const localProfile = readLocalProfile();
    const localInCity = localProfile?.locationCode === cityCode && localProfile?.publications?.map;
    const localIsPublic = localInCity && localProfile?.publications?.profile;
    const members = city.members.map((member) => ({ ...member }));

    if (localIsPublic) {
      members.unshift({
        name: localProfile.displayName,
        role: localProfile.profileTypeLabel,
        skills: ['BusinessNavigator', city.name],
        photoURL: localProfile.publications.avatar ? localProfile.photoURL : '',
        isCurrentUser: true,
      });
    }

    directory.querySelector('[data-city-country]').textContent = city.country;
    directory.querySelector('[data-city-name]').textContent = city.name;
    directory.querySelector('[data-city-description]').textContent = city.description;
    directory.querySelector('[data-city-public-count]').textContent = String(localInCity ? 1 : 0);

    const opportunities = directory.querySelector('[data-city-opportunities]');
    opportunities.replaceChildren();
    city.opportunities.forEach((item) => {
      const span = document.createElement('span');
      span.textContent = item;
      opportunities.append(span);
    });

    const memberGrid = directory.querySelector('[data-city-members]');
    memberGrid.replaceChildren(...members.map(createMemberCard));

    directory.querySelectorAll('[data-city-tab]').forEach((tab) => {
      const active = tab.dataset.cityTab === cityCode;
      tab.classList.toggle('active', active);
      if (active) tab.setAttribute('aria-current', 'page');
      else tab.removeAttribute('aria-current');
    });

    const privacyNote = directory.querySelector('[data-city-privacy-note]');
    if (!localProfile) {
      privacyNote.textContent = '';
      privacyNote.hidden = true;
    } else if (localIsPublic) {
      privacyNote.hidden = false;
      privacyNote.textContent = 'Ваш профіль показано у цій локації відповідно до вибраних дозволів.';
    } else if (localInCity) {
      privacyNote.hidden = false;
      privacyNote.textContent = 'Ваша присутність врахована у загальній кількості анонімно. Ім’я та профіль не показуються без окремої згоди.';
    } else {
      privacyNote.hidden = false;
      privacyNote.textContent = 'Ваш профіль не показується у цій локації. Відображення залежить від вибраного міста та дозволу на мапу.';
    }

    document.title = `${city.name.charAt(0)}${city.name.slice(1).toLowerCase()} - BusinessNavigator`;
  }

  const requestedCity = new URLSearchParams(window.location.search).get('city');
  renderCity(cityData[requestedCity] ? requestedCity : 'kyiv');
})();
