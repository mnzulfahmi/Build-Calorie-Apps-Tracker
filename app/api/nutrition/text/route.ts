import { NextResponse } from "next/server";
import { requestNutritionEstimate } from "@/lib/gemini";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    description?: unknown;
  } | null;

  const description = typeof body?.description === "string" ? body.description.trim() : "";

  if (description.length < 3 || description.length > 1000) {
    return NextResponse.json(
      { error: "Description must be between 3 and 1000 characters." },
      { status: 400 }
    );
  }

  try {
    const estimate = await requestNutritionEstimate({
      source: "text",
      parts: [
        {
          text:
            `Estimate nutrition for this meal description: "${description}". ` +
            "Return each likely food component separately and totals for the whole meal.",
        },
      ],
    });

    return NextResponse.json({ estimate });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nutrition lookup failed." },
      { status: 502 }
    );
  }
}
