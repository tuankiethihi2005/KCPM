const SeriesProposal = require("../../models/SeriesProposalModel");

// Gắn proposal mới nhất vào từng series để FE hiển thị trạng thái xét duyệt
const attachProposals = async (seriesList) => {
  return Promise.all(
    seriesList.map(async (series) => {
      const proposal = await SeriesProposal.findOne({
        series_id: series._id,
      }).sort({ createdAt: -1 });
      return { series, proposal };
    }),
  );
};

module.exports = attachProposals;
