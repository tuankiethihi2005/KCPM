# Workspace & Region/Annotation Module - Quản Lý Vùng & Chú Thích Specification

## I. TỔNG QUAN CHỨC NĂNG
Quản lý các vùng không gian trên trang (`pageregions`), các chú thích/đóng góp ý kiến (`annotations`) và tương tác workspace phục vụ quá trình kiểm duyệt bản thảo.

---

## II. ENDPOINT API
* **Endpoints:**
  * Quản lý các thao tác liên quan đến `pageregions` (Region ID: `6a4daf11e0b2e82b0f5d5b00`)
  * Quản lý các thao tác Annotation/Workspace trong phân hệ chapter và trang truyện.
* **Quyền truy cập:** Mangaka / Assistant / Editor / Admin

---

## III. REQUEST & RESPONSE SPECIFICATION

### 1. Request Format (Ví dụ tạo/cập nhật Region)
* **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`
* **Body (JSON):**
```json
{
  "page_id": "6ae31e2266108f9ccacf654",
  "coordinates": { "x": 100, "y": 200, "width": 300, "height": 400 },
  "label": "Khu vực khung thoại chính"
}
```

### 2. Response Format (`200 OK` / `201 Created`)
```json
{
  "success": true,
  "message": "Thao tác region/annotation thành công",
  "data": {
    "region_id": "6a4daf11e0b2e82b0f5d5b00",
    "created_at": "2026-11-04T14:30:00Z"
  }
}
```

---

## IV. VALIDATION RULES & ERROR HANDLING
| Mã Lỗi (HTTP) | Nguyên nhân phát sinh | Cấu trúc Response lỗi |
| :--- | :--- | :--- |
| **`400 Bad Request`** | Tọa độ (`coordinates`) hoặc nội dung chú thích không hợp lệ/để trống. | `{"success": false, "error": "Dữ liệu tọa độ vùng hoặc nội dung không hợp lệ."}` |
| **`404 Not Found`** | Không tìm thấy Region ID hoặc Page ID liên quan. | `{"success": false, "error": "Không tìm thấy đối tượng region hoặc page."}` |

---

## V. SƠ ĐỒ CHUYỂN ĐỔI TRẠNG THÁI (STATE TRANSITION DIAGRAM)
```
[ST1: IDLE]
    │
    ├── (Gửi Request Thao tác Region / Annotation)
    ▼
[ST2: VALIDATING PAYLOAD & COORDINATES]
    │
    ├── (Dữ liệu tọa độ/nội dung thiếu hoặc sai định dạng) ──► [ST_ERR: 400 Bad Request]
    │
    └── (Hợp lệ)
        ▼
[ST3: CHECKING ENTITY EXISTENCE]
    │
    ├── (Page ID / Region ID không tồn tại trong CSDL) ──────► [ST_ERR: 404 Not Found]
    │
    └── (Tồn tại đầy đủ)
        ▼
[ST4: SAVING TO DATABASE]
    │
    └── (Lưu thành công) ──────────────────────────────────────► [ST_SUCCESS: 200 OK / 201 Created]
```

---

## VI. BẢNG QUYẾT ĐỊNH KIỂM THỬ (DECISION TABLE)
| Điều kiện (Conditions) | R1 | R2 | R3 | R4 |
| :--- | :---: | :---: | :---: | :---: |
| **Payload dữ liệu/tọa độ hợp lệ?** | F | T | T | T |
| **Page / Region ID tồn tại trong CSDL?** | - | F | T | T |
| **User có quyền tác động workspace?** | - | - | F | T |
| **Hành động (Actions)** | | | | |
| Trả về `400 Bad Request` | **X** | | | |
| Trả về `404 Not Found` | | **X** | | |
| Trả về `403 Forbidden` | | | **X** | |
| Xử lý thành công & Trả về `200/201` | | | | **X** |