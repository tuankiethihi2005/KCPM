# Kiểm thử chức năng nộp Proposal xét duyệt

## Điều kiện test

> Trường bắt buộc theo nghiệp vụ: title, genre, target audience và summary. Characters, art style và cover là thông tin bổ sung.

| Điều kiện | Phân vùng hợp lệ | Tag | Phân vùng không hợp lệ | Tag | Giá trị biên / dữ liệu kiểm thử | Tag |
| --- | --- | --- | --- | --- | --- | --- |
| **Series và quyền nộp** |  Mangaka sở hữu Series<br> Series chưa bị hủy | V1, V2 |  Mangaka không sở hữu Series<br> Role không được phép<br> Series không tồn tại<br> Series đã hủy | X1, X2, X3, X4 |  Chủ sở hữu<br> Mangaka khác<br> Assistant<br> ID không tồn tại | B1, B2, B3 |
| **Mức độ hoàn thiện hồ sơ** |  Có title hợp lệ<br> Có genre hợp lệ<br> Có target audience hợp lệ<br> Có summary hợp lệ<br> Characters/art style/cover có thể để trống | V3, V4, V5, V6, V7 |  Thiếu title<br> Thiếu genre<br> Thiếu target audience<br> Thiếu summary<br> Trường bắt buộc chỉ có khoảng trắng | X5, X6, X7, X8, X9 |  Thiếu từng trường bắt buộc<br> Đủ trường tối thiểu<br> Bỏ trống từng trường bổ sung | B4, B5 |
| **Proposal state** |  Bản nháp<br> Được yêu cầu chỉnh sửa và có thay đổi mới | V8, V9 |  Đang chờ duyệt<br> Đã có kết quả cuối cùng<br> Nộp lại nhưng không có thay đổi sau yêu cầu chỉnh sửa | X10, X11, X12 |  Nộp lần đầu<br> Nộp lại sau chỉnh sửa<br> Gửi lặp sau khi request trước thành công | B6, B7, B8 |
| **Summary / nội dung** |  20–2000 ký tự sau trim<br> Unicode<br> Văn bản thường | V10, V11, V12 |  Rỗng/chỉ khoảng trắng<br> Dưới 20 ký tự<br> Trên 2000 ký tự<br> Ký tự điều khiển | X13, X14, X15, X16 |  20, 2000, 19, 2001 ký tự<br> Tiếng Việt/chữ Nhật<br> Khoảng trắng đầu-cuối | B9, B10, B11 |
| **Cover / tài liệu đính kèm** |  Không bắt buộc<br> JPG/JPEG/PNG/WEBP<br> Ảnh giải mã hợp lệ<br> Tối đa 10 MiB | V13, V14, V15, V16 |  MIME giả<br> Ảnh hỏng<br> Định dạng không hỗ trợ<br> Lớn hơn 10 MiB | X17, X18, X19, X20 |  Không có cover<br> Mỗi định dạng<br> Đúng 10 MiB<br> 10 MiB + 1 byte<br> MIME giả | B12, B13, B14, B15 |
| **Tính toàn vẹn và lịch sử** |  Một lần nộp tạo một lần gửi xét duyệt<br> Lưu thời điểm và phiên bản nội dung | V17, V18 |  Nộp trùng tạo nhiều hồ sơ<br> Nộp trùng tạo nhiều thông báo<br> Nội dung thay đổi sau nộp không tạo vòng mới | X21, X22, X23 |  Double-click<br> Retry sau timeout<br> Sửa rồi nộp lại | B16, B17, B18 |
| **Thông báo và lỗi phụ trợ** |  Ghi nhận kết quả nộp<br> Thông báo Editorial Board | V19, V20 |  Trả thành công giả khi nộp thất bại<br> Hồ sơ mất khi gửi thông báo lỗi | X24, X25 |  Board có người nhận<br> Không có người nhận<br> Dịch vụ thông báo lỗi | B19, B20, B21 |

## Test case

| ID | Dữ liệu nhập / thao tác | Kết quả mong đợi |
| --- | --- | --- |
| SP-01 | Chủ sở hữu nộp hồ sơ đã lưu và hoàn chỉnh theo checklist bắt buộc. | Hồ sơ được ghi nhận là đã gửi; người nộp thấy xác nhận; Editorial Board có thể bắt đầu xét duyệt. |
| SP-02 | Nộp hồ sơ thiếu lần lượt title, genre, target audience hoặc summary. | Mỗi lần bị từ chối; chỉ rõ trường còn thiếu; không chuyển hồ sơ sang trạng thái đã gửi. |
| SP-03 | Nộp summary ở biên thấp/cao, sau trim, và một đơn vị ngoài giới hạn. | Dữ liệu trong giới hạn được chấp nhận; ngoài giới hạn bị từ chối; quy tắc nhất quán giữa giao diện và máy chủ. |
| SP-04 | Nộp không kèm cover. | Nộp thành công; thể hiện rõ cover không có, không dùng ảnh placeholder như thể đã upload. |
| SP-05 | Upload cover đúng 10 MiB, lớn hơn giới hạn, hỏng, sai định dạng và giả MIME trước khi nộp. | Ảnh hợp lệ được liên kết; tệp không hợp lệ bị từ chối và không được dùng làm cover; hồ sơ vẫn có thể nộp nếu bỏ tệp lỗi. |
| SP-06 | Gửi lại request bằng double-click hoặc retry sau khi client timeout. | Chỉ tạo một lần nộp cho cùng thao tác; phản hồi retry phản ánh đúng kết quả đã lưu, không tạo thông báo trùng. |
| SP-07 | Nộp lại hồ sơ sau khi đã nhận yêu cầu chỉnh sửa và đã cập nhật nội dung. | Tạo vòng xét duyệt mới có phiên bản nội dung mới; phiếu/nhận xét vòng cũ vẫn truy vết được và không bị mất. |
| SP-08 | Đã nhận yêu cầu chỉnh sửa nhưng chưa cập nhật nội dung, thử nộp lại. | Từ chối nộp lại; yêu cầu chỉnh sửa phải có thay đổi/ phản hồi trước khi mở vòng đánh giá mới. |
| SP-09 | Thử nộp hồ sơ đang được hội đồng xét duyệt hoặc đã có kết quả cuối cùng. | Từ chối nộp trùng; không ghi đè kết quả hoặc nội dung đã chốt. |
| SP-10 | Mangaka không sở hữu hồ sơ, Assistant hoặc người chưa đăng nhập thử nộp. | Từ chối theo quyền; không thay đổi hồ sơ hoặc tạo thông báo. |
| SP-11 | Nộp thành công nhưng dịch vụ thông báo gặp lỗi. | Kết quả lưu hồ sơ phải rõ ràng, không trả thành công giả hoặc thất bại giả; lỗi thông báo được ghi nhận và có cơ chế gửi lại/quan sát được. |
| SP-12 | Nộp hồ sơ trong khi cùng lúc một phiên khác đang cập nhật hồ sơ. | Bản nộp gắn với một phiên bản nhất quán; không gửi hồ sơ chứa dữ liệu cập nhật dở dang. |
