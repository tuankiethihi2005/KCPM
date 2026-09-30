const REVIEW_DEADLINE_DAYS = 7;
const PENDING_PROPOSAL_STATUSES = ["Submitted", "Under Review"];

export const getProposalReviewDeadline = (proposal) => {
  if (!proposal) return null;

  if (proposal.review_deadline) {
    return new Date(proposal.review_deadline);
  }

  if (
    !proposal.submitted_at ||
    !PENDING_PROPOSAL_STATUSES.includes(proposal.status)
  ) {
    return null;
  }

  const deadline = new Date(proposal.submitted_at);
  deadline.setDate(deadline.getDate() + REVIEW_DEADLINE_DAYS);
  return deadline;
};

export const formatDeadlineStatus = (deadline) => {
  if (!deadline) return null;

  const now = new Date();
  const diffMs = deadline.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffMs <= 0) {
    return {
      label: "Đã hết hạn — hệ thống sẽ tự chốt khi tải trang",
      className: "deadline-overdue",
    };
  }
  if (diffDays === 1) {
    return { label: "Còn 1 ngày", className: "deadline-soon" };
  }
  return {
    label: `Còn ${diffDays} ngày`,
    className: "deadline-active",
  };
};
