/**
 * Migration: Create Annotation Indexes
 *
 * Script này tạo các database indexes cho collection Annotation
 * nhằm tối ưu hiệu năng truy vấn.
 *
 * Cách chạy:
 *   node backend/scripts/migrations/createAnnotationIndexes.js
 *
 * Yêu cầu:
 *   - Biến môi trường DB_USERNAME, DB_PASSWORD, DB_CLUSTER hoặc
 *     MongoDB đang chạy ở localhost:27017
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });

const mongoose = require("mongoose");

// ── Cấu hình kết nối ──────────────────────────────────────────
const getMongoUri = () => {
  const { DB_USERNAME, DB_PASSWORD, DB_CLUSTER, DB_NAME } = process.env;
  const dbName = DB_NAME || "Project_CNPM";

  if (DB_USERNAME && DB_PASSWORD && DB_CLUSTER) {
    return `mongodb+srv://${DB_USERNAME}:${DB_PASSWORD}@${DB_CLUSTER}/${dbName}?retryWrites=true&w=majority`;
  }
  return `mongodb://127.0.0.1:27017/${dbName}`;
};

// ── Định nghĩa schema Annotation (nhẹ, chỉ dùng cho migration) ─
const annotationSchema = new mongoose.Schema(
  {
    chapter_id: { type: mongoose.Schema.Types.ObjectId, ref: "Chapter" },
    page_id:    { type: mongoose.Schema.Types.ObjectId, ref: "Page" },
    x:          { type: Number },
    y:          { type: Number },
    content:    { type: String },
    status:     { type: String },
    deadline:   { type: Date },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// ── Danh sách indexes cần tạo ─────────────────────────────────
const INDEXES = [
  {
    spec: { chapter_id: 1, createdAt: 1 },
    options: { name: "idx_annotation_chapter_createdAt" },
    description: "Tối ưu query lấy danh sách annotation theo chapter, sắp xếp theo thời gian",
  },
  {
    spec: { page_id: 1, createdAt: 1 },
    options: { name: "idx_annotation_page_createdAt" },
    description: "Tối ưu query lấy danh sách annotation theo page, sắp xếp theo thời gian",
  },
  {
    spec: { created_by: 1 },
    options: { name: "idx_annotation_createdBy" },
    description: "Tối ưu query lấy annotation theo người tạo",
  },
  {
    spec: { status: 1 },
    options: { name: "idx_annotation_status" },
    description: "Tối ưu query lọc annotation theo trạng thái",
  },
];

// ── Hàm chạy migration ────────────────────────────────────────
const runMigration = async () => {
  const uri = getMongoUri();
  console.log("🚀 Bắt đầu migration: Create Annotation Indexes");
  console.log(`📡 Kết nối tới: ${uri.replace(/\/\/.*@/, "//***@")}\n`); // Ẩn credentials

  await mongoose.connect(uri);
  console.log("✅ Kết nối MongoDB thành công!\n");

  // Lấy collection trực tiếp (không cần model đầy đủ)
  const AnnotationModel =
    mongoose.models.Annotation || mongoose.model("Annotation", annotationSchema);
  const collection = AnnotationModel.collection;

  // Lấy danh sách indexes hiện tại
  const existingIndexes = await collection.indexes();
  const existingNames = existingIndexes.map((idx) => idx.name);

  console.log("📋 Indexes hiện tại:");
  existingNames.forEach((name) => console.log(`   - ${name}`));
  console.log();

  // Tạo từng index
  let created = 0;
  let skipped = 0;

  for (const { spec, options, description } of INDEXES) {
    if (existingNames.includes(options.name)) {
      console.log(`⏭️  Bỏ qua (đã tồn tại): ${options.name}`);
      skipped++;
    } else {
      await collection.createIndex(spec, options);
      console.log(`✅ Đã tạo index: ${options.name}`);
      console.log(`   └─ ${description}`);
      created++;
    }
  }

  console.log("\n─────────────────────────────────────────────");
  console.log(`📊 Kết quả: ${created} index mới, ${skipped} bỏ qua`);
  console.log("✅ Migration hoàn tất!");

  await mongoose.disconnect();
  process.exit(0);
};

// ── Xử lý lỗi ────────────────────────────────────────────────
runMigration().catch((err) => {
  console.error("❌ Migration thất bại:", err.message);
  mongoose.disconnect();
  process.exit(1);
});
