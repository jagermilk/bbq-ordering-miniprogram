<template>
	<view class="cart-float" v-if="cartCount > 0" @click="goToCart">
		<view class="cart-icon-wrapper">
			<text class="cart-icon">🛒</text>
			<view class="cart-badge" v-if="cartCount > 0">
				<text class="badge-text">{{ cartCount > 99 ? '99+' : cartCount }}</text>
			</view>
		</view>
		
		<view class="cart-info">
			<text class="cart-total">{{ formatPrice(cartTotal) }}</text>
			<text class="cart-text">去结算</text>
		</view>
		
		<view class="cart-arrow">
			<text class="arrow-icon">→</text>
		</view>
	</view>
</template>

<script>
import { formatPrice, navigateTo } from '@/utils/utils.js';
import store from '@/utils/store.js';

export default {
	name: 'CartFloat',
	props: {
		// 是否显示
		show: {
			type: Boolean,
			default: true
		},
		// 自定义样式
		customStyle: {
			type: Object,
			default: () => ({})
		}
	},
	
	data() {
		return {
			cartItems: [],
			storeUnsubscribe: null
		}
	},
	
	computed: {
		// 购物车商品数量
		cartCount() {
			return this.cartItems.reduce((total, item) => total + item.quantity, 0);
		},
		
		// 购物车总价
		cartTotal() {
			return this.cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
		}
	},
	
	mounted() {
		// 订阅购物车状态变化
		this.subscribeToStore();
		// 初始化购物车数据
		this.updateCartItems();
	},
	
	beforeDestroy() {
		// 取消订阅
		if (this.storeUnsubscribe) {
			this.storeUnsubscribe();
		}
	},
	
	methods: {
		// 订阅store状态变化
		subscribeToStore() {
			// 监听购物车变化
			this.storeUnsubscribe = store.subscribe((state) => {
				this.cartItems = state.cart || [];
			});
		},
		
		// 更新购物车商品
		updateCartItems() {
			const state = store.getState();
			this.cartItems = state.cart || [];
		},
		
		// 跳转到购物车页面
		goToCart() {
			if (this.cartCount === 0) return;
			
			// 添加点击动画效果
			this.animateClick();
			
			// 延迟跳转，让动画完成
			setTimeout(() => {
				navigateTo('/pages/cart/cart');
			}, 150);
		},
		
		// 点击动画
		animateClick() {
			const cartFloat = this.$el;
			if (cartFloat) {
				cartFloat.style.transform = 'scale(0.95)';
				setTimeout(() => {
					cartFloat.style.transform = 'scale(1)';
				}, 150);
			}
		},
		
		// 工具函数
		formatPrice
	}
}
</script>

<style scoped>
.cart-float {
	position: fixed;
	bottom: 120rpx;
	left: 30rpx;
	right: 30rpx;
	height: 100rpx;
	background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%);
	border-radius: 50rpx;
	display: flex;
	align-items: center;
	padding: 0 30rpx;
	box-shadow: 0 8rpx 24rpx rgba(255, 107, 53, 0.4);
	z-index: 999;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.cart-float:active {
	transform: scale(0.95);
}

.cart-icon-wrapper {
	position: relative;
	margin-right: 20rpx;
}

.cart-icon {
	font-size: 48rpx;
	line-height: 1;
}

.cart-badge {
	position: absolute;
	top: -10rpx;
	right: -10rpx;
	min-width: 36rpx;
	height: 36rpx;
	background-color: #FF4D4F;
	border-radius: 18rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 0 8rpx;
	border: 3rpx solid #FFFFFF;
}

.badge-text {
	font-size: 20rpx;
	color: #FFFFFF;
	font-weight: bold;
	line-height: 1;
}

.cart-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 4rpx;
}

.cart-total {
	font-size: 32rpx;
	font-weight: bold;
	color: #FFFFFF;
	line-height: 1.2;
}

.cart-text {
	font-size: 24rpx;
	color: rgba(255, 255, 255, 0.9);
	line-height: 1;
}

.cart-arrow {
	margin-left: 20rpx;
}

.arrow-icon {
	font-size: 32rpx;
	color: #FFFFFF;
	font-weight: bold;
	line-height: 1;
}

/* 动画效果 */
@keyframes bounce {
	0%, 20%, 50%, 80%, 100% {
		transform: translateY(0);
	}
	40% {
		transform: translateY(-10rpx);
	}
	60% {
		transform: translateY(-5rpx);
	}
}

.cart-float.bounce {
	animation: bounce 0.6s;
}

/* 购物车图标旋转动画 */
@keyframes cartRotate {
	0% {
		transform: rotate(0deg);
	}
	25% {
		transform: rotate(-5deg);
	}
	75% {
		transform: rotate(5deg);
	}
	100% {
		transform: rotate(0deg);
	}
}

.cart-icon-wrapper:active .cart-icon {
	animation: cartRotate 0.3s;
}

/* 徽章缩放动画 */
@keyframes badgeScale {
	0% {
		transform: scale(1);
	}
	50% {
		transform: scale(1.2);
	}
	100% {
		transform: scale(1);
	}
}

.cart-badge.animate {
	animation: badgeScale 0.3s;
}

/* 响应式调整 */
@media (max-width: 750rpx) {
	.cart-float {
		height: 90rpx;
		padding: 0 25rpx;
		bottom: 100rpx;
	}
	
	.cart-icon {
		font-size: 40rpx;
	}
	
	.cart-total {
		font-size: 28rpx;
	}
	
	.cart-text {
		font-size: 22rpx;
	}
	
	.arrow-icon {
		font-size: 28rpx;
	}
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
	.cart-float {
		background: linear-gradient(135deg, #E65100 0%, #FF8F00 100%);
		box-shadow: 0 8rpx 24rpx rgba(230, 81, 0, 0.4);
	}
}

/* 高对比度模式 */
@media (prefers-contrast: high) {
	.cart-float {
		border: 2rpx solid #000000;
	}
	
	.cart-badge {
		border: 2rpx solid #000000;
	}
}

/* 减少动画模式 */
@media (prefers-reduced-motion: reduce) {
	.cart-float {
		transition: none;
	}
	
	.cart-icon-wrapper:active .cart-icon {
		animation: none;
	}
	
	.cart-badge.animate {
		animation: none;
	}
	
	.cart-float.bounce {
		animation: none;
	}
}
</style>