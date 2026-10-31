# Kiểm thử chức năng chốt kết quả và lịch phát hành Series

## Điều kiện test

> Quy tắc cần Editorial/Product phê duyệt: quorum, ngưỡng thắng, tie-break. Đề xuất mặc định: quorum trên 50% cử tri đủ tư cách; một lựa chọn phải đạt trên 50% phiếu hợp lệ; hòa hoặc không có lựa chọn quá bán thì chuyển xử lý tiếp, không tự động Reject.

| Điều kiện | Phân vùng hợp lệ | Tag | Phân vùng không hợp lệ | Tag | Giá trị biên / dữ liệu kiểm thử | Tag |
| --- | --- | --- | --- | --- | --- | --- |
| **Quyền chốt** |  Người được ủy quyền chốt quyết định Editorial Board | V1 |  Cử tri không có quyền chốt<br> Role ngoài hội đồng<br> Chưa đăng nhập | X1, X2, X3 |  Người được ủy quyền<br> Board member thường<br> Mangaka<br> Phiên đăng xuất | B1, B2, B3, B4 |
| **Quorum** |  Phiếu hợp lệ từ hơn một nửa cử tri đủ tư cách<br> Danh sách cử tri được xác định khi mở vòng | V2, V3 |  Chưa đủ quorum<br> Phiếu từ người không đủ tư cách | X4, X5 |  Với 5 cử tri: 2, 3, 4 phiếu | B5, B6, B7 |
| **Phiếu dùng để tính kết quả** |  Tối đa một phiếu cuối cùng mỗi cử tri<br> Phiếu thuộc đúng vòng xét duyệt | V4, V5 |  Phiếu trùng<br> Phiếu đã rút/không hợp lệ<br> Phiếu thuộc vòng cũ | X6, X7, X8 |  Đổi phiếu<br> Gửi lặp<br> Có phiếu vòng trước | B8, B9, B10 |
| **Ngưỡng quyết định** |  Một lựa chọn đạt quá bán phiếu hợp lệ<br> Kỳ biểu quyết đã đóng | V6, V7 |  Không lựa chọn nào quá bán<br> Hòa phiếu | X9, X10 |  2/4 phiếu<br> 3/5 phiếu<br> Hòa hai bên<br> Hòa ba bên | B11, B12, B13, B14 |
| **Kết quả và trạng thái** |  `Approve`<br> `Reject`<br> `Need Revision`<br> Trạng thái tương ứng với quyết định | V8, V9, V10, V11 |  Quyết định không hợp lệ<br> Trạng thái không tương thích | X11, X12 |  Mỗi kết quả<br> Proposal đã chốt<br> Series đã hủy | B15, B16, B17 |
| **Lịch phát hành** |  Khi `Approve`: chọn weekly<br> Khi `Approve`: chọn monthly<br> Khi `Approve`: chọn one-shot<br> Khi `Approve`: chọn online-only | V12, V13, V14, V15 |  Thiếu lịch bắt buộc<br> Lịch ngoài danh sách<br> Gán lịch khi không Approve | X13, X14, X15 |  Mỗi lựa chọn hợp lệ<br> Bỏ trống<br> Giá trị lạ | B18, B19, B20 |
| **Thông báo và lưu vết** |  Lưu người chốt và thời điểm<br> Lưu tally và quyết định<br> Lưu lịch và lý do/biên bản | V16, V17, V18 |  Không truy vết được kết quả<br> Thông báo khác kết quả đã lưu | X16, X17 |  Chốt thành công<br> Lỗi gửi thông báo<br> Retry request | B21, B22, B23 |
| **Tính nguyên tử** |  Quyết định được lưu<br> Trạng thái Series được cập nhật<br> Lịch và lịch sử được lưu đồng bộ | V19, V20, V21 |  Chỉ một phần được cập nhật khi có lỗi | X18 |  Lỗi ở từng bước lưu<br> Request lặp<br> Hai người chốt đồng thời | B24, B25, B26 |

## Test case

| ID | Dữ liệu nhập / thao tác | Kết quả mong đợi |
| --- | --- | --- |
| FS-01 | Đóng kỳ biểu quyết với quorum đạt; một lựa chọn có quá bán phiếu hợp lệ. | Chốt đúng lựa chọn thắng; lưu tổng phiếu, người chốt, thời điểm và vòng xét duyệt. |
| FS-02 | Có 5 cử tri đủ tư cách và 3 phiếu hợp lệ; một lựa chọn đạt quá bán số phiếu. | Quorum đạt; cho phép chốt quyết định thắng. |
| FS-03 | Có 5 cử tri đủ tư cách nhưng chỉ 2 phiếu hợp lệ. | Không chốt; proposal tiếp tục chờ quyết định; không đổi trạng thái Series hoặc lịch. |
| FS-04 | Có 5 cử tri đủ tư cách và 4 phiếu hợp lệ; một lựa chọn nhận đúng 2 phiếu. | Quorum đạt nhưng không có lựa chọn quá bán; không chốt tự động; yêu cầu tiếp tục biểu quyết hoặc xử lý hòa phiếu đã phê duyệt. |
| FS-05 | Có quorum; hai lựa chọn hòa phiếu cao nhất hoặc cả ba lựa chọn hòa. | Không tự động kết luận Reject/Approve; giữ trạng thái chờ và yêu cầu xử lý hòa phiếu. |
| FS-06 | Có phiếu trùng, phiếu không hợp lệ hoặc vote thuộc vòng xét duyệt cũ. | Chỉ tính phiếu cuối cùng hợp lệ của đúng vòng; kết quả và tally có thể đối chiếu được. |
| FS-07 | `Approve` đạt điều kiện; người có quyền chọn lần lượt từng lịch hỗ trợ. | Mỗi lượt lưu đúng lịch; trạng thái proposal là `Approved`, Series được kích hoạt theo quyết định. |
| FS-08 | `Approve` đạt điều kiện nhưng không chọn lịch hoặc chọn lịch ngoài danh sách. | Không chốt; không tạo trạng thái Approved khi thiếu lịch bắt buộc; trả lỗi rõ trường cần sửa. |
| FS-09 | `Reject` đạt điều kiện. | Chốt `Rejected`; lưu lý do/biên bản nếu chính sách yêu cầu; không gán lịch phát hành. |
| FS-10 | `Need Revision` đạt điều kiện. | Chốt yêu cầu chỉnh sửa; thông báo cho Mangaka nội dung/nhận xét cần sửa; giữ hồ sơ có thể sửa và nộp lại theo chính sách. |
| FS-11 | Người không được ủy quyền thử chốt kết quả. | Từ chối; không sửa phiếu, tally, trạng thái, lịch hoặc lịch sử. |
| FS-12 | Chốt proposal đã có kết quả cuối cùng. | Từ chối chốt lần hai; không ghi đè quyết định hoặc lịch đã được phê duyệt. |
| FS-13 | Lỗi xảy ra khi lưu một phần quyết định/trạng thái/lịch. | Rollback toàn bộ; không xuất hiện kết quả nửa vời; lỗi được ghi nhận và có thể đối soát. |
| FS-14 | Hai người có quyền gửi yêu cầu chốt đồng thời. | Chỉ một quyết định được commit; request còn lại nhận trạng thái đã chốt, không ghi đè. |
| FS-15 | Gửi lại request sau timeout khi lần chốt đầu đã thành công. | Không tạo quyết định/thông báo trùng; phản hồi thể hiện kết quả đã chốt. |
| FS-16 | Lưu quyết định thành công nhưng dịch vụ thông báo lỗi. | Kết quả đã chốt vẫn chính xác; lỗi thông báo được ghi nhận và có thể gửi lại; không trả thông báo thành công sai nội dung. |
