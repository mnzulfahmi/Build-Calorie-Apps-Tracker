import { NextResponse } from "next/server";
import { requestNutritionEstimate } from "@/lib/gemini";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

function inferImageMimeType(file: File) {
  if (file.type.startsWith("image/")) {
    return file.type;
  }

  const extension = file.name.toLowerCase().split(".").pop();
  if (extension === "jpg" || extension === "jpeg") {
    return "image/jpeg";
  }
  if (extension === "png") {
    return "image/png";
  }
  if (extension === "webp") {
    return "image/webp";
  }
  if (extension === "gif") {
    return "image/gif";
  }

  return null;
}

export async function POST(request: Request) {
  const formData = await request.formData().catch(() => null);
  const file = formData?.get("image");
  const description = formData?.get("description");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Upload an image file using the 'image' field." }, { status: 400 });
  }

  const mimeType = inferImageMimeType(file);

  if (!mimeType) {
    return NextResponse.json({ error: "Uploaded file must be an image." }, { status: 400 });
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "Image must be 8 MB or smaller." }, { status: 400 });
  }

  const imageBytes = Buffer.from(await file.arrayBuffer()).toString("base64");
  const optionalDescription = typeof description === "string" ? description.trim() : "";

  try {
    const estimate = await requestNutritionEstimate({
      source: "image",
      parts: [
        {
          text:
            "Identify the visible meal components in this photo and estimate nutrition for the whole meal. " +
            "Return each likely food component separately. Do not invent hidden ingredients. " +
            (optionalDescription ? `Additional user context: "${optionalDescription}".` : ""),
        },
        {
          inlineData: {
            mimeType,
            data: imageBytes,
          },
        },
      ],
    });

    return NextResponse.json({ estimate });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Image nutrition lookup failed." },
      { status: 502 }
    );
  }
}
