/**
 * Helper xử lý URL Cloudinary để đảm bảo các file tài nguyên (zip, psd, raw)
 * được tải xuống đúng cách khi người dùng nhấp vào.
 *
 * Cloudinary phân loại file theo resource_type:
 *   - image: ảnh (jpg, png, webp, ...) -> URL hiển thị trực tiếp trên browser.
 *   - raw:    file nhị phân (zip, psd, ...) -> URL mặc định sẽ mở nội dung
 *            thay vì tải về. Cần thêm cờ `fl_attachment` để ép trình duyệt
 *            download thay vì render.
 *   - video:  file video.
 *
 * Hàm này nhận vào URL Cloudinary và trả về URL đã được chuẩn hoá:
 *   - Nếu URL là của Cloudinary và chứa "/raw/" (file nhị phân), chèn thêm
 *     `fl_attachment` để trình duyệt tải xuống thay vì hiển thị.
 *   - Nếu URL là của Cloudinary ảnh (image/video) mà người dùng muốn tải về
 *     (như file PSD/CLIP đã upload), cũng chèn `fl_attachment`.
 *   - Nếu URL không phải Cloudinary (link ngoài), trả về nguyên bản.
 */
const RAW_EXTENSIONS = [
  ".zip",
  ".rar",
  ".7z",
  ".tar",
  ".gz",
  ".psd",
  ".clip",
  ".psb",
  ".ai",
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
];

const buildCloudinaryDownloadUrl = (rawUrl, fallbackFilename) => {
  if (!rawUrl || typeof rawUrl !== "string") return rawUrl;

  // Chỉ xử lý URL Cloudinary; các URL khác (S3, http ngoài) để nguyên.
  const isCloudinary = rawUrl.includes("res.cloudinary.com");
  if (!isCloudinary) return rawUrl;

  // Tách phần query string nếu có để tránh chèn `fl_attachment` sai chỗ.
  const [baseUrl, existingQuery = ""] = rawUrl.split("?");
  const queryParams = new URLSearchParams(existingQuery);

  // Nếu đã có `fl_attachment` rồi thì thôi.
  if (queryParams.has("fl_attachment")) return rawUrl;

  const isRawFile = baseUrl.includes("/raw/") ||
    RAW_EXTENSIONS.some((ext) => baseUrl.toLowerCase().endsWith(ext));

  if (isRawFile) {
    // Ưu tiên đặt tên file theo fallbackFilename (thường là tên file gốc).
    if (fallbackFilename) {
      queryParams.set("fl_attachment", fallbackFilename);
    } else {
      queryParams.set("fl_attachment", "true");
    }
  }

  const queryString = queryParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};

module.exports = { buildCloudinaryDownloadUrl };