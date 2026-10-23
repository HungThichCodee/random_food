# Kế hoạch dùng Maps Embed API trong Food Match

## Phạm vi và giới hạn

Chỉ dùng Maps Embed API của Google cho bản đồ tương tác. Theo [bảng giá hiện hành của Google](https://developers.google.com/maps/documentation/embed/usage-and-billing), Maps Embed không tính phí theo lượt dùng; vẫn cần Google Cloud project, bật API và API key. Không tích hợp Places API, Routes API hay dịch vụ địa điểm tính phí khác. Người dùng vẫn phải lấy và dán liên kết Google Maps để đề xuất quán: iframe không trả danh sách địa điểm hoặc quán được bấm cho mã ứng dụng.

Tọa độ GPS của từng người được lưu và truyền nguyên giá trị đã đo. Nearby chỉ hiện nhãn trong 3 km. Trong cặp đã match, mỗi người chia sẻ độc lập tối đa 60 phút. Chỉ khi cả hai còn chia sẻ, ứng dụng mới gửi **điểm giữa** tới Google Maps để tìm quán; thu hồi một bên phải ẩn ngay phần điểm hẹn. Tuyến đường tới người kia chỉ có khi chính người kia còn chia sẻ.

## Cải tiến trong mã nguồn

| Màn hình | Hành vi có key Embed | Đường dự phòng khi không có key |
| --- | --- | --- |
| Bản đồ | `view` cho GPS của mình; `search` cho từ khóa đã nhập hoặc nút Quán ăn/Cà phê/Món chay. Tâm bản đồ dùng GPS mới nhất, tọa độ hồ sơ chỉ là dự phòng có cảnh báo. | URL iframe Google Maps cũ. |
| Đường đi | `directions` từ GPS của mình đến tọa độ được phép xem hoặc điểm đến công khai. Cho chọn Đi bộ/Lái xe, đơn vị mét. Mỗi lần mở route riêng phải tải lại quyền từ API. | URL iframe Google Maps cũ; không hiển thị lựa chọn phương tiện không được hỗ trợ. |
| Chat/điểm hẹn | `search` quanh điểm giữa, với bốn lựa chọn Quán ăn/Cà phê/Món chay/Đồ ngọt. Server giữ allowlist loại tìm kiếm; OSM bổ sung chỉ dùng cho loại Quán ăn khi có nguồn Overpass riêng. | URL iframe Google Maps cũ, vẫn giữ quyền chia sẻ và điểm giữa. |

Các URL Embed dùng `referrerpolicy=strict-origin-when-cross-origin`. Key nằm trong iframe URL và có thể được trình duyệt nhìn thấy; phải giới hạn **Maps Embed API** và chính xác các website frontend được phép. `GoogleMaps__EmbedApiKey` là cấu hình chung: backend đọc trực tiếp; Vite chỉ đưa riêng key này vào bundle frontend. Không đưa JWT, Turnstile secret hoặc chuỗi kết nối vào bundle.

Giao diện Bản đồ và Đường đi báo rõ Google nhận vị trí đang hiển thị; Chat báo rõ Google nhận **tọa độ điểm giữa** khi iframe điểm hẹn tải. Iframe điểm hẹn không nhận riêng tọa độ A và B. Ảnh viewport 390×844 sau thay đổi nằm trong [`screenshots/`](screenshots/).

## Cổng kiểm tra trước khi phát hành

1. Backend Release build và toàn bộ test trên PostgreSQL thử đạt 0 skip; kiểm tra riêng allowlist loại tìm kiếm, điểm giữa nguyên độ chính xác, chia sẻ/thu hồi và IDOR.
2. Frontend `npm ci`, lint, build, audit và `check:vercel` đạt. Bản release build thất bại nếu thiếu `GoogleMaps__EmbedApiKey` khi đặt `FOODMATCH_REQUIRE_MAPS_EMBED_KEY=1`.
3. Edge viewport 390×844 với key thật ở `localhost:5173`: iframe `view/search/directions` và tìm quán trong Chat tải **nội dung Google**, không báo lỗi referrer; từ khóa/điểm giữa/tuyến đường dùng tọa độ chính xác, không tràn ngang. Kiểm tra cả khi GPS bị từ chối, một bên thu hồi, hồ sơ hoặc JWT hết hạn, offline/reconnect.
4. GitHub Actions `verify.yml` chạy xanh ở commit sẽ phát hành. Workflow `release.yml` chạy lại CI trước mỗi lần deploy, cần người dùng kích hoạt thủ công và GitHub Environment phê duyệt. Render và Vercel ở staging/production dùng dự án riêng, domain cố định, key được giới hạn cho đúng domain. Không cho Git push tự deploy ngoài workflow.
5. Trên staging HTTPS, thực hiện toàn bộ [`two-phone-acceptance.md`](two-phone-acceptance.md), xác minh Turnstile thật, CORS/CSP, WSS, backup/migration và rollback. Chỉ sau khi đạt mới đánh dấu sẵn sàng phát hành production.

Google hỗ trợ các chế độ [search, view, directions, place, streetview](https://developers.google.com/maps/documentation/embed/embedding-map). Kế hoạch này dùng ba chế độ đầu; `place` chỉ có ích khi lưu Place ID hoặc tọa độ quán đáng tin cậy, còn `streetview` là tùy chọn tương lai. Embed chỉ hiển thị tuyến đường trên bản đồ, không cung cấp điều hướng từng chặng hay dữ liệu địa điểm có cấu trúc.
