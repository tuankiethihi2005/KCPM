const Page = require("../../models/PageModel");

exports.getPageById = async (req, res) => {
  try {
    const { page_id } = req.params;
    const page = await Page.findById(page_id)
      .populate({
        path: "chapter_id",
        select: "title chapter_number series_id",
        populate: {
          path: "series_id",
          select: "title author_id editor_id"
        }
      });

    if (!page) {
      return res.status(404).json({ success: false, message: "Không tìm thấy trang truyện" });
    }

    return res.status(200).json({ success: true, page });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Lỗi server", details: err.message });
  }
};
