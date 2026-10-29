# Kiểm thử đầu vào chức năng Tài khoản, Phân quyền & Thông báo chung

> **Tiêu chí đề xuất để thiết kế kiểm thử**, bám sát tài liệu đặc tả chức năng và cấu trúc các route backend thực tế (`auth.routes.js`, `notificationRoutes.js`). Có thể dùng bảng này làm tiêu chuẩn nghiệm thu và viết kịch bản kiểm thử API.

---

## 1. Bảng phân vùng tương đương (EP) & Phân tích giá trị biên (BVA)

### 1.1. Chức năng Đăng nhập (`POST /api/auth/login`)

| Điều kiện | Phân vùng hợp lệ | Tag | Phân vùng không hợp lệ | Tag | Giá trị biên / Dữ liệu kiểm thử | Tag |
| :--- | :--- | :---: | :--- | :---: | :--- | :---: |
| **Email** (`email`) | Đúng định dạng email tiêu chuẩn; tài khoản đã tồn tại trong hệ thống | V1<br>V2 | Bỏ trống / chỉ có khoảng trắng<br>Sai định dạng regex<br>Email chưa từng đăng ký | X1<br>X2<br>X3 | `admin@example.com`<br>Chuỗi rỗng `""`<br>`"   "`<br>`admin-invalid`<br>`notfound@example.com` | B1<br>B2<br>B3<br>B4<br>B5 |
| **Mật khẩu** (`password`) | Nhập đúng mật khẩu đã mã hóa của tài khoản | V3 | Bỏ trống<br>Nhập sai mật khẩu | X4<br>X5 | Nhập đúng mật khẩu<br>Chuỗi rỗng `""`<br>`wrongpassword` | B6<br>B7<br>B8 |

---

### 1.2. Chức năng Tạo người dùng của Admin (`POST /api/users`)

| Điều kiện | Phân vùng hợp lệ | Tag | Phân vùng không hợp lệ | Tag | Giá trị biên / Dữ liệu kiểm thử | Tag |
| :--- | :--- | :---: | :--- | :---: | :--- | :---: |
| **Quyền truy cập** (Role Header) | Token chứa quyền Quản trị viên (`ADMIN`) | V4 | Không gửi Token (chưa xác thực)<br>Token chứa vai trò khác (`MEMBER`, `EDITOR`) | X6<br>X7 | Gửi `Bearer <Admin_Token>`<br>Không gửi Header<br>Gửi `Bearer <Member_Token>` | B9<br>B10<br>B11 |
| **Email người dùng mới** (`email`) | Đúng cú pháp RFC; chưa tồn tại trong cơ sở dữ liệu | V5<br>V6 | Bỏ trống<br>Sai định dạng email<br>Email đã trùng lặp trong hệ thống | X8<br>X9<br>X10 | `newuser@test.com`<br>Chuỗi rỗng `""`<br>`"invalid-mail"`<br>`admin@example.com` (đã có) | B12<br>B13<br>B14<br>B15 |
| **Mật khẩu khởi tạo** (`password`) | Độ dài từ 6–50 ký tự | V7 | Bỏ trống<br>Dưới 6 ký tự<br>Trên 50 ký tự | X11<br>X12<br>X13 | 5 ký tự (`12345`)<br>6 ký tự (`123456`)<br>7 ký tự (`1234567`)<br>49 ký tự<br>50 ký tự<br>51 ký tự | B16<br>B17<br>B18<br>B19<br>B20<br>B21 |
| **Vai trò gán** (`role`) | Thuộc danh mục hệ thống: `ADMIN`, `EDITOR`, `MEMBER` | V8 | Bỏ trống hoặc gán vai trò không tồn tại | X14 | Chọn `MEMBER`<br>Chọn `EDITOR`<br>Gửi role `SUPERMAN` | B22<br>B23<br>B24 |

---

### 1.3. Chức năng Cập nhật trạng thái / Thông tin người dùng (`PUT/PATCH /api/users/:id`)

| Điều kiện | Phân vùng hợp lệ | Tag | Phân vùng không hợp lệ | Tag | Giá trị biên / Dữ liệu kiểm thử | Tag |
| :--- | :--- | :---: | :--- | :---: | :--- | :---: |
| **Quyền truy cập** | Token chứa quyền `ADMIN` | V9 | Người dùng thường hoặc không có token | X15 | Token Admin<br>Token Member | B25<br>B26 |
| **Định danh người dùng** (`id`) | Đúng định dạng MongoDB ObjectId (24 ký tự hex) và tồn tại | V10 | Sai định dạng hex / CastError<br>ID hợp lệ nhưng không tồn tại | X16<br>X17 | `65a1234567890abcdef12345`<br>`invalid-id-123`<br>`650000000000000000000000` | B27<br>B28<br>B29 |
| **Trạng thái tài khoản** (`status`) | Thuộc các giá trị: `ACTIVE`, `BLOCKED` | V11 | Giá trị chuỗi bất kỳ khác | X18 | `ACTIVE`<br>`BLOCKED`<br>`DELETED` (nếu không hỗ trợ) | B30<br>B31<br>B32 |

---

### 1.4. Chức năng Thông báo chung (`/api/notifications`)

| Điều kiện | Phân vùng hợp lệ | Tag | Phân vùng không hợp lệ | Tag | Giá trị biên / Dữ liệu kiểm thử | Tag |
| :--- | :--- | :---: | :--- | :---: | :--- | :---: |
| **Xác thực phiên** (`requireAuth`) | Gửi kèm Token JWT hợp lệ của bất kỳ tài khoản nào | V12 | Không gửi token hoặc token hết hạn / không hợp lệ | X19 | Token hợp lệ<br>Không Header<br>Token sai lệch | B33<br>B34<br>B35 |
| **Định danh thông báo** (`:id`) | Đúng định dạng ObjectId 24 ký tự hex và thuộc về tài khoản | V13 | ID sai định dạng<br>ID không tồn tại trong danh sách của user | X20<br>X21 | ID thông báo thật<br>`abc-123`<br>ID hợp lệ của người khác | B36<br>B37<br>B38 |

---

## Quy ước Tag
* `V`: Phân vùng hợp lệ (Valid Partition).
* `X`: Phân vùng không hợp lệ (Invalid Partition).
* `B`: Giá trị biên hoặc dữ liệu kiểm thử đại diện (Boundary / Test Data).

---

# Test case kiểm thử chức năng Tài khoản, Phân quyền & Thông báo

## Phần 1 — Xác thực & Đăng nhập (POST /api/auth/login)

| ID | Dữ liệu nhập | Kết quả mong đợi |
| :--- | :--- | :--- |
| **AUTH-01** | `email`: `"admin@example.com"`, `password`: `"password123"` (khớp thông tin có sẵn). | Đăng nhập thành công (200 OK); trả về `accessToken` và role `ADMIN`; chuyển hướng dashboard Admin. |
| **AUTH-02** | `email`: để trống `""`, `password`: `"password123"`. | Từ chối (400 Bad Request); báo lỗi email bắt buộc nhập; không cấp token. |
| **AUTH-03** | `email`: chỉ có khoảng trắng `"   "`, `password`: `"password123"`. | Từ chối (400 Bad Request); không chấp nhận email rỗng sau khi trim. |
| **AUTH-04** | `email`: `"admin-invalid-format"`, `password`: `"password123"`. | Từ chối (400 Bad Request); báo lỗi định dạng email không hợp lệ. |
| **AUTH-05** | `email`: `"notfound@example.com"` (chưa đăng ký), `password`: `"password123"`. | Từ chối (401 Unauthorized); báo lỗi tài khoản hoặc mật khẩu không chính xác. |
| **AUTH-06** | `email`: `"admin@example.com"`, `password`: `"wrongpassword"`. | Từ chối (401 Unauthorized); báo lỗi tài khoản hoặc mật khẩu không chính xác. |
| **AUTH-07** | `email`: `"admin@example.com"`, `password`: để trống `""`. | Từ chối (400 Bad Request); báo lỗi mật khẩu bắt buộc nhập. |

---

## Phần 2 — Quản lý User của Admin (POST / PUT / PATCH / DELETE /api/users)

| ID | Dữ liệu nhập & Quyền gọi API | Kết quả mong đợi |
| :--- | :--- | :--- |
| **USR-01** | Header: `Admin_Token`. `POST /api/users` với `email`: `"newuser@test.com"`, `password`: `"Pass123"`, `role`: `"MEMBER"`. | Tạo thành công (201 Created); lưu tài khoản mới; mã hóa mật khẩu; trả về thông tin user mới. |
| **USR-02** | Header: `Member_Token`. `POST /api/users` với dữ liệu hợp lệ. | Từ chối (403 Forbidden); chặn truy cập do không có quyền Admin (`requireRole(ROLES.ADMIN)`). |
| **USR-03** | Không gửi Header Token. `POST /api/users` với dữ liệu hợp lệ. | Từ chối (401 Unauthorized); báo lỗi yêu cầu xác thực (`requireAuth`). |
| **USR-04** | Header: `Admin_Token`. `POST /api/users` với `email`: `"admin@example.com"` (đã tồn tại). | Từ chối (400 / 409 Conflict); báo lỗi email đã được sử dụng. |
| **USR-05** | Header: `Admin_Token`. `POST /api/users` với `password`: 5 ký tự (`"12345"`). | Từ chối (400 Bad Request); báo lỗi mật khẩu ngắn hơn giới hạn 6 ký tự. |
| **USR-06** | Header: `Admin_Token`. `POST /api/users` với `password`: 51 ký tự. | Từ chối (400 Bad Request); báo lỗi mật khẩu vượt quá 50 ký tự. |
| **USR-07** | Header: `Admin_Token`. `POST /api/users` với `role`: `"SUPERMAN"`. | Từ chối (400 Bad Request); báo lỗi vai trò không hợp lệ. |
| **USR-08** | Header: `Admin_Token`. `PUT /api/users/:id` với `:id` hợp lệ và `{"name": "Nguyen Van B"}`. | Cập nhật thành công (200 OK); dữ liệu tên người dùng được lưu mới. |
| **USR-09** | Header: `Member_Token`. `PUT /api/users/:id` với `:id` hợp lệ. | Từ chối (403 Forbidden); không cho phép người dùng thường cập nhật thông tin user khác. |
| **USR-10** | Header: `Admin_Token`. `PUT /api/users/invalid-id-123`. | Từ chối (400 Bad Request); bắt lỗi CastError ID sai định dạng ObjectId. |
| **USR-11** | Header: `Admin_Token`. `PUT /api/users/650000000000000000000000` (ID không tồn tại). | Từ chối (404 Not Found); báo không tìm thấy người dùng. |
| **USR-12** | Header: `Admin_Token`. `PATCH /api/users/:id/status` với `{"status": "BLOCKED"}`. | Cập nhật thành công (200 OK); tài khoản bị khóa, không thể đăng nhập tiếp. |
| **USR-13** | Header: `Member_Token`. `PATCH /api/users/:id/status` với `{"status": "BLOCKED"}`. | Từ chối (403 Forbidden); chặn truy cập đổi trạng thái. |
| **USR-14** | Header: `Admin_Token`. `DELETE /api/users/:id` với `:id` hợp lệ. | Xóa thành công (200 OK); xóa bản ghi user khỏi hệ thống. |
| **USR-15** | Header: `Member_Token`. `DELETE /api/users/:id`. | Từ chối (403 Forbidden); chặn người dùng thường xóa tài khoản. |

---

## Phần 3 — Quản lý Thông báo chung (/api/notifications)

| ID | Dữ liệu nhập & Điều kiện thực hiện | Kết quả mong đợi |
| :--- | :--- | :--- |
| **NOTI-01** | Header: `Valid_Token`. `GET /api/notifications`. | Lấy danh sách thành công (200 OK); trả về mảng danh sách thông báo của tài khoản hiện tại. |
| **NOTI-02** | Không gửi Header Token. `GET /api/notifications`. | Từ chối (401 Unauthorized); báo lỗi yêu cầu xác thực. |
| **NOTI-03** | Header: `Valid_Token`. `GET /api/notifications/unread-count`. | Trả về (200 OK) kèm số lượng thông báo chưa đọc (`count`). |
| **NOTI-04** | Header: `Valid_Token`. `PUT /api/notifications/mark-all-read`. | Cập nhật thành công (200 OK); chuyển toàn bộ thông báo của user thành `isRead: true`. |
| **NOTI-05** | Không gửi Header Token. `PUT /api/notifications/mark-all-read`. | Từ chối (401 Unauthorized); chặn thao tác. |
| **NOTI-06** | Header: `Valid_Token`. `PUT /api/notifications/:id/read` với `:id` thông báo hợp lệ. | Đánh dấu đọc thành công (200 OK); thông báo tương ứng chuyển `isRead: true`. |
| **NOTI-07** | Header: `Valid_Token`. `PUT /api/notifications/invalid-id/read`. | Từ chối (400 Bad Request); báo lỗi ID thông báo không hợp lệ. |
| **NOTI-08** | Header: `Valid_Token`. `DELETE /api/notifications/:id` với `:id` thông báo hợp lệ. | Xóa thông báo thành công (200 OK); bản ghi bị gỡ bỏ. |

---

## Ghi chú dữ liệu
* Áp dụng nguyên tắc **Single Fault**: Mỗi ca kiểm thử thất bại chỉ vi phạm duy nhất một điều kiện, các điều kiện khác giữ ở giá trị hợp lệ.
* Chuẩn bị sẵn 2 tài khoản thực tế trên database: 1 tài khoản quyền `ADMIN` và 1 tài khoản quyền `MEMBER` để kiểm thử chính xác các ca chặn quyền (403).
* Các ca kiểm thử trên bao phủ đầy đủ luồng xác thực (`requireAuth`) và kiểm tra phân quyền (`requireRole(ROLES.ADMIN)`) trong mã nguồn Express của dự án.