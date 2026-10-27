const mongoose = require("mongoose");
const Page = require("../../models/PageModel");
const Chapter = require("../../models/ChapterModel");
const PageVersionHistory = require("../../models/PageVersionHistoryModel");

exports.updatePageVersion = async (req, res) => {
<<<<<<< HEAD
  // 1. Khởi tạo Transaction để bảo vệ tính toàn vẹn dữ liệu
=======
>>>>>>> origin/main
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { page_id } = req.params;
<<<<<<< HEAD
    const { commit_note } = req.body; // Lời nhắn do Assistant/Mangaka nhập khi nộp bài

    if (!commit_note || commit_note.trim() === "") {
      return res.status(400).json({
        message:
          "Bắt buộc phải nhập lời nhắn (commit_note) để giải thích bạn đã sửa/cập nhật những gì!",
=======
    const { commit_note } = req.body;

    // 1. Validate ID chuẩn MongoDB để tránh crash
    if (!mongoose.Types.ObjectId.isValid(page_id)) {
      return res.status(400).json({ message: "Mã trang truyện (page_id) không hợp lệ!" });
    }

    if (!commit_note || commit_note.trim() === "") {
      return res.status(400).json({
        message: "Bắt buộc phải nhập lời nhắn (commit_note) để giải thích bạn đã sửa/cập nhật những gì!",
>>>>>>> origin/main
      });
    }

    const existingPage = await Page.findById(page_id).session(session);
    if (!existingPage) {
      return res.status(404).json({ message: "Không tìm thấy trang truyện!" });
    }

    if (existingPage.is_deleted) {
<<<<<<< HEAD
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
=======
      return res.status(400).json({
        message: "Trang này đang nằm trong thùng rác, không thể cập nhật phiên bản mới!",
      });
    }

    // 2. [CỐT LÕI FIX LỖI EISDIR]: Kiểm tra chặt chẽ sự tồn tại của file trước khi đọc path
    if (!req.files || !req.files.source_file || !req.files.source_file[0] || !req.files.source_file[0].path) {
      return res.status(400).json({ 
        message: "Thiếu file bản thảo mới (source_file) hoặc định dạng file không hợp lệ!" 
      });
    }

    const sourceFileUrl = req.files.source_file[0].path;
    if (typeof sourceFileUrl !== 'string' || sourceFileUrl.trim() === "") {
      return res.status(400).json({ message: "Đường dẫn file bản thảo không hợp lệ." });
    }

    const attachedResourceUrl = req.files && req.files.attached_resource && req.files.attached_resource[0]
      ? req.files.attached_resource[0].path
      : null;

    const previewUrl = sourceFileUrl.replace(/\.[^/.]+$/, ".png");
    const newVersion = existingPage.current_version + 1;

>>>>>>> origin/main
    existingPage.current_preview_url = previewUrl;
    existingPage.current_source_file_url = sourceFileUrl;
    existingPage.attached_resource_url = attachedResourceUrl;
    existingPage.current_version = newVersion;

<<<<<<< HEAD
    // Khi nộp bản mới: chuyển về chờ duyệt để Editor review lại (trừ Approved/Locked)
=======
>>>>>>> origin/main
    if (existingPage.status !== "Approved" && existingPage.status !== "Locked") {
      existingPage.status = "Ready For Review";
    }

    await existingPage.save({ session });

<<<<<<< HEAD
    // 7. Cập nhật chapter → "Waiting Review" nếu đã Approved/Published
=======
>>>>>>> origin/main
    const chapter = await Chapter.findById(existingPage.chapter_id).session(session);
    if (chapter && (chapter.status === "Approved" || chapter.status === "Published")) {
      chapter.status = "Waiting Review";
      await chapter.save({ session });
    }

<<<<<<< HEAD
    // 8. Lưu 1 bản ghi mới vào bảng Lịch sử để không làm mất file cũ
=======
>>>>>>> origin/main
    const newHistory = new PageVersionHistory({
      page_id: existingPage._id,
      version_number: newVersion,
      preview_url: previewUrl,
      source_file_url: sourceFileUrl,
      attached_resource_url: attachedResourceUrl,
<<<<<<< HEAD
      submitted_by: req.user.id,
=======
      submitted_by: req.user ? req.user.id : null,
>>>>>>> origin/main
      commit_note: commit_note || `Cập nhật version ${newVersion}`,
    });

    await newHistory.save({ session });

<<<<<<< HEAD
    // 8. Chốt Transaction
=======
>>>>>>> origin/main
    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      message: "Cập nhật phiên bản mới thành công!",
      page: existingPage,
      new_version: newHistory,
    });
  } catch (error) {
<<<<<<< HEAD
    // 9. Rollback nếu có bất kỳ lỗi gì xảy ra (ví dụ rớt mạng database)
    await session.abortTransaction();
    session.endSession();

    console.error("Lỗi cập nhật version:", error);
    return res
      .status(500)
      .json({ message: "Lỗi server khi cập nhật trang truyện." });
  }
};
=======
    await session.abortTransaction();
    session.endSession();

    console.error("Lỗi cập nhật version chi tiết:", error);
    
    return res.status(500).json({ 
      message: "Lỗi server khi cập nhật trang truyện.",
      error: error.message 
    });
  }
};
>>>>>>> origin/main
