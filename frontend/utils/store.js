// 全局状态管理
import { reactive } from 'vue';
import { calculateCartTotal, calculateCartCount } from './utils.js';

// 创建响应式状态
const state = reactive({
  // 用户信息
  userInfo: null,
  token: null,
  
  // 商户信息
  merchantInfo: null,
  
  // 购物车
  cartItems: [],
  
  // 当前订单
  currentOrder: null,
  
  // 菜品列表
  products: [],
  
  // 订单列表
  orders: [],
  
  // 加载状态
  loading: false
});

// 状态管理方法
export const store = {
  // 获取状态
  getState() {
    return state;
  },
  
  // 用户相关
  setUserInfo(userInfo) {
    state.userInfo = userInfo;
    uni.setStorageSync('userInfo', userInfo);
  },
  
  setToken(token) {
    state.token = token;
    uni.setStorageSync('token', token);
  },
  
  clearUserInfo() {
    state.userInfo = null;
    state.token = null;
    uni.removeStorageSync('userInfo');
    uni.removeStorageSync('token');
  },
  
  // 商户相关
  setMerchantInfo(merchantInfo) {
    state.merchantInfo = merchantInfo;
  },
  
  // 购物车相关
  addToCart(product) {
    const existingItem = state.cartItems.find(item => item.id === product.id);
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      state.cartItems.push({
        ...product,
        quantity: 1
      });
    }
    this.saveCartToStorage();
  },
  
  removeFromCart(productId) {
    const index = state.cartItems.findIndex(item => item.id === productId);
    if (index > -1) {
      state.cartItems.splice(index, 1);
    }
    this.saveCartToStorage();
  },
  
  updateCartItemQuantity(productId, quantity) {
    const item = state.cartItems.find(item => item.id === productId);
    if (item) {
      if (quantity <= 0) {
        this.removeFromCart(productId);
      } else {
        item.quantity = quantity;
      }
    }
    this.saveCartToStorage();
  },
  
  clearCart() {
    state.cartItems = [];
    this.saveCartToStorage();
  },
  
  getCartTotal() {
    return calculateCartTotal(state.cartItems);
  },
  
  getCartCount() {
    return calculateCartCount(state.cartItems);
  },
  
  saveCartToStorage() {
    uni.setStorageSync('cartItems', state.cartItems);
  },
  
  loadCartFromStorage() {
    const cartItems = uni.getStorageSync('cartItems');
    if (cartItems) {
      state.cartItems = cartItems;
    }
  },
  
  // 订单相关
  setCurrentOrder(order) {
    state.currentOrder = order;
  },
  
  addOrder(order) {
    state.orders.unshift(order);
  },
  
  updateOrder(orderId, updates) {
    const order = state.orders.find(o => o.id === orderId);
    if (order) {
      Object.assign(order, updates);
    }
    
    // 同时更新当前订单
    if (state.currentOrder && state.currentOrder.id === orderId) {
      Object.assign(state.currentOrder, updates);
    }
  },
  
  setOrders(orders) {
    state.orders = orders;
  },
  
  // 菜品相关
  setProducts(products) {
    state.products = products;
  },
  
  addProduct(product) {
    state.products.unshift(product);
  },
  
  updateProduct(productId, updates) {
    const product = state.products.find(p => p.id === productId);
    if (product) {
      Object.assign(product, updates);
    }
  },
  
  removeProduct(productId) {
    const index = state.products.findIndex(p => p.id === productId);
    if (index > -1) {
      state.products.splice(index, 1);
    }
  },
  
  // 加载状态
  setLoading(loading) {
    state.loading = loading;
  },
  
  // 初始化状态
  init() {
    // 从本地存储恢复状态
    const userInfo = uni.getStorageSync('userInfo');
    const token = uni.getStorageSync('token');
    
    if (userInfo) {
      state.userInfo = userInfo;
    }
    
    if (token) {
      state.token = token;
    }
    
    // 恢复购物车
    this.loadCartFromStorage();
  }
};

// 初始化状态
store.init();

export default store;