const Chapter = require("../../models/ChapterModel");
const Page = require("../../models/PageModel");
const Task = require("../../models/TaskModel");
const Annotation = require("../../models/AnnotationModel");
const Series = require("../../models/SeriesModel");
const NotificationService = require("../../services/notificationService");

exports.publishChapter = async (req, res) => {
  try {
    const { chapter_id } = req.params;
    const { release_issue_id } = req.body;

    const chapter = await Chapter.findById(chapter_id);

    // kiểm tra xem chapter có tồn tại không
    if (!chapter) {
      return res.status(404).json({ message: "Không tìm thấy chapter" });
    }
    // kiểm tra xem chapter đã có trang nào hay chưa
    const pages = await Page.find({ chapter_id });

    if (pages.length === 0) {
      return res.status(400).json({ message: "Chapter chưa có trang nào" });
    }

    // Lấy danh sách id của tất cả các trang thuộc chapter này
    const pageIds = pages.map((page) => page._id);

    // Điều kiện lọc 1: Lọc ra các trang chưa được phê duyệt
    const unapprovedPages = pages.filter((page) => page.status !== "Approved");
    // kiểm tra xem có trang nào chưa được phê duyệt không vì các trang phải được duyệt thì mới đủ điều kiện xuất bản
    if (unapprovedPages.length > 0) {
      return res.status(400).json({
        message: "Không thể xuất bản. Vẫn còn trang truyện chưa được phê duyệt",
        unapprovedPages_count: unapprovedPages.length,
      });
    }

    // Điều kiện lọc 2: Lọc ra các trang có task chưa hoàn thành
    const unfinishedTasks = await Task.find({
      page_id: { $in: pageIds },
      status: { $nin: ["Approved", "Paid"] },
    });
    if (unfinishedTasks.length > 0) {
      return res.status(400).json({
        message:
          "Không thể xuất bản. Vẫn còn task chưa hoàn thành trên các trang truyện",
        unfinishedTasks_count: unfinishedTasks.length,
      });
    }

    // Điều kiện lọc 3: Lọc ra các trang có annotation chưa được giải quyết
    const unresolvedAnnotations = await Annotation.find({
      page_id: { $in: pageIds },
      status: { $ne: "Resolved" },
    });

    if (unresolvedAnnotations.length > 0) {
      return res.status(400).json({
        message:
          "Không thể xuất bản. Vẫn còn annotation chưa được giải quyết trên các trang truyện",
        unresolvedAnnotations_count: unresolvedAnnotations.length,
      });
    }

    // Nếu tất cả các điểu kiện trên đều thỏa mãn, cập nhật trạng thái của chapter thành "Published"
    chapter.status = "Published";
    chapter.published_at = new Date();
    if (release_issue_id) {
      chapter.release_issue_id = release_issue_id;
    }
    await chapter.save();

    // Find series to get author/editor info
    const series = await Series.findById(chapter.series_id);

    // Notify author and editor about publication
    if (series) {
      const notifyUsers = [series.author_id];
      if (series.editor_id) notifyUsers.push(series.editor_id);
      for (const userId of notifyUsers) {
        await NotificationService.createNotification({
          user_id: userId,
          type: "Task_Update",
          title: "Chapter đã được xuất bản",
          message: `Chapter "${chapter.title}" của series "${series.title}" đã được xuất bản thành công.`,
          target_type: "Chapter",
          target_id: chapter.series_id,
        });
      }
    }

    res.status(200).json({ message: "Xuất bản chapter thành công", chapter });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Lỗi server", error: error.message });
  }
};
