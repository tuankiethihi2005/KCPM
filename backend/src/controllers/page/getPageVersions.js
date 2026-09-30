const Page = require("../../models/PageModel");
const PageVersionHistory = require("../../models/PageVersionHistoryModel");

exports.getPageVersions = async (req, res) => {
  try {
    const { page_id } = req.params;

    // 1. Kiểm tra xem trang truyện có tồn tại không
    const page = await Page.findById(page_id);
    if (!page) {
      return res.status(404).json({ message: "Không tìm thấy trang truyện!" });
    }

    // 2. Truy vấn lịch sử các phiên bản của trang này
    const versions = await PageVersionHistory.find({ page_id: page_id })
      // Populate để móc nối lấy tên và role của người nộp bài từ bảng User
      .populate("submitted_by", "name role email")
      // Sắp xếp giảm dần (-1) để version mới nhất (số to nhất) nằm ở trên cùng
      .sort({ version_number: -1 });

    return res.status(200).json({
      message: "Lấy lịch sử phiên bản thành công!",
      page_id: page._id,
      current_version: page.current_version, // Trả về version hiện tại để dễ so sánh
      total_versions: versions.length,
      versions: versions,
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách version:", error);
    return res
      .status(500)
      .json({ message: "Lỗi server khi lấy lịch sử trang truyện." });
  }
};
