const Page = require("../../models/PageModel");

exports.deletePage = async (req, res) => {
  try {
    const { page_id } = req.params;

    // Tìm và cập nhật is_deleted = true thay vì xóa hẳn
    const deletedPage = await Page.findByIdAndUpdate(
      page_id,
      { is_deleted: true },
      { new: true },
    );

    if (!deletedPage) {
      return res.status(404).json({ message: "Không tìm thấy trang truyện" });
    }

    res.status(200).json({
      message: "Đã xóa trang truyện thành công",
      page: deletedPage,
    });
  } catch (err) {
    res.status(500).json({ error: "Lỗi server", details: err.message });
  }
};
