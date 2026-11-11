# BusinessNavigator MVP

BusinessNavigator — ваша мережа бізнес-можливостей із каталогом компаній, вакансій, кандидатів, стартапів, знань та професійних зв’язків.

## Сторінки
- index.html — велика головна сторінка
- jobs.html — вакансії
- companies.html — каталог компаній
- company-profile.html — профіль компанії
- candidates.html — каталог кандидатів
- profile.html — профіль спеціаліста
- startups.html — стартапи
- stories.html — історії / медіа
- learning.html — навчання
- about.html — про проєкт
- services.html — напрями екосистеми
- insights.html — аналітика
- contact.html — контакти
- login.html / register.html — авторизація та реєстрація
- email-builder.html — **Email builder**: внутрішній конструктор листів із блоків з експортом у HTML (у меню сайту не виводиться, лише за прямим посиланням)

## Технології
Чисті HTML + CSS + JavaScript, Firebase Authentication + Analytics, Quantico, inline SVG icons, responsive layout, світла тема за замовчуванням із перемикачем, локальні photo assets та mobile menu.

Фірмовий знак-компас зберігається в `assets/images/businessnavigator-compass.png`; наданий оригінал логотипа — у `assets/images/businessnavigator-logo-source.png`.

Google sign-in та email/password форми підключені до Firebase-проєкту `ukranianbusinessnavigator`. Для роботи Google-входу production-домен має бути в Firebase Authentication → Settings → Authorized domains. Для повної платформи ще потрібні database, пошук, редагування профілів, вакансії, messaging та moderation.

## Email builder (email-builder.html)

Конструктор листів: блоки (заголовок, текст з простим markdown, кнопка, зображення за URL, дві колонки, розділювач, відступ, футер), drag & drop, undo/redo (Ctrl+Z / Ctrl+Shift+Z), налаштування листа (тема, прев'ю, шрифт, кольори, ширина), перегляд desktop/mobile, стартові шаблони. Експорт: HTML листа (табличний макет з inline-стилями — Gmail, Outlook, Apple Mail), текстова версія, шаблон у JSON та імпорт назад. Збережені шаблони й чернетка — у localStorage браузера. Код: `assets/email-render.js` (модель і рендер), `assets/email-builder.js` (інтерфейс), `assets/email-builder.css`.

## Локальний запуск

Простий статичний сервер без залежностей (Node 20+):

```bash
node scripts/serve.mjs     # http://localhost:8080
```

## Фото

Візуальний контент завантажено з Pexels у високій роздільній здатності та збережено локально в `assets/images/`. Повний перелік авторів і посилань на оригінали — у `assets/images/PEXELS_SOURCES.md`.
