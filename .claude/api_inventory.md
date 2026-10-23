# Food Match — API, danh tính và dữ liệu vị trí

Kiểm kê từ `src/FoodMatch.Api` và các service/DTO liên quan, ngày 20/10/2026. Bảng ghi đường đi hiện có để review bảo mật; hành vi trên HTTPS/điện thoại production vẫn phải kiểm tra trước deploy.

## Danh tính và quyền

- `POST /api/TempUsers` tạo hồ sơ tạm sau kiểm tra Turnstile theo môi trường. Chỉ response này có JWT trong trường `token`; JWT mang ID hồ sơ và hết hạn cùng hồ sơ sau 3 giờ. Các DTO khác không chứa token.
- REST riêng dùng `Authorization: Bearer <JWT>`. SignalR dùng cùng JWT qua `access_token` chỉ cho đường `/hubs/*`; phải kiểm tra log của proxy không ghi query này. Hai hub đóng kết nối khi JWT hết hạn.
- Quyền owner/member được kiểm tra ở controller hoặc service theo ID trong JWT, không lấy danh tính từ body. CORS và rate limit là lớp bổ sung, không thay thế quyền này.

## REST

| Endpoint | Quyền | Dữ liệu vào → ra | Kiểm tra chính |
| --- | --- | --- | --- |
| `GET /api/health` | Công khai | Không có body → trạng thái API/PostgreSQL | Không trả cấu hình kết nối. |
| `GET /api/Foods/random` | Công khai | Bộ lọc category/session → món | `sessionId` là dữ liệu client, không dùng làm ID chủ hồ sơ hoặc ghi lịch sử cho hồ sơ. Không có vị trí. |
| `GET /api/Foods/wheel` | Công khai | Category/count → danh sách món | Không có dữ liệu người dùng/vị trí. |
| `POST /api/Foods/suggest`, `POST /api/Foods/tags-count` | Công khai | Tiêu chí món → gợi ý/số lượng tag | Giới hạn input/rate; không có vị trí. |
| `POST /api/TempUsers` | Công khai | Tên, giới tính, sở thích, món muốn ăn, Turnstile → hồ sơ + JWT | Tạo hồ sơ mới; giới hạn input/CAPTCHA/rate. |
| `PUT /api/TempUsers/{id}/location` | JWT của `{id}` | GPS lat/lng → 204 | Chỉ chủ hồ sơ; kiểm tra số hữu hạn/phạm vi; lưu nguyên giá trị, không offset. GPS đầu tiên bật xuất hiện trong nearby; các lần cập nhật sau giữ lựa chọn ẩn/hiện đã đặt. |
| `GET /api/TempUsers/nearby` | JWT | Không nhận bán kính → ID/tên và nhãn “Trong 3 km” của hồ sơ khả dụng | Dùng vị trí đã lưu của caller và bán kính cố định 3 km; không trả lat/lng hay khoảng cách chi tiết của người khác. Query `radiusKm` cũ không còn tác dụng. |
| `PUT /api/TempUsers/{id}/visibility` | JWT của `{id}` | Boolean → 204 | Chỉ chủ hồ sơ; điều khiển xuất hiện trong nearby. |
| `POST /api/MatchRequests` | JWT | ID người được mời → lời mời | Người gửi/nhận còn hạn và có GPS đã lưu, người nhận đang hiện diện trong 3 km, không tự mời; backend kiểm tra lại khoảng cách thay vì tin danh sách trên client. |
| `PUT /api/MatchRequests/{id}/respond` | JWT của người được mời | `accept` bắt buộc (true/false) → match | Chỉ người nhận của lời mời pending, hai hồ sơ còn hạn; body `{}` trả 400, không tự từ chối. |
| `GET /api/MatchRequests/pending`, `GET /api/MatchRequests/active` | JWT | Không có body → lời mời nhận/match hiện hành | Lọc theo ID caller và chỉ trả cặp có hai hồ sơ còn hạn, kể cả trước lần dọn database tiếp theo. |
| `GET /api/MatchRequests/{id}` | JWT thành viên | ID match → trạng thái match | Trả 404 nếu một hồ sơ hết hạn; DTO có tọa độ đối phương khi accepted, chính đối phương còn chia sẻ và chưa quá 60 phút. |
| `POST /api/MatchRequests/{id}/share-location` | JWT thành viên | Không có body → match | Match accepted, GPS caller đã lưu, hai hồ sơ còn hạn; người kia thấy ngay tọa độ chính xác của caller dù chưa chia sẻ lại. |
| `POST /api/MatchRequests/{id}/stop-sharing-location` | JWT thành viên | Không có body → match | Thu hồi riêng tọa độ của caller, xóa đề xuất điểm hẹn; quyền chia sẻ còn hạn của người kia giữ nguyên. |
| `GET /api/MatchRequests/{id}/meeting-suggestions?kind=restaurant|cafe|vegetarian|dessert` | JWT thành viên | ID match và loại tìm kiếm cho phép → URL Google Maps iframe/search, OSM tùy chọn cho `restaurant` | Chỉ accepted + hai bên còn chia sẻ và có GPS; từ chối loại ngoài allowlist; kiểm tra lại quyền sau lệnh gọi provider. Nếu đặt `GoogleMaps__EmbedApiKey`, URL iframe dùng Maps Embed API search và chứa key công khai bị giới hạn theo referrer/API. |
| `POST /api/MatchRequests/{id}/meeting-place` | JWT thành viên | ID quán OSM → đề xuất | Hai bên còn chia sẻ; server chọn lại từ nguồn gợi ý hiện hành. |
| `POST /api/MatchRequests/{id}/meeting-place/google` | JWT thành viên | Tên + URL Google Maps → đề xuất | Hai bên còn chia sẻ; URL HTTPS thuộc domain/path Google Maps. Không xác minh quán thực tế gần điểm giữa. |
| `POST /api/MatchRequests/{id}/meeting-place/confirm` | JWT thành viên còn lại | ID đề xuất → điểm hẹn đã xác nhận | Người đề xuất không thể tự xác nhận; hai bên còn chia sẻ. |
| `GET /api/Chat/{matchRequestId}/messages`, `POST /api/Chat` | JWT thành viên match accepted | Tin nhắn → lịch sử/tin đã lưu | Hai hồ sơ còn hạn; không trả tin nhắn cho người thứ ba. |
| `POST /api/Reports` | JWT | ID người bị báo cáo/lý do → báo cáo | Chỉ báo cáo người trong match accepted với caller; hai hồ sơ còn hạn. |

## SignalR

| Đường/kênh | Quyền và dữ liệu |
| --- | --- |
| `/hubs/match` | JWT; không có method do client gọi. API gửi `MatchRequestReceived`, `MatchRequestResponded`, `LocationSharingUpdated`, `MeetingPlaceUpdated` tới `Clients.User(ID)`; payload location/meeting được tạo theo quyền của **người nhận**. |
| `/hubs/chat` | JWT; `JoinChatGroup(matchId)` chỉ cho thành viên match accepted còn hạn. Khi kết nối, hub tự tham gia các nhóm match hợp lệ. API gửi `ReceiveMessage` tới group của match. |

## Đường đi tọa độ và bên nhận ngoài

1. Trình duyệt lấy GPS của chính người dùng rồi gọi endpoint `/location`; PostgreSQL lưu đúng cặp số đã đo. Nearby chỉ dùng tọa độ để lọc trong 3 km cố định và trả nhãn “Trong 3 km”. Sự xuất hiện trong danh sách vẫn cho biết mức gần đúng, nên không tương đương ẩn hoàn toàn vị trí.
2. Trong match accepted, khi A bật chia sẻ, REST và thông báo SignalR cho B chứa đúng `buddyLat/buddyLng` của A ngay cả khi B chưa chia sẻ; chiều B → A tương tự. Mỗi quyền hết hạn sau tối đa 60 phút và có thể thu hồi riêng. Thu hồi/hết hạn một bên loại tọa độ của bên đó và điểm hẹn khỏi DTO; tọa độ của bên còn chia sẻ vẫn hiện cho người kia. Route riêng tải lại quyền qua API.
3. Khi mở gợi ý điểm hẹn, server tính điểm giữa từ hai vị trí hiện hành. Iframe Google Maps nhận query cùng tâm `ll` và zoom 15; link tìm kiếm nhận query theo **điểm giữa**. Nếu cấu hình Overpass riêng, server chuyển điểm giữa cho provider đó. Vị trí đã lưu của từng người không bị thay đổi. Trang bản đồ và route ưu tiên GPS mới của chính thiết bị khi dựng iframe, dùng tọa độ hồ sơ làm dự phòng nếu chưa có GPS mới; route riêng vẫn lấy tọa độ đối phương qua API có kiểm tra quyền.
4. Link quán do người dùng dán được lưu trong match và chỉ trả lại khi quyền chia sẻ của hai bên còn hiệu lực. Iframe Google Maps không cho ứng dụng đọc danh sách/quán được bấm bên trong; người nhận phải mở link để xem trước khi xác nhận.

## Việc còn phải xác minh trên môi trường triển khai

Hai điện thoại và domain HTTPS thật: JWT hết hạn/reconnect, SignalR payload đúng người nhận, thu hồi khi mất mạng, CSP iframe, log proxy của `access_token`, Turnstile production, rate limit sau proxy và phản hồi 429. Không dùng bảng này như bằng chứng đã đạt các kiểm thử đó.
