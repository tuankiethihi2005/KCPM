import { useState, useEffect } from "react";
import { CalendarPlus, ChevronDown } from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";
import { getAllSeries } from "../../../services/series/getSeriesByRoleService";
import createReleaseIssue from "../../../services/issue/createReleaseIssueService";
import "./CreateIssuePanel.css";

const ISSUE_TYPES = ["Weekly", "Monthly", "One-shot", "Online only"];

export default function CreateIssuePanel() {
  const toast = useToast();
  const [seriesOptions, setSeriesOptions] = useState([]);
  const [isFetching, setIsFetching] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [form, setForm] = useState({
    id: "",
    name: "",
    releaseDate: "",
    type: "Weekly",
    seriesList: [],
  });

  useEffect(() => {
    const fetchSeriesData = async () => {
      setIsFetching(true);
      const result = await getAllSeries();
      if (result.success === true) {
        const dataList = result.series || (Array.isArray(result) ? result : []);
        const formatted = dataList.map((s) => ({
          id: s.series._id,
          name: s.series.title || "Chưa có tên",
        }));
        setSeriesOptions(formatted);
        // Mặc định không chọn truyện nào, người dùng tự chọn
        setForm((curr) => ({ ...curr, seriesList: [] }));
      }
      setIsFetching(false);
    };
    fetchSeriesData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.seriesList.length) {
      toast.error("Cần chọn ít nhất một series.");
      return;
    }
    setIsCreating(true);
    const result = await createReleaseIssue(form);
    if (result.success === false) {
      toast.error("Lỗi: " + result.message);
    } else {
      toast.success("Đã tạo kỳ phát hành mới thành công.");
      setForm({
        id: "",
        name: "",
        releaseDate: "",
        type: "Weekly",
        seriesList: [],
      });
      setIsDropdownOpen(false);
    }
    setIsCreating(false);
  };

  const toggleSeries = (id) => {
    setForm((curr) => ({
      ...curr,
      seriesList: curr.seriesList.includes(id)
        ? curr.seriesList.filter((item) => item !== id)
        : [...curr.seriesList, id],
    }));
  };

  const isAllSelected = seriesOptions.length > 0 && form.seriesList.length === seriesOptions.length;

  const toggleSelectAll = () => {
    setForm((curr) => ({
      ...curr,
      seriesList: isAllSelected ? [] : seriesOptions.map((s) => s.id),
    }));
  };

  // Hàm render giao diện các Thẻ (Tag) truyện đã chọn
  const renderSelectedPreview = () => {
    if (form.seriesList.length === 0) {
      return (
        <span className="cip-tag-empty">Chưa chọn truyện nào...</span>
      );
    }

    const selectedNames = seriesOptions
      .filter((s) => form.seriesList.includes(s.id))
      .map((s) => s.name);

    const DISPLAY_LIMIT = 2; // Số lượng hiển thị tối đa
    const displayed = selectedNames.slice(0, DISPLAY_LIMIT);
    const hiddenCount = selectedNames.length - DISPLAY_LIMIT;

    return (
      <div className="cip-tags-wrap">
        {displayed.map((name, idx) => (
          <span key={idx} className="cip-tag" title={name}>
            {name}
          </span>
        ))}
        {hiddenCount > 0 && (
          <span className="cip-tag-more">+{hiddenCount} truyện khác</span>
        )}
      </div>
    );
  };

  return (
    <section className="cip-panel">
      <div className="cip-title">
        <CalendarPlus size={24} />
        <h2>Tạo kỳ phát hành mới</h2>
      </div>

      <form className="cip-form" onSubmit={handleSubmit}>
        <div className="cip-form-group">
          <label className="cip-label">Mã kỳ phát hành</label>
          <input
            className="cip-input"
            value={form.id}
            onChange={(e) => setForm({ ...form, id: e.target.value })}
            placeholder="VD: MGS-YYMM-XXX"
            required
          />
        </div>

        <div className="cip-form-group">
          <label className="cip-label">Tên kỳ phát hành</label>
          <input
            className="cip-input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="VD: Weekly Jump 01"
            required
          />
        </div>

        <div className="cip-grid-2">
          <div className="cip-form-group">
            <label className="cip-label">Ngày phát hành</label>
            <input
              className="cip-input"
              type="date"
              value={form.releaseDate}
              onChange={(e) =>
                setForm({ ...form, releaseDate: e.target.value })
              }
              required
            />
          </div>
          <div className="cip-form-group">
            <label className="cip-label">Loại</label>
            <select
              className="cip-select"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              {ISSUE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* CUSTOM MULTI-SELECT DROPDOWN */}
        <div className="cip-form-group cip-multiselect-wrap">
          <div className="cip-label-row">
            <label className="cip-label--manga">Danh sách Truyện (Manga)</label>
            <span className="cip-label-count">{form.seriesList.length} đã chọn</span>
          </div>

          <div
            className="cip-multiselect-trigger"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            {renderSelectedPreview()}
            <ChevronDown
              size={20}
              className={`cip-chevron ${isDropdownOpen ? "cip-chevron--open" : ""}`}
            />
          </div>

          {isDropdownOpen && (
            <>
              {/* Overlay vô hình để đóng menu khi click ra ngoài */}
              <div
                className="cip-dropdown-overlay"
                onClick={() => setIsDropdownOpen(false)}
              />
              <div className="cip-dropdown-menu">
                <div className="cip-dropdown-inner">
                  {seriesOptions.length > 0 && (
                    <button
                      type="button"
                      className="cip-select-all-btn"
                      onClick={toggleSelectAll}
                    >
                      {isAllSelected ? "✕  Bỏ chọn tất cả" : "✓  Chọn tất cả"}
                    </button>
                  )}
                  {seriesOptions.length === 0 && (
                    <div className="cip-dropdown-empty">
                      Không có dữ liệu truyện
                    </div>
                  )}
                  {seriesOptions.map((s) => (
                    <label key={s.id} className="cip-checkbox-row">
                      <input
                        type="checkbox"
                        checked={form.seriesList.includes(s.id)}
                        onChange={() => toggleSeries(s.id)}
                      />
                      <span>{s.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <button
          className="cip-btn-submit"
          type="submit"
          disabled={isCreating || isFetching}
        >
          <CalendarPlus size={20} />{" "}
          {isCreating ? "Đang tạo..." : "Tạo kỳ phát hành"}
        </button>
      </form>
    </section>
  );
}
