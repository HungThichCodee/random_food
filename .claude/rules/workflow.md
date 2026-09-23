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
- **MANDATORY**: ALWAYS request user review and explicit approval before running `git.exe push` or publishing code to remote repositories.

## Context Continuity (MANDATORY)
- Để tránh xung đột và mất ngữ cảnh khi mở rộng giới hạn phiên chat (session context limit):
- Bắt buộc phải cập nhật tệp `memory.md` sau khi hoàn thành bất kỳ tiến độ lớn nào.
- Ghi chú rõ ràng những gì vừa làm và trạng thái hiện tại vào bộ nhớ dự án để phiên chat tiếp theo có thể tiếp tục chính xác từ điểm dừng, không làm hỏng tiến độ cũ.

## Code Review Checklist
- [ ] No Domain entities exposed in API responses
- [ ] All async methods use async/await
- [ ] DTOs have proper validation attributes
- [ ] Error handling with proper HTTP status codes
- [ ] No hardcoded secrets in source code
