/**
 * Script migration: Thêm cờ `fl_attachment` vào các URL Cloudinary raw
 * (zip, psd, rar, ...) đã được lưu trước đó trong các bảng:
 *   - Page.attached_resource_url
 *   - Page.current_source_file_url
 *   - PageVersionHistory.attached_resource_url
 *   - PageVersionHistory.source_file_url
 *   - TaskSubmission.file_url
 *
 * Chạy: node backend/scripts/migrateCloudinaryUrls.js
 */

const mongoose = require("mongoose");
const path = require("path");

// Nạp .env từ thư mục backend
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const Page = require("../src/models/PageModel");
const PageVersionHistory = require("../src/models/PageVersionHistoryModel");
const TaskSubmission = require("../src/models/TaskSubmissionModel");
const { buildCloudinaryDownloadUrl } = require("../src/helpers/cloudinaryUrl.helper");

const RAW_EXTENSIONS_RE = /\.(zip|rar|7z|tar|gz|psd|clip|psb|ai|pdf|doc|docx|xls|xlsx|ppt|pptx)$/i;

const extractFilenameFromUrl = (url) => {
  if (!url) return "";
  try {
    const baseUrl = url.split("?")[0];
    const lastSlash = baseUrl.lastIndexOf("/");
    return baseUrl.substring(lastSlash + 1);
  } catch (err) {
    return "";
  }
};

const buildReplacement = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== "string") return null;
  if (!rawUrl.includes("res.cloudinary.com")) return null;
  if (rawUrl.includes("/raw/") || RAW_EXTENSIONS_RE.test(rawUrl.split("?")[0])) {
    const filename = extractFilenameFromUrl(rawUrl);
    return buildCloudinaryDownloadUrl(rawUrl, filename);
  }
  return null;
};

const migratePages = async () => {
  const pages = await Page.find({
    $or: [
      { attached_resource_url: { $exists: true, $ne: null } },
      { current_source_file_url: { $exists: true, $ne: null } },
    ],
  });

  let updatedCount = 0;
  for (const page of pages) {
    let touched = false;

    const newAttached = buildReplacement(page.attached_resource_url);
    if (newAttached && newAttached !== page.attached_resource_url) {
      page.attached_resource_url = newAttached;
      touched = true;
    }

    const newSource = buildReplacement(page.current_source_file_url);
    if (newSource && newSource !== page.current_source_file_url) {
      page.current_source_file_url = newSource;
      touched = true;
    }

    if (touched) {
      await page.save();
      updatedCount += 1;
    }
  }
  console.log(`✓ Page: đã cập nhật ${updatedCount}/${pages.length} bản ghi.`);
};

const migratePageVersionHistories = async () => {
  const histories = await PageVersionHistory.find({
    $or: [
      { attached_resource_url: { $exists: true, $ne: null } },
      { source_file_url: { $exists: true, $ne: null } },
    ],
  });

  let updatedCount = 0;
  for (const history of histories) {
    let touched = false;

    const newAttached = buildReplacement(history.attached_resource_url);
    if (newAttached && newAttached !== history.attached_resource_url) {
      history.attached_resource_url = newAttached;
      touched = true;
    }

    const newSource = buildReplacement(history.source_file_url);
    if (newSource && newSource !== history.source_file_url) {
      history.source_file_url = newSource;
      touched = true;
    }

    if (touched) {
      await history.save();
      updatedCount += 1;
    }
  }
  console.log(`✓ PageVersionHistory: đã cập nhật ${updatedCount}/${histories.length} bản ghi.`);
};

const migrateTaskSubmissions = async () => {
  const submissions = await TaskSubmission.find({
    file_url: { $exists: true, $ne: null },
  });

  let updatedCount = 0;
  for (const submission of submissions) {
    const newUrl = buildReplacement(submission.file_url);
    if (newUrl && newUrl !== submission.file_url) {
      submission.file_url = newUrl;
      await submission.save();
      updatedCount += 1;
    }
  }
  console.log(`✓ TaskSubmission: đã cập nhật ${updatedCount}/${submissions.length} bản ghi.`);
};

const main = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("Không tìm thấy MONGODB_URI trong biến môi trường.");
    }

    await mongoose.connect(mongoUri);
    console.log("✓ Đã kết nối MongoDB.");

    await migratePages();
    await migratePageVersionHistories();
    await migrateTaskSubmissions();

    console.log("🎉 Migration hoàn tất!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi migration:", error);
    process.exit(1);
  }
};

main();