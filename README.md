
<div align="center">

# 

### AI-powered Opportunity Network for businesses, professionals, and partnerships

<p align="center">
 <img width="1586" height="992" alt="a187d605-50b0-44a0-a02a-6df8b613e747" src="https://github.com/user-attachments/assets/43bbff47-5833-4ce7-9012-e64cd1c0f4aa" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-MVP-blue" alt="status" />
  <img src="https://img.shields.io/badge/platform-Web%20%2B%20PWA-2563EB" alt="platform" />
  <img src="https://img.shields.io/badge/frontend-Next.js-black" alt="Next.js" />
  <img src="https://img.shields.io/badge/backend-Supabase-3ECF8E" alt="Supabase" />
  <img src="https://img.shields.io/badge/database-PostgreSQL-336791" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/design-Clean%20%26%20Professional-0F172A" alt="design" />
</p>

<p align="center">
  <b>Find the right people, companies, and opportunities — all in one place.</b>
</p>

</div>

---

## ✨ Overview

**Business Navigator** is an **Opportunity Network** designed for:

- small and medium businesses
- specialists and contractors
- recruiters
- partners and suppliers
- investors
- communities and business clubs

The platform helps users:

- create a **personal** or **company** profile
- publish **Need / Offer**
- discover relevant **opportunities**
- receive smart **matches**
- understand **why the match fits**
- take action through **Connect / Apply / Request Intro**

This is the first step toward a bigger vision:  
**Business Navigator → Business Operating Network**

---

## 🚀 Core Idea

Most business opportunities are fragmented across:

- LinkedIn
- Work platforms
- Telegram groups
- Facebook communities
- Google search
- personal networks

**Business Navigator** brings these flows together into one product.

### Core flow

```text
Profile → Need / Offer → Search / Opportunities → Match → Why this match → Connect / Apply / Request Intro
```

---

## 🛠 Запуск локально (гілка `Max_Auth_Profile_Catalog`)

**Стек:** frontend — React + Tailwind CSS + TypeScript (Vite) · backend — NestJS + TypeScript (TypeORM).
База за замовчуванням — локальний файл SQLite (`backend/data/`), нічого додатково встановлювати не треба.
Для PostgreSQL задайте `DATABASE_URL` (див. `backend/.env.example`).

Потрібен **Node.js 20+**.

```bash
npm run setup     # встановити залежності (корінь + backend + frontend)
npm run dev       # API на http://localhost:3000/api, сайт на http://localhost:5173
```

При першому запуску база заповнюється демо-даними. Демо-акаунт: `olena@demo.bn` / `demo1234`.
`npm run seed:reset` — перестворити базу з демо-даними.

### Що реалізовано (задачі Max)

| Модуль | Сторінка | API |
|---|---|---|
| Реєстрація та вхід | `/register`, `/login` | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` (JWT) |
| Профіль людини: ім'я, місто, роль, навички, опис | `/people/:id`, `/profile/edit` | `GET /api/users/:id`, `PATCH /api/users/me` |
| Каталог: люди, компанії, можливості одним списком | `/catalog` (вкладки за типом) | `GET /api/catalog?type=person\|company\|opportunity`, `GET /api/catalog/counts` |
| Список ФОП | `/fop` | `GET /api/fop` |

Компанії та можливості в каталозі поки беруться з демо-даних — їх створення/сторінки — окремі задачі (Профіль компанії, Можливості).
