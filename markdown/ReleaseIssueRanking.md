# Kiểm thử kỳ phát hành, nhập dữ liệu và hiệu suất Ranking

## Phạm vi

Tài liệu dành cho Editorial Board và Admin khi tạo release issue, import dữ liệu độc giả, xem leaderboard và biểu đồ hiệu suất:

- `GET /api/issues`
- `POST /api/issues`
- `POST /api/issues/:issueId/import-votes`
- `GET /api/rankings`
- `GET /api/rankings/performance/:seriesId`

## Điều kiện dữ liệu

| Trường | Hợp lệ | Không hợp lệ / biên |
| --- | --- | --- |
| Release issue | `id`, tên, ngày phát hành, type và series tồn tại | Trùng `id`/tên, ngày sai, series không tồn tại |
| File import | Có header `seriesId,votes,avgScore`; có ít nhất một dòng | Thiếu file, thiếu cột, file rỗng |
| `seriesId` | ID, slug hoặc title của series có trong hệ thống và thuộc issue | Series không tồn tại hoặc ngoài danh sách issue |
| `votes` | Số nguyên không âm, gồm `0` | Số âm, chuỗi chữ, giá trị dạng prefix như `10abc` |
| `avgScore` | Số từ `0` đến `10`, gồm hai biên | Âm, lớn hơn `10`, `5xyz` |
| Scope xem | Board/Admin xem toàn bộ; Mangaka/Editor xem đúng series của mình | Truy cập performance ngoài scope |

## Test case

| ID | Dữ liệu / thao tác | Kết quả mong đợi |
| --- | --- | --- |
| RI-01 | Board tạo issue với dữ liệu đầy đủ và danh sách series hợp lệ. | HTTP `201`; issue ở trạng thái `Planned`, lưu đúng type/ngày/series. |
| RI-02 | Editor hoặc Mangaka thử tạo issue. | HTTP `403`; không tạo bản ghi. |
| RI-03 | Tạo issue trùng custom id hoặc tên. | HTTP `400`; không tạo issue thứ hai. |
| RI-04 | Import file hợp lệ với header bắt buộc và các series thuộc issue. | HTTP `200`; ReaderVote và Ranking được upsert cho đúng issue/series. |
| RI-05 | Import không có file, file rỗng hoặc thiếu header. | HTTP `400`; không ghi dữ liệu dở dang. |
| RI-06 | Import `votes=0`, `avgScore=0` và `avgScore=10`. | Chấp nhận; dữ liệu lưu đúng giá trị biên. |
| RI-07 | Import số âm, `avgScore=11`, `votes=10abc` hoặc `avgScore=5xyz`. | HTTP `400`; từ chối toàn bộ dòng/file, không parse một phần. |
| RI-08 | File chứa series không tồn tại hoặc không thuộc issue. | HTTP `400`; không import ngoài kế hoạch. |
| RI-09 | Số lượng series trong file không khớp danh sách issue. | HTTP `400`; không cập nhật ranking một phần. |
| RI-10 | Board lọc leaderboard theo issue, genre và author. | Chỉ trả series phù hợp từng bộ lọc; thứ hạng và điểm đúng kỳ. |
| RI-11 | Series có kỳ trước hạng `2`, kỳ mới hạng `1`; kiểm tra các trường hợp giảm, ổn định, mới. | Trend lần lượt `UP`, `DOWN`, `STABLE`, `NEW` theo dữ liệu lịch sử. |
| RI-12 | Mangaka/Editor xem performance series ngoài phạm vi. | HTTP `403`; không trả dữ liệu hiệu suất. |
| RI-13 | Yêu cầu performance series không tồn tại. | HTTP `404`; không trả chart rỗng như dữ liệu hợp lệ. |

## Tiêu chí pass

- Import có tính nguyên tử: lỗi một điều kiện không làm lưu một phần.
- Ranking liên kết đúng `ReleaseIssue`, `Series`, `ReaderVote` và `Ranking`.
- `votes` và `avgScore` được kiểm tra chặt, không chấp nhận parse prefix.
- Bộ lọc và RBAC không làm lộ dữ liệu series ngoài scope.
- Biểu đồ hiệu suất phản ánh đúng tối đa 10 kỳ gần nhất.

> Công thức điểm tổng hợp và ngưỡng `cancellationWarning` hiện là logic triển khai; nếu thay đổi theo chính sách Editorial phải cập nhật tài liệu và test tương ứng.

