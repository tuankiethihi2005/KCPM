# BẢNG ĐIỀU KIỆN TEST (TEST CONDITIONS)
**Thành viên thực hiện:** Nguyễn Tuấn Kiệt  
**Chức năng đảm nhận:** Chapter, Page, Status/Version, Delete/Restore, Region & Annotation  

---

### 1. Module Chapter (Tạo & Quản lý Chapter)
| Điều kiện đầu vào (Condition) | Tập hợp Hợp lệ (Valid) | Tag | Tập hợp Không hợp lệ (Invalid) | Tag | Giá trị biên (Boundaries) | Tag |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Chapter Title** | Độ dài 1 - 100 ký tự | V1 | Rỗng / > 100 ký tự | X1, X2 | 1 ký tự, 100 ký tự | B1, B2 |
| **Chapter Number** | Số nguyên dương (> 0) | V2 | Số <= 0 / Chứa chữ, ký tự đặc biệt | X3, X4 | 1 | B3 |
| **Role thực hiện** | Mangaka / Admin | V3 | Assistant / Chưa đăng nhập | X5, X6 | - | - |

---

### 2. Module Page (Upload & Quản lý Trang)
| Điều kiện đầu vào (Condition) | Tập hợp Hợp lệ (Valid) | Tag | Tập hợp Không hợp lệ (Invalid) | Tag | Giá trị biên (Boundaries) | Tag |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Chapter ID** | ID chapter tồn tại trong DB | V4 | ID không tồn tại / Sai định dạng ObjectId | X7, X8 | - | - |
| **Page Number** | Số nguyên dương (> 0) | V5 | Số <= 0 / Trùng số trang đã có | X9, X10 | 1 | B4 |
| **File ảnh Upload** | Định dạng .png, .jpg, .jpeg (< 10MB) | V6 | Định dạng .pdf, .exe / Dung lượng > 10MB | X11, X12 | File kích thước đúng 10MB | B5 |

---

### 3. Module Status & Version (Trạng thái & Phiên bản)
| Điều kiện đầu vào (Condition) | Tập hợp Hợp lệ (Valid) | Tag | Tập hợp Không hợp lệ (Invalid) | Tag | Giá trị biên (Boundaries) | Tag |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Trạng thái Trang** | Các giá trị: `Draft`, `In Review`, `Approved` | V7 | Giá trị không nằm trong Enum quy định | X13 | - | - |
| **Version Trang** | Định dạng chuỗi: `v1.0`, `v2.0` | V8 | Sai định dạng chuỗi | X14 | - | - |

---

### 4. Module Delete & Restore (Xóa & Khôi phục)
| Điều kiện đầu vào (Condition) | Tập hợp Hợp lệ (Valid) | Tag | Tập hợp Không hợp lệ (Invalid) | Tag | Giá trị biên (Boundaries) | Tag |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Target ID** | ID Chapter/Page tồn tại | V9 | ID sai / Đã bị xóa hoàn toàn khỏi DB | X15, X16 | - | - |
| **Role thực hiện** | Tài khoản có quyền (Mangaka/Admin) | V10 | Tài khoản bị từ chối quyền (403 Forbidden) | X17 | - | - |

---

### 5. Module Annotation, Region & History (Ghi chú & Lịch sử)
| Điều kiện đầu vào (Condition) | Tập hợp Hợp lệ (Valid) | Tag | Tập hợp Không hợp lệ (Invalid) | Tag | Giá trị biên (Boundaries) | Tag |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Tọa độ Region (x, y)** | x >= 0, y >= 0 (nằm trong khung ảnh) | V11 | x < 0 hoặc y < 0 | X18 | x = 0, y = 0 | B6 |
| **Nội dung Annotation** | Chuỗi ký tự <= 500 ký tự | V12 | Chuỗi rỗng / > 500 ký tự | X19, X20 | 1 ký tự, 500 ký tự | B7, B8 |
| **Luồng 2 Role** | Phối hợp thao tác giữa Mangaka & Assistant | V13 | User ngoài dự án | X21 | - | - |