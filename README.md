# 🍲 Food Match

Food Match là một ứng dụng Web (Web App) kết hợp giữa "khám phá ẩm thực" và "kết nối xã hội dựa trên vị trí". 
Ứng dụng giúp bạn giải quyết vấn đề "hôm nay ăn gì?" một cách nhanh chóng, đồng thời tạo cơ hội ghép cặp với những người dùng khác đang ở gần để cùng đi ăn chung.

## 🎯 Mục Tiêu Dự Án
- Cung cấp trải nghiệm tìm kiếm, random món ăn vui vẻ, nhanh chóng mà **không cần đăng ký tài khoản**.
- Tạo ra những kết nối xã hội nhẹ nhàng, an toàn bằng cách hiển thị người dùng lân cận trên bản đồ.
- Hỗ trợ chat thời gian thực (real-time) và chỉ đường trực tiếp sau khi ghép cặp thành công.

## 🚀 Chức Năng Chính
1. **Khám Phá & Gợi Ý Món Ăn:**
   - Quay random ngẫu nhiên toàn bộ món ăn hoặc theo loại (khô/nước).
   - Gợi ý món ăn theo tiêu chí (chay, mặn, ngân sách, giờ ăn).
   - Random và tìm kiếm các quán ăn (hoặc buffet/TTTM) xung quanh vị trí hiện tại.

2. **Hồ Sơ Tạm Thời (Temp Profile):**
   - Tạo hồ sơ nhanh (tên, giới tính, món muốn ăn) không cần mật khẩu.
   - Tự động hủy/xóa hồ sơ sau 3 giờ không hoạt động để bảo mật thông tin.

3. **Ghép Cặp & Bản Đồ (Real-time):**
   - Hiển thị những người dùng đang tìm bạn ăn trên bản đồ (vị trí được làm lệch ngẫu nhiên để bảo mật).
   - Gửi lời mời "rủ đi ăn cùng".
   - Mở khung Chat thời gian thực (real-time) khi đối phương đồng ý.
   - Chỉ đường trực tiếp (Routing) từ vị trí của bạn đến đối phương.

## 💻 Công Nghệ Sử Dụng

### 🎨 Frontend & UI/UX
- **Framework:** React 19 + TypeScript + Vite 6
- **UI Library:** Ant Design Mobile (antd-mobile)
- **State Management:** Zustand 5
- **Maps & Routing:** Leaflet.js, React-Leaflet, OSRM
- **Real-time:** `@microsoft/signalr`
- **Design System & AI Tools:** [Google Stitch](https://stitch.withgoogle.com) kết hợp **Model Context Protocol (MCP)** để đồng bộ thiết kế từ AI tạo sinh (Text-to-UI) trực tiếp vào IDE.

### ⚙️ Backend
- **Framework:** ASP.NET Core Web API (.NET 10), C# 12
- **Architecture:** Clean Architecture
- **Real-time:** SignalR
- **ORM:** Entity Framework Core 10 (Code-first)
- **Database:** PostgreSQL 16
- **External APIs:** Overpass API (OpenStreetMap)

### ☁️ Nền Tảng Deploy (Dự Kiến)
- **Frontend:** [Vercel](https://vercel.com) (Free tier)
- **Backend:** [Render](https://render.com) (Docker deploy, Free tier)
- **Database:** [Supabase](https://supabase.com) (PostgreSQL Free tier)

## 🛠️ Hướng Dẫn Cài Đặt (Local Development)

### Yêu Cầu Cần Có
- [Node.js](https://nodejs.org/) (v22+)
- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
- [Docker Desktop](https://www.docker.com/products/docker-desktop) (để chạy PostgreSQL local)
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
   ```bash
   # Di chuyển vào thư mục sln
   cd backend/FoodMatch
   
   # Build và chạy Migration (nếu đã tạo)
   dotnet build
   dotnet run --project src/FoodMatch.Api
   ```
   *API sẽ chạy tại: `https://localhost:5001` hoặc `http://localhost:5000`*

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
*Dự án đang trong quá trình phát triển.*