const multer = require("multer");
const { cloudinary } = require("../config/config_cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // 1. Lấy đuôi file gốc từ tên file người dùng tải lên (ví dụ: 'zip', 'psd', 'png')
    const fileExtension = file.originalname.split(".").pop();

    // 2. Trả về cấu hình cho Cloudinary
    return {
      folder: "manga_images",
      resource_type: "auto",
      format: fileExtension, // ÉP CLOUDINARY PHẢI GIỮ LẠI ĐUÔI FILE NÀY!
    };
  },
});

const upload = multer({ storage: storage });

module.exports = upload;
