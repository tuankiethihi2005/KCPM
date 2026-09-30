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

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
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
