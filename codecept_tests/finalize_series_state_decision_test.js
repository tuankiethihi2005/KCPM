import assert from "node:assert/strict";
import {
    castBoardVote,
    createSeries,
    createSeriesDraft,
    createSubmittedSeries,
    openBoardReview,
    sendApiRequestWithAuth,
    signInAs,
} from "./series_test_helpers.js";

async function getSeriesAndProposal(I, seriesId) {
    const response = await sendApiRequestWithAuth(
        I,
        `/series/${seriesId}`,
        "GET",
    );
    assert.equal(response.status, 200);
    return response.body;
}

Feature("Chốt kết quả Series — chuyển đổi trạng thái và bảng quyết định");

Scenario(
    "FS-SD-01 / R1: Approve cao nhất + lịch hợp lệ chuyển Proposal sang Approved, Series sang Active",
    async ({ I }) => {
        await signInAs(I, "mangaka");
        const { seriesId } = await createSubmittedSeries(I);
        await openBoardReview(I, seriesId);
        await castBoardVote(I, "Approve", "Approve R1");

        const response = await sendApiRequestWithAuth(
            I,
            `/board/series/${seriesId}/finalize`,
            "POST",
            { approved_schedule: "monthly" },
        );

        assert.equal(response.status, 200);
        assert.equal(response.body.decision, "Approve");
        assert.equal(response.body.proposal.status, "Approved");
        assert.equal(response.body.series.status, "Active");
        assert.equal(response.body.series.approved_schedule, "monthly");
    },
);

Scenario(
    "FS-SD-02 / R2: Reject lớn hơn hoặc bằng các lựa chọn khác chuyển Proposal sang Rejected, Series về Draft",
    async ({ I }) => {
        await signInAs(I, "mangaka");
        const { seriesId } = await createSubmittedSeries(I);
        await openBoardReview(I, seriesId);
        await castBoardVote(I, "Reject", "Reject R2");

        const response = await sendApiRequestWithAuth(
            I,
            `/board/series/${seriesId}/finalize`,
            "POST",
        );

        assert.equal(response.status, 200);
        assert.equal(response.body.decision, "Reject");
        assert.equal(response.body.proposal.status, "Rejected");
        assert.equal(response.body.series.status, "Draft");
    },
);

Scenario(
    "FS-SD-03 / R3: Need Revision cao nhất chuyển Proposal sang Need Revision, giữ nguyên trạng thái Series",
    async ({ I }) => {
        await signInAs(I, "mangaka");
        const { seriesId } = await createSubmittedSeries(I);
        await openBoardReview(I, seriesId);
        await castBoardVote(I, "Need Revision", "Need Revision R3");

        const response = await sendApiRequestWithAuth(
            I,
            `/board/series/${seriesId}/finalize`,
            "POST",
        );

        assert.equal(response.status, 200);
        assert.equal(response.body.decision, "Need Revision");
        assert.equal(response.body.proposal.status, "Need Revision");
        assert.equal(response.body.series.status, "Draft");
    },
);

Scenario(
    "FS-SD-04 / R4: từ chối finalize khi chưa có phiếu, Proposal không ở trạng thái chờ duyệt, hoặc thiếu Series/Proposal",
    async ({ I }) => {
        // 1. Series không tồn tại (404)
        await signInAs(I, "editorial");
        await I.wait(0.5);
        const missingSeries = await sendApiRequestWithAuth(
            I,
            "/board/series/000000000000000000000000/finalize",
            "POST",
        );
        assert.equal(missingSeries.status, 404);

        // 2. Series chưa có Proposal (404)
        await signInAs(I, "mangaka");
        const { seriesId: noProposalId } = await createSeries(I);
        await signInAs(I, "editorial");
        await I.wait(0.5);
        const noProposalRes = await sendApiRequestWithAuth(
            I,
            `/board/series/${noProposalId}/finalize`,
            "POST",
        );
        assert.equal(noProposalRes.status, 404);

        // 3. Proposal đang ở Draft (400)
        await signInAs(I, "mangaka");
        const { seriesId: draftId } = await createSeriesDraft(I);
        await signInAs(I, "editorial");
        await I.wait(0.5);
        const draftRes = await sendApiRequestWithAuth(
            I,
            `/board/series/${draftId}/finalize`,
            "POST",
        );
        assert.equal(draftRes.status, 400);

        // 4. Proposal đã Submitted nhưng chưa có phiếu bầu nào (400)
        await signInAs(I, "mangaka");
        const { seriesId: noVoteId } = await createSubmittedSeries(I);
        await signInAs(I, "editorial");
        await I.wait(0.5);
        const noVoteRes = await sendApiRequestWithAuth(
            I,
            `/board/series/${noVoteId}/finalize`,
            "POST",
        );
        assert.equal(noVoteRes.status, 400);
        assert.equal(
            (await getSeriesAndProposal(I, noVoteId)).proposal.status,
            "Submitted",
        );
    },
);

Scenario(
    "FS-SD-05 / R5: Approve thắng nhưng truyền lịch phát hành không hợp lệ thì từ chối finalize (400)",
    async ({ I }) => {
        await signInAs(I, "mangaka");
        const { seriesId } = await createSubmittedSeries(I);
        await openBoardReview(I, seriesId);
        await castBoardVote(I, "Approve", "Approve R5");

        const badScheduleRes = await sendApiRequestWithAuth(
            I,
            `/board/series/${seriesId}/finalize`,
            "POST",
            { approved_schedule: "invalid-schedule" },
        );

        assert.equal(badScheduleRes.status, 400);
        assert.equal(
            (await getSeriesAndProposal(I, seriesId)).proposal.status,
            "Under Review",
        );
    },
);