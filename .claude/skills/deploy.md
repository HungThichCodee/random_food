# Food Match — triển khai sau khi đạt cổng phát hành

## Quy trình CI/CD hiện hành (23/10/2026)

1. Chạy các phép thử local ở mục 1 và xem [`docs/release-review.md`](../../docs/release-review.md). Với key Maps Embed giới hạn cho localhost:5173, chạy `$env:FOODMATCH_VISUAL_PORT='5173'; & .\scripts\capture-random-mobile.ps1`; script chụp năm ảnh vòng quay, kết quả, bản đồ, đường đi và điểm hẹn. Nếu đã có các ảnh `*-mobile-preview.png` ở thư mục gốc, chuyển hoặc xóa đúng các file đó trước khi chạy; script không ghi đè. URL iframe chính thức phải tải được nội dung Google trên màn hình 390×844.
2. Review diff và được chủ dự án đồng ý trước push. Sau push/PR, mở GitHub Actions → **Verify Food Match** và xác nhận cả hai job backend/frontend xanh ở SHA định phát hành. Workflow `release.yml` cũng gọi lại Verify trước mỗi lần triển khai.
3. Tạo **hai bộ tài nguyên riêng** cho `staging` và `production`: Supabase database, Render Web Service và Vercel project có domain cố định. Tạo service Render hay import/deploy Vercel có thể gây lần triển khai đầu; thực hiện staging sau khi bản thay đổi đã được duyệt. Đặt Render Auto-Deploy **Off**, giữ `frontend/vercel.mjs` với `git.deploymentEnabled=false`; từ đó chỉ workflow release tạo bản deploy. Cấu hình Cloudflare Turnstile, CORS và Google key theo từng domain; key phải được giới hạn đúng **Maps Embed API** và HTTP referrer của frontend staging/production. Theo [bảng giá Google](https://developers.google.com/maps/documentation/embed/usage-and-billing), Maps Embed API không tính phí theo lượt; cần bật billing cho Cloud project. Không bật Places/Routes API tính phí. Iframe không trả danh sách quán cho ứng dụng.
4. Ở GitHub **Settings → Environments**, tạo `staging` và `production`, giới hạn branch `main` và bật **Required reviewers** cho production. Trong **mỗi environment**, khai báo secrets `RENDER_API_KEY`, `VERCEL_TOKEN` và vars `RENDER_SERVICE_ID` (dạng `srv-...`), `API_ORIGIN` (`https://...`), `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `WEB_ORIGIN` (`https://...`). Dùng ID và domain của đúng môi trường. Token Render cần quyền deploy service; token Vercel cần quyền deploy project.
5. Ở mỗi Render service, đặt cấu hình mục 3, gồm `GoogleMaps__EmbedApiKey`, chuỗi kết nối và Turnstile secret. Ở mỗi Vercel project, Root Directory `frontend`, đặt Production environment `VITE_API_URL`, `VITE_SIGNALR_URL`, `VITE_TURNSTILE_SITE_KEY`, `GoogleMaps__EmbedApiKey` và biến ảnh nếu cần. Vì mỗi môi trường dùng Vercel project riêng, workflow chạy `vercel pull --environment=production`, `vercel build --prod` và `vercel deploy --prebuilt --prod` cho cả hai; không dùng Preview URL thay đổi. Build release đặt `FOODMATCH_REQUIRE_MAPS_EMBED_KEY=1` để từ chối thiếu key. Key Embed là công khai trong URL iframe; không đặt JWT, DB password hoặc Turnstile secret ở Vercel.
6. Sau khi cấu hình staging, vào **Actions → Release Food Match → Run workflow**, chọn branch `main`, target `staging`. Workflow xác minh SHA Render trả về, đợi API `/api/health` Healthy, build/deploy Vercel, rồi so hash HTML của `/`, `/map`, `/route` trên domain công khai với đúng artifact đã build để phát hiện alias còn trỏ bản cũ. Xác nhận URL GitHub Environment và deployment SHA. Chạy [`docs/two-phone-acceptance.md`](../../docs/two-phone-acceptance.md) trên staging HTTPS, gồm key/referrer, iframe, Turnstile, WSS, quyền vị trí độc lập, GPS chính xác, thu hồi và nối lại mạng. Kiểm tra CSP/CORS, backup và rollback trước production.
7. Khi staging đạt, chọn target `production` trong cùng workflow từ đúng commit đã kiểm chứng và chờ người duyệt GitHub Environment. Xác nhận health, UI và log sau deploy. Nếu lỗi, dừng release, khôi phục deployment trước ở Render/Vercel, kiểm tra database migration có thể rollback hay cần restore backup. Không chạy rollback schema mù trên database có dữ liệu mới.

[Verify run đầu](https://github.com/HungThichCodee/random_food/actions/runs/39984638973) và [run commit tài liệu](https://github.com/HungThichCodee/random_food/actions/runs/39986043629) đều đạt frontend/backend trên nhánh review. Các bước deploy 2–7 chưa chạy trên hosting. Chỉ báo **sẵn sàng bắt đầu staging** sau khi local gate và CI commit sẽ triển khai đạt, chủ dự án duyệt bản review; **sẵn sàng production** cần biên bản thử staging trên hai điện thoại. Xem [kế hoạch Maps Embed](../../docs/maps-embed-plan.md) và [bảng trạng thái phát hành](../../docs/release-review.md).

**Chưa deploy** cho đến khi `../implementation_plan.md` và `../rules/security.md` được kiểm chứng. Quy trình này dành cho Supabase PostgreSQL → Render Docker API → Vercel Vite SPA. Không đưa secret vào Git hoặc `VITE_*`. Push/publish cần người dùng duyệt bản thay đổi cụ thể.

## 1. Kiểm tra trước khi đẩy mã

Từ `F:\random_food` trên PowerShell:

```powershell
git.exe status --short
.\.dotnet\dotnet.exe build .\backend\FoodMatch\FoodMatch.sln -c Release
.\.dotnet\dotnet.exe test .\backend\FoodMatch\FoodMatch.sln -c Release
cd .\frontend
npm.cmd ci
npm.cmd run lint
npm.cmd run build
npm.cmd audit --omit=dev
npm.cmd audit --audit-level=high
```

Sau Release build, chạy tuần tự `& .\scripts\smoke-signalr.ps1` và `& .\scripts\test-location-migration.ps1` từ thư mục gốc khi Docker PostgreSQL local đang hoạt động. Cả hai script dùng PostgreSQL thử riêng; smoke và bài Edge cùng dùng cổng API 5099 nên không chạy đồng thời. Smoke kiểm tra WebSocket, chia sẻ vị trí độc lập, nearby 3 km, điểm hẹn, người ngoài, JWT hết hạn và `429`/`Retry-After`; kiểm tra log không chứa `access_token=`. Bài migration kiểm tra nâng cấp trạng thái chia sẻ cũ và chạy **85 test backend, 0 skip** ngày 23/10/2026. Kết quả local không thay cho HTTPS/WSS và hai điện thoại.

Kiểm tra đúng Dockerfile và context sẽ dùng trên Render, sau đó chạy image với PostgreSQL thử riêng:

```powershell
cd F:\random_food
Push-Location .\backend\FoodMatch
docker build -f src/FoodMatch.Api/Dockerfile -t foodmatch-api:preflight .
Pop-Location
& .\scripts\smoke-docker-api.ps1
```

Script Docker chỉ nhận chuỗi kết nối PostgreSQL local từ `.env`, tạo database thử mới, đưa API image lên cổng `127.0.0.1:5098`, kiểm tra `/api/health`, rồi xóa container và database thử. Cần container `foodmatch-postgres` đang chạy. `.dockerignore` loại `bin/obj`, test và `.env` khỏi build context. Kết quả này xác nhận image khởi động trên Linux local; vẫn phải thử các biến Production, TLS và Supabase/Render thật.

Nếu có Edge trên Windows, đặt `$env:FOODMATCH_VISUAL_PORT='5173'` khi key Google chỉ cho localhost:5173 rồi chạy `& .\scripts\capture-random-mobile.ps1` từ thư mục gốc. Bài dùng database thử riêng, chụp năm ảnh vòng quay, kết quả, Bản đồ, Đường đi và điểm hẹn ở 390×844. Nó kiểm tra GPS chính xác, điểm giữa thay đổi, quyền thu hồi và SignalR nối lại. Mặc định dùng cổng 5174 nếu không đặt biến. Chuyển hoặc xóa đúng các ảnh `*-mobile-preview.png` cũ ở thư mục gốc trước khi chạy; ảnh trong `docs/screenshots/` là bằng chứng trước đó. Vẫn cần kiểm tra trên hai điện thoại thật.

Ba bài kiểm tra PostgreSQL ở `PostgresIntegrityTests.cs` mặc định báo skip. Trên một database thử riêng mới chạy migration, có tên bắt đầu `foodmatch_test_`, đặt `FOODMATCH_TEST_CONNECTION` rồi chạy `dotnet test` lại; yêu cầu các bài rollback, ghi đồng thời và seed phục hồi đều đạt. Không trỏ biến này vào database có dữ liệu thật.

`npm ci` từ lockfile đã kiểm chứng ngày 20/10/2026, nhưng npm có thể cảnh báo peer dependency của Ant Design Mobile với React 19. Sau khi cài vẫn phải chạy lint/build và thử các luồng tương tác trên điện thoại thật.

Workflow [`.github/workflows/verify.yml`](../../.github/workflows/verify.yml) chạy khi có push, pull request hoặc được [release workflow](../../.github/workflows/release.yml) gọi: backend dùng .NET 10 và PostgreSQL 16 tạm, áp dụng EF migrations lên database `foodmatch_test_ci` chưa seed rồi chạy cả bộ test (gồm ba bài PostgreSQL); frontend dùng Node 22 để chạy `npm ci`, lint, build, hai lệnh audit và `check:vercel`. Verify chỉ xác minh. [Run đầu](https://github.com/HungThichCodee/random_food/actions/runs/39984638973) và [run commit tài liệu](https://github.com/HungThichCodee/random_food/actions/runs/39986043629) trên GitHub đã đạt cả hai job. Release chạy thủ công và gọi Verify cho chính commit được triển khai trước khi qua GitHub Environment.

CI không tự chặn nền tảng hosting triển khai khi có commit. **Tạo Render Web Service sẽ khởi chạy lần deploy đầu tiên**, nên chỉ tạo service sau khi bản staging đã được duyệt; khi tạo, chọn Auto-Deploy `Off` nếu biểu mẫu cho phép, hoặc đổi ngay tại **Settings → Auto-Deploy → Off** trước lần push tiếp theo. Mặc định Render có thể deploy ngay khi push. `frontend/vercel.mjs` đặt `git.deploymentEnabled: false`, nên Vercel không tự tạo deployment từ push/PR; việc import project và bấm **Deploy** cũng là một lần triển khai, chỉ làm sau khi được duyệt. Sau khi cả hai job CI xanh và bản thay đổi được duyệt, tạo staging, thử trên hai điện thoại, rồi mới thực hiện bước phát hành production đã được duyệt. Nếu sau này muốn Render tự deploy, chỉ chuyển sang **After CI Checks Pass** sau khi các cổng kiểm thử staging và quy trình phê duyệt phù hợp; không chọn **On Commit** cho production. [Render mô tả lần deploy đầu khi tạo service](https://render.com/docs/web-services) và [ba chế độ auto-deploy](https://render.com/docs/deploys); [Vercel hỗ trợ tắt deployment từ Git trong cấu hình dự án](https://vercel.com/docs/project-configuration/git-configuration).

Với staging đã được duyệt, dùng workflow Release ở đầu tài liệu để deploy đúng SHA. Nếu workflow gặp sự cố và cần thao tác thủ công, chọn **Deploy a specific commit** trên Render rồi build/deploy cùng SHA bằng Vercel CLI trong project đúng môi trường; ghi rõ lý do và đối chiếu biến môi trường. [Render manual deploy](https://render.com/docs/deploys), [Vercel CLI Preview/Production](https://vercel.com/docs/projects/deploy-from-cli).

Audit lại ngày 22/10/2026 sau khi nâng frontend chính lên Tailwind 4.3.3: `npm ci`, lint, build, Edge 390×844 và cả hai lệnh audit ở trên đều đạt; audit đầy đủ và production đều báo 0 lỗ hổng. CSS reset đã chuyển vào `@layer base` và màu chữ liên kết Google Maps được xác định rõ để tránh Ant Design Mobile ghi đè. [Tailwind 4 cần Safari 16.4+, Chrome 111+ hoặc Firefox 128+](https://tailwindcss.com/docs/upgrade-guide); xác nhận phiên bản trình duyệt trên hai điện thoại thật trước release. Xem các cổng còn thiếu trong [`docs/release-review.md`](../../docs/release-review.md).

Rà diff và mã có secret, kiểm tra các cổng API/FE/vị trí/CAPTCHA/rate limit/transaction. Test hai tài khoản thật trên HTTPS, không chỉ mock. Review migration trên DB mới và bản sao DB nâng cấp; giữ backup và cách rollback. Nếu đã lộ khóa, rotate ở nhà cung cấp trước khi phát hành.

## 2. Supabase

Tạo project PostgreSQL, lưu password trong trình quản lý secret. Dashboard → Connect → chọn **Session pooler** nếu Render cần IPv4. Sao chép host/username/port thực tế; dạng Npgsql:

```text
Host=<pooler-host>;Port=5432;Database=postgres;Username=postgres.<project-ref>;Password=<secret>;SSL Mode=Require
```

Kết nối này chỉ đưa vào Render Environment. Backend hiện gọi `Database.MigrateAsync()` và seed khi startup: không chạy trùng cùng migration bằng SQL Editor. Không cần bật `pgcrypto` khi migration hiện hành không dùng nó. Xác nhận bảng `__EFMigrationsHistory`, seed và log sau startup. Với vận hành production nghiêm ngặt, chuyển migration sang job/bundle có kiểm soát trước khi tăng số replica; không coi health DB là bằng chứng migration thành công.

## 3. Render API

Tạo Web Service từ GitHub, runtime Docker:

| Thiết lập | Giá trị |
|---|---|
| Root Directory | `backend/FoodMatch` |
| Dockerfile Path | `src/FoodMatch.Api/Dockerfile` |
| Docker Context | `.` |
| Health Check Path | `/api/health` |
| Auto-Deploy | `Off` sau lần tạo service đầu tiên, trước lần push tiếp theo |

Docker context này bắt buộc vì Dockerfile `COPY src/...`. Đặt Environment:

```text
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://0.0.0.0:8080
PORT=8080
ConnectionStrings__DefaultConnection=<Supabase Npgsql connection string>
# Maps Embed API cho iframe Chat và bản đồ/đường đi frontend; khóa xuất hiện ở trình duyệt.
GoogleMaps__EmbedApiKey=<restricted-public-google-maps-embed-key>
# Tùy chọn: chỉ khi muốn thêm danh sách OSM bên cạnh Google Maps.
MeetingPlaces__OverpassUrl=https://<your-approved-overpass-interpreter>
JwtSettings__Secret=<random secret ít nhất 32 byte>
JwtSettings__Issuer=FoodMatchApi
JwtSettings__Audience=FoodMatchClient
Cors__Origins=https://<frontend-production-domain>
Turnstile__SecretKey=<real-secret-from-cloudflare>
Turnstile__Hostname=<frontend-production-hostname-without-https>
```

Nếu dùng một API cho cả Production và staging, thêm hostname staging chính xác vào `Turnstile__Hostname`, ngăn bằng dấu phẩy; ví dụ `app.example.com,staging.example.com`. Đăng ký cả hai hostname trên widget Cloudflare tương ứng với `VITE_TURNSTILE_SITE_KEY`, và thêm **origin HTTPS** của staging vào `Cors__Origins`. Backend so khớp từng hostname từ Siteverify; không nhận URL, port, wildcard hoặc IP trong cấu hình. Dùng domain staging ổn định để không phải đổi allowlist khi URL Preview thay đổi. [Cloudflare yêu cầu cấu hình hostname cho widget](https://developers.cloudflare.com/turnstile/additional-configuration/hostname-management/) và [Siteverify trả hostname để server kiểm tra](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/). Bản local chỉ kiểm tra bằng response Siteverify giả lập; chưa kiểm chứng khóa và domain Cloudflare thật.

Không cần `MeetingPlaces__OverpassUrl` để dùng luồng Google Maps: iframe cho xem kết quả quanh điểm giữa, người dùng dán liên kết quán và phía kia xác nhận. Khi bỏ trống, danh sách OSM tắt ở mọi môi trường; ứng dụng từ chối endpoint `overpass-api.de` công khai mặc định. Chỉ đặt endpoint HTTPS riêng hoặc dịch vụ đã được duyệt nếu muốn danh sách OSM bổ sung; kiểm tra từ Render. Để dùng chế độ tìm quán chính thức trong iframe, tạo Google Cloud project có billing, bật Maps Embed API, tạo **khóa chỉ dùng Maps Embed API và giới hạn HTTP referrer** cho domain staging/production rồi đặt `GoogleMaps__EmbedApiKey`. Khóa này được gửi trong URL iframe tới trình duyệt nên không phải secret backend; không dùng khóa server không giới hạn. [Google hướng dẫn Embed API search với `q`, `center`, `zoom` và key](https://developers.google.com/maps/documentation/embed/embedding-map). Iframe không cấp dữ liệu danh sách cho ứng dụng, nên không tự nhận diện quán người dùng bấm. Thêm CAPTCHA secret và các secret mới nếu mã đã triển khai chúng; không dùng giá trị ví dụ ở production. `Cors__Origins` là origin chính xác, không có path hoặc dấu `/` cuối; nếu có nhiều origin đã duyệt thì phân cách dấu phẩy. Không dùng wildcard. Render nhận HTTPS bên ngoài và chuyển tiếp HTTP nội bộ; ứng dụng phải lắng nghe `0.0.0.0`. Kiểm tra log startup, migration, `GET https://<api>/api/health`, status DB và SignalR WSS. Xác nhận access log của proxy không lưu giá trị `access_token` trong query của kết nối SignalR. Rate limiter hiện ở bộ nhớ mỗi instance; giữ một API instance hoặc thay bằng giới hạn phân tán trước khi tăng replica. Render có bảo vệ DDoS ở edge; kiểm tra chính sách edge và không coi rate limiter ứng dụng là lớp chống DDoS duy nhất.

API hiện dùng `CF-Connecting-IP` cho hạn mức IP chung 240 request/phút/instance và các policy của request ẩn danh khi `RENDER=true`. Chỉ dùng cách này với **public Render web service**: [Render xác nhận Cloudflare ghi đè header đó](https://render.com/articles/host-pocketbase-on-render#making-pocketbase-see-the-real-client-ip), còn `X-Forwarded-For` có thể chứa giá trị do caller tự gửi. [Render mặc định đặt `RENDER=true`](https://render.com/docs/environment-variables). Trước phát hành, kiểm tra hai IP mạng thật nhận bucket riêng, nhiều JWT cùng IP chia sẻ hạn mức chung, gửi header giả không đổi bucket, và trường hợp header thiếu; nếu đổi sang private service/proxy khác thì phải thiết kế lại nguồn IP tin cậy.

Nếu endpoint riêng trả HTTP 406/429, ứng dụng tạm ngừng gọi 30 giây rồi mới thử lại.

Liên kết quán do A dán chỉ được kiểm tra là URL Google Maps hợp lệ; ứng dụng không xác minh quán đó nằm gần điểm giữa hoặc còn hoạt động. B cần xem liên kết trước khi xác nhận. Khi thiếu `GoogleMaps__EmbedApiKey`, iframe vẫn dùng URL cũ `maps.google.com/maps?...&output=embed`, nhưng luồng này không phải Maps Embed API search chính thức và chưa chứng minh danh sách quán chính xác. Trước phát hành cần key thật và thử iframe search trên hai điện thoại; nếu cần danh sách quán thành dữ liệu riêng trong ứng dụng thì phải dùng [Places API Nearby Search](https://developers.google.com/maps/documentation/places/web-service/nearby-search), không thể đọc danh sách từ iframe.

## 4. Vercel frontend

Tạo hai Vercel project riêng cho staging/production từ cùng repository; Root Directory `frontend`; framework Vite; Install Command `npm ci`; Build Command `npm run build`; Output `dist`. `frontend/vercel.mjs` tắt deployment tự động từ Git. Mỗi project dùng Production environment và domain cố định, triển khai qua workflow Release sau khi đủ cổng. Trong Project Settings → Environment Variables của từng project đặt:

```text
VITE_API_URL=https://<api>.onrender.com
VITE_SIGNALR_URL=https://<api>.onrender.com
VITE_TURNSTILE_SITE_KEY=<public-site-key-from-cloudflare>
# Key công khai, cùng giá trị đã giới hạn referrer/API trên Render:
GoogleMaps__EmbedApiKey=<restricted-public-google-maps-embed-key>
# Tùy chọn nếu Food.ImageUrl dùng CDN khác hai nguồn ảnh mặc định:
VITE_FOOD_IMAGE_ORIGINS=https://<approved-image-cdn>
```

Hai biến URL API/SignalR là origin HTTPS chính xác, không thêm `/api`, `/hubs`, path hoặc query; mã tự nối các đường đó. `VITE_FOOD_IMAGE_ORIGINS` tùy chọn nhận các origin HTTPS chính xác phân cách bằng dấu phẩy; giao diện chỉ tải `Food.ImageUrl` từ hai nguồn mặc định (Unsplash/Wikimedia) hoặc danh sách này, và CSP `img-src` dùng cùng danh sách. Không dùng `frontend/.env.production` làm nguồn duy nhất: `frontend/vite.config.ts` đặt `envDir` về repo root. Không đưa API secret/JWT/DB password vào biến `VITE_*`, vì chúng nằm trong bundle công khai. Sau thay biến, tạo deployment mới.

`frontend/vercel.mjs` tạo rewrite SPA và CSP từ đúng `VITE_API_URL`/`VITE_SIGNALR_URL` của deployment; thiếu biến, URL HTTP hoặc URL có path sẽ làm cấu hình thất bại. Origin ảnh bổ sung cũng phải là HTTPS chính xác. Nó chỉ cho `connect-src` tới origin API, SignalR HTTPS/WSS và Cloudflare Turnstile. Không đặt thêm `vercel.json` cùng thư mục. Sau khi đặt biến Vercel, kiểm tra tại máy với đúng các origin dự định dùng:

```powershell
cd frontend
$env:VITE_API_URL = 'https://<api>.onrender.com'
$env:VITE_SIGNALR_URL = 'https://<api>.onrender.com'
$env:VITE_FOOD_IMAGE_ORIGINS = 'https://<approved-image-cdn>' # Bỏ nếu không dùng
npm.cmd run check:vercel
```

Kiểm tra refresh trực tiếp `/chat/:id`, `/route` và các route khác. Sau khi biết domain Vercel Production/Preview dùng để thử, thêm từng origin chính xác vào `Cors__Origins` và từng hostname chính xác vào `Turnstile__Hostname` trên Render, thêm hostname đó vào widget Cloudflare, rồi deploy lại API; Preview URL đổi thì cập nhật các allowlist tương ứng. Kiểm tra Network/Console trên domain thật để xác nhận các kết nối hợp lệ và iframe không bị CSP chặn; kiểm tra HTTP response có header CSP vừa tạo. Cổng xác minh trên domain production vẫn chưa đạt cho đến khi thử thực tế.

## 5. Kiểm thử sau triển khai

- HTTPS web/API và WSS SignalR; quyền Geolocation trên điện thoại; không mixed content.
- CORS: origin production được phép; origin lạ bị từ chối; preflight và credentials đúng chiến lược phiên. CORS không phải cơ chế phân quyền.
- CSP từ `frontend/vercel.mjs`: mở trang trên điện thoại và xem Console/Network để xác nhận Turnstile, Google Maps, font và ảnh không bị chặn. Đối chiếu `connect-src` trong response với URL API/SignalR production; kiểm tra WebSocket từ Origin lạ bị 403.
- Hai tài khoản A/B: chạy từng bước trong [`docs/two-phone-acceptance.md`](../../docs/two-phone-acceptance.md). Nearby không trả tọa độ; A chia sẻ thì B nhận ngay tọa độ chính xác của A dù B chưa chia sẻ, và chiều ngược lại tương tự. A thu hồi/hết 60 phút thì B mất tọa độ A, còn A vẫn thấy B nếu B còn chia sẻ. Người thứ ba không nhận tọa độ qua REST/SignalR; route cũ không tiếp tục dùng vị trí đã thu hồi.
- Tính năng điểm hẹn chỉ xuất hiện khi cả hai còn quyền chia sẻ: iframe Google Maps thấy quán quanh điểm giữa, A dán liên kết quán, B xác nhận, hai máy thấy cùng địa điểm; thu hồi/hết hạn xóa địa điểm khỏi response và route. Xử lý GPS mất tín hiệu, mạng gián đoạn và nguồn Overpass bổ sung không trả lời.
- Thử input sai, truy cập chéo, CAPTCHA giả/hết hạn, rate limit 429, log từ chối có actor/time/reason nhưng không có token/vị trí; kiểm tra backup và rollback.
- Nếu bất kỳ gate nào trượt: dừng phát hành, sửa và kiểm tra lại. Không dùng health check đơn lẻ để kết luận đã sẵn sàng.

Nguồn nhà cung cấp: [Render monorepo](https://render.com/docs/monorepo-support), [Render Docker](https://render.com/docs/docker), [Render WebSocket](https://render.com/docs/websocket), [Vercel build settings](https://vercel.com/docs/builds/configure-a-build), [Vercel programmatic config](https://vercel.com/docs/project-configuration/vercel-ts), [Supabase connections](https://supabase.com/docs/guides/database/connecting-to-postgres), [EF migrations](https://learn.microsoft.com/en-us/ef/core/managing-schemas/migrations/applying).
