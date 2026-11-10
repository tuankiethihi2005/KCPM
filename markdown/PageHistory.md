# Mô tả Kiểm thử Chức năng: Lịch sử Trang (Page History)

## 1. Tổng quan Chức năng
Chức năng cho phép **Mangaka** và **Assistant** xem lại toàn bộ nhật ký thay đổi, lịch sử chỉnh sửa, thông tin phiên bản và các hoạt động đã thực hiện trên từng trang truyện.

## 2. Phạm vi Kiểm thử
* Hiển thị đầy đủ danh sách lịch sử thay đổi của trang truyện theo mốc thời gian.
* Ghi nhận chính xác người thực hiện thao tác (Mangaka hoặc Assistant) và hành động tương ứng (Upload, Sửa Annotation, Xóa, Khôi phục).
* Cho phép xem chi tiết từng mốc lịch sử.

## 3. Ca kiểm thử (Test Cases)

| Mã TC | Tên ca kiểm thử | Vai trò | Các bước thực hiện | Kết quả mong đợi |
| :--- | :--- | :--- | :--- | :--- |
| **TC-PH-01** | Xem lịch sử trang truyện | Mangaka / Assistant | 1. Mở một trang truyện<br>2. Nhấp vào tab "Lịch sử" (History) | Hiển thị danh sách nhật ký thay đổi theo thứ tự thời gian mới nhất xếp trên. |
| **TC-PH-02** | Kiểm tra thông tin vết thay đổi | Mangaka / Assistant | 1. Mở tab Lịch sử trang<br>2. Kiểm tra thông tin các mốc | Hiển thị chính xác Tên người thực hiện, Thời gian thực hiện và Hành động (Upload version/Add annotation/Delete). |
| **TC-PH-03** | Khôi phục từ nhật ký lịch sử | Mangaka | 1. Chọn một mốc lịch sử cũ<br>2. Nhấp "Restore to this state" | Trang truyện được đưa về đúng trạng thái tại mốc lịch sử được chọn. |