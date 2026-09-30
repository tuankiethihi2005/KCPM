# Authorization System Design

## 1. Mục tiêu
Tài liệu này mô tả thiết kế hệ thống đầy đủ cho module `Authorization`, bao gồm:
- backend authorization architecture
- RBAC và data scoping
- middleware chain
- API integration pattern
- frontend route/action guard
- admin role management
- test và migration strategy

Phạm vi gồm:
- kiểm tra quyền theo role
- giới hạn phạm vi dữ liệu theo user
- chặn route và action
- xử lý `403 Forbidden`
- quản trị role và trạng thái tài khoản

Tài liệu này bám theo [authorization-requirement.md](/D:/study/uth/Cnpm/Project_CNPM/docs/requirements/authorization-requirement.md).

## 2. Bối cảnh hiện tại
Repo hiện có role enum trong [backend/src/models/UserModel.js](/D:/study/uth/Cnpm/Project_CNPM/backend/src/models/UserModel.js):
- `Mangaka`
- `Assistant`
- `Tantou Editor`
- `Editorial Board`
- `Admin`

Ngoài ra đang tồn tại middleware tạm ở [backend/src/middlewares/task8AuthMiddleware.js](/D:/study/uth/Cnpm/Project_CNPM/backend/src/middlewares/task8AuthMiddleware.js) dùng header giả lập:
- `x-user-role`
- `x-user-id`

Thiết kế này không phù hợp production vì:
- không dựa trên user đã xác thực thật
- không kiểm tra ownership
- không dùng chung cho toàn hệ thống

## 3. Mục tiêu thiết kế
- Có một lớp phân quyền thống nhất cho toàn backend.
- Tách rõ authentication và authorization.
- Không để controller tự kiểm tra quyền rải rác.
- Hỗ trợ cả role-based access và data scoping.
- Cho phép mở rộng lên permission/capability trong tương lai.

## 4. Kiến trúc tổng thể
### 4.1 Backend module structure
Đề xuất cấu trúc:
- `backend/src/modules/authorization/middlewares`
- `backend/src/modules/authorization/policies`
- `backend/src/modules/authorization/services`
- `backend/src/modules/authorization/constants`
- `backend/src/modules/authorization/utils`

### 4.2 Thành phần chính
- `AuthorizationService`: đánh giá quyền truy cập.
- `PolicyResolver`: gom rule theo domain.
- `RoleMiddleware`: kiểm tra role.
- `ScopeMiddleware`: kiểm tra ownership/assignment.
- `CapabilityMapper`: lớp mở rộng cho frontend và permission-based design sau này.

## 5. Authorization model
### 5.1 Giai đoạn MVP
Dùng RBAC:
- `Admin`
- `Mangaka`
- `Assistant`
- `Tantou Editor`
- `Editorial Board`

### 5.2 Giai đoạn mở rộng
Thêm capability map:
- `series.create`
- `series.review`
- `chapter.publish`
- `ranking.view_all`
- `user.manage`

## 6. Quy tắc phân quyền cốt lõi
### 6.1 Admin override
- `Admin` có toàn quyền truy cập.
- Vẫn phải đi qua middleware chung để trace thống nhất.

### 6.2 Role gate
- Endpoint có thể yêu cầu một hoặc nhiều role.
- Nếu role không hợp lệ, trả `403 Forbidden`.

### 6.3 Scope gate
Không chỉ kiểm tra role. Phải kiểm tra dữ liệu có thuộc quyền user hay không.

Ví dụ:
- `Mangaka` chỉ truy cập series/chapter/page của mình.
- `Assistant` chỉ truy cập task được giao.
- `Tantou Editor` chỉ truy cập series được phụ trách.
- `Editorial Board` có quyền xem và quyết định ở workflow board/ranking.

## 7. Middleware design
### 7.1 `requireRole(...roles)`
Luồng:
1. đọc `req.user.role`
2. nếu là `Admin`, cho qua
3. nếu role thuộc whitelist, cho qua
4. ngược lại trả `403`

### 7.2 `requireOwnership(resolver)`
Luồng:
1. resolver lấy tài nguyên từ DB
2. so sánh owner/editor/assignee với `req.user.id`
3. nếu match, cho qua
4. nếu không, trả `403` hoặc `404` theo policy

### 7.3 `requireScope(policyName)`
Dành cho các module phức tạp hơn:
- tìm policy theo domain
- policy tự đánh giá permission dựa trên role + record

## 8. Policy design theo domain
### 8.1 Series policy
- `Mangaka` xem/sửa series của mình
- `Tantou Editor` xem series phụ trách
- `Editorial Board` xem series cần duyệt
- `Admin` xem toàn bộ

### 8.2 Chapter policy
- `Mangaka` tạo/sửa chapter của series mình
- `Tantou Editor` review chapter phụ trách
- `Editorial Board` xem tổng hợp hoặc phục vụ xuất bản

### 8.3 Page policy
- `Mangaka` upload/cập nhật page thuộc chapter mình
- `Assistant` chỉ thấy page theo task liên quan nếu business cho phép
- `Tantou Editor` review page

### 8.4 Publish policy
- chỉ role phù hợp mới publish
- ngoài role còn phải qua điều kiện nghiệp vụ của chapter

### 8.5 Task8 ranking policy
- thay middleware giả lập hiện tại bằng:
  - `requireAuth`
  - `requireRole`
  - rule scope theo role thực

## 9. API integration design
### 9.1 Nguyên tắc
- Không dùng `author_id` hay `role` do client gửi làm nguồn cấp quyền chính.
- Route có thể nhận `:id`, nhưng quyền phải được xác minh lại qua `req.user`.

### 9.2 Ví dụ cần refactor
Route [backend/src/routes/series.routes.js](/D:/study/uth/Cnpm/Project_CNPM/backend/src/routes/series.routes.js) hiện có:
- `GET /mine/:author_id`

Hướng refactor:
- giữ route cũ tạm thời nếu cần tương thích
- nội bộ lấy `req.user.id` là nguồn thật
- bỏ niềm tin vào `author_id` từ URL cho kiểm soát quyền

## 10. Error contract
Khuyến nghị response:
```json
{
  "error": {
    "code": "AUTHZ_FORBIDDEN",
    "message": "Bạn không có quyền thực hiện hành động này."
  }
}
```

Error codes đề xuất:
- `AUTHZ_FORBIDDEN`
- `AUTHZ_SCOPE_DENIED`
- `AUTHZ_ROLE_DENIED`
- `AUTHZ_ACCOUNT_INACTIVE`
- `AUTHZ_ACCOUNT_SUSPENDED`

## 11. Frontend design
### 11.1 UI principles
- User phải hiểu tại sao bị chặn.
- Không redirect im lặng cho lỗi quyền.
- UI có thể ẩn hoặc disable action, nhưng không thay backend decision.

### 11.2 Component inventory
- `RoleBadge`
- `StatusBadge`
- `PermissionGate`
- `ForbiddenState`
- `RestrictedActionButton`
- `UserRoleSelect`
- `UserStatusToggle`
- `AccessSummaryPanel`
- `ConfirmDialog`

### 11.3 Route-level guard
Khi user không có quyền vào route:
- không quay về login
- hiển thị `ForbiddenState`

### 11.4 Action-level guard
- `disabled + tooltip` nếu user nên biết action tồn tại
- ẩn hoàn toàn nếu action không liên quan role đó

## 12. Role and status display system
### 12.1 Role badge
Hiển thị đúng enum backend:
- `Mangaka`
- `Assistant`
- `Tantou Editor`
- `Editorial Board`
- `Admin`

### 12.2 Status badge
- `Active`
- `Inactive`
- `Suspended`

## 13. Admin management flow
### 13.1 User table
Các cột:
- tên
- email
- role
- status
- updatedAt
- action menu

### 13.2 Edit role dialog
1. admin bấm `Đổi role`
2. mở dialog
3. chọn role mới
4. xác nhận
5. gọi API cập nhật

### 13.3 Change status dialog
1. admin bấm đổi trạng thái
2. chọn `Active`, `Inactive`, hoặc `Suspended`
3. xác nhận vì đây là hành động ảnh hưởng truy cập

## 14. Accessibility
- Không chỉ dùng màu để phân biệt role và status
- Tooltip action disabled phải truy cập được bằng keyboard
- Forbidden state phải có heading rõ và CTA focus tốt

## 15. Logging và audit
Nên log:
- role denied
- scope denied
- admin role change
- admin status change

Giai đoạn sau nên có audit trail cho:
- ai đổi role
- role cũ và role mới
- ai khóa tài khoản
- thời điểm thay đổi

## 16. Test strategy
### 16.1 Unit test
- `requireRole`
- `requireOwnership`
- policy evaluators

### 16.2 Integration test
- user đúng role vào được endpoint
- user sai role bị `403`
- user đúng role nhưng sai scope bị chặn
- admin đổi role thành công
- admin đổi status thành công

### 16.3 Frontend test
- forbidden state render đúng
- action disabled theo role
- admin role dialog flow
- status change confirmation flow

## 17. Migration plan cho repo hiện tại
1. Tạo module authorization dùng chung.
2. Viết `requireRole` và `requireOwnership`.
3. Thay middleware tạm của `task8`.
4. Refactor route đang tin `author_id` hoặc role client-side.
5. Gắn guard chung cho `series`, `chapter`, `page`, `publish`, `task8`.
6. Bổ sung UI guard và role/status badge ở frontend.

## 18. Acceptance criteria
- Endpoint chỉ cho role hợp lệ truy cập.
- User có đúng role nhưng sai scope vẫn bị chặn.
- `Admin` quản lý được role và trạng thái tài khoản.
- Frontend có `ForbiddenState`, route guard và action guard nhất quán.
- Toàn hệ thống dùng chung lớp authorization thay vì kiểm tra rời rạc.

