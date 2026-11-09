/*
 * Email builder — модель листа і рендер у HTML, сумісний з поштовими клієнтами
 * (табличний макет, inline-стилі, без JS; один media query для мобільних).
 * Глобальний об'єкт window.BNEmail використовує assets/email-builder.js.
 */
(function () {
  const SITE = 'https://businessnavigator.com.ua';

  const FONTS = [
    { label: 'Arial / Helvetica', value: 'Arial, Helvetica, sans-serif' },
    { label: 'Verdana', value: 'Verdana, Geneva, sans-serif' },
    { label: 'Trebuchet', value: "'Trebuchet MS', Tahoma, sans-serif" },
    { label: 'Georgia (serif)', value: "Georgia, 'Times New Roman', serif" },
    { label: 'Courier (mono)', value: "'Courier New', Courier, monospace" },
  ];

  const LABELS = {
    heading: 'Заголовок',
    text: 'Текст',
    button: 'Кнопка',
    image: 'Зображення',
    columns: 'Дві колонки',
    divider: 'Розділювач',
    spacer: 'Відступ',
    footer: 'Футер',
  };

  const uid = () => Math.random().toString(36).slice(2, 10);

  function defaultSettings() {
    return {
      subject: '',
      preheader: '',
      bodyBg: '#eef2f4',
      contentBg: '#ffffff',
      textColor: '#12171a',
      brandColor: '#0789a5',
      fontFamily: FONTS[0].value,
      width: 600,
      radius: 0,
      gutter: 32,
    };
  }

  function newBlock(type, s) {
    s = s || defaultSettings();
    const id = uid();
    switch (type) {
      case 'heading':
        return { id, type, padding: 12, text: 'Новий заголовок', level: 1, align: 'left', color: '#12171a' };
      case 'text':
        return { id, type, padding: 8, text: 'Напишіть тут текст листа. Підтримується **жирний**, *курсив* і [посилання](https://businessnavigator.com.ua).', align: 'left', fontSize: 16, color: s.textColor };
      case 'button':
        return { id, type, padding: 16, label: 'Детальніше', url: SITE, align: 'left', bg: s.brandColor, color: '#ffffff', radius: 0, fullWidth: false };
      case 'image':
        return { id, type, padding: 12, src: `${SITE}/assets/images/collaboration.jpg`, alt: 'Зображення', href: '', width: 100, align: 'center', radius: 0 };
      case 'columns':
        return { id, type, padding: 12, left: '**Ліва колонка**\nКороткий опис.', right: '**Права колонка**\nКороткий опис.', fontSize: 15, color: s.textColor };
      case 'divider':
        return { id, type, padding: 16, color: '#dde3e6', thickness: 1 };
      case 'spacer':
        return { id, type, padding: 0, height: 24 };
      case 'footer':
        return { id, type, padding: 16, text: 'BusinessNavigator · Українська професійна мережа для бізнесу\nВи отримали цей лист, бо зареєстровані на платформі.', align: 'center', color: '#8a979d' };
    }
    throw new Error(`Невідомий блок: ${type}`);
  }

  // ---------- Стартові шаблони ----------

  function design(subject, preheader, blocks) {
    return { version: 1, settings: Object.assign(defaultSettings(), { subject, preheader }), blocks: blocks.map((b) => Object.assign({ id: uid() }, b)) };
  }
  const LOGO = `${SITE}/assets/images/businessnavigator-compass.png`;

  const STARTERS = [
    { key: 'blank', name: 'Порожній лист', description: 'Почати з нуля', build: () => ({ version: 1, settings: defaultSettings(), blocks: [] }) },
    {
      key: 'welcome',
      name: 'Вітальний лист',
      description: 'Для нового учасника мережі',
      build: () =>
        design('Ласкаво просимо до BusinessNavigator', 'Ваш профіль створено — ось три кроки, з яких варто почати.', [
          { type: 'image', padding: 8, src: LOGO, alt: 'BusinessNavigator', href: SITE, width: 12, align: 'left', radius: 0 },
          { type: 'heading', padding: 12, text: 'Вітаємо в мережі, {{ім’я}}!', level: 1, align: 'left', color: '#12171a' },
          { type: 'text', padding: 8, text: 'Дякуємо, що приєдналися до **BusinessNavigator** — української професійної мережі для бізнесу, кар’єри, стартапів і нових можливостей.\n\nОсь з чого варто почати:', align: 'left', fontSize: 16, color: '#12171a' },
          { type: 'columns', padding: 12, left: '**1. Заповніть профіль**\nМісто, навички й короткий опис допоможуть знайти вас.', right: '**2. Спробуйте Business Match**\nЗнайдіть партнерів, клієнтів і команду.', fontSize: 15, color: '#12171a' },
          { type: 'button', padding: 16, label: 'Перейти до профілю', url: `${SITE}/profile.html`, align: 'left', bg: '#0789a5', color: '#ffffff', radius: 0, fullWidth: false },
          { type: 'divider', padding: 16, color: '#dde3e6', thickness: 1 },
          { type: 'footer', padding: 12, text: 'BusinessNavigator · Українська професійна мережа\nЯкщо лист потрапив до вас помилково — просто проігноруйте його.', align: 'center', color: '#8a979d' },
        ]),
    },
    {
      key: 'fop-offer',
      name: 'Пропозиція для ФОП',
      description: 'Запрошення до співпраці',
      build: () =>
        design('Пропозиція співпраці для вашого бізнесу', 'Шукаємо ФОП-партнерів для спільних проєктів.', [
          { type: 'heading', padding: 12, text: 'Шукаємо партнерів-ФОП', level: 1, align: 'center', color: '#12171a' },
          { type: 'text', padding: 8, text: 'Добрий день, {{ім’я}}!\n\nМи розвиваємо проєкт і шукаємо **надійних підрядників** серед ФОП. Пропонуємо довгострокову співпрацю, прозорі умови й оплату в строк.', align: 'center', fontSize: 16, color: '#12171a' },
          { type: 'image', padding: 12, src: `${SITE}/assets/images/team-meeting.jpg`, alt: 'Команда', href: '', width: 100, align: 'center', radius: 0 },
          { type: 'columns', padding: 12, left: '**Що пропонуємо**\nРегулярні замовлення, договір, оплата на рахунок ФОП.', right: '**Кого шукаємо**\nРозробка, дизайн, маркетинг, фінанси, право.', fontSize: 15, color: '#12171a' },
          { type: 'button', padding: 20, label: 'Відгукнутися', url: `${SITE}/fops.html`, align: 'center', bg: '#0789a5', color: '#ffffff', radius: 0, fullWidth: false },
          { type: 'footer', padding: 16, text: 'Лист надіслано через BusinessNavigator.', align: 'center', color: '#8a979d' },
        ]),
    },
    {
      key: 'digest',
      name: 'Дайджест можливостей',
      description: 'Розсилка з добіркою',
      build: () =>
        design('Нові можливості цього тижня', 'Вакансії, проєкти та стартапи, які вам підходять.', [
          { type: 'heading', padding: 8, text: 'Можливості тижня', level: 1, align: 'left', color: '#12171a' },
          { type: 'text', padding: 4, text: 'Добірка нових запитів, що відповідають вашому профілю.', align: 'left', fontSize: 15, color: '#5c676c' },
          { type: 'divider', padding: 12, color: '#dde3e6', thickness: 1 },
          { type: 'heading', padding: 4, text: 'Проєкт: редизайн інтернет-магазину', level: 3, align: 'left', color: '#12171a' },
          { type: 'text', padding: 4, text: 'Київ · Віддалено · бюджет обговорюється. [Переглянути →](https://businessnavigator.com.ua/projects.html)', align: 'left', fontSize: 15, color: '#12171a' },
          { type: 'spacer', padding: 0, height: 12 },
          { type: 'heading', padding: 4, text: 'Вакансія: бухгалтер для ФОП 3 групи', level: 3, align: 'left', color: '#12171a' },
          { type: 'text', padding: 4, text: 'Львів · Гібрид. [Переглянути →](https://businessnavigator.com.ua/jobs.html)', align: 'left', fontSize: 15, color: '#12171a' },
          { type: 'button', padding: 20, label: 'Усі можливості', url: `${SITE}/jobs.html`, align: 'left', bg: '#0789a5', color: '#ffffff', radius: 0, fullWidth: true },
          { type: 'footer', padding: 16, text: 'Ви отримуєте дайджест, бо підписані на оновлення BusinessNavigator.', align: 'center', color: '#8a979d' },
        ]),
    },
  ];

  // ---------- Безпека: дизайн може прийти з localStorage або імпортованого файлу ----------

  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  function safeUrl(url) {
    const u = String(url || '').trim();
    if (/^(https?:|mailto:|tel:)/i.test(u) || /^\{\{[^}]+\}\}$/.test(u)) return u;
    if (/^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(u)) return `https://${u}`;
    return '#';
  }

  const color = (v, f) => (typeof v === 'string' && /^#[0-9a-f]{3,8}$/i.test(v) ? v : f);
  const num = (v, min, max, f) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : f;
  };
  const align = (v) => (v === 'center' || v === 'right' ? v : 'left');
  const str = (v) => (typeof v === 'string' ? v : '');

  function cleanSettings(s) {
    const d = defaultSettings();
    s = s || {};
    return {
      subject: str(s.subject),
      preheader: str(s.preheader),
      bodyBg: color(s.bodyBg, d.bodyBg),
      contentBg: color(s.contentBg, d.contentBg),
      textColor: color(s.textColor, d.textColor),
      brandColor: color(s.brandColor, d.brandColor),
      fontFamily: FONTS.some((f) => f.value === s.fontFamily) ? s.fontFamily : d.fontFamily,
      width: num(s.width, 320, 800, d.width),
      radius: num(s.radius, 0, 40, d.radius),
      gutter: num(s.gutter, 0, 64, d.gutter),
    };
  }

  function cleanBlock(b) {
    const base = { id: str(b.id) || uid(), type: b.type, padding: num(b.padding, 0, 80, 8) };
    switch (b.type) {
      case 'heading':
        return Object.assign(base, { text: str(b.text), level: [1, 2, 3].includes(Number(b.level)) ? Number(b.level) : 1, align: align(b.align), color: color(b.color, '#12171a') });
      case 'text':
        return Object.assign(base, { text: str(b.text), align: align(b.align), fontSize: num(b.fontSize, 10, 32, 16), color: color(b.color, '#12171a') });
      case 'button':
        return Object.assign(base, { label: str(b.label), url: str(b.url), align: align(b.align), bg: color(b.bg, '#0789a5'), color: color(b.color, '#ffffff'), radius: num(b.radius, 0, 999, 0), fullWidth: !!b.fullWidth });
      case 'image':
        return Object.assign(base, { src: str(b.src), alt: str(b.alt), href: str(b.href), width: num(b.width, 5, 100, 100), align: align(b.align), radius: num(b.radius, 0, 60, 0) });
      case 'columns':
        return Object.assign(base, { left: str(b.left), right: str(b.right), fontSize: num(b.fontSize, 10, 28, 15), color: color(b.color, '#12171a') });
      case 'divider':
        return Object.assign(base, { color: color(b.color, '#dde3e6'), thickness: num(b.thickness, 1, 8, 1) });
      case 'spacer':
        return Object.assign(base, { height: num(b.height, 4, 160, 24) });
      case 'footer':
        return Object.assign(base, { text: str(b.text), align: align(b.align), color: color(b.color, '#8a979d') });
    }
    return null;
  }

  /** Перевіряє й нормалізує дизайн (для імпорту та localStorage). */
  function cleanDesign(d) {
    if (!d || typeof d !== 'object' || !Array.isArray(d.blocks)) return null;
    return { version: 1, settings: cleanSettings(d.settings), blocks: d.blocks.map(cleanBlock).filter(Boolean) };
  }

  // ---------- Рендер ----------

  /** Мінімальний markdown: **жирний**, *курсив*, [текст](url), переноси рядків. */
  function inline(md, linkColor) {
    return esc(md)
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, text, url) => {
        const href = esc(safeUrl(url.replace(/&amp;/g, '&')));
        return `<a href="${href}" target="_blank" style="color:${linkColor};text-decoration:underline;">${text}</a>`;
      })
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
      .replace(/\n/g, '<br>');
  }

  function paragraphs(md, style, linkColor) {
    const parts = md.split(/\n\s*\n/);
    return parts.map((p, i) => `<p style="margin:0 0 ${i === parts.length - 1 ? 0 : 12}px 0;${style}">${inline(p.trim(), linkColor)}</p>`).join('');
  }

  const H_SIZE = { 1: 28, 2: 22, 3: 18 };
  const row = (tdStyle, html) => `<tr><td style="${tdStyle}">${html}</td></tr>`;

  /** HTML одного блоку — рядок <tr> основної таблиці листа. */
  function renderBlock(block, settings) {
    const b = cleanBlock(block);
    const s = cleanSettings(settings);
    if (!b) return '';
    const pad = `padding:${b.padding}px ${s.gutter}px;`;
    const font = `font-family:${esc(s.fontFamily)};`;

    switch (b.type) {
      case 'heading':
        return row(pad, `<h${b.level} style="margin:0;${font}font-size:${H_SIZE[b.level]}px;line-height:1.25;font-weight:700;color:${b.color};text-align:${b.align};">${inline(b.text, s.brandColor)}</h${b.level}>`);
      case 'text':
        return row(pad, paragraphs(b.text, `${font}font-size:${b.fontSize}px;line-height:1.6;color:${b.color};text-align:${b.align};`, s.brandColor));
      case 'button': {
        const margin = b.align === 'center' ? 'margin:0 auto;' : b.align === 'right' ? 'margin-left:auto;' : '';
        return row(
          `${pad}text-align:${b.align};`,
          `<table role="presentation" cellspacing="0" cellpadding="0" border="0" ${b.fullWidth ? 'width="100%"' : ''} style="${margin}${b.fullWidth ? 'width:100%;' : ''}">` +
            `<tr><td align="center" bgcolor="${b.bg}" style="border-radius:${b.radius}px;background:${b.bg};">` +
            `<a href="${esc(safeUrl(b.url))}" target="_blank" style="display:block;padding:14px 28px;${font}font-size:15px;font-weight:700;letter-spacing:.04em;line-height:1.2;color:${b.color};text-decoration:none;border-radius:${b.radius}px;">${esc(b.label)}</a>` +
            `</td></tr></table>`,
        );
      }
      case 'image': {
        const px = Math.round(((s.width - s.gutter * 2) * b.width) / 100);
        const src = /^https?:\/\//i.test(b.src.trim()) ? b.src.trim() : '';
        const img = `<img src="${esc(src)}" alt="${esc(b.alt)}" width="${px}" style="display:inline-block;width:100%;max-width:${px}px;height:auto;border:0;outline:none;text-decoration:none;border-radius:${b.radius}px;">`;
        return row(`${pad}text-align:${b.align};font-size:0;line-height:0;`, b.href ? `<a href="${esc(safeUrl(b.href))}" target="_blank">${img}</a>` : img);
      }
      case 'columns': {
        const style = `${font}font-size:${b.fontSize}px;line-height:1.55;color:${b.color};`;
        const col = (md, side) =>
          `<td class="bn-col" width="50%" valign="top" style="width:50%;${side === 'l' ? 'padding-right:12px;' : 'padding-left:12px;'}">${paragraphs(md, style, s.brandColor)}</td>`;
        return row(pad, `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr>${col(b.left, 'l')}${col(b.right, 'r')}</tr></table>`);
      }
      case 'divider':
        return row(pad, `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td style="border-top:${b.thickness}px solid ${b.color};font-size:0;line-height:0;">&nbsp;</td></tr></table>`);
      case 'spacer':
        return `<tr><td style="height:${b.height}px;font-size:0;line-height:0;">&nbsp;</td></tr>`;
      case 'footer':
        return row(pad, paragraphs(b.text, `${font}font-size:12px;line-height:1.6;color:${b.color};text-align:${b.align};`, b.color));
    }
    return '';
  }

  /** Повний HTML-документ листа. */
  function renderEmail(d) {
    const s = cleanSettings(d.settings);
    const rows = d.blocks.map((b) => renderBlock(b, s)).join('\n');
    const edge = Math.min(s.gutter, 24);
    const preheader = s.preheader
      ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${s.bodyBg};opacity:0;">${esc(s.preheader)}${'&nbsp;&zwnj;'.repeat(40)}</div>`
      : '';
    return `<!DOCTYPE html>
<html lang="uk" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="x-apple-disable-message-reformatting">
<title>${esc(s.subject || 'Лист')}</title>
<style>
  body{margin:0;padding:0;width:100%!important;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}
  table{border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;}
  img{-ms-interpolation-mode:bicubic;}
  @media only screen and (max-width:${s.width + 20}px){
    .bn-container{width:100%!important;border-radius:0!important;}
    .bn-col{display:block!important;width:100%!important;padding:0 0 12px 0!important;}
  }
</style>
</head>
<body style="margin:0;padding:0;background:${s.bodyBg};">
${preheader}
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="${s.bodyBg}" style="background:${s.bodyBg};">
<tr><td align="center" style="padding:24px 0;">
<table role="presentation" class="bn-container" width="${s.width}" cellspacing="0" cellpadding="0" border="0" bgcolor="${s.contentBg}" style="width:${s.width}px;max-width:${s.width}px;background:${s.contentBg};border-radius:${s.radius}px;overflow:hidden;">
<tr><td style="height:${edge}px;font-size:0;line-height:0;">&nbsp;</td></tr>
${rows}
<tr><td style="height:${edge}px;font-size:0;line-height:0;">&nbsp;</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
  }

  /** Текстова версія листа (multipart/alternative). */
  function renderPlainText(d) {
    const md = (t) => t.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1').replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)');
    return d.blocks
      .map((b) => {
        switch (b.type) {
          case 'heading':
            return md(b.text).toUpperCase();
          case 'text':
          case 'footer':
            return md(b.text);
          case 'button':
            return `${b.label}: ${b.url}`;
          case 'image':
            return b.href ? `[${b.alt}] ${b.href}` : '';
          case 'columns':
            return `${md(b.left)}\n\n${md(b.right)}`;
          case 'divider':
            return '———';
          default:
            return '';
        }
      })
      .filter(Boolean)
      .join('\n\n');
  }

  window.BNEmail = { FONTS, LABELS, STARTERS, uid, defaultSettings, newBlock, cleanDesign, renderBlock, renderEmail, renderPlainText, esc };
})();
