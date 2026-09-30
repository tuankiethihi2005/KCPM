const PageRegion = require("../../models/PageRegionModel");
const Page = require("../../models/PageModel");

// 1. Tạo mới PageRegion
exports.createRegion = async (req, res) => {
  try {
    const page_id = req.body.page_id || req.params.page_id;
    const { coordinates, region_type } = req.body;

    if (!page_id || !coordinates || !region_type) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin bắt buộc (page_id, coordinates, region_type)",
      });
    }

    const page = await Page.findById(page_id);
    if (!page) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy trang truyện",
      });
    }

    const newRegion = new PageRegion({
      page_id,
      coordinates: typeof coordinates === "string" ? coordinates : JSON.stringify(coordinates),
      region_type,
      created_by: req.user.id,
    });

    await newRegion.save();

    return res.status(201).json({
      success: true,
      message: "Tạo vùng phân vùng thành công",
      region: newRegion,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi tạo phân vùng",
      error: error.message,
    });
  }
};

// 2. Lấy danh sách PageRegion theo trang truyện
exports.getRegionsByPage = async (req, res) => {
  try {
    const { page_id } = req.params;

    const regions = await PageRegion.find({ page_id })
      .populate("created_by", "name email role");

    return res.status(200).json({
      success: true,
      regions,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách phân vùng",
      error: error.message,
    });
  }
};

// 3. Xóa PageRegion
exports.deleteRegion = async (req, res) => {
  try {
    const { id } = req.params;

    const region = await PageRegion.findById(id);
    if (!region) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy phân vùng",
      });
    }

    // Chỉ có người tạo (Mangaka) hoặc Admin mới được xóa
    if (String(region.created_by) !== req.user.id && req.user.role !== "Admin") {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xóa phân vùng này",
      });
    }

    await PageRegion.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Xóa phân vùng thành công",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi xóa phân vùng",
      error: error.message,
    });
  }
};
