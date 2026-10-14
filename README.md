# Task Manager

One Laravel app that serves both the JSON API and the React UI.

```
app/, routes/, database/   Laravel API (routes/api.php, everything under /api)
resources/js/              React app (entry: main.jsx)
resources/css/app.css      Styles
resources/views/app.blade.php  The single page every non-API URL returns
docs/                      Database design (DATABASE.md, schema.sql) and screenshots
```

## Setup

Needs PHP 8.3+, Composer, Node 20+ and MySQL (see `DB_*` in `.env`).

```bash
composer setup          # composer install, .env, app key, migrations, npm install, build
php artisan db:seed     # optional demo data
```

## Run

```bash
npm run dev             # Laravel (php artisan serve) + Vite with hot reload
```

Open http://localhost:8000. `composer dev` does the same thing.

For a production-style run, build once and only Laravel is needed:

```bash
npm run build
php artisan serve
```

## Test

```bash
php artisan test
```

The optional AI task assistant needs `ANTHROPIC_API_KEY` in `.env`.
