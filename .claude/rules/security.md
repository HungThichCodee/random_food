# Food Match — cổng bảo mật bắt buộc

Áp dụng cho mã, cấu hình và kiểm thử trước khi phát hành. Chỉ đánh dấu **đạt** khi có bằng chứng từ mã nguồn, test và chạy thực tế; build xanh không chứng minh các cổng này. Các mục đơn hàng, mật khẩu, email và cookie là điều kiện cho tính năng tương lai: ứng dụng hiện dùng hồ sơ tạm + JWT, chưa có các chức năng đó.

## 1. Backend là nguồn sự thật

- Không tin request, JWT tự giải mã ở client, hay dữ liệu từ FE. ID người thực hiện lấy từ principal đã xác thực; mọi thao tác/đọc riêng tư kiểm tra chủ sở hữu hoặc thành viên match ở server. Kiểm tra thời hạn hồ sơ tạm ở mỗi thao tác cần quyền.
- Nếu thêm đơn hàng: chỉ nhận mã hàng và số lượng; tính đơn giá, giảm giá, thuế, phí và tổng tiền từ bảng giá ở server trong transaction; không dùng tổng tiền FE gửi lên. Số lượng là **số nguyên >= 1** được kiểm tra ở server, có giới hạn trên và test số âm, 0, phân số, chuỗi, tràn số. GET đơn hàng theo ID kiểm tra quyền sở hữu trước khi trả.
- Request DTO giới hạn kiểu, kích thước, chuỗi, enum, phạm vi tọa độ và số lượng; service kiểm tra lại bất biến nghiệp vụ. Từ chối NaN/Infinity ở vị trí. Giới hạn body size và số phần tử danh sách.
- Dùng LINQ/EF Core hoặc truy vấn SQL có tham số. Không ghép ID, câu tìm kiếm hay thứ tự sắp xếp do người dùng gửi vào SQL. Nếu raw SQL cần tên cột động, dùng allowlist cố định.

## 2. Đầu ra và FE

- Response DTO theo từng use case: chỉ trả các trường màn hình cần. Tách response tạo hồ sơ khỏi response thông thường; không trả `SessionToken`, JWT, tọa độ chính xác, entity EF hoặc thông tin nội bộ trong API khác. Test JSON response của người A/B/C.
- React text binding hoặc `textContent` cho chat, tên hồ sơ, bình luận và dữ liệu do người dùng tạo. Không đưa chúng vào `innerHTML`/`dangerouslySetInnerHTML` nếu chưa có sanitizer được review. Kiểm tra URL, iframe và link từ dữ liệu bên ngoài trước khi dùng.
- Secret không ở repo, bundle FE, `VITE_*`, HTML, error response hoặc log. Public site key CAPTCHA được phép ở FE; secret xác thực chỉ ở BE. Nếu lộ khóa: vô hiệu hóa/rotate ở nhà cung cấp, đổi mọi nơi dùng, rà log và lịch sử Git; xóa khỏi file chưa đủ.

## 3. Xác thực, phiên và trình duyệt

- Nếu có mật khẩu: dùng ASP.NET Core Identity PasswordHasher hoặc Argon2id/bcrypt/PBKDF2 qua thư viện uy tín với thông số hiện hành; salt riêng, không lưu plaintext hay SHA-256 đơn lẻ. Chức năng đổi mật khẩu/đăng nhập sai phải có giới hạn và nhật ký.
- Nếu dùng cookie đăng nhập: `Secure`, `HttpOnly`, `SameSite` theo topology FE/API thực tế; dùng HTTPS; endpoint đổi trạng thái có token chống CSRF và kiểm tra phía server. Đặc biệt đổi email/đổi mật khẩu không được chỉ dựa vào POST và cookie.
- Hiện JWT của hồ sơ tạm nằm trong sessionStorage để giữ phiên qua lần tải lại trang; JavaScript vẫn đọc được token. Review chiến lược phiên, CSP và XSS trước deploy. Nếu chuyển sang cookie, thiết kế CSRF + CORS/credentials + SignalR đồng bộ. SignalR dùng `access_token` trong truy vấn của WebSocket; cấu hình hạ tầng không ghi query string/token vào access log. Không đánh dấu đạt chỉ vì có HTTPS.

## 4. Vị trí chính xác và quyền riêng tư

- Lưu đúng tọa độ GPS của người dùng, không offset/jitter/làm tròn tọa độ dẫn đường. Chỉ owner được cập nhật tọa độ. Validate biên, số hữu hạn và độ chính xác đầu vào; lỗi GPS thiết bị phải được báo là lỗi đo, không tự làm lệch tọa độ.
- Nearby chỉ trả ID/nhãn cần dùng và tín hiệu “Trong 3 km” với bán kính máy chủ cố định, không trả tọa độ, khoảng cách chi tiết hay session token. Chủ dự án chấp nhận tín hiệu gần đúng này trước khi chia sẻ. Cập nhật GPS tiếp theo không được tự bật lại hồ sơ đã chọn ẩn khỏi nearby. Tọa độ chính xác của mỗi người chỉ trả cho thành viên còn lại của match accepted khi chính người đó còn chia sẻ, chưa quá 60 phút và hồ sơ còn hạn; người nhận không cần chia sẻ lại. Gợi ý điểm hẹn cần cả hai còn chia sẻ. REST và SignalR dùng cùng một predicate quyền; không tin cờ UI. Thu hồi phải vô hiệu hóa response mới và xóa dữ liệu đã thu hồi khỏi state/route đang hiển thị.
- Điểm giữa dùng để gợi ý nơi gặp là tọa độ tìm kiếm riêng, không cập nhật vị trí A/B. Không log tọa độ, không đưa vào analytics; khi gửi sang Google Maps/nguồn ngoài, giao diện phải làm rõ tác động đó.

## 5. Mạng, chống lạm dụng và giao dịch

- HTTPS cho trang, API và WSS cho SignalR. CORS allowlist origin cụ thể; không dùng `*` với credential; kiểm thử preflight của Vercel production và các preview được duyệt. CORS không thay thế auth.
- Rate limit theo IP thật sau proxy **đã tin cậy** và theo account/session khi có; anonymous create profile, login nếu thêm, match, chat, report, cập nhật vị trí và SignalR có hạn mức riêng. Trả 429 + `Retry-After`; kiểm thử vượt ngưỡng. Rate limit ứng dụng không thay thế WAF/DDoS protection ở edge.
- CAPTCHA/reCAPTCHA hoặc Turnstile ở endpoint tạo hồ sơ/đăng nhập/hành động dễ bị bot; FE nhận token, BE xác minh qua API của nhà cung cấp trước khi tạo tài nguyên; token một lần và hết hạn. Chỉ widget FE hoặc kiểm tra token rỗng là chưa đạt.
- Tác vụ nhiều ghi DB (ví dụ tạo quyết định chung về điểm hẹn, thay trạng thái match kèm bản ghi sự kiện, xóa hồ sơ cùng dữ liệu liên quan, đơn hàng) dùng transaction/điều kiện cạnh tranh phù hợp; test rollback và truy cập đồng thời. Không mở transaction cho một thao tác đọc đơn giản.

## 6. Nhật ký, dependency và release gate

- Log actor ID (nếu có), thời điểm UTC, loại sự kiện, kết quả và lý do từ chối truy cập bằng mã ổn định; giới hạn truy cập log và thời gian lưu. Không log mật khẩu, JWT, cookie, CAPTCHA token, connection string, tọa độ chính xác hoặc nội dung chat. Làm sạch CR/LF từ dữ liệu có thể vào log.
- Kiểm tra package .NET/npm bằng công cụ audit hiện hành; nâng cấp gói có lỗ hổng có bản vá và chạy regression tests. Ghi nhận rủi ro còn lại rõ ràng; không tuyên bố an toàn vì chỉ chạy audit.
- Chặn release nếu có lỗi Critical/High chưa xử lý, test quyền/vị trí không đạt, migration chưa kiểm tra, secret lộ chưa rotate, HTTPS/CORS/health không đạt hoặc chưa kiểm chứng flow hai người dùng.

Tham chiếu: [OWASP Input Validation](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html), [OWASP Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html), [OWASP Logging](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html), [Turnstile server validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/).
