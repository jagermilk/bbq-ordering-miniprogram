<template>
	<view class="container">
		<!-- 商户信息区域 -->
		<view class="merchant-info" v-if="merchantInfo">
			<view class="merchant-header">
				<text class="merchant-name">{{ merchantInfo.name }}</text>
				<view class="status-indicator">
					<view class="status-dot" :class="{ active: merchantInfo.isActive }"></view>
					<text class="status-text">{{ merchantInfo.isActive ? '营业中' : '休息中' }}</text>
				</view>
			</view>
			<text class="merchant-desc" v-if="merchantInfo.description">{{ merchantInfo.description }}</text>
		</view>
		
		<!-- 菜品分类 -->
		<view class="category-tabs" v-if="categories.length > 0">
			<scroll-view class="category-scroll" scroll-x="true">
				<view class="category-list">
					<view 
						class="category-item" 
						:class="{ active: selectedCategory === category }"
						v-for="category in categories" 
						:key="category"
						@click="selectCategory(category)"
					>
						<text class="category-text">{{ category || '全部' }}</text>
					</view>
				</view>
			</scroll-view>
		</view>
		
		<!-- 菜品列表 -->
		<view class="product-list">
			<view 
				class="product-card" 
				v-for="product in filteredProducts" 
				:key="product.id"
			>
				<image 
					class="product-image" 
					:src="product.image || '/static/default-food.png'"
					mode="aspectFill"
				></image>
				<view class="product-info">
					<text class="product-name">{{ product.name }}</text>
					<text class="product-desc" v-if="product.description">{{ product.description }}</text>
					<view class="product-footer">
						<text class="product-price">{{ formatPrice(product.price) }}</text>
						<view class="quantity-control">
							<view 
								class="quantity-btn minus" 
								:class="{ disabled: getProductQuantity(product.id) === 0 }"
								@click="decreaseQuantity(product)"
							>
								<text class="btn-text">-</text>
							</view>
							<text class="quantity-text">{{ getProductQuantity(product.id) }}</text>
							<view class="quantity-btn plus" @click="increaseQuantity(product)">
								<text class="btn-text">+</text>
							</view>
						</view>
					</view>
				</view>
			</view>
		</view>
		
		<!-- 空状态 -->
		<view class="empty-state" v-if="filteredProducts.length === 0 && !loading">
			<text class="empty-icon">🍽️</text>
			<text class="empty-text">暂无菜品</text>
		</view>
		
		<!-- 购物车悬浮按钮 -->
		<view class="cart-float" v-if="cartCount > 0" @click="goToCart">
			<view class="cart-badge">{{ cartCount }}</view>
			<text class="cart-icon">🛒</text>
			<text class="cart-total">{{ formatPrice(cartTotal) }}</text>
		</view>
	</view>
</template>

<script>
import { productAPI } from '@/utils/api.js';
import { formatPrice, showToast, showLoading, hideLoading } from '@/utils/utils.js';
import store from '@/utils/store.js';

export default {
	data() {
		return {
			merchantInfo: null,
			products: [],
			categories: [],
			selectedCategory: '',
			loading: false
		}
	},
	
	computed: {
		// 过滤后的菜品列表
		filteredProducts() {
			if (!this.selectedCategory) {
				return this.products.filter(p => p.isAvailable);
			}
			return this.products.filter(p => 
				p.isAvailable && p.category === this.selectedCategory
			);
		},
		
		// 购物车数量
		cartCount() {
			return store.getCartCount();
		},
		
		// 购物车总价
		cartTotal() {
			return store.getCartTotal();
		}
	},
	
	onLoad() {
		this.loadMerchantData();
	},
	
	onPullDownRefresh() {
		this.loadMerchantData().finally(() => {
			uni.stopPullDownRefresh();
		});
	},
	
	onShow() {
		// 页面显示时刷新购物车状态
		this.$forceUpdate();
	},
	
	methods: {
		// 加载商户数据
		async loadMerchantData() {
			const merchantId = uni.getStorageSync('merchantId');
			if (!merchantId) {
				showToast('请先扫码选择商户', 'error');
				uni.switchTab({ url: '/pages/index/index' });
				return;
			}
			
			this.loading = true;
			showLoading('加载中...');
			
			try {
				// 获取菜品列表
				const response = await productAPI.getProducts(merchantId);
				
				if (response.success) {
					this.products = response.data.products || [];
					this.merchantInfo = response.data.merchant || {};
					
					// 提取分类
					this.extractCategories();
					
					// 保存到store
					store.setProducts(this.products);
					store.setMerchantInfo(this.merchantInfo);
				} else {
					showToast(response.message || '加载失败', 'error');
				}
			} catch (error) {
				console.error('加载菜品失败:', error);
				// 使用模拟数据
				this.loadMockData();
			} finally {
				this.loading = false;
				hideLoading();
			}
		},
		
		// 加载模拟数据
		loadMockData() {
			this.merchantInfo = {
				name: '烧烤摊示例店',
				description: '正宗烧烤，美味可口',
				isActive: true
			};
			
			this.products = [
				{
					id: '1',
					name: '烤羊肉串',
					price: 3.00,
					description: '新鲜羊肉，香嫩可口',
					category: '烤串类',
					isAvailable: true,
					image: '/static/default-food.png'
				},
				{
					id: '2',
					name: '烤鸡翅',
					price: 8.00,
					description: '秘制烤鸡翅，外焦里嫩',
					category: '烤串类',
					isAvailable: true,
					image: '/static/default-food.png'
				},
				{
					id: '3',
					name: '烤玉米',
					price: 5.00,
					description: '香甜玉米，营养丰富',
					category: '蔬菜类',
					isAvailable: true,
					image: '/static/default-food.png'
				}
			];
			
			this.extractCategories();
		},
		
		// 提取分类
		extractCategories() {
			const categorySet = new Set();
			this.products.forEach(product => {
				if (product.category) {
					categorySet.add(product.category);
				}
			});
			this.categories = ['', ...Array.from(categorySet)];
		},
		
		// 选择分类
		selectCategory(category) {
			this.selectedCategory = category;
		},
		
		// 获取商品在购物车中的数量
		getProductQuantity(productId) {
			const cartItems = store.getState().cartItems;
			const item = cartItems.find(item => item.id === productId);
			return item ? item.quantity : 0;
		},
		
		// 增加数量
		increaseQuantity(product) {
			store.addToCart(product);
			this.$forceUpdate();
		},
		
		// 减少数量
		decreaseQuantity(product) {
			const currentQuantity = this.getProductQuantity(product.id);
			if (currentQuantity > 0) {
				store.updateCartItemQuantity(product.id, currentQuantity - 1);
				this.$forceUpdate();
			}
		},
		
		// 格式化价格
		formatPrice,
		
		// 跳转到购物车
		goToCart() {
			uni.switchTab({ url: '/pages/cart/cart' });
		}
	}
}
</script>

<style scoped>
.container {
	min-height: 100vh;
	background-color: #F8F9FA;
	padding-bottom: 120rpx;
}

/* 商户信息 */
.merchant-info {
	background: #FFFFFF;
	padding: 30rpx;
	margin-bottom: 20rpx;
	border-radius: 0 0 20rpx 20rpx;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.merchant-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 15rpx;
}

.merchant-name {
	font-size: 36rpx;
	font-weight: bold;
	color: #333333;
}

.status-indicator {
	display: flex;
	align-items: center;
	gap: 10rpx;
}

.status-dot {
	width: 16rpx;
	height: 16rpx;
	border-radius: 50%;
	background-color: #FF4D4F;
}

.status-dot.active {
	background-color: #52C41A;
}

.status-text {
	font-size: 24rpx;
	color: #666666;
}

.merchant-desc {
	font-size: 28rpx;
	color: #666666;
	line-height: 1.5;
}

/* 分类标签 */
.category-tabs {
	background: #FFFFFF;
	padding: 20rpx 0;
	margin-bottom: 20rpx;
}

.category-scroll {
	white-space: nowrap;
}

.category-list {
	display: flex;
	padding: 0 30rpx;
	gap: 20rpx;
}

.category-item {
	padding: 15rpx 30rpx;
	border-radius: 30rpx;
	background-color: #F8F9FA;
	border: 2rpx solid transparent;
	transition: all 0.2s;
	flex-shrink: 0;
}

.category-item.active {
	background-color: #FF6B35;
	border-color: #FF6B35;
}

.category-text {
	font-size: 28rpx;
	color: #666666;
}

.category-item.active .category-text {
	color: #FFFFFF;
}

/* 菜品列表 */
.product-list {
	padding: 0 30rpx;
}

.product-card {
	background: #FFFFFF;
	border-radius: 20rpx;
	padding: 30rpx;
	margin-bottom: 20rpx;
	display: flex;
	gap: 20rpx;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.product-image {
	width: 120rpx;
	height: 120rpx;
	border-radius: 15rpx;
	flex-shrink: 0;
}

.product-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
}

.product-name {
	font-size: 32rpx;
	font-weight: bold;
	color: #333333;
	margin-bottom: 10rpx;
}

.product-desc {
	font-size: 24rpx;
	color: #666666;
	line-height: 1.4;
	margin-bottom: 15rpx;
	overflow: hidden;
	text-overflow: ellipsis;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
}

.product-footer {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.product-price {
	font-size: 32rpx;
	font-weight: bold;
	color: #FF6B35;
}

/* 数量控制 */
.quantity-control {
	display: flex;
	align-items: center;
	gap: 15rpx;
}

.quantity-btn {
	width: 60rpx;
	height: 60rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.2s;
}

.quantity-btn.minus {
	background-color: #F8F9FA;
	border: 2rpx solid #E9ECEF;
}

.quantity-btn.minus.disabled {
	opacity: 0.3;
}

.quantity-btn.plus {
	background-color: #FF6B35;
}

.btn-text {
	font-size: 32rpx;
	font-weight: bold;
	color: #666666;
}

.quantity-btn.plus .btn-text {
	color: #FFFFFF;
}

.quantity-text {
	font-size: 28rpx;
	font-weight: bold;
	color: #333333;
	min-width: 40rpx;
	text-align: center;
}

/* 空状态 */
.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 100rpx 0;
}

.empty-icon {
	font-size: 120rpx;
	margin-bottom: 30rpx;
}

.empty-text {
	font-size: 28rpx;
	color: #666666;
}

/* 购物车悬浮按钮 */
.cart-float {
	position: fixed;
	bottom: 120rpx;
	right: 30rpx;
	background: #FF6B35;
	border-radius: 50rpx;
	padding: 20rpx 30rpx;
	display: flex;
	align-items: center;
	gap: 15rpx;
	box-shadow: 0 8rpx 24rpx rgba(255, 107, 53, 0.3);
	z-index: 100;
}

.cart-badge {
	position: absolute;
	top: -10rpx;
	right: -10rpx;
	background: #FF4D4F;
	color: #FFFFFF;
	font-size: 20rpx;
	padding: 8rpx 12rpx;
	border-radius: 20rpx;
	min-width: 32rpx;
	height: 32rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.cart-icon {
	font-size: 32rpx;
}

.cart-total {
	font-size: 28rpx;
	font-weight: bold;
	color: #FFFFFF;
}
</style>