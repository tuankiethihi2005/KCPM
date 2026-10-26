const Page = require("../../models/PageModel");

exports.approvePage = async (req, res) => {
  try {
    const { page_id } = req.params;
    
    if (!req.body || typeof req.body.status === 'undefined') {
      return res.status(400).json({ message: "Thiếu trường 'status' trong request body" });
    }

    const { status } = req.body;

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

    const updatedPage = await Page.findOneAndUpdate(
      { _id: page_id, is_deleted: { $ne: true } },
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
};