const cloudinary = require("cloudinary").v2;
require("dotenv").config();

const connectCloudinary = () => {
  try {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    console.log("✅ Kết nối tới Cloudinary thành công!");
  } catch (error) {
    console.error("❌ Lỗi khi kết nối đến Cloudinary:", error);
    throw new Error("Kết nối đến Cloudinary thất bại");
  }
};

module.exports = { connectCloudinary, cloudinary };
