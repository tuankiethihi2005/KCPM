# Chapter Module - Quản Lý Chapter Specification

## I. TỔNG QUAN CHỨC NĂNG
Quản lý việc tạo mới, lấy danh sách chapter theo series và xem chi tiết chapter trong hệ thống KCPM.

---

## II. ENDPOINT API
* **Endpoints:** 
  * `POST /api/chapters` (Tạo chapter)
  * `GET /api/chapters/series/:series_id` (Lấy danh sách chapter theo series)
  * `GET /api/chapters/:chapter_id` (Lấy chi tiết chapter)
* **Quyền truy cập:** Mangaka / Editor / Admin

---

## III. REQUEST & RESPONSE SPECIFICATION

### 1. Request Format (Tạo Chapter)
* **Headers:** 
  * `Authorization: Bearer <token>`
  * `Content-Type: application/json`
* **Body (JSON):**
```json
{
  "series_id": "6a26f54d7049841d96ecc522",
  "chapter_number": 1,
  "title": "Khởi đầu hành trình"
}
```

### 2. Response Format (Thành công - `201 Created` / `200 OK`)
```json
{
  "success": true,
  "message": "Thao tác chapter thành công",
  "data": {
    "chapter_id": "6a3424495bed29d138ba84ab",
    "series_id": "6a26f54d7049841d96ecc522",
    "chapter_number": 1,
    "title": "Khởi đầu hành trình",
    "status": "In Production"
  }
}
```

---

## IV. VALIDATION RULES & ERROR HANDLING
| Mã Lỗi (HTTP) | Nguyên nhân phát sinh | Cấu trúc Response lỗi |
| :--- | :--- | :--- |
| **`400 Bad Request`** | Thiếu `series_id`, `chapter_number` hoặc định dạng dữ liệu không hợp lệ. | `{"success": false, "error": "Thiếu thông tin bắt buộc hoặc sai định dạng."}` |
| **`404 Not Found`** | Không tìm thấy Series hoặc Chapter tương ứng. | `{"success": false, "error": "Không tìm thấy dữ liệu chapter hoặc series."}` |
| **`409 Conflict`** | Số thứ tự chapter (`chapter_number`) đã tồn tại trong cùng một Series. | `{"success": false, "error": "Số thứ tự chapter đã tồn tại trong series này."}` |

---

## V. SƠ ĐỒ CHUYỂN ĐỔI TRẠNG THÁI (STATE TRANSITION DIAGRAM)
```
[ST1: IDLE]
    │
    ├── (Gửi request Tạo/Lấy Chapter)
    ▼
[ST2: VALIDATING PARAMETERS]
    │
    ├── (Thiếu dữ liệu / Sai định dạng) ──────────────────────► [ST_ERR: 400 Bad Request]
    ├── (Trùng số thứ tự chapter trong series) ───────────────► [ST_ERR: 409 Conflict]
    ├── (Không tìm thấy ID trong CSDL) ─────────────────────────► [ST_ERR: 404 Not Found]
    │
    └── (Hợp lệ)
        ▼
[ST3: DATABASE TRANSACTION]
    │
    └── (Thực thi thành công) ─────────────────────────────────► [ST_SUCCESS: 200 OK / 201 Created]
```

---

## VI. BẢNG QUYẾT ĐỊNH KIỂM THỬ (DECISION TABLE)
| Điều kiện (Conditions) | R1 | R2 | R3 | R4 |
| :--- | :---: | :---: | :---: | :---: |
| **Dữ liệu đầu vào đầy đủ và hợp lệ?** | F | T | T | T |
| **`chapter_number` không bị trùng trong Series?** | - | F | T | T |
| **Chapter/Series tồn tại trong CSDL (khi GET/UPDATE)?** | - | - | F | T |
| **Hành động (Actions)** | | | | |
| Trả về `400 Bad Request` | **X** | | | |
| Trả về `409 Conflict` (Duplicate Chapter Number) | | **X** | | |
| Trả về `404 Not Found` | | | **X** | |
| Xử lý thành công & Trả về `200/201` | | | | **X** |