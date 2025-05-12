// uploadController.js - 文件上传控制器
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 上传目录
const uploadDir = process.env.UPLOAD_DIR || "uploads";
const absoluteUploadPath = path.join(__dirname, "..", uploadDir);

// 确保上传目录存在
if (!fs.existsSync(absoluteUploadPath)) {
  fs.mkdirSync(absoluteUploadPath, { recursive: true });
}

// 配置存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let targetPath = absoluteUploadPath;

    // 根据不同类型存放到不同子目录
    if (file.mimetype.startsWith("image/")) {
      targetPath = path.join(absoluteUploadPath, "images");
    } else if (file.mimetype.startsWith("video/")) {
      targetPath = path.join(absoluteUploadPath, "videos");
    } else {
      targetPath = path.join(absoluteUploadPath, "documents");
    }

    // 确保目标目录存在
    if (!fs.existsSync(targetPath)) {
      fs.mkdirSync(targetPath, { recursive: true });
    }

    cb(null, targetPath);
  },
  filename: function (req, file, cb) {
    // 获取文件扩展名
    const ext = path.extname(file.originalname);
    // 创建唯一的文件名: 时间戳-随机数-原始文件名
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  // 接受的文件类型
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/zip",
    "text/plain",
    "video/mp4",
    "video/mpeg",
    "video/quicktime",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("不支持的文件类型"), false);
  }
};

// 配置multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 默认10MB
  },
  fileFilter: fileFilter,
});

// 单文件上传处理
export const uploadSingle = (fieldName) => {
  return (req, res, next) => {
    const uploadMiddleware = upload.single(fieldName);

    uploadMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            status: "fail",
            message: "文件过大，请上传小于10MB的文件",
          });
        }
        return res.status(400).json({
          status: "fail",
          message: err.message,
        });
      } else if (err) {
        return res.status(400).json({
          status: "fail",
          message: err.message,
        });
      }
      next();
    });
  };
};

// 多文件上传处理
export const uploadMultiple = (fieldName, maxCount = 5) => {
  return (req, res, next) => {
    const uploadMiddleware = upload.array(fieldName, maxCount);

    uploadMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            status: "fail",
            message: "文件过大，请上传小于10MB的文件",
          });
        } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
          return res.status(400).json({
            status: "fail",
            message: `最多只能上传${maxCount}个文件`,
          });
        }
        return res.status(400).json({
          status: "fail",
          message: err.message,
        });
      } else if (err) {
        return res.status(400).json({
          status: "fail",
          message: err.message,
        });
      }
      next();
    });
  };
};

// 处理上传的文件
export const handleFileUpload = (req, res) => {
  try {
    if (!req.file && !req.files) {
      return res.status(400).json({
        status: "fail",
        message: "没有上传文件",
      });
    }

    // 单文件上传的情况
    if (req.file) {
      const baseUrl =
        process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
      const relativePath = path
        .relative(path.join(__dirname, ".."), req.file.path)
        .replace(/\\/g, "/");
      const fileUrl = `${baseUrl}/${relativePath}`;

      return res.status(200).json({
        status: "success",
        data: {
          file: {
            filename: req.file.filename,
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            url: fileUrl,
          },
        },
      });
    }

    // 多文件上传的情况
    if (req.files && req.files.length > 0) {
      const baseUrl =
        process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
      const files = req.files.map((file) => {
        const relativePath = path
          .relative(path.join(__dirname, ".."), file.path)
          .replace(/\\/g, "/");
        const fileUrl = `${baseUrl}/${relativePath}`;

        return {
          filename: file.filename,
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          url: fileUrl,
        };
      });

      return res.status(200).json({
        status: "success",
        results: files.length,
        data: {
          files,
        },
      });
    }
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

// 删除文件
export const deleteFile = async (req, res) => {
  try {
    const { filename } = req.params;

    // 查找文件
    let filePath = "";
    const possiblePaths = [
      path.join(absoluteUploadPath, "images", filename),
      path.join(absoluteUploadPath, "videos", filename),
      path.join(absoluteUploadPath, "documents", filename),
      path.join(absoluteUploadPath, filename),
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        filePath = p;
        break;
      }
    }

    if (!filePath) {
      return res.status(404).json({
        status: "fail",
        message: "文件不存在",
      });
    }

    // 删除文件
    fs.unlinkSync(filePath);

    res.status(200).json({
      status: "success",
      message: "文件已删除",
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};
