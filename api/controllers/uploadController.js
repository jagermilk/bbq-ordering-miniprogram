import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import config from '../config/config.js';

/**
 * 文件上传控制器
 * 处理菜品图片、商户头像等文件上传
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 确保上传目录存在
const ensureUploadDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// 文件过滤器
const fileFilter = (req, file, cb) => {
  // 检查文件类型
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('只支持上传图片文件 (jpeg, jpg, png, gif, webp)'));
  }
};

// 生成唯一文件名
const generateFileName = (originalname) => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  const ext = path.extname(originalname);
  return `${timestamp}_${random}${ext}`;
};

// 配置multer存储
const storage = multer.memoryStorage();

// 创建multer实例
const upload = multer({
  storage: storage,
  limits: {
    fileSize: config.upload.maxFileSize, // 5MB
    files: 5 // 最多5个文件
  },
  fileFilter: fileFilter
});

// 保存文件到磁盘
const saveFileToDisk = (buffer, filename, subfolder = '') => {
  const uploadDir = path.join(config.upload.path, subfolder);
  ensureUploadDir(uploadDir);
  
  const filePath = path.join(uploadDir, filename);
  fs.writeFileSync(filePath, buffer);
  
  return {
    filename,
    path: filePath,
    url: `/uploads/${subfolder ? subfolder + '/' : ''}${filename}`
  };
};

// 删除文件
const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('删除文件错误:', error);
    return false;
  }
};

// 单文件上传中间件
export const uploadSingle = (fieldName, subfolder = '') => {
  return (req, res, next) => {
    const uploadMiddleware = upload.single(fieldName);
    
    uploadMiddleware(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              success: false,
              message: '文件大小超过限制（最大5MB）'
            });
          }
          if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
              success: false,
              message: '上传字段名不正确'
            });
          }
        }
        return res.status(400).json({
          success: false,
          message: err.message || '文件上传失败'
        });
      }
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: '请选择要上传的文件'
        });
      }
      
      try {
        // 生成文件名并保存
        const filename = generateFileName(req.file.originalname);
        const fileInfo = saveFileToDisk(req.file.buffer, filename, subfolder);
        
        req.uploadedFile = {
          ...fileInfo,
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size
        };
        
        next();
      } catch (error) {
        console.error('保存文件错误:', error);
        res.status(500).json({
          success: false,
          message: '文件保存失败'
        });
      }
    });
  };
};

// 多文件上传中间件
export const uploadMultiple = (fieldName, maxCount = 5, subfolder = '') => {
  return (req, res, next) => {
    const uploadMiddleware = upload.array(fieldName, maxCount);
    
    uploadMiddleware(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              success: false,
              message: '文件大小超过限制（最大5MB）'
            });
          }
          if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
              success: false,
              message: `最多只能上传${maxCount}个文件`
            });
          }
        }
        return res.status(400).json({
          success: false,
          message: err.message || '文件上传失败'
        });
      }
      
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: '请选择要上传的文件'
        });
      }
      
      try {
        // 保存所有文件
        const uploadedFiles = req.files.map(file => {
          const filename = generateFileName(file.originalname);
          const fileInfo = saveFileToDisk(file.buffer, filename, subfolder);
          
          return {
            ...fileInfo,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size
          };
        });
        
        req.uploadedFiles = uploadedFiles;
        next();
      } catch (error) {
        console.error('保存文件错误:', error);
        res.status(500).json({
          success: false,
          message: '文件保存失败'
        });
      }
    });
  };
};

// 上传菜品图片
export const uploadProductImage = async (req, res) => {
  try {
    const fileInfo = req.uploadedFile;
    
    res.json({
      success: true,
      message: '菜品图片上传成功',
      data: {
        file: {
          filename: fileInfo.filename,
          originalname: fileInfo.originalname,
          url: fileInfo.url,
          size: fileInfo.size,
          mimetype: fileInfo.mimetype
        }
      }
    });
  } catch (error) {
    console.error('上传菜品图片错误:', error);
    res.status(500).json({
      success: false,
      message: '上传失败，请稍后重试'
    });
  }
};

// 上传商户头像
export const uploadMerchantAvatar = async (req, res) => {
  try {
    const fileInfo = req.uploadedFile;
    
    res.json({
      success: true,
      message: '商户头像上传成功',
      data: {
        file: {
          filename: fileInfo.filename,
          originalname: fileInfo.originalname,
          url: fileInfo.url,
          size: fileInfo.size,
          mimetype: fileInfo.mimetype
        }
      }
    });
  } catch (error) {
    console.error('上传商户头像错误:', error);
    res.status(500).json({
      success: false,
      message: '上传失败，请稍后重试'
    });
  }
};

// 批量上传图片
export const uploadMultipleImages = async (req, res) => {
  try {
    const filesInfo = req.uploadedFiles;
    
    res.json({
      success: true,
      message: `成功上传${filesInfo.length}个文件`,
      data: {
        files: filesInfo.map(file => ({
          filename: file.filename,
          originalname: file.originalname,
          url: file.url,
          size: file.size,
          mimetype: file.mimetype
        }))
      }
    });
  } catch (error) {
    console.error('批量上传图片错误:', error);
    res.status(500).json({
      success: false,
      message: '上传失败，请稍后重试'
    });
  }
};

// 删除文件
export const deleteUploadedFile = async (req, res) => {
  try {
    const { filename, subfolder = '' } = req.body;
    
    if (!filename) {
      return res.status(400).json({
        success: false,
        message: '请提供文件名'
      });
    }
    
    const filePath = path.join(config.upload.path, subfolder, filename);
    const deleted = deleteFile(filePath);
    
    if (deleted) {
      res.json({
        success: true,
        message: '文件删除成功'
      });
    } else {
      res.status(404).json({
        success: false,
        message: '文件不存在或删除失败'
      });
    }
  } catch (error) {
    console.error('删除文件错误:', error);
    res.status(500).json({
      success: false,
      message: '删除失败，请稍后重试'
    });
  }
};

// 获取文件信息
export const getFileInfo = async (req, res) => {
  try {
    const { filename, subfolder = '' } = req.params;
    
    const filePath = path.join(config.upload.path, subfolder, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: '文件不存在'
      });
    }
    
    const stats = fs.statSync(filePath);
    
    res.json({
      success: true,
      data: {
        filename,
        url: `/uploads/${subfolder ? subfolder + '/' : ''}${filename}`,
        size: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime
      }
    });
  } catch (error) {
    console.error('获取文件信息错误:', error);
    res.status(500).json({
      success: false,
      message: '获取文件信息失败'
    });
  }
};

// 获取上传统计
export const getUploadStats = async (req, res) => {
  try {
    if (!req.merchantId) {
      return res.status(401).json({
        success: false,
        message: '请先登录商户账户'
      });
    }
    
    const uploadDir = config.upload.path;
    const productDir = path.join(uploadDir, 'products');
    const avatarDir = path.join(uploadDir, 'avatars');
    
    let totalFiles = 0;
    let totalSize = 0;
    
    // 统计产品图片
    if (fs.existsSync(productDir)) {
      const productFiles = fs.readdirSync(productDir);
      totalFiles += productFiles.length;
      
      productFiles.forEach(file => {
        const filePath = path.join(productDir, file);
        const stats = fs.statSync(filePath);
        totalSize += stats.size;
      });
    }
    
    // 统计头像
    if (fs.existsSync(avatarDir)) {
      const avatarFiles = fs.readdirSync(avatarDir);
      totalFiles += avatarFiles.length;
      
      avatarFiles.forEach(file => {
        const filePath = path.join(avatarDir, file);
        const stats = fs.statSync(filePath);
        totalSize += stats.size;
      });
    }
    
    res.json({
      success: true,
      data: {
        totalFiles,
        totalSize,
        totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
        maxFileSize: config.upload.maxFileSize,
        maxFileSizeMB: (config.upload.maxFileSize / (1024 * 1024)).toFixed(2),
        allowedTypes: ['jpeg', 'jpg', 'png', 'gif', 'webp']
      }
    });
  } catch (error) {
    console.error('获取上传统计错误:', error);
    res.status(500).json({
      success: false,
      message: '获取统计信息失败'
    });
  }
};

export default {
  uploadSingle,
  uploadMultiple,
  uploadProductImage,
  uploadMerchantAvatar,
  uploadMultipleImages,
  deleteUploadedFile,
  getFileInfo,
  getUploadStats
};