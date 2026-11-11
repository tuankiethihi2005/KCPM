# Pages Module - Quản Lý Version, Xóa & Khôi Phục Trang Specification

## I. TỔNG QUAN CHỨC NĂNG
Quản lý các thao tác vòng đời của trang truyện: cập nhật phiên bản mới (`update version`), xem lịch sử các phiên bản (`versions`), xóa (`delete`) và khôi phục (`restore`) trang truyện.

---

## II. ENDPOINT API
* **Endpoints:**
  * `PUT /api/pages/update/:page_id` (Cập nhật version trang)
  * `GET /api/pages/:page_id/versions` (Xem danh sách các version)
  * `DELETE /api/pages/:page_id` (Xóa trang)
  * `PUT /api/pages/:page_id/restore` (Khôi phục trang đã xóa)
* **Quyền truy cập:** Mangaka / Assistant / Admin / Editor

---

## III. REQUEST & RESPONSE SPECIFICATION

### 1. Request Format (Cập nhật Version - Form-data)
* **Headers:** `Authorization: Bearer <token>`
* **Body:** `source_file` (File bản thảo mới bắt buộc), `attached_resource` (File tùy chọn).

### 2. Response Format (Thành công - `200 OK`)
```json
{
  "success": true,
  "message": "Cập nhật phiên bản trang thành công",
  "data": {
    "page_id": "6ae31e2266108f9ccacf654",
    "version": 2,
    "updated_at": "2026-11-04T14:00:00Z"
  }
}
```

---

## IV. VALIDATION RULES & ERROR HANDLING
| Mã Lỗi (HTTP) | Nguyên nhân phát sinh | Cấu trúc Response lỗi |
| :--- | :--- | :--- |
| **`400 Bad Request`** | Thiếu file bản thảo mới hoặc định dạng file không được hỗ trợ. | `{"success": false, "error": "Thiếu file bản thảo hoặc sai định dạng file."}` |
| **`403 Forbidden`** | Người dùng không có quyền (Scope) thực hiện thao tác trên trang này. | `{"success": false, "error": "Không có quyền thực hiện thao tác trên page này."}` |
| **`404 Not Found`** | Không tìm thấy `page_id` trong hệ thống. | `{"success": false, "error": "Không tìm thấy trang truyện."}` |

---

## V. SƠ ĐỒ CHUYỂN ĐỔI TRẠNG THÁI (STATE TRANSITION DIAGRAM)
```
[ST1: IDLE]
    │
    ├── (Gửi Request Update/Delete/Restore Page)
    ▼
[ST2: CHECKING PERMISSION & SCOPE]
    │
    ├── (Không có quyền / Vi phạm Scope) ──────────────────────► [ST_ERR: 403 Forbidden]
    │
    └── (Hợp lệ quyền)
        ▼
[ST3: VALIDATING RESOURCE & TARGET]
    │
    ├── (Page ID không tồn tại) ────────────────────────────────► [ST_ERR: 404 Not Found]
    ├── (Thiếu file bản thảo khi update) ─────────────────────► [ST_ERR: 400 Bad Request]
    │
    └── (Thỏa mãn tất cả điều kiện)
        ▼
[ST4: EXECUTING DATABASE OPERATION]
    │
    └── (Thực thi thành công) ─────────────────────────────────► [ST_SUCCESS: 200 OK]
```

---

## VI. BẢNG QUYẾT ĐỊNH KIỂM THỬ (DECISION TABLE)
| Điều kiện (Conditions) | R1 | R2 | R3 | R4 | R5 |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **User có quyền/Scope hợp lệ?** | F | T | T | T | T |
| **`page_id` tồn tại trong CSDL?** | - | F | T | T | T |
| **Đầu vào request hợp lệ (file/data)?** | - | - | F | T | T |
| **Hành động (Actions)** | | | | | |
| Trả về `403 Forbidden` | **X** | | | | |
| Trả về `404 Not Found` | | **X** | | | |
| Trả về `400 Bad Request` | | | **X** | | |
| Thực thi thao tác & Trả về `200 OK` | | | | | **X** |