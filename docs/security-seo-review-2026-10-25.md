# Rà bảo mật và SEO — 25/10/2026

Phạm vi: frontend React/Vite, cấu hình Vercel, API ASP.NET Core, quyền hồ sơ tạm, match, chat và vị trí. Đây là kết quả kiểm tra mã nguồn và môi trường local; chưa phải xác nhận an toàn của bản deploy.

## Đã sửa

| Khu vực | Thay đổi | Bằng chứng |
| --- | --- | --- |
| Frontend SEO | Thay favicon Vite mẫu; thêm mô tả HTML; đặt title, description và canonical theo bốn route công khai. Các thẻ chức năng trên trang chủ dùng liên kết thật để điều hướng bằng bàn phím và crawler. | `npm run lint`, `npm run build`; `dist/index.html` có icon/mô tả mới. |
| Riêng tư trên công cụ tìm kiếm | Route bản đồ, hồ sơ, tìm bạn, chat và đường đi có `X-Robots-Tag: noindex, nofollow`. Vercel mặc định noindex toàn site; chỉ project production đặt `FOODMATCH_SEO_INDEXABLE=1` cùng `VITE_PUBLIC_ORIGIN` HTTPS chính xác mới được lập chỉ mục các trang công khai. `PageMetadata` cũng cập nhật robots khi điều hướng trong SPA. | `npm run check:vercel` đạt cho cả cấu hình staging và production mẫu. `noindex` không phải kiểm soát truy cập. |
| Backend response | API và hub đặt `Cache-Control: no-store` để hạn chế cache JWT, chat và dữ liệu vị trí. | Smoke API thật xác nhận header có `no-store`, cùng các luồng A/B/C trên PostgreSQL thử. |

## Rà bảo mật hiện có

- Controller và hub riêng tư yêu cầu JWT; service kiểm tra owner/thành viên match và thời hạn hồ sơ. Chat chỉ đọc/gửi cho thành viên match còn hoạt động. Nearby chỉ trả nhãn “Trong 3 km”, không trả tọa độ hoặc khoảng cách chi tiết. Tọa độ GPS được giữ nguyên; người kia chỉ nhận sau khi chính chủ chia sẻ, tối đa 60 phút. Điểm hẹn yêu cầu cả hai còn chia sẻ. Smoke REST/SignalR xác nhận từ chối người thứ ba, hết hạn và thu hồi.
- Backend kiểm tra biên tọa độ và số hữu hạn, giới hạn kích thước body 64 KiB, dùng EF Core, xác minh Turnstile ở máy chủ khi tạo hồ sơ, áp dụng CORS allowlist và rate limit. URL quán Google Maps được giới hạn host/protocol. Cấu hình Overpass chỉ nhận endpoint HTTPS được duyệt.
- Frontend dùng React để escape văn bản, lọc URL ảnh động, tạo URL iframe từ nguồn cố định; Vercel có CSP, HSTS, `nosniff` và giới hạn geolocation. JWT tạm vẫn nằm trong `sessionStorage`, JavaScript có thể đọc được; kiểm soát XSS/CSP vẫn quan trọng. Key Maps Embed là key công khai và phải giới hạn API/referrer.
- Không thấy `.env` local được Git theo dõi; NuGet `--vulnerable --include-transitive` không báo gói dễ tổn thương. `npm audit --omit=dev` và `npm audit --audit-level=high` đều báo 0 lỗ hổng tại thời điểm kiểm tra.

## Bằng chứng build và kiểm thử local

- `.dotnet/dotnet.exe build backend/FoodMatch/FoodMatch.sln -c Release`: 0 warning, 0 error.
- Bài migration nâng cấp/rollback với database thử: 85/85 test backend đạt, 0 skip. Smoke SignalR/API đạt quyền A/B/C, CORS/Origin, rate limit, header chống cache và log API không chứa `access_token=`.
- `npm ci`, lint, build, `check:food-images` (62/62), `check:vercel` và hai lệnh audit đạt. Build còn cảnh báo chunk JS đầu khoảng 536 KB và chú thích Rollup trong dependency SignalR; đây không phải lỗi bảo mật đã xác nhận.
- Docker image build đúng context Render và khởi động với PostgreSQL thử; `/api/health` Healthy. Edge 390×844 với key Maps Embed local đạt luồng vòng quay, bản đồ, đường đi, điểm hẹn, GPS chính xác, thu hồi, reconnect và phiên hết hạn.

## Cổng còn cần xác nhận

1. Trên staging HTTPS: Turnstile thật, referrer Maps Embed, CSP/headers từ Vercel, CORS/WSS, log proxy có thể chứa query token SignalR, giới hạn IP thật sau Render proxy, backup/migration/rollback trên bản sao dữ liệu. Rate limiter hiện ở bộ nhớ một API instance.
2. Chạy [quy trình hai điện thoại](two-phone-acceptance.md) trên cùng bản staging HTTPS. Nearby có thể tiết lộ tín hiệu gần đúng khi GPS bị giả; ứng dụng không xác minh vị trí vật lý.
3. Kiểm tra lập chỉ mục production bằng Search Console sau khi có domain. Trang công khai hiện là SPA; Google có thể render JavaScript, nhưng metadata route không nằm sẵn trong HTML trả về của mọi URL. Nếu SEO là kênh thu hút chính, cần prerender/SSR các route công khai và đo kết quả thật trước khi gọi là SEO hoàn chỉnh.
4. Chưa load test ở quy mô lớn; truy vấn nearby lọc khoảng cách sau khi đọc các hồ sơ đang hoạt động, và lịch sử chat hiện không phân trang. Cần đánh giá tài nguyên trước khi tăng tải hoặc số instance.

Tài liệu đối chiếu: [Google Search Central về JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics), [Google về X-Robots-Tag](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag), [OWASP API Security Top 10](https://api-security.owasp.org/editions/2023/en/0x11-t10/).
