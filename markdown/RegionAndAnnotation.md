# Mô tả Kiểm thử Chức năng: Vùng Chọn và Chú thích (Region & Annotation)

## 1. Tổng quan Chức năng
Chức năng cho phép **Assistant** khoanh vùng các vị trí cụ thể trên trang truyện (Region) và gắn thêm các ghi chú, nhận xét hoặc yêu cầu chỉnh sửa (Annotation) trực tiếp trên trang đó.

## 2. Phạm vi Kiểm thử
* Khoanh vùng Region thành công trên trang truyện.
* Tạo, chỉnh sửa và xóa Annotation gắn với Region.
* Phân quyền: Cả Mangaka và Assistant được phân công đều có thể xem và tương tác với Annotation.

## 3. Ca kiểm thử (Test Cases)

| Mã TC | Tên ca kiểm thử | Vai trò | Các bước thực hiện | Kết quả mong đợi |
| :--- | :--- | :--- | :--- | :--- |
| **TC-RAA-01** | Tạo Region và Annotation mới | Assistant | 1. Mở trang truyện<br>2. Dùng công cụ khoanh vùng Region<br>3. Nhập nội dung chú thích và Lưu | Region hiển thị trên hình ảnh và Annotation được lưu đúng nội dung. |
| **TC-RAA-02** | Chỉnh sửa nội dung Annotation | Assistant / Mangaka | 1. Chọn Annotation đã tạo<br>2. Nhấp "Sửa"<br>3. Cập nhật nội dung mới và Lưu | Nội dung Annotation được cập nhật chính xác. |
| **TC-RAA-03** | Xóa Annotation | Assistant / Mangaka | 1. Chọn Annotation cần xóa<br>2. Bấm "Xóa"<br>3. Xác nhận xóa | Annotation và Region tương ứng bị loại bỏ khỏi trang truyện. |