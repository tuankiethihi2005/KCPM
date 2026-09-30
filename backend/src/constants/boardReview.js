const REVIEW_DEADLINE_DAYS = Number(process.env.BOARD_REVIEW_DEADLINE_DAYS) || 7;

const DEFAULT_APPROVED_SCHEDULE = "weekly";

const PENDING_PROPOSAL_STATUSES = ["Submitted", "Under Review"];

const SCHEDULE_VALUES = ["weekly", "monthly", "one-shot", "online only"];

const addReviewDeadline = (fromDate = new Date()) => {
  const deadline = new Date(fromDate);
  deadline.setDate(deadline.getDate() + REVIEW_DEADLINE_DAYS);
  return deadline;
};

module.exports = {
  REVIEW_DEADLINE_DAYS,
  DEFAULT_APPROVED_SCHEDULE,
  PENDING_PROPOSAL_STATUSES,
  SCHEDULE_VALUES,
  addReviewDeadline,
};
