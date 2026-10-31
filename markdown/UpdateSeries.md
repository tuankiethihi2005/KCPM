# Kiểm thử chức năng cập nhật hồ sơ Series

## Điều kiện test

> Tiêu chí nghiệp vụ đề xuất. Các giới hạn định dạng và độ dài cần thống nhất với [CreateSeries.md](./CreateSeries.md).

| Điều kiện | Phân vùng hợp lệ | Tag | Phân vùng không hợp lệ | Tag | Giá trị biên / dữ liệu kiểm thử | Tag |
| --- | --- | --- | --- | --- | --- | --- |
| **Chủ sở hữu hồ sơ** |  Mangaka sở hữu Series | V1 |  Mangaka khác<br> Assistant<br> Role khác không được cấp quyền sửa | X1, X2, X3 |  Chủ sở hữu<br> Tài khoản Mangaka thứ hai<br> Role không liên quan | B1, B2, B3 |
| **Trạng thái cho phép sửa** |  `Draft`<br> `Need Revision` | V2, V3 |  `Submitted`<br> `Under Review`<br> `Approved`<br> `Rejected`<br> `Cancelled` | X4, X5, X6, X7, X8 |  Thử cập nhật tại từng trạng thái<br> Gửi request đồng thời với thao tác nộp | B4, B5 |
| **Title** |  2–100 ký tự sau trim<br> Unicode<br> Chuẩn hóa NFC và khoảng trắng<br> Duy nhất trong Series của cùng Mangaka, không phân biệt hoa-thường | V4, V5, V6, V7 |  Rỗng/chỉ khoảng trắng<br> Dưới 2 ký tự<br> Trên 100 ký tự<br> Ký tự điều khiển hoặc `<`, `>`<br> Trùng title đã chuẩn hóa của cùng tác giả | X9, X10, X11, X12, X13 |  2, 100, 1, 101 ký tự<br> Tiếng Việt/chữ Nhật<br> Khoảng trắng<br> Trùng cùng tác giả/khác tác giả | B6, B7, B8, B9 |
| **Description** |  Không bắt buộc<br> Tối đa 1000 ký tự<br> Văn bản thường | V8, V9, V10 |  Trên 1000 ký tự<br> Chỉ khoảng trắng | X14, X15 |  Để trống<br> 1, 1000, 1001 ký tự<br> Chỉ khoảng trắng | B10, B11, B12 |
| **Genre và target audience** |  Không bắt buộc<br> Nếu nhập: 2–50 ký tự<br> Không có ký tự điều khiển | V11, V12, V13 |  Chỉ khoảng trắng<br> Dưới 2 ký tự<br> Trên 50 ký tự<br> Có ký tự điều khiển | X16, X17, X18, X19 |  Để trống<br> 2, 50, 1, 51 ký tự | B13, B14, B15 |
| **Cập nhật một phần** |  Trường được gửi sẽ cập nhật<br> Trường không gửi được giữ nguyên | V14, V15 |  Trường không gửi bị xóa<br> Trường không gửi bị ghi đè | X20, X21 |  Gửi một trường<br> Gửi giá trị rỗng có chủ đích<br> Gửi body rỗng | B16, B17, B18 |
| **Editor phụ trách** |  Không chọn editor<br> Chọn Tantou Editor đang hoạt động | V16, V17 |  ID không tồn tại/không hợp lệ<br> Người dùng không hoạt động<br> Role không phải Tantou Editor | X22, X23, X24 |  Bỏ gán editor<br> Gán editor hợp lệ<br> ID không hợp lệ<br> Editor inactive | B19, B20, B21 |
| **Tính toàn vẹn dữ liệu** |  Lưu đầy đủ các trường hợp lệ<br> Một lần cập nhật không tạo bản ghi mới | V18, V19 |  Validation thất bại nhưng vẫn ghi một phần<br> Tạo Series mới ngoài ý muốn | X25, X26 |  Gửi lại cùng request<br> Lỗi giữa các trường<br> Gửi hai lần nhanh | B22, B23, B24 |

## Test case

| ID | Dữ liệu nhập / thao tác | Kết quả mong đợi |
| --- | --- | --- |
| US-01 | Chủ sở hữu đổi title hợp lệ khi Series ở `Draft`. | Cập nhật hồ sơ hiện tại; title mới được lưu; không tạo Series mới. |
| US-02 | Cập nhật từng trường và tổ hợp nhiều trường hợp lệ khi ở `Draft`. | Chỉ các trường gửi lên thay đổi; giá trị lưu khớp dữ liệu nhập sau chuẩn hóa đã công bố. |
| US-03 | Cập nhật hợp lệ khi Series ở `Need Revision`. | Cho phép cập nhật; lưu nội dung mới để Mangaka có thể gửi lại xét duyệt. |
| US-04 | Gửi body không có trường nào hoặc gửi giá trị không đổi. | Body rỗng bị từ chối rõ ràng; giá trị không đổi không tạo bản ghi trùng hoặc tác dụng phụ. |
| US-05 | Gửi title rỗng, chỉ khoảng trắng, vượt giới hạn hoặc chứa ký tự bị cấm. | Từ chối toàn bộ cập nhật; giữ nguyên mọi dữ liệu trước request; trả lỗi xác định trường sai. |
| US-06 | Gửi title trùng sau chuẩn hóa NFC, trim, gộp khoảng trắng và bỏ phân biệt hoa-thường với Series khác của cùng Mangaka. | Từ chối trùng; không đổi title hoặc trường nào khác. Cùng title của Mangaka khác được phép. |
| US-07 | Gửi description, genre hoặc target audience ở biên hợp lệ và vượt biên một đơn vị. | Biên hợp lệ được chấp nhận; ngoài biên bị từ chối toàn bộ; không lưu một phần. |
| US-08 | Gán editor không hợp lệ, inactive hoặc không phải Tantou Editor. | Từ chối gán; giữ nguyên editor hiện tại và các trường khác. |
| US-09 | Người không sở hữu Series hoặc role không được phép sửa thử cập nhật hồ sơ. | Từ chối; không tiết lộ/cập nhật dữ liệu; ghi nhận kết quả truy cập theo chính sách bảo mật. |
| US-10 | Cập nhật hồ sơ khi Series ở từng trạng thái không cho phép sửa. | Từ chối; không đổi hồ sơ hoặc trạng thái. |
| US-11 | Gửi request cập nhật đồng thời với request nộp proposal. | Hệ thống xử lý nhất quán: hoặc cập nhật hoàn tất trước khi nộp, hoặc bị từ chối sau khi khóa sửa; không có hồ sơ nộp với dữ liệu cập nhật dở dang. |
