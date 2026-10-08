Bạn là một chuyên gia về API và Postman. Dựa vào tài liệu "KCPM API Reference" được cung cấp bên dưới, hãy tạo ra một file JSON chuẩn cấu trúc Postman Collection v2.1.0.

Yêu cầu cấu hình chi tiết cho Collection này như sau:

1. Thông tin chung (Info):
   - Tên Collection: "KCPM API Collection"
   - Schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"

2. Biến (Variables):
   - Tạo biến `baseUrl` với giá trị mặc định là `http://localhost:5000`.
   - Tạo biến `accessToken` (để trống).
   - Tạo biến `refreshToken` (để trống).

3. Xác thực (Authorization):
   - Cài đặt Auth ở cấp độ Collection (Collection-level Auth) là `Bearer Token`, sử dụng giá trị `{{accessToken}}`.
   - Đối với các API Public (`GET /`, `POST /api/auth/login`, `POST /api/auth/logout`, `POST /api/auth/refresh`), hãy set auth của riêng các request đó thành `No Auth`.

4. Cấu trúc thư mục (Folders):
   - Tạo các thư mục tương ứng với các phần trong tài liệu: "Auth & Users", "Series", "Chapters", "Pages & Upload", "Annotations", "Regions", "Tasks", "Board Review", "Publish & Issues", "Rankings", "Notifications", "Income", "Admin Dashboard".
   - Phân bổ chính xác các API vào đúng thư mục.

5. Cấu trúc Request:
   - Method: Lấy chính xác GET, POST, PUT, PATCH, DELETE.
   - URL: Dùng biến `{{baseUrl}}` (ví dụ: `{{baseUrl}}/api/auth/login`).
   - Tham số URL (Path Variables): Các biến như `:id`, `:chapter_id` phải được khai báo trong mảng `variable` của URL trong Postman JSON để người dùng dễ điền.
   - Query Parameters: Khai báo sẵn trong mảng `query` của URL.
   - Request Body:
     - Nếu ghi chú là `multipart/form-data`: Thiết lập `mode` là `formdata` và tạo các trường tương ứng (kiểu file hoặc text).
     - Các dạng khác: Thiết lập `mode` là `raw` với ngôn ngữ `json`, tạo sẵn JSON body mẫu dựa trên các trường tài liệu yêu cầu.

6. Tự động hóa (Tests Script):
   - Riêng tại request `POST /api/auth/login`, hãy thêm script vào phần `event` -> `test` để tự động lấy `accessToken` và `refreshToken` (nếu có) từ JSON response và lưu vào pm.environment.
     Mẫu script:
     var jsonData = pm.response.json();
     if(jsonData.accessToken) pm.environment.set("accessToken", jsonData.accessToken);
     if(jsonData.refreshToken) pm.environment.set("refreshToken", jsonData.refreshToken);

Lưu ý quan trọng:

- Chỉ trả về duy nhất MỘT đoạn mã JSON hoàn chỉnh, hợp lệ, không bọc thêm bất kỳ văn bản giải thích nào khác để tôi có thể lưu thành file .json và import thẳng vào Postman.

Dưới đây là tài liệu API để bạn xử lý:

# KCPM API Reference

> Tài liệu được tổng hợp từ route/controller/model hiện đang được mount trong `../../backend/src/app.js`. `ObjectId` là ID MongoDB dạng chuỗi; ngày giờ dùng ISO-8601.

## 1. Base URL

- Base prefix: `/api`
- Ví dụ local: `http://localhost:<BACKEND_PORT>/api`
- Health/welcome route: `GET /` (không có prefix `/api`, public).

## 2. Authentication và Authorization

### Cơ chế xác thực

- Access token: JWT gửi trong header `Authorization: Bearer <accessToken>`.
- Refresh token: JWT được lưu trong cookie HttpOnly ở endpoint `/api/auth/refresh` và `/api/auth/logout`; body `refreshToken` được hỗ trợ như fallback.
- Các router nghiệp vụ dùng `requireAuth`; token được kiểm tra, user được nạp lại từ database và tài khoản `Inactive`/`Suspended` bị từ chối.
- Các role hiện có: `Admin`, `Assistant`, `Editorial Board`, `Mangaka`, `Tantou Editor`.
- Ngoài role, một số endpoint còn kiểm tra scope theo series/chapter/page.

### Public endpoints

| Method | Endpoint            | Body                                              |
| ------ | ------------------- | ------------------------------------------------- |
| `GET`  | `/`                 | Không có                                          |
| `POST` | `/api/auth/login`   | `{ email: string, password: string }`             |
| `POST` | `/api/auth/logout`  | `{ refreshToken?: string }`; thường lấy từ cookie |
| `POST` | `/api/auth/refresh` | `{ refreshToken?: string }`; thường lấy từ cookie |

Tất cả endpoint bên dưới đều yêu cầu `Authorization: Bearer ...`.

## 3. API theo chức năng

### Auth và quản lý user (`/api/auth`)

| Method + endpoint                         | Quyền              | Parameters / query                                                                                            | Request body                                                                                                                                                                |
| ----------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/auth/me`                        | Mọi user đăng nhập | -                                                                                                             | -                                                                                                                                                                           |
| `GET /api/auth/users`                     | `Admin`            | `page?: number`, `limit?: number`, `search?: string`, `role?: string`, `status?: Active\|Inactive\|Suspended` | -                                                                                                                                                                           |
| `POST /api/auth/users`                    | `Admin`            | -                                                                                                             | `name: string`, `email: string`, `password: string` (>= 8 ký tự), `role: Admin\|Assistant\|Editorial Board\|Mangaka\|Tantou Editor`, `status?: Active\|Inactive\|Suspended` |
| `POST /api/auth/users/:id/reset-password` | `Admin`            | Path `id: ObjectId`                                                                                           | `newPassword: string`                                                                                                                                                       |
| `PUT /api/auth/users/:id`                 | `Admin`            | Path `id: ObjectId`                                                                                           | Các field được hỗ trợ: `name?: string`, `email?: string`, `role?: Admin\|Assistant\|Editorial Board\|Mangaka\|Tantou Editor`; `status` và `avatar` bị bỏ qua bởi service    |
| `PATCH /api/auth/users/:id/status`        | `Admin`            | Path `id: ObjectId`                                                                                           | `status: Active\|Inactive\|Suspended`                                                                                                                                       |
| `DELETE /api/auth/users/:id`              | `Admin`            | Path `id: ObjectId`                                                                                           | -                                                                                                                                                                           |

### Series (`/api/series`)

| Method + endpoint                            | Quyền                                                  | Parameters / query                                                                       | Request body                                                                                                                                                                                                      |
| -------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /api/series`                           | `Mangaka` (Admin có thể truyền `author_id`)            | -                                                                                        | `title: string` (bắt buộc), `description?: string`, `genre?: string`, `target_audience?: string`, `author_id?: ObjectId`, `editor_id?: ObjectId`, `summary?: string`, `characters?: string`, `art_style?: string` |
| `GET /api/series/mine`                       | `Mangaka`, `Admin`                                     | -                                                                                        | -                                                                                                                                                                                                                 |
| `GET /api/series/mine/:author_id`            | `Admin`                                                | Path `author_id: ObjectId`                                                               | -                                                                                                                                                                                                                 |
| `GET /api/series/editor`                     | `Tantou Editor`                                        | -                                                                                        | -                                                                                                                                                                                                                 |
| `GET /api/series/all`                        | Mọi user đăng nhập                                     | -                                                                                        | -                                                                                                                                                                                                                 |
| `GET /api/series/assistant`                  | `Assistant`                                            | -                                                                                        | -                                                                                                                                                                                                                 |
| `GET /api/series/editors`                    | `Mangaka`, `Tantou Editor`, `Editorial Board`, `Admin` | -                                                                                        | -                                                                                                                                                                                                                 |
| `GET /api/series/at-risk`                    | `Editorial Board`, `Admin`                             | -                                                                                        | -                                                                                                                                                                                                                 |
| `GET /api/series/progress`                   | Mọi role đăng nhập                                     | `page?: number`, `limit?: number`, `search?: string`, `filter?: string`, `sort?: string` | -                                                                                                                                                                                                                 |
| `PATCH /api/series/:id/status`               | `Editorial Board`, `Admin`                             | Path `id: ObjectId`                                                                      | `status: Active\|At Risk\|Hiatus\|Cancelled\|Completed\|Changed Schedule` (bắt buộc), `approved_schedule?: weekly\|monthly\|one-shot\|online only\|none`, `risk_status?: Safe\|Warning\|Critical`                 |
| `GET /api/series/:id/lifecycle-votes`        | `Editorial Board`, `Admin`                             | Path `id: ObjectId`                                                                      | -                                                                                                                                                                                                                 |
| `POST /api/series/:id/lifecycle-vote`        | `Editorial Board`, `Admin`                             | Path `id: ObjectId`                                                                      | `vote: Continue\|Cancel\|Hiatus\|Change Schedule\|Online Only\|Need Improvement Plan`, `comment?: string`                                                                                                         |
| `GET /api/series/:id`                        | `Mangaka`, `Tantou Editor`, `Editorial Board`, `Admin` | Path `id: ObjectId`                                                                      | -                                                                                                                                                                                                                 |
| `PUT /api/series/:id`                        | `Mangaka`                                              | Path `id: ObjectId`                                                                      | Tất cả optional: `title?: string`, `description?: string`, `genre?: string`, `target_audience?: string`, `editor_id?: ObjectId\|null`                                                                             |
| `PUT /api/series/:id/proposal`               | `Mangaka`                                              | Path `id: ObjectId`                                                                      | `summary: string` (bắt buộc), `characters?: string`, `art_style?: string`                                                                                                                                         |
| `POST /api/series/:id/proposal/submit`       | `Mangaka`                                              | Path `id: ObjectId`                                                                      | Không có                                                                                                                                                                                                          |
| `POST /api/series/:id/proposal/upload-cover` | `Mangaka`                                              | Path `id: ObjectId`                                                                      | `multipart/form-data`: file field `cover` (bắt buộc)                                                                                                                                                              |

### Chapter (`/api/chapters`)

| Method + endpoint                              | Quyền                                                               | Parameters                  | Request body                                                                                              |
| ---------------------------------------------- | ------------------------------------------------------------------- | --------------------------- | --------------------------------------------------------------------------------------------------------- |
| `POST /api/chapters/create`                    | `Mangaka`, `Admin`                                                  | -                           | `series_id: ObjectId`, `chapter_number: number`, `title: string`, `deadline: string` (ISO date, bắt buộc) |
| `GET /api/chapters/series/:series_id`          | `Mangaka`, `Assistant`, `Tantou Editor`, `Editorial Board`, `Admin` | Path `series_id: ObjectId`  | -                                                                                                         |
| `GET /api/chapters/:chapter_id`                | Các role đọc chapter                                                | Path `chapter_id: ObjectId` | -                                                                                                         |
| `GET /api/chapters/:chapter_id/progress-stats` | Các role đọc chapter                                                | Path `chapter_id: ObjectId` | -                                                                                                         |
| `PUT /api/chapters/update-status/:chapter_id`  | `Mangaka`, `Tantou Editor`, `Admin`                                 | Path `chapter_id: ObjectId` | `status: Draft\|In Production\|Waiting Review\|Approved\|Published`                                       |
| `DELETE /api/chapters/:chapter_id`             | `Mangaka`, `Admin`                                                  | Path `chapter_id: ObjectId` | -                                                                                                         |
| `PUT /api/chapters/restore/:chapter_id`        | `Mangaka`, `Admin`                                                  | Path `chapter_id: ObjectId` | -                                                                                                         |

### Page và upload (`/api/pages`)

| Method + endpoint                           | Quyền                               | Parameters                  | Request body                                                                                        |
| ------------------------------------------- | ----------------------------------- | --------------------------- | --------------------------------------------------------------------------------------------------- |
| `GET /api/pages/:page_id`                   | Mọi role nghiệp vụ                  | Path `page_id: ObjectId`    | -                                                                                                   |
| `GET /api/pages/chapter/:chapter_id`        | Mọi role nghiệp vụ                  | Path `chapter_id: ObjectId` | -                                                                                                   |
| `POST /api/pages/upload/:chapter_id/upload` | `Mangaka`, `Admin`                  | Path `chapter_id: ObjectId` | `multipart/form-data`: `source_file` bắt buộc, `attached_resource` optional, `page_number: number`  |
| `PUT /api/pages/update/:page_id`            | `Mangaka`, `Assistant`, `Admin`     | Path `page_id: ObjectId`    | `multipart/form-data`: `source_file` bắt buộc, `attached_resource` optional, `commit_note?: string` |
| `PUT /api/pages/approve/:page_id`           | `Mangaka`, `Tantou Editor`, `Admin` | Path `page_id: ObjectId`    | `status: Draft\|In Progress\|Ready For Review\|Submitted\|Approved\|Rejected\|Locked`               |
| `GET /api/pages/:page_id/versions`          | Mọi role nghiệp vụ                  | Path `page_id: ObjectId`    | -                                                                                                   |
| `DELETE /api/pages/:page_id`                | `Mangaka`, `Admin`                  | Path `page_id: ObjectId`    | -                                                                                                   |
| `PUT /api/pages/:page_id/restore`           | `Mangaka`, `Admin`                  | Path `page_id: ObjectId`    | -                                                                                                   |

### Annotation (`/api/annotations`)

| Method + endpoint                          | Quyền                               | Parameters                  | Request body                                                                                                                                                                                                     |
| ------------------------------------------ | ----------------------------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/annotations/page/:page_id`       | Mọi role nghiệp vụ                  | Path `page_id: ObjectId`    | -                                                                                                                                                                                                                |
| `GET /api/annotations/chapter/:chapter_id` | Mọi role nghiệp vụ                  | Path `chapter_id: ObjectId` | -                                                                                                                                                                                                                |
| `POST /api/annotations/page/:page_id`      | `Mangaka`, `Tantou Editor`, `Admin` | Path `page_id: ObjectId`    | `x: number`, `y: number`, `content?: string` hoặc `comment?: string`, `coordinates?: string`, `region_id?: ObjectId`, `status?: Open\|In Progress\|Resolved\|Reopened`, `deadline?: string`, `category?: string` |
| `PATCH /api/annotations/:id`               | `Mangaka`, `Tantou Editor`, `Admin` | Path `id: ObjectId`         | Optional: `content?: string` hoặc `comment?: string`, `status?: string`, `deadline?: string\|null`, `x?: number`, `y?: number`, `category?: string`                                                              |
| `DELETE /api/annotations/:id`              | `Tantou Editor`, `Admin`            | Path `id: ObjectId`         | -                                                                                                                                                                                                                |
| `PATCH /api/annotations/:id/restore`       | `Tantou Editor`, `Admin`            | Path `id: ObjectId`         | -                                                                                                                                                                                                                |

### Region (`/api/regions`)

| Method + endpoint                 | Quyền              | Parameters               | Request body                                                                                            |
| --------------------------------- | ------------------ | ------------------------ | ------------------------------------------------------------------------------------------------------- |
| `GET /api/regions/page/:page_id`  | Mọi role nghiệp vụ | Path `page_id: ObjectId` | -                                                                                                       |
| `POST /api/regions/page/:page_id` | `Mangaka`, `Admin` | Path `page_id: ObjectId` | `coordinates: string`, `region_type: string`; controller cũng chấp nhận `page_id?: ObjectId` trong body |
| `DELETE /api/regions/:id`         | `Mangaka`, `Admin` | Path `id: ObjectId`      | -                                                                                                       |

### Task (`/api/tasks`)

| Method + endpoint             | Quyền                                            | Parameters / query                      | Request body                                                                                                                                                     |
| ----------------------------- | ------------------------------------------------ | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/tasks`              | Mọi role nghiệp vụ                               | `status?: string`, `page_id?: ObjectId` | -                                                                                                                                                                |
| `GET /api/tasks/assistants`   | `Mangaka`, `Admin`                               | -                                       | -                                                                                                                                                                |
| `GET /api/tasks/:id`          | `Assistant`, `Mangaka`, `Admin`                  | Path `id: ObjectId`                     | -                                                                                                                                                                |
| `POST /api/tasks`             | `Mangaka`, `Admin`                               | -                                       | `page_id: ObjectId`, `assigned_to: ObjectId`, `task_type: string`, `deadline: string` bắt buộc; `region_id?: ObjectId`, `description?: string`, `price?: number` |
| `POST /api/tasks/:id/submit`  | `Assistant`, `Admin`                             | Path `id: ObjectId`                     | `multipart/form-data`: `file` bắt buộc, `note?: string`                                                                                                          |
| `POST /api/tasks/:id/review`  | `Mangaka`, `Admin`                               | Path `id: ObjectId`                     | `status: Approved\|Revision Requested\|Rejected`, `note?: string`                                                                                                |
| `PATCH /api/tasks/:id/status` | `Assistant`, `Mangaka`, `Tantou Editor`, `Admin` | Path `id: ObjectId`                     | `status: string`, `note?: string`                                                                                                                                |
| `DELETE /api/tasks/:id`       | `Mangaka`, `Admin`                               | Path `id: ObjectId`                     | -                                                                                                                                                                |

### Board review (`/api/board`)

Tất cả route yêu cầu `Editorial Board` hoặc `Admin`.

| Method + endpoint                     | Parameters          | Request body                                               |
| ------------------------------------- | ------------------- | ---------------------------------------------------------- |
| `GET /api/board/series/pending`       | -                   | -                                                          |
| `GET /api/board/series/:id`           | Path `id: ObjectId` | -                                                          |
| `POST /api/board/series/:id/vote`     | Path `id: ObjectId` | `vote: Approve\|Reject\|Need Revision`, `comment?: string` |
| `POST /api/board/series/:id/finalize` | Path `id: ObjectId` | `approved_schedule?: string`                               |

### Publish và release issue (`/api/publish`, `/api/issues`)

| Method + endpoint                        | Quyền                                       | Parameters                  | Request body                                                                                                                           |
| ---------------------------------------- | ------------------------------------------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /api/publish/chapter/:chapter_id`  | `Tantou Editor`, `Editorial Board`, `Admin` | Path `chapter_id: ObjectId` | `release_issue_id?: ObjectId`                                                                                                          |
| `GET /api/issues`                        | `Editorial Board`, `Admin`                  | -                           | -                                                                                                                                      |
| `POST /api/issues`                       | `Editorial Board`, `Admin`                  | -                           | `id?: string`, `name: string`, `releaseDate: string` (date), `seriesList?: ObjectId[]`, `type: Weekly\|Monthly\|One-shot\|Online only` |
| `POST /api/issues/:issueId/import-votes` | `Editorial Board`, `Admin`                  | Path `issueId: string`      | `multipart/form-data`: file field `file` bắt buộc (CSV/XLSX)                                                                           |

### Ranking (`/api/rankings`)

| Method + endpoint                         | Quyền                                                  | Parameters / query                                          | Request body |
| ----------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------- | ------------ |
| `GET /api/rankings`                       | `Editorial Board`, `Mangaka`, `Tantou Editor`, `Admin` | `issueId?: string`, `genre?: string`, `authorId?: ObjectId` | -            |
| `GET /api/rankings/performance/:seriesId` | Cùng role trên                                         | Path `seriesId: ObjectId`                                   | -            |

### Notification (`/api/notifications`)

Tất cả route yêu cầu user đăng nhập; dữ liệu được giới hạn theo `req.user.id`.

| Method + endpoint                      | Parameters / query                                                                                     | Request body |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------ |
| `GET /api/notifications`               | `page?: number`, `limit?: number`, `type?: System\|Task_Update\|Warning\|Payment`, `is_read?: boolean` | -            |
| `GET /api/notifications/unread-count`  | -                                                                                                      | -            |
| `PUT /api/notifications/mark-all-read` | -                                                                                                      | -            |
| `PUT /api/notifications/:id/read`      | Path `id: ObjectId`                                                                                    | -            |
| `DELETE /api/notifications/:id`        | Path `id: ObjectId`                                                                                    | -            |

### Income (`/api/income`)

| Method + endpoint    | Quyền                | Parameters | Request body |
| -------------------- | -------------------- | ---------- | ------------ |
| `GET /api/income/my` | `Assistant`, `Admin` | -          | -            |

### Admin dashboard (`/api/admin`)

| Method + endpoint                | Quyền   | Parameters | Request body |
| -------------------------------- | ------- | ---------- | ------------ |
| `GET /api/admin/dashboard-stats` | `Admin` | -          | -            |
