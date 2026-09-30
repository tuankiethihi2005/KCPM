const Series = require("../../models/SeriesModel");

exports.getAtRiskSeries = async (req, res) => {
  try {
    const seriesList = await Series.find({
      $or: [
        { risk_status: { $in: ["Warning", "Critical"] } },
        { status: "At Risk" },
      ],
    })
      .populate("author_id", "name email")
      .sort({ updatedAt: -1 });

    res.status(200).json({ series: seriesList, count: seriesList.length });
  } catch (err) {
    res.status(500).json({ error: "Lỗi server", details: err.message });
  }
};
