# Food Match — Project Memory

## Last Updated
- **Date:** 2026-09-25T10:55:00+07:00
- **Action:** Completed Phase 7 (Backend Restaurant Service & Map) and updated workflow rules with Pre-Push Checklist.

## Current Status: 🟢 PHASE 7 COMPLETE — STARTING PHASE 8
- Backend build: ✅ 0 errors, 5 warnings (unused params in stub services)
- Frontend build: ✅ TSC passes
- Docker PostgreSQL: container `foodmatch-postgres` running
- Pre-Push Checklist: ✅ Enforced for Phase 7
- Data: ✅ 50 Vietnamese foods seeded

## Progress Tracker
- **Phase 0 (Environment Setup):** 12/12 done ██████████ 100%
- **Phase 1 (Domain Layer):** 10/10 done ██████████ 100%
- **Phase 2 (Infrastructure/EF Core):** 13/13 done ██████████ 100%
- **Phase 3 (Seed Data):** 6/6 done ██████████ 100%
- **Phase 4 (Food Services):** 7/7 done ██████████ 100%
- **Phase 5 (Food Controllers):** 5/5 done ██████████ 100%
- **Phase 6 (Frontend Food UI):** 11/11 done ██████████ 100%
- **Phase 7 (Restaurant Service):** 8/8 done ██████████ 100%
- **Phase 8-18:** Not started

## Recent Rule Updates
- **Pre-Push Mandatory Checklist**: Agent must always build code, check UI/UX, and review validation/error handling/rate limiting *before* asking to `git push`.

## Tooling & Integrations
- **MCP Servers**: Configured in `.agents/mcp_config.json` (PostgreSQL, GitHub, Docker, Vercel).
- **OCR Delegate**: Using `ocr delegate preview` for automated code reviews.

## Next Immediate Action for Next Agent
- Review `.claude/implementation_plan.md` and start **Phase 8 — Frontend Map + Restaurant (Group A)** (P8.1).
- Implement `MapPage.tsx`, Leaflet map, geolocation hooks, and restaurant API integration.
