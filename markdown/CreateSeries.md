# Kiểm thử đầu vào chức năng tạo Series

> **Tiêu chí đề xuất để thiết kế kiểm thử**, không phải các giới hạn đã được xác nhận là đang áp dụng trong code. Có thể dùng bảng này làm yêu cầu đầu vào mục tiêu; cần triển khai validation tương ứng nếu muốn ứng dụng thực thi các quy tắc đó.

## 1. Thông tin Series

| Điều kiện                                | Phân vùng hợp lệ                                                                                                                  | Tag      | Phân vùng không hợp lệ                                                                                                | Tag                  | Giá trị biên / dữ liệu kiểm thử                                                                          | Tag                                     |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| **Tên series** (`title`)                 | 2–100 ký tự sau khi bỏ khoảng trắng đầu/cuối<br>Chữ Unicode (gồm tiếng Việt), số, dấu cách và dấu câu thông dụng trong tên truyện | V1<br>V2 | Bỏ trống/chỉ có khoảng trắng<br>Dưới 2 hoặc trên 100 ký tự<br>Chứa ký tự điều khiển hoặc ký tự định dạng như `<`, `>` | X1<br>X2<br>X3<br>X4 | 2 ký tự<br>3 ký tự<br>99 ký tự<br>100 ký tự<br>101 ký tự                                                 | B1<br>B2<br>B3<br>B4<br>B5<br>          |
| **Mô tả ngắn** (`description`)           | Để trống hoặc tối đa 1000 ký tự; văn bản thường                                                                                   | V3       | Trên 1000 ký tự<br>Chỉ nhập khoảng trắng                                                                              | X5<br>X6             | Để trống<br>1 ký tự<br>999 ký tự<br>1000 ký tự<br>1001 ký tự                                             | B6<br>B7<br>B8<br>B9<br>B10             |
| **Thể loại** (`genre`)                   | Để trống hoặc 2–50 ký tự; cho phép chữ, số, dấu cách, dấu phẩy và dấu gạch nối                                                    | V4       | Dưới 2 hoặc trên 50 ký tự<br>Chỉ nhập khoảng trắng<br>Chứa ký tự điều khiển                                           | X7<br>X8<br>X9       | Để trống<br>2 ký tự<br>3 ký tự<br>49 ký tự<br>50 ký tự<br>51 ký tự                                       | B11<br>B12<br>B13<br>B14<br>B15<br>B16  |
| **Độc giả mục tiêu** (`target_audience`) | Để trống hoặc 2–50 ký tự; mô tả nhóm độc giả bằng văn bản                                                                         | V5       | Dưới 2 hoặc trên 50 ký tự<br>Chỉ nhập khoảng trắng<br>Chứa ký tự điều khiển                                           | X10<br>X11<br>X12    | Để trống<br>2 ký tự<br>3 ký tự<br>49 ký tự<br>50 ký tự<br>51 ký tự                                       | B17<br>B18<br>B199<br>B20<br>B21<br>B22 |
| **Tantou Editor** (`editor_id`)          | Để trống hoặc chọn một editor đang hoạt động từ danh sách                                                                         | V6       | ID không tồn tại/không hợp lệ<br>Editor không hoạt động hoặc không có quyền                                           | X13<br>X14           | Không chọn<br>Chọn editor đang hoạt động<br>Gửi ID không tồn tại<br>Gửi ID của người dùng không đủ quyền | B23<br>B24<br>B25<br>B26                |

### Quy tắc đề xuất cho tên series

- Cho phép chữ cái Unicode (bao gồm dấu tiếng Việt và chữ Nhật), chữ số, khoảng trắng và dấu câu thường dùng trong tiêu đề, ví dụ: `. , ! ? : ; ' " ( ) [ ] - _ &`.
- Không cho phép ký tự điều khiển, ký tự xuống dòng hoặc ký tự `<` và `>` để tránh nhập nội dung giống markup.
- So sánh tính duy nhất sau khi bỏ khoảng trắng đầu/cuối; nên thống nhất việc có phân biệt chữ hoa/chữ thường hay không trước khi triển khai.
- Các giới hạn độ dài tính theo ký tự hiển thị sau khi trim, không tính theo số byte.

## 2. Proposal sau khi tạo Series

| Điều kiện                             | Phân vùng hợp lệ                                                      | Tag | Phân vùng không hợp lệ                                           | Tag        | Giá trị biên / dữ liệu kiểm thử                                                                       | Tag                                    |
| ------------------------------------- | --------------------------------------------------------------------- | --- | ---------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------- |
| **Tóm tắt truyện** (`summary`)        | 20–2000 ký tự sau khi trim                                            | V7  | Bỏ trống/chỉ có khoảng trắng<br>Dưới 20 hoặc trên 2000 ký tự     | X15<br>X16 | 19 ký tự<br>20 ký tự<br>21 ký tự<br>1999 ký tự<br>2000 ký tự<br>2001 ký tự                            | B27<br>B28<br>B29<br>B30<br>B31<br>B32 |
| **Nhân vật** (`characters`)           | Để trống hoặc tối đa 2000 ký tự                                       | V8  | Trên 2000 ký tự                                                  | X17        | Để trống<br>1 ký tự<br>1999 ký tự<br>2000 ký tự<br>2001 ký tự                                         | B33<br>B34<br>B35<br>B36<br>B37        |
| **Phong cách hình ảnh** (`art_style`) | Để trống hoặc tối đa 500 ký tự                                        | V9  | Trên 500 ký tự                                                   | X18        | Để trống<br>1 ký tự<br>499 ký tự<br>500 ký tự<br>501 ký tự                                            | B38<br>B39<br>B40<br>B41<br>B42        |
| **Ảnh bìa / Concept art**             | Không bắt buộc; ảnh JPG, JPEG, PNG hoặc WEBP; dung lượng tối đa 10 MB | V10 | File không phải ảnh/định dạng không hỗ trợ<br>File lớn hơn 10 MB | X19<br>X20 | Ảnh đúng định dạng nhỏ hơn 10 MB<br>Ảnh đúng định dạng đúng 10 MB<br>Ảnh đúng định dạng lớn hơn 10 MB | B43<br>B44<br>B45                      |

## Quy ước tag

- `V`: phân vùng hợp lệ.
- `X`: phân vùng không hợp lệ.
- `B`: trường hợp kiểm thử biên hoặc dữ liệu đại diện.
- Các giới hạn nêu trên là giá trị đề xuất để có bộ kiểm thử cụ thể; cần được xác nhận theo yêu cầu sản phẩm trước khi dùng làm tiêu chí nghiệm thu.

# Test case kiểm thử đầu vào chức năng tạo Series

> Các giới hạn dưới đây là tiêu chí kiểm thử đề xuất. Kết quả mong đợi giả định hệ thống đã triển khai đúng các quy tắc này.

## Phần 1 — Tạo Series

| ID    | Dữ liệu nhập                                                                                                                                                                         | Kết quả mong đợi                                                               |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| CS-01 | `title`: `AB`; để trống `description`, `genre`, `target_audience`; không chọn editor.                                                                                                | Tạo thành công; các trường tùy chọn rỗng được chấp nhận; trạng thái `Draft`.   |
| CS-02 | `title`: chuỗi hợp lệ đúng 100 ký tự, gồm chữ tiếng Việt/số/dấu câu cho phép; `description`: 1000 ký tự; `genre`: 50 ký tự; `target_audience`: 50 ký tự; chọn editor đang hoạt động. | Tạo thành công; các giá trị được lưu đầy đủ; trạng thái `Draft`.               |
| CS-03 | `title`: để trống.                                                                                                                                                                   | Từ chối; báo tên Series bắt buộc; không tạo bản ghi.                           |
| CS-04 | `title`: chỉ gồm dấu cách (ví dụ `"   "`).                                                                                                                                           | Từ chối; không chấp nhận tên rỗng sau khi trim; không tạo bản ghi.             |
| CS-05 | `title`: `A` (1 ký tự).                                                                                                                                                              | Từ chối do ngắn hơn 2 ký tự.                                                   |
| CS-06 | `title`: chuỗi hợp lệ dài 101 ký tự.                                                                                                                                                 | Từ chối do vượt giới hạn 100 ký tự.                                            |
| CS-07 | `title`: `Tên <b>Series</b>`.                                                                                                                                                        | Từ chối do chứa `<` và `>`.                                                    |
| CS-08 | Đã tồn tại Series tên `Blue Orbit`; nhập `title`: `  Blue Orbit  `.                                                                                                                  | Từ chối trùng tên sau khi trim; không tạo bản ghi trùng.                       |
| CS-09 | `title`: `Truyện 2: Hành trình!` (có tiếng Việt, chữ số, dấu cách và dấu câu hợp lệ); các trường khác hợp lệ.                                                                        | Tạo thành công; xác nhận các ký tự được cho phép và lưu đúng tên sau khi trim. |
| CS-10 | `description`: chuỗi 1001 ký tự; các trường khác hợp lệ.                                                                                                                             | Từ chối do mô tả vượt 1000 ký tự.                                              |
| CS-11 | `genre`: `A` (1 ký tự); các trường khác hợp lệ.                                                                                                                                      | Từ chối do thể loại ngắn hơn 2 ký tự.                                          |
| CS-12 | `genre`: chuỗi 51 ký tự; các trường khác hợp lệ.                                                                                                                                     | Từ chối do thể loại vượt 50 ký tự.                                             |
| CS-13 | `target_audience`: `A` (1 ký tự); các trường khác hợp lệ.                                                                                                                            | Từ chối do độc giả mục tiêu ngắn hơn 2 ký tự.                                  |
| CS-14 | `target_audience`: chuỗi 51 ký tự; các trường khác hợp lệ.                                                                                                                           | Từ chối do độc giả mục tiêu vượt 50 ký tự.                                     |
| CS-15 | `editor_id`: ID không tồn tại; các trường khác hợp lệ.                                                                                                                               | Từ chối; báo editor không hợp lệ; không tạo Series.                            |
| CS-16 | `editor_id`: ID của người dùng không hoạt động/không có quyền Tantou Editor; các trường khác hợp lệ.                                                                                 | Từ chối; không gán editor không hợp lệ và không tạo Series.                    |

## Phần 2 — Proposal sau khi tạo Series

| ID    | Dữ liệu nhập                                                                                        | Kết quả mong đợi                                                                      |
| ----- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| PR-01 | `summary`: chuỗi đúng 20 ký tự; `characters` và `art_style` để trống; không upload ảnh bìa.         | Lưu proposal thành công; các trường tùy chọn rỗng và không có ảnh bìa được chấp nhận. |
| PR-02 | `summary`: 2000 ký tự; `characters`: 2000 ký tự; `art_style`: 500 ký tự; upload PNG/JPG đúng 10 MB. | Lưu proposal và ảnh thành công; dữ liệu được lưu đầy đủ.                              |
| PR-03 | `summary`: để trống.                                                                                | Từ chối; báo tóm tắt bắt buộc; không lưu proposal.                                    |
| PR-04 | `summary`: chỉ gồm dấu cách.                                                                        | Từ chối; không chấp nhận tóm tắt rỗng sau khi trim.                                   |
| PR-05 | `summary`: chuỗi 19 ký tự.                                                                          | Từ chối do ngắn hơn 20 ký tự.                                                         |
| PR-06 | `summary`: chuỗi 2001 ký tự.                                                                        | Từ chối do vượt 2000 ký tự.                                                           |
| PR-07 | `characters`: chuỗi 2001 ký tự; các trường khác hợp lệ.                                             | Từ chối do vượt 2000 ký tự.                                                           |
| PR-08 | `art_style`: chuỗi 501 ký tự; các trường khác hợp lệ.                                               | Từ chối do vượt 500 ký tự.                                                            |
| PR-09 | Upload file văn bản hoặc định dạng không hỗ trợ (ví dụ `.txt`).                                     | Từ chối upload; báo định dạng không hợp lệ; không thay đổi ảnh bìa hiện tại.          |
| PR-10 | Upload ảnh PNG/JPG hợp lệ lớn hơn 10 MB.                                                            | Từ chối upload do vượt dung lượng; không thay đổi ảnh bìa hiện tại.                   |

## Ghi chú dữ liệu

- Với các ca ghi “chuỗi N ký tự”, tạo chuỗi có đúng N ký tự; giữ các trường còn lại ở giá trị hợp lệ để xác định đúng trường gây lỗi.
- Dùng dữ liệu mới cho mỗi ca tạo thành công; chuẩn bị sẵn Series `Blue Orbit`, editor đang hoạt động và editor không hợp lệ cho các ca tương ứng.
- CS-01/CS-02 và PR-01/PR-02 gộp nhiều giá trị hợp lệ để giảm số ca chạy; các ca không hợp lệ được tách riêng để lỗi của trường này không che lỗi trường khác.
- Quy tắc tên đề xuất: cho phép chữ Unicode (gồm tiếng Việt), số, khoảng trắng và dấu câu thường dùng; cấm ký tự điều khiển, xuống dòng, `<` và `>`. Tính duy nhất so sánh sau khi trim.
- Các giới hạn trong tài liệu là yêu cầu kiểm thử đề xuất, chưa khẳng định ứng dụng hiện tại đã kiểm tra chúng.
