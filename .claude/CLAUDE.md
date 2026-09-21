# CLAUDE.md — Food Match Project Brain

## 🚨 Guardrails (CRITICAL RULES)
> [!IMPORTANT]
> The following rules MUST be followed at all times without exception:
> 1. **NEVER expose Domain entities directly in API responses** — Always map to and return DTOs.
> 2. **ALWAYS validate DTOs before processing** — Use DataAnnotations and/or FluentValidation.
> 3. **ALWAYS use async/await for DB operations** — Never call `.Result` or `.Wait()`.
> 4. **NEVER store real user location** — Always offset user coordinates by a random distance (e.g. 50–150m) before saving or broadcasting.
> 5. **Temp user sessions expire after 3 hours** — Enforce 3-hour TTL on temp profiles and cleanup expired data.
> 6. **Default search radius is 3km** — Match queries and restaurant recommendations default to 3km radius unless explicitly overridden within allowable bounds.

---

## 📌 Project Overview
- **Name:** Food Match
- **Description:** Food recommendation & social dining matching application
- **Target Audience:** Food lovers looking for random dish inspiration or dining companions nearby

---

## 🛠️ Tech Stack Summary
- **Backend:** ASP.NET Core Web API (.NET 10), C# 12
- **Database:** PostgreSQL 16 (Supabase / local Docker via EF Core 10 + Npgsql)
- **Real-time Communication:** SignalR (`LocationHub`, `MatchHub`, `ChatHub`)
- **Frontend:** React 19 + TypeScript 5 (Strict Mode) + Vite 6
- **UI Library:** Ant Design 5 (Mobile-responsive, Ant Design icons)
- **State Management:** Zustand 5
- **Maps & Geolocation:** Leaflet.js + React-Leaflet, OpenStreetMap tiles, Overpass API (restaurant data), OSRM (routing)
- **Internationalization:** Bilingual support (Vietnamese [default] & English) via `i18next` + `react-i18next`
- **HTTP Client:** Axios

---

## 🏛️ Architecture: Clean Architecture
Dependencies flow inward only:
```
[Domain] <--- [Application] <--- [Infrastructure]
   ^               ^                    ^
   |               |                    |
   +---------------+--------------------+--- [Api]
```

- **Domain:** Entities, Enums, Value Objects, Domain Exceptions (Zero external dependencies).
- **Application:** DTOs, Interface definitions (`IRepository<T>`, Service contracts), Business Logic, Validators, Mappings (Depends only on Domain).
- **Infrastructure:** DbContext (`FoodMatchDbContext`), EF Core entity configurations, Repository implementations, Seed data, External API clients (Depends on Domain and Application).
- **Api:** Controllers, SignalR Hubs, Middlewares, Dependency Injection registration, Program entry point (Depends on all layers).

---

## 📐 Key Conventions & Coding Standards

### Backend (C# / .NET 10)
- **File-scoped namespaces:** Use `namespace FoodMatch.{Layer}.{Folder};` everywhere.
- **Controller-based API:** Standard ASP.NET Core Controllers with `[ApiController]` and `[Route("api/[controller]")]` attributes (not Minimal APIs).
- **Repository Pattern:** Generic `IRepository<T>` backed by specific queries where appropriate.
- **DTOs:** Request and Response DTOs for all API contracts.
- **Modern C# 12:** Primary constructors where clean, pattern matching, records for immutable DTOs.
- **Async everywhere:** All I/O and EF Core queries use `async Task<T>` / `CancellationToken`.

### Frontend (React / TypeScript / Vite)
- **Feature-based Structure:** `src/features/{feature-name}/` containing components, hooks, api, and types.
- **Zustand Stores:** Dedicated lightweight stores per domain (`useAuthStore`, `useMatchStore`, `useFoodStore`, etc.).
- **Ant Design:** Use standard AntD components and grid; avoid custom CSS when AntD primitives suffice.
- **Bilingual:** All UI text must reference translation keys via `useTranslation()` (`vi` default, `en` switchable).
- **TypeScript:** Strict type checks enabled; `any` is prohibited.
