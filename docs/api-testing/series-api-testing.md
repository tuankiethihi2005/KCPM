# Series API Testing Guide

Tài liệu này mô tả 17 API hiện có trong folder `Series` và cách kiểm thử bằng Postman.

## 1. Chuẩn bị

### Base URL

```text
{{baseUrl}} = http://localhost:5000
```

### Authentication

Tất cả API trong folder này đều yêu cầu:

```http
Authorization: Bearer {{accessToken}}
```

Collection nên dùng `Bearer Token` ở cấp collection với token `{{accessToken}}`.

### Role cần dùng

| Nhóm API                       | Role                                                   |
| ------------------------------ | ------------------------------------------------------ |
| Tạo/cập nhật series, proposal  | `Mangaka`                                              |
| Danh sách của tôi              | `Mangaka`, `Admin`                                     |
| Series của author bất kỳ       | `Admin`                                                |
| Series được phân công          | `Tantou Editor` hoặc `Assistant`                       |
| Danh sách editor               | `Mangaka`, `Tantou Editor`, `Editorial Board`, `Admin` |
| Series có nguy cơ              | `Editorial Board`, `Admin`                             |
| Cập nhật status/lifecycle vote | `Editorial Board`, `Admin`                             |
| Xem chi tiết                   | `Mangaka`, `Tantou Editor`, `Editorial Board`, `Admin` |

Lưu ý: `POST /api/series` chỉ cho phép `Mangaka`. Dùng token `Admin` sẽ nhận `403`.

## 2. Thứ tự kiểm thử đề xuất

1. Login bằng user có role `Mangaka` và lưu access token.
2. Gọi `POST /api/series` để tạo series.
3. Lưu `_id` trong response vào biến collection `seriesId`.
4. Gọi các API đọc series bằng token phù hợp.
5. Gọi `PUT /api/series/:id/proposal` để tạo proposal.
6. Gọi `POST /api/series/:id/proposal/submit` để gửi proposal duyệt.
7. Đổi sang token `Editorial Board` hoặc `Admin` để kiểm thử vote và status.

Các request GET và DELETE không có request body. Các ID trong ví dụ dưới đây dùng biến `{{seriesId}}` hoặc `{{authorId}}`.

## 3. API chi tiết

### 3.1 Tạo series

```http
POST {{baseUrl}}/api/series
```

**Role:** `Mangaka`

**Body: `raw` / `JSON`**

```json
{
  "title": "Test Manga Series",
  "description": "Series dùng để kiểm thử API",
  "genre": "Action",
  "target_audience": "Teen",
  "summary": "Tóm tắt nội dung series",
  "characters": "Mô tả nhân vật chính",
  "art_style": "Manga monochrome"
}
```

`title` là bắt buộc. Admin có thể truyền thêm `author_id`, nhưng route vẫn yêu cầu role `Mangaka`.

**Postman Tests:**

```javascript
pm.test("Create series returns 201", function () {
  pm.response.to.have.status(201);
});

const jsonData = pm.response.json();
if (jsonData.series && jsonData.series._id) {
  pm.collectionVariables.set("seriesId", jsonData.series._id);
}
```

### 3.2 Lấy series của tôi

```http
GET {{baseUrl}}/api/series/mine
```

**Role:** `Mangaka`, `Admin`

Không có body.

### 3.3 Lấy series theo author

```http
GET {{baseUrl}}/api/series/mine/{{authorId}}
```

**Path variable:** `authorId` là MongoDB `ObjectId`.

**Role:** `Admin`

Không có body.

### 3.4 Lấy series của Tantou Editor

```http
GET {{baseUrl}}/api/series/editor
```

**Role:** `Tantou Editor`

Không có body.

### 3.5 Lấy toàn bộ series

```http
GET {{baseUrl}}/api/series/all
```

**Role:** Mọi role đã đăng nhập.

Không có body.

### 3.6 Lấy series của Assistant

```http
GET {{baseUrl}}/api/series/assistant
```

**Role:** `Assistant`

Không có body.

### 3.7 Lấy danh sách editor

```http
GET {{baseUrl}}/api/series/editors
```

**Role:** `Mangaka`, `Tantou Editor`, `Editorial Board`, `Admin`

Không có body.

### 3.8 Lấy series có nguy cơ

```http
GET {{baseUrl}}/api/series/at-risk
```

**Role:** `Editorial Board`, `Admin`

Không có body.

### 3.9 Lấy tiến độ series

```http
GET {{baseUrl}}/api/series/progress?page=1&limit=10&search=&filter=attention&sort=attention
```

**Role:** `Mangaka`, `Assistant`, `Tantou Editor`, `Editorial Board`, `Admin`

Query parameters:

| Parameter | Kiểu   | Mặc định          |
| --------- | ------ | ----------------- |
| `page`    | number | `1`               |
| `limit`   | number | `10`, tối đa `50` |
| `search`  | string | rỗng              |
| `filter`  | string | `attention`       |
| `sort`    | string | `attention`       |

Không có body.

### 3.10 Lấy chi tiết series

```http
GET {{baseUrl}}/api/series/{{seriesId}}
```

**Role:** `Mangaka`, `Tantou Editor`, `Editorial Board`, `Admin`

Không có body. Ngoài role, endpoint còn kiểm tra user có quyền đọc series hay không.

### 3.11 Cập nhật series

```http
PUT {{baseUrl}}/api/series/{{seriesId}}
```

**Role:** `Mangaka`

**Body: `raw` / `JSON`**

```json
{
  "title": "Test Manga Series Updated",
  "description": "Mô tả mới",
  "genre": "Action, Drama",
  "target_audience": "Young Adult",
  "editor_id": null
}
```

Các field được hỗ trợ: `title`, `description`, `genre`, `target_audience`, `editor_id`.

Series chỉ sửa được khi proposal mới nhất chưa qua trạng thái duyệt, thường là `Draft` hoặc `Need Revision`.

### 3.12 Cập nhật status series

```http
PATCH {{baseUrl}}/api/series/{{seriesId}}/status
```

**Role:** `Editorial Board`, `Admin`

**Body: `raw` / `JSON`**

```json
{
  "status": "Active",
  "approved_schedule": "weekly",
  "risk_status": "Safe"
}
```

Giá trị hợp lệ:

- `status`: `Active`, `At Risk`, `Hiatus`, `Cancelled`, `Completed`, `Changed Schedule`
- `approved_schedule`: `weekly`, `monthly`, `one-shot`, `online only`, `none`
- `risk_status`: `Safe`, `Warning`, `Critical`

`status` là bắt buộc.

### 3.13 Xem lifecycle votes

```http
GET {{baseUrl}}/api/series/{{seriesId}}/lifecycle-votes
```

**Role:** `Editorial Board`, `Admin`

Không có body.

### 3.14 Bỏ phiếu lifecycle

```http
POST {{baseUrl}}/api/series/{{seriesId}}/lifecycle-vote
```

**Role:** `Editorial Board`, `Admin`

**Body: `raw` / `JSON`**

```json
{
  "vote": "Continue",
  "comment": "Series đang có tiến độ tốt, tiếp tục phát hành."
}
```

Giá trị `vote` hợp lệ:

```text
Continue
Cancel
Hiatus
Change Schedule
Online Only
Need Improvement Plan
```

### 3.15 Tạo hoặc cập nhật proposal

```http
PUT {{baseUrl}}/api/series/{{seriesId}}/proposal
```

**Role:** `Mangaka`

**Body: `raw` / `JSON`**

```json
{
  "summary": "Tóm tắt đầy đủ nội dung của series",
  "characters": "Mô tả các nhân vật chính",
  "art_style": "Phong cách vẽ manga đen trắng"
}
```

`summary` là bắt buộc. Endpoint này dùng để tạo mới hoặc cập nhật proposal hiện tại.

### 3.16 Submit proposal

```http
POST {{baseUrl}}/api/series/{{seriesId}}/proposal/submit
```

**Role:** `Mangaka`

Không có body.

Proposal phải tồn tại và đang ở trạng thái `Draft` hoặc `Need Revision`.

### 3.17 Upload cover proposal

```http
POST {{baseUrl}}/api/series/{{seriesId}}/proposal/upload-cover
```

**Role:** `Mangaka`

Chọn **Body → form-data**:

| Key     | Type | Giá trị             |
| ------- | ---- | ------------------- |
| `cover` | File | Chọn file ảnh cover |

Không tự thêm `Content-Type: application/json`; Postman sẽ tự tạo multipart boundary.

## 4. Kiểm thử lỗi cần thực hiện

| Tình huống                        | Kết quả mong đợi                                   |
| --------------------------------- | -------------------------------------------------- |
| Không gửi Bearer token            | `401 AUTH_TOKEN_MISSING`                           |
| Token hết hạn hoặc sai            | `401 AUTH_TOKEN_INVALID` hoặc `AUTH_TOKEN_EXPIRED` |
| Dùng Admin gọi `POST /api/series` | `403 Forbidden` vì route yêu cầu `Mangaka`         |
| Gửi proposal thiếu `summary`      | `400`                                              |
| Submit khi chưa có proposal       | `400`                                              |
| Gửi status ngoài enum             | `400`                                              |
| Dùng ID không tồn tại             | Thường `404`                                       |
| User không có scope với series    | `403`                                              |

## 5. Các lỗi thường gặp trong Postman

- Dùng `/api/series/:id/progress`: endpoint đúng là `/api/series/progress`.
- Dùng `/api/series/:id/editors`: endpoint đúng là `/api/series/editors`.
- Dùng `/api/series/:id/proposals`: endpoint đúng là `/api/series/:id/proposal` và method là `PUT`.
- Dùng `/api/series/:id/cover`: endpoint đúng là `/api/series/:id/proposal/upload-cover`.
- Dùng token Admin để tạo series: cần đăng nhập bằng user role `Mangaka`.
- Quên điền `seriesId` sau khi tạo series: các API có `{{seriesId}}` sẽ không chạy đúng.
- Upload cover nhưng dùng `raw JSON`: phải dùng `form-data` với field `cover` kiểu File.
