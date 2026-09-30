const RankingService = require("../services/RankingService");
const { ROLES } = require("../constants/roles");

const getLeaderboard = async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    const { issueId, genre, authorId } = req.query;

    let records = await RankingService.getVoteHistory();
    const seriesStore = await RankingService.getSeriesStore();

    if (role === ROLES.MANGAKA) {
      const mySeriesIds = seriesStore
        .filter((series) => series.authorId === userId)
        .map((series) => series.id);
      records = records.filter((record) =>
        mySeriesIds.includes(record.seriesId),
      );
    } else if (role === ROLES.TANTOU_EDITOR) {
      const managedSeriesIds = seriesStore
        .filter((series) => series.editorId === userId)
        .map((series) => series.id);
      records = records.filter((record) =>
        managedSeriesIds.includes(record.seriesId),
      );
    }

    let allAvailableIssues = [];
    if (records.length > 0) {
      const allIssueIds = records.map((record) => record.issueId);
      const uniqueIssueIds = [...new Set(allIssueIds)];

      // Lấy thông tin createdAt từ DB để sắp xếp đúng thứ tự thời gian
      const ReleaseIssue = require("../models/ReleaseIssueModel");
      const issueDocuments = await ReleaseIssue.find({
        custom_id: { $in: uniqueIssueIds }
      }).select("custom_id title createdAt").lean();

      // Tạo map để tra cứu nhanh
      const issueMap = new Map(issueDocuments.map(doc => [doc.custom_id, doc]));

      // Sắp xếp theo createdAt giảm dần (mới nhất lên đầu)
      allAvailableIssues = uniqueIssueIds
        .map(id => {
          const doc = issueMap.get(id);
          return {
            id,
            label: doc?.title ? `${id} – ${doc.title}` : id,
            createdAt: doc?.createdAt || new Date(0)
          };
        })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    let targetIssueId = issueId;
    if (!targetIssueId && allAvailableIssues.length > 0) {
      targetIssueId = allAvailableIssues[0].id;
    }

    if (targetIssueId) {
      records = records.filter((record) => record.issueId === targetIssueId);
    }

    if (authorId) {
      records = records.filter((record) => {
        const series = seriesStore.find((item) => item.id === record.seriesId);
        return series && series.authorId === authorId;
      });
    }
    if (genre) {
      records = records.filter((record) => {
        const series = seriesStore.find((item) => item.id === record.seriesId);
        return series && series.genre.toLowerCase() === genre.toLowerCase();
      });
    }

    const detailedRecords = records.map((record) => {
      const series = seriesStore.find((item) => item.id === record.seriesId);
      return {
        ...record,
        seriesName: series ? series.name : "Unknown series",
        authorName: series ? series.authorName : "Ẩn danh",
      };
    });

    res.json({
      data: detailedRecords,
      availableIssues: allAvailableIssues
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Lỗi hệ thống khi lấy bảng xếp hạng: " + error.message });
  }
};

const getPerformanceChartData = async (req, res) => {
  try {
    const { seriesId } = req.params;

    // 1. THÊM MỚI: Lấy thông tin người dùng đang gọi API
    const { role, id: userId } = req.user;

    const records = await RankingService.getVoteHistory();

    // 2. THÊM MỚI: Lấy kho series để kiểm tra chủ sở hữu
    const seriesStore = await RankingService.getSeriesStore();
    const targetSeries = seriesStore.find((s) => s.id === seriesId);

    if (!targetSeries) {
      return res
        .status(404)
        .json({ error: "Không tìm thấy dữ liệu truyện này." });
    }

    // 3. THÊM MỚI: CHẶN PHÂN QUYỀN (RBAC)
    if (role === ROLES.MANGAKA && targetSeries.authorId !== userId) {
      return res
        .status(403)
        .json({
          error: "Từ chối truy cập: Bạn không phải tác giả của truyện này.",
        });
    }

    if (role === ROLES.TANTOU_EDITOR && targetSeries.editorId !== userId) {
      return res
        .status(403)
        .json({ error: "Từ chối truy cập: Bạn không quản lý truyện này." });
    }

    // 4. GIỮ NGUYÊN LOGIC CŨ CỦA BẠN: Format và giới hạn 10 kỳ
    let chartData = records
      .filter((record) => record.seriesId === seriesId)
      .map((record) => ({
        issueId: record.issueId,
        rank: record.currentRank,
        totalScore: record.totalScore,
        avgScore: record.avgScore,
        votes: record.votes,
      }))
      .sort((left, right) => left.issueId.localeCompare(right.issueId));

    if (chartData.length > 10) {
      chartData = chartData.slice(-10);
    }

    res.json(chartData);
  } catch (error) {
    res.status(500).json({
      error: "Lỗi hệ thống khi lấy biểu đồ hiệu suất: " + error.message,
    });
  }
};

module.exports = { getLeaderboard, getPerformanceChartData };
