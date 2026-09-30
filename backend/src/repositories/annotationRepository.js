const Annotation = require("../models/AnnotationModel");
require("../models/PageRegionModel");

/**
 * AnnotationRepository - Tầng truy cập dữ liệu cho Annotation
 *
 * Tất cả thao tác CRUD với collection Annotation đều đi qua lớp này,
 * không để logic truy vấn MongoDB rải rác ở Service hoặc Controller.
 */
class AnnotationRepository {
  /**
   * Tạo mới một Annotation
   * @param {Object} data - Dữ liệu annotation cần lưu
   * @returns {Promise<Document>} Document vừa được lưu
   */
  async create(data) {
    const annotation = new Annotation(data);
    return await annotation.save();
  }

  /**
   * Tìm Annotation theo ID, populate thông tin người tạo
   * @param {string} id - ObjectId của annotation
   * @returns {Promise<Document|null>}
   */
  async findById(id) {
    return await Annotation.findById(id)
      .populate("created_by", "name email role avatar")
      .populate("page_id", "page_number current_preview_url");
  }

  /**
   * Lấy danh sách Annotation theo PageId
   * @param {string} pageId - ObjectId của page
   * @returns {Promise<Document[]>}
   */
  async findByPage(pageId) {
    return await Annotation.find({
      page_id: pageId,
    })
      .populate("created_by", "full_name avatar role")
      .sort({ createdAt: -1 });
  }

  /**
   * Lấy danh sách Annotation theo ChapterId
   * @param {string} chapterId - ObjectId của chapter
   * @returns {Promise<Document[]>}
   */
  async findByChapter(chapterId) {
    return await Annotation.find({
      chapter_id: chapterId,
    })
      .populate("created_by", "name email role avatar")
      .populate("page_id", "page_number current_preview_url")
      .sort({ createdAt: 1 });
  }

  /**
   * Cập nhật Annotation theo ID
   * @param {string} id - ObjectId của annotation cần cập nhật
   * @param {Object} updateData - Các trường cần cập nhật
   * @returns {Promise<Document|null>} Document sau khi cập nhật
   */
  async update(id, updateData) {
    return await Annotation.findByIdAndUpdate(id, updateData, { new: true })
      .populate("created_by", "name email role avatar")
      .populate("page_id", "page_number current_preview_url");
  }

  /**
   * Xóa Annotation theo ID
   * @param {string} id - ObjectId của annotation cần xóa
   * @returns {Promise<Document|null>} Document vừa bị xóa
   */
  async delete(id) {
    // THAY VÌ: return await Annotation.findByIdAndDelete(id);
    return await Annotation.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { returnDocument: "after" },
    );
  }

  async restore(id) {
    return await Annotation.findByIdAndUpdate(
      id,
      { isDeleted: false },
      { returnDocument: "after" }, // Dùng returnDocument để tránh warning Mongoose
    )
      .populate("created_by", "name email role avatar")
      .populate("page_id", "page_number current_preview_url");
  }
}

module.exports = new AnnotationRepository();
