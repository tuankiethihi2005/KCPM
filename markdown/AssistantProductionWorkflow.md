# Mô tả Kiểm thử Chức năng: Giao việc và Sản xuất với Assistant

## 1. Tổng quan Chức năng
Chức năng này cho phép **Mangaka** phân công các công việc liên quan đến sản xuất truyện (tạo chapter, chỉnh sửa trang, đánh giá annotation) cho **Assistant**, đồng thời đảm bảo kiểm thử trọn luồng quy trình làm việc giữa hai tài khoản qua các vai trò (roles) khác nhau.

## 2. Phạm vi Kiểm thử (Scope)
* **Tạo và Quản lý Chapter:** Tạo mới chapter, cập nhật trạng thái chapter.
* **Quản lý Trang (Pages):** Upload file trang truyện, quản lý phiên bản (versioning), trạng thái trang, xóa và khôi phục trang.
* **Vùng tương tác & Chú thích (Region & Annotation):** Đánh dấu vùng trên trang truyện, thêm/chỉnh sửa chú thích (annotation).
* **Lịch sử trang:** Theo dõi lịch sử thay đổi của từng trang truyện.
* **Phân quyền người dùng (Role Access):** Kiểm thử trọn vòng quy trình giữa tài khoản Mangaka và Assistant.

## 3. Danh sách Ca kiểm thử (Test Cases)

| Mã TC | Tên ca kiểm thử | Vai trò thực hiện | Bước thực hiện | Kết quả mong đợi |
| :--- | :--- | :--- | :--- | :--- |
| **TC-APW-01** | Tạo Chapter mới | Mangaka | 1. Đăng nhập Mangaka<br>2. Chọn Series<br>3. Nhập tên Chapter & gửi | Chapter mới được tạo thành công với trạng thái nháp. |
| **TC-APW-02** | Upload ảnh trang truyện | Mangaka / Assistant | 1. Mở Chapter<br>2. Upload file hình ảnh trang | File ảnh được upload thành công và hiển thị đúng thứ tự. |
| **TC-APW-03** | Tạo Region và Annotation | Assistant | 1. Mở trang truyện<br>2. Khoanh vùng Region<br>3. Nhập Annotation | Region và Annotation được lưu đúng vị trí trên trang. |
| **TC-APW-04** | Cập nhật Version của trang | Assistant | 1. Chọn trang đã có<br>2. Upload bản vẽ mới | Hệ thống ghi nhận phiên bản mới (New Version) cho trang. |
| **TC-APW-05** | Xóa và Khôi phục trang | Mangaka | 1. Chọn trang cần xóa<br>2. Thực hiện Xóa/Khôi phục | Trang chuyển trạng thái Xóa hoặc Khôi phục thành công. |
| **TC-APW-06** | Xem Lịch sử trang | Mangaka / Assistant | 1. Chọn trang truyện<br>2. Mở tab Lịch sử | Hiển thị đầy đủ mốc thời gian và chi tiết các phiên bản chỉnh sửa. |
| **TC-APW-07** | Kiểm thử phân quyền truy cập | Assistant | 1. Đăng nhập Assistant<br>2. Thực hiện thao tác ngoài phạm vi | Hệ thống chặn thao tác không hợp lệ (Trả về lỗi 403 Forbidden). |