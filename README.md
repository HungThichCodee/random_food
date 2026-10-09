# 🍲 Food Match

Food Match là một ứng dụng Web (Web App) kết hợp giữa "khám phá ẩm thực" và "kết nối xã hội dựa trên vị trí". 
Ứng dụng giúp bạn giải quyết vấn đề "hôm nay ăn gì?" một cách nhanh chóng, đồng thời tạo cơ hội ghép cặp với những người dùng khác đang ở gần để cùng đi ăn chung.

## 🎯 Mục Tiêu Dự Án
- Cung cấp trải nghiệm tìm kiếm, random món ăn vui vẻ, nhanh chóng mà **không cần đăng ký tài khoản**.
- Tạo ra những kết nối xã hội nhẹ nhàng, an toàn bằng cách hiển thị người dùng lân cận trên bản đồ.
- Hỗ trợ chat thời gian thực (real-time) và chỉ đường trực tiếp sau khi ghép cặp thành công.

## 🚀 Chức Năng Chính & Lợi Ích
1. **Khám Phá & Gợi Ý Món Ăn (Giải Quyết "Hôm nay ăn gì?"):**
   - Quay random ngẫu nhiên món ăn bằng giao diện "Slot Machine" mượt mà.
   - Trải nghiệm nhanh chóng, **không cần đăng ký tài khoản** hay mật khẩu rườm rà.
   - Tìm kiếm quán ăn siêu tốc, khóa chặt vị trí chính xác của bạn qua Google Maps (không bị nhảy bản đồ đi xa).
   - *Lợi ích:* Quyết định món ăn trong 3 giây, tiết kiệm thời gian đau đầu suy nghĩ.

2. **Hồ Sơ Tạm Thời & Quyền Riêng Tư An Toàn:**
   - Tạo hồ sơ "dùng 1 lần" (tên, giới tính, món muốn ăn).
   - Tự động hủy/xóa hồ sơ sau 3 giờ không hoạt động để bảo vệ quyền riêng tư tuyệt đối.
   - *Lợi ích:* Không lo lộ thông tin cá nhân, không bị spam, hoàn toàn ẩn danh cho đến khi bạn quyết định chia sẻ.

3. **Kết Nối Xã Hội & Ghép Cặp (Đi ăn không còn một mình):**
   - Hiển thị những người dùng đang tìm bạn ăn xung quanh trên một danh sách gợi ý siêu đẹp.
   - Gửi lời mời và mở khung Chat thời gian thực (SignalR) ngay lập tức khi đối phương đồng ý.
   - *Lợi ích:* Mở rộng vòng tròn xã hội, tìm cạ cứng ăn uống chung khẩu vị một cách tự nhiên và an toàn.

4. **Chỉ Đường & Bản Đồ Google Maps:**
   - Chỉ đường trực tiếp (Routing) ngay trong web app từ vị trí của bạn đến đối phương hoặc đến quán ăn.
   - Nút chia sẻ toạ độ GPS chính xác 100% trong phòng chat.
   - *Lợi ích:* Gặp mặt dễ dàng không lo lạc đường, không cần thoát app để mở app bản đồ khác.

5. **Thiết Kế UI/UX Mobile-First Hiện Đại:**
   - Hoàn toàn làm sạch dữ liệu giả (mock data), ứng dụng chạy 100% dữ liệu thật.
   - Giao diện Dark Mode sử dụng Glassmorphism (Kính mờ) mang lại cảm giác app hẹn hò cao cấp.
   - Hỗ trợ đa ngôn ngữ (Tiếng Việt / Tiếng Anh) chuyển đổi mượt mà.

## 💻 Công Nghệ Sử Dụng

### 🎨 Frontend & UI/UX
- **Framework:** React 19 + TypeScript + Vite 6
- **UI Library:** Ant Design Mobile (antd-mobile) + Tailwind CSS
- **State Management:** Zustand 5
- **Maps & Routing:** Leaflet.js, React-Leaflet, OSRM
- **Đa ngôn ngữ:** `react-i18next`

### ⚙️ Backend
- **Framework:** ASP.NET Core Web API (.NET 10), C# 12
- **Architecture:** Clean Architecture
- **Real-time:** SignalR
- **ORM:** Entity Framework Core 10 (Code-first)
- **Database:** PostgreSQL 16
- **Khác:** `AspNetCore.HealthChecks.Npgsql`

### ☁️ Nền Tảng Deploy (Dự Kiến)
- **Frontend:** [Vercel](https://vercel.com)
- **Backend:** [Render](https://render.com) (Docker deploy)
- **Database:** [Supabase](https://supabase.com) (PostgreSQL)

## 🛠️ Hướng Dẫn Cài Đặt (Local Development)

### Yêu Cầu Cần Có
- [Node.js](https://nodejs.org/) (v22+)
- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- Git

### Các Bước Khởi Chạy

1. **Clone repository:**
   ```bash
   git clone https://github.com/your-username/random-food.git
   cd random-food
   ```

2. **Khởi chạy Database (PostgreSQL):**
   ```bash
   docker-compose up -d
   ```

3. **Cài đặt & Chạy Backend:**
   > **Yêu cầu:** Máy tính cần cài đặt sẵn [.NET 10 SDK](https://dotnet.microsoft.com/download).

   ```bash
   # Di chuyển vào thư mục backend
   cd backend/FoodMatch
   
   # Build và chạy dự án
   dotnet build
   dotnet run --project src/FoodMatch.Api
   ```
   *API sẽ chạy tại: `http://localhost:5000` hoặc `https://localhost:5001`*


4. **Cài đặt & Chạy Frontend:**
   ```bash
   # Mở một terminal mới, vào thư mục frontend
   cd frontend
   
   # Cài đặt thư viện
   npm install
   
   # Khởi chạy dev server
   npm run dev
   ```
   *Frontend sẽ chạy tại: `http://localhost:5173`*

## 🎨 Tích hợp Giao diện (Google Stitch MCP)

Dự án này sử dụng **Google Stitch** để thiết kế giao diện Mobile-First. Trợ lý AI (Antigravity IDE) được kết nối trực tiếp với bản thiết kế qua giao thức MCP (Model Context Protocol).

**Cách kết nối (Dành cho Developer):**
1. Lấy **API Key** từ giao diện Settings của Stitch (chọn đúng khóa đang hoạt động trong dropdown).
2. Tạo file `.env` ở thư mục gốc của dự án và thêm dòng:
   ```env
   STITCH_API_KEY=mã_của_bạn
   ```
3. IDE sẽ tự động đọc khóa này thông qua file cấu hình `.agents/mcp_config.json`.
4. Mở Command Palette -> chọn **Reload Window** để tải lại máy chủ MCP.
5. Lúc này, AI có thể tự động đọc Design System, mã màu, và các màn hình (screens) từ Stitch để lập trình giao diện.

---
*Dự án Food Match đang phát triển.*