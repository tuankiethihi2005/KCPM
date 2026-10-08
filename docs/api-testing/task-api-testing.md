# Task API Testing Guide

Tài liệu hướng dẫn kiểm thử 8 API trong folder `Tasks` bằng Postman.

## 1. Danh sách API

| Method   | Endpoint                | Role                                                      |
| -------- | ----------------------- | --------------------------------------------------------- |
| `GET`    | `/api/tasks`            | Assistant, Mangaka, Tantou Editor, Editorial Board, Admin |
| `GET`    | `/api/tasks/assistants` | Mangaka, Admin                                            |
| `GET`    | `/api/tasks/:id`        | Assistant, Mangaka, Admin                                 |
| `POST`   | `/api/tasks`            | Mangaka, Admin                                            |
| `POST`   | `/api/tasks/:id/submit` | Assistant, Admin                                          |
| `POST`   | `/api/tasks/:id/review` | Mangaka, Admin                                            |
| `PATCH`  | `/api/tasks/:id/status` | Assistant, Mangaka, Tantou Editor, Admin                  |
| `DELETE` | `/api/tasks/:id`        | Mangaka, Admin                                            |

Base URL:

```text
{{baseUrl}} = http://localhost:5000
```

Tất cả request cần:

```http
Authorization: Bearer {{accessToken}}
```

Biến Postman nên có:

```text
pageId
regionId
assistantId
taskId
accessToken
```

## 2. Thứ tự kiểm thử

1. Login và lưu `accessToken`.
2. Gọi `GET /api/tasks/assistants` để lấy `assistantId`.
3. Tạo task bằng `POST /api/tasks`.
4. Lưu `_id` task vào `taskId`.
5. Dùng tài khoản Assistant được giao task để submit file.
6. Dùng Mangaka đã tạo task để review.
7. Kiểm thử cập nhật status và xóa task.

## 3. API chi tiết

### 3.1 Lấy danh sách task

```http
GET {{baseUrl}}/api/tasks?status=Assigned&page_id={{pageId}}
```

Query parameters optional:

```text
status
page_id
```

Không có body.

Assistant chỉ thấy task được giao cho mình; Mangaka chỉ thấy task do mình tạo.

### 3.2 Lấy danh sách Assistant

```http
GET {{baseUrl}}/api/tasks/assistants
```

Không có body.

Response mẫu:

```json
{
  "success": true,
  "assistants": [
    {
      "_id": "ASSISTANT_OBJECT_ID",
      "name": "Test Assistant",
      "email": "assistant@example.com"
    }
  ]
}
```

### 3.3 Lấy chi tiết task

```http
GET {{baseUrl}}/api/tasks/{{taskId}}
```

Không có body.

Response gồm task và các submission:

```json
{
  "success": true,
  "task": {},
  "submissions": []
}
```

### 3.4 Tạo task

```http
POST {{baseUrl}}/api/tasks
```

Body `raw` / `JSON`:

```json
{
  "page_id": "PAGE_OBJECT_ID",
  "region_id": "REGION_OBJECT_ID",
  "assigned_to": "ASSISTANT_OBJECT_ID",
  "task_type": "Clean up page",
  "description": "Xử lý và làm sạch trang truyện",
  "deadline": "2026-10-30",
  "price": 100
}
```

Field bắt buộc:

```text
page_id
assigned_to
task_type
deadline
```

Field optional:

```text
region_id
description
price
```

Nếu không gửi `region_id`, backend tự tạo region mặc định. Task mới có status `Assigned`.

Postman Tests:

```javascript
pm.test("Create task returns 201", function () {
  pm.response.to.have.status(201);
});

const jsonData = pm.response.json();
if (jsonData.task && jsonData.task._id) {
  pm.collectionVariables.set("taskId", jsonData.task._id);
}
```

### 3.5 Assistant submit task

```http
POST {{baseUrl}}/api/tasks/{{taskId}}/submit
```

Chọn **Body → form-data**:

| Key    | Type | Bắt buộc |
| ------ | ---- | -------- |
| `file` | File | Có       |
| `note` | Text | Không    |

Không dùng `raw JSON` cho request này.

Task chỉ submit được khi status hiện tại là:

```text
Assigned
In Progress
Revision Requested
Rejected
```

Sau khi submit, task chuyển thành `Submitted`.

Controller vẫn kiểm tra task có được giao cho user hiện tại hay không. Admin không chắc chắn submit được task của Assistant khác dù route cho phép role Admin.

### 3.6 Review task

```http
POST {{baseUrl}}/api/tasks/{{taskId}}/review
```

Body duyệt:

```json
{
  "status": "Approved",
  "note": "Đã kiểm tra và duyệt thành phẩm"
}
```

Body yêu cầu chỉnh sửa:

```json
{
  "status": "Revision Requested",
  "note": "Cần chỉnh sửa lại phần background"
}
```

Body từ chối:

```json
{
  "status": "Rejected",
  "note": "File chưa đạt yêu cầu"
}
```

Giá trị `status` hợp lệ:

```text
Approved
Revision Requested
Rejected
```

### 3.7 Cập nhật status task

```http
PATCH {{baseUrl}}/api/tasks/{{taskId}}/status
```

Body:

```json
{
  "status": "In Progress",
  "note": "Assistant bắt đầu xử lý task"
}
```

Giá trị hợp lệ:

```text
Assigned
In Progress
Submitted
Approved
Revision Requested
Rejected
Paid
```

Assistant chỉ được chuyển task của mình sang `In Progress`. Mangaka chỉ được cập nhật task do mình tạo; Admin được cập nhật task.

### 3.8 Xóa task

```http
DELETE {{baseUrl}}/api/tasks/{{taskId}}
```

Không có body.

Mangaka chỉ xóa được task do mình tạo. Admin có thể xóa task khác.

## 4. Case lỗi cần kiểm thử

| Tình huống                                     | Kết quả mong đợi         |
| ---------------------------------------------- | ------------------------ |
| Không có Bearer token                          | `401 AUTH_TOKEN_MISSING` |
| Token sai/hết hạn                              | `401`                    |
| Role không được phép                           | `403`                    |
| Thiếu field khi tạo task                       | `400`                    |
| Page không tồn tại                             | `404`                    |
| Region không tồn tại                           | `404`                    |
| Task không tồn tại                             | `404`                    |
| Assistant submit task không được giao cho mình | `403`                    |
| Submit không có file                           | `400`                    |
| Review status không hợp lệ                     | `400`                    |
| Update status không hợp lệ                     | `400`                    |
| Mangaka xóa task của người khác                | `403`                    |

## 5. Postman Tests mẫu

### Get tasks

```javascript
pm.test("Get tasks returns 200", function () {
  pm.response.to.have.status(200);
});

const jsonData = pm.response.json();
pm.expect(jsonData.tasks).to.be.an("array");
```

### Review task

```javascript
pm.test("Review task returns 200", function () {
  pm.response.to.have.status(200);
});

const jsonData = pm.response.json();
pm.expect(jsonData.task.status).to.be.oneOf([
  "Approved",
  "Revision Requested",
  "Rejected",
]);
```

## 6. Lưu ý thường gặp

- `{{taskId}}`, `{{pageId}}` và `{{assistantId}}` phải chứa ObjectId thật.
- Submit task phải dùng `form-data` với field `file` kiểu File.
- Không dùng status `Completed`; status này không tồn tại trong Task model.
- Tạo task cần token `Mangaka` hoặc `Admin`.
- Review cần token Mangaka tạo task hoặc Admin.
- Phải tạo task trước khi gọi submit, review, update status hoặc delete.
