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

| Điều kiện | Phân vùng hợp lệ | Tag | Phân vùng không hợp lệ | Tag | Giá trị biên / dữ liệu kiểm thử | Tag |
| --- | --- | --- | --- | --- | --- | --- |
| **Chapter** | Chapter tồn tại, chưa publish, thuộc scope người gọi | V1 | Chapter không tồn tại<br>ID sai<br>Chapter đã `Published` | X1, X2, X3 | Chapter hợp lệ<br>ID không tồn tại<br>Chapter đã `Published` | B1, B2, B3 |
| **Page** | Có ít nhất một page; tất cả đều `Approved` | V2 | Không có page<br>Còn page `Draft`, `Submitted` hoặc trạng thái khác | X4, X5 | Không có page<br>Một page `Approved`<br>Nhiều page cùng `Approved`<br>Page có trạng thái chưa duyệt | B4, B5, B6, B7 |
| **Task** | Tất cả task thuộc các page đều `Approved` hoặc `Paid` | V3 | Còn task `Assigned`, `In Progress`, `Submitted` hoặc `Rejected` | X6 | Không có task<br>Tất cả `Approved`<br>Tất cả `Paid`<br>Kết hợp `Approved` và `Paid`<br>Còn một task chưa đạt | B8, B9, B10, B11, B12 |
| **Annotation** | Không có annotation hoặc tất cả đều `Resolved` | V4 | Còn annotation `Open`, `In Progress` hoặc `Reopened` | X7 | Không có annotation<br>Tất cả `Resolved`<br>Còn một annotation chưa `Resolved` | B13, B14, B15 |
| **Release issue** | Release issue tồn tại và ID hợp lệ nếu request có gửi | V5 | ID sai format<br>Không tồn tại<br>Liên kết mồ côi | X8, X9, X10 | Không gửi ID<br>ID hợp lệ<br>ID sai format<br>ID không tồn tại | B16, B17, B18, B19 |
| **Quyền** | Tantou Editor, Editorial Board hoặc Admin đúng scope | V6 | Mangaka<br>Assistant<br>Chưa đăng nhập<br>Editor ngoài scope | X11, X12, X13, X14 | Mỗi role hợp lệ đúng scope<br>Role ngoài danh sách<br>Phiên đăng xuất<br>Editor ngoài scope | B20, B21, B22, B23 |

## Test case

| ID | Dữ liệu nhập / thao tác | Kết quả mong đợi |
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

## Bảng chuyển đổi trạng thái và bảng quyết định theo chức năng hiện có

Các bảng dưới đây mô tả trực tiếp luồng xử lý trong `publishChapter.js` và middleware phân quyền hiện tại.

### Bảng chuyển đổi trạng thái

| Test case | Trạng thái Chapter đầu | Sự kiện / đầu vào | Trạng thái Chapter cuối / kết quả |
| --- | --- | --- | --- |
| 1 | `Draft` / `In Production` / `Waiting Review` / `Approved` | Gọi publish khi Chapter chưa có trang, còn trang chưa `Approved`, còn task chưa `Approved`/`Paid`, hoặc còn annotation chưa `Resolved` | Request bị từ chối (`400`); trạng thái Chapter giữ nguyên. |
| 2 | `Draft` / `In Production` / `Waiting Review` / `Approved` | Gọi publish khi có ít nhất 1 trang, mọi trang `Approved`, mọi task `Approved`/`Paid` và mọi annotation `Resolved` | Chapter chuyển sang `Published`; ghi nhận `published_at` và `release_issue_id` (nếu có); gửi thông báo cho tác giả và editor. |
| 3 | Bất kỳ | Chapter không tồn tại hoặc người gọi ngoài scope / không đủ quyền | Request bị từ chối (`403` / `404`); không thay đổi dữ liệu. |

### Bảng quyết định

`Y` = có/đúng; `N` = không/sai; `-` = không ảnh hưởng.

| Điều kiện / hành động | R1 | R2 | R3 | R4 | R5 | R6 |
| --- | --- | --- | --- | --- | --- | --- |
| C1: Chapter tồn tại và người gọi có quyền ghi trên Chapter | Y | Y | Y | Y | Y | N |
| C2: Chapter có ít nhất 1 trang (`pages.length > 0`) | Y | N | Y | Y | Y | - |
| C3: Tất cả các trang đều ở trạng thái `Approved` | Y | - | N | Y | Y | - |
| C4: Tất cả các task trên các trang đều ở trạng thái `Approved` hoặc `Paid` | Y | - | - | N | Y | - |
| C5: Tất cả các annotation trên các trang đều ở trạng thái `Resolved` | Y | - | - | - | N | - |
| A1: Chuyển Chapter sang `Published`, lưu `published_at` và gửi thông báo | X | - | - | - | - | - |
| A2: Từ chối `400` (Báo thiếu trang / trang chưa duyệt / task chưa xong / annotation chưa đóng) | - | X | X | X | X | - |
| A3: Từ chối `403` hoặc `404` | - | - | - | - | - | X |