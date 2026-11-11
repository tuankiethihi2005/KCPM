# Mô tả Kiểm thử Chức năng: Quản lý Phiên bản Trang (Page Version Management)

## 1. Tổng quan Chức năng
Chức năng cho phép **Assistant** hoặc **Mangaka** ghi nhận và cập nhật các phiên bản chỉnh sửa mới (v1, v2, v3...) của từng trang truyện trong Chapter.

## 2. Phạm vi Kiểm thử
* Tạo mới phiên bản (New Version) cho một trang đã tồn tại.
* Tự động tăng số thứ tự phiên bản (Version Numbering).
* Xem danh sách các phiên bản cũ và so sánh phiên bản.

## 3. Ca kiểm thử (Test Cases)

| Mã TC | Tên ca kiểm thử | Vai trò | Các bước thực hiện | Kết quả mong đợi |
| :--- | :--- | :--- | :--- | :--- |
| **TC-PVM-01** | Upload phiên bản mới cho trang | Assistant | 1. Chọn trang truyện đã có<br>2. Chọn "Upload New Version"<br>3. Tải file ảnh mới | Trang được cập nhật phiên bản mới (ví dụ từ v1 lên v2). |
| **TC-PVM-02** | Tự động tăng số Version | Assistant | 1. Thực hiện upload phiên bản mới liên tiếp 2 lần | Hệ thống đánh số phiên bản tăng dần chính xác (v1 -> v2 -> v3). |
| **TC-PVM-03** | Khôi phục về phiên bản cũ | Mangaka | 1. Chọn một trang có nhiều phiên bản<br>2. Chọn phiên bản v1<br>3. Bấm "Set as Active Version" | Phiên bản v1 được đặt làm bản hiển thị chính thức thành công. |