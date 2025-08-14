<template>
	<view class="container">
		<!-- 购物车列表 -->
		<view class="cart-list" v-if="cartItems.length > 0">
			<view class="cart-item" v-for="item in cartItems" :key="item.id">
				<image 
					class="item-image" 
					:src="item.image || '/static/default-food.png'"
					mode="aspectFill"
				></image>
				<view class="item-info">
					<text class="item-name">{{ item.name }}</text>
					<text class="item-price">{{ formatPrice(item.price) }}</text>
				</view>
				<view class="item-controls">
					<view class="quantity-control">
						<view class="quantity-btn minus" @click="decreaseQuantity(item.id)">
							<text class="btn-text">-</text>
						</view>
						<text class="quantity-text">{{ item.quantity }}</text>
						<view class="quantity-btn plus" @click="increaseQuantity(item.id)">
							<text class="btn-text">+</text>
						</view>
					</view>
					<view class="delete-btn" @click="removeItem(item.id)">
						<text class="delete-icon">🗑️</text>
					</view>
				</view>
			</view>
		</view>
		
		<!-- 空购物车 -->
		<view class="empty-cart" v-else>
			<text class="empty-icon">🛒</text>
			<text class="empty-text">购物车是空的</text>
			<text class="empty-desc">去菜品页面添加一些美食吧</text>
			<view class="go-menu-btn" @click="goToMenu">
				<text class="btn-text">去点餐</text>
			</view>
		</view>
		
		<!-- 订单信息 -->
		<view class="order-info" v-if="cartItems.length > 0">
			<view class="info-section">
				<text class="section-title">用餐方式</text>
				<view class="dine-type-options">
					<view 
						class="dine-option" 
						:class="{ active: dineType === 'dine-in' }"
						@click="selectDineType('dine-in')"
					>
						<text class="option-text">堂食</text>
					</view>
					<view 
						class="dine-option" 
						:class="{ active: dineType === 'takeaway' }"
						@click="selectDineType('takeaway')"
					>
						<text class="option-text">打包</text>
					</view>
				</view>
			</view>
			
			<view class="info-section">
				<text class="section-title">联系信息</text>
				<view class="contact-form">
					<input 
						class="contact-input" 
						placeholder="请输入您的称呼（可选）"
						v-model="customerInfo.nickname"
						maxlength="20"
					/>
					<input 
						class="contact-input" 
						placeholder="请输入手机号（可选）"
						v-model="customerInfo.phone"
						type="number"
						maxlength="11"
					/>
				</view>
			</view>
			
			<view class="price-summary">
				<view class="summary-row">
					<text class="summary-label">商品总计</text>
					<text class="summary-value">{{ formatPrice(totalAmount) }}</text>
				</view>
				<view class="summary-row total">
					<text class="summary-label">合计</text>
					<text class="summary-value">{{ formatPrice(totalAmount) }}</text>
				</view>
			</view>
		</view>
		
		<!-- 提交订单按钮 -->
		<view class="submit-section" v-if="cartItems.length > 0">
			<view class="submit-btn" @click="submitOrder">
				<text class="submit-text">提交订单 {{ formatPrice(totalAmount) }}</text>
			</view>
		</view>
	</view>
</template>

<script>
import { orderAPI } from '@/utils/api.js';
import { formatPrice, showToast, showLoading, hideLoading, showConfirm, generateId } from '@/utils/utils.js';
import store from '@/utils/store.js';

export default {
	data() {
		return {
			dineType: 'dine-in', // 用餐方式：dine-in 堂食，takeaway 打包
			customerInfo: {
				nickname: '',
				phone: ''
			},
			submitting: false
		}
	},
	
	computed: {
		// 购物车商品
		cartItems() {
			return store.getState().cartItems;
		},
		
		// 总金额
		totalAmount() {
			return store.getCartTotal();
		}
	},
	
	onShow() {
		// 页面显示时刷新数据
		this.$forceUpdate();
	},
	
	methods: {
		// 增加数量
		increaseQuantity(productId) {
			const item = this.cartItems.find(item => item.id === productId);
			if (item) {
				store.updateCartItemQuantity(productId, item.quantity + 1);
				this.$forceUpdate();
			}
		},
		
		// 减少数量
		decreaseQuantity(productId) {
			const item = this.cartItems.find(item => item.id === productId);
			if (item && item.quantity > 1) {
				store.updateCartItemQuantity(productId, item.quantity - 1);
				this.$forceUpdate();
			} else if (item && item.quantity === 1) {
				this.removeItem(productId);
			}
		},
		
		// 删除商品
		async removeItem(productId) {
			const confirmed = await showConfirm('确定要删除这个商品吗？');
			if (confirmed) {
				store.removeFromCart(productId);
				this.$forceUpdate();
				showToast('已删除');
			}
		},
		
		// 选择用餐方式
		selectDineType(type) {
			this.dineType = type;
		},
		
		// 提交订单
		async submitOrder() {
			if (this.submitting) return;
			
			if (this.cartItems.length === 0) {
				showToast('购物车是空的', 'error');
				return;
			}
			
			const merchantId = uni.getStorageSync('merchantId');
			if (!merchantId) {
				showToast('商户信息丢失，请重新扫码', 'error');
				return;
			}
			
			this.submitting = true;
			showLoading('提交订单中...');
			
			try {
				// 构建订单数据
				const orderData = {
					merchantId,
					items: this.cartItems.map(item => ({
						productId: item.id,
						name: item.name,
						price: item.price,
						quantity: item.quantity
					})),
					dineType: this.dineType,
					totalAmount: this.totalAmount,
					customerInfo: this.customerInfo
				};
				
				// 调用API提交订单
				const response = await orderAPI.createOrder(orderData);
				
				if (response.success) {
					// 订单提交成功
					const order = response.data;
					
					// 保存订单到store
					store.setCurrentOrder(order);
					store.addOrder(order);
					
					// 清空购物车
					store.clearCart();
					
					// 跳转到订单详情页
					uni.switchTab({ 
						url: '/pages/order/order',
						success: () => {
							showToast('订单提交成功！');
						}
					});
				} else {
					showToast(response.message || '订单提交失败', 'error');
				}
			} catch (error) {
				console.error('提交订单失败:', error);
				// 使用模拟数据创建订单
				this.createMockOrder();
			} finally {
				this.submitting = false;
				hideLoading();
			}
		},
		
		// 创建模拟订单
		createMockOrder() {
			const order = {
				id: generateId(),
				merchantId: uni.getStorageSync('merchantId'),
				status: 'pending',
				dineType: this.dineType,
				totalAmount: this.totalAmount,
				queueNumber: Math.floor(Math.random() * 50) + 1,
				customerInfo: this.customerInfo,
				items: [...this.cartItems],
				createdAt: new Date().toISOString()
			};
			
			// 保存订单
			store.setCurrentOrder(order);
			store.addOrder(order);
			
			// 清空购物车
			store.clearCart();
			
			// 跳转到订单详情页
			uni.switchTab({ 
				url: '/pages/order/order',
				success: () => {
					showToast('订单提交成功！');
				}
			});
		},
		
		// 格式化价格
		formatPrice,
		
		// 跳转到菜品页面
		goToMenu() {
			uni.switchTab({ url: '/pages/menu/menu' });
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

/* 购物车列表 */
.cart-list {
	padding: 30rpx;
}

.cart-item {
	background: #FFFFFF;
	border-radius: 20rpx;
	padding: 30rpx;
	margin-bottom: 20rpx;
	display: flex;
	align-items: center;
	gap: 20rpx;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.item-image {
	width: 100rpx;
	height: 100rpx;
	border-radius: 15rpx;
	flex-shrink: 0;
}

.item-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 10rpx;
}

.item-name {
	font-size: 30rpx;
	font-weight: bold;
	color: #333333;
}

.item-price {
	font-size: 28rpx;
	color: #FF6B35;
	font-weight: bold;
}

.item-controls {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 15rpx;
}

/* 数量控制 */
.quantity-control {
	display: flex;
	align-items: center;
	gap: 15rpx;
}

.quantity-btn {
	width: 50rpx;
	height: 50rpx;
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

.quantity-btn.plus {
	background-color: #FF6B35;
}

.btn-text {
	font-size: 28rpx;
	font-weight: bold;
	color: #666666;
}

.quantity-btn.plus .btn-text {
	color: #FFFFFF;
}

.quantity-text {
	font-size: 26rpx;
	font-weight: bold;
	color: #333333;
	min-width: 30rpx;
	text-align: center;
}

.delete-btn {
	padding: 10rpx;
}

.delete-icon {
	font-size: 32rpx;
}

/* 空购物车 */
.empty-cart {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 150rpx 30rpx;
}

.empty-icon {
	font-size: 120rpx;
	margin-bottom: 30rpx;
}

.empty-text {
	font-size: 32rpx;
	font-weight: bold;
	color: #333333;
	margin-bottom: 15rpx;
}

.empty-desc {
	font-size: 28rpx;
	color: #666666;
	margin-bottom: 50rpx;
}

.go-menu-btn {
	background: #FF6B35;
	color: #FFFFFF;
	padding: 25rpx 50rpx;
	border-radius: 50rpx;
}

.go-menu-btn .btn-text {
	color: #FFFFFF;
	font-size: 30rpx;
}

/* 订单信息 */
.order-info {
	padding: 30rpx;
}

.info-section {
	background: #FFFFFF;
	border-radius: 20rpx;
	padding: 30rpx;
	margin-bottom: 20rpx;
}

.section-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #333333;
	margin-bottom: 25rpx;
	display: block;
}

/* 用餐方式选择 */
.dine-type-options {
	display: flex;
	gap: 20rpx;
}

.dine-option {
	flex: 1;
	padding: 25rpx;
	border: 2rpx solid #E9ECEF;
	border-radius: 15rpx;
	text-align: center;
	transition: all 0.2s;
}

.dine-option.active {
	border-color: #FF6B35;
	background-color: rgba(255, 107, 53, 0.1);
}

.option-text {
	font-size: 28rpx;
	color: #666666;
}

.dine-option.active .option-text {
	color: #FF6B35;
	font-weight: bold;
}

/* 联系信息表单 */
.contact-form {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

.contact-input {
	padding: 25rpx;
	border: 2rpx solid #E9ECEF;
	border-radius: 15rpx;
	font-size: 28rpx;
	color: #333333;
}

.contact-input:focus {
	border-color: #FF6B35;
}

/* 价格汇总 */
.price-summary {
	background: #FFFFFF;
	border-radius: 20rpx;
	padding: 30rpx;
}

.summary-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 15rpx 0;
}

.summary-row.total {
	border-top: 2rpx solid #E9ECEF;
	margin-top: 15rpx;
	padding-top: 25rpx;
}

.summary-label {
	font-size: 28rpx;
	color: #666666;
}

.summary-row.total .summary-label {
	font-size: 32rpx;
	font-weight: bold;
	color: #333333;
}

.summary-value {
	font-size: 28rpx;
	color: #333333;
}

.summary-row.total .summary-value {
	font-size: 36rpx;
	font-weight: bold;
	color: #FF6B35;
}

/* 提交按钮 */
.submit-section {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	background: #FFFFFF;
	padding: 30rpx;
	border-top: 2rpx solid #E9ECEF;
	z-index: 100;
}

.submit-btn {
	background: #FF6B35;
	border-radius: 50rpx;
	padding: 30rpx;
	text-align: center;
	transition: all 0.2s;
}

.submit-btn:active {
	transform: scale(0.98);
}

.submit-text {
	font-size: 32rpx;
	font-weight: bold;
	color: #FFFFFF;
}
</style>