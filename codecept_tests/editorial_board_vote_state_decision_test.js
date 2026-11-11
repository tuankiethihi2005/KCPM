import assert from "node:assert/strict";
import {
  castBoardVote,
  createSeries,
  createSeriesDraft,
  createSubmittedSeries,
  finalizeBoardReview,
  openBoardReview,
  sendVoteRequest,
  sendApiRequestWithAuth,
  signInAs,
} from "./series_test_helpers.js";

async function getProposal(I, seriesId) {
  const response = await sendApiRequestWithAuth(
    I,
    `/series/${seriesId}`,
    "GET",
  );
  assert.equal(response.status, 200);
  return response.body.proposal;
}

async function signInAsAdmin(I) {
  const logoutCount = await I.grabNumberOfVisibleElements(
    'button:has-text("Đăng xuất")',
  );
  if (logoutCount > 0) {
    await I.click('button:has-text("Đăng xuất")');
  }

  await I.amOnPage("/login");
  await I.waitForElement("#email", 15);
  await I.fillField("#email", process.env.SEED_AUTH_EMAIL || "admin@example.com");
  await I.fillField(
    "#password",
    process.env.SEED_AUTH_PASSWORD || "password123",
  );
  await I.click('button[type="submit"]');
  await I.waitForFunction(
    () => window.location.pathname !== "/login",
    [],
    15,
  );
}

async function setProposalStatus(I, seriesId, status) {
  if (status === "Draft") return;

  await openBoardReview(I, seriesId);
  const vote = status === "Rejected" ? "Reject" : "Approve";
  if (status === "Need Revision") {
    await castBoardVote(I, "Need Revision");
    await finalizeBoardReview(I, "Need Revision");
    return;
  }

  await castBoardVote(I, vote);
  if (status === "Approved" || status === "Rejected") {
    await finalizeBoardReview(I, vote);
  }
}

Feature("Editorial Board bỏ phiếu — chuyển đổi trạng thái và bảng quyết định");

Scenario(
  "EBV-SD-01 / R1: phiếu hợp lệ đầu tiên chuyển Submitted sang Under Review",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSubmittedSeries(I);
    await openBoardReview(I, seriesId);
    await castBoardVote(I, "Approve");

    assert.equal((await getProposal(I, seriesId)).status, "Under Review");
  },
);

Scenario(
  "EBV-SD-02 / R2: cử tri mới tạo phiếu khi Proposal đã Under Review",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSubmittedSeries(I);
    await openBoardReview(I, seriesId);
    await castBoardVote(I, "Approve");

    await signInAsAdmin(I);
    const response = await sendVoteRequest(I, seriesId, {
      vote: "Need Revision",
      comment: "Second reviewer",
    });

    assert.equal(response.status, 201);
    assert.equal(response.body.vote.vote, "Need Revision");
    assert.equal((await getProposal(I, seriesId)).status, "Under Review");
  },
);

Scenario(
  "EBV-SD-03 / R3: cập nhật phiếu hiện hành không đổi trạng thái Under Review",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSubmittedSeries(I);
    await openBoardReview(I, seriesId);
    await castBoardVote(I, "Reject", "Initial comment");

    const response = await sendVoteRequest(I, seriesId, {
      vote: "Need Revision",
      comment: "Updated comment",
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.vote.vote, "Need Revision");
    assert.equal(response.body.vote.comment, "Updated comment");
    assert.equal((await getProposal(I, seriesId)).status, "Under Review");
  },
);

Scenario(
  "EBV-SD-04 / R4: vote bị thiếu hoặc không hợp lệ bị từ chối, phiếu cũ không đổi",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSubmittedSeries(I);
    await openBoardReview(I, seriesId);
    await castBoardVote(I, "Approve");

    for (const body of [{}, { vote: "Unsupported" }, { vote: 12345 }]) {
      const response = await sendVoteRequest(I, seriesId, body);
      assert.equal(response.status, 400);
    }

    await I.seeNumberOfElements(".vote-item", 1);
    assert.equal((await getProposal(I, seriesId)).status, "Under Review");
  },
);

Scenario(
  "EBV-SD-05 / R5: từ chối bỏ phiếu khi Proposal là Draft hoặc trạng thái không bỏ phiếu được",
  async ({ I }) => {
    for (const status of ["Draft", "Need Revision", "Approved", "Rejected"]) {
      await signInAs(I, "mangaka");
      const { seriesId } =
        status === "Draft"
          ? await createSeriesDraft(I)
          : await createSubmittedSeries(I);
      await setProposalStatus(I, seriesId, status);

      await signInAs(I, "editorial");
      const response = await sendVoteRequest(I, seriesId, {
        vote: "Approve",
      });

      assert.equal(response.status, 400, `Voting should be blocked in ${status}`);
      assert.equal((await getProposal(I, seriesId)).status, status);
    }
  },
);

Scenario(
  "EBV-SD-06 / R6: từ chối khi không có Series hoặc không có Proposal",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSeries(I);
    await signInAs(I, "editorial");

    const noProposal = await sendVoteRequest(I, seriesId, {
      vote: "Approve",
    });
    assert.equal(noProposal.status, 400);
    assert.equal(await getProposal(I, seriesId), null);

    const noSeries = await sendVoteRequest(
      I,
      "000000000000000000000000",
      { vote: "Approve" },
    );
    assert.equal(noSeries.status, 404);
  },
);
