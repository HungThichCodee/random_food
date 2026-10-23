# Kiểm tra Food Match trên hai điện thoại thật

Thực hiện trên bản staging HTTPS với hai điện thoại A/B, mỗi máy dùng hồ sơ tạm riêng. GPS và Google Maps trong trình duyệt điện thoại cần quyền vị trí và kết nối mạng. Không chụp hoặc đưa tọa độ chính xác, JWT hay nội dung chat vào báo cáo lỗi công khai.

## Chuẩn bị

1. Ghi phiên bản trình duyệt của cả hai máy; frontend Tailwind 4 cần Safari 16.4+, Chrome 111+ hoặc Firefox 128+. Mở cùng URL staging trên hai máy. Xác nhận `/api/health` báo API/database hoạt động, trang chat và route có thể tải lại trực tiếp.
2. Tạo hồ sơ A và B. Bật GPS, cho phép quyền vị trí trong trình duyệt; xác nhận hai máy thấy nhau ở danh sách người gần. Nearby chỉ được hiển thị nhãn “Trong 3 km”, không hiện tọa độ hoặc khoảng cách chi tiết. Thử gọi API với `radiusKm=0.001` và `radiusKm=50`: danh sách không được đổi do query này.
3. A gửi lời mời, B chấp nhận. Mở chat trên cả hai máy. Trước khi chia sẻ, không máy nào có nút xem đường tới người kia hoặc gợi ý điểm hẹn.

## Chia sẻ và thu hồi riêng từng người

1. A bấm **Chia sẻ vị trí của tôi** và chấp nhận thông báo về tọa độ chính xác. B phải thấy trạng thái A đang chia sẻ và nút **Xem đường tới A** trong chu kỳ đồng bộ khoảng 10 giây. A chưa thấy đường tới B. Iframe gợi ý điểm hẹn chưa xuất hiện.
2. B mở đường tới A. So sánh vị trí đích trên bản đồ với vị trí GPS hiện tại của A trên chính máy A. Dữ liệu dẫn đường phải dùng tọa độ A đã lưu, không cộng độ lệch ngẫu nhiên. Nếu GPS thiết bị sai, ghi nhận đó là lỗi đo của thiết bị.
3. B bấm chia sẻ. A phải thấy đường tới B. Cả hai máy lúc này thấy gợi ý điểm hẹn; URL iframe Google Maps dùng điểm giữa của hai tọa độ đã lưu, mức zoom 15.
4. Di chuyển B đủ xa để GPS thay đổi, chờ lần làm mới khoảng 30 giây hoặc bấm làm mới. Tâm bản đồ điểm hẹn phải đổi theo tọa độ mới của B; vị trí A không bị sửa.
5. A dừng chia sẻ. B phải mất đường tới A và thẻ điểm hẹn; A vẫn xem được đường tới B khi B còn chia sẻ. A bật lại thì B xem được đường tới A ngay, không cần B bật lại.
6. B dừng chia sẻ. A phải mất đường tới B. Tải lại trang chat và route cũ để xác nhận vị trí đã thu hồi không hiện lại.

## Quán và kết nối

1. Trên staging đã cấu hình `GoogleMaps__EmbedApiKey` giới hạn theo HTTP referrer/API, mở trang Bản đồ: kiểm tra iframe `view` tại GPS hiện tại, nút Quán ăn/Cà phê/Món chay đổi sang `search` và hiển thị kết quả. Mở trang Đường đi: kiểm tra iframe `directions` dùng đúng điểm xuất phát/đích, Đi bộ/Lái xe đổi tuyến. Khi cả hai cùng chia sẻ, kiểm tra Chat dùng `/maps/embed/v1/search` với tâm đúng điểm giữa; thử cả Quán ăn, Cà phê, Món chay và Đồ ngọt. Mở nút Google Maps để xem danh sách đầy đủ, chọn một quán, sao chép liên kết chia sẻ; A dán tên và liên kết vào ứng dụng. B mở liên kết, kiểm tra quán rồi xác nhận. Hai máy phải thấy cùng điểm hẹn. Nếu iframe báo lỗi key/referrer hoặc chỉ hiện bản đồ mà không có kết quả phù hợp, ghi trượt cổng này.
2. Tắt mạng A, để B gửi tin nhắn và một hồ sơ C gửi lời mời mới cho A. Bật mạng A lại khi JWT còn hạn. Tin nhắn bị lỡ, lời mời và tin nhắn mới phải xuất hiện mà không cần tải lại trang.
3. Thử màn hình dọc/ngang và cuộn trên cả hai máy: vòng quay có bốn bộ lọc, kết quả và chat không tràn ngang; các nút chia sẻ/thu hồi/điểm hẹn có thể chạm được.
4. Để một phiên hồ sơ tạm hết hạn khi đang mở chat hoặc đường tới người đã match. Kiểm tra màn hình chuyển về tạo hồ sơ và không còn hiện tọa độ, iframe đường đi hay popup lời mời cũ; thử cả khi chuyển tab sang nền rồi mở lại.
5. Tạo A trước B đủ lâu để A hết hạn khi B vẫn còn phiên. Trên máy B, chat phải tự chuyển về danh sách bạn gần trong chu kỳ kiểm tra khoảng 10 giây; mở lại URL chat cũ không được hiện tin nhắn, tên cặp hay tọa độ. Danh sách match hoạt động không còn cặp với A; lời mời pending từ A không còn hiển thị.

## Ghi kết quả

Ghi model máy, hệ điều hành, tên và phiên bản trình duyệt, URL staging, thời gian và bước đạt/trượt; chụp ảnh chỉ sau khi che dữ liệu cá nhân. Kiểm tra riêng trên trình duyệt/Network rằng request không báo lỗi CORS/CSP, iframe và Turnstile tải được, WebSocket dùng WSS. Quyền chia sẻ tự hết sau tối đa 60 phút; kiểm tra bằng chờ thực tế trên staging nếu cần bằng chứng về hẹn giờ, vì script local chỉ mô phỏng mốc hết hạn trong database thử.

Iframe Google Maps không cho ứng dụng đọc danh sách hoặc quán được bấm bên trong. Luồng đề xuất hiện tại dùng liên kết người dùng sao chép từ Google Maps.
