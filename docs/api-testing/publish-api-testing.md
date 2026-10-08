pub# Publish API Testing Guide

Tài liệu này mô tả các API liên quan đến việc xuất bản chapter và quản lý release issue trong KCPM.

## 1. Phạm vi API

| STT | Method | Endpoint                            | Chức năng                       |
| --: | ------ | ----------------------------------- | ------------------------------- |
|   1 | `POST` | `/api/publish/chapter/:chapter_id`  | Xuất bản chapter                |
|   2 | `GET`  | `/api/issues`                       | Lấy danh sách release issue     |
|   3 | `POST` | `/api/issues`                       | Tạo release issue               |
|   4 | `POST` | `/api/issues/:issueId/import-votes` | Import dữ liệu vote từ CSV/XLSX |

Tất cả API đều yêu cầu:

```http
Authorization: Bearer {{accessToken}}
```

Base URL:

```text
{{baseUrl}} = http://localhost:5000
```

## 2. Quyền truy cập

| API                | Role                                        |
| ------------------ | ------------------------------------------- |
| Publish chapter    | `Tantou Editor`, `Editorial Board`, `Admin` |
| Lấy release issues | `Editorial Board`, `Admin`                  |
| Tạo release issue  | `Editorial Board`, `Admin`                  |
| Import vote data   | `Editorial Board`, `Admin`                  |

Publish chapter ngoài kiểm tra role còn kiểm tra scope ghi trên chapter.

## 3. Lưu ý về ID

Có hai loại ID cần phân biệt:

- `release_issue_id`: MongoDB `_id` của release issue. Dùng trong body publish chapter.
- `issueId`: `custom_id` của release issue, ví dụ `ISSUE-2026-001`. Dùng trên URL import vote.

Không dùng `custom_id` làm `release_issue_id` trong request publish chapter.

## 4. Thứ tự kiểm thử đề xuất

1. Login và lưu `accessToken`.
2. Tạo release issue hoặc lấy issue hiện có.
3. Lấy `_id` MongoDB của issue từ `GET /api/issues`.
4. Đảm bảo chapter đã có page.
5. Đảm bảo mọi page trong chapter có status `Approved`.
6. Đảm bảo mọi task của các page có status `Approved` hoặc `Paid`.
7. Đảm bảo mọi annotation của các page có status `Resolved`.
8. Gọi publish chapter với `release_issue_id` là `_id` MongoDB.

## 5. API chi tiết

### 5.1 Lấy danh sách release issue

```http
GET {{baseUrl}}/api/issues
```

**Role:** `Editorial Board`, `Admin`

Không có body.

**Response mẫu:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "RELEASE_ISSUE_OBJECT_ID",
      "custom_id": "ISSUE-2026-001",
      "title": "Weekly Manga Issue 001",
      "release_date": "2026-10-20T00:00:00.000Z",
      "type": "Weekly",
      "series_list": [],
      "status": "Planned"
    }
  ]
}
```

Lưu giá trị `_id` vào biến Postman `releaseIssueId` và giá trị `custom_id` vào `issueId` nếu cần import vote.

### 5.2 Tạo release issue

```http
POST {{baseUrl}}/api/issues
```

**Role:** `Editorial Board`, `Admin`

**Header:**

```http
Content-Type: application/json
```

**Body: `raw` / `JSON`**

```json
{
  "id": "ISSUE-2026-001",
  "name": "Weekly Manga Issue 001",
  "releaseDate": "2026-10-20",
  "seriesList": ["SERIES_OBJECT_ID"],
  "type": "Weekly"
}
```

Field:

- `id`: mã issue tùy chỉnh, phải duy nhất.
- `name`: tên issue, phải duy nhất.
- `releaseDate`: ngày phát hành hợp lệ.
- `seriesList`: mảng ID hoặc mã series có thể resolve được.
- `type`: `Weekly`, `Monthly`, `One-shot`, `Online only`.

**Postman Tests:**

```javascript
pm.test("Create release issue returns 201", function () {
  pm.response.to.have.status(201);
});

const jsonData = pm.response.json();
if (jsonData.data && jsonData.data.id) {
  pm.collectionVariables.set("issueId", jsonData.data.id);
}
```

Lưu ý: response tạo issue chỉ trả custom `id`, không trả MongoDB `_id`. Sau khi tạo, gọi `GET /api/issues` để lấy `_id` dùng cho publish chapter.

### 5.3 Import vote data

```http
POST {{baseUrl}}/api/issues/{{issueId}}/import-votes
```

Ví dụ:

```http
POST {{baseUrl}}/api/issues/ISSUE-2026-001/import-votes
```

**Role:** `Editorial Board`, `Admin`

Chọn **Body → form-data**:

| Key    | Type | Giá trị                         |
| ------ | ---- | ------------------------------- |
| `file` | File | CSV hoặc XLSX chứa dữ liệu vote |

File phải có các cột bắt buộc:

```text
seriesId,votes,avgScore
```

Ví dụ CSV:

```csv
seriesId,votes,avgScore
SERIES-001,120,8.5
SERIES-002,95,7.8
```

`seriesId` phải trỏ đến series hợp lệ trong hệ thống hoặc mã/tên mà `RankingService` có thể resolve.

Không tự thêm `Content-Type: application/json`; Postman sẽ tự tạo multipart boundary.

### 5.4 Publish chapter

```http
POST {{baseUrl}}/api/publish/chapter/{{chapterId}}
```

**Role:** `Tantou Editor`, `Editorial Board`, `Admin`

**Body: `raw` / `JSON`**

```json
{
  "release_issue_id": "RELEASE_ISSUE_OBJECT_ID"
}
```

`release_issue_id` là optional. Nếu không gắn chapter vào release issue, có thể gửi:

```json
{}
```

Khi publish thành công, chapter được cập nhật:

```text
status = Published
published_at = current date/time
release_issue_id = giá trị được gửi nếu có
```

## 6. Điều kiện để publish thành công

Backend sẽ từ chối publish với `400` nếu:

- Chapter không tồn tại.
- Chapter chưa có page nào.
- Có page chưa có status `Approved`.
- Có task liên quan chưa ở status `Approved` hoặc `Paid`.
- Có annotation liên quan chưa ở status `Resolved`.

Publish không tự động approve page, complete task hoặc resolve annotation. Các bước đó phải hoàn tất trước.

## 7. Kiểm thử lỗi

| Tình huống                                     | Kết quả mong đợi                          |
| ---------------------------------------------- | ----------------------------------------- |
| Không có Bearer token                          | `401 AUTH_TOKEN_MISSING`                  |
| Role không được phép                           | `403 Forbidden`                           |
| Chapter không tồn tại                          | `404`                                     |
| Chapter chưa có page                           | `400`                                     |
| Page chưa approved                             | `400` và có `unapprovedPages_count`       |
| Task chưa hoàn thành                           | `400` và có `unfinishedTasks_count`       |
| Annotation chưa resolved                       | `400` và có `unresolvedAnnotations_count` |
| Không upload file import vote                  | `400`                                     |
| Issue không tồn tại khi import                 | `404`                                     |
| File thiếu `seriesId`, `votes` hoặc `avgScore` | `400`                                     |
| Release issue bị trùng mã/tên                  | `400`                                     |

## 8. Postman Tests mẫu

### Publish thành công

```javascript
pm.test("Publish chapter returns 200", function () {
  pm.response.to.have.status(200);
});

const jsonData = pm.response.json();
pm.expect(jsonData.chapter.status).to.eql("Published");
```

### Import vote thành công

```javascript
pm.test("Import votes returns success", function () {
  pm.expect(pm.response.code).to.be.oneOf([200, 201]);
});
```

## 9. Các lỗi thường gặp trong Postman

- Dùng `issueId` dạng `ISSUE-2026-001` làm `release_issue_id`; phải dùng MongoDB `_id`.
- Gửi file import bằng `raw JSON`; phải dùng `form-data` với field `file` kiểu File.
- Publish khi page chưa `Approved`.
- Publish khi task còn `Assigned`, `In Progress`, `Submitted`, `Rejected` hoặc `Revision Requested`.
- Publish khi annotation còn `Open`, `In Progress` hoặc `Reopened`.
- Dùng token `Mangaka` để publish; role này không được route publish cho phép.
