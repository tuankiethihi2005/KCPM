# Authorization Module Requirement

## 1. Mục đích
Module `Authorization` chịu trách nhiệm quyết định user đã xác thực có được phép truy cập tài nguyên hoặc thực hiện hành động cụ thể hay không.

Mục tiêu là tách riêng logic kiểm tra quyền khỏi logic xác thực, để backend có một cơ chế phân quyền nhất quán cho toàn bộ hệ thống.

## 2. Phạm vi
### 2.1 In scope
- Phân quyền theo `role`.
- Middleware bảo vệ endpoint theo role cho backend.
- Kiểm tra phạm vi truy cập dữ liệu theo user hiện tại.
- Hỗ trợ frontend lấy quyền hiện tại để ẩn/hiện route và chức năng.
- Hỗ trợ mở rộng từ role-based sang permission-based trong tương lai.

### 2.2 Out of scope
- Đăng nhập, đăng xuất, token, refresh token.
- ABAC đầy đủ theo policy engine.
- Phân quyền đa tenant.

## 3. Vai trò hệ thống
Hệ thống hiện có các role:
- `Mangaka`
- `Assistant`
- `Tantou Editor`
- `Editorial Board`
- `Admin`

Quy tắc nền:
- Mỗi user có một role chính.
- `Admin` có toàn quyền truy cập.
- Các role còn lại chỉ được thao tác trong phạm vi nghiệp vụ được giao.

## 4. Use cases chính
### UC-01: Bảo vệ endpoint theo role
Một endpoint chỉ cho phép một hoặc nhiều role cụ thể truy cập.

### UC-02: Giới hạn phạm vi dữ liệu
User chỉ được xem hoặc sửa dữ liệu thuộc phạm vi của mình, ví dụ series mình sở hữu hoặc task được giao.

### UC-03: Điều khiển chức năng trên frontend
Frontend lấy thông tin role/quyền để điều hướng route và hiển thị hành động phù hợp.

### UC-04: Quản trị role
Admin có thể gán hoặc thay đổi role của user.

## 5. Yêu cầu chức năng
### 5.1 Middleware phân quyền theo role
- Hỗ trợ khai báo một role hoặc nhiều role được phép.
- Nếu user không thuộc danh sách cho phép, trả `403 Forbidden`.
- Middleware phải dùng `req.user` đã được gắn bởi authentication middleware.

### 5.2 Kiểm tra phạm vi truy cập dữ liệu
- Không chỉ kiểm tra role, mà còn phải kiểm tra ownership hoặc assignment khi cần.
- Ví dụ:
  - `Mangaka` chỉ xem series/chapter/page của mình.
  - `Assistant` chỉ xem task và file được giao.
  - `Tantou Editor` chỉ xem series được phụ trách.
  - `Editorial Board` xem và quyết định ở các màn hình duyệt/ranking.
  - `Admin` truy cập toàn bộ.

### 5.3 Cung cấp rule dùng lại được
- Rule phải tái sử dụng được giữa các module.
- Không để mỗi controller tự viết kiểm tra quyền theo cách riêng.

### 5.4 Hỗ trợ frontend
- Trả về role hiện tại trong profile user.
- Có thể mở rộng thêm danh sách capability hoặc permission để frontend render chính xác hơn.

## 6. Yêu cầu phi chức năng
- Kiểm tra quyền phải diễn ra ở backend, không chỉ ở frontend.
- Rule phân quyền phải dễ đọc, dễ test và dễ mở rộng.
- Tránh hardcode rải rác trong controller.
- Có test cho các case `401`, `403`, và data scoping.

## 7. Mô hình phân quyền đề xuất
### 7.1 Giai đoạn MVP
Dùng `RBAC` theo role là đủ:
- `Admin`
- `Mangaka`
- `Assistant`
- `Tantou Editor`
- `Editorial Board`

### 7.2 Giai đoạn mở rộng
Có thể thêm `permission` hoặc `capability`, ví dụ:
- `series.create`
- `series.review`
- `chapter.publish`
- `ranking.view_all`
- `user.manage`

## 8. Ma trận phân quyền mức cao
- `Mangaka`: tạo series, tạo chapter, upload page, giao task, review task assistant, xem ranking của series mình.
- `Assistant`: xem task được giao, tải tài nguyên, nộp kết quả, xem thu nhập cá nhân.
- `Tantou Editor`: xem series phụ trách, annotation, review nội dung, theo dõi tiến độ.
- `Editorial Board`: duyệt series, tạo kỳ phát hành, nhập bình chọn, xem ranking toàn cục, ra quyết định tiếp tục hoặc hủy.
- `Admin`: quản lý user, role, cấu hình hệ thống và truy cập toàn bộ.

## 9. API và middleware đề xuất
### 9.1 Middleware backend
- `requireAuth`
- `requireRole(...roles)`
- `requireOwnership(resolver)`
- `requireCapability(...capabilities)` cho giai đoạn sau nếu cần

### 9.2 Endpoint quản trị liên quan đến phân quyền
- `PATCH /api/admin/users/:id/role`
- `PATCH /api/admin/users/:id/status`

## 10. Rule nghiệp vụ bắt buộc
- Không cho client truyền `role` trong request body để quyết định quyền.
- Không tin dữ liệu role từ frontend ngoài token/profile server-side.
- Không cho user tự nâng role của mình.
- Không cho user xem dữ liệu không thuộc phạm vi nếu chỉ có role chung.
- `Admin` có quyền override, nhưng vẫn nên đi qua middleware thống nhất.

## 11. Tích hợp với module khác
Module `Authorization` phải được áp dụng cho:
- `series`
- `chapter`
- `page`
- `publish`
- `task8`
- admin screens

Ví dụ tích hợp:
- `GET /api/series/mine/:author_id` hiện nên chuyển dần sang lấy author từ `req.user` thay vì tin `author_id` từ URL như một nguồn quyền.
- `task8` hiện có middleware tạm ở [backend/src/middlewares/task8AuthMiddleware.js](D:/study/uth/Cnpm/Project_CNPM/backend/src/middlewares/task8AuthMiddleware.js), nhưng cần thay bằng middleware phân quyền chuẩn của module này.

## 12. Acceptance criteria
- Endpoint chỉ cho role hợp lệ truy cập.
- User có role đúng nhưng sai phạm vi dữ liệu vẫn bị chặn.
- `Admin` truy cập được các endpoint quản trị.
- Frontend lấy được role hiện tại để ẩn/hiện màn hình phù hợp.
- Các module nghiệp vụ dùng chung middleware phân quyền thay vì tự kiểm tra rải rác.

## 13. MVP priority
### P1
- Role-based middleware
- Data scoping cơ bản
- Admin đổi role và status

### P2
- Tách rule phân quyền dùng chung theo module
- Capability map cho frontend

### P3
- Permission-based access control
- Audit trail cho quyết định phân quyền

## 14. Ghi chú triển khai theo repo hiện tại
Repo đã có role trong [backend/src/models/UserModel.js](D:/study/uth/Cnpm/Project_CNPM/backend/src/models/UserModel.js), nhưng phân quyền hiện còn rời rạc.

Trong một số chỗ, role hoặc user scope vẫn đang đi qua tham số URL hoặc header giả lập. Điều đó phù hợp cho test tạm thời, nhưng không đủ chắc chắn cho hệ thống thật. Module này cần gom toàn bộ logic đó về một lớp phân quyền thống nhất.

