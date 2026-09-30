const {
  addReviewDeadline,
  PENDING_PROPOSAL_STATUSES,
} = require("../constants/boardReview");

exports.ensureReviewDeadline = async (proposal) => {
  if (!proposal || proposal.review_deadline) {
    return proposal;
  }

  if (
    !proposal.submitted_at ||
    !PENDING_PROPOSAL_STATUSES.includes(proposal.status)
  ) {
    return proposal;
  }

  proposal.review_deadline = addReviewDeadline(new Date(proposal.submitted_at));
  await proposal.save();
  return proposal;
};
