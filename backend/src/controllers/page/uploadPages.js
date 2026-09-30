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
    const { page_number } = req.body; // Client cần gửi thêm số trang

    // 2. Kiểm tra xem có nhận được file bản thảo không
    if (!req.files || !req.files.source_file) {
      return res
        .status(400)
        .json({ message: "Thiếu file bản thảo (source_file)!" });
    }

    // Lấy link file từ Multer (Cloudinary trả về link trong trường .path)
    const sourceFileUrl = req.files.source_file[0].path;

    // Nếu có file ZIP đính kèm thì lấy link, không thì để null
    const attachedResourceUrl = req.files.attached_resource
      ? req.files.attached_resource[0].path
      : null;

    // 3. Ma thuật Cloudinary: Tự động tạo link Preview (Ép đuôi file thành .png)
    // Thay thế phần mở rộng cuối cùng (ví dụ: .psd, .clip) thành .png
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

    // Dùng { session } để báo cho Mongoose biết thao tác này nằm trong Transaction
    const savedPage = await newPage.save({ session });

    // 5. Lưu ngay 1 bản ghi vào bảng Lịch sử (PageVersionHistory)
    const newHistory = new PageVersionHistory({
      page_id: savedPage._id,
      version_number: 1,
      preview_url: previewUrl,
      source_file_url: sourceFileUrl,
      attached_resource_url: attachedResourceUrl,
      submitted_by: req.user.id, // Lấy ID người up từ token
      commit_note: "Upload bản thảo gốc lần đầu",
    });

    await newHistory.save({ session });

    // 6. Tự động cập nhật chapter → "Waiting Review" nếu đang ở Draft/In Production
    const chapter = await Chapter.findById(chapter_id).session(session);
    if (chapter && ["Draft", "In Production"].includes(chapter.status)) {
      chapter.status = "Waiting Review";
      await chapter.save({ session });
    }

    // 7. Nếu cả 2 bước trên đều ổn -> Chốt lưu vào Database thực sự
    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      message: "Upload trang truyện thành công!",
      page: savedPage,
    });
  } catch (error) {
    // 7. Nếu có LỖI xảy ra -> Hủy bỏ toàn bộ (Rollback) để không tạo rác
    await session.abortTransaction();
    session.endSession();

    console.error("Lỗi upload file:", error);
    return res
      .status(500)
      .json({ message: "Lỗi server khi upload trang truyện." });
  }
};
