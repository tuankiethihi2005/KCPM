# Pages Module - Upload Trang Truyện Specification (SCRUM-81)

## I. TỔNG QUAN CHỨC NĂNG
Tải lên file ảnh bản thảo của các trang truyện (pages) thuộc từng chapter trong dự án KCPM. Chức năng đảm bảo xử lý file an toàn, kiểm tra định dạng và ngăn chặn sự cố crash server.

---

## II. ENDPOINT API

* **Endpoint:** `/api/pages/upload`
* **Method:** `POST`
* **Quyền truy cập:** Mangaka / Editor / Admin

---

## III. REQUEST & RESPONSE SPECIFICATION

### 1. Request Format
* **Headers:** 
  * `Authorization: Bearer <token>`
  * `Content-Type: multipart/form-data`
* **Body (Form-data):**
  * `chapter_id` (String - Required): ID của Chapter.
  * `page_number` (Integer - Required): Thứ tự trang truyện.
  * `source_file` (File - Required): File ảnh bản thảo trang truyện.

### 2. Response Format

* **Thành công (`201 Created`):**
```json
{
  "success": true,
  "message": "Upload file trang truyện thành công",
  "data": {
    "page_id": "page_1029",
    "chapter_id": "chap_401",
    "page_number": 3,
    "image_url": "https://cdn.kcpm.com/uploads/chap_401/page_3.png",
    "created_at": "2026-11-04T12:00:00Z"
  }
}
```

---

## IV. VALIDATION RULES & ERROR HANDLING

| Mã Lỗi (HTTP) | Nguyên nhân phát sinh | Cấu trúc Response lỗi |
| :--- | :--- | :--- |
| **`400 Bad Request`** | Thiếu `source_file`, định dạng file không thuộc `.jpg`, `.png`, `.webp`, hoặc dung lượng file $> 10MB$. | `{"success": false, "error": "File không hợp lệ hoặc dung lượng vượt quá 10MB"}` |
| **`401 Unauthorized`** | Token thiếu hoặc sai | `{"success": false, "error": "Unauthorized Access"}` |
| **`500 Internal Error`** | *(Đã fix ở SCRUM-81)* Lỗi văng crash server trong quá trình ghi file hoặc gián đoạn transaction session với CDN/storage. | `{"success": false, "error": "Internal Server Error: Không thể xử lý file tải lên"}` |

---

## V. SƠ ĐỒ CHUYỂN ĐỔI TRẠNG THÁI (STATE TRANSITION DIAGRAM)

```
[ST1: IDLE]
    │
    ├── (Gửi POST Request + Bearer Token)
    ▼
[ST2: VALIDATING INPUT]
    │
    ├── (Token không hợp lệ) ───────────────────────────────────► [ST_ERR: 401 Unauthorized]
    ├── (File thiếu / Sai định dạng / Dung lượng > 10MB) ───────► [ST_ERR: 400 Bad Request]
    │
    └── (Đầu vào hợp lệ)
        ▼
[ST3: PROCESSING & UPLOADING FILE]
    │
    ├── (Lỗi ghi file / Mất kết nối Cloud Storage - Fix SCRUM-81)► [ST_ERR: 500 Internal Error]
    │
    └── (Ghi file thành công)
        ▼
[ST4: SAVING TO DATABASE]
    │
    └── (Tạo bản ghi thành công) ───────────────────────────────► [ST_SUCCESS: 201 Created]
```

---

## VI. BẢNG QUYẾT ĐỊNH KIỂM THỬ (DECISION TABLE)

| Điều kiện (Conditions) | R1 | R2 | R3 | R4 | R5 |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Gửi kèm Bearer Token hợp lệ?** | F | T | T | T | T |
| **Có đính kèm `source_file`?** | - | F | T | T | T |
| **Định dạng file hợp lệ (.jpg, .png, .webp)?** | - | - | F | T | T |
| **Dung lượng file $\le$ 10MB?** | - | - | - | F | T |
| **Hành động (Actions)** | | | | | |
| Trả về `401 Unauthorized` | **X** | | | | |
| Trả về `400 Bad Request` (Missing File) | | **X** | | | |
| Trả về `400 Bad Request` (Invalid Type / Size) | | | **X** | **X** | |
| Upload thành công & Trả về `201 Created` | | | | | **X** |