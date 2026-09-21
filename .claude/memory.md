# Food Match — Project Memory

## Last Updated
- **Date:** 2026-09-21T14:18:00+07:00
- **Action:** Re-audited Phase 0 accuracy — found git repo NOT initialized, entities use string instead of enum

## Current Status: 🟡 PHASE 0 — 2 steps remaining (P0.1b, P0.11)
- Backend build: ✅ 0 errors, 9 warnings (CS9113 unread params — stubs)
- Frontend: npm install done (274 packages), dev server NOT YET verified
- Docker PostgreSQL: container `foodmatch-postgres` running (Up 30 minutes)
- .NET 10 SDK: v10.0.401 installed
- Git repo: ❌ NOT INITIALIZED (`.git` does not exist)

## Progress Tracker
- **Phase 0 (Environment Setup):** 10/12 done ████████░░ ~83%
- **Phase 1-18:** Not started

## Code Quality Notes (discovered during audit)
### Entities — Files exist but need review (Phase 1)
- `Food.cs`: uses `string?` for Category, AvgPriceRange, MealTime → should use enums (FoodCategory, PriceRange, MealTime)
- `TempUser.cs`: uses `string` for Status → should use UserStatus enum
- `MatchRequest.cs`: uses `string` for Status → should use MatchStatus enum
- `FoodSuggestionLog.cs`: uses `string?` for SuggestionType → consider enum
- All entities compile but are semantically incomplete

### Infrastructure — Files exist but are stubs (Phase 2)
- `Repository.cs`: all methods throw NotImplementedException
- `DataSeeder.cs`: throws NotImplementedException
- `FoodConfiguration.cs`: basic config, no enum conversion, no extra indexes
- All Services in Application/: throw NotImplementedException

### DbContext — Actually complete ✅
- `FoodMatchDbContext.cs`: has all 9 DbSets, ApplyConfigurationsFromAssembly works

## Decisions Made
- Monorepo structure (backend + frontend in same repo)
- Controller-based API (not Minimal API)
- Ant Design for UI components
- Zustand for state management
- 50 Vietnamese dishes as seed data (hard-coded)
- 3h temp profile expiry
- 3km default search radius
- Bilingual: Vietnamese (default) + English
- Feature-based frontend folder structure (8 feature folders in components/)
- Generic Repository pattern (single Repository.cs)
- 9 entities including UserReport (not in original doc.md but needed for C5: report/block)
- Docker PostgreSQL local for dev, Supabase for deploy
- Backend first → Frontend after (per feature)
- Micro-steps (~30 min each), numbered by phase
- EF Core code-first migrations
- Self-check (build + test) after every step (MANDATORY rule added to workflow.md)
- Unit tests for Food, Match, TempUser services only
- Feature priority: A (Food) → B (Profile) → C (Real-time Match)
- Deploy NOT in plan — local only, deploy later
- CLI commands must use .exe extension (npm.exe, dotnet.exe, git.exe...)

## Blocking Issues
- ~~❌ .NET 10 SDK NOT INSTALLED~~ → ✅ Fixed (v10.0.401)
- ~~❌ node_modules NOT INSTALLED~~ → ✅ Fixed (274 packages)
- ~~❌ Docker NOT INSTALLED~~ → ✅ Fixed (PostgreSQL container running)
- ❌ Git repo NOT INITIALIZED — need `git.exe init` + initial commit

## Patterns Learned
- Use `npm.cmd` instead of `npm.exe` on this machine (npm is a .cmd wrapper)
- .NET SDK installed at `$env:LOCALAPPDATA\Microsoft\dotnet` — need to prepend to PATH in commands
- winget.exe not available on this machine — use dotnet-install.ps1 script instead
- ALWAYS verify actual file content before marking plan steps as done
