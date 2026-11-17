# TÀI LIỆU ĐẶC TẢ KỸ THUẬT VÀ THIẾT KẾ TEST: PHÂN HỆ TẢI LÊN TRANG TRUYỆN (PAGES UPLOAD MODULE)

## I. XÁC ĐỊNH ĐIỀU KIỆN TEST (TEST CONDITIONS) & CƠ SỞ TEST

* **Cơ sở test (Test Basis):**
  * Mã nguồn định tuyến Backend: `routes/page.routes.js` (`POST /api/pages/upload/:chapter_id/upload`).
  * Mã nguồn xử lý nghiệp vụ Backend: `controllers/page/uploadPages.js`.
  * Mã nguồn cấu hình Multer Middleware: `middlewares/upload.middleware.js` (`upload.pages`).
  * Mongoose Models: `models/PageModel.js` và `models/ChapterModel.js`.

* **Các điều kiện test (Test Conditions) xác định từ mã nguồn thực tế:**
  * **TCond_UP_01 (Phân quyền & Scope):** Kiểm tra middleware `requireAuth`, `requireRole` (`MANGAKA`, `ADMIN`) và `requireChapterScope("chapter_id", "write")`.
  * **TCond_UP_02 (Định dạng Chapter ID):** Kiểm tra `chapter_id` phải là định dạng MongoDB ObjectId hợp lệ (`mongoose.Types.ObjectId.isValid`).
  * **TCond_UP_03 (Tồn tại Chương truyện):** Kiểm tra chapter phải tồn tại trong CSDL (`Chapter.findById`).
  * **TCond_UP_04 (Bắt buộc file bản thảo):** Kiểm tra sự tồn tại của file bản thảo `source_file` (`req.files.source_file`).
  * **TCond_UP_05 (Ràng buộc định dạng & Kích thước file - Multer):**
    * `source_file`: Chỉ cho phép định dạng `.psd`, dung lượng tối đa `500MB`.
    * `attached_resource`: File nén tùy chọn (`.zip`, `.rar`, `.7z`, v.v.), dung lượng tối đa `500MB`.
  * **TCond_UP_06 (Cơ chế Transaction & Cập nhật trạng thái Chapter):** Sử dụng Mongoose Session Transaction (`startSession`, `commitTransaction`, `abortTransaction`). Nếu chapter đang ở trạng thái `"Draft"` hoặc `"In Production"`, tự động chuyển sang `"Waiting Review"`.

---

## II. PHÂN LOẠI CÁC KỸ THUẬT THIẾT KẾ TEST ÁP DỤNG (DYNAMIC TESTING)

1. **Kỹ thuật kiểm thử hộp đen (Specification-based / Black-box - Functional):**
   * *Phân hoạch lớp tương đương (EP) & Phân tích giá trị biên (BVA):* Áp dụng cho định dạng file `source_file` (.psd hợp lệ vs .jpg/.png/.txt không hợp lệ), kích thước tệp tin (dưới 500MB vs trên 500MB), và định dạng `chapter_id`.
   * *Kiểm thử chuyển đổi trạng thái (State Transition Testing):* Kiểm thử sự thay đổi trạng thái của Chapter từ `Draft` / `In Production` sang `Waiting Review` khi upload trang thành công.
   * *Bảng quyết định (Decision Table Testing):* Tổ hợp các điều kiện hợp lệ của ID, tồn tại Chapter, sự hiện diện của `source_file` và kết quả kiểm tra định dạng của Multer để xác định HTTP response (`400`, `404`, `500`, `201`).

2. **Kỹ thuật kiểm thử hộp trắng (Structure-based / White-box):**
   * *Kiểm thử luồng điều khiển (Control Flow Testing):* Xây dựng đồ thị luồng điều khiển (CFG) cho hàm `uploadPages` trong `uploadPages.js`, tính độ phức tạp Cyclomatic $V(G)$, đánh giá độ bao phủ câu lệnh (Statement Coverage) và bao phủ nhánh (Branch Coverage).

3. **Kỹ thuật kiểm thử dựa trên kinh nghiệm (Experience-based):**
   * *Đoán lỗi (Error Guessing):* Kiểm thử trường hợp upload file PSD vượt quá dung lượng giới hạn 500MB, file đính kèm sai định dạng mở rộng, hoặc mất kết nối CSDL giữa chừng kích hoạt transaction `abortTransaction`.

---

## III. KỸ THUẬT KIỂM THỬ HỘP ĐEN (BLACK-BOX TESTING)

### 1. Phân hoạch lớp tương đương (EP) & Phân tích giá trị biên (BVA)

| Điều kiện đầu vào | Lớp tương đương Hợp lệ (Valid) | Lớp tương đương Không hợp lệ (Invalid) | Giá trị biên (Standard BVA) |
| :--- | :--- | :--- | :--- |
| **Định dạng file `source_file`** | File có đuôi mở rộng `.psd` | File có đuôi `.png`, `.jpg`, `.pdf`, `.txt`, `.zip` | File `.psd` (Valid - Min/Max), File `.png` (Invalid) |
| **Kích thước `source_file`** | $0 < \text{size} \le 500 \text{ MB}$ | $\text{size} > 500 \text{ MB}$ | File đúng `500MB` (Valid), File `500MB + 1 Byte` (Invalid) |
| **Định dạng `attached_resource`** | File nén hợp lệ (`.zip`, `.rar`, `.7z`, `.tar`, v.v.) | File định dạng khác (`.exe`, `.js`, `.docx`) | Không gửi file (Valid - tuỳ chọn), Gửi file đúng định dạng nén |

### 2. Kiểm thử chuyển đổi trạng thái (State Transition Testing)

#### a. Sơ đồ chuyển đổi trạng thái của Chapter khi Upload Page
```
[ST1: DRAFT hoặc IN PRODUCTION]
    │
    ├── (Event: Mangaka gọi POST /api/pages/upload/:chapter_id/upload thành công)
    ▼
[ST2: WAITING REVIEW (chapterExists.status tự động cập nhật)]
```

#### b. Bảng Test Cases chuyển đổi trạng thái
| Test Case No. | Start State | Event / Input | End State / Expected Output |
| :--- | :--- | :--- | :--- |
| **ST_UP_01** | `ST1: Draft` | Upload bản thảo `source_file` (.psd) hợp lệ | `ST2: Waiting Review` (HTTP `201 Created`) |
| **ST_UP_02** | `ST1: In Production` | Upload bản thảo `source_file` (.psd) hợp lệ | `ST2: Waiting Review` (HTTP `201 Created`) |
| **ST_UP_03** | `ST1: Approved` | Upload bản thảo bổ sung cho chapter đã duyệt | Giữ nguyên trạng thái `Approved` (HTTP `201 Created`, không đổi status chapter) |

### 3. Bảng quyết định (Decision Table Testing)
Áp dụng cho hàm `uploadPages` (`controllers/page/uploadPages.js`):

| Điều kiện / Hành động | R1 | R2 | R3 | R4 | R5 | R6 |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **C1: `chapter_id` là ObjectId hợp lệ?** | N | Y | Y | Y | Y | Y |
| **C2: Chapter tồn tại trong CSDL?** | - | N | Y | Y | Y | Y |
| **C3: Tồn tại file `source_file` trong request?** | - | - | N | Y | Y | Y |
| **C4: Multer pass kiểm tra định dạng (.psd) & dung lượng?** | - | - | - | N | Y | Y |
| **C5: Chapter ở trạng thái Draft / In Production?** | - | - | - | - | N | Y |
| **A1: Trả về `400 Bad Request` ("ID chương truyện không hợp lệ!")** | **X** | | | | | |
| **A2: Trả về `404 Not Found` ("Không tìm thấy chương truyện!")** | | **X** | | | | |
| **A3: Trả về `400 Bad Request` ("Thiếu file bản thảo (source_file)!")** | | | **X** | | | |
| **A4: Trả về `400 Bad Request` (Multer error: `INVALID_FILE_TYPE`)** | | | | **X** | | |
| **A5: Lưu Page, ghi History, trả về `201 Created` (Giữ nguyên status Chapter)** | | | | | **X** | |
| **A6: Lưu Page, ghi History, cập nhật Chapter sang `Waiting Review`, trả về `201 Created`** | | | | | | **X** |

---

## IV. KỸ THUẬT KIỂM THỬ HỘP TRẮNG (WHITE-BOX TESTING)

### 1. Phân tích mã nguồn & Đồ thị luồng điều khiển (Control Flow Graph - CFG)
Trích xuất trực tiếp từ hàm `exports.uploadPages` trong `controllers/page/uploadPages.js`:
* **Nút 1 (Start):** Khởi tạo Transaction (`startSession`, `startTransaction`), nhận `chapter_id`, `page_number`.
* **Nút 2 (Điều kiện P1):** `if (!mongoose.Types.ObjectId.isValid(chapter_id))` $\rightarrow$ True: **Nút 3** (Abort transaction, `return 400`); False: sang Nút 4.
* **Nút 4:** Tìm chapter `Chapter.findById(chapter_id).session(session)`.
* **Nút 5 (Điều kiện P2):** `if (!chapterExists)` $\rightarrow$ True: **Nút 6** (Abort transaction, `return 404`); False: sang Nút 7.
* **Nút 7 (Điều kiện P3):** `if (!req.files || !req.files.source_file)` $\rightarrow$ True: **Nút 8** (Abort transaction, `return 400`); False: sang Nút 9.
* **Nút 9:** Lấy `sourceFileUrl`, `attachedResourceUrl`, tạo `previewUrl`, khởi tạo `new Page(...)`, gọi `newPage.save({ session })`.
* **Nút 10:** Tạo bản ghi lịch sử `new PageVersionHistory.save({ session })`.
* **Nút 11 (Điều kiện P4):** `if (["Draft", "In Production"].includes(chapterExists.status))` $\rightarrow$ True: **Nút 12** (`chapterExists.status = "Waiting Review"`, save); False: sang Nút 13.
* **Nút 13:** Chốt transaction (`commitTransaction`, `endSession`), trả về `res.status(201).json(...)`.
* **Nút 14 (End):** Kết thúc hàm (Khối `catch` thực hiện `abortTransaction` nếu lỗi).

```
      (1: Start)
          │
          ▼
     <2: P1 (Valid ID?)> ────(True)──► [3: Return 400 (Invalid ID)] ─────────────┐
          │ (False)                                                             │
          ▼                                                                     │
     [4: Find Chapter in DB]                                                    │
          │                                                                     │
          ▼                                                                     │
     <5: P2 (!chapter?)> ────(True)───► [6: Return 404 (Not Found)] ────────────┤
          │ (False)                                                             │
          ▼                                                                     │
     <7: P3 (!source_file?)> ─(True)──► [8: Return 400 (Missing File)] ─────────┤
          │ (False)                                                             │
          ▼                                                                     │
     [9: Save Page & 10: Save History]                                          │
          │                                                                     │
          ▼                                                                     │
    <11: P4 (Chapter Status?)> ─(True)──► [12: Update Chapter to "Waiting Review"]
          │ (False)                            │                                │
          ├────────────────────────────────────┘                                │
          ▼                                                                     │
     [13: Commit Transaction & Return 201]                                      │
          │                                                                     │
          └─────────────────────────────────────────────────────────────────────┴──► (14: End)
```

### 2. Tính độ phức tạp Cyclomatic $V(G)$
* **Số nút ($N$):** $14$ nút.
* **Số cạnh điều hướng ($E$):** $18$ cạnh.
* **Số nút điều kiện ($P$):** $4$ nút điều kiện chính (P1 đến P4).
* **Số miền ($R$):** $5$ miền.
* Áp dụng công thức tính:
  * $V(G) = E - N + 2 = 18 - 14 + 2 = 6$
  * $V(G) = P + 1 = 4 + 1 = 5$ (tính trên các nhánh rẽ điều kiện quyết định logic chính).
* **Kết luận:** Độ phức tạp Cyclomatic của hàm `uploadPages` là $V(G) = 5 \Rightarrow$ Cần tối thiểu **5 đường đi cơ bản độc lập** để bao phủ toàn bộ cấu trúc điều kiện logic của hàm.

### 3. Đánh giá các mức độ bao phủ (Coverage Analysis)
* **Statement Coverage (Bao phủ câu lệnh):** Đạt **100%** khi bộ test bao phủ toàn bộ các câu lệnh trong khối `try`, các lệnh abort transaction khi gặp lỗi `400`, `404`, và lệnh commit thành công.
* **Branch Coverage (Bao phủ nhánh):** Đạt **100%** khi kiểm thử đầy đủ các nhánh True/False của 4 điểm quyết định (P1, P2, P3, P4).

---

## V. THIẾT KẾ FORMAL TEST CASES

| Test Case ID | Test Summary / Description | Pre-condition | Test Steps & Inputs (Test Data) | Expected Result | Pass / Fail |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC_UP_01** | *(Negative)* Upload trang với `chapter_id` không phải định dạng ObjectId | Đăng nhập quyền `Mangaka` | 1. Gửi `POST /api/pages/upload/invalid-id-123/upload` kèm file .psd | Trả về HTTP `400 Bad Request` với message `"ID chương truyện không hợp lệ!"`. | **Pass** |
| **TC_UP_02** | *(Negative)* Upload trang với `chapter_id` không tồn tại trong CSDL | Đăng nhập quyền `Admin` | 1. Gửi `POST /api/pages/upload/6a3424495bed29d138ba0000/upload` kèm file .psd | Trả về HTTP `404 Not Found` với message `"Không tìm thấy chương truyện!"`. | **Pass** |
| **TC_UP_03** | *(Negative)* Upload trang nhưng thiếu file bản thảo (`source_file`) | Đăng nhập quyền `Mangaka`, Chapter tồn tại | 1. Gửi `POST /api/pages/upload/:chapter_id/upload` chỉ có `page_number: 1` không có file | Trả về HTTP `400 Bad Request` với message `"Thiếu file bản thảo (source_file)!"`. | **Pass** |
| **TC_UP_04** | *(Negative)* Upload file bản thảo sai định dạng quy định (VD: file `.png`) | Đăng nhập quyền `Mangaka`, Chapter tồn tại | 1. Gửi `POST /api/pages/upload/:chapter_id/upload` với `source_file` là ảnh `.png` | Multer chặn file, trả về HTTP `400 Bad Request` với lỗi `INVALID_FILE_TYPE` ("File source_file chỉ hỗ trợ: PSD."). | **Pass** |
| **TC_UP_05** | *(Positive)* Upload trang truyện thành công (Chapter ở trạng thái `Draft`) | Đăng nhập quyền `Mangaka`, Chapter đang ở `Draft` | 1. Gửi `POST /api/pages/upload/:chapter_id/upload` với file `source_file` hợp lệ (.psd) và `attached_resource` (.zip) | Transaction lưu Page & PageVersionHistory thành công, Chapter tự động đổi sang `Waiting Review`, trả về HTTP `201 Created`. | **Pass** |
| **TC_UP_06** | *(Positive)* Upload trang truyện thành công khi Chapter đã ở trạng thái `Approved` | Đăng nhập quyền `Admin`, Chapter đang ở `Approved` | 1. Gửi `POST /api/pages/upload/:chapter_id/upload` với file `.psd` hợp lệ | Transaction lưu Page thành công, giữ nguyên trạng thái `Approved` của Chapter, trả về HTTP `201 Created`. | **Pass** |