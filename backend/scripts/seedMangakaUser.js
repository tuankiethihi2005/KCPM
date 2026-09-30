if (process.env.NODE_ENV !== "production") {
  const dns = require("dns");
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
}

const dotenv = require("dotenv");
const mongoose = require("mongoose");
const connectDB = require("../src/config/config_mongoDB");
const User = require("../src/models/UserModel");
const Series = require("../src/models/SeriesModel");
const Chapter = require("../src/models/ChapterModel");
const Page = require("../src/models/PageModel");
const { hashPassword } = require("../src/modules/auth/utils/password");

dotenv.config();

const seedMangakaUser = async () => {
  await connectDB();

  // Create Mangaka user
  const email = process.env.SEED_MANGAKA_EMAIL || "mangaka@example.com";
  const password = process.env.SEED_MANGAKA_PASSWORD || "password123";
  const name = process.env.SEED_MANGAKA_NAME || "Mangaka Artist";
  const role = "Mangaka";

  const passwordHash = await hashPassword(password);

  const user = await User.findOneAndUpdate(
    { email: email.toLowerCase() },
    {
      name,
      email: email.toLowerCase(),
      password: passwordHash,
      role,
      status: "Active",
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  console.log(`Seeded mangaka user: ${user.email} (${user.role})`);

  // Create a demo series for this mangaka
  const seededSeries = await Series.findOneAndUpdate(
    { title: "Mangaka Test Series", author_id: user._id },
    {
      title: "Mangaka Test Series",
      description: "Series duoc tao de test luong Mangaka.",
      genre: "Fantasy",
      target_audience: "Teen",
      author_id: user._id,
      status: "Active",
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  console.log(`Seeded demo series: ${seededSeries.title} (${seededSeries._id})`);

  // Create a demo chapter
  const seededChapter = await Chapter.findOneAndUpdate(
    { series_id: seededSeries._id, chapter_number: 1 },
    {
      series_id: seededSeries._id,
      chapter_number: 1,
      title: "Chapter 1: Khoi dau",
      deadline: new Date("2026-12-31"),
      status: "Draft",
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  console.log(`Seeded demo chapter: ${seededChapter.title} (${seededChapter._id})`);

  // Create a demo page
  await Page.findOneAndUpdate(
    { chapter_id: seededChapter._id, page_number: 1 },
    {
      chapter_id: seededChapter._id,
      page_number: 1,
      file_url: "https://placehold.co/400x600?text=Page+1",
      status: "Pending",
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  console.log("Seeded demo page");
  await mongoose.disconnect();
};

seedMangakaUser().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
