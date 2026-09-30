const Series = require("../../../models/SeriesModel");
const Chapter = require("../../../models/ChapterModel");
const Page = require("../../../models/PageModel");
const { ROLES } = require("../../../constants/roles");

const ensureAuthzContext = (req) => {
  if (!req.authz) {
    req.authz = {};
  }
};

const isSameId = (left, right) => String(left) === String(right);

const canAccessSeries = (user, series, mode = "read") => {
  if (!user || !series) {
    return false;
  }

  if (user.role === ROLES.ADMIN) {
    return true;
  }

  if (user.role === ROLES.EDITORIAL_BOARD) {
    return mode === "read" || mode === "write";
  }

  if (user.role === ROLES.MANGAKA) {
    return isSameId(series.author_id, user.id);
  }

  if (user.role === ROLES.TANTOU_EDITOR) {
    if (mode === "read") {
      return (
        !series.editor_id || isSameId(series.editor_id, user.id)
      );
    }

    return !series.editor_id || isSameId(series.editor_id, user.id);
  }

  if (user.role === ROLES.ASSISTANT) {
    // Assistant chỉ được đọc series mà họ có task
    return mode === "read";
  }

  return false;
};

const requireSeriesScope = (paramName, mode = "read") => {
  return async (req, res, next) => {
    try {
      const series = await Series.findById(req.params[paramName]);
      if (!series) {
        return res.status(404).json({ message: "Không tìm thấy series" });
      }

      if (!canAccessSeries(req.user, series, mode)) {
        return res.status(403).json({
          error: {
            code: "AUTHZ_SCOPE_DENIED",
            message: "You do not have access to this series.",
          },
        });
      }

      ensureAuthzContext(req);
      req.authz.series = series;
      return next();
    } catch (error) {
      return res.status(500).json({ error: "Lỗi server", details: error.message });
    }
  };
};

const requireChapterScope = (paramName, mode = "read") => {
  return async (req, res, next) => {
    try {
      const chapter = await Chapter.findById(req.params[paramName]);
      if (!chapter) {
        return res.status(404).json({ message: "Không tìm thấy chapter" });
      }

      const series = await Series.findById(chapter.series_id);
      if (!series) {
        return res.status(404).json({ message: "Không tìm thấy series" });
      }

      if (!canAccessSeries(req.user, series, mode)) {
        return res.status(403).json({
          error: {
            code: "AUTHZ_SCOPE_DENIED",
            message: "You do not have access to this chapter.",
          },
        });
      }

      ensureAuthzContext(req);
      req.authz.chapter = chapter;
      req.authz.series = series;
      return next();
    } catch (error) {
      return res.status(500).json({ error: "Lỗi server", details: error.message });
    }
  };
};

const requirePageScope = (paramName, mode = "read") => {
  return async (req, res, next) => {
    try {
      const page = await Page.findById(req.params[paramName]);
      if (!page) {
        return res.status(404).json({ message: "Không tìm thấy trang truyện" });
      }

      const chapter = await Chapter.findById(page.chapter_id);
      if (!chapter) {
        return res.status(404).json({ message: "Không tìm thấy chapter" });
      }

      const series = await Series.findById(chapter.series_id);
      if (!series) {
        return res.status(404).json({ message: "Không tìm thấy series" });
      }

      if (!canAccessSeries(req.user, series, mode)) {
        return res.status(403).json({
          error: {
            code: "AUTHZ_SCOPE_DENIED",
            message: "You do not have access to this page.",
          },
        });
      }

      ensureAuthzContext(req);
      req.authz.page = page;
      req.authz.chapter = chapter;
      req.authz.series = series;
      return next();
    } catch (error) {
      return res.status(500).json({ error: "Lỗi server", details: error.message });
    }
  };
};

module.exports = {
  canAccessSeries,
  requireChapterScope,
  requirePageScope,
  requireSeriesScope,
};
