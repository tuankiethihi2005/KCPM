import React, { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getEditorSeries } from "../../services/series/getSeriesByRoleService";
import getChaptersBySeries from "../../services/chapter/getChaptersBySeriesService";
import getPagesByChapter from "../../services/page/getPagesByChapterService";
import approvePage from "../../services/page/approvePageService";
import {
  getAnnotationsByPage,
  createAnnotation,
  updateAnnotation,
} from "../../services/annotation/annotationService";
import { useAuthStore } from "../../stores/authStore";
import { useToast } from "../../contexts/ToastContext";
import Loading from "../../common/Loading/Loading";
import {
  ChevronRight,
  ChevronDown,
  CheckCircle,
  XCircle,
  MessageSquare,
  AlertTriangle,
  Clock,
  Eye,
  Plus,
  Send,
  FileText,
  BookOpen,
} from "lucide-react";
import "./EditorFeedbackPage.css";

// ── Helpers ─────────────────────────────────────────────────
const PAGE_STATUS_LABELS = {
  Draft: "Bản nháp",
  "In Progress": "Đang vẽ",
  InProgress: "Đang vẽ",
  "Ready For Review": "Chờ duyệt",
  Submitted: "Chờ duyệt",
  Approved: "Đã duyệt",
  Rejected: "Từ chối",
  Locked: "Đã khóa",
};

const PAGE_STATUS_COLORS = {
  Draft: "#9ca3af",
  "In Progress": "#f59e0b",
  InProgress: "#f59e0b",
  "Ready For Review": "#3b82f6",
  Submitted: "#3b82f6",
  Approved: "#22c55e",
  Rejected: "#ef4444",
  Locked: "#6b7280",
};

const ANNOTATION_STATUS_LABELS = {
  Open: "Chờ sửa",
  "In Progress": "Đang sửa",
  Resolved: "Đã xong",
  Reopened: "Mở lại",
};

const CATEGORY_LABELS = {
  content: "Nội dung",
  script: "Kịch bản",
  dialogue: "Thoại",
  drawing: "Nét vẽ",
  sfx: "SFX/Hiệu ứng",
  layout: "Bố cục",
};

const PAGE_FILTERS = [
  { key: "all", label: "Tất cả" },
  { key: "submitted", label: "Chờ duyệt" },
  { key: "approved", label: "Đã duyệt" },
];

function getEmptyMessage(pageFilter) {
  if (pageFilter === "submitted") {
    return "Không có trang nào đang chờ duyệt.";
  }
  if (pageFilter === "approved") {
    return "Chưa có trang nào được duyệt.";
  }
  return "Chapter này chưa có trang nào.";
}

export default function EditorFeedbackPage() {
  const navigate = useNavigate();
  const toast = useToast();

  // ── Data State ────────────────────────────────────────────
  const [seriesList, setSeriesList] = useState([]);
  const [chaptersMap, setChaptersMap] = useState({});
  const [expandedSeriesId, setExpandedSeriesId] = useState(null);
  const [selectedChapterId, setSelectedChapterId] = useState(null);
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState(null);
  const [annotations, setAnnotations] = useState([]);

  // ── UI State ──────────────────────────────────────────────
  const [isLoadingSeries, setIsLoadingSeries] = useState(true);
  const [isLoadingPages, setIsLoadingPages] = useState(false);
  const [isLoadingAnnotations, setIsLoadingAnnotations] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [pageFilter, setPageFilter] = useState("all");
  const [showNewAnnotation, setShowNewAnnotation] = useState(false);
  const [newAnnotationContent, setNewAnnotationContent] = useState("");
  const [newAnnotationCategory, setNewAnnotationCategory] = useState("drawing");
  const [isSavingAnnotation, setIsSavingAnnotation] = useState(false);

  // Track if chapters have been loaded per series
  const loadedSeries = useRef(new Set());

  const isPendingStatus = (s) =>
    s === "Draft" || s === "Submitted" || s === "Ready For Review";

  // ── Stats (derived from pages + annotations) ──────────────
  const stats = {
    pendingPages: pages.filter((p) => p.status === "Submitted" || p.status==="Draft").length,
    approvedPages: pages.filter((p) => p.status === "Approved").length,
    totalAnnotations: annotations.length,
  };

  // ── 1. Fetch series list ──────────────────────────────────
  const fetchSeries = useCallback(async () => {
    setIsLoadingSeries(true);
    try {
      const res = await getEditorSeries();
      if (res.success !== false) {
        // Unwrap { series, proposal } → series object
        const items = (res.series || []).map((item) =>
          item.series ? item.series : item,
        );
        setSeriesList(items);
      } else {
        toast.error(res.message || "Không thể tải danh sách series.");
      }
    } catch (err) {
      toast.error("Lỗi kết nối: " + err.message);
    } finally {
      setIsLoadingSeries(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSeries();
  }, [fetchSeries]);

  // ── 2. Fetch chapters when series expanded ────────────────
  const loadChapters = useCallback(
    async (seriesId) => {
      if (loadedSeries.current.has(seriesId)) return;
      try {
        const res = await getChaptersBySeries(seriesId);
        if (res.success !== false) {
          const chs = res.chapters || [];
          setChaptersMap((prev) => ({ ...prev, [seriesId]: chs }));
          loadedSeries.current.add(seriesId);
        } else {
          toast.error(res.message || "Không thể tải chapters.");
        }
      } catch (err) {
        toast.error("Lỗi kết nối: " + err.message);
      }
    },
    [toast],
  );

  const toggleSeries = (seriesId) => {
    if (expandedSeriesId === seriesId) {
      setExpandedSeriesId(null);
      setSelectedChapterId(null);
      setPages([]);
      setSelectedPage(null);
      return;
    }
    setExpandedSeriesId(seriesId);
    setSelectedChapterId(null);
    setPages([]);
    setSelectedPage(null);
    loadChapters(seriesId);
  };

  // ── 3. Fetch pages when chapter selected ──────────────────
  const selectChapter = useCallback(
    async (chapterId) => {
      setSelectedChapterId(chapterId);
      setSelectedPage(null);
      setAnnotations([]);
      setIsLoadingPages(true);
      try {
        const res = await getPagesByChapter(chapterId);
        if (res.success !== false) {
          setPages(res.pages || []);
        } else {
          toast.error(res.message || "Không thể tải danh sách trang.");
          setPages([]);
        }
      } catch (err) {
        toast.error("Lỗi kết nối: " + err.message);
        setPages([]);
      } finally {
        setIsLoadingPages(false);
      }
    },
    [toast],
  );

  // ── 4. Select page & load annotations ─────────────────────
  const selectPage = useCallback(
    async (page) => {
      setSelectedPage(page);
      setShowNewAnnotation(false);
      setIsLoadingAnnotations(true);
      try {
        const res = await getAnnotationsByPage(page._id);
        if (res.success !== false) {
          setAnnotations(res.data || res.annotations || []);
        } else {
          setAnnotations([]);
        }
      } catch (err) {
        setAnnotations([]);
      } finally {
        setIsLoadingAnnotations(false);
      }
    },
    [],
  );

  // ── 5. Approve / Reject page ──────────────────────────────
  const handleApprove = async () => {
    if (!selectedPage) return;
    setIsApproving(true);
    try {
      const res = await approvePage(selectedPage._id, "Approved");
      if (res.success !== false) {
        toast.success("Đã duyệt trang thành công!");
        await selectChapter(selectedChapterId);
      } else {
        toast.error(res.message || "Duyệt thất bại.");
      }
    } catch (err) {
      toast.error("Lỗi kết nối: " + err.message);
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!selectedPage) return;
    setIsApproving(true);
    try {
      const res = await approvePage(selectedPage._id, "Rejected");
      if (res.success !== false) {
        toast.success("Đã từ chối trang.");
        await selectChapter(selectedChapterId);
      } else {
        toast.error(res.message || "Từ chối thất bại.");
      }
    } catch (err) {
      toast.error("Lỗi kết nối: " + err.message);
    } finally {
      setIsApproving(false);
    }
  };

  // ── 6. Annotation CRUD ────────────────────────────────────
  const handleCreateAnnotation = async (e) => {
    e.preventDefault();
    if (!selectedPage || !newAnnotationContent.trim()) return;
    setIsSavingAnnotation(true);
    try {
      const res = await createAnnotation(selectedPage._id, {
        x: 50,
        y: 50,
        content: newAnnotationContent.trim(),
        category: newAnnotationCategory,
        status: "Open",
      });
      if (res.success !== false) {
        toast.success("Đã thêm góp ý!");
        const newItem = res.data || res.annotation;
        setAnnotations((prev) => [...prev, newItem]);
        setNewAnnotationContent("");
        setShowNewAnnotation(false);
      } else {
        toast.error(res.message || "Không thể tạo góp ý.");
      }
    } catch (err) {
      toast.error("Lỗi kết nối: " + err.message);
    } finally {
      setIsSavingAnnotation(false);
    }
  };

  const handleUpdateAnnotationStatus = async (annotationId, status) => {
    try {
      const res = await updateAnnotation(annotationId, { status });
      if (res.success !== false) {
        setAnnotations((prev) =>
          prev.map((a) => (a._id === annotationId ? { ...a, status } : a)),
        );
        toast.success("Đã cập nhật trạng thái góp ý!");
      } else {
        toast.error(res.message || "Cập nhật thất bại.");
      }
    } catch (err) {
      toast.error("Lỗi kết nối: " + err.message);
    }
  };

  // ── Filtered pages ────────────────────────────────────────
  const filteredPages = pages.filter((p) => {
    if (pageFilter === "all") return true;
    if (pageFilter === "submitted") return isPendingStatus(p.status);
    if (pageFilter === "approved") return p.status === "Approved";
    return true;
  });

  // ── Derived data ──────────────────────────────────────────
  const chapters = expandedSeriesId ? chaptersMap[expandedSeriesId] || [] : [];
  const selectedChapter = chapters.find((c) => c._id === selectedChapterId);

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="ef-wrapper">
      {/* ═══ HEADER STATS ═══ */}
      <header className="ef-header">
        <div className="ef-header-left">
          <h1 className="ef-title">Biên tập & Phản hồi</h1>
          <p className="ef-subtitle">
            Quản lý duyệt trang và góp ý biên tập cho series phụ trách
          </p>
        </div>
        <div className="ef-stats">
          <div className="ef-stat-card">
            <span className="ef-stat-number pending">{stats.pendingPages}</span>
            <span className="ef-stat-label">Chờ duyệt</span>
          </div>
          <div className="ef-stat-card">
            <span className="ef-stat-number approved">{stats.approvedPages}</span>
            <span className="ef-stat-label">Đã duyệt</span>
          </div>
          <div className="ef-stat-card">
            <span className="ef-stat-number annotation">{stats.totalAnnotations}</span>
            <span className="ef-stat-label">Góp ý</span>
          </div>
        </div>
      </header>

      {/* ═══ BODY: 3-COLUMN LAYOUT ═══ */}
      <div className="ef-body">
        {/* ─── LEFT: SERIES + CHAPTERS ─── */}
        <aside className="ef-sidebar">
          <h2 className="ef-sidebar-title">
            <BookOpen size={14} />
            Series phụ trách
          </h2>

          {isLoadingSeries ? (
            <div className="ef-sidebar-loading">
              <Loading text="Đang tải..." />
            </div>
          ) : seriesList.length === 0 ? (
            <div className="ef-sidebar-empty">
              <FileText size={32} />
              <p>Chưa có series nào</p>
            </div>
          ) : (
            <ul className="ef-series-list">
              {seriesList.map((series) => {
                const isExpanded = expandedSeriesId === series._id;
                const seriesChapters = chaptersMap[series._id];
                const isChaptersLoading = isExpanded && !seriesChapters;

                return (
                  <li key={series._id} className="ef-series-item">
                    <button
                      type="button"
                      className={`ef-series-btn ${isExpanded ? "active" : ""}`}
                      onClick={() => toggleSeries(series._id)}
                    >
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      <span className="ef-series-name">{series.title}</span>
                    </button>

                    {isExpanded && (
                      <ul className="ef-chapter-list">
                        {isChaptersLoading ? (
                          <li className="ef-chapter-item loading">
                            <Loading text="Đang tải..." />
                          </li>
                        ) : seriesChapters.length === 0 ? (
                          <li className="ef-chapter-item empty">Không có chapter</li>
                        ) : (
                          seriesChapters.map((ch) => {
                            const isActive = selectedChapterId === ch._id;
                            const chLabel =
                              ch.title ||
                              `Chương ${ch.chapter_number || ""}`;
                            return (
                              <li key={ch._id}>
                                <button
                                  type="button"
                                  className={`ef-chapter-btn ${isActive ? "active" : ""}`}
                                  onClick={() => selectChapter(ch._id)}
                                >
                                  {chLabel}
                                </button>
                              </li>
                            );
                          })
                        )}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        {/* ─── CENTER: PAGE LIST ─── */}
        <main className="ef-center">
          {!selectedChapterId ? (
            <div className="ef-placeholder">
              <BookOpen size={48} />
              <p className="ef-placeholder-title">Chọn series &amp; chapter</p>
              <p className="ef-placeholder-desc">
                Mở rộng series ở sidebar trái, chọn chapter để xem danh sách trang
              </p>
            </div>
          ) : (
            <>
              <div className="ef-center-header">
                <h2 className="ef-center-title">
                  {selectedChapter?.title ||
                    `Chương ${selectedChapter?.chapter_number || ""}`}
                </h2>
                <div className="ef-filter-tabs">
                  {PAGE_FILTERS.map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      className={`ef-filter-tab ${pageFilter === tab.key ? "active" : ""}`}
                      onClick={() => setPageFilter(tab.key)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {isLoadingPages ? (
                <Loading text="Đang tải danh sách trang..." />
              ) : filteredPages.length === 0 ? (
                <div className="ef-placeholder">
                  <FileText size={40} />
                  <p className="ef-placeholder-title">Không có trang nào</p>
                  <p className="ef-placeholder-desc">
                    {getEmptyMessage(pageFilter)}
                  </p>
                </div>
              ) : (
                <div className="ef-page-grid">
                  {filteredPages.map((page) => {
                    const isSelected = selectedPage?._id === page._id;
                    const statusLabel = PAGE_STATUS_LABELS[page.status] || page.status;
                    const statusColor = PAGE_STATUS_COLORS[page.status] || "#9ca3af";
                    const annotCount = page.annotation_count || 0;

                    return (
                      <button
                        key={page._id}
                        type="button"
                        className={`ef-page-card ${isSelected ? "selected" : ""}`}
                        onClick={() => selectPage(page)}
                      >
                        <div className="ef-page-card-top">
                          <span className="ef-page-number">
                            Trang {page.page_number || "?"}
                          </span>
                          <span
                            className="ef-page-status"
                            style={{ backgroundColor: statusColor }}
                          >
                            {statusLabel}
                          </span>
                        </div>

                        <div className="ef-page-thumb">
                          {page.thumbnail_url ? (
                            <img
                              src={page.thumbnail_url}
                              alt={`Trang ${page.page_number}`}
                            />
                          ) : (
                            <FileText size={24} />
                          )}
                        </div>

                        <div className="ef-page-card-footer">
                          {annotCount > 0 && (
                            <span className="ef-page-annot-badge">
                              <MessageSquare size={11} />
                              {annotCount}
                            </span>
                          )}
                          {page.version > 1 && (
                            <span className="ef-page-version">
                              v{page.version}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </main>

        {/* ─── RIGHT: PAGE DETAIL ─── */}
        <aside className="ef-detail-panel">
          {!selectedPage ? (
            <div className="ef-placeholder small">
              <MessageSquare size={36} />
              <p className="ef-placeholder-title">Chọn một trang</p>
              <p className="ef-placeholder-desc">
                Click vào trang ở giữa để xem chi tiết và góp ý
              </p>
            </div>
          ) : (
            <>
              {/* Page Header */}
              <div className="ef-detail-header">
                <h3 className="ef-detail-title">
                  Trang {selectedPage.page_number || "?"}
                </h3>
                <span
                  className="ef-detail-status"
                  style={{
                    backgroundColor:
                      PAGE_STATUS_COLORS[selectedPage.status] || "#9ca3af",
                  }}
                >
                  {PAGE_STATUS_LABELS[selectedPage.status] || selectedPage.status}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="ef-detail-actions">
                {isPendingStatus(selectedPage.status) && (
                  <>
                    <button
                      type="button"
                      className="ef-btn ef-btn-approve"
                      disabled={isApproving}
                      onClick={handleApprove}
                    >
                      <CheckCircle size={16} />
                      {isApproving ? "..." : "Duyệt"}
                    </button>
                    <button
                      type="button"
                      className="ef-btn ef-btn-reject"
                      disabled={isApproving}
                      onClick={handleReject}
                    >
                      <XCircle size={16} />
                      Từ chối
                    </button>
                  </>
                )}
                <button
                  type="button"
                  className="ef-btn ef-btn-view"
                  onClick={() => navigate(`/workspace/${selectedPage._id}`)}
                >
                  <Eye size={16} />
                  Workspace
                </button>
              </div>

              {/* Page Meta */}
              <div className="ef-detail-meta">
                <div className="ef-meta-row">
                  <Clock size={14} />
                  <span>
                    Cập nhật:{" "}
                    {selectedPage.updated_at
                      ? new Date(selectedPage.updated_at).toLocaleDateString("vi-VN")
                      : "—"}
                  </span>
                </div>
                <div className="ef-meta-row">
                  <AlertTriangle size={14} />
                  <span>Version: {selectedPage.version || 1}</span>
                </div>
              </div>

              {/* ─── ANNOTATIONS ─── */}
              <div className="ef-annotations-section">
                <div className="ef-annotations-header">
                  <h4 className="ef-annotations-title">
                    <MessageSquare size={14} />
                    Góp ý ({annotations.length})
                  </h4>
                  <button
                    type="button"
                    className="ef-btn-small"
                    onClick={() => {
                      setShowNewAnnotation((prev) => !prev);
                      setNewAnnotationContent("");
                    }}
                  >
                    <Plus size={13} />
                    {showNewAnnotation ? "Đóng" : "Thêm"}
                  </button>
                </div>

                {/* New Annotation Form */}
                {showNewAnnotation && (
                  <form className="ef-new-annotation-form" onSubmit={handleCreateAnnotation}>
                    <select
                      className="ef-select"
                      value={newAnnotationCategory}
                      onChange={(e) => setNewAnnotationCategory(e.target.value)}
                    >
                      {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <textarea
                      className="ef-textarea"
                      placeholder="Nhập nội dung góp ý..."
                      value={newAnnotationContent}
                      onChange={(e) => setNewAnnotationContent(e.target.value)}
                      rows={3}
                    />
                    <button
                      type="submit"
                      className="ef-btn ef-btn-send"
                      disabled={isSavingAnnotation || !newAnnotationContent.trim()}
                    >
                      <Send size={14} />
                      {isSavingAnnotation ? "Đang gửi..." : "Gửi góp ý"}
                    </button>
                  </form>
                )}

                {/* Annotations List */}
                {isLoadingAnnotations ? (
                  <Loading text="Đang tải góp ý..." />
                ) : annotations.length === 0 ? (
                  <p className="ef-empty-text">Chưa có góp ý nào cho trang này.</p>
                ) : (
                  <ul className="ef-annotations-list">
                    {annotations.map((ann) => (
                      <li
                        key={ann._id}
                        className="ef-annotation-item"
                        style={{
                          borderLeftColor:
                            ann.status === "Resolved"
                              ? "#22c55e"
                              : ann.status === "Open"
                                ? "#f59e0b"
                                : "#3b82f6",
                        }}
                      >
                        <div className="ef-annotation-top">
                          <span className="ef-annotation-category">
                            {CATEGORY_LABELS[ann.category] || ann.category}
                          </span>
                          <span className="ef-annotation-author">
                            {ann.created_by?.name || "—"}
                          </span>
                        </div>
                        <p className="ef-annotation-content">{ann.content}</p>
                        <div className="ef-annotation-bottom">
                          <select
                            className="ef-status-select"
                            value={ann.status}
                            onChange={(e) =>
                              handleUpdateAnnotationStatus(ann._id, e.target.value)
                            }
                          >
                            {Object.entries(ANNOTATION_STATUS_LABELS).map(
                              ([key, label]) => (
                                <option key={key} value={key}>
                                  {label}
                                </option>
                              ),
                            )}
                          </select>
                          {ann.deadline && (
                            <span className="ef-annotation-deadline">
                              Hạn:{" "}
                              {new Date(ann.deadline).toLocaleDateString("vi-VN")}
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
