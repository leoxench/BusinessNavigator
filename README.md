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
- fops.html — ФОПи: напрями послуг + **реєстр справжніх ФОП з ЄДР** (розділ `#registry`)
- email-builder.html — **Email builder**: конструктор листів із блоків з експортом у HTML

## Технології
Чисті HTML + CSS + JavaScript, Firebase Authentication + Analytics, Quantico, inline SVG icons, responsive layout, світла тема за замовчуванням із перемикачем, локальні photo assets та mobile menu.

Фірмовий знак-компас зберігається в `assets/images/businessnavigator-compass.png`; наданий оригінал логотипа — у `assets/images/businessnavigator-logo-source.png`.

Google sign-in та email/password форми підключені до Firebase-проєкту `ukranianbusinessnavigator`. Для роботи Google-входу production-домен має бути в Firebase Authentication → Settings → Authorized domains. Для повної платформи ще потрібні database, пошук, редагування профілів, вакансії, messaging та moderation.

## Реєстр ФОП (fops.html#registry)

Справжні ФОП зі стану «зареєстровано» з відкритих даних Мін'юсту — [Єдиний державний реєстр юридичних осіб, ФОП та громадських формувань](https://data.gov.ua/dataset/03cc1239-3988-4451-aa0d-aadb77448714) (CC BY 4.0). Дані лежать статичними JSON у `data/fops/` (≈ 11 МБ, шарди за першою літерою прізвища), код — `assets/fop-registry.js` / `.css`. Пошук за ПІБ (у будь-якому порядку слів), алфавітний покажчик, фільтри за місяцем реєстрації та обліком у ДПС, сортування, «Показати ще».

Оновлення даних (Node 20+, без залежностей; архів ≈ 470 МБ кладеться в `.cache/`, який у git не потрапляє):

```bash
node scripts/build-fop-data.mjs --download            # завантажити свіжий fop.zip і перегенерувати data/fops
node scripts/build-fop-data.mjs --file .cache/fop.zip --months 3 --date 2026-11-03
```

`--months N` — період реєстрації (за замовчуванням 6 місяців), `--since YYYY-MM-DD` — явна дата, `--date` — дата набору для підпису «станом на». Через обмеження воєнного часу у відкритих даних є лише ПІБ, стан, дата реєстрації та облік у ДПС/ЄСВ — адреси, КВЕД і РНОКПП не публікуються.

## Email builder (email-builder.html)

Конструктор листів: блоки (заголовок, текст з простим markdown, кнопка, зображення за URL, дві колонки, розділювач, відступ, футер), drag & drop, undo/redo (Ctrl+Z / Ctrl+Shift+Z), налаштування листа (тема, прев'ю, шрифт, кольори, ширина), перегляд desktop/mobile, стартові шаблони. Експорт: HTML листа (табличний макет з inline-стилями — Gmail, Outlook, Apple Mail), текстова версія, шаблон у JSON та імпорт назад. Збережені шаблони й чернетка — у localStorage браузера. Код: `assets/email-render.js` (модель і рендер), `assets/email-builder.js` (інтерфейс), `assets/email-builder.css`.

## Локальний запуск

Каталог ФОП завантажує JSON через `fetch`, тому сайт треба відкривати через сервер, а не як file://:

```bash
node scripts/serve.mjs     # http://localhost:8080
```

## Фото

Візуальний контент завантажено з Pexels у високій роздільній здатності та збережено локально в `assets/images/`. Повний перелік авторів і посилань на оригінали — у `assets/images/PEXELS_SOURCES.md`.
