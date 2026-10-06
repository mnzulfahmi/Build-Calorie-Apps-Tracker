# BMI Calorie Target Decision Log

Date: 2026-09-07

## What Was Built

- Added a body target panel to the calorie tracker.
- Added height and weight inputs.
- Added BMI calculation and BMI category display.
- Added a suggested daily calorie target.
- Added remaining calories against today's logged calories.
- Persisted the latest height and weight in the local SQLite database.

## Technical Choices

### Height And Weight Only

The first version uses only height and weight because that matches the requested input.
A more accurate full TDEE calculator would need age, sex, and activity level.

### Simple Calorie Estimate

Maintenance calories are estimated as `weightKg * 30`.
The suggested target adjusts that estimate by BMI category:

- Underweight: maintenance plus 300 kcal.
- Normal: maintenance.
- Overweight or obesity: maintenance minus 300 kcal.

This keeps the feature simple and transparent.

### Local Profile Persistence

The app adds a `body_profile` table with a single `default` row.
That preserves the account-free model while letting height and weight survive refreshes.

### API Boundary

The new `/api/profile` route owns reading and saving profile data.
The page stays focused on rendering, user input, and calculation display.

## Known Limits

- The calorie target is an estimate, not medical advice.
- The app does not calculate full TDEE yet.
- The app does not support separate profiles or accounts.
- Height uses centimeters and weight uses kilograms only.

## Next Steps

- Add optional age, sex, and activity level inputs.
- Let users choose maintain, lose, or gain as a goal.
- Add target-aware progress styling.
- Add support for imperial units.
