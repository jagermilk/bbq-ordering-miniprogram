import Product from '../models/Product.js';
import Merchant from '../models/Merchant.js';
import mongoose from 'mongoose';

/**
 * 菜品管理控制器
 * 处理菜品的增删改查、分类管理、库存管理等操作
 */

// 创建菜品
export const createProduct = async (req, res) => {
  try {
    const merchantId = req.merchantId;
    const {
      name,
      price,
      description,
      image,
      category,
      stock,
      tags,
      nutrition,
      cookingTime,
      spicyLevel,
      recommendLevel,
      sortOrder
    } = req.body;
    
    // 验证必填字段
    if (!name || !price) {
      return res.status(400).json({
        success: false,
        message: '菜品名称和价格不能为空'
      });
    }
    
    // 检查同一商户下是否已有同名菜品
    const existingProduct = await Product.findOne({ merchantId, name });
    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: '该菜品名称已存在'
      });
    }
    
    // 创建新菜品
    const product = new Product({
      merchantId,
      name,
      price,
      description: description || '',
      image: image || '',
      category: category || '其他',
      stock: stock !== undefined ? stock : -1,
      tags: tags || [],
      nutrition: nutrition || {},
      cookingTime: cookingTime || 10,
      spicyLevel: spicyLevel || 0,
      recommendLevel: recommendLevel || 3,
      sortOrder: sortOrder || 0
    });
    
    await product.save();
    
    res.status(201).json({
      success: true,
      message: '菜品创建成功',
      data: {
        product
      }
    });
    
  } catch (error) {
    console.error('创建菜品错误:', error);
    res.status(500).json({
      success: false,
      message: '创建菜品失败，请稍后重试'
    });
  }
};

// 获取商户菜品列表
export const getProducts = async (req, res) => {
  try {
    const merchantId = req.params.merchantId || req.merchantId;
    const {
      page = 1,
      limit = 20,
      category,
      isAvailable,
      keyword,
      sortBy = 'sortOrder',
      sortOrder = 'desc'
    } = req.query;
    
    // 构建查询条件
    const query = { merchantId };
    
    if (category) {
      query.category = category;
    }
    
    if (isAvailable !== undefined) {
      query.isAvailable = isAvailable === 'true';
    }
    
    if (keyword) {
      const regex = new RegExp(keyword, 'i');
      query.$or = [
        { name: regex },
        { description: regex },
        { tags: { $in: [regex] } }
      ];
    }
    
    // 构建排序条件
    const sort = {};
    if (sortBy === 'soldCount') {
      sort.soldCount = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'price') {
      sort.price = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'createdAt') {
      sort.createdAt = sortOrder === 'desc' ? -1 : 1;
    } else {
      sort.sortOrder = -1;
      sort.createdAt = -1;
    }
    
    // 分页参数
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // 查询菜品
    const [products, total] = await Promise.all([
      Product.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Product.countDocuments(query)
    ]);
    
    // 转换菜品数据格式，将_id转换为id
    const formattedProducts = products.map(product => {
      const productObj = product.toObject();
      return {
        id: productObj._id,
        name: productObj.name,
        price: productObj.price,
        description: productObj.description,
        category: productObj.category,
        isAvailable: productObj.isAvailable,
        image: productObj.image,
        stock: productObj.stock,
        tags: productObj.tags,
        nutrition: productObj.nutrition,
        cookingTime: productObj.cookingTime,
        spicyLevel: productObj.spicyLevel,
        recommendLevel: productObj.recommendLevel,
        sortOrder: productObj.sortOrder,
        soldCount: productObj.soldCount,
        createdAt: productObj.createdAt,
        updatedAt: productObj.updatedAt
      };
    });
    
    res.json({
      success: true,
      data: {
        products: formattedProducts,
        pagination: {
          current: parseInt(page),
          pageSize: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
    
  } catch (error) {
    console.error('获取菜品列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取菜品列表失败'
    });
  }
};

// 获取单个菜品详情
export const getProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: '无效的菜品ID'
      });
    }
    
    const product = await Product.findById(id).populate('merchantId', 'name address phone');
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: '菜品不存在'
      });
    }
    
    res.json({
      success: true,
      data: {
        product
      }
    });
    
  } catch (error) {
    console.error('获取菜品详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取菜品详情失败'
    });
  }
};

// 更新菜品
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const merchantId = req.merchantId;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: '无效的菜品ID'
      });
    }
    
    const product = await Product.findOne({ _id: id, merchantId });
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: '菜品不存在或无权限修改'
      });
    }
    
    // 更新字段
    const updateFields = [
      'name', 'price', 'description', 'image', 'category',
      'isAvailable', 'stock', 'tags', 'nutrition',
      'cookingTime', 'spicyLevel', 'recommendLevel', 'sortOrder'
    ];
    
    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    });
    
    await product.save();
    
    res.json({
      success: true,
      message: '菜品更新成功',
      data: {
        product
      }
    });
    
  } catch (error) {
    console.error('更新菜品错误:', error);
    res.status(500).json({
      success: false,
      message: '更新菜品失败，请稍后重试'
    });
  }
};

// 删除菜品
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const merchantId = req.merchantId;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: '无效的菜品ID'
      });
    }
    
    const product = await Product.findOneAndDelete({ _id: id, merchantId });
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: '菜品不存在或无权限删除'
      });
    }
    
    res.json({
      success: true,
      message: '菜品删除成功'
    });
    
  } catch (error) {
    console.error('删除菜品错误:', error);
    res.status(500).json({
      success: false,
      message: '删除菜品失败，请稍后重试'
    });
  }
};

// 批量更新菜品状态
export const batchUpdateStatus = async (req, res) => {
  try {
    const { productIds, isAvailable } = req.body;
    const merchantId = req.merchantId;
    
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的菜品ID列表'
      });
    }
    
    if (typeof isAvailable !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: '请提供有效的状态值'
      });
    }
    
    const result = await Product.updateMany(
      {
        _id: { $in: productIds },
        merchantId
      },
      {
        isAvailable,
        updatedAt: new Date()
      }
    );
    
    res.json({
      success: true,
      message: `成功更新${result.modifiedCount}个菜品状态`,
      data: {
        modifiedCount: result.modifiedCount
      }
    });
    
  } catch (error) {
    console.error('批量更新菜品状态错误:', error);
    res.status(500).json({
      success: false,
      message: '批量更新失败，请稍后重试'
    });
  }
};

// 获取菜品分类列表
export const getCategories = async (req, res) => {
  try {
    const merchantId = req.params.merchantId || req.merchantId;
    
    const categories = await Product.aggregate([
      { $match: { merchantId: new mongoose.Types.ObjectId(merchantId) } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          availableCount: {
            $sum: { $cond: ['$isAvailable', 1, 0] }
          }
        }
      },
      {
        $project: {
          _id: 0,
          name: '$_id',
          count: 1,
          availableCount: 1
        }
      },
      { $sort: { name: 1 } }
    ]);
    
    res.json({
      success: true,
      data: {
        categories
      }
    });
    
  } catch (error) {
    console.error('获取菜品分类错误:', error);
    res.status(500).json({
      success: false,
      message: '获取菜品分类失败'
    });
  }
};

// 获取热销菜品
export const getHotProducts = async (req, res) => {
  try {
    const merchantId = req.params.merchantId || req.merchantId;
    const { limit = 10 } = req.query;
    
    const products = await Product.findHotProducts(merchantId, parseInt(limit));
    
    res.json({
      success: true,
      data: {
        products
      }
    });
    
  } catch (error) {
    console.error('获取热销菜品错误:', error);
    res.status(500).json({
      success: false,
      message: '获取热销菜品失败'
    });
  }
};

// 搜索菜品
export const searchProducts = async (req, res) => {
  try {
    const merchantId = req.params.merchantId;
    const { keyword, limit = 20 } = req.query;
    
    if (!keyword || keyword.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供搜索关键词'
      });
    }
    
    const products = await Product.searchProducts(merchantId, keyword.trim())
      .limit(parseInt(limit));
    
    res.json({
      success: true,
      data: {
        products,
        keyword: keyword.trim()
      }
    });
    
  } catch (error) {
    console.error('搜索菜品错误:', error);
    res.status(500).json({
      success: false,
      message: '搜索菜品失败'
    });
  }
};

// 更新库存
export const updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { stock, operation = 'set' } = req.body; // operation: 'set', 'add', 'reduce'
    const merchantId = req.merchantId;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: '无效的菜品ID'
      });
    }
    
    const product = await Product.findOne({ _id: id, merchantId });
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: '菜品不存在或无权限修改'
      });
    }
    
    if (operation === 'set') {
      product.stock = stock;
    } else if (operation === 'add') {
      product.addStock(stock);
    } else if (operation === 'reduce') {
      if (!product.reduceStock(stock)) {
        return res.status(400).json({
          success: false,
          message: '库存不足'
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: '无效的操作类型'
      });
    }
    
    await product.save();
    
    res.json({
      success: true,
      message: '库存更新成功',
      data: {
        product: {
          id: product._id,
          name: product.name,
          stock: product.stock,
          soldCount: product.soldCount
        }
      }
    });
    
  } catch (error) {
    console.error('更新库存错误:', error);
    res.status(500).json({
      success: false,
      message: '更新库存失败，请稍后重试'
    });
  }
};

export default {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  batchUpdateStatus,
  getCategories,
  getHotProducts,
  searchProducts,
  updateStock
};