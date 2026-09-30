// src/controllers/chapter/restoreChapter.js
const mongoose = require("mongoose");
const Chapter = require("../../models/ChapterModel");
const Page = require("../../models/PageModel");

exports.restoreChapter = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { chapter_id } = req.params;

    // Tìm kiếm chapter đang có trạng thái bị xóa
    const chapter = await Chapter.findOne({
      _id: chapter_id,
      is_deleted: true,
    }).session(session);
    if (!chapter) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy chương truyện bị xóa nào phù hợp để khôi phục",
      });
    }

    // 1. Khôi phục trạng thái Chapter
    chapter.is_deleted = false;
    await chapter.save({ session });

    // 2. Khôi phục đồng bộ toàn bộ các trang truyện đi kèm
    await Page.updateMany(
      { chapter_id: chapter_id },
      { $set: { is_deleted: false } },
      { session },
    );

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      message: "Đã khôi phục chương truyện và các trang liên quan thành công",
      chapter,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error("Lỗi khi khôi phục chapter:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi khôi phục chương truyện",
      error: error.message,
    });
  }
};
