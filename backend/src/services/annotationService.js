const annotationRepository = require("../repositories/annotationRepository");
const Page = require("../models/PageModel");

/**
 * AnnotationService - Tầng xử lý nghiệp vụ cho Annotation
 *
 * Các thao tác:
 *  - createAnnotation   : Thêm mới góp ý biên tập
 *  - updateAnnotation   : Sửa nội dung / trạng thái / deadline của góp ý
 *  - deleteAnnotation   : Xóa góp ý (chủ sở hữu hoặc có quyền)
 *  - getAnnotationsByPage    : Lấy danh sách góp ý theo trang
 *  - getAnnotationsByChapter : Lấy danh sách góp ý theo chương
 */
class AnnotationService {
  parseCoordinates(coordinates) {
    if (!coordinates) return {};
    try {
      const parsed =
        typeof coordinates === "string" ? JSON.parse(coordinates) : coordinates;
      return {
        x: parsed.x !== undefined ? Number(parsed.x) : undefined,
        y: parsed.y !== undefined ? Number(parsed.y) : undefined,
      };
    } catch (_) {
      const value = String(coordinates);
      const xMatch = value.match(/x\s*:?\s*([0-9.]+)/i);
      const yMatch = value.match(/y\s*:?\s*([0-9.]+)/i);
      return {
        x: xMatch ? Number(xMatch[1]) : undefined,
        y: yMatch ? Number(yMatch[1]) : undefined,
      };
    }
  }

  /**
   * Thêm mới Annotation
   *
   * @param {Object} data         - Dữ liệu đầu vào từ request body
   * @param {string} data.page_id - (Bắt buộc) ID của trang truyện
   * @param {number} data.x       - (Bắt buộc) Tọa độ X trên ảnh trang
   * @param {number} data.y       - (Bắt buộc) Tọa độ Y trên ảnh trang
   * @param {string} data.content - (Bắt buộc) Nội dung góp ý
   * @param {string} [data.status]    - Trạng thái (mặc định: 'Open')
   * @param {string} [data.deadline]  - Hạn xử lý (ISO date string)
   * @param {string} [data.region_id] - ID vùng phân vùng (tuỳ chọn)
   * @param {string} [data.category]  - Phân loại lỗi (tuỳ chọn)
   * @param {Object} currentUser  - Thông tin user đang đăng nhập (req.user)
   * @returns {Promise<Document>} Annotation vừa tạo (đã populate)
   */
  async createAnnotation(data, currentUser) {
    const {
      page_id,
      region_id,
      coordinates,
      content,
      status,
      deadline,
      category,
    } = data;
    const parsedCoordinates = this.parseCoordinates(coordinates);
    const x = data.x ?? parsedCoordinates.x;
    const y = data.y ?? parsedCoordinates.y;

    // Validate các trường bắt buộc
    if (!page_id) {
      throw new Error("Thiếu thông tin bắt buộc: page_id");
    }
    if (x === undefined || x === null) {
      throw new Error("Thiếu thông tin bắt buộc: x (tọa độ ngang)");
    }
    if (y === undefined || y === null) {
      throw new Error("Thiếu thông tin bắt buộc: y (tọa độ dọc)");
    }
    if (!content || content.trim() === "") {
      throw new Error("Thiếu thông tin bắt buộc: content (nội dung góp ý)");
    }

    // Lấy thông tin trang để lấy chapter_id
    const page = await Page.findById(page_id);
    if (!page) {
      throw new Error("Không tìm thấy trang truyện với page_id đã cung cấp");
    }

    // Validate status nếu có
    const validStatuses = ["Open", "In Progress", "Resolved", "Reopened"];
    if (status && !validStatuses.includes(status)) {
      throw new Error(
        `Trạng thái không hợp lệ. Chỉ chấp nhận: ${validStatuses.join(", ")}`,
      );
    }

    const newAnnotation = await annotationRepository.create({
      chapter_id: page.chapter_id, // Tự động lấy chapter_id từ page
      page_id,
      x: Number(x),
      y: Number(y),
      content: content.trim(),
      status: status || "Open",
      deadline: deadline ? new Date(deadline) : null,
      created_by: currentUser.id,
      role: currentUser.role || "",
      region_id: region_id || null,
      category: category || "",
    });

    // Trả về document đã populate
    return await annotationRepository.findById(newAnnotation._id);
  }

  /**
   * Lấy danh sách Annotation theo trang truyện
   * @param {string} pageId - ObjectId của page
   * @returns {Promise<Document[]>}
   */
  async getAnnotationsByPage(pageId) {
    return await annotationRepository.findByPage(pageId);
  }

  /**
   * Lấy danh sách Annotation theo chương truyện
   * @param {string} chapterId - ObjectId của chapter
   * @returns {Promise<Document[]>}
   */
  async getAnnotationsByChapter(chapterId) {
    return await annotationRepository.findByChapter(chapterId);
  }

  /**
   * Sửa Annotation
   *
   * Quyền sửa: chủ sở hữu (created_by) HOẶC Editor / Mangaka / Admin.
   *
   * @param {string} id         - ObjectId của annotation cần sửa
   * @param {Object} updateData - Các trường cần cập nhật
   * @param {string} [updateData.content]  - Nội dung mới
   * @param {string} [updateData.status]   - Trạng thái mới
   * @param {string} [updateData.deadline] - Deadline mới (ISO string hoặc null)
   * @param {number} [updateData.x]        - Tọa độ X mới
   * @param {number} [updateData.y]        - Tọa độ Y mới
   * @param {string} [updateData.category] - Phân loại lỗi mới
   * @param {Object} currentUser - Thông tin user đang đăng nhập
   * @returns {Promise<Document>} Annotation sau khi cập nhật
   */
  async updateAnnotation(id, updateData, currentUser) {
    const annotation = await annotationRepository.findById(id);
    if (!annotation) {
      throw new Error("Không tìm thấy annotation");
    }

    // Kiểm tra quyền: chủ sở hữu hoặc có role được phép
    const ownerId = String(annotation.created_by._id || annotation.created_by);
    const isOwner = ownerId === String(currentUser.id);
    const isAllowedRole = ["Tantou Editor", "Mangaka", "Admin"].includes(
      currentUser.role,
    );

    if (!isOwner && !isAllowedRole) {
      throw new Error("Bạn không có quyền chỉnh sửa góp ý này");
    }

    const payload = {};

    // Cập nhật content
    if (updateData.content !== undefined) {
      if (updateData.content.trim() === "") {
        throw new Error("Nội dung góp ý không được để trống");
      }
      payload.content = updateData.content.trim();
    }

    // Cập nhật status
    if (updateData.status !== undefined) {
      const validStatuses = ["Open", "In Progress", "Resolved", "Reopened"];
      if (!validStatuses.includes(updateData.status)) {
        throw new Error(
          `Trạng thái không hợp lệ. Chỉ chấp nhận: ${validStatuses.join(", ")}`,
        );
      }
      payload.status = updateData.status;
    }

    // Cập nhật deadline
    if (updateData.deadline !== undefined) {
      payload.deadline = updateData.deadline
        ? new Date(updateData.deadline)
        : null;
    }

    // Cập nhật tọa độ
    if (updateData.x !== undefined) {
      payload.x = Number(updateData.x);
    }
    if (updateData.y !== undefined) {
      payload.y = Number(updateData.y);
    }

    // Cập nhật category
    if (updateData.category !== undefined) {
      payload.category = updateData.category;
    }

    return await annotationRepository.update(id, payload);
  }

  /**
   * Xóa Annotation
   *
   * Quyền xóa: chủ sở hữu (created_by) HOẶC Editor / Mangaka / Admin.
   *
   * @param {string} id          - ObjectId của annotation cần xóa
   * @param {Object} currentUser - Thông tin user đang đăng nhập
   * @returns {Promise<void>}
   */
  async deleteAnnotation(id, currentUser) {
    const annotation = await annotationRepository.findById(id);

    if (!annotation) {
      throw new Error("Không tìm thấy annotation");
    }

    const ownerId = String(annotation.created_by._id || annotation.created_by);
    const isOwner = ownerId === String(currentUser.id);
    const isAllowedRole = ["Tantou Editor", "Mangaka", "Admin"].includes(
      currentUser.role,
    );

    if (!isOwner && !isAllowedRole) {
      throw new Error("Bạn không có quyền xóa góp ý này");
    }

    return await annotationRepository.delete(id);
  }

  async restoreAnnotation(id, currentUser) {
    const annotation = await annotationRepository.findById(id);

    if (!annotation) {
      throw new Error("Không tìm thấy annotation");
    }

    const ownerId = String(annotation.created_by._id || annotation.created_by);

    const isOwner = ownerId === String(currentUser.id);
    const isAllowedRole = ["Tantou Editor", "Mangaka", "Admin"].includes(
      currentUser.role,
    );

    if (!isOwner && !isAllowedRole) {
      throw new Error("Bạn không có quyền khôi phục góp ý này");
    }

    return await annotationRepository.restore(id);
  }
}

module.exports = new AnnotationService();
