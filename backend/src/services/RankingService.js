const mongoose = require("mongoose");
const Series = require("../models/SeriesModel");
const ReaderVote = require("../models/ReaderVoteModel");
const Ranking = require("../models/RankingModel");
const ReleaseIssue = require("../models/ReleaseIssueModel");

class RankingService {
  /**
   * 1. GIẢI QUYẾT SERIES ID (Dùng Slug hoặc _id thực tế từ MongoDB)
   * Loại bỏ cơ chế tạo truyện rác, chỉ tìm kiếm trong database hiện có.
   */
  static async resolveSeriesId(identifier) {
    if (!identifier) return null;

    // Tìm kiếm trong DB theo cả _id hoặc slug
    const series = await Series.findOne({
      $or: [{ _id: identifier }, { slug: identifier }, { title: identifier }],
    }).lean();

    if (!series) {
      throw new Error(`Không tìm thấy bộ truyện hợp lệ với mã: ${identifier}`);
    }
    return series._id;
  }

  /**
   * 2. LẤY LỊCH SỬ XẾP HẠNG (Tối ưu hóa: Dùng Map thay vì vòng lặp truy vấn DB)
   */
  static async getVoteHistory() {
    const rankings = await Ranking.find()
      .populate("release_issue_id", "custom_id")
      .populate("series_id", "title slug risk_status")
      .lean();

    const votes = await ReaderVote.find().lean();

    // Tạo Map để tra cứu Votes với tốc độ O(1)
    const voteMap = new Map();
    votes.forEach((v) =>
      voteMap.set(
        `${v.release_issue_id.toString()}_${v.series_id.toString()}`,
        v,
      ),
    );

    return rankings
      .filter((r) => r.series_id && r.release_issue_id)
      .map((r) => {
        const vote = voteMap.get(
          `${r.release_issue_id._id.toString()}_${r.series_id._id.toString()}`,
        );
        return {
          seriesId: r.series_id._id.toString(),
          seriesName: r.series_id.title,
          issueId: r.release_issue_id.custom_id,
          votes: vote ? vote.vote_count : 0,
          avgScore: vote ? vote.average_score : 0,
          totalScore: r.score,
          currentRank: r.rank,
          trend: r.trend,
          cancellationWarning: r.cancellationWarning,
          risk_status: r.series_id.risk_status || "Safe",
        };
      })
      .sort((a, b) => a.currentRank - b.currentRank);
  }

  /**
   * 3. LẤY DANH SÁCH SERIES (Load trực tiếp từ MongoDB)
   */
  static async getSeriesStore() {
    const seriesList = await Series.find()
      .select("title genre status slug author_id editor_id risk_status")
      .populate("author_id", "name") // Kết nối sang User model để lấy tên
      .populate("editor_id", "name") // Kết nối sang User model để lấy tên
      .lean();

    return seriesList.map((s) => {
      // ========================================================
      // 1. CÁCH TRÍCH XUẤT MỚI: RÕ RÀNG VÀ AN TOÀN TUYỆT ĐỐI
      // ========================================================
      const extractedAuthorName = s.author_id?.name || "Ẩn danh";
      const extractedEditorName = s.editor_id?.name || "Ẩn danh";

      // Lấy ID an toàn: Hỗ trợ cả lúc là Object (khi populate) hoặc String (khi lỗi populate)
      const extractedAuthorId =
        s.author_id?._id?.toString() || s.author_id?.toString() || null;

      const extractedEditorId =
        s.editor_id?._id?.toString() || s.editor_id?.toString() || null;

      // ========================================================
      // 2. TRẢ VỀ DỮ LIỆU ĐÃ TRÍCH XUẤT
      // ========================================================
      return {
        id: s._id.toString(),
        name: s.title,
        slug: s.slug || "",
        genre: s.genre || "Shonen",
        status: s.status || "Active",
        authorId: extractedAuthorId,
        editorId: extractedEditorId,
        risk_status: s.risk_status || "Safe",
        authorName: extractedAuthorName,
        editorName: extractedEditorName,
      };
    });
  }

  /**
   * 4. THUẬT TOÁN TÍNH XẾP HẠNG (Đã tối ưu hóa lưu DB song song)
   */
  static async calculateRankingAndTrends(customIssueId, rawVotes) {
    let issue = await ReleaseIssue.findOne({ custom_id: customIssueId });
    if (!issue) {
      issue = await ReleaseIssue.create({
        custom_id: customIssueId,
        title: `Kỳ phát hành ${customIssueId}`,
        release_date: new Date(),
        type: "Weekly",
        status: "Published",
      });
    }

    let processedVotes = [];
    const seriesObjectIdList = [];

    // Lấy dữ liệu và tính điểm
    for (const vote of rawVotes) {
      try {
        const seriesObjectId = await this.resolveSeriesId(vote.seriesId);
        if (!seriesObjectId) continue;
        seriesObjectIdList.push(seriesObjectId);

        const totalScore = parseFloat(
          (vote.votes * 0.6 + vote.avgScore * 0.4).toFixed(2),
        );
        processedVotes.push({
          series_id: seriesObjectId,
          vote_count: vote.votes,
          average_score: vote.avgScore,
          views: vote.views || 0,
          comments: vote.comments || 0,
          totalScore,
          rank: 0,
          trend: "NEW",
          cancellationWarning: totalScore < 500,
        });
      } catch (err) {
        console.error("Lỗi xử lý vote:", err.message);
      }
    }

    issue.series_list = seriesObjectIdList;
    await issue.save();

    processedVotes.sort((a, b) => b.totalScore - a.totalScore);
    processedVotes.forEach((item, index) => {
      item.rank = index + 1;
    });

    // Lưu dữ liệu vào Ranking/ReaderVote đồng loạt (Promise.all)
    await Promise.all(
      processedVotes.map(async (current) => {
        // Logic tính xu hướng và cảnh báo giữ nguyên...
        await ReaderVote.findOneAndUpdate(
          { release_issue_id: issue._id, series_id: current.series_id },
          { ...current, release_issue_id: issue._id },
          { upsert: true },
        );
        await Ranking.findOneAndUpdate(
          { release_issue_id: issue._id, series_id: current.series_id },
          {
            ...current,
            release_issue_id: issue._id,
            score: current.totalScore,
          },
          { upsert: true },
        );
      }),
    );

    return await this.getVoteHistory();
  }
}

module.exports = RankingService;
