# Kiểm thử cảnh báo rủi ro và quyết định vòng đời Series

## Phạm vi

Tài liệu dành cho Editorial Board và Admin để theo dõi series có nguy cơ, bỏ phiếu và cập nhật trạng thái vòng đời:

- `GET /api/series/at-risk`
- `GET /api/series/:id/lifecycle-votes`
- `POST /api/series/:id/lifecycle-vote`
- `PATCH /api/series/:id/status`

## Enum nghiệp vụ hiện tại

- Lifecycle vote: `Continue`, `Cancel`, `Hiatus`, `Change Schedule`, `Online Only`, `Need Improvement Plan`.
- Series status: `Active`, `At Risk`, `Hiatus`, `Cancelled`, `Completed`, `Changed Schedule`.
- Risk status: `Safe`, `Warning`, `Critical`.
- Approved schedule: `weekly`, `monthly`, `one-shot`, `online only`, `none`.

Danh sách rủi ro gồm series có `risk_status` là `Warning`/`Critical` hoặc `status=At Risk`.

## Phân vùng kiểm thử

| Điều kiện | Hợp lệ | Không hợp lệ / biên |
| --- | --- | --- |
| Series có rủi ro | `Warning`, `Critical`, hoặc status `At Risk` | `Safe` và status hoạt động bình thường |
| Lifecycle vote | Một giá trị thuộc enum; comment tùy chọn | Thiếu vote, enum ngoài danh sách, series không tồn tại |
| Cập nhật status | Status thuộc enum vòng đời | `Deleted`, chuỗi rỗng, ID sai hoặc không tồn tại |
| Schedule/risk | Giá trị thuộc enum tương ứng hoặc không gửi trường tùy chọn | Giá trị lạ, sai kiểu |
| Quyền | Editorial Board hoặc Admin | Tantou Editor, Mangaka, Assistant, chưa đăng nhập |
| Tính lặp | Cùng Board member bỏ phiếu lại cho cùng series | Tạo bản ghi vote trùng thay vì cập nhật vote hiện hành |

## Test case

| ID | Dữ liệu / thao tác | Kết quả mong đợi |
| --- | --- | --- |
| SL-01 | Series có `risk_status=Warning` hoặc `Critical`. | Xuất hiện đúng một lần trong danh sách `/at-risk`. |
| SL-02 | Series `Safe` và `Active`. | Không xuất hiện trong danh sách rủi ro. |
| SL-03 | Board lấy danh sách rủi ro và xem chi tiết series. | HTTP `200`; có dữ liệu tác giả, trạng thái và risk status cần thiết. |
| SL-04 | Board vote lần đầu với từng lựa chọn hợp lệ. | HTTP `201`; lưu series, board member, vote context `lifecycle` và comment. |
| SL-05 | Board sửa lựa chọn/comment của chính mình. | HTTP `200`; cập nhật vote hiện hành, không tạo bản ghi trùng. |
| SL-06 | Gửi thiếu vote hoặc vote ngoài enum. | HTTP `400`; không tạo/cập nhật vote. |
| SL-07 | Vote cho series không tồn tại. | HTTP `404`; không tạo vote mồ côi. |
| SL-08 | Board cập nhật status cùng schedule/risk hợp lệ. | HTTP `200`; lưu đúng giá trị và gửi notification cho Mangaka. |
| SL-09 | Gửi status `Deleted`, schedule hoặc risk ngoài enum. | HTTP `400`; giữ nguyên dữ liệu cũ. |
| SL-10 | Tantou Editor hoặc Mangaka thử vote/đổi status. | HTTP `403`; không thay đổi dữ liệu. |
| SL-11 | Retry request cập nhật status. | Trạng thái cuối vẫn nhất quán; không gửi notification trùng ngoài chính sách idempotency. |
| SL-12 | Lấy tally sau nhiều Board member vote. | Tally đếm đúng vote hiện hành của từng member; lịch sử hiển thị đúng thời gian cập nhật. |

## Tiêu chí pass

- Series rủi ro được lọc đúng và không bị lặp.
- Vote hợp lệ được truy vết theo member, series và context.
- Cập nhật status chỉ chấp nhận enum đã công bố.
- Notification gửi đúng tác giả sau quyết định; lỗi gửi phải quan sát được.
- Không tự suy diễn ngưỡng huỷ/tiếp tục khi chưa có chính sách quorum hoặc tie-break được phê duyệt.

> Các ngưỡng như số kỳ tụt hạng liên tiếp, điểm tối thiểu, quorum và cách xử lý hòa phiếu cần Editorial/Product chốt trước khi chuyển thành expected result bắt buộc.

