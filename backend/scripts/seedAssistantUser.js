const dotenv = require("dotenv");
const mongoose = require("mongoose");
const path = require("path");
dotenv.config({ path: path.join(__dirname, "../.env") });

const connectDB = require("../src/config/config_mongoDB");
const User = require("../src/models/UserModel");
const { hashPassword } = require("../src/modules/auth/utils/password");

const seedAssistantUser = async () => {
  await connectDB();

  const email = process.env.SEED_ASSISTANT_EMAIL || "assistant@example.com";
  const password = process.env.SEED_ASSISTANT_PASSWORD || "password123";
  const name = process.env.SEED_ASSISTANT_NAME || "Lê Trợ Lý";

  const passwordHash = await hashPassword(password);

  await User.findOneAndUpdate(
    { email: email.toLowerCase() },
    {
      name,
      email: email.toLowerCase(),
      password: passwordHash,
      role: "Assistant",
      status: "Active",
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  console.log(`Seeded assistant user: ${email}`);
  await mongoose.disconnect();
};

seedAssistantUser().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
