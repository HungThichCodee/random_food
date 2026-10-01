# Food Match — Project Memory

## Last Updated
- **Date:** 2026-10-01T13:34:00+07:00
- **Action:** Hoàn thành Phase 16 (Error Handling). Đã tạo GlobalExceptionMiddleware và đăng ký trong Program.cs để trả về JSON chuẩn cho mọi unhandled exceptions.

## Current Status: 🟢 PHASE 16 COMPLETE — READY FOR PHASE 18 (Polish + Final)

- Frontend Hot Reload: ✅ 0 errors, running on http://localhost:5173
- Backend: ✅ Running on https://localhost:7154
- Database: ✅ PostgreSQL Docker container active
- Code Pushed: ✅ All MVP bug fixes committed and pushed via `git.exe`
- UI/UX Report: See `.gemini/antigravity-ide/brain/.../ui_ux_final_report.md`

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
- **Phase 12 (Match System Backend):** 7/7 done ██████████ 100%
- **Phase 13 (Chat System Backend):** 5/5 done ██████████ 100%
- **Phase 14-18:** Not started

## UI/UX Redesign Summary (Complete)
All 8 screens matched 100% to Stitch design (`ui_Mau`):
1. Home (`/`) → `HomePage.tsx`
2. Spin Wheel (`/random`) → `RandomFoodPage.tsx`
3. Food Suggest (`/suggest`) → `SuggestFoodPage.tsx`
4. Full Map (`/map`) → `MapPage.tsx`
5. Profile (`/profile`) → `CreateProfilePage.tsx`
6. Matching Toast (overlay on `/map`) → `MapPage.tsx`
7. Chat (`/chat/:matchId`) → `ChatPage.tsx` — **nav hidden**
8. Direction Route (`/route`) → `DirectionRoutePage.tsx` — **nav hidden**

### Architecture Decisions
- **Navigation Isolation:** Bottom nav hidden on `/chat/*` and `/route` via `AppLayout.tsx` line 32
- **Design Tokens:** All in `global.css` (DO NOT change color tokens)
- **Anti-Regression:** See `.agents/rules/ui_guidelines.md`

## Recent Rule Updates
- **Git Execution**: MUST use `git.exe` explicitly for all Git commands.
- **Pre-Push Mandatory Checklist**: Agent must always build code, check UI/UX, and review validation/error handling/rate limiting *before* asking to `git.exe push`.
- **Security**: Token-based identity using JWT is fully integrated.
- **UI/UX Anti-Regression**: MUST read `ui_guidelines.md` before modifying any page component. MUST NOT duplicate bottom nav, change color tokens, or break pointer-events on map overlays.

## Next Immediate Action for Next Agent
- Review `.claude/implementation_plan.md` and start **Phase 14 — Frontend Match + Chat (Group C)**.
- Implement `useMatchStore.ts`, `matchApi.ts`, `chatApi.ts` and connect SignalR (`chatHub` / `matchHub`) to the frontend.
- **DO NOT** modify `ChatPage.tsx` or `MapPage.tsx` UI — it is already complete and matched to design.
- Only connect real API/SignalR to replace mock data.
