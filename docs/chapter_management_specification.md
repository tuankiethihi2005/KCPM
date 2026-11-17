# TÀI LIỆU ĐẶC TẢ KỸ THUẬT VÀ THIẾT KẾ TEST: MODULE QUẢN LÝ CHAPTER (CHAPTER MANAGEMENT)

## I. XÁC ĐỊNH ĐIỀU KIỆN TEST (TEST CONDITIONS) & CƠ SỞ TEST

* **Cơ sở test (Test Basis):**
  * Mã nguồn định tuyến Backend: `routes/chapter.routes.js` (`POST /api/chapters/create`, `PUT /api/chapters/update-status/:chapter_id`, `GET /api/chapters/series/:series_id`, `GET /api/chapters/:chapter_id`, `DELETE /api/chapters/:chapter_id`, `PUT /api/chapters/restore/:chapter_id`).
  * Mã nguồn xử lý nghiệp vụ Backend: `controllers/chapter/createChapter.js` và `controllers/chapter/updateChapterStatus.js`.

* **Các điều kiện test (Test Conditions) xác định từ mã nguồn thực tế:**
  * **TCond_CH_01 (Phân quyền & Scope):** Kiểm tra middleware `requireAuth`, `requireRole` (`MANGAKA`, `ADMIN` cho tạo/xóa/khôi phục; bổ sung `TANTOU_EDITOR` cho cập nhật trạng thái) và kiểm tra quyền truy cập Series `canAccessSeries(req.user, series, "write")` / `requireChapterScope`.
  * **TCond_CH_02 (Đầu vào Tiêu đề Chapter):** Kiểm tra `title` không được rỗng/sai kiểu dữ liệu (`!title || typeof title !== "string" || !title.trim()`) và độ dài sau khi `trim()` phải nằm trong khoảng từ **2 đến 255 ký tự** (`trimmedTitle.length < 2 || trimmedTitle.length > 255`).
  * **TCond_CH_03 (Tồn tại Series & Chapter):** Kiểm tra sự tồn tại của `series_id` khi tạo chapter (`Series.findById`) và `chapter_id` khi cập nhật trạng thái (`Chapter.findByIdAndUpdate`).
  * **TCond_CH_04 (Trạng thái Chapter hợp lệ):** Kiểm tra tham số `status` truyền lên trong `updateChapterStatus` phải thuộc danh sách Enum hợp lệ: `["Draft", "In Production", "Waiting Review", "Approved", "Published"]`.
  * **TCond_CH_05 (Lưu trữ & Thông báo):** Kiểm tra lưu bản ghi mới vào DB (`newChapter.save()`), gửi thông báo cho `series.author_id` và `series.editor_id` (nếu có).

---

## II. PHÂN LOẠI CÁC KỸ THUẬT THIẾT KẾ TEST ÁP DỤNG (DYNAMIC TESTING)

Áp dụng phân loại kỹ thuật kiểm thử động trong Chương IV:
1. **Kỹ thuật kiểm thử hộp đen (Specification-based / Black-box - Functional):**
   * *Phân hoạch lớp tương đương (EP) & Phân tích giá trị biên (BVA):* Áp dụng trực tiếp cho độ dài chuỗi `title` (ràng buộc `2` đến `255` ký tự trong `createChapter.js`) và tập giá trị Enum của `status` trong `updateChapterStatus.js`.
   * *Kiểm thử chuyển đổi trạng thái (State Transition Testing):* Kiểm tra vòng đời chuyển đổi trạng thái của Chapter (`Draft` $\rightarrow$ `In Production` $\rightarrow$ `Waiting Review` $\rightarrow$ `Approved` $\rightarrow$ `Published`).
   * *Bảng quyết định (Decision Table Testing):* Tổ hợp các điều kiện đầu vào, tồn tại Series và quyền truy cập Scope để xác định mã HTTP response trả về (`400`, `404`, `403`, `201`).
2. **Kỹ thuật kiểm thử hộp trắng (Structure-based / White-box):**
   * *Kiểm thử luồng điều khiển (Control Flow Testing):* Vẽ đồ thị luồng điều khiển (CFG) trực tiếp từ hàm `exports.Chapter` (`createChapter.js`), tính độ phức tạp Cyclomatic $V(G)$, đánh giá độ bao phủ câu lệnh (Statement Coverage), bao phủ nhánh (Decision/Branch Coverage) và bao phủ điều kiện (Condition Coverage).
3. **Kỹ thuật kiểm thử dựa trên kinh nghiệm (Experience-based):**
   * *Đoán lỗi (Error Guessing) & Kiểm thử thăm dò (Exploratory Testing):* Kiểm tra nhập chuỗi chỉ toàn dấu cách `"   "` (sau khi `trim()` thành rỗng), nhập `title` dài 256 ký tự có khoảng trắng ở đầu/cuối, hoặc lỗi Mongoose `ValidationError` (ví dụ trùng `chapter_number` do unique index trong schema) rơi vào nhánh `catch (err)`.

---

## III. KỸ THUẬT KIỂM THỬ HỘP ĐEN (BLACK-BOX TESTING)

### 1. Phân hoạch lớp tương đương (EP) & Phân tích giá trị biên (BVA)
Áp dụng cho tham số `title` (ràng buộc `2 <= trimmedTitle.length <= 255` trong `createChapter.js`) và `status` trong `updateChapterStatus.js`:

| Điều kiện đầu vào | Lớp tương đương Hợp lệ (Valid) | Lớp tương đương Không hợp lệ (Invalid) | Giá trị biên (Standard BVA) |
| :--- | :--- | :--- | :--- |
| **Độ dài chuỗi `title` (sau `trim()`)** | Chuỗi ký tự có độ dài từ `2` đến `255` ký tự | Rỗng (`""`), chỉ chứa khoảng trắng (`"  "`), độ dài `< 2` ký tự, độ dài `> 255` ký tự, hoặc không phải kiểu `string` | `1` ký tự (Invalid), `2` ký tự (Valid - Min), `3` ký tự (Valid - Min+), `254` ký tự (Valid - Max-), `255` ký tự (Valid - Max), `256` ký tự (Invalid) |
| **Giá trị `status` (`updateChapterStatus`)** | Thuộc tập `{"Draft", "In Production", "Waiting Review", "Approved", "Published"}` | Chuỗi khác ngoài tập trên (VD: `"Deleted"`, `"Pending"`, `""`, `null`) | Kiểm tra đại diện giá trị hợp lệ `"In Production"` và không hợp lệ `"InvalidStatus"` |

### 2. Kiểm thử chuyển đổi trạng thái (State Transition Testing)

#### a. Sơ đồ chuyển đổi trạng thái (State Transition Diagram)
Dựa trên danh sách `validStatuses` trong `updateChapterStatus.js`:
```
[ST0: NON-EXISTENT]
    │
    ├── (Event 1: POST /api/chapters/create hợp lệ)
    ▼
[ST1: DRAFT]
    │
    ├── (Event 2: PUT /update-status -> "In Production")
    ▼
[ST2: IN PRODUCTION]
    │
    ├── (Event 3: PUT /update-status -> "Waiting Review")
    ▼
[ST3: WAITING REVIEW] ──(Từ chối / Chỉnh sửa lại)──► [ST2: IN PRODUCTION]
    │
    ├── (Event 4: PUT /update-status -> "Approved")
    ▼
[ST4: APPROVED]
    │
    ├── (Event 5: Xuất bản / PUT /update-status -> "Published")
    ▼
[ST5: PUBLISHED]

*Lưu ý: Tại bất kỳ trạng thái nào, nếu gửi status ngoài validStatuses -> Trả về 400 Bad Request (Giữ nguyên trạng thái cũ).*
```

#### b. Bảng Test Cases chuyển đổi trạng thái
| Test Case No. | Start State | Event / Input | End State / Expected Output |
| :--- | :--- | :--- | :--- |
| **ST_CH_01** | `ST1: DRAFT` | Gửi `PUT /api/chapters/update-status/:id` với `status: "In Production"` | `ST2: IN PRODUCTION` (`200 OK`) |
| **ST_CH_02** | `ST2: IN PRODUCTION` | Gửi `PUT /api/chapters/update-status/:id` với `status: "Waiting Review"` | `ST3: WAITING REVIEW` (`200 OK`) |
| **ST_CH_03** | `ST3: WAITING REVIEW` | Gửi `PUT /api/chapters/update-status/:id` với `status: "Approved"` | `ST4: APPROVED` (`200 OK`) |
| **ST_CH_04** | `ST4: APPROVED` | Gửi `PUT /api/chapters/update-status/:id` với `status: "InvalidStatus"` | Giữ nguyên `ST4: APPROVED` (`400 Bad Request` - "Trạng thái không hợp lệ") |

### 3. Bảng quyết định (Decision Table Testing)
Áp dụng cho luồng xử lý của hàm `exports.Chapter` (`controllers/chapter/createChapter.js`):

| Điều kiện / Hành động | R1 | R2 | R3 | R4 | R5 |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **C1: `title` là chuỗi không rỗng (`!title \|\| typeof !== "string" \|\| !trim()` là False)?** | N | Y | Y | Y | Y |
| **C2: Độ dài `trimmedTitle` từ `2` đến `255` ký tự?** | - | N | Y | Y | Y |
| **C3: `series` tồn tại trong CSDL (`!series` là False)?** | - | - | N | Y | Y |
| **C4: User có quyền ghi trên Series (`canAccessSeries` là True)?** | - | - | - | N | Y |
| **A1: Trả về `400 Bad Request` ("Tiêu đề chapter không được để trống")** | **X** | | | | |
| **A2: Trả về `400 Bad Request` ("Tiêu đề chapter phải có độ dài từ 2 đến 255 ký tự")** | | **X** | | | |
| **A3: Trả về `404 Not Found` ("Không tìm thấy series")** | | | **X** | | |
| **A4: Trả về `403 Forbidden` (`AUTHZ_SCOPE_DENIED`)** | | | | **X** | |
| **A5: Lưu Chapter, gửi thông báo & trả về `201 Created`** | | | | | **X** |

---

## IV. KỸ THUẬT KIỂM THỬ HỘP TRẮNG (WHITE-BOX TESTING)

### 1. Phân tích mã nguồn & Đồ thị luồng điều khiển (Control Flow Graph - CFG)
Trích xuất các nút quyết định thực tế từ hàm `exports.Chapter(req, res)` trong `controllers/chapter/createChapter.js`:
* **Nút 1 (Start):** Nhận `series_id`, `chapter_number`, `title`, `deadline`, gọi `Series.findById(series_id)`.
* **Nút 2 (Điều kiện P1):** `if (!title || typeof title !== "string" || !title.trim())` $\rightarrow$ True: **Nút 3** (`return 400` trống); False: sang Nút 4.
* **Nút 4 (Điều kiện P2):** `if (trimmedTitle.length < 2 || trimmedTitle.length > 255)` $\rightarrow$ True: **Nút 5** (`return 400` sai độ dài); False: sang Nút 6.
* **Nút 6 (Điều kiện P3):** `if (!series)` $\rightarrow$ True: **Nút 7** (`return 404`); False: sang Nút 8.
* **Nút 8 (Điều kiện P4):** `if (!canAccessSeries(req.user, series, "write"))` $\rightarrow$ True: **Nút 9** (`return 403`); False: sang Nút 10.
* **Nút 10:** Khởi tạo `newChapter`, gọi `await newChapter.save()`, tạo mảng `notifyUsers = [series.author_id]`.
* **Nút 11 (Điều kiện P5):** `if (series.editor_id)` $\rightarrow$ True: **Nút 12** (`notifyUsers.push(series.editor_id)`); False: sang Nút 13.
* **Nút 13 (Vòng lặp P6):** `for (const userId of notifyUsers)` $\rightarrow$ True: **Nút 14** (`createNotification`, quay lại Nút 13); False: sang Nút 15.
* **Nút 15:** Trả về `res.status(201).json(...)`.
* **Nút 16 (End):** Kết thúc hàm (luồng xử lý chính).

```
      (1: Start)
          │
          ▼
     <2: P1 (!title?)> ──────(True)───► [3: Return 400 (Empty)] ────────────────┐
          │ (False)                                                             │
          ▼                                                                     │
   <4: P2 (len <2 || >255)> ─(True)───► [5: Return 400 (Length)] ───────────────┤
          │ (False)                                                             │
          ▼                                                                     │
     <6: P3 (!series)> ──────(True)───► [7: Return 404] ────────────────────────┤
          │ (False)                                                             │
          ▼                                                                     │
   <8: P4 (!canAccess)> ─────(True)───► [9: Return 403] ────────────────────────┤
          │ (False)                                                             │
          ▼                                                                     │
   [10: Save Chapter]                                                           │
          │                                                                     │
          ▼                                                                     │
  <11: P5 (editor_id?)> ─────(True)───► [12: Push editor_id]                    │
          │ (False)                         │                                   │
          ├─────────────────────────────────┘                                   │
          ▼                                                                     │
  <13: P6 (for userId)> ◄───┐                                                   │
     │ (True)       │       │                                                   │
     ▼              │       │                                                   │
 [14: Notify] ──────┘       │ (False)                                           │
                            ▼                                                   │
                     [15: Return 201]                                           │
                            │                                                   │
                            └───────────────────────────────────────────────────┴──► (16: End)
```

### 2. Tính độ phức tạp Cyclomatic $V(G)$
* **Số nút ($N$):** $16$ nút.
* **Số cạnh ($E$):** $21$ cạnh nối giữa các nút.
* **Số nút điều kiện ($P$):** $6$ nút điều kiện (từ P1 đến P6).
* **Số miền ($R$):** $7$ miền kín/hở được tạo bởi đồ thị.
* Áp dụng 3 công thức chuẩn trong Chương IV:
  * $V(G) = E - N + 2 = 21 - 16 + 2 = 7$
  * $V(G) = P + 1 = 6 + 1 = 7$
  * $V(G) = R = 7$
* **Kết luận:** Độ phức tạp Cyclomatic của hàm `exports.Chapter` là $V(G) = 7 \Rightarrow$ Cần tối thiểu **7 đường đi độc lập cơ bản (Basis Paths)** để bao phủ toàn bộ cấu trúc điều khiển.

### 3. Đánh giá các mức độ bao phủ (Coverage Analysis)
1. **Bao phủ câu lệnh (Statement Coverage):**
   $$\text{Statement Coverage} = \frac{\text{Số câu lệnh thực thi}}{\text{Tổng số câu lệnh}} \times 100\%$$
   * Bộ test cases đi qua các nhánh lỗi (`400` trống, `400` sai độ dài, `404`, `403`) và nhánh thành công `201` (có `series.editor_id` để chạy qua Nút 12 và vòng lặp Nút 14) sẽ thực thi $16/16$ khối lệnh $\Rightarrow$ Đạt **100% Statement Coverage**.
2. **Bao phủ nhánh (Decision/Branch Coverage):**
   $$\text{Branch Coverage} = \frac{\text{Số nhánh được thực thi}}{\text{Tổng số nhánh}} \times 100\%$$
   * Đồ thị có $6$ nút điều kiện tương ứng với $12$ nhánh (True/False). Khi kiểm thử đủ 7 đường đi cơ bản (bao gồm cả trường hợp `series.editor_id` tồn tại và null), toàn bộ $12/12$ nhánh đều được thực thi $\Rightarrow$ Đạt **100% Branch Coverage**.
3. **Bao phủ điều kiện (Condition Coverage):**
   * Tại nút điều kiện kép `P1: (!title || typeof title !== "string" || !title.trim())` và `P2: (trimmedTitle.length < 2 || trimmedTitle.length > 255)`, các test cases biên (`""`, số `123`, `"   "`, chuỗi `1` ký tự, chuỗi `256` ký tự, chuỗi hợp lệ) giúp từng điều kiện đơn nhận đủ 2 giá trị `True` và `False` $\Rightarrow$ Đạt **100% Condition Coverage**.

---

## V. THIẾT KẾ FORMAL TEST CASES

| Test Case ID | Test Summary / Description | Pre-condition | Test Steps & Inputs (Test Data) | Expected Result | Pass / Fail |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC_CH_01** | *(Negative)* Tạo chapter với `title` rỗng hoặc chỉ toàn khoảng trắng | Đăng nhập quyền `Mangaka` | 1. Gửi `POST /api/chapters/create` với `title: "   "` | Trả về HTTP `400 Bad Request` với message `"Tiêu đề chapter không được để trống"`. | **Pass** |
| **TC_CH_02** | *(Negative / BVA)* Tạo chapter với `title` có độ dài dưới biên tối thiểu ($1$ ký tự) | Đăng nhập quyền `Mangaka` | 1. Gửi `POST /api/chapters/create` với `title: "A"` | Trả về HTTP `400 Bad Request` với message `"Tiêu đề chapter phải có độ dài từ 2 đến 255 ký tự"`. | **Pass** |
| **TC_CH_03** | *(Negative / BVA)* Tạo chapter với `title` vượt biên tối đa ($256$ ký tự) | Đăng nhập quyền `Mangaka` | 1. Gửi `POST /api/chapters/create` với chuỗi `title` dài `256` ký tự | Trả về HTTP `400 Bad Request` với message `"Tiêu đề chapter phải có độ dài từ 2 đến 255 ký tự"`. | **Pass** |
| **TC_CH_04** | *(Negative)* Tạo chapter với `series_id` không tồn tại trong hệ thống | Đăng nhập quyền `Admin` | 1. Gửi `POST /api/chapters/create` với `series_id: "6a26f54d7049841d96ec0000"`, `title: "Hồi 1"` | Trả về HTTP `404 Not Found` với message `"Không tìm thấy series"`. | **Pass** |
| **TC_CH_05** | *(Negative)* Tạo chapter cho Series mà người dùng không có quyền ghi (`write`) | Đăng nhập quyền `Mangaka` không thuộc dự án Series đó | 1. Gửi `POST /api/chapters/create` với `series_id` hợp lệ của nhóm khác | Hàm `canAccessSeries` từ chối, trả về HTTP `403 Forbidden` (`AUTHZ_SCOPE_DENIED`). | **Pass** |
| **TC_CH_06** | *(Positive / BVA)* Tạo chapter thành công tại biên dưới hợp lệ ($2$ ký tự) & gửi thông báo | Đăng nhập `Mangaka` chủ sở hữu Series (Series có `editor_id`) | 1. Gửi `POST /api/chapters/create` với `series_id` hợp lệ, `chapter_number: 1`, `title: "C1"` | Lưu chapter thành công, gửi notification cho cả `author_id` và `editor_id`, trả về HTTP `201 Created`. | **Pass** |
| **TC_CH_07** | *(Negative)* Cập nhật trạng thái chapter với giá trị `status` không thuộc Enum hợp lệ | Đăng nhập quyền `Tantou Editor`, Chapter tồn tại | 1. Gửi `PUT /api/chapters/update-status/:chapter_id` với body `{"status": "Completed"}` | Trả về HTTP `400 Bad Request` với message `"Trạng thái không hợp lệ"`. | **Pass** |
| **TC_CH_08** | *(Positive)* Cập nhật trạng thái chapter sang `"Waiting Review"` thành công | Đăng nhập quyền `Mangaka`, Chapter đang ở `"In Production"` | 1. Gửi `PUT /api/chapters/update-status/:chapter_id` với body `{"status": "Waiting Review"}` | Cập nhật trạng thái thành công, trả về HTTP `200 OK` với message `"Cập nhật trạng thái chapter thành công"`. | **Pass** |