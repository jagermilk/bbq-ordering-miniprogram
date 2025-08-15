<template>
	<view class="container">
		<view class="header">
			<image class="logo" src="/static/logo.png"></image>
			<text class="title">烧烤摆摊点单小程序</text>
			<text class="subtitle">扫码点餐，便捷高效</text>
		</view>
		
		<view class="role-selection">
			<view class="role-card customer-card">
				<view class="role-icon customer-icon">👤</view>
				<text class="role-title">顾客点餐</text>
				<text class="role-desc">选择点餐方式</text>
				
				<view class="customer-options">
					<view class="option-btn scan-btn" @click="scanQRCode">
						<text class="option-icon">📱</text>
						<text class="option-text">扫码点餐</text>
					</view>
					<view class="option-btn search-btn" @click="searchMerchant">
						<text class="option-icon">🔍</text>
						<text class="option-text">搜索商户</text>
					</view>
				</view>
			</view>
			
			<view class="role-card" @click="enterAsMerchant">
				<view class="role-icon merchant-icon">🏪</view>
				<text class="role-title">商户管理</text>
				<text class="role-desc">登录管理后台</text>
			</view>
		</view>
		
		<view class="features">
			<view class="feature-item">
				<text class="feature-icon">📱</text>
				<text class="feature-text">扫码点餐</text>
			</view>
			<view class="feature-item">
				<text class="feature-icon">🛒</text>
				<text class="feature-text">购物车管理</text>
			</view>
			<view class="feature-item">
				<text class="feature-icon">📊</text>
				<text class="feature-text">订单跟踪</text>
			</view>
		</view>
	</view>
</template>

<script>
import { navigateTo, switchTab, showToast } from '@/utils/utils.js';

export default {
	data() {
		return {
			title: '烧烤摆摊点单小程序'
		}
	},
	
	onLoad(options) {
		// 检查是否通过扫码进入
		if (options.merchantId) {
			// 保存商户ID并直接跳转到菜品列表
			uni.setStorageSync('merchantId', options.merchantId);
			this.enterAsCustomer();
		}
	},
	
	methods: {
		// 进入商户模式
		enterAsMerchant() {
			navigateTo('/pages/login/login');
		},
		
		// 扫描二维码
		scanQRCode() {
			uni.scanCode({
				success: (res) => {
					try {
						// 解析二维码内容，提取商户ID
						const url = new URL(res.result);
						const merchantId = url.searchParams.get('merchantId');
						
						if (merchantId) {
							uni.setStorageSync('merchantId', merchantId);
							switchTab('/pages/menu/menu');
						} else {
							showToast('无效的二维码', 'error');
						}
					} catch (error) {
						// 如果不是URL格式，直接当作商户ID使用
						if (res.result) {
							uni.setStorageSync('merchantId', res.result);
							switchTab('/pages/menu/menu');
						} else {
							showToast('无效的二维码', 'error');
						}
					}
				},
				fail: () => {
					showToast('扫码失败，请重试', 'error');
				}
			});
		},
		
		// 搜索商户
		searchMerchant() {
			navigateTo('/pages/merchant-search/merchant-search');
		}
	}
}
</script>

<style scoped>
.container {
	min-height: 100vh;
	background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%);
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 60rpx 40rpx;
}

.header {
	text-align: center;
	margin-bottom: 80rpx;
}

.logo {
	width: 160rpx;
	height: 160rpx;
	border-radius: 20rpx;
	margin-bottom: 30rpx;
}

.title {
	font-size: 48rpx;
	font-weight: bold;
	color: #FFFFFF;
	display: block;
	margin-bottom: 20rpx;
}

.subtitle {
	font-size: 28rpx;
	color: rgba(255, 255, 255, 0.8);
	display: block;
}

.role-selection {
	display: flex;
	flex-direction: column;
	gap: 30rpx;
	width: 100%;
	margin-bottom: 80rpx;
}

.role-card {
	background: #FFFFFF;
	border-radius: 20rpx;
	padding: 40rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.1);
	transition: transform 0.2s;
}

.role-card:active {
	transform: scale(0.98);
}

.customer-card {
	padding-bottom: 20rpx;
}

.customer-options {
	display: flex;
	gap: 20rpx;
	margin-top: 30rpx;
	width: 100%;
}

.option-btn {
	flex: 1;
	background: #F5F5F5;
	border-radius: 12rpx;
	padding: 20rpx 15rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8rpx;
	transition: all 0.2s;
}

.option-btn:active {
	transform: scale(0.95);
}

.scan-btn {
	background: linear-gradient(135deg, #4CAF50, #45A049);
}

.scan-btn .option-icon,
.scan-btn .option-text {
	color: #FFFFFF;
}

.search-btn {
	background: linear-gradient(135deg, #2196F3, #1976D2);
}

.search-btn .option-icon,
.search-btn .option-text {
	color: #FFFFFF;
}

.option-icon {
	font-size: 32rpx;
}

.option-text {
	font-size: 24rpx;
	font-weight: 500;
}

.role-icon {
	font-size: 80rpx;
	margin-bottom: 20rpx;
	width: 120rpx;
	height: 120rpx;
	border-radius: 60rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.customer-icon {
	background: linear-gradient(135deg, #4CAF50, #45A049);
}

.merchant-icon {
	background: linear-gradient(135deg, #2196F3, #1976D2);
}

.role-title {
	font-size: 36rpx;
	font-weight: bold;
	color: #333333;
	margin-bottom: 10rpx;
	display: block;
}

.role-desc {
	font-size: 28rpx;
	color: #666666;
	display: block;
}

.features {
	display: flex;
	justify-content: space-around;
	width: 100%;
	max-width: 600rpx;
}

.feature-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 10rpx;
}

.feature-icon {
	font-size: 48rpx;
	margin-bottom: 10rpx;
}

.feature-text {
	font-size: 24rpx;
	color: rgba(255, 255, 255, 0.9);
	text-align: center;
}
</style>
