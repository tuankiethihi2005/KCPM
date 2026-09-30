import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import getPageById from "../../services/page/getPageByIdService";
import {
  getRegionsByPage,
  createRegion,
  deleteRegion,
} from "../../services/region/regionService";
import {
  getAnnotationsByPage,
  createAnnotation,
  updateAnnotation,
  deleteAnnotation,
  restoreAnnotation,
} from "../../services/annotation/annotationService";
import {
  getTasksApi,
  createTaskApi,
  getAssistantsApi,
} from "../../services/task/taskService";
import { useAuthStore } from "../../stores/authStore";
import { useToast } from "../../contexts/ToastContext";
import Loading from "../../common/Loading/Loading";
import {
  Send,
  Plus,
  X,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Eye,
  Edit3,
  MapPin,
  MessageSquare,
} from "lucide-react";
import "./PageWorkspacePage.css";

import RequirePermission from "../../components/security/RequirePermission";
import ConfirmDeleteModal from "../../common/ConfirmDeleteModal/ConfirmDeleteModal";
const CATEGORY_LABELS = {
  content: "Nội dung",
  script: "Kịch bản",
  dialogue: "Thoại",
  drawing: "Nét vẽ",
  sfx: "SFX/Hiệu ứng",
  layout: "Bố cục",
};

const STATUS_CONFIG = {
  Open: { label: "Chờ sửa", color: "#FF5C00", bg: "#fff4ee" },
  "In Progress": { label: "Đang sửa", color: "#FFD000", bg: "#fffce8" },
  Resolved: { label: "Đã xong", color: "#23A094", bg: "#edfaf8" },
  Reopened: { label: "Mở lại", color: "#9b59b6", bg: "#f8eeff" },
};

export default function PageWorkspacePage() {
  const { pageId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const user = useAuthStore((state) => state.user);

  const [page, setPage] = useState(null);
  const [regions, setRegions] = useState([]);
  const [annotations, setAnnotations] = useState([]);
  const [trashedAnnotations, setTrashedAnnotations] = useState([]);

  const [tasks, setTasks] = useState([]);
  const [assistants, setAssistants] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Interactive modes: 'view' | 'draw_region' | 'add_pin'
  const [mode, setMode] = useState("view");

  // Selection states
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedAnnotation, setSelectedAnnotation] = useState(null);

  // ── Annotation Pin States ─────────────────────────────────
  // tempPin: tọa độ % trên ảnh khi người dùng vừa click
  const [tempPin, setTempPin] = useState(null);
  // showPinModal: hiển thị cửa sổ nhập nội dung
  const [showPinModal, setShowPinModal] = useState(false);
  // Form fields cho pin modal
  const [pinContent, setPinContent] = useState("");
  const [pinCategory, setPinCategory] = useState("drawing");
  const [pinDeadline, setPinDeadline] = useState("");

  // Edit annotation state
  const [editingAnnotation, setEditingAnnotation] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editDeadline, setEditDeadline] = useState("");

  // Drawing Region States
  const imageRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState({ x: 0, y: 0 });
  const [tempBox, setTempBox] = useState(null);

  // Task Form State
  const [taskType, setTaskType] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskDeadline, setTaskDeadline] = useState("");
  const [taskPrice, setTaskPrice] = useState("");
  const [regionType, setRegionType] = useState("panel");
  const [showTaskModal, setShowTaskModal] = useState(false);

  const isMangaka = user?.role === "Mangaka" || user?.role === "Admin";
  const isEditor = user?.role === "Tantou Editor" || user?.role === "Admin";
  const isAssistant = user?.role === "Assistant";

  // State quản lý việc xóa mềm Annotation bằng Modal mới
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [annotationToDelete, setAnnotationToDelete] = useState(null);

  // ── Data Fetching ─────────────────────────────────────────
  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [pageRes, regionsRes, annotationsRes, tasksRes, assistantsRes] =
        await Promise.all([
          getPageById(pageId),
          getRegionsByPage(pageId),
          getAnnotationsByPage(pageId),
          getTasksApi({ page_id: pageId }),
          isMangaka
            ? getAssistantsApi()
            : Promise.resolve({ success: true, assistants: [] }),
        ]);

      if (pageRes.success) {
        setPage(pageRes.page);
      } else {
        toast.error("Không thể tải trang truyện: " + pageRes.message);
      }

      if (regionsRes.success) setRegions(regionsRes.regions);
      // API mới trả về { success, count, data }
      if (annotationsRes.success) {
        const allAnns = annotationsRes.data || annotationsRes.annotations || [];

        // Tách làm 2 mảng dựa vào cờ isDeleted (hoặc is_deleted tuỳ cách backend trả về)
        const activeAnns = allAnns.filter((ann) => ann.isDeleted !== true);
        const trashedAnns = allAnns.filter((ann) => ann.isDeleted === true);

        // Đưa vào 2 state tương ứng
        setAnnotations(activeAnns);
        setTrashedAnnotations(trashedAnns);
      }
      if (tasksRes.success) setTasks(tasksRes.tasks);
      if (assistantsRes.success) setAssistants(assistantsRes.assistants);
    } catch (error) {
      toast.error("Lỗi khi tải dữ liệu Workspace: " + error.message);
    } finally {
      setIsLoading(false);
    }
  }, [pageId, isMangaka, toast]);

  useEffect(() => {
    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageId]);

  // ── Annotation: Click ảnh để đặt pin ─────────────────────
  const handleImageClick = (e) => {
    if (mode !== "add_pin") return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Clamp trong [0, 100]
    const clampedX = Math.min(100, Math.max(0, x));
    const clampedY = Math.min(100, Math.max(0, y));

    setTempPin({ x: clampedX, y: clampedY });
    setPinContent("");
    setPinCategory("drawing");
    setPinDeadline("");
    setShowPinModal(true);
  };

  // ── Annotation: Lưu pin (submit form) ────────────────────
  const handleSaveAnnotation = async (e) => {
    e.preventDefault();
    if (!tempPin || !pinContent.trim()) return;

    setIsSaving(true);
    try {
      const res = await createAnnotation(pageId, {
        x: tempPin.x,
        y: tempPin.y,
        content: pinContent.trim(),
        category: pinCategory,
        deadline: pinDeadline || undefined,
        status: "Open",
      });

      if (res.success) {
        toast.success("Đã lưu góp ý biên tập!");
        // API mới trả về res.data
        const newAnnotation = res.data || res.annotation;
        setAnnotations((prev) => [...prev, newAnnotation]);
        handleClosePinModal();
      } else {
        toast.error("Không thể lưu góp ý: " + res.message);
      }
    } catch (err) {
      toast.error("Lỗi khi lưu góp ý: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Annotation: Đóng modal pin ────────────────────────────
  const handleClosePinModal = () => {
    setShowPinModal(false);
    setTempPin(null);
    setPinContent("");
    setPinCategory("drawing");
    setPinDeadline("");
  };

  // ── Annotation: Toggle status ─────────────────────────────
  const handleToggleAnnotationStatus = async (annId, currentStatus) => {
    const nextStatus = currentStatus === "Resolved" ? "Reopened" : "Resolved";
    const res = await updateAnnotation(annId, { status: nextStatus });
    if (res.success) {
      const updated = res.data || res.annotation;
      toast.success(
        `Đã đánh dấu: ${STATUS_CONFIG[nextStatus]?.label || nextStatus}`,
      );
      setAnnotations((prev) =>
        prev.map((a) => (a._id === annId ? updated : a)),
      );
      if (selectedAnnotation?._id === annId) setSelectedAnnotation(updated);
    } else {
      toast.error(res.message);
    }
  };

  // ── Annotation: Bắt đầu chỉnh sửa ────────────────────────
  const handleStartEdit = (ann) => {
    setEditingAnnotation(ann._id);
    setEditContent(ann.content || "");
    setEditStatus(ann.status || "Open");
    setEditDeadline(
      ann.deadline ? new Date(ann.deadline).toISOString().slice(0, 10) : "",
    );
  };

  // ── Annotation: Lưu chỉnh sửa ────────────────────────────
  const handleSaveEdit = async (annId) => {
    setIsSaving(true);
    try {
      const res = await updateAnnotation(annId, {
        content: editContent.trim(),
        status: editStatus,
        deadline: editDeadline || null,
      });
      if (res.success) {
        const updated = res.data || res.annotation;
        toast.success("Đã cập nhật góp ý!");
        setAnnotations((prev) =>
          prev.map((a) => (a._id === annId ? updated : a)),
        );
        if (selectedAnnotation?._id === annId) setSelectedAnnotation(updated);
        setEditingAnnotation(null);
      } else {
        toast.error(res.message);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // ── Annotation: Xóa ──────────────────────────────────────
  // 1. Hàm kích hoạt mở Modal xác nhận xóa
  const handleOpenDeleteModal = (ann) => {
    setAnnotationToDelete(ann);
    setIsDeleteModalOpen(true);
  };

  // 2. Hàm thực thi xóa khi bấm nút xác nhận trong ConfirmDeleteModal
  // 2. Hàm thực thi xóa khi bấm nút xác nhận trong ConfirmDeleteModal
  const handleConfirmDeleteAnnotation = async () => {
    if (!annotationToDelete) return;

    setIsLoading(true);
    try {
      const res = await deleteAnnotation(annotationToDelete._id);
      if (res.success) {
        toast.success("Đã xóa góp ý thành công!");

        // --- XÓA KHỎI LIST CHÍNH VÀ ĐẨY VÀO THÙNG RÁC ---
        setAnnotations((prev) =>
          prev.filter((a) => a._id !== annotationToDelete._id),
        );
        setTrashedAnnotations((prev) => [...prev, annotationToDelete]);

        if (selectedAnnotation?._id === annotationToDelete._id)
          setSelectedAnnotation(null);

        setIsDeleteModalOpen(false);
        setAnnotationToDelete(null);
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error("Lỗi khi xóa góp ý: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Annotation: Khôi phục ────────────────────────────────
  const handleRestoreAnnotation = async (ann) => {
    setIsLoading(true);
    try {
      const res = await restoreAnnotation(ann._id);
      if (res.success) {
        toast.success("Đã khôi phục góp ý!");
        const restoredAnn = res.data || res.annotation || ann;

        // Xóa khỏi thùng rác và đưa lại vào danh sách chính
        setTrashedAnnotations((prev) => prev.filter((a) => a._id !== ann._id));
        setAnnotations((prev) => [...prev, { ...restoredAnn, status: "Open" }]);
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error("Lỗi khi khôi phục: " + err.message);
      console.error("Chi tiết lỗi khôi phục góp ý:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Drawing Regions (mouse handlers) ─────────────────────
  const handleMouseDown = (e) => {
    if (mode !== "draw_region") return;
    e.preventDefault();
    const rect = imageRef.current.getBoundingClientRect();
    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;
    setIsDrawing(true);
    setDrawStart({ x: startX, y: startY });
    setTempBox({
      x: (startX / rect.width) * 100,
      y: (startY / rect.height) * 100,
      width: 0,
      height: 0,
    });
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || mode !== "draw_region") return;
    const rect = imageRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    const x = Math.min(drawStart.x, currentX);
    const y = Math.min(drawStart.y, currentY);
    const width = Math.abs(drawStart.x - currentX);
    const height = Math.abs(drawStart.y - currentY);
    setTempBox({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      width: (width / rect.width) * 100,
      height: (height / rect.height) * 100,
    });
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (tempBox && (tempBox.width > 2 || tempBox.height > 2)) {
      setShowTaskModal(true);
    } else {
      setTempBox(null);
      toast.error("Vùng vẽ quá nhỏ, vui lòng kéo lại!");
    }
  };

  // ── Create Region & Task (Mangaka only) ──────────────────
  const handleCreateTaskAndRegion = async (e) => {
    e.preventDefault();
    if (!assignedTo) {
      toast.error(
        "Vui lòng chọn Trợ lý ở thanh công cụ phía trên trước khi giao việc!",
      );
      return;
    }

    if (!tempBox || !taskType || !taskDeadline) {
      toast.error("Vui lòng điền đủ thông tin để giao việc!");
      return;
    }
    setIsLoading(true);
    try {
      const regionRes = await createRegion(pageId, {
        coordinates: JSON.stringify(tempBox),
        region_type: regionType,
      });
      if (!regionRes.success)
        throw new Error(regionRes.message || "Lỗi tạo vùng vẽ");

      const taskRes = await createTaskApi({
        page_id: pageId,
        region_id: regionRes.region._id,
        assigned_to: assignedTo,
        task_type: taskType,
        description: taskDesc,
        deadline: taskDeadline,
        price: Number(taskPrice) || 0,
      });
      if (!taskRes.success) {
        await deleteRegion(regionRes.region._id);
        throw new Error(taskRes.message || "Lỗi giao việc");
      }
      toast.success("Đã giao việc thành công cho Assistant!");
      await fetchAllData();
      setShowTaskModal(false);
      setTempBox(null);
      setMode("view");
      setTaskType("");
      setTaskDesc("");
      setTaskDeadline("");
      setTaskPrice("");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Helpers ───────────────────────────────────────────────
  const getTaskForRegion = (regionId) =>
    tasks.find(
      (t) => String(t.region_id?._id || t.region_id) === String(regionId),
    );

  const translateTaskStatus = (status) => {
    const s = (status || "").toLowerCase().trim();
    if (s === "assigned") return "Mới giao";
    if (s === "in progress") return "Đang vẽ";
    if (s === "submitted") return "Chờ duyệt";
    if (s === "approved") return "Đã duyệt";
    if (s === "revision requested") return "Cần sửa";
    if (s === "rejected") return "Bị từ chối";
    if (s === "paid") return "Đã thanh toán";
    return status;
  };

  const getTaskStatusColor = (status) => {
    const s = (status || "").toLowerCase().trim();
    if (s === "assigned")
      return "text-yellow-600 bg-yellow-100 border-yellow-400";
    if (s === "in progress") return "text-teal-600 bg-teal-100 border-teal-400";
    if (s === "submitted") return "text-pink-600 bg-pink-100 border-pink-400";
    if (s === "approved") return "text-green-600 bg-green-100 border-green-400";
    if (s === "revision requested")
      return "text-orange-600 bg-orange-100 border-orange-400";
    return "text-gray-600 bg-gray-100 border-gray-400";
  };

  const getAnnotationStatusBadge = (status) => {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG["Open"];
    return (
      <span
        className="ann-status-badge"
        style={{
          color: cfg.color,
          backgroundColor: cfg.bg,
          border: `1px solid ${cfg.color}`,
        }}
      >
        {cfg.label}
      </span>
    );
  };

  if (isLoading && !page) return <Loading text="Đang tải Workspace..." />;
  if (!page)
    return (
      <div className="p-8 text-center">
        Không tìm thấy dữ liệu trang truyện.
      </div>
    );

  const openAnnotations = annotations.filter((a) => a.status !== "Resolved");
  const resolvedAnnotations = annotations.filter(
    (a) => a.status === "Resolved",
  );

  return (
    <div className="ws-container">
      {isLoading && <Loading text="Đang xử lý..." />}

      {/* ── WORKSPACE HEADER ── */}
      <header className="ws-header shadow-brutal">
        <div className="ws-header-info">
          <button
            onClick={() => navigate(-1)}
            className="ws-back-link font-bold text-sm bg-transparent border-none cursor-pointer p-0 text-gray-700 hover:text-black hover:underline"
          >
            ← Quay lại
          </button>
          <h1 className="ws-title">
            {page.chapter_id.title} — Trang {page.page_number}
          </h1>
          <p className="ws-subtitle">
            Truyện: <strong>{page.chapter_id.series_id.title}</strong> | Phiên
            bản: <strong>V{page.current_version}</strong>
          </p>
        </div>

        <div className="ws-mode-controls">
          {/* THÊM MỚI: Khu vực chọn Trợ lý dùng chung cho cả trang */}
          {isMangaka && (
            <div className="flex items-center mr-4 gap-2 border-r-2 border-gray-300 pr-4">
              <label className="text-xs font-black uppercase whitespace-nowrap">
                Trợ lý:
              </label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="ws-select text-xs py-1.5"
              >
                <option value="">-- Chọn Trợ lý --</option>
                {assistants.map((as) => (
                  <option key={as._id} value={as._id}>
                    {as.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            className={`ws-mode-btn ${mode === "view" ? "active bg-[#23A094] text-white" : ""}`}
            onClick={() => {
              setMode("view");
              setTempPin(null);
              setTempBox(null);
            }}
          >
            <Eye size={16} /> Chế độ xem
          </button>

          {isEditor && (
            <button
              className={`ws-mode-btn ${mode === "add_pin" ? "active bg-[#FF5C00] text-white" : ""}`}
              onClick={() => {
                setMode("add_pin");
                setTempBox(null);
                setTempPin(null);
                setShowPinModal(false);
              }}
            >
              <MapPin size={16} /> Góp ý biên tập
            </button>
          )}

          {isMangaka && (
            <button
              className={`ws-mode-btn ${mode === "draw_region" ? "active bg-[#FFD000] text-black" : ""}`}
              onClick={() => {
                setMode("draw_region");
                setTempPin(null);
                setShowPinModal(false);
              }}
            >
              <Edit3 size={16} /> Giao nhiệm vụ
            </button>
          )}
        </div>
      </header>

      {/* ── Hướng dẫn chế độ ── */}
      {mode === "add_pin" && (
        <div className="ws-mode-banner" style={{ backgroundColor: "#FF5C00", color: "#fff", padding: "8px 16px", border: "3px solid #000", marginBottom: "8px", fontWeight: 800, fontSize: "0.85rem", textAlign: "center" }}>
          <MapPin size={14} style={{ display: "inline", marginRight: 6 }} />
          Chế độ Góp ý: Click trực tiếp vào <strong>vùng trống trên ảnh</strong> để đặt ghim và nhập góp ý biên tập.
        </div>
      )}

      {/* ── MAIN WORKSPACE ── */}
      <div className="ws-layout">
        {/* ── INTERACTIVE CANVAS ── */}
        <main className="ws-canvas-container shadow-brutal">
          <div
            className={`ws-canvas-wrapper ${mode}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onClick={(e) => {
              // Fallback: nếu click trúng wrapper (không trúng img, region hay pin)
              // thì vẫn xử lý đặt pin ở chế độ add_pin
              if (mode === "add_pin" && e.target === e.currentTarget) {
                const rect = imageRef.current?.getBoundingClientRect();
                if (!rect) return;
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                setTempPin({ x: Math.min(100, Math.max(0, x)), y: Math.min(100, Math.max(0, y)) });
                setPinContent("");
                setPinCategory("drawing");
                setPinDeadline("");
                setShowPinModal(true);
              }
            }}
          >
            <img
              ref={imageRef}
              src={page.current_preview_url}
              alt="Manga Draft Page"
              className="ws-manga-image"
              onClick={handleImageClick}
              draggable={false}
            />

            {/* SAVED REGIONS */}
            {regions.map((reg) => {
              let coords = {};
              try {
                coords = JSON.parse(reg.coordinates);
              } catch (e) {}
              const task = getTaskForRegion(reg._id);
              const isSelected = selectedRegion?._id === reg._id;
              const isCompleted =
                task && ["Approved", "Paid"].includes(task.status);

              // Nếu task đã xong VÀ người dùng đang không bấm chọn nó ở Sidebar -> Ẩn vùng này đi
              if (isCompleted && !isSelected) {
                return null;
              }
              return (
                <div
                  key={reg._id}
                  className={`ws-canvas-region ${isSelected ? "selected" : ""}`}
                  style={{
                    left: `${coords.x}%`,
                    top: `${coords.y}%`,
                    width: `${coords.width}%`,
                    height: `${coords.height}%`,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedRegion(reg);
                    setSelectedAnnotation(null);
                  }}
                >
                  <span className="ws-region-badge">{reg.region_type}</span>
                  {task && (
                    <span className="ws-region-task-badge">
                      {translateTaskStatus(task.status)}
                    </span>
                  )}
                </div>
              );
            })}

            {/* DRAWING TEMP BOX */}
            {tempBox && (
              <div
                className="ws-canvas-region drawing"
                style={{
                  left: `${tempBox.x}%`,
                  top: `${tempBox.y}%`,
                  width: `${tempBox.width}%`,
                  height: `${tempBox.height}%`,
                }}
              />
            )}

            {/* ── SAVED ANNOTATION PINS ── */}
            {annotations.map((ann, idx) => {
              // Schema mới: ann.x, ann.y trực tiếp (đơn vị %)
              const pinX = ann.x ?? 0;
              const pinY = ann.y ?? 0;
              const isResolved = ann.status === "Resolved";
              const isSelected = selectedAnnotation?._id === ann._id;
              if (isResolved && !isSelected) {
                return null;
              }
              return (
                <button
                  key={ann._id}
                  className={`ws-canvas-pin ${isResolved ? "resolved" : ""} ${isSelected ? "selected" : ""}`}
                  style={{ left: `${pinX}%`, top: `${pinY}%` }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedAnnotation(ann);
                    setSelectedRegion(null);
                    setShowPinModal(false);
                    setTempPin(null);
                  }}
                  title={ann.content}
                >
                  {isResolved ? "✓" : idx + 1}
                  {/* Tooltip khi hover */}
                  <span className="ws-pin-tooltip">
                    <span className="ws-pin-tooltip-number">#{idx + 1}</span>
                    <span className="ws-pin-tooltip-content">
                      {ann.content}
                    </span>
                    {ann.category && (
                      <span className="ws-pin-tooltip-category">
                        [{CATEGORY_LABELS[ann.category] || ann.category}]
                      </span>
                    )}
                  </span>
                </button>
              );
            })}

            {/* TEMP PIN (trước khi lưu) */}
            {tempPin && !showPinModal && (
              <div
                className="ws-canvas-pin temp"
                style={{ left: `${tempPin.x}%`, top: `${tempPin.y}%` }}
              >
                <MapPin size={14} />
              </div>
            )}

            {/* TEMP PIN khi modal đang mở */}
            {tempPin && showPinModal && (
              <div
                className="ws-canvas-pin temp-active"
                style={{ left: `${tempPin.x}%`, top: `${tempPin.y}%` }}
              >
                +
              </div>
            )}
          </div>
        </main>

        {/* ── SIDEBAR ── */}
        <aside className="ws-sidebar shadow-brutal bg-white border-4 border-black p-4 flex flex-col gap-4">
          {/* Detail Panel */}
          <div className="ws-sidebar-section">
            <h2 className="ws-section-title">Thông tin chi tiết</h2>

            {/* Case: Selected Annotation Details */}
            {selectedAnnotation && !editingAnnotation && (
              <div className="ws-detail-box border-2 border-black p-3 bg-pink-50">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-black bg-[#FF90E8] border border-black px-2 py-0.5 shadow-[1px_1px_0px_rgba(0,0,0,1)]">
                    Góp ý #
                    {annotations.findIndex(
                      (a) => a._id === selectedAnnotation._id,
                    ) + 1}
                  </span>
                  <button
                    onClick={() => setSelectedAnnotation(null)}
                    className="text-black"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="mb-2 flex items-center gap-2">
                  {getAnnotationStatusBadge(selectedAnnotation.status)}
                  <span className="text-xs text-gray-500 italic">
                    {CATEGORY_LABELS[selectedAnnotation.category] ||
                      selectedAnnotation.category ||
                      "—"}
                  </span>
                </div>

                <p className="text-xs text-gray-600 mb-1">
                  <strong>Biên tập:</strong>{" "}
                  {selectedAnnotation.created_by?.name || "BTV"} (
                  {selectedAnnotation.role || "—"})
                </p>

                {selectedAnnotation.deadline && (
                  <p className="text-xs text-gray-600 mb-2">
                    <strong>Hạn:</strong>{" "}
                    <span
                      className={
                        new Date(selectedAnnotation.deadline) < new Date()
                          ? "text-red-500 font-bold"
                          : ""
                      }
                    >
                      {new Date(selectedAnnotation.deadline).toLocaleDateString(
                        "vi-VN",
                      )}
                    </span>
                  </p>
                )}

                <div className="ws-comment-text border-2 border-black bg-white p-2 text-xs mb-3 font-mono leading-relaxed">
                  {selectedAnnotation.content}
                </div>

                <div className="flex gap-2 flex-wrap">
                  {(isEditor || isMangaka) && (
                    <>
                      <button
                        onClick={() =>
                          handleToggleAnnotationStatus(
                            selectedAnnotation._id,
                            selectedAnnotation.status,
                          )
                        }
                        className={`ws-btn-small flex-1 text-xs border-2 border-black font-bold p-1.5 shadow-[1px_1px_0px_rgba(0,0,0,1)] ${
                          selectedAnnotation.status === "Resolved"
                            ? "bg-yellow-300"
                            : "bg-[#23A094] text-white"
                        }`}
                      >
                        {selectedAnnotation.status === "Resolved"
                          ? "↩ Mở lại"
                          : "✓ Đánh dấu xong"}
                      </button>
                      <RequirePermission required="CAN_EDIT_ANNOTATION">
                        <button
                          onClick={() => handleStartEdit(selectedAnnotation)}
                          className="ws-btn-small text-xs bg-blue-100 text-blue-700 border-2 border-blue-500 p-1.5 font-bold"
                        >
                          <Edit3 size={11} className="inline" /> Sửa
                        </button>
                      </RequirePermission>
                    </>
                  )}
                  {(isEditor ||
                    selectedAnnotation.created_by?._id === user?.id) && (
                    <button
                      onClick={() => handleOpenDeleteModal(selectedAnnotation)}
                      className="ws-btn-small text-xs bg-red-100 text-red-600 border-2 border-red-400 p-1.5 font-bold"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Case: Editing Annotation */}
            {editingAnnotation && (
              <div className="ws-detail-box border-2 border-black p-3 bg-blue-50">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xs font-black uppercase">
                    Chỉnh sửa góp ý
                  </h3>
                  <button
                    onClick={() => setEditingAnnotation(null)}
                    className="text-black"
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="form-group mb-2">
                  <label className="text-xs font-bold">Nội dung</label>
                  <textarea
                    rows={3}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="ws-textarea text-xs w-full mt-1"
                  />
                </div>

                <div className="form-group mb-2">
                  <label className="text-xs font-bold">Trạng thái</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="ws-select text-xs w-full mt-1"
                  >
                    {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
                      <option key={val} value={val}>
                        {cfg.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group mb-3">
                  <label className="text-xs font-bold">Hạn chót</label>
                  <input
                    type="date"
                    value={editDeadline}
                    onChange={(e) => setEditDeadline(e.target.value)}
                    className="ws-input text-xs w-full mt-1"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleSaveEdit(editingAnnotation)}
                    disabled={isSaving}
                    className="ws-side-submit-btn flex-1 text-xs flex items-center justify-center gap-1"
                  >
                    <Send size={11} />{" "}
                    {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                  </button>
                  <button
                    onClick={() => setEditingAnnotation(null)}
                    className="text-xs border-2 border-black px-3 py-1 font-bold bg-gray-100 hover:bg-gray-200"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            )}

            {/* Case: Selected Region */}
            {selectedRegion &&
              (() => {
                const task = getTaskForRegion(selectedRegion._id);
                return (
                  <div className="ws-detail-box border-2 border-black p-3 bg-teal-50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-black bg-[#23A094] text-white border border-black px-2 py-0.5 shadow-[1px_1px_0px_rgba(0,0,0,1)]">
                        Vùng {selectedRegion.region_type}
                      </span>
                      <button
                        onClick={() => setSelectedRegion(null)}
                        className="text-black"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    {task ? (
                      <div className="text-xs">
                        <p className="mb-1">
                          <strong>Task:</strong> {task.task_type}
                        </p>
                        <p className="mb-1">
                          <strong>Người phụ trách:</strong>{" "}
                          {task.assigned_to?.name || "Chưa rõ"}
                        </p>
                        <p className="mb-1">
                          <strong>Chi phí:</strong>{" "}
                          {task.price?.toLocaleString()}đ
                        </p>
                        <p className="mb-2">
                          <strong>Hạn chót:</strong>{" "}
                          {new Date(task.deadline).toLocaleDateString("vi-VN")}
                        </p>
                        <div className="form-group mb-1">
                          <span className="font-bold mr-2">Trạng thái:</span>
                          <span
                            className={`px-2 py-0.5 border text-[10px] font-black rounded ${getTaskStatusColor(task.status)}`}
                          >
                            {translateTaskStatus(task.status)}
                          </span>
                        </div>
                        {task.description && (
                          <div className="bg-white border border-black p-1.5 mt-2 font-mono text-[11px]">
                            <strong>Giao việc:</strong> {task.description}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500">
                        Vùng này chưa được giao nhiệm vụ.
                      </div>
                    )}
                  </div>
                );
              })()}

            {/* Default placeholder */}
            {!selectedAnnotation && !editingAnnotation && !selectedRegion && (
              <div className="text-xs text-gray-500 text-center py-4 bg-gray-50 border border-dashed border-gray-400">
                Nhấp chọn ghim góp ý 📌 hoặc vùng phân công trên bản thảo để xem
                chi tiết.
              </div>
            )}
            <RequirePermission required="CAN_EDIT_ANNOTATION">
              {trashedAnnotations.length > 0 && (
                <div className="mt-4 pt-3 border-t-2 border-dashed border-gray-400">
                  <div className="text-[11px] font-black text-gray-500 mb-2 uppercase">
                    🗑️ Đã xóa gần đây ({trashedAnnotations.length})
                  </div>
                  {trashedAnnotations.map((ann) => (
                    <div
                      key={ann._id}
                      className="ws-list-item border-2 border-gray-300 p-2 mb-1.5 bg-gray-50 flex justify-between items-center"
                    >
                      <div className="overflow-hidden flex-1 pr-2 opacity-60">
                        <span className="font-bold text-[10px] text-gray-500 line-through">
                          {CATEGORY_LABELS[ann.category] || "Góp ý"}
                        </span>
                        <p className="text-[11px] text-gray-500 truncate">
                          {ann.content}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRestoreAnnotation(ann);
                        }}
                        className="ws-btn-small text-[10px] bg-green-100 text-green-700 border-2 border-green-500 px-2 py-1 font-bold whitespace-nowrap"
                      >
                        ↩ Khôi phục
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </RequirePermission>
          </div>

          <hr className="border-t-2 border-black my-1" />

          {/* ANNOTATIONS LIST */}
          <div className="ws-sidebar-section">
            <h2 className="ws-section-title">
              <MessageSquare size={14} className="inline mr-1" />
              Góp ý ({annotations.length})
              {openAnnotations.length > 0 && (
                <span className="ml-2 px-1.5 py-0.5 bg-[#FF5C00] text-white text-[9px] font-black rounded">
                  {openAnnotations.length} chờ
                </span>
              )}
            </h2>

            {annotations.length === 0 ? (
              <div className="text-xs italic text-gray-500 py-2">
                Chưa có góp ý nào trên trang này.
              </div>
            ) : (
              <div className="ws-sidebar-list">
                {annotations.map((ann, idx) => {
                  const isResolved = ann.status === "Resolved";
                  const isSelected = selectedAnnotation?._id === ann._id;
                  const cfg =
                    STATUS_CONFIG[ann.status] || STATUS_CONFIG["Open"];
                  return (
                    <div
                      key={ann._id}
                      className={`ws-list-item border-2 p-2 mb-1.5 transition-all cursor-pointer ${
                        isResolved
                          ? "border-gray-300 opacity-60"
                          : "border-black"
                      } ${isSelected ? "bg-pink-50 shadow-[2px_2px_0px_rgba(0,0,0,1)] -translate-y-0.5" : "bg-white hover:bg-gray-50"}`}
                      onClick={() => {
                        setSelectedAnnotation(ann);
                        setSelectedRegion(null);
                        setEditingAnnotation(null);
                      }}
                    >
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="font-bold text-[11px]">
                          #{idx + 1} {CATEGORY_LABELS[ann.category] || ""}
                        </span>
                        <span
                          className="ann-status-badge text-[9px]"
                          style={{
                            color: cfg.color,
                            backgroundColor: cfg.bg,
                            border: `1px solid ${cfg.color}`,
                          }}
                        >
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-600 truncate">
                        {ann.content}
                      </p>
                      {ann.deadline && (
                        <p
                          className={`text-[10px] mt-0.5 ${new Date(ann.deadline) < new Date() && !isResolved ? "text-red-500 font-bold" : "text-gray-400"}`}
                        >
                          Hạn:{" "}
                          {new Date(ann.deadline).toLocaleDateString("vi-VN")}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <hr className="border-t-2 border-black my-1" />

          {/* TASKS LIST */}
          <div className="ws-sidebar-section">
            <h2 className="ws-section-title">
              Nhiệm vụ trợ lý ({tasks.length})
            </h2>
            {tasks.length === 0 ? (
              <div className="text-xs italic text-gray-500 py-2">
                Chưa giao nhiệm vụ trợ lý nào.
              </div>
            ) : (
              <div className="ws-sidebar-list">
                {tasks.map((task) => (
                  <div
                    key={task._id}
                    className="ws-list-item border-2 border-black bg-white p-2 mb-1.5 cursor-pointer hover:bg-gray-50"
                    onClick={() => {
                      const reg = regions.find(
                        (r) =>
                          String(r._id) ===
                          String(task.region_id?._id || task.region_id),
                      );
                      if (reg) {
                        setSelectedRegion(reg);
                        setSelectedAnnotation(null);
                      } else toast.error("Không tìm thấy tọa độ vùng vẽ.");
                    }}
                  >
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="font-bold text-[11px]">
                        {task.task_type}
                      </span>
                      <span
                        className={`text-[9px] px-1 font-black uppercase border ${getTaskStatusColor(task.status)}`}
                      >
                        {translateTaskStatus(task.status)}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500">
                      Vẽ bởi:{" "}
                      <strong>{task.assigned_to?.name || "Chưa giao"}</strong>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* ══════════════════════════════════════════════════════
          ANNOTATION PIN MODAL - Cửa sổ nhập góp ý
      ══════════════════════════════════════════════════════ */}
      {showPinModal && tempPin && (
        <div className="ws-modal-overlay" onClick={handleClosePinModal}>
          <div
            className="ws-pin-modal border-4 border-black bg-white shadow-brutal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="ws-pin-modal-header bg-[#FF5C00] text-white border-b-4 border-black p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin size={20} />
                <h2 className="font-black text-base uppercase tracking-wide">
                  Thêm góp ý biên tập
                </h2>
              </div>
              <button
                onClick={handleClosePinModal}
                className="text-white border-2 border-white p-1 hover:bg-[#cc4a00] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Tọa độ ghim */}
            <div className="px-5 pt-3 pb-0">
              <p className="text-xs text-gray-500 bg-gray-100 border border-gray-300 px-2 py-1 inline-block font-mono">
                📍 Vị trí: X={tempPin.x.toFixed(1)}% · Y={tempPin.y.toFixed(1)}%
              </p>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSaveAnnotation}
              className="p-5 flex flex-col gap-4"
            >
              {/* Phân loại */}
              <div className="form-group">
                <label
                  htmlFor="pin-category"
                  className="text-xs font-black uppercase block mb-1"
                >
                  Phân loại lỗi
                </label>
                <select
                  id="pin-category"
                  value={pinCategory}
                  onChange={(e) => setPinCategory(e.target.value)}
                  className="ws-select w-full text-sm"
                >
                  {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Nội dung góp ý */}
              <div className="form-group">
                <label
                  htmlFor="pin-content"
                  className="text-xs font-black uppercase block mb-1"
                >
                  Nội dung góp ý <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="pin-content"
                  rows={4}
                  value={pinContent}
                  onChange={(e) => setPinContent(e.target.value)}
                  placeholder="VD: Lời thoại sai chính tả, cần vẽ lại biểu cảm nhân vật..."
                  required
                  autoFocus
                  className="ws-textarea w-full text-sm"
                />
              </div>

              {/* Hạn chót */}
              <div className="form-group">
                <label
                  htmlFor="pin-deadline"
                  className="text-xs font-black uppercase block mb-1"
                >
                  Hạn chót xử lý (tuỳ chọn)
                </label>
                <input
                  id="pin-deadline"
                  type="date"
                  value={pinDeadline}
                  onChange={(e) => setPinDeadline(e.target.value)}
                  className="ws-input w-full text-sm"
                  min={new Date().toISOString().slice(0, 10)}
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2 border-t-2 border-black">
                <button
                  type="submit"
                  disabled={isSaving || !pinContent.trim()}
                  className="ws-pin-submit-btn flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={14} />
                  {isSaving ? "Đang lưu..." : "Lưu góp ý"}
                </button>
                <button
                  type="button"
                  onClick={handleClosePinModal}
                  className="ws-pin-cancel-btn px-5"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          MANGAKA: TASK & REGION MODAL
      ══════════════════════════════════════════════════════ */}
      {showTaskModal && (
        <div className="ws-modal-overlay">
          <div className="ws-modal border-4 border-black p-6 bg-white shadow-brutal">
            <div className="flex justify-between items-center mb-4 border-b-4 border-black pb-2 bg-[#FFD000] -mx-6 -mt-6 p-4">
              <h2 className="font-black text-lg uppercase tracking-wide">
                Giao nhiệm vụ
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowTaskModal(false);
                  setTempBox(null);
                }}
                className="text-black border-2 border-black bg-white p-1 hover:bg-gray-100"
              >
                <X size={16} />
              </button>
            </div>

            <form
              onSubmit={handleCreateTaskAndRegion}
              className="ws-modal-form"
            >
              <div className="ws-form-grid">
                <div className="form-group">
                  <label htmlFor="regionType">Hạng mục vẽ:</label>
                  <select
                    id="regionType"
                    value={regionType}
                    onChange={(e) => setRegionType(e.target.value)}
                    className="ws-select w-full"
                  >
                    <option value="panel">Khung tranh (Panel)</option>
                    <option value="background">Bối cảnh (Background)</option>
                    <option value="sfx">Hiệu ứng (SFX)</option>
                    <option value="shading">Tô bóng / Sắc độ (Shading)</option>
                    <option value="speech_bubble">Thoại (Speech Bubble)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="taskType">Loại công việc giao vẽ:</label>
                  <input
                    id="taskType"
                    type="text"
                    value={taskType}
                    onChange={(e) => setTaskType(e.target.value)}
                    placeholder="VD: Tô xám bóng, Đi nét background..."
                    required
                    className="ws-input w-full"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="taskPrice">Tiền công (VNĐ):</label>
                  <input
                    id="taskPrice"
                    type="number"
                    value={taskPrice}
                    onChange={(e) =>
                      setTaskPrice(
                        e.target.value === "" ? "" : Number(e.target.value),
                      )
                    }
                    min={0}
                    placeholder="0"
                    className="ws-input w-full"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="taskDeadline">Hạn chót nộp sản phẩm:</label>
                  <input
                    id="taskDeadline"
                    type="datetime-local"
                    value={taskDeadline}
                    onChange={(e) => setTaskDeadline(e.target.value)}
                    required
                    className="ws-input w-full"
                  />
                </div>
              </div>
              <div className="form-group mt-3">
                <label htmlFor="taskDesc">Mô tả hướng dẫn chi tiết:</label>
                <textarea
                  id="taskDesc"
                  rows={3}
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  placeholder="Ghi chú layer PSD, phong cách tô vẽ nét..."
                  className="ws-textarea w-full"
                />
              </div>
              <div className="flex gap-4 mt-6 border-t-2 border-black pt-4 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowTaskModal(false);
                    setTempBox(null);
                  }}
                  className="ws-btn bg-gray-200 border-2 border-black font-bold px-4 py-2 hover:bg-gray-300 shadow-[2px_2px_0px_rgba(0,0,0,1)]"
                >
                  Hủy vẽ vùng
                </button>
                <button
                  type="submit"
                  className="ws-btn bg-[#23A094] text-white border-2 border-black font-black px-6 py-2 shadow-[2px_2px_0px_rgba(0,0,0,1)]"
                >
                  Giao việc
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setAnnotationToDelete(null);
        }}
        onConfirm={handleConfirmDeleteAnnotation}
        itemName={
          annotationToDelete
            ? `Góp ý #${annotations.findIndex((a) => a._id === annotationToDelete._id) + 1}: "${annotationToDelete.content}"`
            : ""
        }
      />
    </div>
  );
}
