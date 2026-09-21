# Technology Defaults

## Backend
- Runtime: .NET 10
- Framework: ASP.NET Core Web API
- ORM: Entity Framework Core 10 + Npgsql
- Real-time: SignalR
- Validation: DataAnnotations + FluentValidation
- JSON: System.Text.Json (default)
- Logging: built-in ILogger

## Frontend
- Runtime: Node.js 22+
- Framework: React 19
- Language: TypeScript 5.x (strict mode)
- Build: Vite 6
- UI: Ant Design 5
- State: Zustand 5
- HTTP: Axios
- Routing: React Router 7
- Maps: Leaflet + react-leaflet
- i18n: i18next + react-i18next
- SignalR client: @microsoft/signalr

## Database
- PostgreSQL 16 (via Supabase or local Docker)
- Connection pooling: Supabase Session Pooler mode

## External APIs
- Map tiles: OpenStreetMap (free)
- Restaurant search: Overpass API (free)
- Routing: OSRM public demo server (free)

## Deploy
- Backend: Render (Docker, free tier)
- Frontend: Vercel (free tier)
- Database: Supabase (free tier, 500MB)
- CI/CD: GitHub Actions
