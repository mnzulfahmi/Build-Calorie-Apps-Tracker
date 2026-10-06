import { NextResponse } from "next/server";
import { getDb, mapProfileRow } from "@/lib/db";

export const runtime = "nodejs";

function isValidProfileInput(heightCm: unknown, weightKg: unknown) {
  return (
    typeof heightCm === "number" &&
    typeof weightKg === "number" &&
    Number.isFinite(heightCm) &&
    Number.isFinite(weightKg) &&
    heightCm >= 80 &&
    heightCm <= 260 &&
    weightKg >= 20 &&
    weightKg <= 400
  );
}

export async function GET() {
  const row = getDb()
    .prepare("SELECT height_cm, weight_kg, updated_at FROM body_profile WHERE id = ?")
    .get("default");

  return NextResponse.json({
    profile: row ? mapProfileRow(row as Parameters<typeof mapProfileRow>[0]) : null,
  });
}

export async function PUT(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    heightCm?: unknown;
    weightKg?: unknown;
  } | null;

  if (!body || !isValidProfileInput(body.heightCm, body.weightKg)) {
    return NextResponse.json(
      { error: "Enter a height from 80-260 cm and weight from 20-400 kg." },
      { status: 400 }
    );
  }

  const updatedAt = new Date().toISOString();
  getDb()
    .prepare(
      `INSERT INTO body_profile (id, height_cm, weight_kg, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         height_cm = excluded.height_cm,
         weight_kg = excluded.weight_kg,
         updated_at = excluded.updated_at`
    )
    .run("default", body.heightCm, body.weightKg, updatedAt);

  return NextResponse.json({
    profile: {
      heightCm: body.heightCm,
      weightKg: body.weightKg,
      updatedAt,
    },
  });
}
