const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const connectDB = require("../src/config/config_mongoDB");
const User = require("../src/models/UserModel");
const Series = require("../src/models/SeriesModel");
const Chapter = require("../src/models/ChapterModel");
const Page = require("../src/models/PageModel");
const PageRegion = require("../src/models/PageRegionModel");
const Task = require("../src/models/TaskModel");
const TaskSubmission = require("../src/models/TaskSubmissionModel");
const AssistantIncome = require("../src/models/AssistantIncomeModel");
const { hashPassword } = require("../src/modules/auth/utils/password");

const seedTasksDemo = async () => {
  try {
    console.log("Connecting to database...");
    await connectDB();

    console.log("Cleaning old seed data (Tasks, Submissions, Income, regions)...");
    await Task.deleteMany({});
    await TaskSubmission.deleteMany({});
    await AssistantIncome.deleteMany({});
    await PageRegion.deleteMany({});

    // Hash password
    const hashedPass = await hashPassword("password123");

    // 1. Seed Users
    console.log("Seeding users...");
    const mangaka = await User.findOneAndUpdate(
      { email: "mangaka@example.com" },
      {
        name: "Nguyễn Mangaka",
        email: "mangaka@example.com",
        password: hashedPass,
        role: "Mangaka",
        status: "Active"
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const assistant = await User.findOneAndUpdate(
      { email: "assistant@example.com" },
      {
        name: "Lê Trợ Lý",
        email: "assistant@example.com",
        password: hashedPass,
        role: "Assistant",
        status: "Active"
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log(`- Seeded Mangaka: ${mangaka.email}`);
    console.log(`- Seeded Assistant: ${assistant.email}`);

    // 2. Seed Series, Chapter, Page
    console.log("Seeding series hierarchy...");
    const series = await Series.findOneAndUpdate(
      { title: "Kiếm Sĩ Huyền Thoại" },
      {
        title: "Kiếm Sĩ Huyền Thoại",
        description: "Hành trình của kiếm sĩ cuối cùng bảo vệ thế giới.",
        genre: "Action",
        target_audience: "Teen",
        author_id: mangaka._id,
        status: "Active"
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const chapter = await Chapter.findOneAndUpdate(
      { series_id: series._id, chapter_number: 1 },
      {
        series_id: series._id,
        chapter_number: 1,
        title: "Chương 1: Lời Nguyền Trỗi Dậy",
        deadline: new Date("2026-12-31"),
        status: "In Production"
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const page1 = await Page.findOneAndUpdate(
      { chapter_id: chapter._id, page_number: 1 },
      {
        chapter_id: chapter._id,
        page_number: 1,
        current_preview_url: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80",
        current_source_file_url: "https://manga-resources.s3.amazonaws.com/raw/chapter1_page1.psd",
        attached_resource_url: "https://manga-resources.s3.amazonaws.com/assets/chapter1_page1_assets.zip",
        current_version: 1,
        status: "In Progress"
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const page2 = await Page.findOneAndUpdate(
      { chapter_id: chapter._id, page_number: 2 },
      {
        chapter_id: chapter._id,
        page_number: 2,
        current_preview_url: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80",
        current_source_file_url: "https://manga-resources.s3.amazonaws.com/raw/chapter1_page2.psd",
        attached_resource_url: null,
        current_version: 1,
        status: "In Progress"
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log(`- Seeded Page 1: ${page1._id}`);
    console.log(`- Seeded Page 2: ${page2._id}`);

    // 3. Seed Page Regions
    console.log("Seeding page regions...");
    const region1 = new PageRegion({
      page_id: page1._id,
      coordinates: JSON.stringify({ x: 50, y: 120, width: 250, height: 180 }),
      region_type: "panel",
      created_by: mangaka._id
    });
    await region1.save();

    const region2 = new PageRegion({
      page_id: page1._id,
      coordinates: JSON.stringify({ x: 320, y: 400, width: 180, height: 150 }),
      region_type: "speech_bubble",
      created_by: mangaka._id
    });
    await region2.save();

    console.log(`- Seeded Region 1 (Panel): ${region1._id}`);
    console.log(`- Seeded Region 2 (Speech Bubble): ${region2._id}`);

    // 4. Seed Tasks
    console.log("Seeding tasks...");

    // Task 1: Assigned to assistant
    const task1 = new Task({
      page_id: page1._id,
      region_id: region1._id,
      assigned_to: assistant._id,
      assigned_by: mangaka._id,
      task_type: "Vẽ background",
      description: "Thêm cảnh lâu đài cổ kính phía sau nhân vật chính. Sử dụng nét mảnh.",
      deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days later
      status: "Assigned",
      price: 250000
    });
    await task1.save();

    // Task 2: Submitted (needs review)
    const task2 = new Task({
      page_id: page1._id,
      region_id: region2._id,
      assigned_to: assistant._id,
      assigned_by: mangaka._id,
      task_type: "Tô bóng",
      description: "Tô bóng và tạo hiệu ứng chiều sâu cho nhân vật trong panel chính.",
      deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day later
      status: "Submitted",
      price: 400000
    });
    await task2.save();

    // Create a submission for Task 2 (After preview)
    const submission2 = new TaskSubmission({
      task_id: task2._id,
      submitted_by: assistant._id,
      file_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80",
      note: "Em đã hoàn thành tô bóng và vẽ lại bóng đổ. Anh xem thử được chưa nhé.",
      status: "Submitted",
      submitted_at: new Date()
    });
    await submission2.save();

    // Task 3: Already approved (and paid/approved income)
    const task3 = new Task({
      page_id: page2._id,
      region_id: region1._id, // reuse region for convenience
      assigned_to: assistant._id,
      assigned_by: mangaka._id,
      task_type: "Đi nét",
      description: "Đi lại nét viền nhân vật chính ở trang 2.",
      deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      status: "Approved",
      price: 350000
    });
    await task3.save();

    const submission3 = new TaskSubmission({
      task_id: task3._id,
      submitted_by: assistant._id,
      file_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80",
      note: "Nét vẽ sạch sẽ ở chapter 2.",
      status: "Approved",
      submitted_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    });
    await submission3.save();

    // Seed Income for Task 3
    const date = new Date();
    const currentMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const income = new AssistantIncome({
      assistant_id: assistant._id,
      task_id: task3._id,
      amount: task3.price,
      month: currentMonth,
      status: "Approved"
    });
    await income.save();

    console.log(`- Seeded Task 1 (Assigned): ${task1._id}`);
    console.log(`- Seeded Task 2 (Submitted): ${task2._id}`);
    console.log(`- Seeded Task 3 (Approved & Income): ${task3._id}`);

    console.log("\n✅ All seed data generated successfully!");
    await mongoose.disconnect();
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedTasksDemo();
