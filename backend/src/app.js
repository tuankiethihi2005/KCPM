const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const chapterRoutes = require("./routes/chapter.routes");
const pageRoutes = require("./routes/page.routes");
const publishRoutes = require("./routes/publish.routes");
const seriesRoutes = require("./routes/series.routes");
const boardRoutes = require("./routes/board.routes");
const issueRoutes = require("./routes/IssueRoutes");
const rankingRoutes = require("./routes/RankingRoutes");
const taskRoutes = require("./routes/task.routes");
const incomeRoutes = require("./routes/income.routes");
const annotationRoutes = require("./routes/annotation.routes");
const regionRoutes = require("./routes/region.routes");
const notificationRoutes = require("./routes/notificationRoutes");
const adminDashboardRoutes = require("./routes/adminDashboardRoutes");

const app = express();
const allowedOrigins = [
  process.env.FRONTEND_ORIGIN,
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:5175",
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Welcome to the Manga Management API" });
});

app.use("/api/auth", authRoutes);
app.use("/api/chapters", chapterRoutes);
app.use("/api/pages", pageRoutes);
app.use("/api/publish", publishRoutes);
app.use("/api/series", seriesRoutes);
app.use("/api/board", boardRoutes);
app.use("/api/issues", issueRoutes);
app.use("/api/rankings", rankingRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/income", incomeRoutes);
app.use("/api/annotations", annotationRoutes);
app.use("/api/regions", regionRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminDashboardRoutes);

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  return res.status(error.status || 500).json({
    error: {
      code: error.code || "INTERNAL_SERVER_ERROR",
      message: error.message || "An unexpected error occurred.",
    },
  });
});

module.exports = app;
