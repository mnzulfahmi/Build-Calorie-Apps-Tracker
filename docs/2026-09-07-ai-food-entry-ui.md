# AI Food Entry UI Decision Log

Date: 2026-09-07

## What Changed

- Connected Gemini text nutrition lookup to the frontend.
- Connected Gemini image nutrition lookup to the frontend.
- Added a photo upload control with image preview.
- Added loading states while Gemini estimates nutrition.
- Added friendly error handling for failed AI requests.
- Added review cards for AI-detected foods before saving.
- Added buttons to save one AI-estimated food or all detected foods.
- Extended the food log API so AI nutrition snapshots save to SQLite.

## Technical Choices

### Three Add Paths

The app now supports quick-add, text lookup, and photo lookup.
Quick-add remains unchanged for fast common foods.
AI lookup paths are additive and do not replace the hardcoded list.

### Review Before Save

Gemini estimates are staged in the UI before writing to the database.
This lets the user confirm each detected food item, especially when a photo contains multiple foods.

### Same Log Table

AI foods are saved through the existing `food_log_entries` table.
The log row stores the estimated food name, serving size, calories, protein, carbs, and fat as a snapshot.
This keeps quick-add and AI-added foods visible in the same daily log.

### Frontend Upload Preview

Meal photos are previewed using a browser object URL.
The file itself is sent directly to `/api/nutrition/image` as multipart form data only when the user clicks analyze.

### Error And Loading States

Each AI lookup path has its own loading state.
Errors are shown in the existing page-level alert so the user gets a plain message without losing their current input.

## Known Limits

- AI estimates cannot be edited before saving yet.
- Adding all AI foods writes entries one at a time.
- Saved AI entries use `ai-estimate` as the internal food id.
- Image accuracy depends on visible portions and photo quality.

## Next Steps

- Add edit controls for AI estimates before saving.
- Add a single batch-save endpoint for multiple estimated foods.
- Add source labels in the daily log for quick-add vs AI entries.
- Add optional photo context entered by the user.
