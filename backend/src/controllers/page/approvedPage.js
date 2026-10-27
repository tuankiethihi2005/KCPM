const Page = require("../../models/PageModel");

exports.approvePage = async (req, res) => {
  try {
    const { page_id } = req.params;
<<<<<<< HEAD
    const { status } = req.body;

    // Kiểm tra status có nằm trong enum của PageModel không
=======
    
    if (!req.body || typeof req.body.status === 'undefined') {
      return res.status(400).json({ message: "Thiếu trường 'status' trong request body" });
    }

    const { status } = req.body;

>>>>>>> origin/main
    const validStatuses = [
      "Draft",
      "In Progress",
      "Ready For Review",
      "Submitted",
      "Approved",
      "Rejected",
      "Locked",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Trạng thái trang không hợp lệ" });
    }

<<<<<<< HEAD
    // Trong file approvePage.js
    const updatedPage = await Page.findOneAndUpdate(
      { _id: page_id, is_deleted: { $ne: true } }, // <-- BỔ SUNG ĐIỀU KIỆN NÀY
=======
    const updatedPage = await Page.findOneAndUpdate(
      { _id: page_id, is_deleted: { $ne: true } },
>>>>>>> origin/main
      { status: status },
      { new: true },
    );

    if (!updatedPage) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy trang truyện hoặc trang đã bị xóa" });
    }

    res.status(200).json({
      message:
        status === "Approved"
          ? "Đã chốt bản Final cho trang này"
          : "Cập nhật trạng thái trang thành công",
      page: updatedPage,
    });
  } catch (err) {
    res.status(500).json({ error: "Lỗi server", details: err.message });
  }
<<<<<<< HEAD
};
=======
};
>>>>>>> origin/main
