const Series = require("../../models/SeriesModel");
const attachProposals = require("./attachProposals");

// Mangaka: chỉ lấy các series do chính mình đăng
exports.getMySeries = async (req, res) => {
  try {
    const seriesList = await Series.find({ author_id: req.user.id }).sort({
      createdAt: -1,
    });

    const result = await attachProposals(seriesList);

    return res.status(200).json({ series: result });
  } catch (err) {
    return res.status(500).json({ error: "Lỗi server", details: err.message });
  }
};

// Admin: lấy series theo author_id chỉ định trên URL
exports.getSeriesByAuthor = async (req, res) => {
  try {
    const { author_id } = req.params;

    const seriesList = await Series.find({ author_id }).sort({
      createdAt: -1,
    });

    const result = await attachProposals(seriesList);

    return res.status(200).json({ series: result });
  } catch (err) {
    return res.status(500).json({ error: "Lỗi server", details: err.message });
  }
};
