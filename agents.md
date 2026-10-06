# Calorie Tracker

## What It Does

Calorie Tracker is a local-first web app for logging daily food intake.
It has no login, no accounts, and no remote service dependency beyond optional Gemini nutrition lookup.

The app lets you:

- Search a built-in list of common foods.
- Select a meal category: Breakfast, Lunch, Dinner, or Snack.
- Add one serving to today's grouped food log.
- Look up estimated nutrition from meal text through Gemini and add confirmed foods.
- Upload or take a meal photo, preview it, and add confirmed Gemini-detected foods.
- See calories, protein, carbs, and fat for each food entry.
- View daily calorie goal progress with green, yellow, and red progress states.
- View macro totals and macro percentage bars.
- Enter height and body weight to estimate BMI and daily calorie needs.
- Compare logged calories against the suggested target.
- Delete logged entries.
- Keep the log across page refreshes through a local SQLite database.

## How To Run

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Build for production:

```bash
npm run build
```

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- React
- SQLite with `better-sqlite3`
- Lucide React icons
- Gemini AI nutrition lookup

## Folder Structure

```text
app/
  api/
    log/
      [id]/route.ts
      route.ts
    profile/
      route.ts
    nutrition/
      image/
        route.ts
      text/
        route.ts
  globals.css
  icon.svg
  layout.tsx
  page.tsx
lib/
  db.ts
  date.ts
  foods.ts
  gemini.ts
docs/
data/
  calorie-tracker.sqlite
PLAN.md
```

## Data Storage

The app stores logged food entries in:

```text
data/calorie-tracker.sqlite
```

The database is created automatically the first time the API is used.

Food log rows store a nutrition snapshot and meal category at the time of logging.
That keeps old entries stable if the built-in food list changes later.

The saved body profile is stored in the same database.
It keeps the latest height and weight for the local app user.

## BMI And Calorie Target

The body target panel calculates:

- BMI from height and weight.
- BMI category.
- Estimated maintenance calories as `weightKg * 30`.
- Suggested calories by adding 300 kcal for underweight BMI, subtracting 300 kcal for overweight or obesity, and keeping maintenance for normal BMI.

If no profile is saved, the UI shows a 2200 calorie planning goal.

## AI Nutrition API

The backend exposes two Gemini-powered nutrition lookup routes:

- `POST /api/nutrition/text` with JSON `{ "description": "grilled chicken with rice" }`.
- `POST /api/nutrition/image` with multipart form field `image` and optional `description`.

Both routes return structured estimated foods, serving sizes, calories, macros, confidence, totals, and notes.
The frontend shows AI results for review before saving them to the selected meal category.

## Next Steps

- Deploy to Vercel.
- Add food history charts.
- Add user preferences.
- Add barcode scanning.
