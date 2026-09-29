# Design Rules

## Clean Architecture Layers
- **Domain**: Entities, Enums, Value Objects — ZERO dependencies
- **Application**: DTOs, Interfaces, Services — depends on Domain only
- **Infrastructure**: DbContext, Repositories, External APIs — depends on Domain + Application
- **Api**: Controllers, Hubs, Middleware — depends on all layers

## API Design
- RESTful endpoints: GET for reads, POST for creates, PUT for updates, DELETE for deletes
- Return DTOs, never entities
- Use `[ApiController]` attribute on all controllers
- Route pattern: `/api/{resource}` (lowercase, plural)
- Pagination for list endpoints
- Consistent error response format: `{ error: string, details?: string }`

## Database
- EF Core Code-First with Fluent API configurations
- Each entity config in separate file under Infrastructure/Data/Configurations/
- Use UUID for TempUser primary key, int SERIAL for others
- Index geo columns (lat, lng) for spatial queries

## Frontend
- Feature-based folder structure
- One component per file
- Ant Design components as base — customize with CSS modules if needed
- Zustand stores: one per feature domain
- API calls isolated in /api/ folder
- TypeScript strict mode
