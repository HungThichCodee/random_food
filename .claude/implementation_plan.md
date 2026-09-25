# 📋 Food Match — Implementation Plan (Chi Tiết Từng Bước)

> Mỗi bước (~30 phút) là 1 đơn vị code nhỏ. Sau mỗi bước PHẢI self-check: build, fix lỗi, update memory.

---

## Phase 0 — Environment Setup
- [x] P0.1 — Tạo cấu trúc monorepo (backend + frontend folders) ✅
- [x] P0.1b — Khởi tạo Git repo (`git.exe init`, initial commit)
- [x] P0.2 — Setup .gitignore, docker-compose.yml ✅
- [x] P0.3 — Setup React project (Vite + TS), package.json, cấu trúc thư mục ✅
- [x] P0.4 — Setup .NET solution, 4 projects Clean Architecture + test project ✅
- [x] P0.5 — Cấu hình project references (.csproj) ✅
- [x] P0.6 — Setup .claude configs (CLAUDE.md, memory.md, rules, agents, skills) ✅
- [x] P0.7 — npm install frontend dependencies (274 packages) ✅
- [x] P0.8 — Docker compose up PostgreSQL local (container running) ✅
- [x] P0.9 — Cài .NET 10 SDK (v10.0.401) ✅
- [x] P0.10 — Verify `dotnet.exe build` passes (0 errors, 9 warnings — stubs) ✅
- [x] P0.11 — Verify `npm.cmd run dev` starts Vite dev server ✅

---

> **Lưu ý Phase 1:** Entities đã có file nhưng dùng `string` cho Category/Status/MealTime/PriceRange thay vì enum type. Phase 1 cần review và chuyển sang dùng enum đã định nghĩa trong Enums/.
> **Lưu ý Phase 2:** EF Configs có file nhưng thiếu enum conversion, geo indexes. Repository.cs là stub (throw NotImplementedException). Services cũng là stub.

## Phase 1 — Domain Layer (Entities + Enums)
- [x] P1.1 — Review/hoàn thiện entity `Food.cs` (properties, navigation props) ✅
- [x] P1.2 — Review/hoàn thiện entity `FoodTag.cs` + `FoodFoodTag.cs` (many-to-many) ✅
- [x] P1.3 — Review/hoàn thiện entity `Restaurant.cs` ✅
- [x] P1.4 — Review/hoàn thiện entity `TempUser.cs` (UUID PK, expires_at, status) ✅
- [x] P1.5 — Review/hoàn thiện entity `MatchRequest.cs` ✅
- [x] P1.6 — Review/hoàn thiện entity `ChatMessage.cs` ✅
- [x] P1.7 — Review/hoàn thiện entity `FoodSuggestionLog.cs` ✅
- [x] P1.8 — Review/hoàn thiện entity `UserReport.cs` ✅
- [x] P1.9 — Review/hoàn thiện tất cả Enums (FoodCategory, MealTime, PriceRange, UserStatus, MatchStatus) ✅
- [x] P1.10 — ✅ BUILD CHECK: `dotnet.exe build` → 0 errors ✅

---

## Phase 2 — Infrastructure Layer (Database + EF Core)
- [x] P2.1 — Hoàn thiện `FoodMatchDbContext.cs` (DbSets, OnModelCreating) ✅
- [x] P2.2 — Hoàn thiện EF Config: `FoodConfiguration.cs` (indexes, constraints, enum conversion) ✅
- [x] P2.3 — Hoàn thiện EF Config: `FoodTagConfiguration.cs` + `FoodFoodTagConfiguration.cs` ✅
- [x] P2.4 — Hoàn thiện EF Config: `RestaurantConfiguration.cs` (geo indexes) ✅
- [x] P2.5 — Hoàn thiện EF Config: `TempUserConfiguration.cs` (UUID, geo indexes, status) ✅
- [x] P2.6 — Hoàn thiện EF Config: `MatchRequestConfiguration.cs` ✅
- [x] P2.7 — Hoàn thiện EF Config: `ChatMessageConfiguration.cs` ✅
- [x] P2.8 — Hoàn thiện EF Config: `FoodSuggestionLogConfiguration.cs` + `UserReportConfiguration.cs` ✅
- [x] P2.9 — Tạo EF Migration: `dotnet.exe ef migrations add InitialCreate` ✅
- [x] P2.10 — Apply Migration: `dotnet.exe ef database update` ✅
- [x] P2.11 — Hoàn thiện `Repository.cs` (Generic CRUD: GetAll, GetById, Add, Update, Delete) ✅
- [x] P2.12 — Register DbContext + Repository trong DI (Program.cs hoặc extension method) ✅
- [x] P2.13 — ✅ BUILD CHECK + DB CHECK: build passes, database created with tables ✅

---

## Phase 3 — Seed Data (50 Món Ăn Việt Nam)
- [x] P3.1 — Code seed food tags: cay, chay, healthy, ngot, man, chien, hap, nuong, hai_san, thit, rau, do_uong ✅
- [x] P3.2 — Code seed 25 món ăn đầu tiên (phở, bún bò, cơm tấm, bánh mì...) ✅
- [x] P3.3 — Code seed 25 món ăn còn lại ✅
- [x] P3.4 — Code seed food-tag relationships (mỗi món gắn 2-4 tags) ✅
- [x] P3.5 — Gọi DataSeeder.SeedAsync() trong Program.cs khi startup ✅
- [x] P3.6 — ✅ BUILD CHECK + SEED CHECK: verify database có 50 foods + tags ✅

---

## Phase 4 — Application Layer Services (Group A — Food)
- [x] P4.1 — Code DTOs: `FoodResponseDto`, `FoodRandomRequestDto`, `FoodSuggestRequestDto` ✅
- [x] P4.2 — Code `IFoodService` interface (nếu cần update) ✅
- [x] P4.3 — Code `FoodService.GetRandomFoodAsync()` — random toàn bộ, tránh trùng trong phiên ✅
- [x] P4.4 — Code `FoodService.GetRandomByCategoryAsync(category)` — random theo khô/nước ✅
- [x] P4.5 — Code `FoodService.SuggestFoodsAsync(criteria)` — lọc theo tag, giá, giờ ăn ✅
- [x] P4.6 — Code `FoodSuggestionLog` logging — lưu lịch sử random tránh trùng ✅
- [x] P4.7 — ✅ BUILD CHECK ✅

---

## Phase 5 — API Layer Controllers (Group A — Food)
- [x] P5.1 — Code `FoodsController.GetRandom()` — `GET /api/foods/random` ✅
- [x] P5.2 — Code `FoodsController.GetRandomByCategory()` — `GET /api/foods/random?category=kho|nuoc` ✅
- [x] P5.3 — Code `FoodsController.Suggest()` — `POST /api/foods/suggest` ✅
- [x] P5.4 — Register FoodService trong DI ✅
- [x] P5.5 — ✅ BUILD CHECK + SWAGGER TEST: verify 3 endpoints hoạt động qua Swagger ✅

---

## Phase 6 — Frontend (Group A — Random Món Ăn)
- [x] P6.1 — Code `axiosClient.ts` — base URL, interceptors, error handling ✅
- [x] P6.2 — Code `foodApi.ts` — gọi 3 API endpoints food ✅
- [x] P6.3 — Code `useFoodStore.ts` — Zustand store cho food state ✅
- [x] P6.4 — Tích hợp **Stitch MCP Design System** — cài đặt mã màu, font, CSS variables theo chuẩn Mobile-First (Glassmorphism, Neon). ✅
- [x] P6.5 — Code `AppLayout.tsx` — layout chung, TabBar (Bottom Navigation) dùng antd-mobile ✅
- [x] P6.6 — Code `HomePage.tsx` — landing page, navigation cards (tuân thủ UI/UX từ Stitch) ✅
- [x] P6.7 — Code `RandomFoodPage.tsx` — spin wheel animation, hiển thị kết quả dạng Card (antd-mobile) ✅
- [x] P6.8 — Code `SuggestFoodPage.tsx` — form chọn tiêu chí, hiển thị gợi ý (dùng Form, Button, Selector của antd-mobile) ✅
- [x] P6.8 — Setup i18n config (`i18n/index.ts`) ✅
- [x] P6.9 — Thêm translation keys cho pages đã code (vi.json + en.json) ✅
- [x] P6.10 — ✅ BUILD CHECK: `npx.cmd tsc --noEmit` passes ✅

---

## Phase 7 — Restaurant Service + Map (Group A — A3, A4)
- [x] P7.1 — Code DTOs: `RestaurantResponseDto`, `NearbyRequestDto`
- [x] P7.2 — Code `IOverpassApiService` + `OverpassApiService` — gọi Overpass API tra quán ăn
- [x] P7.3 — Code `IRestaurantService` + `RestaurantService` — lưu cache vào DB, query nearby
- [x] P7.4 — Code `RestaurantService.GetNearbyAsync(lat, lng, radius)`
- [x] P7.5 — Code `RestaurantService.GetBuffetInMallAsync(lat, lng)`
- [x] P7.6 — Code `RestaurantsController` — `GET /api/restaurants/nearby`, `GET /api/restaurants/buffet-mall`
- [x] P7.7 — Register services trong DI + HttpClient cho Overpass
- [x] P7.8 — ✅ BUILD CHECK + SWAGGER TEST

---

## Phase 8 — Frontend Map + Restaurant (Group A)
- [x] P8.1 — Code `useGeolocation.ts` hook — request browser location
- [x] P8.2 — Code `MapPage.tsx` — Leaflet map, user location marker
- [x] P8.3 — Code component hiển thị restaurant markers trên map
- [x] P8.4 — Code popup thông tin quán ăn khi click marker
- [x] P8.5 — Code `restaurantApi.ts` — gọi API nearby + buffet
- [x] P8.6 — Thêm translation keys cho Map (vi.json + en.json)
- [x] P8.7 — ✅ BUILD CHECK: `npx.cmd tsc --noEmit` passes

---

## Phase 9 — Temp User Profile (Group B)
- [ ] P9.1 — Code DTOs: `CreateTempUserDto`, `TempUserResponseDto`, `UpdateLocationDto`
- [ ] P9.2 — Code `ITempUserService` + `TempUserService.CreateAsync()` — tạo profile tạm
- [ ] P9.3 — Code `TempUserService.UpdateLocationAsync()` — cập nhật vị trí (offset ngẫu nhiên)
- [ ] P9.4 — Code `TempUserService.GetNearbyUsersAsync()` — lấy users gần đó (visible only)
- [ ] P9.5 — Code `TempUserService.DeactivateExpiredAsync()` — xoá/ẩn users hết hạn
- [ ] P9.6 — Code `TempUsersController` — POST, PUT location, GET nearby
- [ ] P9.7 — Code `ExpiredUserCleanupService` (BackgroundService) — job chạy định kỳ xoá hết hạn
- [ ] P9.8 — Register services + background job trong DI
- [ ] P9.9 — ✅ BUILD CHECK + SWAGGER TEST

---

## Phase 10 — Frontend Profile (Group B)
- [ ] P10.1 — Code `CreateProfilePage.tsx` — form nhập tên, giới tính, sở thích, món muốn ăn
- [ ] P10.2 — Code `useUserStore.ts` — Zustand store cho temp user state
- [ ] P10.3 — Code `tempUserApi.ts` — gọi API tạo profile, update location
- [ ] P10.4 — Code hiển thị nearby users trên map (markers với offset)
- [ ] P10.5 — Thêm translation keys cho Profile (vi.json + en.json)
- [ ] P10.6 — ✅ BUILD CHECK

---

## Phase 11 — SignalR Real-time (Group C — Setup)
- [ ] P11.1 — Code `LocationHub.cs` — nhận/broadcast vị trí real-time
- [ ] P11.2 — Code `MatchHub.cs` — gửi/nhận lời mời match
- [ ] P11.3 — Code `ChatHub.cs` — gửi/nhận tin nhắn real-time
- [ ] P11.4 — Uncomment MapHub lines trong Program.cs, register hubs
- [ ] P11.5 — Code `useSignalR.ts` hook — connect, disconnect, event handlers
- [ ] P11.6 — ✅ BUILD CHECK

---

## Phase 12 — Match System (Group C — C1, C2, C3)
- [ ] P12.1 — Code DTOs: `MatchRequestDto`, `MatchResponseDto`, `RespondMatchDto`
- [ ] P12.2 — Code `IMatchService` + `MatchService.SendRequestAsync()` — gửi lời mời
- [ ] P12.3 — Code `MatchService.RespondAsync()` — đồng ý/từ chối
- [ ] P12.4 — Code `MatchService.GetPendingRequestsAsync()` — lấy lời mời đang chờ
- [ ] P12.5 — Code `MatchRequestsController` — POST, PUT respond, GET pending
- [ ] P12.6 — Tích hợp SignalR push notification khi có lời mời mới
- [ ] P12.7 — ✅ BUILD CHECK + SWAGGER TEST

---

## Phase 13 — Chat System (Group C — C3)
- [ ] P13.1 — Code DTOs: `ChatMessageDto`, `SendMessageDto`
- [ ] P13.2 — Code `IChatService` + `ChatService` — gửi/lấy tin nhắn, lưu DB
- [ ] P13.3 — Code `ChatController` — GET messages by match
- [ ] P13.4 — Tích hợp ChatHub — real-time send/receive
- [ ] P13.5 — ✅ BUILD CHECK

---

## Phase 14 — Frontend Match + Chat (Group C)
- [ ] P14.1 — Code `useMatchStore.ts` — Zustand store cho match state
- [ ] P14.2 — Code `matchApi.ts` + `chatApi.ts` — gọi API
- [ ] P14.3 — Code UI gửi lời mời ăn cùng (click user trên map → popup → nút mời)
- [ ] P14.4 — Code UI thông báo real-time khi nhận lời mời
- [ ] P14.5 — Code UI đồng ý/từ chối lời mời
- [ ] P14.6 — Code Chat popup/drawer — giao diện chat real-time
- [ ] P14.7 — Thêm translation keys cho Match + Chat
- [ ] P14.8 — ✅ BUILD CHECK

---

## Phase 15 — Routing + Report (Group C — C4, C5)
- [ ] P15.1 — Code `IRoutingService` + `OsrmRoutingService` — gọi OSRM API lấy route
- [ ] P15.2 — Code `RoutingController` — GET route between 2 points
- [ ] P15.3 — Code vẽ route trên Leaflet map (polyline)
- [ ] P15.4 — Code `IReportService` + `ReportService` — báo cáo/chặn user
- [ ] P15.5 — Code `ReportsController` — POST report
- [ ] P15.6 — Code UI nút báo cáo/chặn user
- [ ] P15.7 — ✅ BUILD CHECK + SWAGGER TEST

---

## Phase 16 — Error Handling + Middleware
- [ ] P16.1 — Code `GlobalExceptionMiddleware` — catch unhandled exceptions, return consistent error JSON
- [ ] P16.2 — Code custom exception classes: `NotFoundException`, `BadRequestException`
- [ ] P16.3 — Register middleware trong Program.cs
- [ ] P16.4 — ✅ BUILD CHECK

---

## Phase 17 — Unit Tests
- [ ] P17.1 — Setup test project: add references, install xUnit/Moq/FluentAssertions
- [ ] P17.2 — Code tests cho `FoodService` (random, suggest, category filter)
- [ ] P17.3 — Code tests cho `TempUserService` (create, expire, location offset)
- [ ] P17.4 — Code tests cho `MatchService` (send, respond, status transitions)
- [ ] P17.5 — ✅ TEST CHECK: `dotnet.exe test` → all tests pass

---

## Phase 18 — Polish + Final Check
- [ ] P18.1 — Review responsive UI và UX trên mobile (đảm bảo chuẩn antd-mobile và Stitch UI)
- [ ] P18.2 — Hoàn thiện tất cả translation keys (vi + en)
- [x] P18.3 — Code README.md — kiến trúc, hướng dẫn chạy local, tech stack
- [ ] P18.4 — Final build: backend `dotnet.exe build -c Release` + frontend `npm.cmd run build`
- [ ] P18.5 — ✅ FINAL CHECK: 0 errors, 0 warnings, all tests pass

---

## Summary
| Phase | Mô tả | Số bước |
|---|---|---|
| P0 | Environment Setup | 11 |
| P1 | Domain Entities + Enums | 10 |
| P2 | Infrastructure (DB + EF Core) | 13 |
| P3 | Seed Data | 6 |
| P4 | Food Service (Backend) | 7 |
| P5 | Food Controller (API) | 5 |
| P6 | Food Frontend | 10 |
| P7 | Restaurant Service + API | 8 |
| P8 | Map Frontend | 7 |
| P9 | TempUser Service + API | 9 |
| P10 | Profile Frontend | 6 |
| P11 | SignalR Setup | 6 |
| P12 | Match System | 7 |
| P13 | Chat System | 5 |
| P14 | Match + Chat Frontend | 8 |
| P15 | Routing + Report | 7 |
| P16 | Error Handling | 4 |
| P17 | Unit Tests | 5 |
| P18 | Polish + Final | 5 |
| **TOTAL** | | **~139 bước** |
