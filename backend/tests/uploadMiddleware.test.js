const express = require("express");
const multer = require("multer");
const request = require("supertest");
const { createUpload } = require("../src/middlewares/upload.middleware");

const upload = createUpload({
  storage: multer.memoryStorage(),
  maxFileSize: 4,
  allowedFiles: {
    file: {
      extensions: ["txt"],
      label: "TXT",
    },
  },
}).single("file");

const app = express();
app.post("/", upload, (req, res) => res.sendStatus(200));
app.use((error, req, res, next) => {
  const status =
    error instanceof multer.MulterError
      ? error.code === "LIMIT_FILE_SIZE"
        ? 413
        : 400
      : error.status || 500;
  res.status(status).json({ code: error.code });
});

describe("upload middleware validation", () => {
  it("accepts an allowed file within the size limit", async () => {
    const response = await request(app)
      .post("/")
      .attach("file", Buffer.from("123"), {
        filename: "valid.txt",
        contentType: "text/plain",
      });

    expect(response.status).toBe(200);
  });

  it("rejects unsupported file extensions", async () => {
    const response = await request(app)
      .post("/")
      .attach("file", Buffer.from("data"), {
        filename: "invalid.exe",
        contentType: "application/octet-stream",
      });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("INVALID_FILE_TYPE");
  });

  it("rejects files exceeding the configured size limit", async () => {
    const response = await request(app)
      .post("/")
      .attach("file", Buffer.from("12345"), {
        filename: "large.txt",
        contentType: "text/plain",
      });

    expect(response.status).toBe(413);
  });
});
