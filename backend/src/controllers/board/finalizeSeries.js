const { finalizeSeriesById } = require("../../services/boardFinalizeService");

exports.finalizeSeries = async (req, res) => {
  try {
    const { id } = req.params;
    const { approved_schedule } = req.body;

    const result = await finalizeSeriesById(id, { approved_schedule });

    return res.status(200).json({
      message: "Tổng hợp kết quả duyệt thành công",
      decision: result.decision,
      tally: result.tally,
      series: result.series,
      proposal: result.proposal,
      votes: result.votes,
    });
  } catch (err) {
    const status = err.status || 500;
    if (status === 500) {
      return res.status(500).json({ error: "Lỗi server", details: err.message });
    }
    return res.status(status).json({ message: err.message });
  }
};
