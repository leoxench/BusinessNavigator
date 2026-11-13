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

## Пошук і фільтри каталогів

На сторінках companies.html, candidates.html, jobs.html та startups.html є пошук за словом (з українсько-англійськими синонімами: «дизайнер» знаходить Product Designer, «інвестор» знаходить Venture UA) і фільтри за типом, містом, сферою та форматом роботи. Значення фільтрів беруться з атрибутів карток `data-type`, `data-city`, `data-sphere`, `data-format`, додаткові слова для пошуку з `data-keywords`; контейнер позначається `data-catalog`. Стан пошуку зберігається в URL (`?q=...&city=...`). Код: `assets/catalog-filter.js`, `assets/catalog-filter.css`, тести: `node --test scripts/catalog-filter.test.mjs`.

## Технології
Чисті HTML + CSS + JavaScript, Firebase Authentication + Analytics, Quantico, inline SVG icons, responsive layout, світла тема за замовчуванням із перемикачем, локальні photo assets та mobile menu.

Фірмовий знак-компас зберігається в `assets/images/businessnavigator-compass.png`; наданий оригінал логотипа — у `assets/images/businessnavigator-logo-source.png`.

Google sign-in та email/password форми підключені до Firebase-проєкту `ukranianbusinessnavigator`. Для роботи Google-входу production-домен має бути в Firebase Authentication → Settings → Authorized domains. Для повної платформи ще потрібні database, пошук, редагування профілів, вакансії, messaging та moderation.

## Фото

Візуальний контент завантажено з Pexels у високій роздільній здатності та збережено локально в `assets/images/`. Повний перелік авторів і посилань на оригінали — у `assets/images/PEXELS_SOURCES.md`.
