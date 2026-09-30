// src/pages/ChapterListPage/ChapterListPage.jsx
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import getChaptersBySeries from "../../services/chapter/getChaptersBySeriesService";
import getMySeries from "../../services/series/getMySeriesService";
import { getEditorSeries, getAllSeries, getAssistantSeries } from "../../services/series/getSeriesByRoleService";
import getSeriesById from "../../services/series/getSeriesByIdService";
import deleteChapter from "../../services/chapter/deleteChapterService";
import restoreChapter from "../../services/chapter/restoreChapterService"; // Nhớ import service này
import RequirePermission from "../../components/security/RequirePermission";
import CreateChapterAction from "../../components/chapter/CreateChapterAction/CreateChapterAction";
import ChapterTable from "../../components/chapter/ChapterTable/ChapterTable";
import ConfirmModalDelete from "../../common/ConfirmDeleteModal/ConfirmDeleteModal";
import { useToast } from "../../contexts/ToastContext";
import Loading from "../../common/Loading/Loading";
import { useAuthStore } from "../../stores/authStore";
import "./ChapterListPage.css";

export default function ChapterListPage() {
  const { seriesId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const user = useAuthStore((state) => state.user);

  const [resolvedSeriesId, setResolvedSeriesId] = useState(seriesId || null);
  const [resolvedSeriesName, setResolvedSeriesName] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // STATE QUẢN LÝ MODAL XÁC NHẬN
  const [modalState, setModalState] = useState({
    isOpen: false,
    actionType: "", // 'delete' hoặc 'restore'
    chapterId: null,
    title: "",
    message: "",
  });

  const handleGoBack = () => {
    if (!user) {
      navigate("/");
      return;
    }
    switch (user.role) {
      case "Mangaka":
        navigate("/mangaka/series");
        break;
      case "Tantou Editor":
        navigate("/editor/series");
        break;
      case "Editorial Board":
      case "Admin":
        navigate("/board/all-series");
        break;
      default:
        navigate("/");
    }
  };

  const resolveSeriesInfo = useCallback(async () => {
    if (seriesId) {
      setResolvedSeriesId(seriesId);
      const seriesResult = await getSeriesById(seriesId);
      if (seriesResult.success !== false && seriesResult.series) {
        setResolvedSeriesName(seriesResult.series.title || seriesId);
      } else {
        setResolvedSeriesName(seriesId);
      }
      return seriesId;
    }

    // Không có seriesId trên URL → lấy series theo role
    let result;
    switch (user?.role) {
      case "Mangaka":
        result = await getMySeries();
        break;
      case "Tantou Editor":
        result = await getEditorSeries();
        break;
      case "Assistant":
        result = await getAssistantSeries();
        break;
      case "Editorial Board":
      case "Admin":
        result = await getAllSeries();
        break;
      default:
        result = await getMySeries();
    }

    if (result.success === false) {
      toast.error("Không thể tải danh sách series: " + result.message);
      setResolvedSeriesId(null);
      return null;
    }
    const firstSeries = result.series?.[0]?.series || result.series?.[0];
    if (!firstSeries?._id) {
      setResolvedSeriesId(null);
      return null;
    }
    setResolvedSeriesId(firstSeries._id);
    setResolvedSeriesName(firstSeries.title || firstSeries._id);
    navigate(`/chapter-list/${firstSeries._id}`, { replace: true });
    return firstSeries._id;
  }, [navigate, seriesId, user?.role]);

  const fetchChaptersList = useCallback(async () => {
    setIsLoading(true);
    const nextSeriesId = await resolveSeriesInfo();
    if (!nextSeriesId) {
      setChapters([]);
      setIsLoading(false);
      return;
    }
    const result = await getChaptersBySeries(nextSeriesId);
    if (result.success === false) {
      toast.error("Không thể tải danh sách chapter: " + result.message);
      setChapters([]);
    } else {
      setChapters(result.chapters || []);
    }
    setIsLoading(false);
  }, [resolveSeriesInfo]);

  useEffect(() => {
    fetchChaptersList();
  }, [fetchChaptersList]);

  const confirmDelete = (chapterId) => {
    setModalState({
      isOpen: true,
      actionType: "delete",
      chapterId,
      title: "Xác nhận đưa vào Thùng rác",
      message:
        "Bạn có chắc muốn chuyển chương truyện này vào thùng rác không? Các bản thảo, vùng và công việc liên quan sẽ bị ẩn.",
    });
  };

  const confirmRestore = (chapterId) => {
    setModalState({
      isOpen: true,
      actionType: "restore",
      chapterId,
      title: "Xác nhận Khôi phục",
      message:
        "Bạn muốn khôi phục chương truyện này? Các bản thảo bên trong cũng sẽ được khôi phục trở lại.",
    });
  };

  const handleExecuteAction = async () => {
    const { actionType, chapterId } = modalState;
    // Đóng modal ngay lập tức
    setModalState({ ...modalState, isOpen: false });
    setIsLoading(true);

    if (actionType === "delete") {
      try {
        const result = await deleteChapter(chapterId);
        if (result.success === false) {
          toast.error(result.message || "Không thể hủy chương truyện");
          console.log("Chi tiết lỗi:", result);
        } else {
          toast.success("Đã chuyển chương truyện vào thùng rác!");
          await fetchChaptersList();
        }
      } catch (error) {
        toast.error("Lỗi khi hủy chương: " + error.message);
        console.log("Chi tiết lỗi:", error);
      }
    } else if (actionType === "restore") {
      try {
        const result = await restoreChapter(chapterId);
        if (result.success === false) {
          toast.error(result.message || "Không thể khôi phục chương truyện");
          console.log("Chi tiết lỗi:", result);
        } else {
          toast.success("Khôi phục chương truyện thành công!");
          await fetchChaptersList();
        }
      } catch (error) {
        toast.error("Lỗi khi khôi phục: " + error.message);
      }
    }

    setIsLoading(false);
  };

  return (
    <div className="clp-wrapper">
      {isLoading && <Loading text="Đang xử lý..." />}

      <div>
        <button onClick={handleGoBack} className="clp-back-btn">
          Quay lại danh sách
        </button>
      </div>

      <header className="clp-header">
        <div>
          <h1 className="clp-title">Quản lý chapter</h1>
          <p className="clp-subtitle">
            Series:{" "}
            <span className="clp-highlight">
              {resolvedSeriesName || "Chưa chọn series"}
            </span>
          </p>
        </div>
        {resolvedSeriesId ? (
          <RequirePermission required="CAN_CREATE_CHAPTER">
            <CreateChapterAction
              seriesId={resolvedSeriesId}
              currentCount={chapters.length}
              onCreatedSuccess={fetchChaptersList}
            />
          </RequirePermission>
        ) : null}
      </header>

      {!isLoading && !resolvedSeriesId ? (
        <div className="clp-empty-box">Tài khoản này chưa có series nào.</div>
      ) : null}

      {!isLoading && resolvedSeriesId ? (
        <div className="clp-table-container">
          <ChapterTable
            chapters={chapters}
            onDelete={confirmDelete}
            onRestore={confirmRestore}
          />
        </div>
      ) : null}

      {modalState.isOpen && (
        <ConfirmModalDelete
          isOpen={modalState.isOpen}
          title={modalState.title}
          message={modalState.message}
          onConfirm={handleExecuteAction}
          onCancel={() => setModalState({ ...modalState, isOpen: false })}
        />
      )}
    </div>
  );
}
