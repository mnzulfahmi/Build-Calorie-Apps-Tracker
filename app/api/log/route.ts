import { NextRequest, NextResponse } from "next/server";
import { getDb, mapLogRow } from "@/lib/db";
import { getTodayDate } from "@/lib/date";
import { foods } from "@/lib/foods";

export const runtime = "nodejs";

const mealCategories = ["Breakfast", "Lunch", "Dinner", "Snack"] as const;

function isDateString(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function getMealCategory(value: unknown) {
  return typeof value === "string" && mealCategories.includes(value as (typeof mealCategories)[number])
    ? value
    : "Snack";
}

export async function GET(request: NextRequest) {
  const dateParam = request.nextUrl.searchParams.get("date");
  const logDate = dateParam && isDateString(dateParam) ? dateParam : getTodayDate();
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT id, food_id, meal_category, name, serving_size, calories, protein, carbs, fat, log_date, created_at
       FROM food_log_entries
       WHERE log_date = ?
       ORDER BY created_at DESC`
    )
    .all(logDate);

  const entries = rows.map((row) => mapLogRow(row as Parameters<typeof mapLogRow>[0]));
  const totals = entries.reduce(
    (sum, entry) => ({
      calories: sum.calories + entry.calories,
      protein: sum.protein + entry.protein,
      carbs: sum.carbs + entry.carbs,
      fat: sum.fat + entry.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return NextResponse.json({ date: logDate, entries, totals });
}

export async function DELETE(request: NextRequest) {
  const dateParam = request.nextUrl.searchParams.get("date");
  const logDate = dateParam && isDateString(dateParam) ? dateParam : getTodayDate();
  const result = getDb()
    .prepare("DELETE FROM food_log_entries WHERE log_date = ?")
    .run(logDate);

  return NextResponse.json({ ok: true, deleted: result.changes, date: logDate });
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as {
    foodId?: string;
    entry?: {
      name?: unknown;
      servingSize?: unknown;
      calories?: unknown;
      protein?: unknown;
      carbs?: unknown;
      fat?: unknown;
    };
    mealCategory?: unknown;
    date?: string;
  } | null;

  if (!body?.foodId && !body?.entry) {
    return NextResponse.json({ error: "Food is required." }, { status: 400 });
  }

  const food = body.foodId ? foods.find((item) => item.id === body.foodId) : null;
  const customEntry = body.entry;

  if (body.foodId && !food) {
    return NextResponse.json({ error: "Food was not found." }, { status: 404 });
  }

  if (customEntry) {
    const isValidEntry =
      typeof customEntry.name === "string" &&
      typeof customEntry.servingSize === "string" &&
      typeof customEntry.calories === "number" &&
      typeof customEntry.protein === "number" &&
      typeof customEntry.carbs === "number" &&
      typeof customEntry.fat === "number" &&
      customEntry.name.trim().length > 0 &&
      customEntry.servingSize.trim().length > 0 &&
      Number.isFinite(customEntry.calories) &&
      Number.isFinite(customEntry.protein) &&
      Number.isFinite(customEntry.carbs) &&
      Number.isFinite(customEntry.fat) &&
      customEntry.calories >= 0 &&
      customEntry.protein >= 0 &&
      customEntry.carbs >= 0 &&
      customEntry.fat >= 0;

    if (!isValidEntry) {
      return NextResponse.json({ error: "Nutrition entry is invalid." }, { status: 400 });
    }
  }

  const entry = food
    ? food
    : {
        id: "ai-estimate",
        name: String(customEntry?.name).trim(),
        servingSize: String(customEntry?.servingSize).trim(),
        calories: Math.round(Number(customEntry?.calories)),
        protein: Number(customEntry?.protein),
        carbs: Number(customEntry?.carbs),
        fat: Number(customEntry?.fat),
      };

  const logDate = body.date && isDateString(body.date) ? body.date : getTodayDate();
  const mealCategory = getMealCategory(body.mealCategory);
  const createdAt = new Date().toISOString();
  const id = crypto.randomUUID();

  getDb()
    .prepare(
      `INSERT INTO food_log_entries (
        id, food_id, meal_category, name, serving_size, calories, protein, carbs, fat, log_date, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      id,
      entry.id,
      mealCategory,
      entry.name,
      entry.servingSize,
      entry.calories,
      entry.protein,
      entry.carbs,
      entry.fat,
      logDate,
      createdAt
    );

  return NextResponse.json(
    {
      entry: {
        id,
        foodId: entry.id,
        mealCategory,
        name: entry.name,
        servingSize: entry.servingSize,
        calories: entry.calories,
        protein: entry.protein,
        carbs: entry.carbs,
        fat: entry.fat,
        logDate,
        createdAt,
      },
    },
    { status: 201 }
  );
}
