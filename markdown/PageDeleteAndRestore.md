# Mô tả Kiểm thử Chức năng: Xóa và Khôi phục Trang (Page Delete & Restore)

## 1. Tổng quan Chức năng
Chức năng cho phép **Mangaka** thực hiện xóa các trang truyện không phù hợp khỏi Chapter (chuyển vào trạng thái tạm xóa) và khôi phục lại khi cần thiết.

## 2. Phạm vi Kiểm thử
* Thực hiện xóa mềm (Soft Delete) trang truyện.
* Thực hiện khôi phục (Restore) trang đã xóa về trạng thái ban đầu.
* Phân quyền: Chỉ Mangaka sở hữu Series mới có quyền xóa và khôi phục trang.

## 3. Ca kiểm thử (Test Cases)

| Mã TC | Tên ca kiểm thử | Vai trò | Các bước thực hiện | Kết quả mong đợi |
| :--- | :--- | :--- | :--- | :--- |
| **TC-PDR-01** | Xóa trang truyện | Mangaka | 1. Chọn trang truyện cần xóa<br>2. Nhấn biểu tượng Thùng rác (Delete)<br>3. Xác nhận Xóa | Trang được chuyển sang trạng thái `Deleted` và ẩn khỏi giao diện hiển thị chính. |
| **TC-PDR-02** | Khôi phục trang đã xóa | Mangaka | 1. Mở danh sách trang đã xóa<br>2. Chọn trang cần khôi phục<br>3. Bấm "Restore" | Trang được khôi phục về trạng thái trước đó (Uploaded/Annotated) thành công. |
| **TC-PDR-03** | Assistant cố gắng xóa trang | Assistant | 1. Đăng nhập tài khoản Assistant<br>2. Thực hiện thao tác xóa trang truyện | Hệ thống từ chối thao tác (Báo lỗi 403 Forbidden). |