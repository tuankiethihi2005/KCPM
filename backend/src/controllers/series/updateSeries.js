const mongoose = require("mongoose");
const Series = require("../../models/SeriesModel");
const SeriesProposal = require("../../models/SeriesProposalModel");
const User = require("../../models/UserModel");
const { ROLES } = require("../../constants/roles");

const EDITABLE_STATUSES = ["Draft", "Need Revision"];
const PENDING_STATUSES = ["Submitted", "Pending", "Under Review"];

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

exports.updateSeries = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, genre, target_audience, editor_id } = req.body;

    const series = await Series.findById(id);
    if (!series) {
      return res.status(404).json({ message: "Không tìm thấy series" });
    }

    // Chỉ cho sửa khi proposal còn ở trạng thái nháp/cần sửa hoặc chưa có proposal.
    const proposal = await SeriesProposal.findOne({ series_id: id }).sort({
      createdAt: -1,
    });
    if (
      (proposal && PENDING_STATUSES.includes(proposal.status)) ||
      PENDING_STATUSES.includes(series.status)
    ) {
      return res.status(409).json({
        message: "Hồ sơ đang ở trạng thái chờ duyệt, không thể cập nhật thông tin.",
      });
    }
    if (proposal && !EDITABLE_STATUSES.includes(proposal.status)) {
      return res.status(400).json({
        message: `Không thể sửa thông tin series khi proposal ở trạng thái ${proposal.status}`,
      });
    }

    // 1. Validate title (US-05, US-06: chuẩn hóa NFC, trim, không phân biệt hoa-thường)
    if (title !== undefined) {
      const trimmedTitle =
        typeof title === "string" ? title.normalize("NFC").trim() : title;
      if (!trimmedTitle) {
        return res.status(400).json({ message: "title không được rỗng" });
      }
      if (typeof trimmedTitle === "string") {
        if (trimmedTitle.length < 2) {
          return res
            .status(400)
            .json({ message: "Tên series phải có ít nhất 2 ký tự" });
        }
        if (trimmedTitle.length > 100) {
          return res
            .status(400)
            .json({ message: "Tên series không được vượt quá 100 ký tự" });
        }
        if (/[<>]/.test(trimmedTitle)) {
          return res.status(400).json({
            message: "Tên series không được chứa ký tự markup HTML.",
          });
        }
      }

      const escapedNfc = escapeRegex(String(trimmedTitle).normalize("NFC"));
      const escapedNfd = escapeRegex(String(trimmedTitle).normalize("NFD"));
      const existingSeries = await Series.findOne({
        $or: [
          { title: { $regex: new RegExp(`^\\s*${escapedNfc}\\s*$`, "i") } },
          { title: { $regex: new RegExp(`^\\s*${escapedNfd}\\s*$`, "i") } },
        ],
        _id: { $ne: id },
      });

      if (existingSeries) {
        return res.status(400).json({
          message: "Tiêu đề series này đã tồn tại, vui lòng chọn tiêu đề khác.",
        });
      }

      series.title = trimmedTitle;
    }

    // 2. Validate description (SCRUM-87 / US-07)
    if (description !== undefined) {
      const trimmedDesc =
        typeof description === "string" ? description.trim() : description;
      if (trimmedDesc && trimmedDesc.length < 10) {
        return res
          .status(400)
          .json({ message: "Mô tả series phải có ít nhất 10 ký tự" });
      }
      if (trimmedDesc && trimmedDesc.length > 2000) {
        return res
          .status(400)
          .json({ message: "Mô tả series không được vượt quá 2000 ký tự" });
      }
      series.description = trimmedDesc || undefined;
    }

    // 3. Validate genre (SCRUM-87 / US-07)
    if (genre !== undefined) {
      const trimmedGenre = typeof genre === "string" ? genre.trim() : genre;
      if (trimmedGenre && trimmedGenre.length < 2) {
        return res
          .status(400)
          .json({ message: "Thể loại phải có ít nhất 2 ký tự" });
      }
      if (trimmedGenre && trimmedGenre.length > 50) {
        return res
          .status(400)
          .json({ message: "Thể loại không được vượt quá 50 ký tự" });
      }
      series.genre = trimmedGenre || undefined;
    }

    // 4. Validate target_audience (SCRUM-87 / US-07)
    if (target_audience !== undefined) {
      const trimmedAudience =
        typeof target_audience === "string"
          ? target_audience.trim()
          : target_audience;
      if (trimmedAudience && trimmedAudience.length < 2) {
        return res
          .status(400)
          .json({ message: "Đối tượng mục tiêu phải có ít nhất 2 ký tự" });
      }
      if (trimmedAudience && trimmedAudience.length > 50) {
        return res.status(400).json({
          message: "Đối tượng mục tiêu không được vượt quá 50 ký tự",
        });
      }
      series.target_audience = trimmedAudience || undefined;
    }

    // 5. Validate editor_id (SCRUM-88 / US-08)
    if (editor_id !== undefined) {
      if (editor_id === null || editor_id === "") {
        series.editor_id = null;
      } else {
        if (!mongoose.Types.ObjectId.isValid(editor_id)) {
          return res
            .status(400)
            .json({ message: "editor_id không đúng định dạng hợp lệ" });
        }

        const editorExists =
          await User.findById(editor_id).select("_id role name");
        if (!editorExists) {
          return res.status(400).json({
            message: "Không tìm thấy biên tập viên trong hệ thống",
          });
        }

        const tantouRole = ROLES?.TANTOU_EDITOR || "Tantou Editor";
        if (editorExists.role !== tantouRole) {
          return res.status(400).json({
            message: `Người dùng "${editorExists.name}" không phải Tantou Editor`,
          });
        }

        series.editor_id = editorExists._id;
      }
    }

    // Kiểm tra concurrency trước khi lưu (Optimistic Concurrency Check):
    // Đảm bảo trạng thái Series/Proposal không bị chuyển sang chờ duyệt trong quá trình xử lý cập nhật
    const latestProposal = await SeriesProposal.findOne({ series_id: id }).sort({
      createdAt: -1,
    });
    const latestSeries = await Series.findById(id).select("status");

    if (
      (latestProposal && PENDING_STATUSES.includes(latestProposal.status)) ||
      (latestSeries && PENDING_STATUSES.includes(latestSeries.status))
    ) {
      return res.status(409).json({
        message: "Hồ sơ đang ở trạng thái chờ duyệt, không thể cập nhật thông tin.",
      });
    }

    if (latestProposal && !EDITABLE_STATUSES.includes(latestProposal.status)) {
      return res.status(400).json({
        message: `Không thể sửa thông tin series khi proposal ở trạng thái ${latestProposal.status}`,
      });
    }

    await series.save();

    return res.status(200).json({
      message: "Cập nhật series thành công",
      series,
    });
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({
        message: "Dữ liệu Series không hợp lệ",
        details: Object.values(err.errors).map((error) => error.message),
      });
    }

    return res.status(500).json({ error: "Lỗi server", details: err.message });
  }
};
