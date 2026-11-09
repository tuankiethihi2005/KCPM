# Kiểm thử chức năng Feedback và tiến độ của Tantou Editor

## Phạm vi

Tài liệu này bao phủ việc Tantou Editor tạo, xem và cập nhật annotation/feedback trên page hoặc chapter; theo dõi trạng thái xử lý và tiến độ sản xuất. Endpoint chính:

- `POST /api/annotations/page/:page_id`
- `GET /api/annotations/page/:page_id`
- `GET /api/annotations/chapter/:chapter_id`
- `PATCH /api/annotations/:id`
- `DELETE /api/annotations/:id`
- `PATCH /api/annotations/:id/restore`
- `GET /api/series/progress`

Tất cả endpoint yêu cầu đăng nhập. Quyền ghi annotation thuộc Mangaka, Tantou Editor và Admin; quyền xem thuộc các role có quyền truy cập nội dung tương ứng.

## Điều kiện kiểm thử

| Điều kiện | Hợp lệ | Không hợp lệ / biên |
| --- | --- | --- |
| Tọa độ | `x`, `y` là số; chấp nhận `0` và số thập phân | Thiếu tọa độ, chuỗi không phải số, tọa độ sai kiểu |
| Nội dung | `content` hoặc `comment` là văn bản không rỗng | Thiếu nội dung, chỉ khoảng trắng, payload sai kiểu |
| Trạng thái | `Open`, `In Progress`, `Resolved`, `Reopened` | Giá trị ngoài enum, ví dụ `Done` |
| Liên kết | `page_id` tồn tại và thuộc chapter hợp lệ | Page/chapter không tồn tại, ID sai định dạng |
| Phân quyền | Editor phụ trách hoặc role được cấp quyền | Editor ngoài scope, Assistant chỉ đọc, người chưa đăng nhập |
| Cập nhật một phần | Chỉ trường gửi lên thay đổi; có thể xóa deadline bằng `null` | Validation lỗi nhưng làm thay đổi một phần dữ liệu |

## Test case

| ID | Dữ liệu / thao tác | Kết quả mong đợi |
| --- | --- | --- |
| EF-01 | Editor tạo feedback với `x=100.5`, `y=200`, content hợp lệ. | HTTP `201`; annotation có trạng thái mặc định `Open`, đúng page/chapter và người tạo. |
| EF-02 | Tạo feedback tại `x=0`, `y=0`, có Unicode trong nội dung. | HTTP `201`; lưu đúng tọa độ và hiển thị nguyên vẹn Unicode. |
| EF-03 | Gửi thiếu `x`, `y`, content hoặc chỉ gửi khoảng trắng. | HTTP `400`; không tạo annotation. |
| EF-04 | Gửi tọa độ dạng `"abc"` hoặc status `Done`. | HTTP `400`; không thay đổi dữ liệu cũ. |
| EF-05 | Cập nhật lần lượt `Open -> In Progress -> Resolved -> Reopened`. | Mỗi trạng thái hợp lệ được lưu đúng; HTTP `200`. |
| EF-06 | Cập nhật content, category, deadline hoặc tọa độ riêng lẻ. | Chỉ trường được gửi thay đổi; các trường còn lại giữ nguyên. |
| EF-07 | Editor ngoài scope xem hoặc sửa feedback của chapter không phụ trách. | Bị từ chối theo scope; không lộ hoặc thay đổi dữ liệu. |
| EF-08 | Assistant lấy danh sách annotation theo page/chapter. | Chỉ được phép nếu route cấp quyền đọc; không được tạo hoặc sửa feedback. |
| EF-09 | Xóa và khôi phục annotation. | Annotation bị ẩn khỏi danh sách thường sau khi xóa; khôi phục trả lại đúng dữ liệu và lịch sử. |
| EF-10 | Tính tiến độ khi không có task/annotation hoàn thành và khi dữ liệu hỗn hợp. | `completionPercent` phản ánh dữ liệu thực tế; thành phần quá hạn được nhận diện đúng. |

## Tiêu chí pass

- Feedback gắn đúng page, chapter, người tạo và trạng thái.
- Không có dữ liệu mồ côi khi page hoặc chapter không tồn tại.
- Mọi thay đổi trạng thái đều truy vết được qua `createdAt`/`updatedAt`.
- Quyền đọc/ghi không vượt quá series hoặc chapter được phân công.
- Tiến độ không báo hoàn thành khi task hoặc feedback còn tồn đọng.

> Giới hạn độ dài content, quy tắc SLA và công thức `completionPercent` cần được Product/Editorial xác nhận trước khi dùng làm tiêu chí nghiệm thu cứng.

