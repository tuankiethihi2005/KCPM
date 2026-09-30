const mongoose = require("mongoose");
const Page = require("../../models/PageModel");
const Chapter = require("../../models/ChapterModel");
const PageVersionHistory = require("../../models/PageVersionHistoryModel");

exports.updatePageVersion = async (req, res) => {
  // 1. Khởi tạo Transaction để bảo vệ tính toàn vẹn dữ liệu
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { page_id } = req.params;
    const { commit_note } = req.body; // Lời nhắn do Assistant/Mangaka nhập khi nộp bài

    if (!commit_note || commit_note.trim() === "") {
      return res.status(400).json({
        message:
          "Bắt buộc phải nhập lời nhắn (commit_note) để giải thích bạn đã sửa/cập nhật những gì!",
      });
    }

    const existingPage = await Page.findById(page_id).session(session);
    if (!existingPage) {
      return res.status(404).json({ message: "Không tìm thấy trang truyện!" });
    }

    if (existingPage.is_deleted) {
      return res
        .status(400)
        .json({
          message:
            "Trang này đang nằm trong thùng rác, không thể cập nhật phiên bản mới!",
        });
    }

    // 3. Kiểm tra xem có nhận được file bản thảo mới không
    if (!req.files || !req.files.source_file) {
      return res
        .status(400)
        .json({ message: "Bắt buộc phải có file bản thảo mới (source_file)!" });
    }

    const sourceFileUrl = req.files.source_file[0].path;
    const attachedResourceUrl = req.files.attached_resource
      ? req.files.attached_resource[0].path
      : null;

    // 4. Ma thuật Cloudinary: Tự động tạo link Preview mới từ file bản thảo
    const previewUrl = sourceFileUrl.replace(/\.[^/.]+$/, ".png");

    // 5. TĂNG VERSION (Logic cốt lõi của chức năng)
    const newVersion = existingPage.current_version + 1;

    // 6. Cập nhật dữ liệu mới đè lên bảng Page hiện tại
    existingPage.current_preview_url = previewUrl;
    existingPage.current_source_file_url = sourceFileUrl;
    existingPage.attached_resource_url = attachedResourceUrl;
    existingPage.current_version = newVersion;

    // Khi nộp bản mới: chuyển về chờ duyệt để Editor review lại (trừ Approved/Locked)
    if (existingPage.status !== "Approved" && existingPage.status !== "Locked") {
      existingPage.status = "Ready For Review";
    }

    await existingPage.save({ session });

    // 7. Cập nhật chapter → "Waiting Review" nếu đã Approved/Published
    const chapter = await Chapter.findById(existingPage.chapter_id).session(session);
    if (chapter && (chapter.status === "Approved" || chapter.status === "Published")) {
      chapter.status = "Waiting Review";
      await chapter.save({ session });
    }

    // 8. Lưu 1 bản ghi mới vào bảng Lịch sử để không làm mất file cũ
    const newHistory = new PageVersionHistory({
      page_id: existingPage._id,
      version_number: newVersion,
      preview_url: previewUrl,
      source_file_url: sourceFileUrl,
      attached_resource_url: attachedResourceUrl,
      submitted_by: req.user.id,
      commit_note: commit_note || `Cập nhật version ${newVersion}`,
    });

    await newHistory.save({ session });

    // 8. Chốt Transaction
    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      message: "Cập nhật phiên bản mới thành công!",
      page: existingPage,
      new_version: newHistory,
    });
  } catch (error) {
    // 9. Rollback nếu có bất kỳ lỗi gì xảy ra (ví dụ rớt mạng database)
    await session.abortTransaction();
    session.endSession();

    console.error("Lỗi cập nhật version:", error);
    return res
      .status(500)
      .json({ message: "Lỗi server khi cập nhật trang truyện." });
  }
};
