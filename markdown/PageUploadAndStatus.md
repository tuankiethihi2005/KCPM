# Mô tả Kiểm thử Chức năng: Upload và Trạng thái trang (Page Upload & Status)

## 1. Tổng quan Chức năng
Chức năng cho phép **Mangaka** và **Assistant** thực hiện tải các file hình ảnh trang truyện lên Chapter, đồng thời quản lý các trạng thái hiển thị của từng trang.

## 2. Phạm vi Kiểm thử
* Upload thành công file ảnh định dạng hợp lệ (PNG, JPG, WEBP).
* Kiểm tra chặn upload định dạng không hỗ trợ hoặc vượt dung lượng cho phép.
* Cập nhật và hiển thị đúng các trạng thái trang (Uploaded, Processing, Ready).

## 3. Ca kiểm thử (Test Cases)

| Mã TC | Tên ca kiểm thử | Vai trò | Các bước thực hiện | Kết quả mong đợi |
| :--- | :--- | :--- | :--- | :--- |
| **TC-PUS-01** | Upload trang truyện hợp lệ | Mangaka / Assistant | 1. Mở Chapter<br>2. Chọn file ảnh (.png/.jpg < 10MB)<br>3. Nhấn Tải lên | Ảnh được tải lên thành công, hiển thị xem trước và có trạng thái `Uploaded`. |
| **TC-PUS-02** | Upload file sai định dạng | Mangaka / Assistant | 1. Mở Chapter<br>2. Chọn file .pdf/.exe<br>3. Nhấn Tải lên | Hệ thống báo lỗi "Định dạng file không được hỗ trợ". |
| **TC-PUS-03** | Thay đổi trạng thái trang | Mangaka / Assistant | 1. Chọn trang đã upload<br>2. Chuyển trạng thái sang Ready | Trạng thái trang được cập nhật thành công trên giao diện. |