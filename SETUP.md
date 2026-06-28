# POS System — Setup Guide

## What You Need (Prerequisites)

| Software | Version | Why |
|----------|---------|-----|
| **Node.js** | 20 LTS | Runs the backend and frontend |
| **PostgreSQL** | 16+ | Database |
| **Git** | Any | To clone the project (or just copy the folder) |

---

## Step 1 — Install Node.js

Download Node.js 20 LTS from: https://nodejs.org/en/download

Pick the **Windows Installer (.msi)** — 64-bit.

> During install: check "Automatically install the necessary tools" — some packages need it.

Verify:
```
node --version
npm --version
```

---

## Step 2 — Install PostgreSQL 16

Download from: https://www.postgresql.org/download/windows/

During install leave everything default. **Remember the password** you set for the `postgres` user.

### Create the database

Open **SQL Shell (psql)** from Start Menu. Press Enter for all defaults, enter your postgres password, then:

```sql
CREATE DATABASE pos_db;
\q
```

---

## Step 3 — Get the Project

Copy the `POS` folder to the target PC (e.g. `D:\POS`).

---

## Step 4 — Configure Environment

### Backend `.env`

If `backend\.env` doesn't exist, copy the example:

```
copy backend\.env.example backend\.env
```

Edit `backend\.env`:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/pos_db"
JWT_SECRET=your_random_string_at_least_32_characters_here
REFRESH_TOKEN_SECRET=another_different_random_string_at_least_32_chars
```

- Replace `YOUR_PASSWORD` with your PostgreSQL password
- Replace the JWT secrets with long random strings (mash the keyboard for 40+ characters)

### Frontend `.env`

Already configured for local use — no changes needed:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## Step 5 — Install Dependencies

```bash
cd backend
npm install
cd ..\frontend
npm install
cd ..
```

Takes 2-5 minutes.

---

## Step 6 — Set Up the Database

```bash
cd backend
npx prisma migrate deploy
npx prisma db seed
```

- **`migrate deploy`** — creates all tables, columns, indexes, and relations
- **`db seed`** — inserts one starter row in every table (admin user, sample product, sample vendor, etc.)

> This only needs to be run once. After this, all data comes from using the app.

### Available seeders

| Command | What it creates |
|---------|----------------|
| `npx prisma db seed` | **Minimal** (default) — 1 row per table, empty starter |
| `npm run seed` | **Full** — 440 products, 25 categories, demo vendor, realistic data |

---

## Step 7 — Start the App

Double-click **`start.bat`** in the project folder.

- Backend starts on `http://localhost:5000`
- Frontend starts on `http://localhost:5173`
- After a few seconds, the app opens in its own window

To stop: double-click **`stop.bat`**.

---

## Default Logins

| Role | Username | Password | Permissions |
|------|----------|----------|-------------|
| **Admin** | `admin` | `admin` | Everything — products, users, reports, settings |
| **Cashier** | `cashier` | `cashier123` | POS sales, view products, view inventory, customers |

> Change passwords after first login: Users → Edit → set new password.

---

## Folder Structure

```
POS/
├── start.bat          ← Double-click to run
├── stop.bat           ← Double-click to stop
├── SETUP.md           ← This file
├── backend/
│   ├── .env           ← Database + JWT config
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.js         ← Full seeder (440 products)
│   │   ├── seed-minimal.js ← Minimal seeder (1 per table)
│   │   └── migrations/
│   └── src/           ← Express API code
└── frontend/
    ├── .env           ← API URL config
    └── src/           ← React app code
```

---

## Troubleshooting

### "Cannot connect to database"
- Is PostgreSQL running? Open Services → `postgresql-x64-16` should be "Running"
- Is the password correct in `backend\.env`?
- Is the database named `pos_db`? Check in pgAdmin or psql

### "Port 5000 / 5173 is already in use"
- Change `PORT` in `backend\.env`
- Or change `port` in `frontend\vite.config.ts`

### "npm install fails"
- Try: `npm cache clean --force` then retry
- Verify Node.js 20: `node --version`

### App opens in browser not app window
- Microsoft Edge is needed for the frameless app window. If not installed, the app opens in your default browser instead. Same functionality either way.

### White screen after login
- Press F12 → Console tab → look for errors
- Usually means the backend isn't running or the database is down

### "PrismaClientInitializationError"
- The `.env` file is missing or `DATABASE_URL` is wrong
- Check PostgreSQL is running and the password is correct

---

## Production / Shop Floor Checklist

1. **Change passwords** — Admin → Users → change admin and cashier passwords
2. **Set passcodes** — Settings → Passcodes → set PINs for END_OF_DAY, PROFIT_VIEW, STOCK_UPDATE
3. **Customize shop** — Settings → shop name, address, receipt header/footer, currency, tax label
4. **Desktop shortcut** — Right-click `start.bat` → Create Shortcut → drag to Desktop
5. **Auto-start on boot** — `Win + R` → `shell:startup` → drag shortcut into that folder

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Tailwind CSS, Vite |
| Backend | Express, Prisma ORM |
| Database | PostgreSQL 16 |
| Auth | JWT (access + refresh tokens) |
| Offline | Dexie.js (IndexedDB queue) |
| PWA | vite-plugin-pwa (installable as app) |
