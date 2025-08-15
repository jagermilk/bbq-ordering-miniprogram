<template>
	<view class="container">
		<view class="header">
			<view class="back-btn" @click="goBack">
				<text class="back-icon">←</text>
			</view>
			<text class="title">搜索商户</text>
		</view>
		
		<view class="search-section">
			<view class="search-box">
				<input 
					v-model="keyword" 
					class="search-input" 
					placeholder="请输入商户名称" 
					@input="onInput"
					@confirm="searchMerchants"
					confirm-type="search"
					:focus="false"
				/>
				<view class="search-btn" @click="searchMerchants">
					<text class="search-icon">🔍</text>
				</view>
			</view>
		</view>
		
		<view class="content">
			<!-- 加载状态 -->
			<view v-if="loading" class="loading">
				<text class="loading-text">搜索中...</text>
			</view>
			
			<!-- 搜索结果 -->
			<view v-else-if="merchants.length > 0" class="merchant-list">
				<view 
					v-for="merchant in merchants" 
					:key="merchant.id" 
					class="merchant-item"
					@click="selectMerchant(merchant)"
				>
					<view class="merchant-avatar">
						<image v-if="merchant.avatar" :src="merchant.avatar" class="avatar-img"></image>
						<text v-else class="avatar-placeholder">🏪</text>
					</view>
					<view class="merchant-info">
						<text class="merchant-name">{{ merchant.name }}</text>
						<text v-if="merchant.description" class="merchant-desc">{{ merchant.description }}</text>
						<view class="merchant-meta">
							<text v-if="merchant.address" class="meta-item">📍 {{ merchant.address }}</text>
							<text v-if="merchant.totalOrders > 0" class="meta-item">📊 {{ merchant.totalOrders }}单</text>
						</view>
					</view>
					<view class="select-btn">
						<text class="select-text">选择</text>
					</view>
				</view>
			</view>
			
			<!-- 空状态 -->
			<view v-else-if="searched && !loading" class="empty-state">
				<text class="empty-icon">🔍</text>
				<text class="empty-text">未找到相关商户</text>
				<text class="empty-tip">请尝试其他关键词</text>
			</view>
			
			<!-- 初始状态 -->
			<view v-else class="initial-state">
				<text class="initial-icon">🏪</text>
				<text class="initial-text">输入商户名称开始搜索</text>
				<text class="initial-tip">支持商户名称和描述搜索</text>
			</view>
		</view>
	</view>
</template>

<script>
import { navigateTo, switchTab, showToast } from '@/utils/utils.js';
import { request } from '@/utils/api.js';

export default {
	data() {
		return {
			keyword: '',
			merchants: [],
			loading: false,
			searched: false
		}
	},
	
	methods: {
		// 返回上一页
		goBack() {
			uni.navigateBack();
		},
		
		// 输入事件
		onInput(e) {
			this.keyword = e.detail.value;
		},
		
		// 搜索商户
		async searchMerchants() {
			if (!this.keyword.trim()) {
				showToast('请输入商户名称', 'error');
				return;
			}
			
			this.loading = true;
			this.searched = true;
			
			try {
				const response = await request('/auth/merchants/search', {
					method: 'GET',
					data: {
						keyword: this.keyword.trim(),
						limit: 20
					}
				});
				
				if (response.success) {
					this.merchants = response.data.merchants || [];
				} else {
					showToast(response.message || '搜索失败', 'error');
					this.merchants = [];
				}
			} catch (error) {
				console.error('搜索商户失败:', error);
				showToast('搜索失败，请稍后重试', 'error');
				this.merchants = [];
			} finally {
				this.loading = false;
			}
		},
		
		// 选择商户
		selectMerchant(merchant) {
			// 保存商户ID
			uni.setStorageSync('merchantId', merchant.id);
			
			// 跳转到菜品页面
			switchTab('/pages/menu/menu');
		}
	}
}
</script>

<style scoped>
.container {
	min-height: 100vh;
	background: #F8F9FA;
}

.header {
	display: flex;
	align-items: center;
	padding: 20rpx 30rpx;
	background: #FFFFFF;
	border-bottom: 1rpx solid #E5E5E5;
	position: sticky;
	top: 0;
	z-index: 100;
}

.back-btn {
	width: 60rpx;
	height: 60rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 50%;
	background: #F5F5F5;
	margin-right: 20rpx;
}

.back-icon {
	font-size: 32rpx;
	color: #333333;
	font-weight: bold;
}

.title {
	font-size: 36rpx;
	font-weight: bold;
	color: #333333;
}

.search-section {
	padding: 30rpx;
	background: #FFFFFF;
	border-bottom: 1rpx solid #E5E5E5;
}

.search-box {
	display: flex;
	align-items: center;
	background: #F5F5F5;
	border-radius: 25rpx;
	padding: 0 20rpx;
	height: 80rpx;
}

.search-input {
	flex: 1;
	font-size: 28rpx;
	color: #333333;
	height: 100%;
}

.search-btn {
	width: 60rpx;
	height: 60rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background: linear-gradient(135deg, #2196F3, #1976D2);
	border-radius: 50%;
	margin-left: 10rpx;
}

.search-icon {
	font-size: 24rpx;
	color: #FFFFFF;
}

.content {
	padding: 30rpx;
}

.loading {
	display: flex;
	justify-content: center;
	padding: 100rpx 0;
}

.loading-text {
	font-size: 28rpx;
	color: #666666;
}

.merchant-list {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

.merchant-item {
	background: #FFFFFF;
	border-radius: 16rpx;
	padding: 30rpx;
	display: flex;
	align-items: center;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
	transition: transform 0.2s;
}

.merchant-item:active {
	transform: scale(0.98);
}

.merchant-avatar {
	width: 100rpx;
	height: 100rpx;
	border-radius: 50%;
	margin-right: 20rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #F5F5F5;
	overflow: hidden;
}

.avatar-img {
	width: 100%;
	height: 100%;
	border-radius: 50%;
}

.avatar-placeholder {
	font-size: 40rpx;
}

.merchant-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 8rpx;
}

.merchant-name {
	font-size: 32rpx;
	font-weight: bold;
	color: #333333;
}

.merchant-desc {
	font-size: 26rpx;
	color: #666666;
	max-width: 400rpx;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.merchant-meta {
	display: flex;
	gap: 20rpx;
}

.meta-item {
	font-size: 24rpx;
	color: #999999;
}

.select-btn {
	background: linear-gradient(135deg, #4CAF50, #45A049);
	border-radius: 20rpx;
	padding: 12rpx 24rpx;
}

.select-text {
	font-size: 26rpx;
	color: #FFFFFF;
	font-weight: 500;
}

.empty-state,
.initial-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 120rpx 0;
	gap: 20rpx;
}

.empty-icon,
.initial-icon {
	font-size: 120rpx;
	opacity: 0.3;
}

.empty-text,
.initial-text {
	font-size: 32rpx;
	color: #666666;
	font-weight: 500;
}

.empty-tip,
.initial-tip {
	font-size: 26rpx;
	color: #999999;
}
</style>