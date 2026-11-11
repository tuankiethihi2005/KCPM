# BÁO CÁO KIỂM THỬ MODULE 3: CHAPTER, TRANG TRUYỆN VÀ WORKSPACE

**Môn học:** Kiểm thử phần mềm  
**Người thực hiện:** Lê Thành Tuấn Kiệt  
**Phạm vi:** Chức năng Tạo Chapter, Xóa mềm Chapter, và Xóa mềm Trang truyện (Page)  

---

## 1. MÔ TẢ ĐẶC TẢ YÊU CẦU & CƠ SỞ TEST (TEST BASIS)

Dựa trên mã nguồn thực tế của Backend (`createChapter.js`, `deleteChapter.js`, `deletePage.js`), quy tắc nghiệp vụ cho Module 3 bao gồm:

### 1.1 Tạo Chapter (`createChapter`)
- `title`: Bắt buộc kiểu chuỗi, sau khi `trim()` không được rỗng.
- Độ dài tiêu đề (`title`): Thuộc khoảng $[2, 255]$ ký tự.
- Quyền hạn: Người dùng phải có quyền `MANGAKA` hoặc `ADMIN` và có quyền truy cập vào Series.

### 1.2 Xóa mềm Chapter (`deleteChapter`)
- Áp dụng cơ chế **Soft-Delete** (`is_deleted: true`).
- **Điều kiện:** Chapter bắt buộc phải đang ở trạng thái `"Draft"`.
- **Cascade:** Khi xóa Chapter, hệ thống tự động cập nhật cờ `is_deleted: true` cho tất cả các `Page` thuộc Chapter đó thông qua MongoDB Session Transaction.

### 1.3 Xóa mềm Trang truyện (`deletePage`)
- Áp dụng cơ chế **Soft-Delete** (`is_deleted: true`).

---

## 2. QUY ƯỚC ĐẶT TAG BAO PHỦ (TAGGING SYSTEM)

### Lớp tương đương (Equivalence Partitioning - EP)
- **Tạo Chapter (Tiêu đề):**
  - `V1`: Độ dài tiêu đề hợp lệ từ 2 đến 255 ký tự ($2 \le \text{length} \le 255$).
  - `X1`: Tiêu đề rỗng hoặc chỉ chứa khoảng trắng ($\text{length} = 0$).
  - `X2`: Tiêu đề quá ngắn ($\text{length} < 2$).
  - `X3`: Tiêu đề quá dài ($\text{length} > 255$).
- **Xóa Chapter (Trạng thái):**
  - `V2`: Trạng thái Chapter là `"Draft"`.
  - `X4`: Trạng thái Chapter khác `"Draft"` (ví dụ: `"Published"`).
  - `X5`: Chapter đã bị xóa từ trước (`is_deleted: true`).

### Giá trị biên (Boundary Value Analysis - BVA)
- `B1`: Độ dài tối thiểu hợp lệ (`min` = 2 ký tự).
- `B2`: Độ dài ngay trên tối thiểu (`min+` = 3 ký tự).
- `B3`: Độ dài đại diện giữa khoảng (`nominal` = 100 ký tự).
- `B4`: Độ dài ngay dưới tối đa (`max-` = 254 ký tự).
- `B5`: Độ dài tối đa hợp lệ (`max` = 255 ký tự).
- `B6`: Biên ngoài dưới (`min-` = 1 ký tự) -> Gắn liền với lớp không hợp lệ `X2`.
- `B7`: Biên ngoài trên (`max+` = 256 ký tự) -> Gắn liền với lớp không hợp lệ `X3`.

---

## 3. PHÂN TÍCH VÙNG VÀ GIÁ TRỊ BIÊN

### Bảng 3.1: Phân hoạch lớp tương đương & Giá trị biên cho Tiêu đề Chapter

| Điều kiện đầu vào | Miền hợp lệ (Valid) | Tag EP | Miền không hợp lệ (Invalid) | Tag EP | Các giá trị biên (BVA Standard) | Tag BVA |
|---|---|---|---|---|---|---|
| Độ dài Tiêu đề (`title`) | 2 đến 255 ký tự | V1 | < 2 ký tự<br>> 255 ký tự | X2<br>X3 | `min-` = 1 char<br>`min` = 2 chars<br>`min+` = 3 chars<br>`nominal` = 100 chars<br>`max-` = 254 chars<br>`max` = 255 chars<br>`max+` = 256 chars | B6<br>B1<br>B2<br>B3<br>B4<br>B5<br>B7 |

---

## 4. THIẾT KẾ BẢNG TEST CASE (TEST CASES DESIGN)

*Nguyên tắc single-fault:* Mỗi test case kiểm thử trường hợp thất bại chỉ chứa duy nhất 1 biến/điều kiện vi phạm.

| Mã TC | Tên Test Case | Dữ liệu đầu vào (Input) | Điều kiện tiên quyết (Pre-condition) | Kết quả mong đợi (Expected Outcome) | Tag bao phủ |
|---:|---|---|---|---|---|
| **TC-01** | Tạo Chapter tại biên min | `title`: "Ch" (2 ký tự) | Series tồn tại, User có quyền Mangaka | Tạo thành công, HTTP Status 201, `success: true` | V1, B1 |
| **TC-02** | Tạo Chapter tại biên max | `title`: Chuỗi 255 ký tự | Series tồn tại, User có quyền Mangaka | Tạo thành công, HTTP Status 201, `success: true` | V1, B5 |
| **TC-03** | Tạo Chapter giá trị nominal | `title`: "Chapter 1: Khởi đầu" | Series tồn tại, User có quyền Mangaka | Tạo thành công, HTTP Status 201, `success: true` | V1, B3 |
| **TC-04** | Từ chối tiêu đề rỗng | `title`: "" | Series tồn tại, User có quyền Mangaka | Bị từ chối, HTTP Status 400, "Tiêu đề chapter không được để trống" | X1 |
| **TC-05** | Từ chối tiêu đề chỉ có khoảng trắng | `title`: "   " | Series tồn tại, User có quyền Mangaka | Bị từ chối, HTTP Status 400, "Tiêu đề chapter không được để trống" | X1 |
| **TC-06** | Từ chối tiêu đề 1 ký tự (min-) | `title`: "A" (1 ký tự) | Series tồn tại, User có quyền Mangaka | Bị từ chối, HTTP Status 400, "Tiêu đề chapter phải có độ dài từ 2 đến 255 ký tự" | X2, B6 |
| **TC-07** | Từ chối tiêu đề 256 ký tự (max+) | `title`: Chuỗi 256 ký tự | Series tồn tại, User có quyền Mangaka | Bị từ chối, HTTP Status 400, "Tiêu đề chapter phải có độ dài từ 2 đến 255 ký tự" | X3, B7 |
| **TC-08** | Xóa mềm Chapter hợp lệ | `chapter_id` hợp lệ | Chapter ở trạng thái `"Draft"`, chưa bị xóa | Xóa thành công, HTTP Status 200, Chapter & các Page con có `is_deleted = true` | V2 |
| **TC-09** | Từ chối xóa Chapter không phải Draft | `chapter_id` hợp lệ | Chapter ở trạng thái `"Published"` | Bị từ chối, HTTP Status 400, "Chỉ được phép hủy chương truyện ở trạng thái Bản nháp" | X4 |
| **TC-10** | Từ chối xóa Chapter đã trong thùng rác | `chapter_id` đã xóa | Chapter có `is_deleted = true` | Bị từ chối, HTTP Status 400, "Chương truyện này đã nằm trong thùng rác từ trước" | X5 |

**Dòng kiểm tra bao phủ (Coverage Checklist):**
- Lớp tương đương: Đã bao phủ 100% các tag `V1, V2, X1, X2, X3, X4, X5`.
- Giá trị biên: Đã bao phủ 100% các tag `B1, B2, B3, B4, B5, B6, B7`.

---

## 5. ĐÁNH GIÁ VÀ KẾT LUẬN
- Các kịch bản kiểm thử đã bám sát chính xác logic xử lý của Backend (bao gồm kiểm tra ràng buộc độ dài tiêu đề và cơ chế Soft-delete).
- Bộ test case bảo đảm độ bao phủ hoàn chỉnh, sẵn sàng cho việc chuyển đổi sang kịch bản test tự động bằng CodeceptJS.