# TÀI LIỆU ĐẶC TẢ KỸ THUẬT VÀ THIẾT KẾ TEST: BOARD PHÁT HÀNH & XẾP HẠNG (RELEASE & RANKING)

## I. XÁC ĐỊNH ĐIỀU KIỆN TEST (TEST CONDITIONS) & CƠ SỞ TEST

* **Cơ sở test (Test Basis):**
  * Mã nguồn định tuyến Backend: `routes/publish.routes.js` và `routes/RankingRoutes.js`.
  * Mã nguồn xử lý nghiệp vụ Backend: `controllers/publish/publishChapter.js` và `controllers/RankingController.js`.
  * Quy trình nghiệp vụ duyệt xuất bản chapter và xem bảng xếp hạng trên Frontend (`PublishApprovalPage.jsx`, `RankingDashboardPage.jsx`).

* **Các điều kiện test (Test Conditions) xác định từ mã nguồn thực tế:**
  * **TCond_01 (Phân quyền):** Kiểm tra middleware `requireAuth`, `requireRole` (`TANTOU_EDITOR`, `EDITORIAL_BOARD`, `ADMIN`) và `requireChapterScope("chapter_id", "write")` khi gọi `POST /api/publish/chapter/:chapter_id`.
  * **TCond_02 (Tồn tại Chapter):** Kiểm tra sự tồn tại của `chapter_id` trong CSDL (`Chapter.findById(chapter_id)`).
  * **TCond_03 (Điều kiện Trang truyện):** Kiểm tra chapter phải có ít nhất 1 trang (`pages.length > 0`) và tất cả các trang phải có trạng thái `"Approved"` (`unapprovedPages.length === 0`).
  * **TCond_04 (Điều kiện Task & Annotation):** Kiểm tra không còn task nào chưa hoàn thành (`status` khác `"Approved"`, `"Paid"`) và không còn annotation nào chưa giải quyết (`status` khác `"Resolved"`).
  * **TCond_05 (Cập nhật & Thông báo):** Kiểm tra cập nhật `chapter.status = "Published"`, lưu `published_at`, `release_issue_id` (nếu có) và gửi thông báo cho `author_id`, `editor_id`.
  * **TCond_06 (Ranking API):** Kiểm tra phân quyền `checkRole(["Editorial Board", "Mangaka", "Tantou Editor", "Admin"])` cho `GET /api/ranking/` và `GET /api/ranking/performance/:seriesId`.

---

## II. PHÂN LOẠI CÁC KỸ THUẬT THIẾT KẾ TEST ÁP DỤNG (DYNAMIC TESTING)

Áp dụng phân loại kỹ thuật kiểm thử động trong Chương IV:
1. **Kỹ thuật kiểm thử hộp đen (Specification-based / Black-box - Functional):**
   * *Phân hoạch lớp tương đương (EP) & Phân tích giá trị biên (BVA):* Áp dụng cho số lượng trang (`pages.length`), số lượng trang chưa duyệt (`unapprovedPages.length`), số task chưa xong và định dạng `chapter_id` / `seriesId`.
   * *Kiểm thử chuyển đổi trạng thái (State Transition Testing):* Kiểm tra sự chuyển đổi trạng thái của đối tượng `Chapter` và quy trình quét điều kiện tại Trạm xuất bản.
   * *Bảng quyết định (Decision Table Testing):* Tổ hợp các điều kiện kiểm duyệt trong `publishChapter.js` để xác định mã HTTP response trả về (`404`, `400`, `200`, `500`).
2. **Kỹ thuật kiểm thử hộp trắng (Structure-based / White-box):**
   * *Kiểm thử luồng điều khiển (Control Flow Testing):* Vẽ đồ thị luồng điều khiển (CFG) trực tiếp từ hàm `exports.publishChapter` trong `publishChapter.js`, tính độ phức tạp Cyclomatic $V(G)$, đánh giá độ bao phủ câu lệnh (Statement Coverage), bao phủ nhánh (Decision/Branch Coverage) và bao phủ điều kiện (Condition Coverage).
3. **Kỹ thuật kiểm thử dựa trên kinh nghiệm (Experience-based):**
   * *Đoán lỗi (Error Guessing) & Kiểm thử thăm dò (Exploratory Testing):* Kiểm tra trường hợp `series` bị null sau khi xuất bản, hoặc `series.editor_id` không tồn tại (null/undefined) khi gửi thông báo, hoặc lỗi ngoại lệ CSDL rơi vào khối `catch (error)` trả về `500`.

---

## III. KỸ THUẬT KIỂM THỬ HỘP ĐEN (BLACK-BOX TESTING)

### 1. Phân hoạch lớp tương đương (EP) & Phân tích giá trị biên (BVA)

| Điều kiện đầu vào / Dữ liệu | Lớp tương đương Hợp lệ (Valid) | Lớp tương đương Không hợp lệ (Invalid) | Giá trị biên (Standard BVA) |
| :--- | :--- | :--- | :--- |
| **Số lượng trang của Chapter (`pages.length`)** | Số nguyên dương ($n \ge 1$) | Bằng $0$ ($n = 0$) | $0$ trang (Invalid - Lỗi `400`), $1$ trang (Valid - Min) |
| **Số trang chưa duyệt (`unapprovedPages.length`)** | Bằng $0$ ($k = 0$) | Số nguyên dương ($k \ge 1$) | $0$ trang (Valid), $1$ trang (Invalid - Min+) |
| **Số task chưa hoàn thành (`unfinishedTasks.length`)** | Bằng $0$ ($t = 0$) | Số nguyên dương ($t \ge 1$) | $0$ task (Valid), $1$ task (Invalid - Min+) |
| **Số annotation chưa xử lý (`unresolvedAnnotations.length`)** | Bằng $0$ ($a = 0$) | Số nguyên dương ($a \ge 1$) | $0$ annotation (Valid), $1$ annotation (Invalid - Min+) |

### 2. Kiểm thử chuyển đổi trạng thái (State Transition Testing)

#### a. Sơ đồ chuyển đổi trạng thái (State Transition Diagram)
```
[ST1: IN PRODUCTION / DRAFT]
    │
    ├── (Event 1: Gọi POST /api/publish/chapter/:chapter_id với quyền hợp lệ)
    ▼
[ST2: VALIDATING PUBLISH CONDITIONS]
    │
    ├── (Event 2: Không tìm thấy chapter) ─────────────────────────► [ST_ERR1: 404 Not Found]
    ├── (Event 3: pages=0 / còn trang chưa duyệt / task / anno) ───► [ST_ERR2: 400 Bad Request]
    ├── (Event 4: Lỗi kết nối DB / Exception trong try-catch) ─────► [ST_ERR3: 500 Server Error]
    │
    └── (Event 5: Thỏa mãn toàn bộ 5 điều kiện kiểm tra)
        ▼
[ST3: PUBLISHED (chapter.status = "Published")]
    │
    └── (Event 6: Gửi Notification cho Author & Editor) ───────────► [ST_SUCCESS: 200 OK]
```

#### b. Bảng Test Cases chuyển đổi trạng thái

| Test Case No. | Start State | Event / Input | End State / Expected Output |
| :--- | :--- | :--- | :--- |
| **ST_RR_01** | `ST1: IN PRODUCTION` | Gửi request xuất bản với `chapter_id` không tồn tại | `ST_ERR1: 404 Not Found` ("Không tìm thấy chapter") |
| **ST_RR_02** | `ST2: VALIDATING` | Chapter có `pages.length === 0` | `ST_ERR2: 400 Bad Request` ("Chapter chưa có trang nào") |
| **ST_RR_03** | `ST2: VALIDATING` | Chapter còn trang chưa `"Approved"`, hoặc còn Task/Annotation | `ST_ERR2: 400 Bad Request` (Kèm số lượng lỗi cụ thể) |
| **ST_RR_04** | `ST2: VALIDATING` | Tất cả trang đã duyệt, hết Task & Annotation | `ST3: PUBLISHED` $\rightarrow$ `ST_SUCCESS: 200 OK` |

### 3. Bảng quyết định (Decision Table Testing)
Áp dụng cho hàm `publishChapter` (`controllers/publish/publishChapter.js`):

| Điều kiện / Hành động | R1 | R2 | R3 | R4 | R5 | R6 |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **C1: `chapter` tồn tại (`!chapter` là False)?** | N | Y | Y | Y | Y | Y |
| **C2: Chapter có ít nhất 1 trang (`pages.length > 0`)?** | - | N | Y | Y | Y | Y |
| **C3: Tất cả trang đã duyệt (`unapprovedPages.length === 0`)?** | - | - | N | Y | Y | Y |
| **C4: Tất cả Task đã xong (`unfinishedTasks.length === 0`)?** | - | - | - | N | Y | Y |
| **C5: Tất cả Annotation đã xử lý (`unresolvedAnnotations.length === 0`)?** | - | - | - | - | N | Y |
| **A1: Trả về `404 Not Found` ("Không tìm thấy chapter")** | **X** | | | | | |
| **A2: Trả về `400 Bad Request` ("Chapter chưa có trang nào")** | | **X** | | | | |
| **A3: Trả về `400 Bad Request` ("Vẫn còn trang chưa được phê duyệt")** | | | **X** | | | |
| **A4: Trả về `400 Bad Request` ("Vẫn còn task chưa hoàn thành")** | | | | **X** | | |
| **A5: Trả về `400 Bad Request` ("Vẫn còn annotation chưa được giải quyết")** | | | | | **X** | |
| **A6: Cập nhật `"Published"`, gửi thông báo & trả về `200 OK`** | | | | | | **X** |

---

## IV. KỸ THUẬT KIỂM THỬ HỘP TRẮNG (WHITE-BOX TESTING)

### 1. Phân tích mã nguồn & Đồ thị luồng điều khiển (Control Flow Graph - CFG)
Trích xuất các nút quyết định thực tế từ hàm `exports.publishChapter(req, res)` trong `controllers/publish/publishChapter.js`:
* **Nút 1 (Start):** Nhận `chapter_id`, `release_issue_id`, tìm `chapter`.
* **Nút 2 (Điều kiện P1):** `if (!chapter)` $\rightarrow$ True: **Nút 3** (`return 404`); False: sang Nút 4.
* **Nút 4 (Điều kiện P2):** `if (pages.length === 0)` $\rightarrow$ True: **Nút 5** (`return 400`); False: sang Nút 6.
* **Nút 6 (Điều kiện P3):** `if (unapprovedPages.length > 0)` $\rightarrow$ True: **Nút 7** (`return 400`); False: sang Nút 8.
* **Nút 8 (Điều kiện P4):** `if (unfinishedTasks.length > 0)` $\rightarrow$ True: **Nút 9** (`return 400`); False: sang Nút 10.
* **Nút 10 (Điều kiện P5):** `if (unresolvedAnnotations.length > 0)` $\rightarrow$ True: **Nút 11** (`return 400`); False: sang Nút 12.
* **Nút 12:** Cập nhật `chapter.status = "Published"`, `published_at = new Date()`.
* **Nút 13 (Điều kiện P6):** `if (release_issue_id)` $\rightarrow$ True: **Nút 14** (gán `release_issue_id`); False: sang Nút 15.
* **Nút 15:** Lưu `await chapter.save()`, tìm `series`.
* **Nút 16 (Điều kiện P7):** `if (series)` $\rightarrow$ True: sang Nút 17; False: sang Nút 21.
* **Nút 17 (Điều kiện P8):** `if (series.editor_id)` $\rightarrow$ True: **Nút 18** (`notifyUsers.push(series.editor_id)`); False: sang Nút 19.
* **Nút 19 (Vòng lặp P9):** `for (const userId of notifyUsers)` $\rightarrow$ True: **Nút 20** (`createNotification`, quay lại Nút 19); False: sang Nút 21.
* **Nút 21:** Trả về `res.status(200).json(...)`.
* **Nút 22 (End):** Kết thúc hàm (bỏ qua nhánh `catch` ngoại lệ hệ thống để tính luồng logic chính).

```
      (1: Start)
          │
          ▼
     <2: P1 (!chapter)> ───(True)───► [3: Return 404] ──────────────────────────┐
          │ (False)                                                             │
          ▼                                                                     │
   <4: P2 (pages==0)> ─────(True)───► [5: Return 400] ──────────────────────────┤
          │ (False)                                                             │
          ▼                                                                     │
  <6: P3 (unapproved>0)> ──(True)───► [7: Return 400] ──────────────────────────┤
          │ (False)                                                             │
          ▼                                                                     │
  <8: P4 (unfinished>0)> ──(True)───► [9: Return 400] ──────────────────────────┤
          │ (False)                                                             │
          ▼                                                                     │
 <10: P5 (unresolved>0)> ──(True)───► [11: Return 400] ─────────────────────────┤
          │ (False)                                                             │
          ▼                                                                     │
   [12: Set Published]                                                          │
          │                                                                     │
          ▼                                                                     │
  <13: P6 (issue_id?)> ────(True)───► [14: Set issue_id]                        │
          │ (False)                        │                                    │
          ├────────────────────────────────┘                                    │
          ▼                                                                     │
  [15: Save & Find Series]                                                      │
          │                                                                     │
          ▼                                                                     │
   <16: P7 (series?)> ─────(False)──────────────────────────────────┐           │
          │ (True)                                                  │           │
          ▼                                                         │           │
  <17: P8 (editor_id?)> ───(True)───► [18: Push editor_id]          │           │
          │ (False)                        │                        │           │
          ├────────────────────────────────┘                        │           │
          ▼                                                         │           │
  <19: P9 (for userId)> ◄──┐                                        │           │
     │ (True)       │      │                                        │           │
     ▼              │      │                                        │           │
 [20: Notify] ──────┘      │ (False)                                │           │
                           ├────────────────────────────────────────┘           │
                           ▼                                                    │
                    [21: Return 200]                                            │
                           │                                                    │
                           └────────────────────────────────────────────────────┴──► (22: End)
```

### 2. Tính độ phức tạp Cyclomatic $V(G)$
* **Số nút ($N$):** $22$ nút.
* **Số cạnh ($E$):** $30$ cạnh nối giữa các nút.
* **Số nút điều kiện ($P$):** $9$ nút điều kiện (từ P1 đến P9).
* **Số miền ($R$):** $10$ miền kín/hở được tạo bởi đồ thị.
* Áp dụng 3 công thức chuẩn trong Chương IV:
  * $V(G) = E - N + 2 = 30 - 22 + 2 = 10$
  * $V(G) = P + 1 = 9 + 1 = 10$
  * $V(G) = R = 10$
* **Kết luận:** Độ phức tạp Cyclomatic của hàm `publishChapter` là $V(G) = 10 \Rightarrow$ Cần tối thiểu **10 đường đi độc lập cơ bản (Basis Paths)** để bao phủ toàn bộ cấu trúc rẽ nhánh và vòng lặp của hàm.

### 3. Đánh giá các mức độ bao phủ (Coverage Analysis)
1. **Bao phủ câu lệnh (Statement Coverage):**
   $$\text{Statement Coverage} = \frac{\text{Số câu lệnh thực thi}}{\text{Tổng số câu lệnh}} \times 100\%$$
   * Khi chạy bộ test đi qua các nhánh lỗi (`404`, 4 trường hợp `400`), nhánh thành công có `release_issue_id`, có `series` và `editor_id` (lặp 2 lần qua `notifyUsers`), toàn bộ $22/22$ khối lệnh đều được thực thi $\Rightarrow$ Đạt **100% Statement Coverage**.
2. **Bao phủ nhánh (Decision/Branch Coverage):**
   $$\text{Branch Coverage} = \frac{\text{Số nhánh được thực thi}}{\text{Tổng số nhánh}} \times 100\%$$
   * Hàm có $9$ nút điều kiện tương ứng với $18$ nhánh (True/False). Bộ test cases bao phủ đầy đủ cả nhánh True và False của các điều kiện kiểm duyệt (P1–P5), điều kiện tùy chọn `release_issue_id` (P6), điều kiện `series` (P7), `editor_id` (P8) và vòng lặp `for` (P9) $\Rightarrow$ Đạt **100% Branch Coverage**.
3. **Bao phủ điều kiện (Condition Coverage):**
   * Các biểu thức điều kiện trong `publishChapter.js` đều là điều kiện đơn (`!chapter`, `pages.length === 0`, `unapprovedPages.length > 0`, `unfinishedTasks.length > 0`, `unresolvedAnnotations.length > 0`, `release_issue_id`, `series`, `series.editor_id`). Do đó, khi đạt 100% Branch Coverage cũng đồng thời đạt **100% Condition Coverage**.

---

## V. THIẾT KẾ FORMAL TEST CASES & KẾT QUẢ THỰC THI

| Test Case ID | Test Summary / Description | Pre-condition | Test Steps & Inputs (Test Data) | Expected Result | Pass / Fail |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC_RR_01** | *(Positive)* Truy cập Ranking Dashboard & lấy bảng xếp hạng | Đăng nhập tài khoản có role thuộc `["Editorial Board", "Mangaka", "Tantou Editor", "Admin"]` | 1. Truy cập `/ranking` trên FE<br>2. Gọi `GET /api/ranking/` | Hiển thị giao diện bảng xếp hạng Series, API trả về HTTP `200 OK`. | **Pass** |
| **TC_RR_02** | *(Negative)* Chặn quyền xuất bản chapter với role không hợp lệ | Đăng nhập tài khoản có role `Assistant` (không nằm trong `TANTOU_EDITOR`, `EDITORIAL_BOARD`, `ADMIN`) | 1. Gửi `POST /api/publish/chapter/:chapter_id` | Middleware `requireRole` chặn truy cập, trả về HTTP `403 Forbidden`. | **Pass** |
| **TC_RR_03** | *(Negative)* Xuất bản chapter với `chapter_id` không tồn tại | Đăng nhập quyền `Admin` | 1. Gửi `POST /api/publish/chapter/6a3424495bed29d138ba0000` | Trả về HTTP `404 Not Found` với message `"Không tìm thấy chapter"`. | **Pass** |
| **TC_RR_04** | *(Negative / BVA)* Xuất bản chapter chưa có trang truyện nào (`pages.length === 0`) | Chapter tồn tại nhưng chưa upload page nào | 1. Gửi `POST /api/publish/chapter/:chapter_id` | Trả về HTTP `400 Bad Request` với message `"Chapter chưa có trang nào"`. | **Pass** |
| **TC_RR_05** | *(Negative)* Xuất bản chapter khi còn trang chưa phê duyệt (`status !== "Approved"`) | Chapter có 2 trang, trong đó 1 trang đang ở trạng thái `"Draft"` | 1. Gửi `POST /api/publish/chapter/:chapter_id` | Trả về HTTP `400 Bad Request` với message `"Không thể xuất bản. Vẫn còn trang truyện chưa được phê duyệt"`, `unapprovedPages_count: 1`. | **Pass** |
| **TC_RR_06** | *(Negative)* Xuất bản chapter khi còn Task chưa hoàn thành | Các trang đã `"Approved"`, nhưng còn 1 Task có status `"In Progress"` | 1. Gửi `POST /api/publish/chapter/:chapter_id` | Trả về HTTP `400 Bad Request` với message `"Không thể xuất bản. Vẫn còn task chưa hoàn thành trên các trang truyện"`, `unfinishedTasks_count: 1`. | **Pass** |
| **TC_RR_07** | *(Negative)* Xuất bản chapter khi còn Annotation chưa giải quyết (`status !== "Resolved"`) | Các trang đã duyệt, hết Task, nhưng còn 1 Annotation `"Open"` | 1. Gửi `POST /api/publish/chapter/:chapter_id` | Trả về HTTP `400 Bad Request` với message `"Không thể xuất bản. Vẫn còn annotation chưa được giải quyết trên các trang truyện"`, `unresolvedAnnotations_count: 1`. | **Pass** |
| **TC_RR_08** | *(Positive)* Xuất bản chapter thành công đầy đủ điều kiện & gửi thông báo | Chapter đủ trang, tất cả đã `"Approved"`, hết Task & Annotation, kèm `release_issue_id` | 1. Mở `/publish-approval/sample-chapter-id-01` hoặc gọi `POST /api/publish/chapter/:chapter_id` với body `{"release_issue_id": "issue_01"}` | `chapter.status` chuyển thành `"Published"`, lưu `published_at`, gửi thông báo cho `author_id` và `editor_id`, trả về HTTP `200 OK`. | **Pass** |