const dotenv = require("dotenv");
const mongoose = require("mongoose");
const path = require("path");
dotenv.config({ path: path.join(__dirname, "../.env") });

const connectDB = require("../src/config/config_mongoDB");
const User = require("../src/models/UserModel");
const { hashPassword } = require("../src/modules/auth/utils/password");

const seedEditorialUser = async () => {
  await connectDB();

  const email = process.env.SEED_EDITORIAL_EMAIL || "editorial@example.com";
  const password = process.env.SEED_EDITORIAL_PASSWORD || "password123";
  const name = process.env.SEED_EDITORIAL_NAME || "Trần Biên Tập";

  const passwordHash = await hashPassword(password);

  await User.findOneAndUpdate(
    { email: email.toLowerCase() },
    {
      name,
      email: email.toLowerCase(),
      password: passwordHash,
      role: "Editorial Board",
      status: "Active",
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  console.log(`Seeded editorial board user: ${email}`);
  await mongoose.disconnect();
};

seedEditorialUser().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
