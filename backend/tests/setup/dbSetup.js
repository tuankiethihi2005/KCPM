const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const { MongoMemoryReplSet } = require("mongodb-memory-server");

let mongoServer;
const mongoBinaryDir = path.resolve(__dirname, "../../.cache/mongodb-binaries");

const ensureMongoBinaryDir = () => {
  fs.mkdirSync(mongoBinaryDir, { recursive: true });
  process.env.MONGOMS_DOWNLOAD_DIR = mongoBinaryDir;
  process.env.MONGOMS_PREFER_GLOBAL_PATH = "false";
};

const connectDB = async () => {
  ensureMongoBinaryDir();

  mongoServer = await MongoMemoryReplSet.create({
    replSet: { count: 1 },
    binary: { downloadDir: mongoBinaryDir },
  });

  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
};

const closeDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }

  if (mongoServer) {
    await mongoServer.stop();
  }
};

const clearDB = async () => {
  if (mongoose.connection.readyState === 0) {
    return;
  }

  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany();
  }
};

module.exports = { connectDB, closeDB, clearDB };
