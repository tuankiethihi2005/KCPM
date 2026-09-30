const Page = require("../../models/PageModel");

exports.restorePage = async (req, res) => {
  try {
    const { page_id } = req.params;
    const restoredPage = await Page.findByIdAndUpdate(
      page_id,
      { is_deleted: false },
      { new: true },
    );
    if (!restoredPage)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy trang" });

    return res
      .status(200)
      .json({
        success: true,
        message: "Đã khôi phục trang",
        page: restoredPage,
      });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, error: "Lỗi server", details: err.message });
  }
};
