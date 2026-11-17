import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import getBoardSeriesDetail from "../../services/board/getBoardSeriesDetailService";
import castVote from "../../services/board/castVoteService";
import finalizeSeries from "../../services/board/finalizeSeriesService";
import Loading from "../../common/Loading/Loading";
import { useToast } from "../../contexts/ToastContext";
import { useAuthStore } from "../../stores/authStore";
import {
  formatDeadlineStatus,
  getProposalReviewDeadline,
} from "../../utils/reviewDeadline";
import "./BoardSeriesReviewPage.css"; // Import file CSS mới
import ConfirmActionModal from "../../common/ConfirmActionModal/ConfirmActionModal";

const SCHEDULE_OPTIONS = [
  { value: "weekly", label: "Hàng tuần" },
  { value: "monthly", label: "Hàng tháng" },
  { value: "one-shot", label: "Một tập (One-shot)" },
  { value: "online only", label: "Chỉ phát hành online" },
];

export default function BoardSeriesReviewPage() {
  const { seriesId } = useParams();
  const toast = useToast();
  const currentUser = useAuthStore((s) => s.user);

  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState(null);
  const [comment, setComment] = useState("");
  const [approvedSchedule, setApprovedSchedule] = useState("weekly");
  const [isVoting, setIsVoting] = useState(false);
  const [changingVote, setChangingVote] = useState(false);

  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    actionType: null, // 'vote' | 'finalize'
    voteValue: null,
    title: "",
    message: "",
    confirmText: "Xác nhận",
    variant: "primary",
  });

  const openVoteConfirm = (vote) => {
    const voteConfig = {
      Approve: {
        title: "Xác nhận duyệt (Approve)",
        confirmText: "Bỏ phiếu Approve",
        variant: "success",
      },
      Reject: {
        title: "Xác nhận từ chối (Reject)",
        confirmText: "Bỏ phiếu Reject",
        variant: "danger",
      },
      "Need Revision": {
        title: "Yêu cầu chỉnh sửa",
        confirmText: "Gửi yêu cầu sửa",
        variant: "warning",
      },
    }[vote] || {
      title: "Xác nhận bỏ phiếu",
      confirmText: "Xác nhận",
      variant: "primary",
    };

    setConfirmState({
      isOpen: true,
      actionType: "vote",
      voteValue: vote,
      title: voteConfig.title,
      message: `Xác nhận bỏ phiếu "${vote}" cho series "${series.title}"?`,
      confirmText: voteConfig.confirmText,
      variant: voteConfig.variant,
    });
  };

  const openFinalizeConfirm = () => {
    setConfirmState({
      isOpen: true,
      actionType: "finalize",
      voteValue: null,
      title: "Chốt quyết định (Finalize)",
      message:
        "Tổng hợp kết quả bỏ phiếu và chốt quyết định chính thức cho series. Bạn có chắc chắn muốn tiếp tục?",
      confirmText: "Chốt kết quả",
      variant: "primary",
    });
  };

  const handleConfirmAction = async () => {
    const { actionType, voteValue } = confirmState;
    setIsVoting(true);

    if (actionType === "vote") {
      const result = await castVote(seriesId, { vote: voteValue, comment });
      if (result.success === false) {
        toast.error(result.message);
      } else {
        toast.success(result.message || "Bỏ phiếu thành công!");
        setChangingVote(false);
        await loadDetail();
      }
    } else if (actionType === "finalize") {
      const result = await finalizeSeries(seriesId, {
        approved_schedule: approvedSchedule,
      });
      if (result.success === false) {
        toast.error(result.message);
      } else {
        toast.success(`Kết quả: ${result.decision}`);
        await loadDetail();
      }
    }

    setIsVoting(false);
    setConfirmState((prev) => ({ ...prev, isOpen: false }));
  };

  const loadDetail = useCallback(async () => {
    setIsLoading(true);
    const result = await getBoardSeriesDetail(seriesId);
    if (result.success === false) {
      toast.error(result.message);
      setData(null);
    } else {
      setData(result);
    }
    setIsLoading(false);
  }, [seriesId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  if (isLoading) {
    return <Loading text="Đang tải hồ sơ series..." />;
  }

  if (!data?.series) {
    return <div className="empty-state">Không tìm thấy hồ sơ series.</div>;
  }

  const { series, proposal, votes } = data;
  const canVote = ["Submitted", "Under Review"].includes(proposal?.status);
  const backPath = canVote ? "/board/reviews" : "/board/all-series";
  const backLabel = canVote
    ? "← Quay lại danh sách chờ duyệt"
    : "← Quay lại danh sách series";
  const myVote = votes?.find(
    (v) => String(v.board_member_id?._id) === String(currentUser?.id),
  );
  const showVoteButtons = !myVote || changingVote;
  const reviewDeadline = getProposalReviewDeadline(proposal);
  const deadlineStatus = formatDeadlineStatus(reviewDeadline);

  return (
    <div className="board-review-wrapper">
      <Link to={backPath} className="back-link">
        {backLabel}
      </Link>

      <header className="page-header">
        <h1 className="page-title">{series.title}</h1>
        <div className="header-meta">
          <span className="meta-author">
            Tác giả: {series.author_id?.name || "—"}
          </span>
          <span className="meta-status">
            Proposal: <strong>{proposal?.status}</strong>
          </span>
          {reviewDeadline && (
            <span className={`meta-deadline ${deadlineStatus?.className || ""}`}>
              Hạn duyệt:{" "}
              <strong>
                {reviewDeadline.toLocaleDateString("vi-VN")}
              </strong>
              {deadlineStatus ? ` · ${deadlineStatus.label}` : ""}
            </span>
          )}
        </div>
      </header>

      {canVote && reviewDeadline && (
        <div className={`deadline-banner ${deadlineStatus?.className || ""}`}>
          <strong>Hạn duyệt:</strong>{" "}
          {reviewDeadline.toLocaleDateString("vi-VN")}
          {deadlineStatus ? ` — ${deadlineStatus.label}` : ""}
          <span className="deadline-hint">
            {" "}
            (Hết hạn hệ thống tự chốt kết quả phiếu)
          </span>
        </div>
      )}

      <section className="neo-section">
        <h2 className="section-title">Hồ sơ đề xuất</h2>
        <div className="proposal-info">
          <p>
            <span className="info-label">Tóm tắt:</span>{" "}
            {proposal?.summary || "—"}
          </p>
          <p>
            <span className="info-label">Nhân vật:</span>{" "}
            {proposal?.characters || "—"}
          </p>
          <p>
            <span className="info-label">Phong cách:</span>{" "}
            {proposal?.art_style || "—"}
          </p>
        </div>
        {proposal?.cover_image && (
          <img src={proposal.cover_image} alt="Cover" className="cover-image" />
        )}
      </section>

      {votes?.length > 0 && (
        <section className="votes-section">
          <h3 className="section-title">Phiếu bầu hiện có ({votes.length})</h3>
          <div className="votes-list">
            {votes.map((v) => (
              <div key={v._id} className="vote-item">
                <span className="vote-badge">{v.vote}</span>
                <span className="vote-member">
                  — {v.board_member_id?.name || "Board member"}
                </span>
                {v.comment && (
                  <span className="vote-comment">: {v.comment}</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {canVote && (
        <section className="neo-section">
          <h2 className="section-title">Bỏ phiếu</h2>

          {myVote && !changingVote && (
            <div className="my-vote-box">
              <p className="my-vote-text">
                Bạn đã bỏ phiếu: <strong>{myVote.vote}</strong>
                {myVote.comment ? ` — ${myVote.comment}` : ""}
              </p>
              <button
                type="button"
                className="btn-revise"
                disabled={isVoting}
                onClick={() => {
                  setComment(myVote.comment || "");
                  setChangingVote(true);
                }}
              >
                Đổi phiếu
              </button>
            </div>
          )}

          {showVoteButtons && (
            <>
              <textarea
                className="neo-textarea"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Góp ý (tuỳ chọn)"
              />

              <div className="vote-actions">
                <button
                  type="button"
                  disabled={isVoting}
                  onClick={() => openVoteConfirm("Approve")}
                  className="btn-approve"
                >
                  Approve
                </button>
                <button
                  type="button"
                  disabled={isVoting}
                  onClick={() => openVoteConfirm("Reject")}
                  className="btn-reject"
                >
                  Reject
                </button>
                <button
                  type="button"
                  disabled={isVoting}
                  onClick={() => openVoteConfirm("Need Revision")}
                  className="btn-revise"
                >
                  Need Revision
                </button>
                {changingVote && (
                  <button
                    type="button"
                    disabled={isVoting}
                    onClick={() => setChangingVote(false)}
                    className="btn-cancel-vote"
                  >
                    Huỷ
                  </button>
                )}
              </div>
            </>
          )}

          <div className="finalize-section">
            <label className="finalize-label">
              Lịch xuất bản (khi Approve)
            </label>
            <select
              className="neo-select"
              value={approvedSchedule}
              onChange={(e) => setApprovedSchedule(e.target.value)}
            >
              {SCHEDULE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              disabled={isVoting || votes.length === 0}
              onClick={openFinalizeConfirm}
              className="btn-finalize"
            >
              Tổng hợp kết quả (Finalize)
            </button>

            {votes.length === 0 && (
              <p className="warning-text">Cần bỏ phiếu trước khi finalize.</p>
            )}

            <ConfirmActionModal
              isOpen={confirmState.isOpen}
              title={confirmState.title}
              message={confirmState.message}
              confirmText={confirmState.confirmText}
              variant={confirmState.variant}
              isLoading={isVoting}
              onConfirm={handleConfirmAction}
              onClose={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
            />
          </div>
        </section>
      )}
    </div>
  );
}
