# Seed Data Management

## Purpose
Manage the 50 hard-coded Vietnamese dishes and food tags for the Food Match database.

## Steps
1. Edit `DataSeeder.cs` in Infrastructure/Data/Seed/
2. Add/modify food entries with: name, category (kho/nuoc), cuisine_type, image_url, avg_price_range, meal_time
3. Add/modify food tags
4. Run EF Core migration if schema changed
5. Apply seed via `dotnet.exe ef database update`

## Data Categories
- Món khô: cơm tấm, bún bò, phở khô, cơm rang...
- Món nước: phở, bún bò Huế, hủ tiếu, canh chua...
- Tags: cay, chay, healthy, ngọt, mặn, chiên, hấp, nướng, hải sản, thịt, rau
- Price ranges: re (<30k), vua (30-80k), cao (>80k)
- Meal times: sang, trua, toi, khuya
