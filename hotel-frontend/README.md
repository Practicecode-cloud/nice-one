# Grand Aurelia — Hotel Management System Frontend

A complete, framework-free HTML/CSS/JS frontend for your Node/Express + PostgreSQL
hotel management backend. Every one of the 16 routes / 16 tables is fully wired up
with live Create, Read, Update, and Delete — nothing is mocked.

## Files

```
index.html          Entry point — open this with Live Server
css/style.css        Full design system (navbar, dashboard, tables, modal, charts, gallery)
js/config.js          API base URL + full config for all 16 modules (fields, columns, FK dropdowns)
js/api.js             Generic fetch wrapper (GET/POST/PUT/DELETE) with a small cache
js/render.js           Generic table + Add/Edit modal engine driven entirely by config.js
js/dashboard.js        Live stat cards + pie/bar charts (Chart.js) + auto-refresh
js/app.js              Horizontal navbar, routing, global search, gallery page
```

## 1. Start your backend

```bash
cd managementsystem/Api
npm install
node server.js
```

Make sure your `.env` has a working `DATABASE_URL` for your Neon/Postgres instance,
and that all 16 tables referenced by the routes exist (Hotel, Branch, RoomType, Room,
Guest, Reservation, CheckIn, CheckOut, Department, Employee, Service, GuestService,
Bill, Payment, Housekeeping, Maintenance). The backend listens on **port 5000** by
default and already has CORS enabled, so the frontend (served from a different port
by Live Server) can call it without issues.

## 2. Point the frontend at your backend

Open `js/config.js` and check the first line:

```js
const API_BASE = 'http://localhost:5000/api';
```

Change the host/port here if your backend runs elsewhere.

## 3. Run the frontend

Open `index.html` with VS Code's **Live Server** extension (or any static file
server). Do not open it with `file://` directly — the fetch calls work best served
over `http://localhost`.

That's it — the Dashboard, all 16 CRUD modules, and the Gallery are now live against
your real database. Add/edit/delete anything and it will persist to Postgres and
show up instantly across the app (including the dashboard charts).

## What's included

- **Live dashboard** — stat cards, a room-status donut chart, a reservation-status
  pie chart, a payments-by-method bar chart, an employees-per-department bar chart,
  and a recent-reservations table. It polls every 30s and also refreshes instantly
  after any add/edit/delete anywhere in the app.
- **All 16 modules** with full CRUD: Hotels, Branches, Room Types, Rooms, Guests,
  Reservations, Check-Ins, Check-Outs, Services, Guest Services, Bills, Payments,
  Departments, Employees, Housekeeping, Maintenance.
- **Smart forms** — foreign key fields (e.g. a Reservation's Guest or Room) render
  as dropdowns populated live from the related table, so you can never enter an
  invalid ID.
- **Search & filter** on every table, plus a global quick-search in the navbar that
  looks up guests, rooms, and reservations as you type.
- **Horizontal navbar** with grouped dropdown menus (Property Setup, Guests &
  Bookings, Services & Billing, Staff & Operations) and a Gallery page.
- **Toasts** for success/error feedback and a live connection indicator (green =
  API reachable, red = not) on the dashboard hero.

## Notes

- Decorative photography (hero banner, gallery, etc.) is pulled from Picsum Photos
  placeholder images — swap the `picsum.photos/seed/...` URLs in `app.js` /
  `style.css` for your own property photos any time.
- No build step, no npm install needed for the frontend — it's plain HTML/CSS/JS.
