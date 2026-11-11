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

---

## 2. Kiểm thử chuyển đổi trạng thái (State Transition Testing)

Phần này đặc tả toàn diện kiểm thử chuyển đổi trạng thái (State Transition Testing) cho 3 đối tượng nghiệp vụ cốt lõi theo chuẩn SRS: **Trạng thái tài khoản người dùng**, **Trạng thái phiên xác thực & Token**, và **Trạng thái thông báo**.

---

### 2.1. Trạng thái tài khoản người dùng (User Account Status Lifecycle)

#### A. Danh sách trạng thái (States) và Sự kiện kích hoạt (Events / Actions / APIs)
* **Danh sách trạng thái (States):**
  * `ACTIVE`: Tài khoản hoạt động bình thường, được phép đăng nhập và sử dụng đầy đủ chức năng theo phân quyền.
  * `BLOCKED`: Tài khoản bị khóa (Suspended) bởi Quản trị viên, bị vô hiệu hóa quyền đăng nhập và bị thu hồi các phiên truy cập hiện tại.
  * `DELETED` (`INACTIVE`): Tài khoản bị xóa khỏi hệ thống (soft delete/xóa mềm), không thể đăng nhập hoặc thao tác nghiệp vụ.
* **Sự kiện kích hoạt (Events / APIs):**
  * `CREATE_USER`: Admin tạo người dùng mới qua `POST /api/users` (hoặc `POST /api/auth/users`).
  * `BLOCK_USER`: Admin đổi trạng thái sang `BLOCKED` qua `PATCH/PUT /api/users/:id/status` với body `{"status": "BLOCKED"}`.
  * `UNBLOCK_USER`: Admin kích hoạt lại tài khoản qua `PATCH/PUT /api/users/:id/status` với body `{"status": "ACTIVE"}`.
  * `DELETE_USER`: Admin thực hiện xóa tài khoản qua `DELETE /api/users/:id` (hoặc `DELETE /api/auth/users/:id`).
  * `ATTEMPT_LOGIN`: Người dùng thực hiện đăng nhập qua `POST /api/auth/login`.
  * `NON_ADMIN_CHANGE_STATUS`: Người dùng không có quyền Admin (Member/Editor) cố gắng gọi API thay đổi trạng thái qua `PATCH /api/users/:id/status`.

#### B. Bảng ma trận chuyển đổi trạng thái (State Transition Table)

| ID | Start State (Trạng thái bắt đầu) | Event / API Action (Sự kiện kích hoạt / Endpoint) | Expected Output / HTTP Code | End State (Trạng thái kết thúc) | Ghi chú (Hợp lệ / Bất hợp lệ) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **ST-USR-01** | `None` (Chưa tồn tại) | Admin tạo user (`POST /api/users`) | 201 Created; tài khoản được lưu với trạng thái Active | `ACTIVE` | **Hợp lệ** (Khởi tạo tài khoản mới) |
| **ST-USR-02** | `ACTIVE` | Admin khóa tài khoản (`PATCH /api/users/:id/status`, `status: "BLOCKED"`) | 200 OK; thông báo khóa thành công; vô hiệu hóa refresh token | `BLOCKED` | **Hợp lệ** (Khóa tài khoản vi phạm) |
| **ST-USR-03** | `BLOCKED` | Admin mở khóa tài khoản (`PATCH /api/users/:id/status`, `status: "ACTIVE"`) | 200 OK; thông báo mở khóa thành công; cho phép đăng nhập lại | `ACTIVE` | **Hợp lệ** (Mở khóa tài khoản) |
| **ST-USR-04** | `ACTIVE` | Admin xóa tài khoản (`DELETE /api/users/:id`) | 200 OK; thông báo xóa thành công; chuyển trạng thái Inactive/Deleted | `DELETED` | **Hợp lệ** (Xóa mềm tài khoản đang active) |
| **ST-USR-05** | `BLOCKED` | Admin xóa tài khoản (`DELETE /api/users/:id`) | 200 OK; thông báo xóa thành công; chuyển trạng thái Inactive/Deleted | `DELETED` | **Hợp lệ** (Xóa tài khoản đang bị khóa) |
| **ST-USR-06** | `BLOCKED` | User bị khóa cố đăng nhập (`POST /api/auth/login`) | 403 Forbidden; lỗi `AUTH_ACCOUNT_SUSPENDED`; từ chối cấp token | `BLOCKED` | **Bất hợp lệ** (Chặn đăng nhập tài khoản khóa) |
| **ST-USR-07** | `DELETED` | User đã bị xóa cố đăng nhập (`POST /api/auth/login`) | 403 Forbidden / 401 Unauthorized (`AUTH_ACCOUNT_INACTIVE`) | `DELETED` | **Bất hợp lệ** (Chặn đăng nhập tài khoản đã xóa) |
| **ST-USR-08** | `ACTIVE` | Member/Non-admin cố đổi trạng thái (`PATCH /api/users/:id/status`) | 403 Forbidden; chặn quyền truy cập do thiếu quyền Admin | `ACTIVE` | **Bất hợp lệ** (Vi phạm phân quyền) |
| **ST-USR-09** | `BLOCKED` | Admin gửi trạng thái không hợp lệ (`PATCH /api/users/:id/status`, `status: "INVALID_STATUS"`) | 400 Bad Request; báo lỗi `status` không hợp lệ | `BLOCKED` | **Bất hợp lệ** (Sai tham số đầu vào) |
| **ST-USR-10** | `DELETED` | Admin cố cập nhật trạng thái tài khoản đã xóa (`PATCH /api/users/:id/status`) | 404 Not Found / 400 Bad Request | `DELETED` | **Bất hợp lệ** (Thao tác trên tài khoản không còn hiệu lực) |

#### C. Bảng ca kiểm thử chuyển đổi trạng thái (State Transition Test Cases)

| Mã Test Case | Tên ca kiểm thử | Trạng thái bắt đầu | Điều kiện tiền đề & Thao tác kiểm thử (Input / API) | Kết quả mong đợi (Expected Result & HTTP Code) | Trạng thái kết thúc | Loại kiểm thử |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-ST-USR-01** | Tạo mới tài khoản người dùng thành công | `None` | Header: `Admin_Token`. Gửi `POST /api/users` với payload hợp lệ: `{ email, password, role: "MEMBER" }`. | 201 Created. User được tạo với trường `status = "Active"`, mật khẩu được hash an toàn. | `ACTIVE` | Chuyển đổi hợp lệ |
| **TC-ST-USR-02** | Khóa tài khoản đang hoạt động | `ACTIVE` | Header: `Admin_Token`. Gửi `PATCH /api/users/:id/status` với body `{"status": "BLOCKED"}`. | 200 OK. Phản hồi "Đã khóa tài khoản thành công", DB cập nhật `status = "Suspended"`. | `BLOCKED` | Chuyển đổi hợp lệ |
| **TC-ST-USR-03** | Mở khóa tài khoản đang bị khóa | `BLOCKED` | Header: `Admin_Token`. Gửi `PATCH /api/users/:id/status` với body `{"status": "ACTIVE"}`. | 200 OK. Phản hồi "Đã mở khóa tài khoản thành công", DB cập nhật `status = "Active"`. | `ACTIVE` | Chuyển đổi hợp lệ |
| **TC-ST-USR-04** | Xóa mềm tài khoản đang ACTIVE | `ACTIVE` | Header: `Admin_Token`. Gửi `DELETE /api/users/:id`. | 200 OK. Phản hồi "Đã xóa tài khoản thành công", DB cập nhật `status = "Inactive"`. | `DELETED` | Chuyển đổi hợp lệ |
| **TC-ST-USR-05** | Xóa mềm tài khoản đang BLOCKED | `BLOCKED` | Header: `Admin_Token`. Gửi `DELETE /api/users/:id`. | 200 OK. Bản ghi chuyển thành `status = "Inactive"`. | `DELETED` | Chuyển đổi hợp lệ |
| **TC-ST-USR-06** | Đăng nhập tài khoản đang bị khóa | `BLOCKED` | Tài khoản có `status: "BLOCKED"`. Gửi `POST /api/auth/login` với đúng email & password. | 403 Forbidden. Thông báo lỗi tài khoản bị tạm ngưng/khóa (`AUTH_ACCOUNT_SUSPENDED`), không cấp Token. | `BLOCKED` | Chuyển đổi không hợp lệ (Negative) |
| **TC-ST-USR-07** | Đăng nhập tài khoản đã bị xóa/vô hiệu hóa | `DELETED` | Tài khoản có `status: "Inactive"`. Gửi `POST /api/auth/login` với email & password. | 403 Forbidden. Báo lỗi tài khoản ngưng hoạt động (`AUTH_ACCOUNT_INACTIVE`). | `DELETED` | Chuyển đổi không hợp lệ (Negative) |
| **TC-ST-USR-08** | Người dùng thường cố đổi trạng thái tài khoản | `ACTIVE` | Header: `Member_Token`. Gửi `PATCH /api/users/:id/status` với `{"status": "BLOCKED"}`. | 403 Forbidden. Bị chặn bởi middleware `requireRole(ROLES.ADMIN)`. Trạng thái user không đổi. | `ACTIVE` | Chuyển đổi không hợp lệ (Negative) |
| **TC-ST-USR-09** | Cập nhật trạng thái người dùng với giá trị không hợp lệ | `BLOCKED` | Header: `Admin_Token`. Gửi `PATCH /api/users/:id/status` với `{"status": "UNKNOWN_VAL"}`. | 400 Bad Request (`AUTH_INVALID_STATUS`). Hệ thống từ chối cập nhật. | `BLOCKED` | Chuyển đổi không hợp lệ (Negative) |
| **TC-ST-USR-010** | Cố chuyển đổi trạng thái trên tài khoản đã xóa | `DELETED` | Header: `Admin_Token`. Gửi `PATCH /api/users/:deleted_id/status` với `{"status": "ACTIVE"}`. | 404 Not Found (hoặc 400 Bad Request nếu không tìm thấy bản ghi khả dụng). | `DELETED` | Chuyển đổi không hợp lệ (Negative) |

---

### 2.2. Trạng thái phiên đăng nhập & xác thực Token (Auth Session & Token Lifecycle)

#### A. Danh sách trạng thái (States) và Sự kiện kích hoạt (Events / Actions / APIs)
* **Danh sách trạng thái (States):**
  * `LOGGED_OUT`: Trạng thái chưa đăng nhập hoặc đã đăng xuất. Không có Access Token hợp lệ, không có Refresh Token Cookie.
  * `AUTHENTICATED` (`LOGGED_IN`): Người dùng đã xác thực thành công. Nắm giữ Access Token (JWT) còn hiệu lực và Refresh Token hợp lệ lưu trong Cookie (`httpOnly`).
  * `TOKEN_EXPIRED`: Access Token đã quá hạn sống (TTL hết hạn), nhưng Refresh Token vẫn còn hiệu lực để cấp mới Access Token.
* **Sự kiện kích hoạt (Events / APIs):**
  * `LOGIN_SUCCESS`: Đăng nhập thành công với email và password chính xác qua `POST /api/auth/login`.
  * `ACCESS_TOKEN_TIMEOUT`: Thời gian sống của Access Token kết thúc (sau khoảng thời gian cấu hình, ví dụ 15 phút).
  * `REFRESH_SUCCESS`: Gọi API làm mới token thành công qua `POST /api/auth/refresh` với Refresh Token hợp lệ.
  * `REFRESH_EXPIRED_OR_INVALID`: Gọi API làm mới token nhưng Refresh Token đã hết hạn hoặc không hợp lệ / bị thu hồi.
  * `LOGOUT_ACTION`: Người dùng chủ động đăng xuất qua `POST /api/auth/logout`.
  * `ACCESS_PROTECTED_API`: Gửi request đến các route có gắn middleware `requireAuth`.

#### B. Bảng ma trận chuyển đổi trạng thái (State Transition Table)

| ID | Start State (Trạng thái bắt đầu) | Event / API Action (Sự kiện kích hoạt / Endpoint) | Expected Output / HTTP Code | End State (Trạng thái kết thúc) | Ghi chú (Hợp lệ / Bất hợp lệ) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **ST-SES-01** | `LOGGED_OUT` | Đăng nhập thông tin hợp lệ (`POST /api/auth/login`) | 200 OK; trả về `accessToken` và gán cookie `refreshToken` | `AUTHENTICATED` | **Hợp lệ** (Đăng nhập thành công) |
| **ST-SES-02** | `AUTHENTICATED` | Gọi API bảo vệ khi token còn hạn (`GET /api/auth/me`) | 200 OK; trả về payload user profile | `AUTHENTICATED` | **Hợp lệ** (Duy trì phiên đăng nhập) |
| **ST-SES-03** | `AUTHENTICATED` | Hết thời gian sống Access Token (Token TTL timeout) | Token hết hạn, gọi API bảo vệ nhận 401 Unauthorized (`AUTH_TOKEN_EXPIRED`) | `TOKEN_EXPIRED` | **Hợp lệ** (Chuyển đổi tự nhiên do timeout) |
| **ST-SES-04** | `TOKEN_EXPIRED` | Refresh Token thành công (`POST /api/auth/refresh` với valid refresh cookie) | 200 OK; cấp phát `accessToken` mới | `AUTHENTICATED` | **Hợp lệ** (Khôi phục phiên hoạt động) |
| **ST-SES-05** | `AUTHENTICATED` | Người dùng bấm Đăng xuất (`POST /api/auth/logout`) | 200 OK; xóa cookie refreshToken; hủy phiên | `LOGGED_OUT` | **Hợp lệ** (Đăng xuất chủ động) |
| **ST-SES-06** | `TOKEN_EXPIRED` | Refresh Token hết hạn hoặc không hợp lệ khi refresh (`POST /api/auth/refresh`) | 401 Unauthorized; xóa bỏ cookie refreshToken | `LOGGED_OUT` | **Hợp lệ** (Phiên hết hạn hoàn toàn) |
| **ST-SES-07** | `LOGGED_OUT` | Đăng nhập sai mật khẩu hoặc tài khoản không tồn tại (`POST /api/auth/login`) | 401 Unauthorized; báo lỗi xác thực; không cấp token | `LOGGED_OUT` | **Bất hợp lệ** (Đăng nhập thất bại) |
| **ST-SES-08** | `LOGGED_OUT` | Cố gọi API bảo vệ mà không gửi Token (`GET /api/auth/me`) | 401 Unauthorized (`AUTH_UNAUTHORIZED`); yêu cầu đăng nhập | `LOGGED_OUT` | **Bất hợp lệ** (Chặn truy cập không xác thực) |
| **ST-SES-09** | `TOKEN_EXPIRED` | Tiếp tục dùng Access Token hết hạn gọi API bảo vệ mà không refresh | 401 Unauthorized (`AUTH_TOKEN_EXPIRED`) | `TOKEN_EXPIRED` | **Bất hợp lệ** (Token hết hạn không được cấp quyền) |
| **ST-SES-10** | `LOGGED_OUT` | Cố gọi refresh token khi chưa đăng nhập (`POST /api/auth/refresh`) | 401 Unauthorized; không tìm thấy refreshToken hợp lệ | `LOGGED_OUT` | **Bất hợp lệ** (Không có session để làm mới) |

#### C. Bảng ca kiểm thử chuyển đổi trạng thái (State Transition Test Cases)

| Mã Test Case | Tên ca kiểm thử | Trạng thái bắt đầu | Điều kiện tiền đề & Thao tác kiểm thử (Input / API) | Kết quả mong đợi (Expected Result & HTTP Code) | Trạng thái kết thúc | Loại kiểm thử |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-ST-SES-01** | Đăng nhập tài khoản hợp lệ | `LOGGED_OUT` | Gửi `POST /api/auth/login` với email và password chính xác của user đang `ACTIVE`. | 200 OK. Trả về `accessToken` (JWT), set cookie `refreshToken` (httpOnly), dữ liệu user. | `AUTHENTICATED` | Chuyển đổi hợp lệ |
| **TC-ST-SES-02** | Truy cập tài nguyên bảo vệ trong phiên đăng nhập | `AUTHENTICATED` | Header: `Bearer <valid_access_token>`. Gửi `GET /api/auth/me`. | 200 OK. Trả về thông tin cá nhân của người dùng hiện tại (`req.user`). | `AUTHENTICATED` | Chuyển đổi hợp lệ |
| **TC-ST-SES-03** | Access Token hết hạn tự nhiên | `AUTHENTICATED` | Chờ Access Token quá thời gian hết hạn (hoặc giả lập token đã hết hạn). Gửi `GET /api/auth/me`. | 401 Unauthorized (`AUTH_TOKEN_EXPIRED`). Hệ thống từ chối truy cập và yêu cầu refresh token. | `TOKEN_EXPIRED` | Chuyển đổi hợp lệ |
| **TC-ST-SES-04** | Làm mới Access Token bằng Refresh Token hợp lệ | `TOKEN_EXPIRED` | Cookie chứa `refreshToken` hợp lệ còn hạn. Gửi `POST /api/auth/refresh`. | 200 OK. Nhận được `accessToken` mới hợp lệ, tiếp tục truy cập các API bảo vệ. | `AUTHENTICATED` | Chuyển đổi hợp lệ |
| **TC-ST-SES-05** | Đăng xuất người dùng thành công | `AUTHENTICATED` | Gửi `POST /api/auth/logout` kèm Cookie `refreshToken`. | 200 OK. Phản hồi "Logged out successfully", cookie refresh token bị xóa bỏ hoàn toàn. | `LOGGED_OUT` | Chuyển đổi hợp lệ |
| **TC-ST-SES-06** | Làm mới token thất bại khi Refresh Token quá hạn | `TOKEN_EXPIRED` | Cookie chứa `refreshToken` đã hết hạn (sau 7 ngày) hoặc token giả mạo. Gửi `POST /api/auth/refresh`. | 401 Unauthorized. Refresh token bị xóa khỏi cookie, buộc người dùng đăng nhập lại từ đầu. | `LOGGED_OUT` | Chuyển đổi hợp lệ |
| **TC-ST-SES-07** | Đăng nhập thất bại do sai mật khẩu | `LOGGED_OUT` | Gửi `POST /api/auth/login` với email đúng nhưng password sai. | 401 Unauthorized. Thông báo tài khoản hoặc mật khẩu không chính xác; không tạo phiên. | `LOGGED_OUT` | Chuyển đổi không hợp lệ (Negative) |
| **TC-ST-SES-08** | Truy cập route bảo vệ khi không có Token | `LOGGED_OUT` | Không đính kèm Authorization Header. Gửi `GET /api/auth/me` hoặc `GET /api/notifications`. | 401 Unauthorized (`AUTH_UNAUTHORIZED`). Chặn truy cập. | `LOGGED_OUT` | Chuyển đổi không hợp lệ (Negative) |
| **TC-ST-SES-09** | Gọi API bảo vệ bằng Access Token đã hết hạn | `TOKEN_EXPIRED` | Header: `Bearer <expired_access_token>`. Gửi `GET /api/notifications`. | 401 Unauthorized. Hệ thống bắt lỗi `TokenExpiredError`, không cho phép truy xuất dữ liệu. | `TOKEN_EXPIRED` | Chuyển đổi không hợp lệ (Negative) |
| **TC-ST-SES-010** | Cố refresh token khi không có cookie / header | `LOGGED_OUT` | Không có cookie refreshToken. Gửi `POST /api/auth/refresh`. | 401 Unauthorized. Báo lỗi thiếu hoặc không tìm thấy refresh token. | `LOGGED_OUT` | Chuyển đổi không hợp lệ (Negative) |

---

### 2.3. Trạng thái thông báo (Notification State Lifecycle)

#### A. Danh sách trạng thái (States) và Sự kiện kích hoạt (Events / Actions / APIs)
* **Danh sách trạng thái (States):**
  * `UNREAD`: Thông báo mới được hệ thống tạo cho người dùng, cờ `is_read = false`.
  * `READ`: Thông báo đã được người dùng xem hoặc đánh dấu đã đọc, cờ `is_read = true`.
  * `DELETED`: Thông báo đã bị xóa khỏi hộp thư thông báo của người dùng (bản ghi bị gỡ bỏ).
* **Sự kiện kích hoạt (Events / APIs):**
  * `TRIGGER_NOTIFICATION`: Hệ thống phát sinh thông báo mới (Task, Chapter, System, Warning) và lưu vào cơ sở dữ liệu.
  * `MARK_ONE_READ`: Người dùng đánh dấu 1 thông báo là đã đọc qua `PUT /api/notifications/:id/read`.
  * `MARK_ALL_READ`: Người dùng đánh dấu tất cả thông báo là đã đọc qua `PUT /api/notifications/mark-all-read` (hoặc `PUT /api/notifications/read-all`).
  * `DELETE_NOTIFICATION`: Người dùng xóa 1 thông báo qua `DELETE /api/notifications/:id`.
  * `CROSS_USER_ACCESS`: Người dùng A cố ý đánh dấu đọc hoặc xóa thông báo thuộc quyền sở hữu của Người dùng B.
  * `INVALID_ID_ACTION`: Gọi API thao tác với ID không hợp lệ hoặc thông báo đã bị xóa.

#### B. Bảng ma trận chuyển đổi trạng thái (State Transition Table)

| ID | Start State (Trạng thái bắt đầu) | Event / API Action (Sự kiện kích hoạt / Endpoint) | Expected Output / HTTP Code | End State (Trạng thái kết thúc) | Ghi chú (Hợp lệ / Bất hợp lệ) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **ST-NOTI-01** | `None` (Chưa có) | Hệ thống kích hoạt tạo thông báo (`TRIGGER_NOTIFICATION`) | Bản ghi mới tạo trong DB với `is_read: false` | `UNREAD` | **Hợp lệ** (Tạo thông báo mới) |
| **ST-NOTI-02** | `UNREAD` | Đánh dấu 1 thông báo đã đọc (`PUT /api/notifications/:id/read`) | 200 OK; thông báo "Đã đánh dấu đã đọc"; `is_read` -> true | `READ` | **Hợp lệ** (Đọc thông báo đơn lẻ) |
| **ST-NOTI-03** | `UNREAD` | Đánh dấu đọc tất cả (`PUT /api/notifications/mark-all-read`) | 200 OK; toàn bộ thông báo chưa đọc chuyển `is_read` -> true | `READ` | **Hợp lệ** (Đọc toàn bộ thông báo) |
| **ST-NOTI-04** | `READ` | Đánh dấu đọc lại thông báo đã đọc (`PUT /api/notifications/:id/read`) | 200 OK; idempotent action, `is_read` giữ nguyên true | `READ` | **Hợp lệ** (Thao tác lặp trạng thái an toàn) |
| **ST-NOTI-05** | `UNREAD` | Xóa thông báo khi chưa đọc (`DELETE /api/notifications/:id`) | 200 OK; xóa bản ghi khỏi danh sách; giảm unread count | `DELETED` | **Hợp lệ** (Xóa thông báo chưa đọc) |
| **ST-NOTI-06** | `READ` | Xóa thông báo đã đọc (`DELETE /api/notifications/:id`) | 200 OK; thông báo "Đã xóa thông báo" thành công | `DELETED` | **Hợp lệ** (Xóa thông báo đã đọc) |
| **ST-NOTI-07** | `DELETED` | Cố đánh dấu đọc thông báo đã bị xóa (`PUT /api/notifications/:id/read`) | 404 Not Found; báo "Không tìm thấy thông báo" | `DELETED` | **Bất hợp lệ** (Thông báo không còn tồn tại) |
| **ST-NOTI-08** | `DELETED` | Cố xóa lại thông báo đã bị xóa (`DELETE /api/notifications/:id`) | 404 Not Found; báo "Không tìm thấy thông báo" | `DELETED` | **Bất hợp lệ** (Không thể xóa bản ghi đã mất) |
| **ST-NOTI-09** | `UNREAD` / `READ` | User A cố đánh dấu đọc/xóa thông báo của User B | 404 Not Found (hoặc 403 Forbidden); không tìm thấy trong phạm vi user | `UNREAD` / `READ` (Không đổi) | **Bất hợp lệ** (Vi phạm quyền sở hữu thông báo) |
| **ST-NOTI-10** | `UNREAD` | Gọi thao tác với `:id` sai định dạng ObjectId (`PUT /api/notifications/invalid-id/read`) | 400 Bad Request; báo "ID thông báo không hợp lệ" | `UNREAD` | **Bất hợp lệ** (Sai định dạng tham số) |

#### C. Bảng ca kiểm thử chuyển đổi trạng thái (State Transition Test Cases)

| Mã Test Case | Tên ca kiểm thử | Trạng thái bắt đầu | Điều kiện tiền đề & Thao tác kiểm thử (Input / API) | Kết quả mong đợi (Expected Result & HTTP Code) | Trạng thái kết thúc | Loại kiểm thử |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-ST-NOTI-01** | Tạo mới thông báo cho người dùng | `None` | Kích hoạt sự kiện nghiệp vụ (ví dụ: giao Task mới hoặc Admin phát thông báo). | Thông báo xuất hiện trong `GET /api/notifications`, trường `is_read = false`, tăng `unread-count`. | `UNREAD` | Chuyển đổi hợp lệ |
| **TC-ST-NOTI-02** | Đánh dấu 1 thông báo chưa đọc thành đã đọc | `UNREAD` | Header: `Valid_Token_A`. Gửi `PUT /api/notifications/:id_A/read` (thông báo thuộc sở hữu của User A). | 200 OK. Phản hồi "Đã đánh dấu đã đọc", trường `is_read = true`, số lượng `unread-count` giảm 1. | `READ` | Chuyển đổi hợp lệ |
| **TC-ST-NOTI-03** | Đánh dấu tất cả thông báo thành đã đọc | `UNREAD` | Header: `Valid_Token_A`. User A có 5 thông báo chưa đọc. Gửi `PUT /api/notifications/mark-all-read`. | 200 OK. Phản hồi "Đã đánh dấu tất cả đã đọc", `unread-count` trả về 0, toàn bộ item có `is_read = true`. | `READ` | Chuyển đổi hợp lệ |
| **TC-ST-NOTI-04** | Đánh dấu đọc lại thông báo đã đọc trước đó | `READ` | Header: `Valid_Token_A`. Thông báo đã có `is_read = true`. Gửi `PUT /api/notifications/:id_A/read`. | 200 OK. Hệ thống xử lý an toàn (idempotent), trạng thái vẫn là `is_read = true`, không giảm âm unread count. | `READ` | Chuyển đổi hợp lệ |
| **TC-ST-NOTI-05** | Xóa thông báo khi đang ở trạng thái chưa đọc | `UNREAD` | Header: `Valid_Token_A`. Gửi `DELETE /api/notifications/:id_A` của thông báo chưa đọc. | 200 OK. Phản hồi "Đã xóa thông báo", bản ghi bị gỡ bỏ, `unread-count` giảm tương ứng. | `DELETED` | Chuyển đổi hợp lệ |
| **TC-ST-NOTI-06** | Xóa thông báo khi đang ở trạng thái đã đọc | `READ` | Header: `Valid_Token_A`. Gửi `DELETE /api/notifications/:id_A` của thông báo đã đọc. | 200 OK. Phản hồi "Đã xóa thông báo", bản ghi không còn trong danh sách `GET /api/notifications`. | `DELETED` | Chuyển đổi hợp lệ |
| **TC-ST-NOTI-07** | Đánh dấu đọc trên thông báo đã xóa | `DELETED` | Header: `Valid_Token_A`. Gửi `PUT /api/notifications/:deleted_id/read`. | 404 Not Found. Báo lỗi "Không tìm thấy thông báo", không thể chuyển trạng thái. | `DELETED` | Chuyển đổi không hợp lệ (Negative) |
| **TC-ST-NOTI-08** | Cố gắng xóa lại thông báo đã bị xóa | `DELETED` | Header: `Valid_Token_A`. Gửi `DELETE /api/notifications/:deleted_id` lần thứ hai. | 404 Not Found. Báo lỗi "Không tìm thấy thông báo". | `DELETED` | Chuyển đổi không hợp lệ (Negative) |
| **TC-ST-NOTI-09** | Người dùng A cố thao tác trên thông báo của Người dùng B | `UNREAD` (của B) | Header: `Valid_Token_A`. Gửi `PUT /api/notifications/:id_B/read` hoặc `DELETE /api/notifications/:id_B`. | 404 Not Found. Chặn truy cập chéo tài nguyên giữa các người dùng; thông báo của B giữ nguyên trạng thái. | `UNREAD` (của B) | Chuyển đổi không hợp lệ (Negative) |
| **TC-ST-NOTI-010** | Đánh dấu đọc thông báo với ID sai cú pháp | `UNREAD` | Header: `Valid_Token_A`. Gửi `PUT /api/notifications/invalid-id-hex/read`. | 400 Bad Request. Báo "ID thông báo không hợp lệ" do vi phạm chuẩn ObjectId. | `UNREAD` | Chuyển đổi không hợp lệ (Negative) |
