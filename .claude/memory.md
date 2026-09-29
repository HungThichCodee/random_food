# Food Match — Project Memory

## Last Updated
- **Date:** 2026-09-29T09:40:00+07:00
- **Action:** Completed Phase 11 (SignalR Real-time Setup). Implemented `LocationHub`, `MatchHub`, `ChatHub` with JWT token-based identity per OWASP rules. Set up frontend `useSignalR` hook. Checked build and pushed.

## Current Status: 🟢 PHASE 11 COMPLETE — STARTING PHASE 12
- Backend build: ✅ 0 errors
- Frontend build (tsc): ✅ 0 errors
- Phase 11 implemented with strict SignalR Auth configuration.

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
- **Phase 11 (SignalR Real-time Setup):** 6/6 done ██████████ 100%
- **Phase 12-18:** Not started

## Recent Rule Updates
- **Git Execution**: MUST use `git.exe` explicitly for all Git commands.
- **Pre-Push Mandatory Checklist**: Agent must always build code, check UI/UX, and review validation/error handling/rate limiting *before* asking to `git.exe push`.
- **Project Structure Integrity**: Do not leave duplicate or empty .NET project folders at the root.
- **Security**: Added token-based identity using JWT for SignalR authentication per OWASP rules.

## Next Immediate Action for Next Agent
- Review `.claude/implementation_plan.md` and start **Phase 12 — Match System (Group C — C1, C2, C3)**.
- Implement Match Requests system (DTOs, Service, Controller).
