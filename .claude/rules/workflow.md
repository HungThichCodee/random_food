# Workflow Rules

## Initialization (MANDATORY)
- **CRITICAL**: Bất cứ khi nào nhận được prompt (yêu cầu) từ người dùng, BƯỚC ĐẦU TIÊN BẮT BUỘC là phải dùng công cụ để đọc lại nội dung các file `doc.md`, `.claude/memory.md` và `.claude/implementation_plan.md`. 
- Tinh chỉnh hoặc cập nhật ngữ cảnh (context) từ các file này TRƯỚC KHI thực hiện viết code, sửa file hay chạy lệnh.

## Terminal Commands (CRITICAL)
- ALWAYS append `.exe` to CLI tools when executing terminal commands (e.g., `node.exe`, `npm.exe`, `git.exe`, `dotnet.exe`, `docker.exe`, `docker-compose.exe`).
- This is required to bypass sandbox restrictions and match the `settings.json` allowlist.

## Development Flow
- Code features one function at a time
- Each function must be reviewed before proceeding to next
- Follow the 67-item execution order in implementation_plan.md
- Run `dotnet.exe build` after every backend change
- Run `npm.exe run dev` for frontend hot reload

## Self-Check After Every Step (MANDATORY)
After completing EACH step in the implementation plan:
0. **Rule Check**: Đảm bảo mọi method vừa viết đã có BỌC `try-catch` và các DTO/tham số đầu vào đã có VALIDATION (Data Annotations / Guard Clauses). Nếu thiếu, PHẢI SỬA NGAY.
1. **Backend**: Run `dotnet.exe build backend/FoodMatch/FoodMatch.sln` — MUST pass with 0 errors
2. **Frontend**: Run `npx.cmd tsc --noEmit` in `frontend/` — MUST pass with 0 type errors
3. **If tests exist**: Run `dotnet.exe test` — MUST pass
4. **If build fails**: FIX the error immediately before marking the step as done
5. **Update memory.md**: Record completed step and any issues found
6. **NEVER skip** this verification — a step is NOT done until build passes

## Git Workflow
- Commit after each completed feature/function
- Use conventional commits: feat:, fix:, refactor:, docs:, test:
- Branch naming: feature/{batch}-{item-number}-{short-description}
- **PRE-PUSH MANDATORY CHECKLIST**: Trước khi yêu cầu user cho phép `git.exe push`, Agent **BẮT BUỘC** phải tự chạy và xác nhận 4 điều kiện sau:
  1. **Build Check**: Chạy `dotnet.exe build` (0 lỗi) và `npx.cmd tsc --noEmit` (0 lỗi).
  2. **Test Check**: Chạy test của chức năng vừa làm (nếu có).
  3. **UI/UX Check**: Rà soát thiết kế của phase hiện tại (đảm bảo chuẩn Mobile-First, đúng màu/font Stitch, có micro-interactions).
  4. **Standard Web App Review**: Xác nhận code vừa viết đã tuân thủ: 
     - *Validation*: Re-validate mọi input từ Frontend (Guard Clauses / Data Annotations).
     - *Error Handling*: Bọc `try-catch` đầy đủ và trả về HTTP status chuẩn.
     - *Rate Limiting*: Áp dụng giới hạn request cho API (chống spam).
- **MANDATORY**: ALWAYS request user review and explicit approval before running `git.exe push` or publishing code to remote repositories.

## Context Continuity (MANDATORY)
- Để tránh xung đột và mất ngữ cảnh khi mở rộng giới hạn phiên chat (session context limit):
- Bắt buộc phải cập nhật tệp `memory.md` sau khi hoàn thành bất kỳ tiến độ lớn nào.
- Ghi chú rõ ràng những gì vừa làm và trạng thái hiện tại vào bộ nhớ dự án để phiên chat tiếp theo có thể tiếp tục chính xác từ điểm dừng, không làm hỏng tiến độ cũ.
- **KHI GẦN TỚI GIỚI HẠN NGỮ CẢNH (Context Limit):**
  - AI Agent **TỰ ĐỘNG** cập nhật lại `memory.md` và `implementation_plan.md` với:
    1. Bước nào đang làm dở (số Phase, số Step cụ thể).
    2. File nào đang sửa, sửa đến đâu.
    3. Lệnh nào đã chạy, kết quả ra sao.
    4. Vấn đề gì đang gặp (nếu có).
  - Mục tiêu: Khi ngữ cảnh mới bắt đầu, AI Agent chỉ cần đọc `memory.md` + `implementation_plan.md` là biết chính xác phải làm gì tiếp, **KHÔNG trùng lặp** công việc đã hoàn thành, **KHÔNG quên** công việc đang dở.

## Coding Standards (MANDATORY)

### Error Handling — Try-Catch
- Mọi hàm Service/Controller **BẮT BUỘC** phải bọc logic chính trong khối `try-catch`.
- Phần `catch` phải ghi **rõ ràng, cụ thể** lỗi gì xảy ra, ở đâu (tên hàm, tên entity, ID liên quan).
- Ném exception tùy chỉnh có message mô tả rõ nguyên nhân (ví dụ: `throw new NotFoundException($"Food with Id={id} not found")`).
- KHÔNG được dùng `catch (Exception)` rỗng hoặc nuốt lỗi (swallow exception).
- Ví dụ chuẩn:
```csharp
public async Task<FoodResponseDto> GetByIdAsync(int id)
{
    try
    {
        var food = await _repository.GetByIdAsync(id)
            ?? throw new NotFoundException($"Food with Id={id} not found");
        return MapToDto(food);
    }
    catch (NotFoundException) { throw; }  // Để middleware xử lý
    catch (Exception ex)
    {
        throw new ApplicationException($"Error retrieving food Id={id}: {ex.Message}", ex);
    }
}
```

### Backend Validation — Never Trust Frontend (CRITICAL)
- Backend **KHÔNG BAO GIỜ** được tin tưởng hoàn toàn dữ liệu từ Frontend.
- Mọi dữ liệu nhận từ request (DTO) phải được **kiểm tra lại (re-validate)** ở tầng Service hoặc Controller trước khi xử lý:
  - Kiểm tra null/empty cho các trường bắt buộc.
  - Kiểm tra giá trị hợp lệ (ví dụ: enum có nằm trong phạm vi không, ID có tồn tại trong DB không).
  - Kiểm tra giới hạn (ví dụ: độ dài chuỗi, phạm vi số, tọa độ GPS hợp lệ).
- Sử dụng **Data Annotations** (`[Required]`, `[StringLength]`, `[Range]`) trên DTO để validate tự động ở tầng API.
- Sử dụng **guard clauses** ở đầu hàm Service để validate logic nghiệp vụ.
- Ví dụ chuẩn:
```csharp
public async Task<TempUserResponseDto> CreateAsync(CreateTempUserDto dto)
{
    // Guard clauses — never trust FE
    if (string.IsNullOrWhiteSpace(dto.DisplayName))
        throw new BadRequestException("DisplayName is required");
    if (dto.DisplayName.Length > 100)
        throw new BadRequestException("DisplayName must not exceed 100 characters");

    // ... logic tiếp theo
}
```

## Code Review Checklist
- [ ] No Domain entities exposed in API responses
- [ ] All async methods use async/await
- [ ] DTOs have proper validation attributes
- [ ] Error handling with proper HTTP status codes
- [ ] No hardcoded secrets in source code
- [ ] All service methods wrapped in try-catch with descriptive error messages
- [ ] Backend re-validates all input from frontend (never trust FE data)

## UI/UX & Frontend Standards (CRITICAL)
- **Mobile-First Design**: Giao diện (UI) và trải nghiệm người dùng (UX) phải được thiết kế và lập trình theo hướng **Mobile-First** (ưu tiên hiển thị trên điện thoại trước).
- **Tuân thủ Thiết kế Stitch**: Tuân thủ nghiêm ngặt các mã màu, font chữ, độ bo góc, bóng mờ (elevation), và hệ thống thiết kế (Design System) đã được thống nhất và sinh ra từ máy chủ **Stitch MCP**.
- **BẮT BUỘC Tra cứu Stitch TRƯỚC KHI code UI**: Trước khi viết bất kỳ component, page, hoặc CSS nào, Agent PHẢI thực hiện các bước sau theo thứ tự:
  1. Gọi `list_projects` (Stitch MCP) → tìm đúng project của dự án (Food Match).
  2. Gọi `list_screens` → xem danh sách các màn hình đã thiết kế.
  3. Gọi `get_screen` → lấy chi tiết (mã màu, layout, component) của màn hình tương ứng.
  4. Gọi `list_design_systems` → lấy design tokens (màu, font, spacing).
  5. Chỉ SAU KHI đã đọc và nắm rõ thiết kế từ Stitch, mới được bắt đầu viết code.
  6. Nếu Stitch chưa có thiết kế cho màn hình đó, dùng `generate_screen_from_text` để tạo mẫu mới trước.
  7. **KHÔNG ĐƯỢC tự ý đặt màu sắc/font/spacing** khi chưa tra cứu Stitch — đây là vi phạm nghiêm trọng.
- **Cascade Design Update (Kiểm tra dây chuyền)**: Nếu bạn sửa đổi/ghi đè các file nền tảng như `global.css` (đổi tên biến CSS, xóa class cũ), bạn **BẮT BUỘC** phải dùng công cụ tìm kiếm (như `grep_search`) để tìm lại tất cả các file trong project đang sử dụng các biến/class cũ đó và cập nhật chúng đồng loạt. KHÔNG ĐƯỢC để lại các file UI dùng CSS cũ bị hỏng (broken UI). Bắt buộc phải check lại toàn bộ Pages và Components.
- **Sử dụng Thư viện Component**: Tận dụng tối đa các thư viện Frontend có sẵn được thiết kế tối ưu cho mobile, đặc biệt là **Ant Design Mobile (antd-mobile)** để xây dựng giao diện nhanh, mượt mà và chuẩn UX mobile.

## AI Code Review — Open Code Review (MANDATORY)
- Sau khi hoàn thành **MỖI Phase** trong `implementation_plan.md`, BẮT BUỘC chạy kiểm toán mã nguồn bằng công cụ Open Code Review.
- Công cụ Open Code Review đã được cài đặt (`@alibaba-group/open-code-review`).
- **Sử dụng Chế độ Ủy quyền (Delegation Mode) cho AI Agent:**
  - KHÔNG DÙNG lệnh `ocr review` (vì yêu cầu API Key bên thứ 3).
  - THAY VÀO ĐÓ, AI Agent (tức là tôi) sẽ tự review bằng cách chạy:
    ```bash
    ocr delegate preview
    ```
  - Lệnh này sẽ thu thập các file thay đổi. AI Agent sẽ tự đọc nội dung các file đó và đối chiếu với mục tiêu dự án (bảo mật, Clean Architecture, mobile-first UX...).
- Nếu phát hiện lỗi nghiêm trọng (Critical/High) từ việc tự review, **AI Agent PHẢI tự sửa** trước khi chuyển sang Phase tiếp theo.
- Nếu chỉ có cảnh báo nhẹ (Low/Info), AI Agent ghi chú vào `memory.md` và tiếp tục.

## Rate Limiting — Chống Spam (CRITICAL)
- Mọi API endpoint công khai (public) **BẮT BUỘC** phải có cơ chế Rate Limiting để chống spam và DDoS.
- Sử dụng tính năng **Rate Limiting có sẵn từ .NET 10** (namespace `Microsoft.AspNetCore.RateLimiting`):
  - `Fixed Window`: Giới hạn số request trong một khoảng thời gian cố định.
  - `Sliding Window`: Giới hạn mượt mà hơn, tránh hiệu ứng "burst" ở đầu mỗi window.
- Cấu hình khuyến nghị cho dự án Food Match:
  - **API chung (GET foods, restaurants):** 60 requests/phút/IP.
  - **API tạo profile (POST temp-user):** 10 requests/phút/IP.
  - **API gửi lời mời match:** 5 requests/phút/user.
  - **API gửi tin nhắn chat:** 30 requests/phút/user.
  - **API báo cáo (report):** 3 requests/phút/user.
- Khi vượt quá giới hạn, trả về HTTP `429 Too Many Requests` kèm header `Retry-After`.
- Ví dụ chuẩn (.NET 10 built-in):
  ```csharp
  // Program.cs
  builder.Services.AddRateLimiter(options =>
  {
      options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
      options.AddFixedWindowLimiter("GeneralApi", opt =>
      {
          opt.PermitLimit = 60;
          opt.Window = TimeSpan.FromMinutes(1);
      });
      options.AddFixedWindowLimiter("CreateProfile", opt =>
      {
          opt.PermitLimit = 10;
          opt.Window = TimeSpan.FromMinutes(1);
      });
  });
  ```
