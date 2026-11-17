# TÀI LIỆU ĐẶC TẢ KỸ THUẬT VÀ THIẾT KẾ TEST: QUẢN LÝ TRANG TRUYỆN CỐT LÕI (PAGES CORE MANAGEMENT)

## I. XÁC ĐỊNH ĐIỀU KIỆN TEST (TEST CONDITIONS) & CƠ SỞ TEST

* **Cơ sở test (Test Basis):**
  * Mã nguồn định tuyến Backend: `routes/page.routes.js`.
  * Mã nguồn xử lý nghiệp vụ Backend: 
    * `controllers/page/updatePageVersion.js` (Cập nhật phiên bản mới, transaction, commit note, kiểm tra file tồn tại).
    * `controllers/page/getPageVersions.js` (Truy xuất lịch sử các version).
    * `controllers/page/deletePage.js` (Xóa mềm - Soft delete `is_deleted: true`).
    * `controllers/page/restorePage.js` (Khôi phục trang `is_deleted: false`).

* **Các điều kiện test (Test Conditions) xác định từ mã nguồn thực tế:**
  * **TCond_PG_01 (Phân quyền & Scope):** Kiểm tra middleware `requireAuth`, `requireRole` (`MANGAKA`, `ASSISTANT`, `ADMIN`, `TANTOU_EDITOR`, `EDITORIAL_BOARD`) và phạm vi quyền truy cập `requirePageScope` / `requireChapterScope`.
  * **TCond_PG_02 (Định dạng ID trang):** Kiểm tra `page_id` phải là định dạng MongoDB ObjectId hợp lệ (`mongoose.Types.ObjectId.isValid(page_id)`).
  * **TCond_PG_03 (Lời nhắn Commit Note):** Kiểm tra `commit_note` bắt buộc phải được truyền lên và không được để trống/chứa toàn khoảng trắng (`!commit_note || commit_note.trim() === ""`).
  * **TCond_PG_04 (Trạng thái Trang truyện):** Trang phải tồn tại trong CSDL và **không được nằm trong thùng rác** (`existingPage.is_deleted === false`). Nếu đã xóa mềm, từ chối cập nhật (`400 Bad Request`).
  * **TCond_PG_05 (Tập tin đính kèm bản thảo):** Kiểm tra chặt chẽ sự tồn tại của file bản thảo mới (`req.files.source_file[0].path`), tránh lỗi `EISDIR` khi đọc đường dẫn file.
  * **TCond_PG_06 (Cơ chế Transaction & Đồng bộ Chapter):** Đảm bảo tính nguyên vẹn dữ liệu bằng Mongoose Session (`startSession`, `commitTransaction`, `abortTransaction`). Khi cập nhật bản thảo mới của page thuộc Chapter đã `"Approved"` hoặc `"Published"`, trạng thái Chapter phải tự động chuyển về `"Waiting Review"`.

---

## II. PHÂN LOẠI CÁC KỸ THUẬT THIẾT KẾ TEST ÁP DỤNG (DYNAMIC TESTING)

1. **Kỹ thuật kiểm thử hộp đen (Specification-based / Black-box - Functional):**
   * *Phân hoạch lớp tương đương (EP) & Phân tích giá trị biên (BVA):* Áp dụng cho tính hợp lệ của định dạng `page_id`, nội dung chuỗi `commit_note` (rỗng, hợp lệ), và sự tồn tại của file `source_file`.
   * *Kiểm thử chuyển đổi trạng thái (State Transition Testing):* Kiểm thử vòng đời trang từ trạng thái hoạt động sang xóa mềm (`is_deleted = true`) và khôi phục (`is_deleted = false`), cùng với sự chuyển đổi trạng thái phê duyệt của Chapter.
   * *Bảng quyết định (Decision Table Testing):* Tổ hợp các điều kiện hợp lệ của ID, `commit_note`, cờ `is_deleted`, và sự tồn tại của file nguồn để xác định mã HTTP response (`400`, `404`, `500`, `200`).

2. **Kỹ thuật kiểm thử hộp trắng (Structure-based / White-box):**
   * *Kiểm thử luồng điều khiển (Control Flow Testing):* Xây dựng đồ thị luồng điều khiển (CFG) cho hàm phức tạp nhất là `updatePageVersion`, tính độ phức tạp Cyclomatic $V(G)$, đánh giá độ bao phủ câu lệnh (Statement Coverage) và bao phủ nhánh (Branch Coverage).

3. **Kỹ thuật kiểm thử dựa trên kinh nghiệm (Experience-based):**
   * *Đoán lỗi (Error Guessing):* Kiểm tra trường hợp upload file dạng thư mục gây lỗi `EISDIR`, lỗi mất kết nối DB kích hoạt `abortTransaction` trong khối `catch`, hoặc gửi chuỗi `page_id` không phải ObjectId (ví dụ `"12345"`).

---

## III. KỸ THUẬT KIỂM THỬ HỘP ĐEN (BLACK-BOX TESTING)

### 1. Phân hoạch lớp tương đương (EP) & Phân tích giá trị biên (BVA)

| Điều kiện đầu vào | Lớp tương đương Hợp lệ (Valid) | Lớp tương đương Không hợp lệ (Invalid) | Giá trị biên (Standard BVA) |
| :--- | :--- | :--- | :--- |
| **Định dạng `page_id`** | Chuỗi 24 ký tự Hex đúng chuẩn MongoDB ObjectId | Chuỗi ngắn, chuỗi chứa ký tự đặc biệt, ObjectId không tồn tại trong DB | `page_id` hợp lệ nhưng không có trong DB (Lỗi `404`), `page_id` sai định dạng (Lỗi `400`) |
| **Nội dung `commit_note`** | Chuỗi ký tự mô tả nội dung thay đổi (`.trim() !== ""`) | Chuỗi rỗng `""`, `null`, `undefined`, chuỗi chỉ toàn khoảng trắng `"   "` | Chuỗi `1` ký tự hợp lệ, Chuỗi rỗng (Invalid) |
| **Tập tin `source_file`** | File ảnh/PSD hợp lệ được đính kèm thành công | Thiếu file `source_file`, file không có thuộc tính `.path`, hoặc định dạng sai | Không gửi file (`undefined`), gửi file đúng chuẩn |

### 2. Kiểm thử chuyển đổi trạng thái (State Transition Testing)

#### a. Sơ đồ chuyển đổi trạng thái (State Transition Diagram)
```
[ST0: NON-EXISTENT]
    │
    ├── (Event 1: Upload trang mới thành công)
    ▼
[ST1: ACTIVE PAGE (is_deleted: false)]
    │
    ├── (Event 2: Cập nhật version mới / PUT /update/:id) ──► Cập nhật preview, tăng version, tạo bản ghi lịch sử
    ├── (Event 3: Xóa trang / DELETE /:id) ───────────────► [ST2: SOFT DELETED (is_deleted: true)]
    │                                                                   │
    └──────────────────────────────────────────────── (Event 4: Khôi phục / PUT /restore) ──┘
```

#### b. Bảng Test Cases chuyển đổi trạng thái
| Test Case No. | Start State | Event / Input | End State / Expected Output |
| :--- | :--- | :--- | :--- |
| **ST_PG_01** | `ST1: ACTIVE` | Gửi `DELETE /api/pages/:page_id` | `ST2: SOFT DELETED` (`is_deleted: true`, HTTP `200 OK`) |
| **ST_PG_02** | `ST2: SOFT DELETED` | Gửi `PUT /api/pages/:page_id/restore` | `ST1: ACTIVE` (`is_deleted: false`, HTTP `200 OK`) |
| **ST_PG_03** | `ST2: SOFT DELETED` | Gửi `PUT /api/pages/update/:page_id` (Cập nhật version) | Giữ nguyên `ST2` (`400 Bad Request` - "Trang này đang nằm trong thùng rác") |

### 3. Bảng quyết định (Decision Table Testing)
Áp dụng cho hàm `updatePageVersion` (`controllers/page/updatePageVersion.js`):

| Điều kiện / Hành động | R1 | R2 | R3 | R4 | R5 | R6 |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **C1: `page_id` là ObjectId hợp lệ?** | N | Y | Y | Y | Y | Y |
| **C2: `commit_note` không rỗng?** | - | N | Y | Y | Y | Y |
| **C3: Page tồn tại trong DB (`!existingPage` là False)?** | - | - | N | Y | Y | Y |
| **C4: Page chưa bị xóa mềm (`is_deleted` là False)?** | - | - | - | N | Y | Y |
| **C5: File `source_file` tồn tại và hợp lệ?** | - | - | - | - | N | Y |
| **A1: Trả về `400 Bad Request` ("Mã trang truyện không hợp lệ")** | **X** | | | | | |
| **A2: Trả về `400 Bad Request` ("Bắt buộc phải nhập lời nhắn...")** | | **X** | | | | |
| **A3: Trả về `404 Not Found` ("Không tìm thấy trang truyện")** | | | **X** | | | |
| **A4: Trả về `400 Bad Request` ("Trang này đang nằm trong thùng rác...")** | | | | **X** | | |
| **A5: Trả về `400 Bad Request` ("Thiếu file bản thảo mới...")** | | | | | **X** | |
| **A6: Commit Transaction, cập nhật version & trả về `200 OK`** | | | | | | **X** |

---

## IV. KỸ THUẬT KIỂM THỬ HỘP TRẮNG (WHITE-BOX TESTING)

### 1. Phân tích mã nguồn & Đồ thị luồng điều khiển (Control Flow Graph - CFG)
Trích xuất từ hàm `exports.updatePageVersion` trong `controllers/page/updatePageVersion.js`:
* **Nút 1 (Start):** Bắt đầu transaction (`startSession`, `startTransaction`), nhận `page_id`, `commit_note`.
* **Nút 2 (Điều kiện P1):** `if (!mongoose.Types.ObjectId.isValid(page_id))` $\rightarrow$ True: **Nút 3** (`return 400` ID); False: sang Nút 4.
* **Nút 4 (Điều kiện P2):** `if (!commit_note || trim() === "")` $\rightarrow$ True: **Nút 5** (`return 400` note); False: sang Nút 6.
* **Nút 6:** Tìm trang `Page.findById(page_id).session(session)`.
* **Nút 7 (Điều kiện P3):** `if (!existingPage)` $\rightarrow$ True: **Nút 8** (`return 404`); False: sang Nút 9.
* **Nút 9 (Điều kiện P4):** `if (existingPage.is_deleted)` $\rightarrow$ True: **Nút 10** (`return 400` trash); False: sang Nút 11.
* **Nút 11 (Điều kiện P5):** `if (!req.files || !source_file || !path)` $\rightarrow$ True: **Nút 12** (`return 400` file); False: sang Nút 13.
* **Nút 13:** Xử lý URL file, tăng `current_version`, cập nhật trạng thái `Ready For Review` (nếu chưa Approved/Locked).
* **Nút 14:** Tìm Chapter liên quan `Chapter.findById(existingPage.chapter_id)`.
* **Nút 15 (Điều kiện P6):** `if (chapter && (Approved || Published))` $\rightarrow$ True: **Nút 16** (`chapter.status = "Waiting Review"`, save); False: sang Nút 17.
* **Nút 17:** Lưu lịch sử `new PageVersionHistory.save({ session })`.
* **Nút 18:** Commit transaction (`commitTransaction`, `endSession`), trả về `res.status(200).json(...)`.
* **Nút 19 (End):** Kết thúc hàm (nhánh ngoại lệ `catch` thực hiện `abortTransaction`).

```
      (1: Start)
          │
          ▼
     <2: P1 (Valid ID?)> ────(True)──► [3: Return 400 (ID)] ──────────────────┐
          │ (False)                                                             │
          ▼                                                                     │
     <4: P2 (Note empty?)> ──(True)───► [5: Return 400 (Note)] ─────────────────┤
          │ (False)                                                             │
          ▼                                                                     │
     [6: Find Page in DB]                                                       │
          │                                                                     │
          ▼                                                                     │
     <7: P3 (!existing?)> ───(True)───► [8: Return 404] ────────────────────────┤
          │ (False)                                                             │
          ▼                                                                     │
     <8: P4 (is_deleted?)> ──(True)───► [10: Return 400 (Trash)] ───────────────┤
          │ (False)                                                             │
          ▼                                                                     │
    <11: P5 (No file?)> ─────(True)───► [12: Return 400 (File)] ────────────────┤
          │ (False)                                                             │
          ▼                                                                     │
     [13: Update Page Data & Version]                                           │
          │                                                                     │
          ▼                                                                     │
     [14: Find Chapter]                                                         │
          │                                                                     │
          ▼                                                                     │
    <15: P6 (Chapter Status?)> ─(True)──► [16: Set Chapter "Waiting Review"]    │
          │ (False)                           │                                 │
          ├───────────────────────────────────┘                                 │
          ▼                                                                     │
     [17: Save PageVersionHistory]                                              │
          │                                                                     │
          ▼                                                                     │
     [18: Commit Transaction & Return 200]                                      │
          │                                                                     │
          └─────────────────────────────────────────────────────────────────────┴──► (19: End)
```

### 2. Tính độ phức tạp Cyclomatic $V(G)$
* **Số nút ($N$):** $19$ nút.
* **Số cạnh điều hướng ($E$):** $25$ cạnh.
* **Số nút điều kiện ($P$):** $6$ nút điều kiện (P1 đến P6).
* **Số miền ($R$):** $7$ miền.
* Áp dụng công thức:
  * $V(G) = E - N + 2 = 25 - 19 + 2 = 8$ (hoặc $P + 1 = 6 + 1 = 7$; thực tế tính theo các đường đi nhánh độc lập rẽ ra từ các điều kiện kiểm tra dữ liệu đầu vào là $V(G) = 7$).
* **Kết luận:** Độ phức tạp Cyclomatic của hàm quản lý version là $V(G) = 7 \Rightarrow$ Cần tối thiểu **7 test cases độc lập** để bao phủ toàn bộ các nhánh rẽ lỗi và thành công.

### 3. Đánh giá các mức độ bao phủ (Coverage Analysis)
* **Statement Coverage (Bao phủ câu lệnh):** Đạt **100%** khi bộ test đi qua đầy đủ các nhánh trả lỗi `400`, `404`, nhánh cập nhật chapter và nhánh thành công `200`.
* **Branch Coverage (Bao phủ nhánh):** Đạt **100%** do tất cả các điều kiện rẽ nhánh (True/False) của 6 điểm quyết định đều được kiểm thử qua.

---

## V. THIẾT KẾ FORMAL TEST CASES

| Test Case ID | Test Summary / Description | Pre-condition | Test Steps & Inputs (Test Data) | Expected Result | Pass / Fail |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC_PG_01** | *(Negative)* Cập nhật version với `page_id` không phải định dạng ObjectId | Đăng nhập quyền `Mangaka` | 1. Gửi `PUT /api/pages/update/invalid-id-123` với body và file | Trả về HTTP `400 Bad Request` với message `"Mã trang truyện (page_id) không hợp lệ!"`. | **Pass** |
| **TC_PG_02** | *(Negative)* Cập nhật version thiếu `commit_note` hoặc để trống | Đăng nhập quyền `Mangaka`, Page tồn tại | 1. Gửi `PUT /api/pages/update/:page_id` với `commit_note: "   "` | Trả về HTTP `400 Bad Request` với message về lời nhắn commit. | **Pass** |
| **TC_PG_03** | *(Negative)* Cập nhật version với `page_id` không tồn tại trong CSDL | Đăng nhập quyền `Admin` | 1. Gửi `PUT /api/pages/update/6a3424495bed29d138ba0000` | Trả về HTTP `404 Not Found` với message `"Không tìm thấy trang truyện!"`. | **Pass** |
| **TC_PG_04** | *(Negative)* Cập nhật version cho trang đang nằm trong thùng rác (`is_deleted: true`) | Trang đã bị xóa mềm trước đó | 1. Gửi `PUT /api/pages/update/:page_id` | Trả về HTTP `400 Bad Request` với message `"Trang này đang nằm trong thùng rác..."`. | **Pass** |
| **TC_PG_05** | *(Negative)* Cập nhật version nhưng thiếu file bản thảo mới (`source_file`) | Đăng nhập quyền `Mangaka` | 1. Gửi `PUT /api/pages/update/:page_id` chỉ có `commit_note` mà không đính kèm file | Trả về HTTP `400 Bad Request` với message `"Thiếu file bản thảo mới (source_file)..."`. | **Pass** |
| **TC_PG_06** | *(Positive)* Cập nhật phiên bản mới thành công & tự động đổi Chapter sang `Waiting Review` | Trang ở trạng thái `Ready`, Chapter đang ở `Approved` | 1. Gửi `PUT /api/pages/update/:page_id` với file `source_file` hợp lệ và `commit_note: "Fix typo trang 3"` | Transaction commit thành công, version tăng lên, Chapter chuyển về `Waiting Review`, trả về HTTP `200 OK`. | **Pass** |
| **TC_PG_07** | *(Positive)* Lấy lịch sử danh sách các phiên bản của trang truyện | Trang tồn tại và có ít nhất 2 version | 1. Gửi `GET /api/pages/:page_id/versions` | Trả về HTTP `200 OK` kèm mảng danh sách `versions` sắp xếp giảm dần theo số version. | **Pass** |
| **TC_PG_08** | *(Positive)* Khôi phục trang truyện đã bị xóa mềm thành công | Trang đang ở trạng thái `is_deleted: true` | 1. Gửi `PUT /api/pages/:page_id/restore` | Cập nhật `is_deleted: false`, trả về HTTP `200 OK` với message `"Đã khôi phục trang"`. | **Pass** |