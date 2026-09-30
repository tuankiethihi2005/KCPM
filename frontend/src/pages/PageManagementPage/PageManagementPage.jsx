import React, { useCallback, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import approvePage from "../../services/page/approvePageService";
import getPagesByChapter from "../../services/page/getPagesByChapterService";
import deletePage from "../../services/page/deletePageService";
import getChapterById from "../../services/chapter/getChapterByIdService";
import updatePageVersion from "../../services/page/updatePageVersionService";
import updateChapterStatus from "../../services/chapter/updateChapterStatusService";
import RequirePermission from "../../components/security/RequirePermission";
import UploadPagesDropzone from "../../components/page/UploadPagesDropzone/UploadPagesDropzone";
import PageGallery from "../../components/page/PageGallery/PageGallery";
import { useToast } from "../../contexts/ToastContext";
import Loading from "../../common/Loading/Loading";
import deletePageService from "../../services/page/deletePageService";
import restorePageService from "../../services/page/restorePageService";
import { Trash2, ImageIcon } from "lucide-react";
import "./PageManagementPage.css";

const CHAPTER_STATUS_OPTIONS = [
  "Draft",
  "In Production",
  "Waiting Review",
  "Approved",
];

// Hàm phiên dịch trạng thái sang Tiếng Việt (Chỉ dùng để hiển thị giao diện)
const translateStatus = (status) => {
  const s = (status || "").toLowerCase().trim();
  if (s === "draft") return "Bản nháp";
  if (s === "in production" || s === "in progress") return "Đang xử lý";
  if (s === "waiting review" || s === "ready for review") return "Chờ duyệt";
  if (s === "approved") return "Đã duyệt";
  if (s === "published") return "Đã xuất bản";
  return status;
};

// Hàm lấy class màu dựa trên trạng thái
const getStatusColorClass = (status) => {
  const s = (status || "").toLowerCase().replace(/\s+/g, "-");
  switch (s) {
    case "draft":
      return "status-bg-draft";
    case "in-production":
      return "status-bg-in-production";
    case "waiting-review":
      return "status-bg-waiting-review";
    case "approved":
      return "status-bg-approved";
    case "published":
      return "status-bg-published";
    default:
      return "status-bg-draft";
  }
};

export default function PageManagementPage() {
  const { chapterId } = useParams();
  const toast = useToast();
  const [pages, setPages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chapterInfo, setChapterInfo] = useState({
    _id: chapterId,
    series_id: null,
    title: "Dang tai...",
    status: "Loading",
  });
  const [selectedChapterStatus, setSelectedChapterStatus] = useState("");
  const [isUpdatingChapter, setIsUpdatingChapter] = useState(false);
  const [isTrashView, setIsTrashView] = useState(false);

  const fetchPagesAndChapterInfo = useCallback(async () => {
    setIsLoading(true);
    try {
      const [chapterResult, pagesResult] = await Promise.all([
        getChapterById(chapterId),
        getPagesByChapter(chapterId),
      ]);
      console.log("Pages Result:", pagesResult);
      if (chapterResult.success === false) {
        toast.error("Khong the tai chapter: " + chapterResult.message);
      } else {
        const chapter = chapterResult.chapter;
        setChapterInfo(chapter);
        setSelectedChapterStatus(chapter?.status || "");
      }
      if (pagesResult.success === false) {
        toast.error("Khong the tai danh sach trang: " + pagesResult.message);
        setPages([]);
      } else {
        setPages(pagesResult.pages || []);
      }
    } catch (error) {
      toast.error("Da xay ra loi khi tai du lieu: " + error.message);
      setPages([]);
    } finally {
      setIsLoading(false);
    }
  }, [chapterId]);

  useEffect(() => {
    fetchPagesAndChapterInfo();
  }, [fetchPagesAndChapterInfo]);

  const handleUpdateChapterStatus = async () => {
    if (!selectedChapterStatus) {
      return;
    }
    setIsUpdatingChapter(true);
    try {
      const result = await updateChapterStatus(
        chapterId,
        selectedChapterStatus,
      );
      if (result.success === false) {
        toast.error("Khong the cap nhat chapter: " + result.message);
      } else {
        setChapterInfo((prev) => ({
          ...prev,
          status: result.chapter?.status || selectedChapterStatus,
        }));
        toast.success(
          `Da cap nhat chapter thanh ${translateStatus(selectedChapterStatus)}.`,
        );
      }
    } catch (error) {
      toast.error("Da xay ra loi khi cap nhat chapter: " + error.message);
    } finally {
      setIsUpdatingChapter(false);
    }
  };

  const handleUploadSuccess = () => fetchPagesAndChapterInfo();

  const handleStatusChange = async (pageId, newStatus) => {
    setIsLoading(true);
    try {
      const result = await approvePage(pageId, newStatus);
      if (result.success === false)
        throw new Error(result.message || "Không thể cập nhật trang");

      toast.success(
        `Đã cập nhật trạng thái trang thành ${translateStatus(newStatus)}.`,
      );
      await fetchPagesAndChapterInfo();
    } catch (error) {
      toast.error("Không thể cập nhật trang: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateVersion = async (pageId, file) => {
    setIsLoading(true);
    try {
      const result = await updatePageVersion(pageId, file);
      if (result.success === false)
        throw new Error(result.message || "Không thể tải lên phiên bản mới");

      toast.success("Đã tải lên phiên bản mới.");
      await fetchPagesAndChapterInfo();
    } catch (error) {
      toast.error("Không thể tải lên phiên bản mới: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePage = async (pageId) => {
    const result = await deletePageService(pageId);
    if (result.success !== false) {
      toast.success("Đã xóa trang!");
      fetchPagesAndChapterInfo();
    } else {
      toast.error(result.message);
    }
  };

  const handleRestorePage = async (pageId) => {
    const result = await restorePageService(pageId);
    if (result.success !== false) {
      toast.success("Đã khôi phục trang!");
      fetchPagesAndChapterInfo();
    } else {
      toast.error(result.message);
    }
  };

  const activePages = pages.filter((p) => !p.is_deleted);
  const deletedPages = pages.filter((p) => p.is_deleted);
  const displayedPages = isTrashView ? deletedPages : activePages;

  const lastPageNumber =
    pages.length > 0 ? Math.max(...pages.map((p) => p.page_number || 0)) : 0;

  const backSeriesId = chapterInfo.series_id || "";

  return (
    <div className="pmp-wrapper">
      {isLoading && <Loading text="Dang xu ly..." />}

      <header className="pmp-header-area">
        <Link
          to={backSeriesId ? `/chapter-list/${backSeriesId}` : "/chapter-list"}
          className="pmp-back-btn"
        >
          ← Quay lai danh sach
        </Link>

        <div className="pmp-header-main">
          <div>
            <h1 className="pmp-title">{chapterInfo.title}</h1>
            <p className="pmp-subtitle">
              Trạng thái:
              <span
                className={`pmp-status-badge ${getStatusColorClass(chapterInfo.status)}`}
              >
                {translateStatus(chapterInfo.status)}
              </span>
            </p>
          </div>

          <RequirePermission required="CAN_APPROVE_PAGE">
            <div className="pmp-control-box">
              <span className="pmp-control-label">ĐIỀU CHỈNH CHAPTER</span>
              <div className="flex gap-2">
                <select
                  className={`pmp-select ${getStatusColorClass(selectedChapterStatus)}`}
                  value={selectedChapterStatus}
                  onChange={(e) => setSelectedChapterStatus(e.target.value)}
                  disabled={
                    isUpdatingChapter || chapterInfo.status === "Published"
                  }
                >
                  {CHAPTER_STATUS_OPTIONS.map((status) => (
                    /* Value tiếng Anh gửi BE, hiển thị tiếng Việt cho UI */
                    <option key={status} value={status}>
                      {translateStatus(status)}
                    </option>
                  ))}
                </select>
                <button
                  className="pmp-action-btn"
                  onClick={handleUpdateChapterStatus}
                  disabled={
                    isUpdatingChapter || chapterInfo.status === "Published"
                  }
                >
                  {isUpdatingChapter ? "..." : "Cập nhật"}
                </button>
              </div>
            </div>
          </RequirePermission>
        </div>
      </header>

      <RequirePermission required="CAN_UPLOAD_PAGE">
        <UploadPagesDropzone
          chapterId={chapterId}
          lastPageNumber={lastPageNumber}
          onUploadSuccess={handleUploadSuccess}
          activeIndex={activePages.length + 1}
        />
      </RequirePermission>

      <div className="pmp-view-toggle-container">
        <button
          onClick={() => setIsTrashView(false)}
          className={`pmp-view-toggle-btn ${!isTrashView ? "active-view" : ""}`}
        >
          <ImageIcon size={18} />
          Đang hiển thị ({activePages.length})
        </button>
        <RequirePermission required="CAN_DELETE_RESTORE_CHAPTER_PAGE">
          <button
            onClick={() => setIsTrashView(true)}
            className={`pmp-view-toggle-btn ${isTrashView ? "trash-view" : ""}`}
          >
            <Trash2 size={18} />
            Thùng rác ({deletedPages.length})
          </button>
        </RequirePermission>
      </div>

      <div className="pmp-gallery-container">
        <PageGallery
          pages={displayedPages}
          isTrashView={isTrashView}
          onDelete={handleDeletePage}
          onRestore={handleRestorePage}
          onChangeStatus={handleStatusChange}
          onUpdateVersion={handleUpdateVersion}
          onDeletePage={handleDeletePage}
        />
      </div>
    </div>
  );
}
