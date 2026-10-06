# Gemini Nutrition API Decision Log

Date: 2026-09-07

## What Was Added

- Added a shared Gemini helper for nutrition estimation.
- Added `POST /api/nutrition/text` for meal-description nutrition lookup.
- Added `POST /api/nutrition/image` for meal-photo nutrition lookup.
- Kept the frontend unchanged for this backend-only step.
- Returned structured foods, serving sizes, calories, macros, confidence, totals, and notes.

## Technical Choices

### Gemini REST API

The backend calls Gemini directly with `fetch` instead of adding a Google SDK dependency.
This keeps the project dependency set smaller and makes the HTTP contract explicit.

### Model

The routes use `gemini-2.5-flash-lite`.
It was chosen because the requested task is lightweight extraction and estimation.

### Structured Output

The Gemini request sets `responseMimeType` to `application/json` and provides a response schema.
That keeps the API response predictable for the future frontend integration.

### Server-Only API Key

The `GEMINI_API_KEY` value is read only from server-side route code.
It is never sent to the browser.

### Image Uploads

Meal photos are accepted as multipart form data under the `image` field.
Images are sent to Gemini as inline base64 data and capped at 8 MB to avoid oversized requests.

## API Shapes

Text lookup:

```http
POST /api/nutrition/text
Content-Type: application/json

{ "description": "grilled chicken with rice and salad" }
```

Image lookup:

```http
POST /api/nutrition/image
Content-Type: multipart/form-data

image=<meal photo>
description=<optional context>
```

Both routes return:

```json
{
  "estimate": {
    "source": "text",
    "foods": [],
    "totals": {
      "calories": 0,
      "protein": 0,
      "carbs": 0,
      "fat": 0
    },
    "notes": []
  }
}
```

## Known Limits

- Nutrition values are AI estimates, not verified database facts.
- Image estimates depend on photo quality and visible portions.
- The frontend does not call these routes yet.
- AI lookup results are not saved to the food log yet.

## Next Steps

- Add text lookup controls to the frontend.
- Add image upload controls to the frontend.
- Let users review AI estimates before adding them to the daily log.
- Store accepted AI estimates as normal food log entries.
