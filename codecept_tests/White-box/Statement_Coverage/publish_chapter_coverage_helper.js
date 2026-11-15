import assert from "node:assert/strict";

const editorAccount = {
  email: process.env.CODECEPT_EDITOR_EMAIL || "editor@example.com",
  password: process.env.CODECEPT_EDITOR_PASSWORD || "password123",
};
const reservedChapterIds = new Set();

function headers(token) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function loginEditor(I) {
  const response = await I.sendPostRequest("/api/auth/login", editorAccount);
  assert.equal(response.status, 200);
  assert.ok(response.data?.accessToken);
  return response.data.accessToken;
}

async function setPageStatus(I, token, pageId, status) {
  const response = await I.sendPutRequest(
    `/api/pages/approve/${pageId}`,
    { status },
    headers(token),
  );
  assert.equal(response.status, 200);
}

async function setTaskStatus(I, token, taskId, status) {
  const response = await I.sendPatchRequest(
    `/api/tasks/${taskId}/status`,
    { status },
    headers(token),
  );
  assert.equal(response.status, 200);
}

async function setAnnotationStatus(I, token, annotationId, status) {
  const response = await I.sendPatchRequest(
    `/api/annotations/${annotationId}`,
    { status },
    headers(token),
  );
  assert.equal(response.status, 200);
}

export async function prepareEmptyChapter(I) {
  const token = await loginEditor(I);
  const seriesResponse = await I.sendGetRequest(
    "/api/series/editor",
    headers(token),
  );
  assert.equal(seriesResponse.status, 200);
  const seriesList = seriesResponse.data?.series || [];
  assert.ok(
    seriesList.length > 0,
    "Cần ít nhất một series được gán cho editor",
  );

  let firstSeriesId = null;

  for (const entry of seriesList) {
    const series = entry.series || entry;
    const seriesId = String(series.id || series._id);
    if (!firstSeriesId) firstSeriesId = seriesId;

    const chapterResponse = await I.sendGetRequest(
      `/api/chapters/series/${seriesId}`,
      headers(token),
    );
    assert.equal(chapterResponse.status, 200);

    for (const chapter of chapterResponse.data?.chapters || []) {
      const chapterId = String(chapter.id || chapter._id);
      if (chapter.status === "Published" || reservedChapterIds.has(chapterId)) {
        continue;
      }

      const pageResponse = await I.sendGetRequest(
        `/api/pages/chapter/${chapterId}`,
        headers(token),
      );
      assert.equal(pageResponse.status, 200);
      const pages = pageResponse.data?.pages || [];
      if (pages.length === 0) {
        reservedChapterIds.add(chapterId);
        return { chapterId, token };
      }
    }
  }

  // Tạo mới một chapter chưa có trang nếu dữ liệu seed chưa có sẵn
  const createPayload = {
    series_id: firstSeriesId,
    title: `Empty Chapter ${Date.now()}`,
    chapter_number: Math.floor(1000 + Math.random() * 9000),
  };

  let createRes = await I.sendPostRequest(
    "/api/chapters",
    createPayload,
    headers(token),
  );
  if (createRes.status === 404) {
    createRes = await I.sendPostRequest(
      `/api/chapters/series/${firstSeriesId}`,
      createPayload,
      headers(token),
    );
  }
  if (createRes.status === 403) {
    const mangakaLogin = await I.sendPostRequest("/api/auth/login", {
      email: process.env.CODECEPT_MANGAKA_EMAIL || "mangaka@example.com",
      password: process.env.CODECEPT_MANGAKA_PASSWORD || "password123",
    });
    assert.equal(mangakaLogin.status, 200);
    const mangakaHeaders = headers(mangakaLogin.data.accessToken);
    createRes = await I.sendPostRequest(
      "/api/chapters",
      createPayload,
      mangakaHeaders,
    );
    if (createRes.status === 404) {
      createRes = await I.sendPostRequest(
        `/api/chapters/series/${firstSeriesId}`,
        createPayload,
        mangakaHeaders,
      );
    }
  }

  assert.ok(
    [200, 201].includes(createRes.status),
    `Không tạo được chapter rỗng: ${JSON.stringify(createRes.data)}`,
  );
  const createdChapter =
    createRes.data?.chapter || createRes.data?.data || createRes.data;
  const newChapterId = String(createdChapter._id || createdChapter.id);
  reservedChapterIds.add(newChapterId);
  return { chapterId: newChapterId, token };
}

async function findMatchingChapter(
  I,
  token,
  seriesList,
  { allowPublished = false, requireTasks = false } = {},
) {
  for (const entry of seriesList) {
    const series = entry.series || entry;
    const seriesId = String(series.id || series._id);
    const chapterResponse = await I.sendGetRequest(
      `/api/chapters/series/${seriesId}`,
      headers(token),
    );
    assert.equal(chapterResponse.status, 200);

    for (const chapter of chapterResponse.data?.chapters || []) {
      const chapterId = String(chapter.id || chapter._id);
      if (reservedChapterIds.has(chapterId)) {
        continue;
      }
      if (!allowPublished && chapter.status === "Published") {
        continue;
      }

      const pageResponse = await I.sendGetRequest(
        `/api/pages/chapter/${chapterId}`,
        headers(token),
      );
      assert.equal(pageResponse.status, 200);
      const pages = pageResponse.data?.pages || [];
      if (pages.length === 0) continue;

      const tasks = [];
      for (const page of pages) {
        const pageId = String(page._id || page.id);
        if (page.status !== "Approved") {
          await setPageStatus(I, token, pageId, "Approved");
        }
        const taskResponse = await I.sendGetRequest(
          `/api/tasks?page_id=${pageId}`,
          headers(token),
        );
        assert.equal(taskResponse.status, 200);
        tasks.push(...(taskResponse.data?.tasks || []));
      }

      if (requireTasks && tasks.length === 0) {
        continue;
      }

      for (const task of tasks) {
        if (task.status !== "Paid") {
          await setTaskStatus(I, token, String(task._id || task.id), "Paid");
        }
      }

      const annotationResponse = await I.sendGetRequest(
        `/api/annotations/chapter/${chapterId}`,
        headers(token),
      );
      assert.equal(annotationResponse.status, 200);
      const annotations =
        annotationResponse.data?.data ||
        annotationResponse.data?.annotations ||
        [];
      for (const annotation of annotations) {
        if (annotation.status !== "Resolved") {
          await setAnnotationStatus(
            I,
            token,
            String(annotation._id || annotation.id),
            "Resolved",
          );
        }
      }

      return {
        chapterId,
        pages,
        tasks: tasks.map((task) => ({ ...task, status: "Paid" })),
      };
    }
  }

  return null;
}

export async function prepareReadyChapter(
  I,
  { reserve = true, requireTasks = false } = {},
) {
  const token = await loginEditor(I);
  const seriesResponse = await I.sendGetRequest(
    "/api/series/editor",
    headers(token),
  );
  assert.equal(seriesResponse.status, 200);
  const seriesList = seriesResponse.data?.series || [];

  // Lượt 1: tìm chapter chưa Published
  let matched = await findMatchingChapter(I, token, seriesList, {
    allowPublished: false,
    requireTasks,
  });

  // Lượt 2: tái sử dụng chapter có sẵn trang (kể cả đã Published ở lần chạy trước)
  if (!matched) {
    matched = await findMatchingChapter(I, token, seriesList, {
      allowPublished: true,
      requireTasks,
    });
  }

  // Fallback nếu chapter có trang nhưng chưa có task nào
  if (!matched && requireTasks) {
    const fallback = await prepareReadyChapter(I, {
      reserve: false,
      requireTasks: false,
    });
    const pageId = String(fallback.pages[0]._id || fallback.pages[0].id);
    const payloadPart = token.split(".")[1];
    const decoded = payloadPart
      ? JSON.parse(Buffer.from(payloadPart, "base64url").toString("utf8"))
      : {};
    const assigneeId = decoded.id || decoded._id || decoded.userId;

    const createTaskRes = await I.sendPostRequest(
      "/api/tasks",
      {
        page_id: pageId,
        title: `Coverage Task ${Date.now()}`,
        task_type: "Lineart",
        assigned_to: assigneeId,
      },
      headers(token),
    );
    assert.ok(
      [200, 201].includes(createTaskRes.status),
      `Không tạo được task dự phòng: ${JSON.stringify(createTaskRes.data)}`,
    );
    const createdTask =
      createTaskRes.data?.task ||
      createTaskRes.data?.data ||
      createTaskRes.data;
    matched = {
      chapterId: fallback.chapterId,
      pages: fallback.pages,
      tasks: [createdTask],
    };
  }

  if (!matched) {
    throw new Error(
      "No chapter with at least one page is assigned to the editor",
    );
  }

  if (reserve) {
    reservedChapterIds.add(matched.chapterId);
  }

  return {
    ...matched,
    token,
  };
}

export function publishHeaders(token) {
  return headers(token);
}
