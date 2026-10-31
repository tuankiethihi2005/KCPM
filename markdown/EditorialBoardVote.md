# Kiểm thử chức năng Editorial Board bỏ phiếu

## Điều kiện test

> Quy tắc cần Editorial/Product xác nhận: quorum, thời hạn biểu quyết và người có quyền đóng kỳ.

| Điều kiện                         | Phân vùng hợp lệ                                                           | Tag           | Phân vùng không hợp lệ                                                                          | Tag                | Giá trị biên / dữ liệu kiểm thử                                               | Tag                |
| --------------------------------- | -------------------------------------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------- | ------------------ | ----------------------------------------------------------------------------- | ------------------ |
| **Tư cách cử tri**                | Thành viên Editorial Board đang hoạt động<br> Có quyền bỏ phiếu            | V1, V2        | Role Mangaka<br> Role Assistant<br> Role Tantou Editor<br> Tài khoản bị khóa<br> Chưa đăng nhập | X1, X2, X3, X4, X5 | Board Active<br> Board inactive<br> Mỗi role ngoài hội đồng                   | B1, B2, B3         |
| **Proposal được biểu quyết**      | Đã nộp chính thức<br> Kỳ xét duyệt còn mở                                  | V3, V4        | Proposal là bản nháp<br> Proposal không tồn tại<br> Proposal đã bị hủy<br> Proposal đã chốt     | X6, X7, X8, X9     | Vừa nộp<br> Đã mở xét duyệt<br> Kỳ xét duyệt đã đóng                          | B4, B5, B6         |
| **Lựa chọn**                      | `Approve`<br> `Reject`<br> `Need Revision`                                 | V5, V6, V7    | Thiếu lựa chọn<br> Giá trị ngoài danh sách<br> Sai kiểu dữ liệu                                 | X10, X11, X12      | Mỗi lựa chọn hợp lệ<br> Rỗng<br> Sai chữ hoa-thường<br> Kiểu dữ liệu sai      | B7, B8, B9, B10    |
| **Một phiếu mỗi cử tri mỗi vòng** | Một phiếu cuối cùng mỗi vòng<br> Được đổi phiếu khi kỳ biểu quyết còn mở   | V8, V9        | Gửi đồng thời nhiều phiếu<br> Đổi phiếu sau khi kỳ biểu quyết khóa                              | X13, X14           | Gửi lặp<br> Hai request đồng thời<br> Đổi trước/sau khi khóa                  | B11, B12, B13      |
| **Comment giải trình**            | Không bắt buộc<br> Văn bản thường, tối đa 2000 ký tự                       | V10, V11      | Sai kiểu dữ liệu<br> Trên 2000 ký tự<br> Có ký tự điều khiển                                    | X15, X16, X17      | Không comment<br> 2000 ký tự<br> 2001 ký tự<br> Unicode<br> Markup            | B14, B15, B16      |
| **Lưu vết quyết định**            | Lưu người bỏ phiếu<br> Lưu lựa chọn và thời điểm<br> Lưu lịch sử đổi phiếu | V12, V13, V14 | Không lưu được người/thời điểm<br> Ghi đè mất lịch sử                                           | X18, X19           | Phiếu mới<br> Đổi lựa chọn<br> Đổi comment<br> Retry                          | B17, B18, B19, B20 |
| **Kỳ biểu quyết**                 | Bỏ phiếu trước khi kết quả được chốt                                       | V15           | Kỳ biểu quyết đã đóng<br> Kết quả đã chốt                                                       | X20, X21           | Ngay trước thời điểm đóng<br> Đúng thời điểm đóng<br> Ngay sau thời điểm đóng | B21, B22, B23      |

## Test case

| ID     | Dữ liệu nhập / thao tác                                                             | Kết quả mong đợi                                                                                      |
| ------ | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| EBV-01 | Thành viên Editorial Board đủ quyền bỏ phiếu `Approve` cho proposal đang xét duyệt. | Phiếu được ghi nhận đúng một lần, gắn với đúng cử tri, proposal và vòng xét duyệt.                    |
| EBV-02 | Bỏ phiếu `Reject` hoặc `Need Revision` cho proposal đang xét duyệt.                 | Lựa chọn tương ứng được ghi nhận và tính vào đúng vòng biểu quyết.                                    |
| EBV-03 | Gửi comment giải trình cùng phiếu.                                                  | Lựa chọn và comment được lưu gắn cùng phiếu; hiển thị đúng Unicode và không thực thi nội dung markup. |
| EBV-04 | Bỏ phiếu không kèm comment.                                                         | Chấp nhận; comment là tùy chọn, không ảnh hưởng kết quả phiếu.                                        |
| EBV-05 | Gửi thiếu vote, vote không hỗ trợ, sai kiểu dữ liệu hoặc comment trên 2000 ký tự.   | Từ chối toàn bộ request; phiếu cũ không bị thay đổi.                                                  |
| EBV-06 | Cùng cử tri gửi hai request bỏ phiếu đồng thời cho cùng proposal/vòng.              | Chỉ có một phiếu cuối cùng có hiệu lực; không thể đếm cử tri hai lần.                                 |
| EBV-07 | Cử tri đổi lựa chọn khi kỳ biểu quyết còn mở.                                       | Phiếu hiện hành được cập nhật; lịch sử thay đổi vẫn truy vết được; tổng phiếu chỉ tính lựa chọn mới.  |
| EBV-08 | Cử tri thử đổi phiếu sau khi kỳ biểu quyết đóng hoặc kết quả đã chốt.               | Từ chối; kết quả và lịch sử phiếu đã chốt không đổi.                                                  |
| EBV-09 | Người không đủ tư cách, tài khoản bị khóa hoặc người chưa đăng nhập thử bỏ phiếu.   | Từ chối; không lưu phiếu; thao tác bị ghi nhận theo chính sách kiểm toán.                             |
| EBV-10 | Bỏ phiếu cho proposal không tồn tại, chưa được nộp hoặc đã có kết quả cuối.         | Từ chối; không tạo dữ liệu vote mồ côi hoặc thay đổi kết quả.                                         |
| EBV-11 | Gửi lại cùng request sau timeout phía client.                                       | Hệ thống không tính trùng phiếu; phản hồi chỉ rõ phiếu đã được ghi nhận hay chưa.                     |
