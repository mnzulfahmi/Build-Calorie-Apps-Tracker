import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "calorie-tracker.sqlite");

let db: Database.Database | null = null;

export type LogEntry = {
  id: string;
  foodId: string;
  mealCategory: string;
  name: string;
  servingSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  logDate: string;
  createdAt: string;
};

export type BodyProfile = {
  heightCm: number;
  weightKg: number;
  updatedAt: string;
};

type DbLogRow = {
  id: string;
  food_id: string;
  meal_category?: string;
  name: string;
  serving_size: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  log_date: string;
  created_at: string;
};

type DbProfileRow = {
  height_cm: number;
  weight_kg: number;
  updated_at: string;
};

export function getDb() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!db) {
    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    db.exec(`
      CREATE TABLE IF NOT EXISTS food_log_entries (
        id TEXT PRIMARY KEY,
        food_id TEXT NOT NULL,
        meal_category TEXT NOT NULL DEFAULT 'Snack',
        name TEXT NOT NULL,
        serving_size TEXT NOT NULL,
        calories INTEGER NOT NULL,
        protein REAL NOT NULL,
        carbs REAL NOT NULL,
        fat REAL NOT NULL,
        log_date TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_food_log_entries_log_date_created_at
      ON food_log_entries (log_date, created_at);

      CREATE TABLE IF NOT EXISTS body_profile (
        id TEXT PRIMARY KEY,
        height_cm REAL NOT NULL,
        weight_kg REAL NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    const columns = db.pragma("table_info(food_log_entries)") as { name: string }[];
    if (!columns.some((column) => column.name === "meal_category")) {
      db.prepare("ALTER TABLE food_log_entries ADD COLUMN meal_category TEXT NOT NULL DEFAULT 'Snack'").run();
    }
  }

  return db;
}

export function mapLogRow(row: DbLogRow): LogEntry {
  return {
    id: row.id,
    foodId: row.food_id,
    mealCategory: row.meal_category ?? "Snack",
    name: row.name,
    servingSize: row.serving_size,
    calories: row.calories,
    protein: row.protein,
    carbs: row.carbs,
    fat: row.fat,
    logDate: row.log_date,
    createdAt: row.created_at,
  };
}

export function mapProfileRow(row: DbProfileRow): BodyProfile {
  return {
    heightCm: row.height_cm,
    weightKg: row.weight_kg,
    updatedAt: row.updated_at,
  };
}
