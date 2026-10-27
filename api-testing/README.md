# KCPM API Testing

Thư mục này chứa:

- `Manga Management.postman_collection.json`: collection gồm các request API.
- `Manga Management.postman_environment.json`: environment local và các biến dùng chung.

## Cách import vào Postman

1. Mở Postman.
2. Chọn **Import**.
3. Import hai file JSON trong thư mục này.
4. Chọn environment **Manga Management** ở góc trên bên phải.
5. Chạy backend tại `http://localhost:5000`.

Environment đã cấu hình:

```text
baseUrl = http://localhost:5000/api
```

## Thứ tự test đề nghị

```text
Auth & Users
→ Series
→ Proposal
→ Board
→ Chapters
→ Pages
→ Annotation / Region
→ Tasks
→ Publish & Issues
→ Ranking / Notifications / Income
→ Admin Dashboard
```

## Các biến chính

| Biến | Mục đích |
|---|---|
| `accessToken` | Token đăng nhập cho API cần xác thực |
| `userId` | ID user đang test |
| `seriesId` | ID series |
| `editorId` | ID Tantou Editor |
| `authorId` | ID tác giả |
| `proposalId` | ID proposal |
| `chapterId` | ID chapter |
| `pageId` | ID page |
| `annotationId` | ID annotation |

Chạy **Login** trước để lấy token. Các request tạo dữ liệu thường có script lưu ID vào environment để dùng cho request tiếp theo.

## Lưu ý

- Các request public như Login, Logout và Refresh không cần Bearer Token.
- Các request còn lại cần dùng `{{accessToken}}`.
- `refresh_token` của backend được lưu trong cookie HttpOnly; Postman cần bật Cookie Jar.
- Không thay `seriesId` bằng `chapterId`, hoặc `chapterId` bằng `pageId`.
- Nếu API trả `401`, đăng nhập lại và kiểm tra environment đang được chọn.
- Nếu API upload file, chọn đúng loại **form-data** và field file theo request.

Environment JSON hiện chỉ chứa giá trị local và các biến trống, không nên điền access token hoặc secret thật rồi commit lên GitHub.
