# Food Match — quy trình hiện hành

Đây là bộ quy trình thay cho các kế hoạch Claude cũ. Mục tiêu: hoàn thiện tính năng gợi ý điểm hẹn cho cặp đã match, khóa các lỗ hổng có thể kiểm chứng, rồi mới deploy. Đọc `implementation_plan.md`, `rules/security.md` và `skills/deploy.md` theo công việc tương ứng. Không coi các dấu “MVP hoàn thành” trong tài liệu cũ là bằng chứng.

## Hiện trạng xác nhận từ mã nguồn 2026-10-20

- ASP.NET Core 10 + EF Core/Npgsql/PostgreSQL; React 19 + Vite/TypeScript; JWT cho hồ sơ tạm; SignalR; Google Maps iframe.
- Vòng quay món, gợi ý món, tìm người gần, match và chat đã có. Chưa có đơn hàng, thanh toán, tài khoản mật khẩu, email hay cookie đăng nhập. Các quy tắc dành cho chúng trong `rules/security.md` là cổng bắt buộc khi thêm chức năng, không phải đã triển khai.
- Backend lưu tọa độ đầu vào chính xác. Nearby chỉ cho biết hồ sơ hiển thị ở trong 3 km, không trả tọa độ hay khoảng cách chi tiết; chủ dự án chấp nhận tín hiệu gần đúng này trước khi chia sẻ. Trong match accepted, mỗi người tự quyết định chia sẻ tọa độ của mình cho người kia tối đa 60 phút; người nhận không cần chia sẻ lại. Gợi ý điểm hẹn cần cả hai còn chia sẻ. Không offset hoặc jitter tọa độ.
- Chủ dự án đã duyệt đưa diff lớn lên nhánh `review/maps-embed-ci-20261023` để chạy CI; run đầu đạt cả frontend/backend. Không reset, ghi đè, merge hoặc phát hành khi chưa xem diff và có sự đồng ý của người dùng cho bước tương ứng.

## Luồng làm việc

1. Mỗi lượt bắt đầu bằng `git.exe status --short`, đọc các file liên quan và kết quả test hiện có. Không dùng trạng thái trong memory làm bằng chứng hiện tại.
2. Chọn mục chưa đạt trong `implementation_plan.md`, ghi rõ luồng dữ liệu/quyền, sửa nhỏ có thể review, viết test cho bất biến quan trọng.
3. Chạy backend build/test, frontend build và kiểm thử API/FE phù hợp. Test IDOR, đầu vào xấu, đồng ý/thu hồi vị trí và hành vi mạng theo phạm vi thay đổi.
4. Đối chiếu `rules/security.md` và ghi minh chứng hoặc lỗi còn lại. Cập nhật `implementation_plan.md` và ghi chú trạng thái; không đánh dấu hoàn thành theo cảm nhận.
5. Chỉ deploy khi mọi cổng release trong `skills/deploy.md` đạt. Push/publish sau khi người dùng duyệt bản thay đổi cụ thể.

Không ghi secret, JWT, cookie, tọa độ chính xác hoặc nội dung chat vào tài liệu/log. Không đổi bản đồ và giao diện vòng quay ngoài phạm vi thay đổi cần thiết.
