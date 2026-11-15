# Kiểm thử chức năng nộp Proposal xét duyệt

## Điều kiện test

> Trường bắt buộc theo nghiệp vụ: title, genre, target audience và summary. Characters, art style và cover là thông tin bổ sung.

| Điều kiện                     | Phân vùng hợp lệ                                                                                                                       | Tag                | Phân vùng không hợp lệ                                                                                          | Tag                | Giá trị biên / dữ liệu kiểm thử                                                     | Tag                |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------- | ------------------ | ----------------------------------------------------------------------------------- | ------------------ |
| **Series và quyền nộp**       | Mangaka sở hữu Series<br> Series chưa bị hủy                                                                                           | V1, V2             | Mangaka không sở hữu Series<br> Role không được phép<br> Series không tồn tại<br> Series đã hủy                 | X1, X2, X3, X4     | Chủ sở hữu<br> Mangaka khác<br> Assistant<br> ID không tồn tại                      | B1, B2, B3         |
| **Mức độ hoàn thiện hồ sơ**   | Có title hợp lệ<br> Có genre hợp lệ<br> Có target audience hợp lệ<br> Có summary hợp lệ<br> Characters/art style/cover có thể để trống | V3, V4, V5, V6, V7 | Thiếu title<br> Thiếu genre<br> Thiếu target audience<br> Thiếu summary<br> Trường bắt buộc chỉ có khoảng trắng | X5, X6, X7, X8, X9 | Thiếu từng trường bắt buộc<br> Đủ trường tối thiểu<br> Bỏ trống từng trường bổ sung | B4, B5             |
| **Proposal state**            | Bản nháp<br> Được yêu cầu chỉnh sửa và có thay đổi mới                                                                                 | V8, V9             | Đang chờ duyệt<br> Đã có kết quả cuối cùng<br> Nộp lại nhưng không có thay đổi sau yêu cầu chỉnh sửa            | X10, X11, X12      | Nộp lần đầu<br> Nộp lại sau chỉnh sửa<br> Gửi lặp sau khi request trước thành công  | B6, B7, B8         |
| **Summary / nội dung**        | 20–2000 ký tự sau trim<br> Unicode<br> Văn bản thường                                                                                  | V10, V11, V12      | Rỗng/chỉ khoảng trắng<br> Dưới 20 ký tự<br> Trên 2000 ký tự<br> Ký tự điều khiển                                | X13, X14, X15, X16 | 20, 2000, 19, 2001 ký tự<br> Tiếng Việt/chữ Nhật<br> Khoảng trắng đầu-cuối          | B9, B10, B11       |
| **Cover / tài liệu đính kèm** | Không bắt buộc<br> JPG/JPEG/PNG/WEBP<br> Ảnh giải mã hợp lệ<br> Tối đa 10 MiB                                                          | V13, V14, V15, V16 | MIME giả<br> Ảnh hỏng<br> Định dạng không hỗ trợ<br> Lớn hơn 10 MiB                                             | X17, X18, X19, X20 | Không có cover<br> Mỗi định dạng<br> Đúng 10 MiB<br> 10 MiB + 1 byte<br> MIME giả   | B12, B13, B14, B15 |
| **Tính toàn vẹn và lịch sử**  | Một lần nộp tạo một lần gửi xét duyệt<br> Lưu thời điểm và phiên bản nội dung                                                          | V17, V18           | Nộp trùng tạo nhiều hồ sơ<br> Nộp trùng tạo nhiều thông báo<br> Nội dung thay đổi sau nộp không tạo vòng mới    | X21, X22, X23      | Double-click<br> Retry sau timeout<br> Sửa rồi nộp lại                              | B16, B17, B18      |
| **Thông báo và lỗi phụ trợ**  | Ghi nhận kết quả nộp<br> Thông báo Editorial Board                                                                                     | V19, V20           | Trả thành công giả khi nộp thất bại<br> Hồ sơ mất khi gửi thông báo lỗi                                         | X24, X25           | Board có người nhận<br> Không có người nhận<br> Dịch vụ thông báo lỗi               | B19, B20, B21      |

## Test case

| ID    | Dữ liệu nhập / thao tác                                                                    | Kết quả mong đợi                                                                                                                            |
| ----- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| SP-01 | Chủ sở hữu nộp hồ sơ đã lưu và hoàn chỉnh theo checklist bắt buộc.                         | Hồ sơ được ghi nhận là đã gửi; người nộp thấy xác nhận; Editorial Board có thể bắt đầu xét duyệt.                                           |
| SP-02 | Nộp hồ sơ thiếu lần lượt title, genre, target audience hoặc summary.                       | Mỗi lần bị từ chối; chỉ rõ trường còn thiếu; không chuyển hồ sơ sang trạng thái đã gửi.                                                     |
| SP-03 | Nộp summary ở biên thấp/cao, sau trim, và một đơn vị ngoài giới hạn.                       | Dữ liệu trong giới hạn được chấp nhận; ngoài giới hạn bị từ chối; quy tắc nhất quán giữa giao diện và máy chủ.                              |
| SP-04 | Nộp không kèm cover.                                                                       | Nộp thành công; thể hiện rõ cover không có, không dùng ảnh placeholder như thể đã upload.                                                   |
| SP-05 | Upload cover đúng 10 MiB, lớn hơn giới hạn, hỏng, sai định dạng và giả MIME trước khi nộp. | Ảnh hợp lệ được liên kết; tệp không hợp lệ bị từ chối và không được dùng làm cover; hồ sơ vẫn có thể nộp nếu bỏ tệp lỗi.                    |
| SP-06 | Gửi lại request bằng double-click hoặc retry sau khi client timeout.                       | Chỉ tạo một lần nộp cho cùng thao tác; phản hồi retry phản ánh đúng kết quả đã lưu, không tạo thông báo trùng.                              |
| SP-07 | Nộp lại hồ sơ sau khi đã nhận yêu cầu chỉnh sửa và đã cập nhật nội dung.                   | Tạo vòng xét duyệt mới có phiên bản nội dung mới; phiếu/nhận xét vòng cũ vẫn truy vết được và không bị mất.                                 |
| SP-08 | Đã nhận yêu cầu chỉnh sửa nhưng chưa cập nhật nội dung, thử nộp lại.                       | Từ chối nộp lại; yêu cầu chỉnh sửa phải có thay đổi/ phản hồi trước khi mở vòng đánh giá mới.                                               |
| SP-09 | Thử nộp hồ sơ đang được hội đồng xét duyệt hoặc đã có kết quả cuối cùng.                   | Từ chối nộp trùng; không ghi đè kết quả hoặc nội dung đã chốt.                                                                              |
| SP-10 | Mangaka không sở hữu hồ sơ, Assistant hoặc người chưa đăng nhập thử nộp.                   | Từ chối theo quyền; không thay đổi hồ sơ hoặc tạo thông báo.                                                                                |
| SP-11 | Nộp thành công nhưng dịch vụ thông báo gặp lỗi.                                            | Kết quả lưu hồ sơ phải rõ ràng, không trả thành công giả hoặc thất bại giả; lỗi thông báo được ghi nhận và có cơ chế gửi lại/quan sát được. |
| SP-12 | Nộp hồ sơ trong khi cùng lúc một phiên khác đang cập nhật hồ sơ.                           | Bản nộp gắn với một phiên bản nhất quán; không gửi hồ sơ chứa dữ liệu cập nhật dở dang.                                                     |

## Bảng chuyển đổi trạng thái và bảng quyết định theo chức năng hiện có

Các bảng dưới đây mô tả trạng thái Proposal được hỗ trợ bởi model và `submitProposal`. Quy tắc về quorum, phiên bản nội dung và tạo Proposal mới không được suy diễn từ luồng này.

### Bảng chuyển đổi trạng thái

| Test case | Trạng thái đầu        | Sự kiện / đầu vào                                                                     | Trạng thái cuối / kết quả                                                            |
| --------- | --------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 1         | `Draft`               | Nộp Proposal hợp lệ; Series không bị hủy và đủ title, genre, target audience, summary | Proposal chuyển thành `Submitted`; ghi `submitted_at` và `review_deadline`.          |
| 2         | `Need Revision`       | Nộp lại Proposal hợp lệ                                                               | Proposal hiện tại chuyển thành `Submitted`; cập nhật thời điểm nộp và hạn xét duyệt. |
| 3         | `Submitted`           | Gửi phiếu hợp lệ đầu tiên                                                             | Proposal chuyển thành `Under Review`.                                                |
| 4         | `Under Review`        | Nộp lại Proposal                                                                      | Request bị từ chối; Proposal giữ `Under Review`.                                     |
| 5         | Bất kỳ trạng thái nào | Nộp khi Series `Cancelled`, thiếu trường bắt buộc hoặc validation không đạt           | Request bị từ chối; không nộp Proposal.                                              |

### Bảng quyết định

`Y` = có/đúng; `N` = không/sai; `-` = không ảnh hưởng.

| Điều kiện / hành động                                                    | R1  | R2  | R3  | R4  |
| ------------------------------------------------------------------------ | --- | --- | --- | --- |
| C1: Series tồn tại và không ở trạng thái `Cancelled`                     | Y   | Y   | Y   | N   |
| C2: Proposal gần nhất có trạng thái `Draft` hoặc `Need Revision`         | Y   | Y   | N   | -   |
| C3: Đủ title, genre, target audience, summary và validation hợp lệ       | Y   | N   | -   | -   |
| A1: Chuyển Proposal sang `Submitted`, ghi thời điểm nộp và hạn xét duyệt | X   | -   | -   | -   |
| A2: Từ chối do thiếu dữ liệu hoặc validation thất bại                    | -   | X   | -   | -   |
| A3: Từ chối do Proposal không ở trạng thái có thể nộp                    | -   | -   | X   | -   |
| A4: Từ chối do Series bị hủy hoặc không tồn tại                          | -   | -   | -   | X   |

Hạn xét duyệt được đặt theo cấu hình `BOARD_REVIEW_DEADLINE_DAYS` (mặc định 7 ngày). Route nộp yêu cầu role Mangaka và quyền ghi trên Series; khi không tìm thấy thành viên Editorial Board đang hoạt động, handler gửi thông báo dự phòng tới Admin và Tantou Editor đang hoạt động.

# White-box

### Statement Coverage

| ID           | Dòng lệnh được phủ  | Dữ liệu / thao tác Codecept                                                                                                              | Kết quả mong đợi                                                                                                                                      |
| :----------- | :------------------ | :--------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **SP-ST-01** | Dòng 52–73          | Tạo Proposal `Draft` hợp lệ, sau đó gửi đồng thời 2 request `POST /api/series/:id/proposal/submit` bằng cùng tài khoản.                  | Một request HTTP `200`; request còn lại HTTP `409` (`"Hồ sơ đang trong quá trình xét duyệt hoặc đang được xử lý"`).                                   |
| **SP-ST-02** | Dòng 18–23          | Chuyển trạng thái Series sang `Cancelled`, sau đó gửi submit proposal.                                                                   | HTTP `400`; thông báo `"Series đã bị hủy, không thể nộp proposal"`.                                                                                   |
| **SP-ST-03** | Dòng 25–36          | Gửi submit proposal khi proposal đang ở trạng thái `Submitted` (không thuộc `SUBMITTABLE_STATUSES`).                                     | HTTP `400`; thông báo `"Không thể nộp proposal. Proposal không tồn tại hoặc đang trong quá trình xét duyệt."`.                                        |
| **SP-ST-04** | Dòng 38–50          | Gửi submit proposal cho Series chưa nhập `genre`, `target_audience` và chưa có `summary`.                                                | HTTP `400`; thông báo `"Vui lòng hoàn tất các trường bắt buộc trước khi nộp proposal"`, kèm `missingFields: ["genre", "target_audience", "summary"]`. |
| **SP-ST-05** | Dòng 75–90, 100–115 | Mangaka nộp hồ sơ hoàn chỉnh hợp lệ khi có thành viên `Editorial Board` đang hoạt động.                                                  | HTTP `200`; thông báo `"Nộp hồ sơ xét duyệt thành công"`; Proposal chuyển sang `Submitted`.                                                           |
| **SP-ST-06** | Dòng 81–84, 92–98   | Gửi submit proposal hoàn chỉnh kèm header `x-force-empty-board: 1` để kích hoạt nhánh thông báo dự phòng tới `Admin` và `Tantou Editor`. | HTTP `200`; thông báo `"Nộp hồ sơ xét duyệt thành công"`.                                                                                             |
| **SP-ST-07** | Dòng 11–16, 116–118 | Gửi submit proposal kèm header `x-force-error: 1` (môi trường non-production) để kích hoạt khối `catch`.                                 | HTTP `500`; `error: "Lỗi server"`.                                                                                                                    |

### Branch Coverage

| ID           | Nhánh cần bao phủ (`submitProposal.js`)                                                        | Dữ liệu / thao tác Codecept                                                                     | Kết quả mong đợi                                                                                                    |
| :----------- | :--------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------ |
| **SP-BC-01** | Luồng hợp lệ cập nhật `findOneAndUpdate` thành công (`!proposal` là `false`)                   | Nộp Proposal `Draft` đầy đủ thông tin bắt buộc.                                                 | HTTP `200`; Proposal chuyển `Submitted`, ghi `submitted_at` và `review_deadline`.                                   |
| **SP-BC-02** | `if (!proposal)` là `true` (409) và `false` (200) khi tranh chấp đồng thời                     | Gửi đồng thời 2 request `POST /api/series/:id/proposal/submit` trên cùng Proposal `Draft`.      | Một request HTTP `200`; request còn lại HTTP `409` (`"Hồ sơ đang trong quá trình xét duyệt hoặc đang được xử lý"`). |
| **SP-BC-03** | `missingFields.length > 0` (`true`/`false`), `proposalToSubmit` là `null`, và các toán tử `?.` | Nộp khi Series chưa có `genre`, `target_audience`, `summary` (`400`) và khi đủ dữ liệu (`200`). | Ca thiếu dữ liệu trả HTTP `400` kèm `missingFields`; ca đủ dữ liệu trả HTTP `200`.                                  |
| **SP-BC-04** | `series.status === "Cancelled"` là `true` (400) và `false` (200)                               | Đổi Series sang `Cancelled` rồi gọi submit (`400`); đối chiếu với Series `Draft` (`200`).       | Series `Cancelled` trả HTTP `400` (`"Series đã bị hủy, không thể nộp proposal"`); Series hoạt động trả HTTP `200`.  |
| **SP-BC-05** | `proposalToSubmit && !SUBMITTABLE_STATUSES.includes(proposalToSubmit.status)`                  | Gửi submit khi Proposal `Submitted` (`true`), `Draft` (`false`) và `Need Revision` (`false`).   | Trạng thái `Submitted` trả HTTP `400`; `Draft` và `Need Revision` đều nộp thành công HTTP `200`.                    |
| **SP-BC-06** | `if (notifyUserIds.length === 0)` là `true` và `false`                                         | Gửi submit kèm header `x-force-empty-board: "1"` (`true`) và không kèm header (`false`).        | Khi không có `Editorial Board`, hệ thống gửi thông báo dự phòng tới `Admin` & `Tantou Editor` và trả HTTP `200`.    |
| **SP-BC-07** | Nhánh lỗi ngoại lệ `catch (err)` (`x-force-error: "1"`)                                        | Gửi submit kèm header `x-force-error: "1"` trên môi trường non-production.                      | Bắt ngoại lệ trong `catch` và trả HTTP `500` (`error: "Lỗi server"`).                                               |
