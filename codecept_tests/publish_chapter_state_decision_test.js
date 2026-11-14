import assert from "node:assert/strict";

Feature("Publish Chapter — chuyển đổi trạng thái và bảng quyết định");

const editorAccount = {
    email: process.env.CODECEPT_EDITOR_EMAIL || "editor@example.com",
    password: process.env.CODECEPT_EDITOR_PASSWORD || "password123",
};
const assistantAccount = {
    email: process.env.CODECEPT_ASSISTANT_EMAIL || "assistant@example.com",
    password: process.env.CODECEPT_ASSISTANT_PASSWORD || "password123",
};

const state = {
    editorToken: null,
    assistantToken: null,
    assistantId: null,
    seriesId: null,
    emptyChapterId: null,
    chapterId: null,
    pageId: null,
};

function headers(token) {
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    };
}

BeforeSuite(async ({ I }) => {
    const edRes = await I.sendPostRequest("/api/auth/login", editorAccount);
    assert.equal(edRes.status, 200);
    state.editorToken = edRes.data.accessToken;

    const asRes = await I.sendPostRequest("/api/auth/login", assistantAccount);
    assert.equal(asRes.status, 200);
    state.assistantToken = asRes.data.accessToken;
    state.assistantId = asRes.data.user.id || asRes.data.user._id;

    const sRes = await I.sendGetRequest(
        "/api/series/editor",
        headers(state.editorToken),
    );
    const seriesList = sRes.data?.series || [];
    for (const item of seriesList) {
        const sDoc = item.series || item;
        const sId = String(sDoc.id || sDoc._id);
        const chRes = await I.sendGetRequest(
            `/api/chapters/series/${sId}`,
            headers(state.editorToken),
        );
        for (const ch of chRes.data?.chapters || []) {
            const chId = String(ch.id || ch._id);
            const pgRes = await I.sendGetRequest(
                `/api/pages/chapter/${chId}`,
                headers(state.editorToken),
            );
            const pages = pgRes.data?.pages || [];
            if (pages.length > 0 && !state.chapterId) {
                state.seriesId = sId;
                state.chapterId = chId;
                state.pageId = String(pages[0]._id || pages[0].id);
            } else if (pages.length === 0 && !state.emptyChapterId) {
                state.emptyChapterId = chId;
            }
        }
    }

    if (!state.emptyChapterId && state.seriesId) {
        const adminRes = await I.sendPostRequest("/api/auth/login", {
            email: "admin@example.com",
            password: "password123",
        });
        const newCh = await I.sendPostRequest(
            "/api/chapters/create",
            {
                series_id: state.seriesId,
                chapter_number: Math.floor(Date.now() / 1000) % 100000,
                title: `Empty SD Chapter ${Date.now()}`,
                deadline: "2027-12-31",
            },
            headers(adminRes.data.accessToken),
        );
        state.emptyChapterId = String(newCh.data?.chapter?._id);
    }
});

Scenario(
    "PC-SD-01 / R2: Chapter không có trang nào (C2 = N) bị từ chối 400, giữ nguyên trạng thái",
    async ({ I }) => {
        const res = await I.sendPostRequest(
            `/api/publish/chapter/${state.emptyChapterId}`,
            {},
            headers(state.editorToken),
        );
        assert.equal(res.status, 400);
    },
);

Scenario(
    "PC-SD-02 / R3: Có trang nhưng còn trang chưa Approved (C3 = N) bị từ chối 400",
    async ({ I }) => {
        await I.sendPutRequest(
            `/api/pages/approve/${state.pageId}`,
            { status: "In Progress" },
            headers(state.editorToken),
        );

        const res = await I.sendPostRequest(
            `/api/publish/chapter/${state.chapterId}`,
            {},
            headers(state.editorToken),
        );
        assert.equal(res.status, 400);
        assert.ok(res.data?.unapprovedPages_count >= 1);
    },
);

Scenario(
    "PC-SD-03 / R4: Mọi trang Approved nhưng còn Task chưa hoàn thành (C4 = N) bị từ chối 400",
    async ({ I }) => {
        const pgRes = await I.sendGetRequest(
            `/api/pages/chapter/${state.chapterId}`,
            headers(state.editorToken),
        );
        for (const p of pgRes.data?.pages || []) {
            await I.sendPutRequest(
                `/api/pages/approve/${p._id || p.id}`,
                { status: "Approved" },
                headers(state.editorToken),
            );
        }

        const tRes = await I.sendGetRequest(
            `/api/tasks?page_id=${state.pageId}`,
            headers(state.editorToken),
        );
        const tasks = tRes.data?.tasks || [];
        if (tasks.length > 0) {
            await I.sendPatchRequest(
                `/api/tasks/${tasks[0]._id}/status`,
                { status: "Assigned" },
                headers(state.editorToken),
            );
        }

        const res = await I.sendPostRequest(
            `/api/publish/chapter/${state.chapterId}`,
            {},
            headers(state.editorToken),
        );
        assert.equal(res.status, 400);
        assert.ok(res.data?.unfinishedTasks_count >= 1);
    },
);

Scenario(
    "PC-SD-04 / R5: Mọi trang và Task đạt nhưng còn Annotation chưa Resolved (C5 = N) bị từ chối 400",
    async ({ I }) => {
        const pgRes = await I.sendGetRequest(
            `/api/pages/chapter/${state.chapterId}`,
            headers(state.editorToken),
        );
        for (const p of pgRes.data?.pages || []) {
            const tRes = await I.sendGetRequest(
                `/api/tasks?page_id=${p._id || p.id}`,
                headers(state.editorToken),
            );
            for (const t of tRes.data?.tasks || []) {
                await I.sendPatchRequest(
                    `/api/tasks/${t._id}/status`,
                    { status: "Approved" },
                    headers(state.editorToken),
                );
            }
        }

        await I.sendPostRequest(
            `/api/annotations/page/${state.pageId}`,
            { x: 10, y: 10, content: "Unresolved R5", status: "Open" },
            headers(state.editorToken),
        );

        const res = await I.sendPostRequest(
            `/api/publish/chapter/${state.chapterId}`,
            {},
            headers(state.editorToken),
        );
        assert.equal(res.status, 400);
        assert.ok(res.data?.unresolvedAnnotations_count >= 1);
    },
);

Scenario(
    "PC-SD-05 / R1: Đủ cả 5 điều kiện (C1..C5 = Y) chuyển Chapter sang Published và lưu published_at",
    async ({ I }) => {
        const annsRes = await I.sendGetRequest(
            `/api/annotations/chapter/${state.chapterId}`,
            headers(state.editorToken),
        );
        for (const ann of annsRes.data?.data || annsRes.data?.annotations || []) {
            if (ann.status !== "Resolved") {
                await I.sendPatchRequest(
                    `/api/annotations/${ann._id}`,
                    { status: "Resolved" },
                    headers(state.editorToken),
                );
            }
        }

        const res = await I.sendPostRequest(
            `/api/publish/chapter/${state.chapterId}`,
            {},
            headers(state.editorToken),
        );
        assert.equal(res.status, 200);
        assert.equal(res.data?.chapter?.status, "Published");
        assert.ok(res.data?.chapter?.published_at);
    },
);

Scenario(
    "PC-SD-06 / R6: Chapter không tồn tại hoặc tài khoản không có quyền (C1 = N) bị từ chối 403/404",
    async ({ I }) => {
        const forbidden = await I.sendPostRequest(
            `/api/publish/chapter/${state.chapterId}`,
            {},
            headers(state.assistantToken),
        );
        assert.equal(forbidden.status, 403);

        const notFound = await I.sendPostRequest(
            "/api/publish/chapter/000000000000000000000000",
            {},
            headers(state.editorToken),
        );
        assert.equal(notFound.status, 404);
    },
);