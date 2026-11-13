const dotenv = require("dotenv");
dotenv.config();

if (process.env.NODE_ENV !== "production") {
  const dns = require("dns");
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
}

const app = require("./app");
const connectDB = require("./config/config_mongoDB");
const { connectCloudinary } = require("./config/config_cloudinary");
const {
  autoFinalizeExpiredProposals,
} = require("./services/autoFinalizeExpiredProposals");

const PORT = process.env.PORT || 5000;
const AUTO_FINALIZE_INTERVAL_MS = 60 * 60 * 1000;

const startServer = async () => {
  try {
    await connectDB();
    connectCloudinary();

    const server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

    server.prependListener("request", (req, res) => {
      if (req.url === "/__coverage__/dump") {
        console.log("\n[c8] Đang ghi dữ liệu V8 Coverage và đóng server...");
        v8.takeCoverage();
        res.writeHead(200, { "Content-Type": "application/json", "Connection": "close" });
        res.end(JSON.stringify({ ok: true }), () => {
          setTimeout(() => process.exit(0), 100);
        });
        // Ngăn Express tiếp tục xử lý request này để không bị đụng độ
        req.destroy();
      }
    });

    if (process.env.NODE_ENV !== "test") {
      setInterval(() => {
        autoFinalizeExpiredProposals().catch((error) => {
          console.error("Auto-finalize expired proposals failed:", error.message);
        });
      }, AUTO_FINALIZE_INTERVAL_MS);
    }
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
