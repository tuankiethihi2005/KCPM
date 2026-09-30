const request = require("supertest");
const express = require("express");
const { connectDB, closeDB, clearDB } = require("./setup/dbSetup");
const { createAuthenticatedUser, withAuth } = require("./setup/authHelper");
const seriesRoutes = require("../src/routes/series.routes");
const boardRoutes = require("../src/routes/board.routes");
const Series = require("../src/models/SeriesModel");
const SeriesProposal = require("../src/models/SeriesProposalModel");
const BoardVote = require("../src/models/BoardVoteModel");
const { REVIEW_DEADLINE_DAYS } = require("../src/constants/boardReview");
const {
  autoFinalizeExpiredProposals,
} = require("../src/services/autoFinalizeExpiredProposals");

const app = express();
app.use(express.json());
app.use("/api/series", seriesRoutes);
app.use("/api/board", boardRoutes);
app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }
  return res.status(error.status || 500).json({
    error: {
      code: error.code || "INTERNAL_SERVER_ERROR",
      message: error.message || "Unexpected error",
    },
  });
});

beforeAll(async () => await connectDB());
afterEach(async () => await clearDB());
afterAll(async () => await closeDB());

describe("Board review flow Phase 2", () => {
  let mangakaToken;
  let mangakaUser;
  let boardToken;

  beforeEach(async () => {
    ({ accessToken: mangakaToken, user: mangakaUser } =
      await createAuthenticatedUser({ role: "Mangaka" }));
    ({ accessToken: boardToken } = await createAuthenticatedUser({
      role: "Editorial Board",
      email: `board-${Date.now()}@example.com`,
    }));
  });

  const createSubmittedSeries = async () => {
    const createRes = await withAuth(
      request(app).post("/api/series"),
      mangakaToken,
    ).send({
      title: "Demon Slayer",
      summary: "A boy fights demons",
      characters: "Tanjiro",
      art_style: "Shonen",
    });

    const seriesId = createRes.body.series._id;

    await withAuth(
      request(app).post(`/api/series/${seriesId}/proposal/submit`),
      mangakaToken,
    );

    return seriesId;
  };

  it("submits a proposal for board review", async () => {
    const seriesId = await createSubmittedSeries();
    const proposal = await SeriesProposal.findOne({ series_id: seriesId });

    expect(proposal.status).toBe("Submitted");
    expect(proposal.submitted_at).toBeTruthy();
    expect(proposal.review_deadline).toBeTruthy();

    const expectedDeadline = new Date(proposal.submitted_at);
    expectedDeadline.setDate(expectedDeadline.getDate() + REVIEW_DEADLINE_DAYS);
    expect(proposal.review_deadline.getTime()).toBe(expectedDeadline.getTime());
  });

  it("backfills review_deadline for legacy pending proposals", async () => {
    const seriesId = await createSubmittedSeries();
    await SeriesProposal.updateOne(
      { series_id: seriesId },
      { $unset: { review_deadline: "" } },
    );

    const response = await withAuth(
      request(app).get("/api/board/series/pending"),
      boardToken,
    );

    expect(response.status).toBe(200);
    expect(response.body.pending[0].proposal.review_deadline).toBeTruthy();
  });

  it("clears old votes when resubmitting after need revision", async () => {
    const seriesId = await createSubmittedSeries();

    await withAuth(
      request(app).post(`/api/board/series/${seriesId}/vote`),
      boardToken,
    ).send({ vote: "Approve" });

    expect(
      await BoardVote.countDocuments({
        series_id: seriesId,
        vote_context: "initial_review",
      }),
    ).toBe(1);

    const proposal = await SeriesProposal.findOne({ series_id: seriesId });
    proposal.status = "Need Revision";
    await proposal.save();

    const resubmitRes = await withAuth(
      request(app).post(`/api/series/${seriesId}/proposal/submit`),
      mangakaToken,
    );
    expect(resubmitRes.status).toBe(200);

    expect(
      await BoardVote.countDocuments({
        series_id: seriesId,
        vote_context: "initial_review",
      }),
    ).toBe(0);
  });

  it("auto-finalizes expired proposals with votes", async () => {
    const seriesId = await createSubmittedSeries();

    await withAuth(
      request(app).post(`/api/board/series/${seriesId}/vote`),
      boardToken,
    ).send({ vote: "Approve" });

    await SeriesProposal.updateOne(
      { series_id: seriesId },
      { review_deadline: new Date(Date.now() - 60_000) },
    );

    const results = await autoFinalizeExpiredProposals();
    expect(results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          series_id: expect.anything(),
          action: "finalized",
          decision: "Approve",
        }),
      ]),
    );

    const series = await Series.findById(seriesId);
    const proposal = await SeriesProposal.findOne({ series_id: seriesId });
    expect(series.status).toBe("Active");
    expect(proposal.status).toBe("Approved");
    expect(series.approved_schedule).toBe("weekly");
  });

  it("marks need revision when expired with no votes", async () => {
    const seriesId = await createSubmittedSeries();

    await SeriesProposal.updateOne(
      { series_id: seriesId },
      { review_deadline: new Date(Date.now() - 60_000) },
    );

    const results = await autoFinalizeExpiredProposals();
    expect(results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: "need_revision_no_votes",
        }),
      ]),
    );

    const proposal = await SeriesProposal.findOne({ series_id: seriesId });
    expect(proposal.status).toBe("Need Revision");
  });

  it("does not auto-finalize before review deadline", async () => {
    const seriesId = await createSubmittedSeries();

    await withAuth(
      request(app).post(`/api/board/series/${seriesId}/vote`),
      boardToken,
    ).send({ vote: "Approve" });

    const results = await autoFinalizeExpiredProposals();
    expect(results).toHaveLength(0);

    const proposal = await SeriesProposal.findOne({ series_id: seriesId });
    expect(proposal.status).toBe("Under Review");
  });

  it("rejects finalize when proposal already processed", async () => {
    const seriesId = await createSubmittedSeries();

    await withAuth(
      request(app).post(`/api/board/series/${seriesId}/vote`),
      boardToken,
    ).send({ vote: "Approve" });

    const firstFinalize = await withAuth(
      request(app).post(`/api/board/series/${seriesId}/finalize`),
      boardToken,
    ).send({ approved_schedule: "weekly" });
    expect(firstFinalize.status).toBe(200);

    const secondFinalize = await withAuth(
      request(app).post(`/api/board/series/${seriesId}/finalize`),
      boardToken,
    ).send({ approved_schedule: "weekly" });
    expect(secondFinalize.status).toBe(400);
  });

  it("lists pending series for editorial board", async () => {
    await createSubmittedSeries();

    const response = await withAuth(
      request(app).get("/api/board/series/pending"),
      boardToken,
    );

    expect(response.status).toBe(200);
    expect(response.body.count).toBe(1);
    expect(response.body.pending[0].proposal.status).toBe("Submitted");
  });

  it("approves a series and activates it after finalize", async () => {
    const seriesId = await createSubmittedSeries();

    const voteRes = await withAuth(
      request(app).post(`/api/board/series/${seriesId}/vote`),
      boardToken,
    ).send({ vote: "Approve", comment: "Strong concept" });

    expect(voteRes.status).toBe(201);

    const finalizeRes = await withAuth(
      request(app).post(`/api/board/series/${seriesId}/finalize`),
      boardToken,
    ).send({ approved_schedule: "weekly" });

    expect(finalizeRes.status).toBe(200);
    expect(finalizeRes.body.decision).toBe("Approve");
    expect(finalizeRes.body.series.status).toBe("Active");
    expect(finalizeRes.body.proposal.status).toBe("Approved");

    const series = await Series.findById(seriesId);
    expect(series.status).toBe("Active");
    expect(series.approved_schedule).toBe("weekly");
  });

  it("finalizes by majority vote across board members", async () => {
    const seriesId = await createSubmittedSeries();

    const { accessToken: board2 } = await createAuthenticatedUser({
      role: "Editorial Board",
      email: `board2-${Date.now()}@example.com`,
    });
    const { accessToken: board3 } = await createAuthenticatedUser({
      role: "Editorial Board",
      email: `board3-${Date.now()}@example.com`,
    });

    await withAuth(
      request(app).post(`/api/board/series/${seriesId}/vote`),
      boardToken,
    ).send({ vote: "Approve" });
    await withAuth(
      request(app).post(`/api/board/series/${seriesId}/vote`),
      board2,
    ).send({ vote: "Approve" });
    await withAuth(
      request(app).post(`/api/board/series/${seriesId}/vote`),
      board3,
    ).send({ vote: "Reject" });

    const finalizeRes = await withAuth(
      request(app).post(`/api/board/series/${seriesId}/finalize`),
      boardToken,
    ).send({ approved_schedule: "weekly" });

    expect(finalizeRes.status).toBe(200);
    expect(finalizeRes.body.decision).toBe("Approve");
    expect(finalizeRes.body.tally).toEqual({
      Approve: 2,
      Reject: 1,
      "Need Revision": 0,
    });
  });

  it("rejects a series on finalize", async () => {
    const seriesId = await createSubmittedSeries();

    await withAuth(
      request(app).post(`/api/board/series/${seriesId}/vote`),
      boardToken,
    ).send({ vote: "Reject", comment: "Not suitable" });

    const finalizeRes = await withAuth(
      request(app).post(`/api/board/series/${seriesId}/finalize`),
      boardToken,
    ).send({});

    expect(finalizeRes.status).toBe(200);
    expect(finalizeRes.body.proposal.status).toBe("Rejected");
    expect(finalizeRes.body.series.status).toBe("Draft");
  });

  it("denies mangaka access to board pending list", async () => {
    const response = await withAuth(
      request(app).get("/api/board/series/pending"),
      mangakaToken,
    );

    expect(response.status).toBe(403);
  });
});
