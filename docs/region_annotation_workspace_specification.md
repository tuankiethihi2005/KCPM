# TÀI LIỆU ĐẶC TẢ KỸ THUẬT VÀ THIẾT KẾ TEST: KHÔNG GIAN LÀM VIỆC VÙNG VÀ GHI CHÚ (REGION & ANNOTATION WORKSPACE)

## I. XÁC ĐỊNH ĐIỀU KIỆN TEST (TEST CONDITIONS) & CƠ SỞ TEST

* **Cơ sở test (Test Basis):**

  * Mã nguồn định tuyến Backend: `routes/region.routes.js` và `routes/annotation.routes.js`.

  * Mã nguồn xử lý nghiệp vụ Backend: `controllers/region/regionController.js` và `controllers/annotation/annotationController.js` (logic phân vùng trang và ghi chú/annotation).

* **Các điều kiện test (Test Conditions) xác định từ mã nguồn thực tế:**

  * **TCond_RA_01 (Phân quyền & Scope):** Kiểm tra middleware xác thực `requireAuth`, phân quyền `requireRole` (`MANGAKA`, `ASSISTANT`, `TANTOU_EDITOR`, `EDITORIAL_BOARD`, `ADMIN`) và kiểm tra phạm vi quyền trên trang `requirePageScope("page_id", "write")`.

  * **TCond_RA_02 (Xác thực dữ liệu bắt buộc của Region):** Kiểm tra khi tạo vùng mới (`createRegion`), bắt buộc phải có `page_id`, `coordinates`, và `region_type`. Nếu thiếu bất kỳ trường nào, trả về HTTP `400 Bad Request`.

  * **TCond_RA_03 (Kiểm tra tồn tại trang truyện):** Kiểm tra trang `page_id` phải tồn tại trong CSDL (`Page.findById`) trước khi tạo phân vùng (`404 Not Found` nếu không tồn tại).

  * **TCond_RA_04 (Phân quyền thao tác xóa Region):** Kiểm tra quyền xóa vùng (`deleteRegion`): chỉ cho phép chính người tạo vùng đó (`created_by === req.user.id`) hoặc tài khoản có vai trò `Admin` mới được phép xóa (`403 Forbidden` nếu vi phạm).

## II. PHÂN LOẠI CÁC KỸ THUẬT THIẾT KẾ TEST ÁP DỤNG (DYNAMIC TESTING)

1. **Kỹ thuật kiểm thử hộp đen (Specification-based / Black-box - Functional):**

   * *Phân hoạch lớp tương đương (EP) & Phân tích giá trị biên (BVA):* Áp dụng cho các tham số đầu vào như `page_id`, `coordinates` (chuỗi JSON hoặc đối tượng tọa độ), và `region_type`.

   * *Kiểm thử chuyển đổi trạng thái (State Transition Testing):* Vòng đời của các ghi chú (Annotation) từ lúc tạo mới, cập nhật trạng thái (Resolved/Unresolved) đến khi xóa/khôi phục.

   * *Bảng quyết định (Decision Table Testing):* Tổ hợp các điều kiện đầu vào, tồn tại của trang, và quyền sở hữu khi thực hiện xóa vùng (`deleteRegion`).

2. **Kỹ thuật kiểm thử hộp trắng (Structure-based / White-box):**

   * *Kiểm thử luồng điều khiển (Control Flow Testing):* Xây dựng đồ thị luồng điều khiển (CFG) cho hàm `createRegion` và `deleteRegion` trong `regionController.js`, tính độ phức tạp Cyclomatic $V(G)$, đánh giá độ bao phủ câu lệnh (Statement Coverage) và bao phủ nhánh (Branch Coverage).

3. **Kỹ thuật kiểm thử dựa trên kinh nghiệm (Experience-based):**

   * *Đoán lỗi (Error Guessing):* Kiểm tra trường hợp người dùng cố tình xóa vùng do người khác tạo (không phải chủ sở hữu, không phải Admin), hoặc truyền `coordinates` dưới dạng chuỗi sai định dạng.

---

## III. KỸ THUẬT KIỂM THỬ HỘP ĐEN (BLACK-BOX TESTING)

### 1. Phân hoạch lớp tương đương (EP) & Phân tích giá trị biên (BVA)

| Điều kiện đầu vào | Lớp tương đương Hợp lệ (Valid) | Lớp tương đương Không hợp lệ (Invalid) | Giá trị biên (Standard BVA) | 
| ----- | ----- | ----- | ----- | 
| **Tham số `page_id` / `region_id`** | ObjectId hợp lệ 24 ký tự hex có trong CSDL | ObjectId sai định dạng hoặc không tồn tại trong CSDL | ID hợp lệ nhưng không tìm thấy bản ghi (Lỗi `404`), ID sai định dạng (Lỗi `400`) | 
| **Dữ liệu `coordinates` & `region_type`** | Đầy đủ thông tin tọa độ và loại phân vùng | Thiếu `coordinates` hoặc `region_type`, hoặc thiếu `page_id` | Thiếu $1$ trường bắt buộc (Invalid - Lỗi `400`), Đủ $3$ trường (Valid) | 

### 2. Kiểm thử chuyển đổi trạng thái (State Transition Testing) & Bảng quyết định

Áp dụng cho hàm `deleteRegion` (`regionController.js`):

| Điều kiện / Hành động | R1 | R2 | R3 | R4 | 
| ----- | ----- | ----- | ----- | ----- | 
| **C1: Phân vùng tồn tại trong CSDL (`!region` là False)?** | N | Y | Y | Y | 
| **C2: User là người tạo vùng (`region.created_by === req.user.id`)?** | \- | N | N | Y | 
| **C3: User có vai trò `Admin` (`req.user.role === "Admin"`)?** | \- | N | Y | \- | 
| **A1: Trả về `404 Not Found` ("Không tìm thấy phân vùng")** | **X** |  |  |  | 
| **A2: Trả về `403 Forbidden` ("Bạn không có quyền xóa...")** |  | **X** |  |  | 
| **A3: Xóa phân vùng thành công, trả về `200 OK`** |  |  | **X** | **X** | 

---

## IV. KỸ THUẬT KIỂM THỬ HỘP TRẮNG (WHITE-BOX TESTING)

### 1. Phân tích mã nguồn & Đồ thị luồng điều khiển (Control Flow Graph - CFG)

Trích xuất trực tiếp từ hàm `exports.deleteRegion` trong `controllers/region/regionController.js`:

* **Nút 1 (Start):** Nhận `id` từ `req.params`, gọi `PageRegion.findById(id)`.

* **Nút 2 (Điều kiện P1):** `if (!region)` $\rightarrow$ True: **Nút 3** (`return 404`); False: sang Nút 4.

* **Nút 4 (Điều kiện P2):** `if (String(region.created_by) !== req.user.id && req.user.role !== "Admin")` $\rightarrow$ True: **Nút 5** (`return 403`); False: sang Nút 6.

* **Nút 6:** Gọi `PageRegion.findByIdAndDelete(id)`.

* **Nút 7:** Trả về `res.status(200).json({ success: true, ... })`.

* **Nút 8 (End):** Kết thúc hàm (hoặc nhánh `catch` trả về `500`).

```
      (1: Start)
          │
          ▼
     <2: P1 (!region?)> ────(True)───► [3: Return 404 Not Found] ──────────────┐
          │ (False)                                                             │
          ▼                                                                     │
     <4: P2 (Not Creator & Not Admin?)> ─(True)──► [5: Return 403 Forbidden] ───┤
          │ (False)                                                             │
          ▼                                                                     │
     [6: Delete Region in DB]                                                   │
          │                                                                     │
          ▼                                                                     │
     [7: Return 200 OK Success]                                                 │
          │                                                                     │
          └─────────────────────────────────────────────────────────────────────┴──► (8: End)

```

### 2. Tính độ phức tạp Cyclomatic $V(G)$

* **Số nút ($N$):** $8$ nút.
* **Số cạnh ($E$):** $10$ cạnh.
* **Số nút điều kiện ($P$):** $2$ nút điều kiện (P1 và P2).
* **Số miền ($R$):** $3$ miền.
* Áp dụng công thức:
  * $V(G) = E - N + 2 = 10 - 8 + 2 = 4$
  * $V(G) = P + 1 = 2 + 1 = 3$ (tính trên các luồng quyết định logic chính).
* **Kết luận:** Độ phức tạp Cyclomatic của hàm `deleteRegion` là $V(G) = 3 \Rightarrow$ Cần tối thiểu **3 test cases** để bao phủ toàn bộ các nhánh rẽ điều kiện.

---

## V. THIẾT KẾ FORMAL TEST CASES

| Test Case ID | Test Summary / Description | Pre-condition | Test Steps & Inputs (Test Data) | Expected Result | Pass / Fail |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC_RA_01** | *(Negative)* Tạo phân vùng thiếu trường bắt buộc (`coordinates`) | Đăng nhập quyền `Mangaka` | 1. Gửi `POST /api/regions/page/:page_id` thiếu `coordinates` | Trả về HTTP `400 Bad Request` với message thiếu thông tin bắt buộc. | **Pass** |
| **TC_RA_02** | *(Negative)* Tạo phân vùng với `page_id` không tồn tại trong CSDL | Đăng nhập quyền `Mangaka` | 1. Gửi `POST /api/regions/page/6a3424495bed29d138ba0000` với body hợp lệ | Trả về HTTP `404 Not Found` với message `"Không tìm thấy trang truyện"`. | **Pass** |
| **TC_RA_03** | *(Positive)* Tạo phân vùng (Region) mới thành công | Đăng nhập quyền `Mangaka`, có quyền ghi (`write`) trên page | 1. Gửi `POST /api/regions/page/:page_id` với `coordinates` và `region_type: "dialogue"` | Tạo bản ghi phân vùng thành công, trả về HTTP `201 Created`. | **Pass** |
| **TC_RA_04** | *(Negative)* Xóa phân vùng không tồn tại trong hệ thống | Đăng nhập quyền `Admin` | 1. Gửi `DELETE /api/regions/6a3424495bed29d138ba0000` | Trả về HTTP `404 Not Found` với message `"Không tìm thấy phân vùng"`. | **Pass** |
| **TC_RA_05** | *(Negative)* Người dùng thường cố gắng xóa phân vùng do người khác tạo | Đăng nhập tài khoản `Mangaka B` (không tạo phân vùng đó, không phải Admin) | 1. Gửi `DELETE /api/regions/:region_id` của `Mangaka A` | Trả về HTTP `403 Forbidden` với message `"Bạn không có quyền xóa phân vùng này"`. | **Pass** |
| **TC_RA_06** | *(Positive)* Admin hoặc chính chủ tạo vùng tiến hành xóa thành công | Đăng nhập tài khoản `Admin` hoặc chính chủ `Mangaka A` | 1. Gửi `DELETE /api/regions/:region_id` | Xóa thành công bản ghi trong CSDL, trả về HTTP `200 OK`. | **Pass** |
| **TC_RA_07** | *(Positive)* Lấy danh sách phân vùng theo trang truyện thành công | Đăng nhập tài khoản có quyền đọc (`read`) | 1. Gửi `GET /api/regions/page/:page_id` | Trả về HTTP `200 OK` kèm mảng danh sách các phân vùng đã tạo. | **Pass** |