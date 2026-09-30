const annotationService = require("../../services/annotationService");

/**
 * AnnotationController - Xử lý HTTP request/response cho Annotation API
 *
 * Các API:
 *  POST   /api/annotations/page/:page_id        → createAnnotation
 *  GET    /api/annotations/page/:page_id        → getAnnotationsByPage
 *  GET    /api/annotations/chapter/:chapter_id  → getAnnotationsByChapter
 *  PATCH  /api/annotations/:id                  → updateAnnotation
 *  DELETE /api/annotations/:id                  → deleteAnnotation
 */

// ─────────────────────────────────────────────────────────────
// Helper: phân loại HTTP status code từ thông báo lỗi
// ─────────────────────────────────────────────────────────────
const resolveErrorStatus = (message) => {
  if (!message) return 500;
  if (message.includes("không có quyền")) return 403;
  if (
    message.includes("Không tìm thấy") ||
    message.includes("Thiếu") ||
    message.includes("không hợp lệ") ||
    message.includes("không được để trống")
  )
    return 400;
  return 500;
};

// ─────────────────────────────────────────────────────────────
// 1. Thêm Annotation mới
// ─────────────────────────────────────────────────────────────
/**
 * POST /api/annotations/page/:page_id
 *
 * Body:
 *  - x        {number} Bắt buộc - Tọa độ ngang
 *  - y        {number} Bắt buộc - Tọa độ dọc
 *  - content  {string} Bắt buộc - Nội dung góp ý
 *  - status   {string} Tuỳ chọn - Open | In Progress | Resolved | Reopened
 *  - deadline {string} Tuỳ chọn - ISO date string
 *  - region_id {string} Tuỳ chọn - ID vùng phân vùng
 *  - category  {string} Tuỳ chọn - Phân loại lỗi
 */
exports.createAnnotation = async (req, res) => {
  try {
    const { region_id, coordinates, status, deadline, category } = req.body;
    let { x, y, content } = req.body;
    content = content ?? req.body.comment;

    // page_id có thể lấy từ route param hoặc body
    const page_id = req.params.page_id || req.body.page_id;

    const annotation = await annotationService.createAnnotation(
      {
        page_id,
        region_id,
        coordinates,
        x,
        y,
        content,
        status,
        deadline,
        category,
      },
      req.user,
    );

    return res.status(201).json({
      success: true,
      message: "Tạo góp ý biên tập thành công",
      data: annotation,
      annotation,
    });
  } catch (error) {
    return res.status(resolveErrorStatus(error.message)).json({
      success: false,
      message: error.message,
    });
  }
};

// ─────────────────────────────────────────────────────────────
// 2. Lấy danh sách Annotation theo trang truyện
// ─────────────────────────────────────────────────────────────
/**
 * GET /api/annotations/page/:page_id
 *
 * Params:
 *  - page_id {string} ObjectId của trang truyện
 */
exports.getAnnotationsByPage = async (req, res) => {
  try {
    const { page_id } = req.params;

    // Đổi lại thành gọi qua service (Service sẽ gọi xuống Repository đã được lọc isDeleted ở Bước 1)
    const annotations = await annotationService.getAnnotationsByPage(page_id);

    return res.status(200).json({
      success: true,
      count: annotations.length,
      data: annotations,
      annotations,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ─────────────────────────────────────────────────────────────
// 3. Lấy danh sách Annotation theo chương truyện
// ─────────────────────────────────────────────────────────────
/**
 * GET /api/annotations/chapter/:chapter_id
 *
 * Params:
 *  - chapter_id {string} ObjectId của chương truyện
 */
exports.getAnnotationsByChapter = async (req, res) => {
  try {
    const { chapter_id } = req.params;
    const annotations =
      await annotationService.getAnnotationsByChapter(chapter_id);

    return res.status(200).json({
      success: true,
      count: annotations.length,
      data: annotations,
      annotations,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ─────────────────────────────────────────────────────────────
// 4. Sửa Annotation
// ─────────────────────────────────────────────────────────────
/**
 * PATCH /api/annotations/:id
 *
 * Params:
 *  - id {string} ObjectId của annotation cần cập nhật
 *
 * Body (tất cả đều tuỳ chọn, chỉ gửi trường cần thay đổi):
 *  - content  {string} Nội dung mới
 *  - status   {string} Trạng thái mới
 *  - deadline {string|null} Deadline mới hoặc null để xoá
 *  - x        {number} Tọa độ X mới
 *  - y        {number} Tọa độ Y mới
 *  - category {string} Phân loại lỗi mới
 */
exports.updateAnnotation = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, category, deadline, x, y } = req.body;
    const content = req.body.content ?? req.body.comment;

    const annotation = await annotationService.updateAnnotation(
      id,
      { status, content, category, deadline, x, y },
      req.user,
    );

    return res.status(200).json({
      success: true,
      message: "Cập nhật góp ý thành công",
      data: annotation,
      annotation,
    });
  } catch (error) {
    return res.status(resolveErrorStatus(error.message)).json({
      success: false,
      message: error.message,
    });
  }
};

// ─────────────────────────────────────────────────────────────
// 5. Xóa Annotation
// ─────────────────────────────────────────────────────────────
/**
 * DELETE /api/annotations/:id
 *
 * Params:
 *  - id {string} ObjectId của annotation cần xóa
 */
exports.deleteAnnotation = async (req, res) => {
  try {
    const { id } = req.params;

    const updatedAnnotation = await annotationService.deleteAnnotation(
      id,
      req.user,
    );

    if (!updatedAnnotation) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy góp ý",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Đã xóa góp ý thành công",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.restoreAnnotation = async (req, res) => {
  try {
    const { id } = req.params;

    const annotation = await annotationService.restoreAnnotation(id, req.user);

    return res.status(200).json({
      success: true,
      message: "Khôi phục góp ý thành công",
      data: annotation,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
