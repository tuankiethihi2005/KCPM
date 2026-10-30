# BẢNG THIẾT KẾ TEST CASE CHI TIẾT (TEST CASES)
**Thành viên thực hiện:** Nguyễn Tuấn Kiệt  
**Chức năng đảm nhận:** Chapter, Page, Status/Version, Delete/Restore, Region & Annotation  

---

### 1. Test Cases - Module Chapter (Tạo Chapter)
| Test Case ID | Input (Dữ liệu đầu vào) | Expected Outcome (Kết quả mong đợi) | New Tags Covered |
| :--- | :--- | :--- | :--- |
| **TC_CHP_01** | **Title:** "Chapter 1: Khởi đầu"<br>**Number:** 1<br>**Role:** Mangaka | **Status:** `201 Created`<br>Tạo chapter thành công | V1, V2, V3, B1, B3 |
| **TC_CHP_02** | **Title:** "" (để rỗng)<br>**Number:** 1<br>**Role:** Mangaka | **Status:** `400 Bad Request`<br>Báo lỗi tên chapter không được rỗng | X1 |
| **TC_CHP_03** | **Title:** "Chapter 2"<br>**Number:** -5<br>**Role:** Mangaka | **Status:** `400 Bad Request`<br>Báo lỗi số chapter phải > 0 | X3 |
| **TC_CHP_04** | **Title:** "Chapter 3"<br>**Number:** 3<br>**Role:** Assistant | **Status:** `403 Forbidden`<br>Từ chối quyền tạo chapter của Assistant | X5 |

---

### 2. Test Cases - Module Page (Upload Trang)
| Test Case ID | Input (Dữ liệu đầu vào) | Expected Outcome (Kết quả mong đợi) | New Tags Covered |
| :--- | :--- | :--- | :--- |
| **TC_PAG_01** | **Chapter ID:** "6ae46cb77203134dee32d52f"<br>**Page Number:** 1<br>**File:** `page1.png` (2MB) | **Status:** `201 Created`<br>Upload trang truyện thành công | V4, V5, V6, B4 |
| **TC_PAG_02** | **Chapter ID:** "6ae46cb77203134dee32d52f"<br>**Page Number:** 1 (đã có)<br>**File:** `page1.jpg` | **Status:** `400 Bad Request`<br>Báo lỗi trùng số trang trong chapter | X10 |
| **TC_PAG_03** | **Chapter ID:** "6ae46cb77203134dee32d52f"<br>**Page Number:** 2<br>**File:** `document.pdf` | **Status:** `400 Bad Request`<br>Báo lỗi định dạng file không hợp lệ | X11 |

---

### 3. Test Cases - Module Status & Version (Trạng thái & Phiên bản)
| Test Case ID | Input (Dữ liệu đầu vào) | Expected Outcome (Kết quả mong đợi) | New Tags Covered |
| :--- | :--- | :--- | :--- |
| **TC_VER_01** | **Page ID:** "6ae46cb77203134dee32d537"<br>**Status:** "In Review"<br>**Version:** "v1.0" | **Status:** `200 OK`<br>Cập nhật trạng thái và lưu phiên bản thành công | V7, V8 |
| **TC_VER_02** | **Page ID:** "6ae46cb77203134dee32d537"<br>**Status:** "InvalidStatus"<br>**Version:** "v1.0" | **Status:** `400 Bad Request`<br>Báo lỗi trạng thái không hợp lệ | X13 |

---

### 4. Test Cases - Module Delete & Restore (Xóa & Khôi phục)
| Test Case ID | Input (Dữ liệu đầu vào) | Expected Outcome (Kết quả mong đợi) | New Tags Covered |
| :--- | :--- | :--- | :--- |
| **TC_DEL_01** | **Page ID:** "6ae46cb77203134dee32d537"<br>**Role:** Mangaka<br>**Action:** Soft Delete | **Status:** `200 OK`<br>Xóa tạm thời trang thành công | V9, V10 |
| **TC_DEL_02** | **Page ID:** "6ae46cb77203134dee32d537"<br>**Role:** Assistant<br>**Action:** Delete | **Status:** `403 Forbidden`<br>Trợ lý không có quyền xóa trang | X17 |

---

### 5. Test Cases - Module Annotation & Region (Ghi chú & Lịch sử)
| Test Case ID | Input (Dữ liệu đầu vào) | Expected Outcome (Kết quả mong đợi) | New Tags Covered |
| :--- | :--- | :--- | :--- |
| **TC_ANN_01** | **Page ID:** "6ae46cb77203134dee32d537"<br>**x:** 50, **y:** 50<br>**Content:** "Vẽ lại nét mặt"<br>**Role:** Assistant | **Status:** `201 Created`<br>Tạo ghi chú thành công | V11, V12, V13, B6 |
| **TC_ANN_02** | **Annotation ID:** "6ae47da16639cb9456067333"<br>**Content:** "Đã sửa xong"<br>**Role:** Mangaka | **Status:** `200 OK`<br>Cập nhật nội dung ghi chú thành công | V12 |
| **TC_ANN_03** | **Page ID:** "6ae46cb77203134dee32d537"<br>**x:** -10, **y:** 50<br>**Content:** "Lỗi tọa độ" | **Status:** `400 Bad Request`<br>Báo lỗi tọa độ phải >= 0 | X18 |