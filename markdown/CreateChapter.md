# Mô tả Kiểm thử Chức năng: Tạo Chapter (Create Chapter)

## 1. Tổng quan Chức năng
Chức năng cho phép **Mangaka** tạo một Chapter mới thuộc về một Series truyện đang quản lý.

## 2. Phạm vi Kiểm thử
* Tạo chapter với thông tin hợp lệ (Tên chapter, số thứ tự chapter).
* Kiểm tra các ràng buộc dữ liệu (Tên chapter không được để trống, trùng lặp).
* Phân quyền: Chỉ Mangaka sở hữu Series mới có quyền tạo Chapter.

## 3. Ca kiểm thử (Test Cases)

| Mã TC | Tên ca kiểm thử | Vai trò | Các bước thực hiện | Kết quả mong đợi |
| :--- | :--- | :--- | :--- | :--- |
| **TC-CC-01** | Tạo Chapter thành công | Mangaka | 1. Chọn Series<br>2. Bấm "Tạo Chapter mới"<br>3. Nhập tên Chapter hợp lệ và bấm Lưu | Chapter được tạo thành công với trạng thái Draft. |
| **TC-CC-02** | Tạo Chapter bỏ trống tên | Mangaka | 1. Chọn Series<br>2. Bấm "Tạo Chapter mới"<br>3. Để trống tên Chapter và bấm Lưu | Hệ thống báo lỗi "Tên Chapter không được để trống". |
| **TC-CC-03** | Assistant cố gắng tạo Chapter | Assistant | 1. Đăng nhập tài khoản Assistant<br>2. Truy cập API/Màn hình tạo Chapter | Hệ thống từ chối thao tác (Báo lỗi 403 Forbidden). |