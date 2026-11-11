# Sơ đồ Chuyển đổi Trạng thái & Bảng Quyết định: Giao việc và Sản xuất với Assistant

## 1. Sơ đồ Chuyển đổi Trạng thái (State Transition Table)

### 1.1. Luồng Trạng thái Chapter (Chapter Status Lifecycle)
| Trạng thái hiện tại | Hành động (Trigger) | Trạng thái tiếp theo | Người thực hiện | Điều kiện / Ghi chú |
| :--- | :--- | :--- | :--- | :--- |
| **Draft (Nháp)** | Submit Chapter | **In Review** | Mangaka | Đã upload ít nhất 1 trang |
| **In Review** | Approve (Duyệt) | **Approved** | Mangaka / Editor | Duyệt toàn bộ trang & annotation |
| **In Review** | Reject (Từ chối) | **Draft** | Mangaka / Editor | Yêu cầu Assistant chỉnh sửa lại |
| **Approved** | Publish (Xuất bản) | **Published** | Mangaka | Công khai cho người đọc |
| **Published** | Unpublish / Archive | **Archived** | Mangaka | Ẩn chapter khỏi hệ thống |

---

### 1.2. Luồng Trạng thái Trang truyện (Page Status Lifecycle)
| Trạng thái hiện tại | Hành động (Trigger) | Trạng thái tiếp theo | Người thực hiện | Điều kiện / Ghi chú |
| :--- | :--- | :--- | :--- | :--- |
| **Empty** | Upload Image | **Uploaded** | Mangaka / Assistant | Tải file ảnh trang truyện lên |
| **Uploaded** | Add Annotation | **Annotated** | Assistant | Đã thêm vùng chọn và chú thích |
| **Annotated** | Upload New Version | **Annotated (v+1)** | Assistant | Cập nhật phiên bản mới của trang |
| **Bất kỳ (trừ Deleted)** | Delete Page | **Deleted** | Mangaka | Chuyển trang vào thùng rác |
| **Deleted** | Restore Page | **Uploaded / Annotated** | Mangaka | Khôi phục lại phiên bản trước xóa |

---

## 2. Bảng Quyết định (Decision Table)

### Bảng Quyết định Phân quyền Thao tác theo Vai trò (Role Access Decision Table)

| Điều kiện / Quy tắc | R1 | R2 | R3 | R4 | R5 | R6 |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Tài khoản là Mangaka (Owner)** | Y | Y | N | N | N | N |
| **Tài khoản là Assistant (Được phân công)** | N | N | Y | Y | N | N |
| **Tài khoản là Guest / User thường** | N | N | N | N | Y | N |
| **Thao tác yêu cầu quyền quản trị** *(Xóa/Xuất bản Chapter)* | Y | N | Y | N | N | N |
| **HÀNH ĐỘNG (ACTION)** | | | | | | |
| **Cho phép Tạo/Sửa Chapter & Page** | **X** | **X** | **X** | **X** | | |
| **Cho phép Thêm Region & Annotation** | **X** | **X** | **X** | **X** | | |
| **Cho phép Xóa / Khôi phục / Xuất bản** | **X** | **X** | | | | |
| **Trả về lỗi HTTP 403 Forbidden** | | | **X** *(nếu xóa/publish)* | | **X** | **X** |