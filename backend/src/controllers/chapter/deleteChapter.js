// src/controllers/chapter/deleteChapter.js
const mongoose = require("mongoose");
const Chapter = require("../../models/ChapterModel");
const Page = require("../../models/PageModel");

exports.deleteChapter = async (req, res) => {
  // Khởi tạo Transaction bảo vệ tính toàn vẹn dữ liệu
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { chapter_id } = req.params;

    // Tìm kiếm chapter trong session hiện tại
    const chapter = await Chapter.findById(chapter_id).session(session);
    if (!chapter) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy chương truyện",
      });
    }

    if (chapter.is_deleted) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "Chương truyện này đã nằm trong thùng rác từ trước",
      });
    }

    // Giữ nguyên business logic: Chỉ cho phép hủy/xóa nếu trạng thái là Bản nháp (Draft)
    if (chapter.status !== "Draft") {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "Chỉ được phép hủy chương truyện ở trạng thái Bản nháp",
      });
    }

    // 1. Thực hiện xóa mềm Chapter
    chapter.is_deleted = true;
    await chapter.save({ session });

    // 2. Cascade Soft-delete: Tự động ẩn toàn bộ các Trang (Page) thuộc Chapter này
    // Khi Page bị ẩn (is_deleted: true), các Task/Annotation liên kết với page_id
    // cũng sẽ tự động không hiển thị ở các API lấy danh sách tương ứng.
    await Page.updateMany(
      { chapter_id: chapter_id },
      { $set: { is_deleted: true } },
      { session },
    );

    // Chốt lưu mọi thay đổi vào Database thực sự
    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      message:
        "Đã chuyển chương truyện và các trang liên quan vào thùng rác thành công",
    });
  } catch (error) {
    // Hủy bỏ toàn bộ thao tác nếu xảy ra lỗi bất kỳ nửa chừng
    await session.abortTransaction();
    session.endSession();

    console.error("Lỗi khi xóa mềm chapter:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi hủy chương truyện",
      error: error.message,
    });
  }
};
