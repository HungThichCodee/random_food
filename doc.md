# KẾ HOẠCH DỰ ÁN: FOOD MATCH — App Gợi Ý Món Ăn & Ghép Cặp Ăn Uống Theo Vị Trí

---

## 1. TỔNG QUAN ĐỀ TÀI

**Tên đề tài:** Food Match — Ứng dụng gợi ý món ăn ngẫu nhiên và ghép cặp ăn uống theo vị trí thời gian thực

**Mô tả ngắn:** Web app không cần đăng ký tài khoản, cho phép người dùng random món ăn/quán ăn theo nhiều tiêu chí, đồng thời cung cấp tính năng ghép cặp với người dùng khác đang ở gần để cùng đi ăn, có chat và chỉ đường trực tiếp trên bản đồ.

**Điểm khác biệt:** Kết hợp giữa "food discovery" (giống app random món ăn) và "social matching theo vị trí" (giống Tinder + Google Maps), đòi hỏi xử lý real-time (WebSocket/SignalR), địa lý (Geolocation, Routing), và thiết kế UX ẩn danh an toàn.

---

## 2. MỤC TIÊU HƯỚNG ĐẾN

### Mục tiêu sản phẩm
- Giải quyết vấn đề "hôm nay ăn gì" bằng trải nghiệm vui, nhanh, không rào cản (không cần tạo tài khoản)
- Tạo kết nối xã hội nhẹ nhàng: giúp người đi ăn một mình tìm được bạn ăn cùng gần đó

### Mục tiêu học tập / portfolio (ứng tuyển .NET + ReactJS)
- Thể hiện năng lực xây dựng hệ thống **real-time** (SignalR) — kỹ năng ít fresher có
- Thể hiện khả năng làm việc với **dữ liệu địa lý** (Geolocation API, bản đồ, routing)
- Thể hiện tư duy **thiết kế hệ thống ẩn danh, có tính riêng tư/an toàn** — điểm cộng thể hiện tư duy sản phẩm chứ không chỉ code
- Áp dụng kiến trúc .NET chuẩn: Clean Architecture, Repository Pattern, DTO, validation
- Deploy được một hệ thống full-stack hoàn chỉnh, chạy thật, miễn phí

---

## 3. CHỨC NĂNG CHI TIẾT

### Nhóm A — Gợi ý món ăn / quán ăn (không cần vị trí người khác)
| # | Chức năng | Mô tả |
|---|---|---|
| A1 | Random món ăn (tất cả) | Random ngẫu nhiên trong toàn bộ danh sách món |
| A2 | Random món theo loại | Cho chọn khô/nước trước khi random |
| A3 | Random quán ăn trên bản đồ | Random 1 quán trong bán kính quanh vị trí người dùng |
| A4 | Random buffet trong TTTM | Lọc riêng các quán buffet nằm trong trung tâm thương mại |
| A5 | Gợi ý theo tiêu chí | Người dùng chọn tiêu chí (cay/chay/ngân sách/loại món) → hệ thống lọc và gợi ý |

### Nhóm B — Người dùng tạm thời & hồ sơ
| # | Chức năng | Mô tả |
|---|---|---|
| B1 | Tạo hồ sơ tạm | Nhập họ tên, giới tính, sở thích món, món muốn ăn hôm nay — không cần mật khẩu |
| B2 | Cấp quyền vị trí | Xin quyền Geolocation trình duyệt |
| B3 | Tự hết hạn phiên | Hồ sơ tạm tự xoá/ẩn sau X giờ không hoạt động |

### Nhóm C — Ghép cặp ăn uống theo vị trí (real-time)
| # | Chức năng | Mô tả |
|---|---|---|
| C1 | Hiện người dùng khác trên map | Hiển thị các user tạm thời gần đó (vị trí làm lệch ngẫu nhiên để bảo mật) |
| C2 | Gửi lời mời ăn chung | Bấm vào 1 user trên map → gửi request "rủ ăn cùng" |
| C3 | Chat trực tiếp | Nếu đối phương phản hồi, mở khung chat real-time |
| C4 | Chỉ đường A → B | Sau khi cả 2 đồng ý, hiện route chỉ đường thật từ vị trí người dùng đến người kia |
| C5 | Báo cáo / chặn | Cho phép báo cáo hành vi không phù hợp, ẩn người dùng khỏi map |

---

## 4. CÔNG NGHỆ ÁP DỤNG

| Thành phần | Công nghệ | Ghi chú |
|---|---|---|
| Backend API | ASP.NET Core Web API (.NET 10) | Clean Architecture, Minimal API hoặc Controller-based |
| Real-time | SignalR | Chat + cập nhật vị trí sống trên map |
| Database | PostgreSQL qua Supabase | Free hosting, dùng EF Core + Npgsql provider |
| ORM | Entity Framework Core | Code-first migration |
| Frontend | ReactJS + TypeScript | Vite làm build tool cho nhẹ và nhanh |
| State management | Zustand hoặc Context API | Nhẹ, đủ dùng cho scope này |
| Bản đồ | Leaflet.js + OpenStreetMap | Miễn phí hoàn toàn, không cần API key |
| Tra cứu quán ăn | Overpass API (OpenStreetMap) | Free, query theo bán kính + loại địa điểm |
| Routing chỉ đường | OSRM (Open Source Routing Machine) | Free public demo server hoặc tự host |
| Realtime location update | SignalR Hub + Geolocation API (trình duyệt) | Gửi toạ độ định kỳ khi user bật "tìm bạn ăn cùng" |
| Deploy Backend | Render (free tier, Docker) | Chấp nhận cold-start ~30-60s sau khi ngủ |
| Deploy Frontend | Vercel (free tier) | Deploy trực tiếp từ GitHub |
| Deploy Database | Supabase (free tier) | 500MB, đủ cho project portfolio |
| CI/CD | GitHub Actions | Tự động build & deploy khi push code |

---

## 5. THIẾT KẾ BẢNG DỮ LIỆU

```sql
-- Người dùng tạm thời (không cần đăng ký)
CREATE TABLE temp_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_name VARCHAR(100) NOT NULL,
    gender VARCHAR(20),
    food_preferences TEXT[],      -- mảng tag sở thích
    desired_food VARCHAR(200),
    current_lat DOUBLE PRECISION,
    current_lng DOUBLE PRECISION,
    location_visible BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'available',  -- available / matched / hidden
    created_at TIMESTAMP DEFAULT now(),
    expires_at TIMESTAMP
);

-- Danh mục món ăn
CREATE TABLE foods (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(20),          -- kho / nuoc
    cuisine_type VARCHAR(50),
    image_url TEXT,
    avg_price_range VARCHAR(20),   -- re / vua / cao
    meal_time VARCHAR(20),          -- sang/trua/toi/khuya
    is_active BOOLEAN DEFAULT true
);

-- Tag món ăn (cay, chay, healthy...)
CREATE TABLE food_tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

-- Bảng trung gian food - tag
CREATE TABLE food_food_tags (
    food_id INT REFERENCES foods(id) ON DELETE CASCADE,
    tag_id INT REFERENCES food_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (food_id, tag_id)
);

-- Cache quán ăn từ OSM
CREATE TABLE restaurants (
    id SERIAL PRIMARY KEY,
    external_place_id VARCHAR(100),
    name VARCHAR(200) NOT NULL,
    address TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    category VARCHAR(100),
    is_buffet BOOLEAN DEFAULT false,
    is_in_mall BOOLEAN DEFAULT false,
    mall_name VARCHAR(200),
    source VARCHAR(20) DEFAULT 'osm',
    last_synced_at TIMESTAMP DEFAULT now()
);

-- Lời mời ghép cặp ăn chung
CREATE TABLE match_requests (
    id SERIAL PRIMARY KEY,
    from_temp_user_id UUID REFERENCES temp_users(id) ON DELETE CASCADE,
    to_temp_user_id UUID REFERENCES temp_users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending',  -- pending/accepted/declined/expired
    created_at TIMESTAMP DEFAULT now()
);

-- Tin nhắn chat giữa 2 người
CREATE TABLE chat_messages (
    id SERIAL PRIMARY KEY,
    match_request_id INT REFERENCES match_requests(id) ON DELETE CASCADE,
    sender_temp_user_id UUID REFERENCES temp_users(id),
    message TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT now()
);

-- Log gợi ý món (tránh random trùng lặp trong phiên)
CREATE TABLE food_suggestion_logs (
    id SERIAL PRIMARY KEY,
    temp_user_id UUID REFERENCES temp_users(id) ON DELETE SET NULL,
    food_id INT REFERENCES foods(id),
    suggestion_type VARCHAR(30),  -- random_all / random_by_type / by_criteria
    suggested_at TIMESTAMP DEFAULT now()
);
```

**Ghi chú kỹ thuật:**
- Nên bật extension `pgcrypto` trong Supabase để dùng `gen_random_uuid()`
- Cân nhắc bật `PostGIS` nếu muốn query khoảng cách chính xác hơn (tính km thật thay vì công thức Haversine viết tay)
- Nên có 1 job định kỳ (Hangfire hoặc cron job đơn giản) để xoá `temp_users` đã hết hạn (`expires_at < now()`)

---

## 6. KẾ HOẠCH CODE TỪNG BƯỚC (6 TUẦN)

### Tuần 1 — Setup nền tảng & CSDL
- [ ] Khởi tạo repo (backend .NET, frontend React riêng 2 repo hoặc monorepo)
- [ ] Setup Supabase project, tạo bảng theo schema ở trên
- [ ] Setup ASP.NET Core Web API, cấu hình EF Core + Npgsql kết nối Supabase
- [ ] Viết migration, seed dữ liệu mẫu cho `foods`, `food_tags`
- [ ] Setup React project (Vite + TypeScript), cấu trúc thư mục cơ bản

### Tuần 2 — Chức năng gợi ý món ăn (Nhóm A)
- [ ] API: `GET /api/foods/random` (random toàn bộ)
- [ ] API: `GET /api/foods/random?category=kho|nuoc`
- [ ] API: `POST /api/foods/suggest` (theo tiêu chí: tag, ngân sách, giờ ăn)
- [ ] Frontend: màn hình quay số (spin wheel animation), màn hình chọn tiêu chí
- [ ] Test thủ công toàn bộ luồng random

### Tuần 3 — Tích hợp bản đồ & tra cứu quán ăn
- [ ] Tích hợp Leaflet.js hiển thị bản đồ + vị trí người dùng (Geolocation API)
- [ ] Backend: service gọi Overpass API tra cứu quán ăn theo bán kính + lưu cache vào `restaurants`
- [ ] API: `GET /api/restaurants/nearby?lat=&lng=&radius=`
- [ ] API: `GET /api/restaurants/buffet-mall?lat=&lng=` (lọc buffet trong TTTM)
- [ ] Frontend: hiển thị marker quán ăn trên map, popup thông tin

### Tuần 4 — Hồ sơ tạm thời & Real-time cơ bản
- [ ] API: `POST /api/temp-users` (tạo hồ sơ tạm)
- [ ] Frontend: form nhập thông tin (họ tên, giới tính, sở thích, món muốn ăn)
- [ ] Setup SignalR Hub trên backend (`LocationHub`)
- [ ] Frontend: kết nối SignalR, gửi vị trí định kỳ khi bật "tìm bạn ăn cùng"
- [ ] Hiển thị các `temp_users` khác đang `location_visible = true` trên map (làm lệch toạ độ ngẫu nhiên vài chục mét)

### Tuần 5 — Ghép cặp & Chat real-time
- [ ] API: `POST /api/match-requests` (gửi lời mời)
- [ ] SignalR: push thông báo real-time khi có lời mời mới
- [ ] API: `PUT /api/match-requests/{id}/respond` (đồng ý/từ chối)
- [ ] SignalR Hub cho chat: `ChatHub`, lưu tin nhắn vào `chat_messages`
- [ ] Frontend: giao diện chat popup khi match thành công

### Tuần 6 — Chỉ đường, hoàn thiện, kiểm thử, deploy
- [ ] Tích hợp OSRM: gọi API routing khi match được `accepted`, vẽ route trên Leaflet
- [ ] Chức năng báo cáo/chặn user (cập nhật `status = hidden`)
- [ ] Viết job xoá `temp_users` hết hạn
- [ ] Viết vài unit test cho service quan trọng (random logic, matching logic)
- [ ] Polish UI/UX, responsive mobile
- [ ] Deploy (xem mục 7)
- [ ] Quay video demo 2-3 phút, viết README

---

## 7. CÁC BƯỚC DEPLOY CUỐI CÙNG

### Bước 1 — Chuẩn bị Database (Supabase)
1. Tạo project mới trên supabase.com
2. Vào SQL Editor, chạy script tạo bảng ở mục 5
3. Lấy connection string (Settings → Database → Connection string → dùng chế độ "Session pooler" cho ổn định với EF Core)

### Bước 2 — Deploy Backend .NET lên Render
1. Viết `Dockerfile` cho project ASP.NET Core:
   ```dockerfile
   FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
   WORKDIR /src
   COPY . .
   RUN dotnet publish -c Release -o /app

   FROM mcr.microsoft.com/dotnet/aspnet:10.0
   WORKDIR /app
   COPY --from=build /app .
   ENTRYPOINT ["dotnet", "YourApi.dll"]
   ```
2. Push code lên GitHub
3. Trên Render: New → Web Service → connect GitHub repo → chọn Docker
4. Thêm Environment Variable: `ConnectionStrings__DefaultConnection` = connection string Supabase
5. Deploy, lấy URL dạng `https://your-api.onrender.com`
6. Lưu ý: free tier sẽ sleep sau ~15 phút không hoạt động, request đầu tiên sẽ chậm — có thể dùng UptimeRobot (free) để ping giữ ấm nếu cần demo trực tiếp

### Bước 3 — Deploy Frontend lên Vercel
1. Cấu hình biến môi trường trong React: `VITE_API_URL=https://your-api.onrender.com`
2. Push code frontend lên GitHub
3. Trên Vercel: Import Project từ GitHub → chọn framework Vite → deploy
4. Thêm Environment Variable tương ứng trong Vercel dashboard
5. Cấu hình CORS ở backend .NET cho phép domain Vercel gọi vào

### Bước 4 — Cấu hình CORS & SignalR cho production
```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
        policy.WithOrigins("https://your-app.vercel.app")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials());  // bắt buộc cho SignalR
});
```

### Bước 5 — Kiểm thử end-to-end sau deploy
- [ ] Test tạo hồ sơ tạm trên domain thật
- [ ] Test random món, tra cứu quán ăn
- [ ] Test 2 tab trình duyệt khác nhau (giả lập 2 người dùng) để kiểm tra match + chat real-time
- [ ] Test trên điện thoại thật (Geolocation cần HTTPS mới hoạt động — Vercel/Render đều có HTTPS mặc định nên ổn)

### Bước 6 — Hoàn thiện portfolio
- [ ] Viết README.md rõ kiến trúc, công nghệ, hướng dẫn chạy local
- [ ] Vẽ sơ đồ kiến trúc (có thể dùng draw.io hoặc Excalidraw)
- [ ] Quay video demo ngắn gọn, có giọng thuyết minh
- [ ] Đưa link live demo + link GitHub vào CV

---

## 8. RỦI RO CẦN LƯU Ý

| Rủi ro | Giải pháp |
|---|---|
| Render free tier cold-start chậm khi demo trực tiếp | Ping định kỳ bằng UptimeRobot, hoặc quay video demo sẵn phòng khi cold-start lúc phỏng vấn |
| Overpass API rate limit khi tra cứu nhiều | Cache kết quả vào bảng `restaurants`, giới hạn tần suất gọi |
| Vấn đề riêng tư khi hiện vị trí người dùng khác | Làm lệch toạ độ ngẫu nhiên, chỉ hiện chính xác sau khi match đồng ý |
| SignalR qua Render free tier có thể bị ngắt kết nối khi sleep | Thông báo rõ cho người dùng, hoặc thử nghiệm kỹ về reconnect logic của SignalR client |