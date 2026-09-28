# Food Match — Project Memory

## Last Updated
- **Date:** 2026-09-28T11:25:00+07:00
- **Action:** Completed Phase 10 (Frontend Profile). Implemented `CreateProfilePage` (antd-mobile), `tempUserApi`, and Zustand store with persistence. Integrated nearby users to show on Map. Fixed Git.exe workflow rule.

## Current Status: 🟢 PHASE 10 COMPLETE — STARTING PHASE 11
- Backend build: ✅ 0 errors
- Frontend build (tsc): ✅ 0 errors
- Phase 10 Frontend implemented with strict UI guidelines and Map offset testing.

## Progress Tracker
- **Phase 0 (Environment Setup):** 12/12 done ██████████ 100%
- **Phase 1 (Domain Layer):** 10/10 done ██████████ 100%
- **Phase 2 (Infrastructure/EF Core):** 13/13 done ██████████ 100%
- **Phase 3 (Seed Data):** 6/6 done ██████████ 100%
- **Phase 4 (Food Services):** 7/7 done ██████████ 100%
- **Phase 5 (Food Controllers):** 5/5 done ██████████ 100%
- **Phase 6 (Frontend Food UI):** 11/11 done ██████████ 100%
- **Phase 7 (Restaurant Service):** 8/8 done ██████████ 100%
- **Phase 8 (Map Frontend):** 7/7 done ██████████ 100%
- **Phase 9 (TempUser Backend):** 9/9 done ██████████ 100%
- **Phase 10 (TempUser Frontend):** 6/6 done ██████████ 100%
- **Phase 11-18:** Not started

## Recent Rule Updates
- **Git Execution**: MUST use `git.exe` explicitly for all Git commands.
- **Pre-Push Mandatory Checklist**: Agent must always build code, check UI/UX, and review validation/error handling/rate limiting *before* asking to `git.exe push`.
- **Project Structure Integrity**: Do not leave duplicate or empty .NET project folders at the root.

## Next Immediate Action for Next Agent
- Review `.claude/implementation_plan.md` and start **Phase 11 — SignalR Real-time (Group C — Setup)**.
- Implement SignalR Hubs (`LocationHub`, `MatchHub`, `ChatHub`) in Backend and `useSignalR.ts` in Frontend.
