# Food Match — Project Memory

## Last Updated
- **Date:** 2026-09-21T18:27:00+07:00
- **Action:** Created README, initialized Git, pushed to GitHub (origin/main), and updated workflow rules.

## Current Status: 🟢 PHASE 2 COMPLETE — STARTING PHASE 3
- Backend build: ✅ 0 errors, 0 warnings
- Frontend: ✅ dev server running
- Docker PostgreSQL: container `foodmatch-postgres` running
- Git repo: ✅ INITIALIZED, committed, and pushed to GitHub (https://github.com/HungThichCodee/random_food.git)
- README.md: ✅ Created and approved.

## Progress Tracker
- **Phase 0 (Environment Setup):** 12/12 done ██████████ 100%
- **Phase 1 (Domain Layer):** 10/10 done ██████████ 100%
- **Phase 2 (Infrastructure/EF Core):** 13/13 done ██████████ 100%
- **Phase 3-18:** Not started

## Recent Rule Updates
- **Initialization (Mandatory Context Reading)**: Agent must ALWAYS read `doc.md` and `.claude` files first upon receiving any new prompt to avoid context loss.
- **Git Push Approval**: Agent must always request explicit approval before running `git push`.
- **Context Continuity**: Agent must update this `memory.md` file whenever nearing session limits or after completing a large chunk of work to ensure safe handoffs between chat sessions.

## Tooling & Integrations
- **MCP Servers**: Configured in `.agents/mcp_config.json` (PostgreSQL, GitHub, Docker, Vercel). Note: GitHub and Vercel need API tokens filled in.

## Code Quality Notes (discovered during audit)
### Entities — Files exist but need review (Phase 1)
- `Food.cs`: uses `string?` for Category, AvgPriceRange, MealTime → should use enums (FoodCategory, PriceRange, MealTime)
- `TempUser.cs`: uses `string` for Status → should use UserStatus enum
- `MatchRequest.cs`: uses `string` for Status → should use MatchStatus enum
- `FoodSuggestionLog.cs`: uses `string?` for SuggestionType → consider enum
- All entities compile but are semantically incomplete

### Infrastructure — Files exist but are stubs (Phase 2)
- `DataSeeder.cs`: throws NotImplementedException
- All Services in Application/: throw NotImplementedException

## Next Immediate Action for Next Agent
- Run `ocr review` for Phase 2 audit (or continue to Phase 3 if already reviewed).
- Begin Phase 3: Code `DataSeeder.cs` for 50 Món Ăn Việt Nam.
