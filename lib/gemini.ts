const GEMINI_MODEL = "gemini-2.5-flash-lite";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export type NutritionFoodEstimate = {
  name: string;
  servingSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: "low" | "medium" | "high";
};

export type NutritionEstimate = {
  source: "text" | "image";
  foods: NutritionFoodEstimate[];
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  notes: string[];
};

type GeminiPart = {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
};

type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
    finishReason?: string;
  }>;
  promptFeedback?: {
    blockReason?: string;
  };
  error?: {
    message?: string;
  };
};

const nutritionResponseSchema = {
  type: "OBJECT",
  properties: {
    source: {
      type: "STRING",
      enum: ["text", "image"],
    },
    foods: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          servingSize: { type: "STRING" },
          calories: { type: "INTEGER" },
          protein: { type: "NUMBER" },
          carbs: { type: "NUMBER" },
          fat: { type: "NUMBER" },
          confidence: {
            type: "STRING",
            enum: ["low", "medium", "high"],
          },
        },
        required: ["name", "servingSize", "calories", "protein", "carbs", "fat", "confidence"],
        propertyOrdering: ["name", "servingSize", "calories", "protein", "carbs", "fat", "confidence"],
      },
    },
    totals: {
      type: "OBJECT",
      properties: {
        calories: { type: "INTEGER" },
        protein: { type: "NUMBER" },
        carbs: { type: "NUMBER" },
        fat: { type: "NUMBER" },
      },
      required: ["calories", "protein", "carbs", "fat"],
      propertyOrdering: ["calories", "protein", "carbs", "fat"],
    },
    notes: {
      type: "ARRAY",
      items: { type: "STRING" },
    },
  },
  required: ["source", "foods", "totals", "notes"],
  propertyOrdering: ["source", "foods", "totals", "notes"],
};

function getApiKey() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  return apiKey;
}

function extractJsonText(response: GeminiGenerateContentResponse) {
  if (response.error?.message) {
    throw new Error(response.error.message);
  }

  if (response.promptFeedback?.blockReason) {
    throw new Error(`Gemini blocked the request: ${response.promptFeedback.blockReason}.`);
  }

  const text = response.candidates?.[0]?.content?.parts
    ?.map((part) => part.text)
    .filter(Boolean)
    .join("");

  if (!text) {
    throw new Error("Gemini did not return nutrition data.");
  }

  return text;
}

function normalizeEstimate(value: NutritionEstimate, source: "text" | "image"): NutritionEstimate {
  const foods = Array.isArray(value.foods)
    ? value.foods.map((food) => ({
        name: food.name,
        servingSize: food.servingSize,
        calories: Math.max(0, Math.round(food.calories)),
        protein: Math.max(0, Number(food.protein)),
        carbs: Math.max(0, Number(food.carbs)),
        fat: Math.max(0, Number(food.fat)),
        confidence: food.confidence,
      }))
    : [];

  const totals = foods.reduce(
    (sum, food) => ({
      calories: sum.calories + food.calories,
      protein: sum.protein + food.protein,
      carbs: sum.carbs + food.carbs,
      fat: sum.fat + food.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return {
    source,
    foods,
    totals: {
      calories: totals.calories,
      protein: Math.round(totals.protein * 10) / 10,
      carbs: Math.round(totals.carbs * 10) / 10,
      fat: Math.round(totals.fat * 10) / 10,
    },
    notes: Array.isArray(value.notes) ? value.notes.filter((note) => typeof note === "string") : [],
  };
}

export async function requestNutritionEstimate({
  source,
  parts,
}: {
  source: "text" | "image";
  parts: GeminiPart[];
}) {
  const response = await fetch(GEMINI_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": getApiKey(),
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [
          {
            text:
              "You estimate nutrition for a calorie tracker. Return cautious, realistic estimates only. " +
              "Use common serving sizes when exact quantities are missing. For unclear foods, include a low confidence item and explain uncertainty in notes. " +
              "Calories must be whole kcal. Protein, carbs, and fat are grams.",
          },
        ],
      },
      contents: [
        {
          role: "user",
          parts,
        },
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: nutritionResponseSchema,
      },
    }),
  });

  const payload = (await response.json().catch(() => null)) as GeminiGenerateContentResponse | null;

  if (!response.ok) {
    throw new Error(payload?.error?.message ?? `Gemini request failed with status ${response.status}.`);
  }

  if (!payload) {
    throw new Error("Gemini returned an invalid response.");
  }

  const jsonText = extractJsonText(payload);
  const parsed = JSON.parse(jsonText) as NutritionEstimate;

  return normalizeEstimate(parsed, source);
}
