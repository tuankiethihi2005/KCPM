import React, { useCallback, useEffect, useState } from "react";
import getAtRiskSeries from "../../services/series/getAtRiskSeriesService";
import updateSeriesStatus from "../../services/series/updateSeriesStatusService";
import getLifecycleVotes from "../../services/series/getLifecycleVotesService";
import castLifecycleVote from "../../services/series/castLifecycleVoteService";
import Loading from "../../common/Loading/Loading";
import { useToast } from "../../contexts/ToastContext";
import "./BoardAtRiskSeriesPage.css"; // Đã import file CSS mới

const STATUS_OPTIONS = [
  "Active",
  "At Risk",
  "Hiatus",
  "Cancelled",
  "Completed",
  "Changed Schedule",
];

const STATUS_TRANSLATIONS = {
  Active: "Hoạt động",
  "At Risk": "Có nguy cơ",
  Hiatus: "Tạm ngưng",
  Cancelled: "Hủy bỏ",
  Completed: "Hoàn thành",
  "Changed Schedule": "Đổi lịch phát hành",
};

const RISK_OPTIONS = ["Safe", "Warning", "Critical"];

const RISK_TRANSLATIONS = {
  Safe: "An toàn",
  Warning: "Cảnh báo",
  Critical: "Nguy cấp",
};

const SCHEDULE_OPTIONS = [
  "weekly",
  "monthly",
  "one-shot",
  "online only",
  "none",
];

const SCHEDULE_TRANSLATIONS = {
  weekly: "Hàng tuần",
  monthly: "Hàng tháng",
  "one-shot": "Một tập (One-shot)",
  "online only": "Chỉ phát hành online",
  none: "Chưa có",
};

const LIFECYCLE_OPTIONS = [
  "Continue",
  "Cancel",
  "Hiatus",
  "Change Schedule",
  "Online Only",
  "Need Improvement Plan",
];

const LIFECYCLE_TRANSLATIONS = {
  Continue: "Tiếp tục phát hành",
  Cancel: "Hủy truyện",
  Hiatus: "Tạm ngưng phát hành",
  "Change Schedule": "Thay đổi lịch phát hành",
  "Online Only": "Chuyển sang chỉ đăng online",
  "Need Improvement Plan": "Yêu cầu kế hoạch cải thiện",
};

export default function BoardAtRiskSeriesPage() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [forms, setForms] = useState({});
  const [expandedId, setExpandedId] = useState(null);
  const [dossiers, setDossiers] = useState({});
  const [voteForms, setVoteForms] = useState({});
  const [votingId, setVotingId] = useState(null);

  const fetchList = useCallback(async () => {
    setIsLoading(true);
    const result = await getAtRiskSeries();
    if (result.success === false) {
      toast.error(result.message);
      setItems([]);
    } else {
      const series = result.series || [];
      setItems(series);
      setForms(
        Object.fromEntries(
          series.map((item) => [
            item._id,
            {
              status: item.status || "At Risk",
              risk_status: item.risk_status || "Warning",
              approved_schedule: item.approved_schedule || "none",
            },
          ]),
        ),
      );
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const updateForm = (seriesId, field, value) => {
    setForms((prev) => ({
      ...prev,
      [seriesId]: { ...prev[seriesId], [field]: value },
    }));
  };

  const handleSave = async (seriesId) => {
    setSavingId(seriesId);
    const payload = forms[seriesId];
    const result = await updateSeriesStatus(seriesId, payload);
    if (result.success === false) {
      toast.error(result.message);
    } else {
      toast.success("Cập nhật trạng thái series thành công.");
      await fetchList();
    }
    setSavingId(null);
  };

  const loadDossier = useCallback(async (seriesId) => {
    setDossiers((prev) => ({
      ...prev,
      [seriesId]: { ...prev[seriesId], loading: true },
    }));
    const result = await getLifecycleVotes(seriesId);
    setDossiers((prev) => ({
      ...prev,
      [seriesId]: {
        loading: false,
        votes: result.success === false ? [] : result.votes || [],
        tally: result.success === false ? {} : result.tally || {},
      },
    }));
  }, []);

  const toggleDossier = (seriesId) => {
    if (expandedId === seriesId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(seriesId);
    if (!dossiers[seriesId]) {
      loadDossier(seriesId);
    }
  };

  const updateVoteForm = (seriesId, field, value) => {
    setVoteForms((prev) => ({
      ...prev,
      [seriesId]: { ...prev[seriesId], [field]: value },
    }));
  };

  const handleLifecycleVote = async (seriesId) => {
    const form = voteForms[seriesId] || {};
    const vote = form.vote || LIFECYCLE_OPTIONS[0];
    setVotingId(seriesId);
    const result = await castLifecycleVote(seriesId, {
      vote,
      comment: form.comment || "",
    });
    if (result.success === false) {
      toast.error(result.message);
    } else {
      toast.success("Đã bỏ phiếu quyết định vòng đời thành công.");
      await loadDossier(seriesId);
    }
    setVotingId(null);
  };

  // Helper cho CSS Class
  const getRiskBadgeClass = (risk) => {
    const r = (risk || "Warning").toLowerCase();
    return `risk-badge risk-${r}`;
  };

  return (
    <div className="board-at-risk-wrapper">
      <header className="page-header">
        <h1 className="page-title">Danh sách series có nguy cơ</h1>
      </header>

      {isLoading && <Loading text="Đang tải danh sách series có nguy cơ..." />}

      {!isLoading && items.length === 0 && (
        <div className="empty-box">Không có series nào đang có nguy cơ</div>
      )}

      {!isLoading &&
        items.map((series) => {
          const dossier = dossiers[series._id];
          const isOpen = expandedId === series._id;

          return (
            <div key={series._id} className="neo-card">
              <div className="card-header">
                <div className="card-info">
                  <h2 className="card-title">{series.title}</h2>
                  <p className="card-meta">
                    Tác giả:{" "}
                    {series.author_id?.name ||
                      series.author_id?.email ||
                      "Chưa rõ"}{" "}
                    · Thể loại: {series.genre || "N/A"}
                  </p>
                </div>
                <span className={getRiskBadgeClass(series.risk_status)}>
                  Mức nguy cơ:{" "}
                  {RISK_TRANSLATIONS[series.risk_status] ||
                    series.risk_status ||
                    "N/A"}
                </span>
              </div>

              <div className="card-actions">
                <select
                  className="neo-select"
                  value={forms[series._id]?.status || "At Risk"}
                  onChange={(e) =>
                    updateForm(series._id, "status", e.target.value)
                  }
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      Trạng thái: {STATUS_TRANSLATIONS[opt] || opt}
                    </option>
                  ))}
                </select>
                <select
                  className="neo-select"
                  value={forms[series._id]?.risk_status || "Warning"}
                  onChange={(e) =>
                    updateForm(series._id, "risk_status", e.target.value)
                  }
                >
                  {RISK_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      Mức độ: {RISK_TRANSLATIONS[opt] || opt}
                    </option>
                  ))}
                </select>
                <select
                  className="neo-select"
                  value={forms[series._id]?.approved_schedule || "none"}
                  onChange={(e) =>
                    updateForm(series._id, "approved_schedule", e.target.value)
                  }
                >
                  {SCHEDULE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      Lịch phát hành: {SCHEDULE_TRANSLATIONS[opt] || opt}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn-primary"
                  disabled={savingId === series._id}
                  onClick={() => handleSave(series._id)}
                >
                  {savingId === series._id
                    ? "Đang lưu..."
                    : "Cập nhật trạng thái"}
                </button>
              </div>

              <div className="dossier-toggle">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => toggleDossier(series._id)}
                >
                  {isOpen
                    ? "Đóng hồ sơ quyết định"
                    : "Hồ sơ quyết định & Bỏ phiếu"}
                </button>
              </div>

              {isOpen && (
                <div className="dossier-content">
                  {dossier?.loading && <Loading text="Đang tải..." />}
                  {!dossier?.loading && (
                    <>
                      <h3 className="dossier-title">
                        Phiếu quyết định vòng đời ({dossier?.votes?.length || 0}
                        )
                      </h3>
                      {(!dossier?.votes || dossier.votes.length === 0) && (
                        <p className="dossier-empty">
                          Chưa có thành viên nào bỏ phiếu quyết định.
                        </p>
                      )}

                      <div className="vote-list">
                        {dossier?.votes?.map((v) => (
                          <div key={v._id} className="vote-item">
                            <span className="vote-highlight">
                              {LIFECYCLE_TRANSLATIONS[v.vote] || v.vote}
                            </span>{" "}
                            -{" "}
                            {v.board_member_id?.name ||
                              "Thành viên ban biên tập"}
                            {v.comment && `: ${v.comment}`}
                          </div>
                        ))}
                      </div>

                      <div className="vote-form">
                        <select
                          className="neo-select"
                          value={
                            voteForms[series._id]?.vote || LIFECYCLE_OPTIONS[0]
                          }
                          onChange={(e) =>
                            updateVoteForm(series._id, "vote", e.target.value)
                          }
                        >
                          {LIFECYCLE_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {LIFECYCLE_TRANSLATIONS[opt] || opt}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          className="neo-input"
                          placeholder="Nhập nhận xét / lý do..."
                          value={voteForms[series._id]?.comment || ""}
                          onChange={(e) =>
                            updateVoteForm(
                              series._id,
                              "comment",
                              e.target.value,
                            )
                          }
                        />
                        <button
                          type="button"
                          className="btn-action"
                          disabled={votingId === series._id}
                          onClick={() => handleLifecycleVote(series._id)}
                        >
                          {votingId === series._id ? "Đang gửi..." : "Bỏ phiếu"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
}
