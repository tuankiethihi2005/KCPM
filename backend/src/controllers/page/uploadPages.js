const mongoose = require("mongoose");
const Page = require("../../models/PageModel");
const Chapter = require("../../models/ChapterModel");
const PageVersionHistory = require("../../models/PageVersionHistoryModel");

exports.uploadPages = async (req, res) => {
  // 1. Khởi tạo Transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { chapter_id } = req.params;
    const { page_number } = req.body;

    // Kiểm tra tính hợp lệ của chapter_id (ObjectId)
    if (!mongoose.Types.ObjectId.isValid(chapter_id)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "ID chương truyện không hợp lệ!" });
    }

    // Kiểm tra xem chapter có tồn tại không
    const chapterExists = await Chapter.findById(chapter_id).session(session);
    if (!chapterExists) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Không tìm thấy chương truyện!" });
    }

    // 2. Kiểm tra xem có nhận được file bản thảo không
    if (!req.files || !req.files.source_file) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json({ message: "Thiếu file bản thảo (source_file)!" });
    }

    // Lấy link file từ Multer
    const sourceFileUrl = req.files.source_file[0].path;

    // Nếu có file ZIP đính kèm thì lấy link, không thì để null
    const attachedResourceUrl = req.files.attached_resource
      ? req.files.attached_resource[0].path
      : null;

    // 3. Tự động tạo link Preview (Ép đuôi file thành .png)
    const previewUrl = sourceFileUrl.replace(/\.[^/.]+$/, ".png");

    // 4. Lưu vào bảng Page
    const newPage = new Page({
      chapter_id,
      page_number: page_number || 1,
      current_preview_url: previewUrl,
      current_source_file_url: sourceFileUrl,
      attached_resource_url: attachedResourceUrl,
      current_version: 1,
      status: "Ready For Review",
    });

    const savedPage = await newPage.save({ session });

    // 5. Lưu ngay 1 bản ghi vào bảng Lịch sử (PageVersionHistory)
    const newHistory = new PageVersionHistory({
      page_id: savedPage._id,
      version_number: 1,
      preview_url: previewUrl,
      source_file_url: sourceFileUrl,
      attached_resource_url: attachedResourceUrl,
      submitted_by: req.user.id,
      commit_note: "Upload bản thảo gốc lần đầu",
    });

    await newHistory.save({ session });

    // 6. Tự động cập nhật chapter → "Waiting Review" nếu đang ở Draft/In Production
    if (["Draft", "In Production"].includes(chapterExists.status)) {
      chapterExists.status = "Waiting Review";
      await chapterExists.save({ session });
    }

    // 7. Chốt lưu vào Database thực sự
    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      message: "Upload trang truyện thành công!",
      page: savedPage,
    });
  } catch (error) {
    // Nếu transaction đang chạy thì mới abort
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();

    console.error("Lỗi upload file:", error);

    // Xử lý các lỗi Validation hoặc CastError của Mongoose để trả về 400 thay vì 500
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ 
        message: "Dữ liệu upload không hợp lệ.", 
        error: error.message 
      });
    }

    return res
      .status(500)
      .json({ message: "Lỗi server khi upload trang truyện." });
  }
};