const taskController = require("../src/controllers/task/taskController");

const createResponse = () => {
  const response = {
    statusCode: null,
    body: null,
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
  return response;
};

const createRequest = (deadline) => ({
  body: {
    page_id: "507f1f77bcf86cd799439011",
    assigned_to: "507f1f77bcf86cd799439012",
    task_type: "Vẽ background",
    deadline,
  },
});

describe("task deadline validation", () => {
  it("rejects a deadline earlier than the assignment time", async () => {
    const response = createResponse();

    await taskController.createTask(
      createRequest(new Date(Date.now() - 60_000).toISOString()),
      response,
    );

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe(
      "Hạn chót phải muộn hơn thời điểm giao việc, bao gồm cả giờ.",
    );
  });

  it("rejects an invalid deadline", async () => {
    const response = createResponse();

    await taskController.createTask(createRequest("not-a-date"), response);

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe(
      "Hạn chót phải muộn hơn thời điểm giao việc, bao gồm cả giờ.",
    );
  });
});
