const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");

let memoryServer = null;

const connectDB = async () => {
  try {
    const username = process.env.DB_USERNAME;
    const password = process.env.DB_PASSWORD;
    const cluster = process.env.DB_CLUSTER;
    const dbName = process.env.DB_NAME || "Project_CNPM";

    let MONGO_URI;
    if (username && password && cluster) {
      MONGO_URI = `mongodb+srv://${username}:${password}@${cluster}/${dbName}?retryWrites=true&w=majority&appName=Cluster0`;
      const conn = await mongoose.connect(MONGO_URI);
      console.log(`✅ Đang kết nối tới MongoDB Atlas thành công!`);
    } else {
      // Thử kết nối MongoDB Local trước
      MONGO_URI = `mongodb://127.0.0.1:27017/${dbName}`;
      try {
        await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 2000 });
        console.log(`✅ Đang kết nối tới MongoDB Local thành công! URI: ${MONGO_URI}`);
      } catch (localError) {
        console.log("⚠️ Không tìm thấy MongoDB Atlas hoặc Local đang chạy. Đang khởi động MongoDB Memory Server để thay thế...");
        const { MongoMemoryServer } = require("mongodb-memory-server");
        
        // Cấu hình thư mục cache để tránh tải lại
        const mongoBinaryDir = path.resolve(__dirname, "../../.cache/mongodb-binaries");
        fs.mkdirSync(mongoBinaryDir, { recursive: true });
        process.env.MONGOMS_DOWNLOAD_DIR = mongoBinaryDir;
        process.env.MONGOMS_PREFER_GLOBAL_PATH = "false";

        memoryServer = await MongoMemoryServer.create({
          binary: { downloadDir: mongoBinaryDir, version: '7.0.11' },
          instance: { 
            launchTimeout: 60000
          }
        });
        const memoryUri = memoryServer.getUri();
        await mongoose.connect(memoryUri);
        console.log(`✅ Kết nối tới MongoDB Memory Server thành công! URI: ${memoryUri}`);
        
        // Auto-seed
        const { runSeed } = require("./seedHelper");
        await runSeed();
      }
    }
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
