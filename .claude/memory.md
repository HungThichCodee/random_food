# Food Match — Project Memory

## Last Updated
- **Date:** 2026-09-21T18:27:00+07:00
- **Action:** Created README, initialized Git, pushed to GitHub (origin/main), and updated workflow rules.

## Current Status: 🟢 PHASE 5 COMPLETE — STARTING PHASE 6
- Backend build: ✅ 0 errors, 7 warnings (unused params in stub services)
- Frontend: ✅ dev server running
- Docker PostgreSQL: container `foodmatch-postgres` running
- Git repo: ✅ Phase 3, 4, 5 pushed to GitHub
- Data: ✅ 50 Vietnamese foods seeded
- Rules updated: ✅ `try-catch` & `Backend Validation` are now strict requirements (Step 0 in Self-Check).

## Progress Tracker
- **Phase 0 (Environment Setup):** 12/12 done ██████████ 100%
- **Phase 1 (Domain Layer):** 10/10 done ██████████ 100%
- **Phase 2 (Infrastructure/EF Core):** 13/13 done ██████████ 100%
- **Phase 3 (Seed Data):** 6/6 done ██████████ 100%
- **Phase 4 (Food Services):** 7/7 done ██████████ 100%
- **Phase 5 (Food Controllers):** 5/5 done ██████████ 100%
- **Phase 6-18:** Not started

## Recent Rule Updates
- **Initialization (Mandatory Context Reading)**: Agent must ALWAYS read `doc.md` and `.claude` files first upon receiving any new prompt to avoid context loss.
- **Git Push Approval**: Agent must always request explicit approval before running `git push`.
- **Context Continuity**: Agent must update this `memory.md` file whenever nearing session limits or after completing a large chunk of work to ensure safe handoffs between chat sessions.
- **Strict Backend Validation**: Agent must enforce `try-catch` and validate inputs via Data Annotations & Guard clauses (Rule 0 in Self-Check) before marking any feature as complete.

## Tooling & Integrations
- **MCP Servers**: Configured in `.agents/mcp_config.json` (PostgreSQL, GitHub, Docker, Vercel). Note: GitHub and Vercel need API tokens filled in.
- **OCR Delegate**: Using `ocr delegate preview` for automated code reviews.

## Next Immediate Action for Next Agent
- Review `.claude/implementation_plan.md` and start **Phase 6 — Application Layer (Group B — Users & Matching)** (P6.1).
- Implement `TempUserService` (Create Profile, Set Status) with strict `try-catch` and validation.
