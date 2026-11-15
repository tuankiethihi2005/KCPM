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

## Bảng chuyển đổi trạng thái và bảng quyết định theo chức năng hiện có

Các bảng dưới đây mô tả `createSeries` và model hiện tại, không khẳng định các tiêu chí kiểm thử đề xuất ở trên đều đã được triển khai.

### Bảng chuyển đổi trạng thái

| Test case | Trạng thái đầu | Sự kiện / đầu vào                                                   | Trạng thái cuối / kết quả                   |
| --------- | -------------- | ------------------------------------------------------------------- | ------------------------------------------- |
| 1         | Chưa có Series | Tạo Series với dữ liệu hợp lệ, không gửi `summary`                  | Tạo Series ở `Draft`; không tạo Proposal.   |
| 2         | Chưa có Series | Tạo Series với dữ liệu hợp lệ và `summary` hợp lệ                   | Tạo Series ở `Draft` và Proposal ở `Draft`. |
| 3         | Chưa có Series | Thiếu `title`, `summary` không hợp lệ hoặc `editor_id` không hợp lệ | Request bị từ chối; không tạo Series.       |

### Bảng quyết định

`Y` = có/đúng; `N` = không/sai; `-` = không ảnh hưởng.

| Điều kiện / hành động                                                          | R1  | R2  | R3  |
| ------------------------------------------------------------------------------ | --- | --- | --- |
| C1: Các trường được gửi qua kiểm tra của handler/model, gồm `editor_id` nếu có | Y   | Y   | N   |
| C2: `summary` không có hoặc chỉ có khoảng trắng                                | Y   | N   | -   |
| C3: Có `summary` hợp lệ                                                        | -   | Y   | -   |
| A1: Tạo Series với trạng thái `Draft`                                          | X   | X   | -   |
| A2: Tạo Proposal với trạng thái `Draft`                                        | -   | X   | -   |
| A3: Từ chối request                                                            | -   | -   | X   |

**Lưu ý:** handler kiểm tra editor tồn tại và đúng role Tantou Editor; handler không kiểm tra trạng thái hoạt động của editor. Các trạng thái Series khác `Draft` trong model không được tạo bởi luồng này.

# White-box

## Phần 1 — Tạo Series

### Statement Coverage

### Statement Coverage (`createSeries.js`)

| Mã TC        | Dòng lệnh bao phủ (`createSeries.js`) | Mô tả kịch bản                                                                                                                | Dữ liệu đầu vào                                                                                                                         | Kết quả mong đợi                                                              |
| :----------- | :------------------------------------ | :---------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------- |
| **CS-ST-01** | Dòng 13–31                            | Thiếu trường bắt buộc `title`                                                                                                 | Đăng nhập `mangaka`; `POST /api/series` với `{ title: "" }`                                                                             | HTTP `400`, `message: "title là bắt buộc"`                                    |
| **CS-ST-02** | Dòng 33–37                            | `title` chứa ký tự markup HTML (`<`, `>`)                                                                                     | Đăng nhập `mangaka`; `POST /api/series` với `{ title: "Series <script>" }`                                                              | HTTP `400`, `message: "Tên series không được chứa ký tự markup HTML."`        |
| **CS-ST-03** | Dòng 39–42                            | `title` đã tồn tại trong cơ sở dữ liệu                                                                                        | Đăng nhập `mangaka`; gửi `POST /api/series` 2 lần với cùng `title`                                                                      | Lần 1: HTTP `201`; Lần 2: HTTP `400`, `message: "Series này đã tồn tại"`      |
| **CS-ST-04** | Dòng 44–57                            | `summary` vi phạm ràng buộc schema `SeriesProposal`                                                                           | Đăng nhập `mangaka`; `POST /api/series` với `title` hợp lệ và `summary` vượt quá độ dài tối đa (`5001` ký tự)                           | HTTP `400`, `message: "Dữ liệu proposal không hợp lệ"`                        |
| **CS-ST-05** | Dòng 59–65                            | `editor_id` sai định dạng MongoDB ObjectId                                                                                    | Đăng nhập `mangaka`; `POST /api/series` với `{ title, editor_id: "invalid-id" }`                                                        | HTTP `400`, `message: "editor_id không hợp lệ"`                               |
| **CS-ST-06** | Dòng 67–72                            | `editor_id` đúng định dạng nhưng không tồn tại trong DB                                                                       | Đăng nhập `mangaka`; `POST /api/series` với `{ title, editor_id: "507f1f77bcf86cd799439011" }`                                          | HTTP `400`, `message: "Không tìm thấy người dùng với editor_id đã cung cấp"`  |
| **CS-ST-07** | Dòng 74–78                            | Người dùng ứng với `editor_id` không có vai trò `Tantou Editor`                                                               | Đăng nhập `mangaka`; `POST /api/series` với `editor_id` là ID của user có role khác `Tantou Editor`                                     | HTTP `400`, `message` chứa `"không phải Tantou Editor"`                       |
| **CS-ST-08** | Dòng 8–9, 80–135                      | Tạo series thành công đầy đủ luồng (chuẩn hóa chuỗi rỗng, tạo `Series`, tạo `SeriesProposal`, gửi thông báo tác giả & editor) | Đăng nhập `mangaka`; `POST /api/series` với `title` duy nhất, `description: "   "`, `summary` hợp lệ và `editor_id` của `Tantou Editor` | HTTP `201`, `message: "Tạo series thành công"`, trả về `series` và `proposal` |
| **CS-ST-09** | Dòng 136–142                          | Lỗi `ValidationError` từ Mongoose khi lưu `Series`                                                                            | Đăng nhập `mangaka`; `POST /api/series` với `{ title, genre: { invalidCast: true } }`                                                   | HTTP `400`, `message: "Dữ liệu Series không hợp lệ"`                          |
| **CS-ST-10** | Dòng 144                              | Lỗi runtime khác `ValidationError` rơi vào nhánh `500`                                                                        | Đăng nhập `mangaka`; gửi `POST /api/series` với `Content-Type: text/plain` và body `"non-json-body"`                                    | HTTP `500`, `error: "Lỗi server"`                                             |

### Branch Coverage

| ID       | Nhánh cần chạy                                                     | Dữ liệu / thao tác Codecept                                                                                | Kết quả mong đợi                                                                                                                                      |
| -------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| CS-BC-01 | `!title` là true và false                                          | Gửi request không có title; ca đối chứng gửi title hợp lệ.                                                 | Ca thiếu title HTTP `400`; ca đối chứng tiếp tục xử lý.                                                                                               |
| CS-BC-02 | Title là chuỗi và có markup / không có markup                      | Gửi title có `<` hoặc `>`; ca đối chứng gửi title mới hợp lệ.                                              | Title có markup HTTP `400`; title hợp lệ đi tiếp.                                                                                                     |
| CS-BC-03 | `existingSeries` có kết quả và không có kết quả                    | Gửi title đã tồn tại; ca đối chứng gửi title duy nhất.                                                     | Title trùng HTTP `400`; title mới được tạo.                                                                                                           |
| CS-BC-04 | `if (editor_id)` là false và true                                  | Lần lượt bỏ editor ID và gửi editor ID.                                                                    | Không gửi ID thì bỏ qua tra cứu editor; có ID thì chạy validation editor.                                                                             |
| CS-BC-05 | Mỗi nhánh validation editor                                        | Gửi ID sai định dạng, ID hợp lệ nhưng không tồn tại, ID của user sai role, và ID của Tantou Editor hợp lệ. | Ba trường hợp đầu HTTP `400`; editor hợp lệ được gán vào Series.                                                                                      |
| CS-BC-06 | Chuẩn hóa trường tùy chọn nhận giá trị rỗng và giá trị có nội dung | Gửi trường tùy chọn bị bỏ qua; request khác gửi chuỗi chỉ khoảng trắng; request khác gửi chuỗi thường.     | Các request chạy qua các nhánh chuẩn hóa tương ứng; xác nhận dữ liệu lưu theo kết quả API.                                                            |
| CS-BC-07 | `typeof title === "string"` là false                               | Gửi request API với title kiểu số khác 0.                                                                  | Xác nhận hành vi hiện tại của API/model; nếu yêu cầu phải từ chối kiểu dữ liệu này thì cần bổ sung validation trước khi dùng làm testcase nghiệm thu. |

## Phần 2 — Proposal sau khi tạo Series

> **Ghi chú phạm vi:** Bộ testcase dưới đây được thiết kế để chạy **độc lập** và phủ toàn bộ các câu lệnh có thể thực thi của hàm `createSeries` liên quan đến Proposal, bao gồm cả các guard-statement ở Phần 1 mà mọi request đều phải đi qua. Các dòng lệnh 48–49 (defensive code) và 148 (HTTP 500 catch) không thể kích hoạt qua API — đây là độ phủ tối đa đạt được.

### Statement Coverage

| ID           | Dòng lệnh được phủ | Dữ liệu / thao tác Codecept                                                                          | Kết quả mong đợi                                                                       |
| :----------- | :----------------- | :--------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------- |
| **UP-ST-01** | Dòng 11–14         | Gửi `PUT /api/series/:id/proposal` với ID Series không tồn tại (`000000000000000000000000`).         | HTTP `404`; thông báo `"Không tìm thấy series"`.                                       |
| **UP-ST-02** | Dòng 16–25         | Gửi cập nhật proposal cho Series có proposal đang ở trạng thái `Submitted`.                          | HTTP `400`; thông báo từ chối kèm trạng thái `"Submitted"`.                            |
| **UP-ST-03** | Dòng 27–29         | Gửi cập nhật proposal không có trường `summary` (`summary: ""`).                                     | HTTP `400`; thông báo `"summary là bắt buộc"`.                                         |
| **UP-ST-04** | Dòng 31–38, 49     | Cập nhật proposal đang ở trạng thái `Need Revision` với `summary`, `characters`, `art_style` hợp lệ. | HTTP `200`; thông báo `"Lưu proposal thành công"`; trạng thái chuyển về `"Draft"`.     |
| **UP-ST-05** | Dòng 39–47, 49     | Gửi proposal hợp lệ cho Series chưa có proposal nào (`SeriesProposal.create`).                       | HTTP `200`; tạo proposal mới ở trạng thái `"Draft"`.                                   |
| **UP-ST-06** | Dòng 51–56         | Gửi `summary` quá ngắn vi phạm ràng buộc schema (`ValidationError`).                                 | HTTP `400`; thông báo `"Dữ liệu proposal không hợp lệ"`, kèm mảng `details`.           |
| **UP-ST-07** | Dòng 58            | Gửi `PUT /api/series/invalid-object-id/proposal` để kích hoạt lỗi `CastError` từ DB.                 | HTTP `500`; `error: "Lỗi server"`.                                                     |
| **UC-ST-01** | Dòng 8–10          | Gửi request upload không đính kèm file (`!req.file`).                                                | HTTP `400`; thông báo `"Không có file cover được upload"`.                             |
| **UC-ST-02** | Dòng 12–20         | Gửi upload cover cho Series chưa có proposal nào (`!proposal`).                                      | HTTP `400`; thông báo `"Cần tạo proposal trước khi upload cover"`.                     |
| **UC-ST-03** | Dòng 22–26         | Gửi upload cover khi proposal đang ở trạng thái `Submitted`.                                         | HTTP `400`; thông báo từ chối chứa `"Submitted"`.                                      |
| **UC-ST-04** | Dòng 28–35         | Upload file ảnh PNG hợp lệ cho proposal đang ở trạng thái `Draft`.                                   | HTTP `200`; thông báo `"Upload cover thành công"`; trả về `cover_image` và `proposal`. |

### Branch Coverage

| ID       | Nhánh cần chạy                                | Dữ liệu / thao tác Codecept                                                | Kết quả mong đợi                                                                                       |
| -------- | --------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| PR-BC-01 | Summary là `undefined`, `null`, và có giá trị | Gửi ba request riêng: bỏ summary, gửi `summary: null`, gửi summary hợp lệ. | Hai trường hợp đầu không tạo Proposal; trường hợp có giá trị chạy validation summary.                  |
| PR-BC-02 | Validation summary thất bại và thành công     | Gửi summary dưới giới hạn; ca đối chứng gửi summary hợp lệ.                | Summary không hợp lệ HTTP `400`; summary hợp lệ tiếp tục tạo Series và Proposal.                       |
| PR-BC-03 | Điều kiện tạo Proposal là false và true       | Lần lượt bỏ summary và gửi summary hợp lệ.                                 | Ca đầu không tạo Proposal; ca sau tạo Proposal và response trả Proposal.                               |
| PR-BC-04 | Nhánh thông báo editor là false và true       | Tạo Series không gán editor; ca khác gán Tantou Editor hợp lệ.             | Không có editor thì chỉ xử lý thông báo author; có editor thì xử lý thông báo cho cả author và editor. |

## Phần 3 — Lưu / Cập nhật Proposal (`upsertProposal.js`)

> **Ghi chú phạm vi:** Controller `upsertProposal.js` xử lý `PUT /api/series/:id/proposal`. Dòng 58 (catch lỗi 500) không thể kích hoạt qua API kiểm thử thông thường. Các testcase sau đảm bảo độ phủ tối đa (100% statement và branch khả thi).

### Statement Coverage

| ID       | Dữ liệu / thao tác Codecept                                                                            | Dòng lệnh được phủ | Kết quả mong đợi                                                                     |
| -------- | ------------------------------------------------------------------------------------------------------ | ------------------ | ------------------------------------------------------------------------------------ |
| UP-ST-01 | Gửi `PUT /api/series/:id/proposal` với ID Series không tồn tại (`000000000000000000000000`).           | Dòng 11–14         | HTTP `404`; thông báo `"Không tìm thấy series"`.                                     |
| UP-ST-02 | Gửi cập nhật proposal cho Series đang ở trạng thái `Submitted` (không thuộc nhóm `EDITABLE_STATUSES`). | Dòng 21–25         | HTTP `400`; thông báo từ chối kèm tên trạng thái `"Submitted"`.                      |
| UP-ST-03 | Gửi cập nhật proposal không có trường `summary` (hoặc `summary: ""`).                                  | Dòng 27–29         | HTTP `400`; thông báo `"summary là bắt buộc"`.                                       |
| UP-ST-04 | Cập nhật proposal đang ở trạng thái `Draft` với `summary`, `characters`, `art_style` mới hợp lệ.       | Dòng 31–38, 49     | HTTP `200`; thông báo `"Lưu proposal thành công"`; dữ liệu proposal được cập nhật.   |
| UP-ST-05 | Cập nhật proposal đang ở trạng thái `Need Revision`.                                                   | Dòng 35–37, 38, 49 | HTTP `200`; trạng thái proposal được chuyển về `"Draft"`.                            |
| UP-ST-06 | Gửi proposal cho Series chưa có proposal nào (tạo proposal mới qua `SeriesProposal.create`).           | Dòng 39–47, 49     | HTTP `200`; tạo proposal mới ở trạng thái `"Draft"`; thông báo thành công.           |
| UP-ST-07 | Gửi `summary` quá ngắn vi phạm ràng buộc schema (`ValidationError`).                                   | Dòng 51–56         | HTTP `400`; thông báo `"Dữ liệu proposal không hợp lệ"`; response có mảng `details`. |

### Branch Coverage

| ID       | Nhánh cần chạy                                                           | Dữ liệu / thao tác Codecept                                                          | Kết quả mong đợi                                                              |
| -------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| UP-BC-01 | `!series` là true và false                                               | Gửi ID không tồn tại; ca đối chứng gửi ID Series hợp lệ.                             | ID không tồn tại HTTP `404`; ID hợp lệ tiếp tục xử lý.                        |
| UP-BC-02 | `proposal && !EDITABLE_STATUSES.includes(proposal.status)` là true/false | Gửi request khi Proposal `Submitted`; ca đối chứng gửi khi Proposal `Draft`.         | Trạng thái không cho phép sửa HTTP `400`; trạng thái cho phép tiếp tục xử lý. |
| UP-BC-03 | `!summary` là true và false                                              | Gửi body thiếu `summary`; ca đối chứng gửi `summary` hợp lệ.                         | Thiếu summary HTTP `400`; có summary đi tiếp.                                 |
| UP-BC-04 | `if (proposal)` là true và false                                         | Gửi request cho Series đã có Proposal (`true`) và Series chưa có Proposal (`false`). | Đã có: cập nhật bản ghi hiện tại; chưa có: tạo bản ghi mới qua `create`.      |
| UP-BC-05 | `proposal.status === "Need Revision"` là true và false                   | Cập nhật proposal `Need Revision` (`true`) và cập nhật proposal `Draft` (`false`).   | `Need Revision` được đổi về `Draft`; `Draft` giữ nguyên trạng thái.           |
| UP-BC-06 | `err.name === "ValidationError"` trong catch là true                     | Gửi `summary` vi phạm minLength để kích hoạt Mongoose ValidationError.               | HTTP `400` với mảng `details`.                                                |

## Phần 4 — Upload ảnh bìa Proposal (`uploadCover.js`)

> **Ghi chú phạm vi:** Controller `uploadCover.js` xử lý `POST /api/series/:id/proposal/upload-cover`. Dòng 7–10 (`!series`) là defensive code do middleware `requireSeriesScope` đã bảo vệ; dòng 41 (catch 500) không thể kích hoạt qua API thông thường.

### Statement Coverage

| ID       | Dữ liệu / thao tác Codecept                                                                  | Dòng lệnh được phủ | Kết quả mong đợi                                                                              |
| -------- | -------------------------------------------------------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------------- |
| UC-ST-01 | Gửi request upload không đính kèm file (`!req.file`).                                        | Dòng 12–14         | HTTP `400`; thông báo `"Không có file cover được upload"`.                                    |
| UC-ST-02 | Gửi upload cover cho Series chưa có proposal nào (`!proposal`).                              | Dòng 20–24         | HTTP `400`; thông báo `"Cần tạo proposal trước khi upload cover"`.                            |
| UC-ST-03 | Gửi upload cover khi proposal đang ở trạng thái `Submitted` (`!EDITABLE_STATUSES.includes`). | Dòng 26–30         | HTTP `400`; thông báo từ chối chứa `"Submitted"`.                                             |
| UC-ST-04 | Upload file ảnh PNG hợp lệ cho proposal đang ở trạng thái `Draft`.                           | Dòng 32–39         | HTTP `200`; thông báo `"Upload cover thành công"`; trả về `cover_image` và proposal cập nhật. |
| UC-ST-05 | Upload file ảnh PNG hợp lệ cho proposal đang ở trạng thái `Need Revision`.                   | Dòng 32–39         | HTTP `200`; thông báo `"Upload cover thành công"`; cover được cập nhật.                       |

### Branch Coverage

| ID       | Nhánh cần chạy                                                  | Dữ liệu / thao tác Codecept                                                                       | Kết quả mong đợi                                                                          |
| -------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| UC-BC-01 | `!req.file \|\| !req.file.path` là true và false                | Lần lượt gửi request không có file và request có file PNG hợp lệ.                                 | Không có file HTTP `400`; có file tiếp tục xử lý.                                         |
| UC-BC-02 | `!proposal` là true và false                                    | Gửi upload cho Series chưa có proposal và Series đã có proposal `Draft`.                          | Chưa có proposal HTTP `400`; đã có proposal tiếp tục xử lý.                               |
| UC-BC-03 | `!EDITABLE_STATUSES.includes(proposal.status)` là true và false | Gửi upload khi Proposal `Submitted` (`true`) và khi Proposal `Draft` / `Need Revision` (`false`). | Trạng thái không cho phép HTTP `400`; trạng thái cho phép cập nhật thành công HTTP `200`. |
