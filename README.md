# Pantry

Keep track of what's in the cupboard, and share it with the people you live with.

- Pantry items with quantity, unit, category, expiry date, notes and a photo
- Shared households: invite housemates by email
- Search and sort, with expiring items highlighted
- Import a recipe from a link and see which ingredients you still need to buy
- Export a household's pantry as CSV

## Stack

- **Server:** Express 5 on Node.js 22, SQLite via the built-in `node:sqlite` module
- **Web:** React 19, built with Vite
- **Tests:** Vitest

## Getting started

Requires Node.js 22.13 or later.

```sh
npm ci
npm run build
npm start            # http://localhost:3100
```

For development, run the API and the Vite dev server side by side:

```sh
npm run dev          # API on :3100, restarts on change
npm run dev:web      # UI on :5173, proxies /api to :3100
```

Run the tests with `npm test`.

## Configuration

| Variable         | Default              | Description                               |
| ---------------- | -------------------- | ----------------------------------------- |
| `PORT`           | `3100`               | HTTP port                                 |
| `DATA_DIR`       | `./data`             | Where the database and photos are stored  |
| `SESSION_SECRET` | random per process   | Secret used to sign session cookies       |
| `APP_URL`        | `http://localhost:3100` | Public URL, used in password reset emails |

Set `SESSION_SECRET` in production so sessions survive restarts.

## Backups

`npm run backup` copies `data/pantry.db` into `backups/` using the `sqlite3` CLI.
Pass a source and destination to override: `npm run backup -- data/pantry.db /mnt/backups/pantry.db`.

## API overview

| Method | Path                                         | Description                    |
| ------ | -------------------------------------------- | ------------------------------ |
| POST   | `/api/auth/register`                         | Create an account              |
| POST   | `/api/auth/login`                            | Sign in (JSON or form post)    |
| POST   | `/api/auth/logout`                           | Sign out                       |
| POST   | `/api/auth/password-reset`                   | Email a reset link             |
| POST   | `/api/auth/password-reset/confirm`           | Set a new password             |
| GET    | `/api/me` · PATCH `/api/me`                  | Profile                        |
| GET    | `/api/households`                            | Households you belong to       |
| POST   | `/api/households/:id/members`                | Invite someone (owner only)    |
| GET    | `/api/households/:id/items?q=&sort=&order=`  | List and search items          |
| POST   | `/api/households/:id/items`                  | Add an item                    |
| GET    | `/api/items/:id` · PATCH · DELETE            | Read, edit or remove an item   |
| POST   | `/api/items/:id/photo`                       | Upload a photo (multipart)     |
| GET    | `/api/photos/:filename`                      | Fetch a photo                  |
| POST   | `/api/households/:id/recipes/import`         | Import a recipe from a URL     |
| GET    | `/api/households/:id/export.csv`             | Download items as CSV          |
| GET    | `/api/admin/users` · `/api/admin/stats`      | Admin views                    |
