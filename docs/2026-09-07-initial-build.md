# Initial Build Decision Log

Date: 2026-09-07

## What Was Built

- Built a single-page calorie tracker with Next.js, TypeScript, and Tailwind CSS.
- Added a searchable list of common foods with serving size, calories, protein, carbs, and fat.
- Added a daily food log for today's entries.
- Added daily calorie, protein, carb, and fat totals.
- Added add and delete actions for food log entries.
- Added local SQLite persistence so entries survive page refreshes.
- Added project documentation in `agents.md`.

## Technical Choices

### Next.js App Router

Next.js gives the app a simple structure for colocating the page and API routes.
The App Router keeps the UI at `/` and exposes persistence endpoints under `/api/log`.

### TypeScript

TypeScript was chosen to keep food data, API responses, and log entries explicit.
That reduces mistakes when the same nutrition fields move between the UI, API, and database.

### Tailwind CSS

Tailwind was chosen for fast, component-local styling without adding a larger design system.
The UI is intentionally compact and task-focused because the app is a daily tracking tool.

### SQLite With better-sqlite3

SQLite was chosen because the request called for a local database.
`better-sqlite3` keeps local development simple and writes to a file at `data/calorie-tracker.sqlite`.

### Snapshot Log Rows

Each logged entry stores the food name, serving size, and nutrition values directly.
This avoids old food log entries changing if the built-in food list is edited later.

## Database Shape

The initial table is `food_log_entries`.

It stores:

- entry id
- food id
- food name
- serving size
- calories
- protein
- carbs
- fat
- log date
- creation timestamp

An index on `log_date` and `created_at` supports loading today's log in display order.

## Known Limits

- The first version logs only today's date.
- Each add action records one serving.
- There is no custom food creation yet.
- There are no nutrition goals yet.

## Next Steps

- Add quantity controls.
- Add a date picker.
- Add custom foods.
- Add daily calorie and macro targets.
- Add import or export options.
