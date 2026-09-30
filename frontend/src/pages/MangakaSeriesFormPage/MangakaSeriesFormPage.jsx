import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import createSeries from "../../services/series/createSeriesService";
import getSeriesById from "../../services/series/getSeriesByIdService";
import updateSeries from "../../services/series/updateSeriesService";
import getEditors from "../../services/series/getEditorsService";
import upsertProposal from "../../services/series/upsertProposalService";
import submitProposal from "../../services/series/submitProposalService";
import uploadCover from "../../services/series/uploadCoverService";
import Loading from "../../common/Loading/Loading";
import { useToast } from "../../contexts/ToastContext";
import {
  formatDeadlineStatus,
  getProposalReviewDeadline,
} from "../../utils/reviewDeadline";
import "./MangakaSeriesFormPage.css";

const editableStatuses = ["Draft", "Need Revision"];

export default function MangakaSeriesFormPage() {
  const { seriesId } = useParams();
  const isEdit = Boolean(seriesId);
  const navigate = useNavigate();
  const toast = useToast();

  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [proposalStatus, setProposalStatus] = useState("Draft");
  const [proposalInfo, setProposalInfo] = useState(null);
  const [seriesStatus, setSeriesStatus] = useState("Draft");
  const [coverImage, setCoverImage] = useState("");
  // Preview cục bộ để hiển thị ảnh ngay khi chọn file (tránh giật/lag do tải 2 lần).
  const [previewUrl, setPreviewUrl] = useState("");
  const previewUrlRef = useRef("");

  const [editors, setEditors] = useState([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    genre: "",
    target_audience: "",
    editor_id: "",
    summary: "",
    characters: "",
    art_style: "",
  });

  const loadSeries = useCallback(async () => {
    if (!isEdit) return;
    setIsLoading(true);
    const result = await getSeriesById(seriesId);
    if (result.success === false) {
      toast.error(result.message);
      setIsLoading(false);
      return;
    }
    const { series, proposal } = result;
    setSeriesStatus(series.status || "Draft");
    setForm({
      title: series.title || "",
      description: series.description || "",
      genre: series.genre || "",
      target_audience: series.target_audience || "",
      editor_id: series.editor_id || "",
      summary: proposal?.summary || "",
      characters: proposal?.characters || "",
      art_style: proposal?.art_style || "",
    });
    setProposalStatus(proposal?.status || "Draft");
    setProposalInfo(proposal || null);
    setCoverImage(proposal?.cover_image || "");
    setIsLoading(false);
  }, [isEdit, seriesId, toast]);

  useEffect(() => {
    loadSeries();
  }, [loadSeries]);

  useEffect(() => {
    let active = true;
    (async () => {
      const result = await getEditors();
      if (active && result.success !== false) {
        setEditors(result.editors || []);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Giải phóng objectURL khi unmount để tránh rò rỉ bộ nhớ.
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const canEdit =
    !isEdit || editableStatuses.includes(proposalStatus);
  const displayCover = previewUrl || coverImage;
  const reviewDeadline = getProposalReviewDeadline(proposalInfo);
  const deadlineStatus = formatDeadlineStatus(reviewDeadline);

  const handleSave = async (event) => {
    event.preventDefault();
    if (isEdit && !canEdit) {
      toast.error("Không thể sửa khi proposal đang chờ duyệt.");
      return;
    }
    setIsSaving(true);

    if (!isEdit) {
      const result = await createSeries(form);
      if (result.success === false) {
        toast.error(result.message);
        setIsSaving(false);
        return;
      }
      toast.success("Tạo series thành công!");
      navigate(`/mangaka/series/${result.series._id}`);
      setIsSaving(false);
      return;
    }

    // Chế độ sửa: cập nhật thông tin series + lưu bản thảo (proposal).
    const seriesResult = await updateSeries(seriesId, {
      title: form.title,
      description: form.description,
      genre: form.genre,
      target_audience: form.target_audience,
      editor_id: form.editor_id,
    });
    if (seriesResult.success === false) {
      toast.error(seriesResult.message);
      setIsSaving(false);
      return;
    }

    const proposalResult = await upsertProposal(seriesId, {
      summary: form.summary,
      characters: form.characters,
      art_style: form.art_style,
    });
    if (proposalResult.success === false) {
      toast.error(proposalResult.message);
      setIsSaving(false);
      return;
    }
    toast.success("Đã lưu thông tin series và bản thảo!");
    setProposalStatus(proposalResult.proposal?.status || proposalStatus);
    setIsSaving(false);
  };

  const handleUploadCover = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !seriesId) return;

    // Hiển thị preview ngay lập tức từ file cục bộ.
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }
    const localUrl = URL.createObjectURL(file);
    previewUrlRef.current = localUrl;
    setPreviewUrl(localUrl);

    setIsUploading(true);

    // Lưu bản thảo trước để không mất nội dung nhân vật / phong cách đã nhập.
    if (form.summary) {
      const saved = await upsertProposal(seriesId, {
        summary: form.summary,
        characters: form.characters,
        art_style: form.art_style,
      });
      if (saved.success === false) {
        toast.error(saved.message);
        setIsUploading(false);
        return;
      }
      setProposalStatus(saved.proposal?.status || proposalStatus);
    }

    const result = await uploadCover(seriesId, file);
    if (result.success === false) {
      toast.error(result.message);
      setIsUploading(false);
      return;
    }
    setCoverImage(result.cover_image || result.proposal?.cover_image || "");
    setIsUploading(false);
    toast.success("Upload ảnh bìa thành công!");
  };

  const handleSubmit = async () => {
    if (!seriesId) return;
    const result = await submitProposal(seriesId);
    if (result.success === false) {
      toast.error(result.message);
      return;
    }
    setProposalStatus(result.proposal?.status || "Submitted");
    setProposalInfo(result.proposal || null);
    toast.success("Đã nộp thành công!");
  };

  if (isLoading) {
    return <Loading text="Đang tải dữ liệu series..." />;
  }

  const seriesFieldsDisabled = isEdit && !canEdit;

  return (
    <div className="mangaka-form-wrapper">
      <Link to="/mangaka/series" className="back-link">
        Quay lại danh sách
      </Link>

      <h1 className="page-title">
        {isEdit ? "Chi tiết series" : "Tạo series mới"}
      </h1>

      {isEdit && (
        <p className="status-text">
          Trạng thái series: {" "}
          <span className="status-badge">{seriesStatus}</span>
          {" "}| Trạng thái proposal: {" "}
          <span className="status-badge">{proposalStatus}</span>
          {reviewDeadline && (
            <>
              {" "}| Hạn duyệt:{" "}
              <span className={`status-badge deadline-badge ${deadlineStatus?.className || ""}`}>
                {reviewDeadline.toLocaleDateString("vi-VN")}
                {deadlineStatus ? ` (${deadlineStatus.label})` : ""}
              </span>
            </>
          )}
        </p>
      )}

      {isEdit && (
        <div className="series-quick-nav">
          <Link to={`/chapter-list/${seriesId}`} className="btn-nav-chapter">
            Quản lý Chapter
          </Link>
          <Link
            to={`/editor/progress?seriesId=${seriesId}`}
            className="btn-nav-progress"
          >
            Tiến độ Studio
          </Link>
        </div>
      )}

      <form onSubmit={handleSave} className="neo-form">
        <section className="form-section">
          <h2 className="section-title">Thông tin series</h2>

          <div className="form-group">
            <label className="neo-label">Tên series *</label>
            <input
              className="neo-input"
              value={form.title}
              onChange={handleChange("title")}
              required
              disabled={seriesFieldsDisabled}
            />
          </div>

          <div className="form-group">
            <label className="neo-label">Mô tả ngắn</label>
            <textarea
              className="neo-input textarea-short"
              value={form.description}
              onChange={handleChange("description")}
              disabled={seriesFieldsDisabled}
            />
          </div>

          <div className="grid-2-cols">
            <div className="form-group">
              <label className="neo-label">Thể loại</label>
              <input
                className="neo-input"
                value={form.genre}
                onChange={handleChange("genre")}
                disabled={seriesFieldsDisabled}
              />
            </div>
            <div className="form-group">
              <label className="neo-label">Độc giả mục tiêu</label>
              <input
                className="neo-input"
                value={form.target_audience}
                onChange={handleChange("target_audience")}
                disabled={seriesFieldsDisabled}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="neo-label">Tantou Editor phụ trách</label>
            <select
              className="neo-input"
              value={form.editor_id}
              onChange={handleChange("editor_id")}
              disabled={seriesFieldsDisabled}
            >
              <option value="">— Chưa chọn —</option>
              {editors.map((ed) => (
                <option key={ed._id} value={ed._id}>
                  {ed.name} ({ed.email})
                </option>
              ))}
            </select>
          </div>
        </section>

        {isEdit && (
          <section className="form-section proposal-section">
            <h2 className="section-title">Bản thảo (Proposal)</h2>

            <div className="form-group">
              <label className="neo-label">Tóm tắt truyện *</label>
              <textarea
                className="neo-input textarea-tall"
                value={form.summary}
                onChange={handleChange("summary")}
                required
                disabled={!canEdit}
              />
            </div>

            <div className="grid-2-cols">
              <div className="form-group">
                <label className="neo-label">Nhân vật</label>
                <textarea
                  className="neo-input textarea-short"
                  value={form.characters}
                  onChange={handleChange("characters")}
                  disabled={!canEdit}
                />
              </div>
              <div className="form-group">
                <label className="neo-label">Phong cách hình ảnh</label>
                <textarea
                  className="neo-input textarea-short"
                  value={form.art_style}
                  onChange={handleChange("art_style")}
                  disabled={!canEdit}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="neo-label">Ảnh bìa / Concept art</label>
              {canEdit && (
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUploadCover}
                  disabled={isUploading}
                  className="neo-file-input"
                />
              )}
              {isUploading && (
                <span className="upload-hint">Đang tải ảnh lên...</span>
              )}
              {displayCover ? (
                <img
                  src={displayCover}
                  alt="Cover"
                  className="cover-image-preview"
                />
              ) : (
                <span className="upload-hint">Chưa có ảnh bìa.</span>
              )}
            </div>
          </section>
        )}

        <div className="form-actions">
          <button
            type="submit"
            disabled={isSaving || (isEdit && !canEdit)}
            className="btn-primary"
          >
            {isSaving ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Tạo series"}
          </button>

            {isEdit && canEdit && (
              <button type="button" onClick={handleSubmit} className="btn-success">
              Nộp xin duyệt
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
