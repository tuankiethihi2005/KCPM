# Kiểm thử điều kiện duyệt và xuất bản Chapter

## Phạm vi

Luồng kiểm thử dành cho Tantou Editor, Editorial Board và Admin khi xác nhận bản cuối và publish chapter:

- `POST /api/publish/chapter/:chapter_id`
- Chapter liên kết với `release_issue_id` nếu có kỳ phát hành.

Endpoint yêu cầu đăng nhập và role `Tantou Editor`, `Editorial Board` hoặc `Admin`, đồng thời phải vượt kiểm tra scope chapter.

## Điều kiện bắt buộc để publish

Chapter chỉ được chuyển sang `Published` khi đồng thời thỏa mãn:

```text
Có ít nhất một page
AND mọi page có status = Approved
AND mọi task thuộc các page có status = Approved hoặc Paid
AND mọi annotation thuộc các page có status = Resolved
```

Khi thành công, hệ thống phải lưu `status=Published`, `published_at` và liên kết release issue nếu request có gửi `release_issue_id`.

## Phân vùng dữ liệu

| Điều kiện | Hợp lệ | Không hợp lệ / biên |
| --- | --- | --- |
| Chapter | Chapter tồn tại, chưa publish, thuộc scope người gọi | Không tồn tại, ID sai, đã `Published` |
| Page | Có ít nhất một page; tất cả `Approved` | Không có page, còn `Draft`, `Submitted` hoặc trạng thái khác |
| Task | Tất cả là `Approved` hoặc `Paid` | `Assigned`, `In Progress`, `Submitted`, `Rejected` |
| Annotation | Không có annotation hoặc tất cả `Resolved` | Còn `Open`, `In Progress`, `Reopened` |
| Release issue | ID hợp lệ của kỳ phát hành tồn tại | ID sai format, không tồn tại, liên kết mồ côi |
| Quyền | Tantou Editor, Editorial Board, Admin đúng scope | Mangaka, Assistant, người chưa đăng nhập, editor ngoài scope |

## Test case

| ID | Dữ liệu / thao tác | Kết quả mong đợi |
| --- | --- | --- |
| PC-01 | Publish chapter không có page. | HTTP `400`; chapter không đổi trạng thái và không có `published_at`. |
| PC-02 | Có page nhưng một page chưa `Approved`. | HTTP `400`; trả số lượng page chưa duyệt nếu có; không publish. |
| PC-03 | Mọi page `Approved` nhưng còn task `Submitted`. | HTTP `400`; không publish và không gửi thông báo thành công. |
| PC-04 | Mọi page/task đạt nhưng còn annotation `Open` hoặc `Reopened`. | HTTP `400`; không publish. |
| PC-05 | Không có annotation; mọi page `Approved`, task `Approved/Paid`. | HTTP `200`; chapter chuyển `Published`, lưu thời điểm phát hành. |
| PC-06 | Publish happy path kèm `release_issue_id` hợp lệ. | HTTP `200`; chapter lưu đúng liên kết kỳ phát hành. |
| PC-07 | Gửi release issue không tồn tại hoặc sai định dạng. | Từ chối rõ ràng; không lưu liên kết mồ côi và không publish nửa chừng. |
| PC-08 | Mangaka, Assistant hoặc Editor ngoài scope gọi API. | HTTP `403`; mọi dữ liệu chapter giữ nguyên. |
| PC-09 | Gọi lại API với chapter đã `Published`. | Không ghi đè `published_at`, không tạo notification trùng; hành vi phải nhất quán theo đặc tả idempotency. |
| PC-10 | Notification cho tác giả và editor bị lỗi sau khi lưu chapter. | Kết quả publish vẫn có thể đối soát; lỗi notification được ghi log/có cơ chế retry, không trả thành công giả. |

## Tiêu chí pass

- Không có đường tắt chuyển chapter sang `Published` khi một điều kiện thất bại.
- Việc lưu trạng thái, thời điểm và release issue nhất quán.
- Không tạo notification trùng khi retry request.
- Lỗi input trả `400`, chapter không tồn tại trả `404`, thiếu quyền trả `403`.

