const multer = require("multer");
<<<<<<< HEAD
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
=======
const path = require("path");
const { cloudinary } = require("../config/config_cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const cloudinaryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const fileExtension = path.extname(file.originalname).slice(1).toLowerCase();

    return {
      folder: "manga_images",
      resource_type: "auto",
      format: fileExtension,
>>>>>>> origin/main
    };
  },
});

<<<<<<< HEAD
const upload = multer({ storage: storage });

module.exports = upload;
=======
const createUpload = ({ storage, maxFileSize, allowedFiles }) =>
  multer({
    storage,
    limits: { fileSize: maxFileSize },
    fileFilter: (req, file, callback) => {
      const extension = path.extname(file.originalname).slice(1).toLowerCase();
      const fileRule = allowedFiles[file.fieldname];

      if (!fileRule || !fileRule.extensions.includes(extension)) {
        const error = new Error(
          fileRule
            ? `File ${file.fieldname} chỉ hỗ trợ: ${fileRule.label}.`
            : `Trường file "${file.fieldname}" không được hỗ trợ.`,
        );
        error.status = 400;
        error.code = "INVALID_FILE_TYPE";
        callback(error);
        return;
      }

      callback(null, true);
    },
  });

const upload = {
  cover: createUpload({
    storage: cloudinaryStorage,
    maxFileSize: 10 * 1024 * 1024,
    allowedFiles: {
      cover: {
        extensions: [
          "avif",
          "bmp",
          "gif",
          "heic",
          "heif",
          "jfif",
          "jpeg",
          "jpg",
          "png",
          "svg",
          "tif",
          "tiff",
          "webp",
        ],
        label: "các định dạng ảnh phổ biến",
      },
    },
  }),
  pages: createUpload({
    storage: cloudinaryStorage,
    // Multer applies one per-file limit to both page source and attached resources.
    maxFileSize: 500 * 1024 * 1024,
    allowedFiles: {
      source_file: {
        extensions: ["psd"],
        label: "PSD",
      },
      attached_resource: {
        extensions: [
          "7z",
          "bz2",
          "gz",
          "rar",
          "tar",
          "tbz2",
          "tgz",
          "txz",
          "xz",
          "zip",
          "zst",
        ],
        label: "các định dạng file nén phổ biến",
      },
    },
  }),
  task: createUpload({
    storage: cloudinaryStorage,
    maxFileSize: 100 * 1024 * 1024,
    allowedFiles: {
      file: {
        extensions: ["psd"],
        label: "PSD",
      },
    },
  }),
  votes: createUpload({
    storage: multer.memoryStorage(),
    maxFileSize: 10 * 1024 * 1024,
    allowedFiles: {
      file: {
        extensions: ["csv", "xls", "xlsx"],
        label: "CSV, XLS hoặc XLSX",
      },
    },
  }),
};

module.exports = upload;
module.exports.createUpload = createUpload;
>>>>>>> origin/main
