<script>
import store from '@/utils/store.js';

export default {
	onLaunch: function() {
		console.log('烧烤摆摊点单小程序启动');
		
		// 初始化全局状态
		store.init();
		
		// 检查登录状态
		const token = uni.getStorageSync('token');
		if (token) {
			const userInfo = uni.getStorageSync('userInfo');
			if (userInfo) {
				store.setUserInfo(JSON.parse(userInfo));
			}
		}
		
		// 恢复购物车数据
		const cartData = uni.getStorageSync('cart');
		if (cartData) {
			try {
				const cart = JSON.parse(cartData);
				store.setCart(cart);
			} catch (error) {
				console.error('恢复购物车数据失败:', error);
			}
		}
	},
	
	onShow: function() {
		console.log('App Show');
	},
	
	onHide: function() {
		console.log('App Hide');
		// 保存状态到本地存储
		const state = store.getState();
		if (state.cart && state.cart.length > 0) {
			uni.setStorageSync('cart', JSON.stringify(state.cart));
		}
	}
}
</script>

<style>
/* 全局样式重置 */
* {
	box-sizing: border-box;
}

page {
	background-color: #F8F9FA;
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
	line-height: 1.6;
	color: #333333;
}

/* 通用工具类 */
.flex {
	display: flex;
}

.flex-center {
	display: flex;
	align-items: center;
	justify-content: center;
}

.flex-between {
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.flex-column {
	display: flex;
	flex-direction: column;
}

.text-center {
	text-align: center;
}

.text-left {
	text-align: left;
}

.text-right {
	text-align: right;
}

.font-bold {
	font-weight: bold;
}

.text-primary {
	color: #FF6B35;
}

.text-success {
	color: #52C41A;
}

.text-warning {
	color: #FA8C16;
}

.text-error {
	color: #FF4D4F;
}

.text-gray {
	color: #666666;
}

.text-light {
	color: #999999;
}

/* 边距工具类 */
.m-0 { margin: 0; }
.mt-10 { margin-top: 10rpx; }
.mt-20 { margin-top: 20rpx; }
.mt-30 { margin-top: 30rpx; }
.mb-10 { margin-bottom: 10rpx; }
.mb-20 { margin-bottom: 20rpx; }
.mb-30 { margin-bottom: 30rpx; }
.ml-10 { margin-left: 10rpx; }
.ml-20 { margin-left: 20rpx; }
.mr-10 { margin-right: 10rpx; }
.mr-20 { margin-right: 20rpx; }

.p-0 { padding: 0; }
.pt-10 { padding-top: 10rpx; }
.pt-20 { padding-top: 20rpx; }
.pt-30 { padding-top: 30rpx; }
.pb-10 { padding-bottom: 10rpx; }
.pb-20 { padding-bottom: 20rpx; }
.pb-30 { padding-bottom: 30rpx; }
.pl-10 { padding-left: 10rpx; }
.pl-20 { padding-left: 20rpx; }
.pr-10 { padding-right: 10rpx; }
.pr-20 { padding-right: 20rpx; }

/* 通用按钮样式 */
.btn {
	padding: 20rpx 40rpx;
	border-radius: 15rpx;
	font-size: 28rpx;
	font-weight: bold;
	text-align: center;
	transition: all 0.2s;
	border: none;
	outline: none;
}

.btn:active {
	transform: scale(0.98);
}

.btn-primary {
	background-color: #FF6B35;
	color: #FFFFFF;
}

.btn-success {
	background-color: #52C41A;
	color: #FFFFFF;
}

.btn-warning {
	background-color: #FA8C16;
	color: #FFFFFF;
}

.btn-error {
	background-color: #FF4D4F;
	color: #FFFFFF;
}

.btn-default {
	background-color: #F8F9FA;
	color: #666666;
	border: 1rpx solid #E9ECEF;
}

/* 卡片样式 */
.card {
	background: #FFFFFF;
	border-radius: 20rpx;
	padding: 30rpx;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
	margin-bottom: 20rpx;
}

/* 分割线 */
.divider {
	height: 1rpx;
	background-color: #F8F9FA;
	margin: 20rpx 0;
}

/* 加载状态 */
.loading {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 50rpx;
	color: #999999;
}

/* 空状态 */
.empty {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 100rpx 50rpx;
	color: #999999;
}

.empty-icon {
	font-size: 120rpx;
	margin-bottom: 30rpx;
}

.empty-text {
	font-size: 28rpx;
	color: #666666;
}

/* 响应式字体 */
@media (max-width: 750rpx) {
	page {
		font-size: 28rpx;
	}
}

/* 安全区域适配 */
.safe-area-inset-bottom {
	padding-bottom: constant(safe-area-inset-bottom);
	padding-bottom: env(safe-area-inset-bottom);
}

.safe-area-inset-top {
	padding-top: constant(safe-area-inset-top);
	padding-top: env(safe-area-inset-top);
}
</style>
