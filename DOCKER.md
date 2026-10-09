# Docker Setup

Tài liệu này mô tả cách build và chạy hai Docker image của KCPM:

- `kcpm-backend`: API Express chạy trên port `5000`
- `kcpm-frontend`: giao diện React/Vite chạy qua Nginx trên port `8080`

## 1. Các file Docker

```text
backend/
├── Dockerfile
└── .dockerignore

frontend/
├── Dockerfile
├── nginx.conf
└── .dockerignore
```

### Backend Dockerfile

Backend dùng image `node:20-alpine`, cài dependency bằng `npm ci`, copy source và chạy:

```text
node src/server.js
```

File `.env` không được copy vào image. Khi chạy container, truyền cấu hình bằng `--env-file`.

### Frontend Dockerfile

Frontend dùng multi-stage build:

1. Stage Node cài dependency và chạy `npm run build`.
2. Stage Nginx phục vụ thư mục `dist` ở port `80`.

URL API được truyền lúc build bằng biến:

```text
VITE_API_BASE_URL
```

Ví dụ local:

```text
http://localhost:5000/api
```

`nginx.conf` dùng `try_files` để các route React như `/login` và `/dashboard` không bị lỗi `404` khi refresh trang.

## 2. Điều kiện trước khi chạy

Kiểm tra Docker:

```powershell
docker --version
docker run hello-world
```

Backend cần có file:

```text
backend/.env
```

File này chứa các biến môi trường như MongoDB, JWT và Cloudinary. Không commit file `.env` lên GitHub hoặc đưa secret vào Dockerfile.

## 3. Build image

Chạy tại thư mục root của project:

```powershell
docker build --no-cache -t kcpm-backend:1.0.1 .\backend
```

```powershell
docker build --no-cache `
  --build-arg VITE_API_BASE_URL=http://localhost:5000/api `
  -t kcpm-frontend:1.0.0 `
  .\frontend
```

Kiểm tra image:

```powershell
docker images kcpm-backend
docker images kcpm-frontend
```

## 4. Chạy container

Chạy backend:

```powershell
docker run -d `
  --name kcpm-backend `
  --env-file .\backend\.env `
  -p 5000:5000 `
  kcpm-backend:1.0.1
```

Chạy frontend:

```powershell
docker run -d `
  --name kcpm-frontend `
  -p 8080:80 `
  kcpm-frontend:1.0.0
```

Truy cập:

```text
Frontend: http://localhost:8080
Backend:  http://localhost:5000
```

Kiểm tra container:

```powershell
docker ps
```

Xem log:

```powershell
docker logs kcpm-backend
docker logs kcpm-frontend
```

## 5. Khi thay đổi code

Nếu sửa backend, cần build image backend version mới rồi tạo lại container:

```powershell
docker build --no-cache -t kcpm-backend:1.0.2 .\backend
docker rm -f kcpm-backend
docker run -d `
  --name kcpm-backend `
  --env-file .\backend\.env `
  -p 5000:5000 `
  kcpm-backend:1.0.2
```

Nếu sửa frontend, cần build lại frontend vì Vite nhúng API URL vào static files:

```powershell
docker build --no-cache `
  --build-arg VITE_API_BASE_URL=http://localhost:5000/api `
  -t kcpm-frontend:1.0.1 `
  .\frontend
```

## 6. Kiểm tra nhanh

Backend:

```powershell
Invoke-WebRequest http://localhost:5000/ -UseBasicParsing
```

Frontend:

```powershell
Invoke-WebRequest http://localhost:8080/ -UseBasicParsing
```

Nếu frontend gọi API bị CORS, backend phải cho phép origin:

```text
http://localhost:8080
```

## 7. Docker Hub

Phần tag và push image lên Docker Hub được thực hiện sau khi hai container chạy ổn định local.

Quy trình dự kiến:

```text
Build local
→ Test container
→ docker login
→ Tag theo username Docker Hub
→ Push image version
→ Push tag latest
```

