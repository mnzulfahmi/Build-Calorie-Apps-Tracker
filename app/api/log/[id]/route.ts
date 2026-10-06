import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = getDb()
    .prepare("DELETE FROM food_log_entries WHERE id = ?")
    .run(id);

  if (result.changes === 0) {
    return NextResponse.json({ error: "Entry was not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
