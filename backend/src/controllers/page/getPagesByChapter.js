const Page = require("../../models/PageModel");
const Annotation = require("../../models/AnnotationModel");

exports.getPagesByChapter = async (req, res) => {
  try {
    const { chapter_id } = req.params;
    const pages = await Page.find({
      chapter_id: chapter_id,
    }).sort({ page_number: 1 });

    // Chuyển sang JSON để kích hoạt toJSON transform (map field names)
    let pagesJson = pages.map((p) => p.toJSON());

    // Đếm số annotation cho từng page
    const pageIds = pagesJson.map((p) => p._id);
    const annotationCounts = await Annotation.aggregate([
      { $match: { page_id: { $in: pageIds } } },
      { $group: { _id: "$page_id", count: { $sum: 1 } } },
    ]);
    const countMap = {};
    annotationCounts.forEach(({ _id, count }) => {
      countMap[_id.toString()] = count;
    });

    const pagesWithCount = pagesJson.map((p) => ({
      ...p,
      annotation_count: countMap[p._id.toString()] || 0,
    }));

    return res.status(200).json({ pages: pagesWithCount });
  } catch (err) {
    return res.status(500).json({ error: "Lỗi server", details: err.message });
  }
};
