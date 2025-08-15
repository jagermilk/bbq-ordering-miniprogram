<template>
	<view class="container">
		<!-- 头部欢迎区域 -->
		<view class="header">
			<view class="welcome-section">
				<text class="welcome-text">欢迎回来</text>
				<text class="merchant-name">{{ merchantName }}</text>
				<text class="current-time">{{ currentTime }}</text>
			</view>
			<view class="logout-btn" @click="handleLogout">
				<text class="logout-icon">🚪</text>
				<text class="logout-text">退出</text>
			</view>
		</view>

		<!-- 快速统计卡片 -->
		<view class="stats-overview">
			<view class="stat-card">
				<text class="stat-number">{{ todayOrders }}</text>
				<text class="stat-label">今日订单</text>
			</view>
			<view class="stat-card">
				<text class="stat-number">{{ todayRevenue }}</text>
				<text class="stat-label">今日营收</text>
			</view>
			<view class="stat-card">
				<text class="stat-number">{{ totalProducts }}</text>
				<text class="stat-label">菜品总数</text>
			</view>
		</view>

		<!-- 功能导航区域 -->
		<view class="function-nav">
			<text class="nav-title">商户管理</text>
			<view class="nav-grid">
				<view class="nav-item" @click="navigateToProducts">
					<view class="nav-icon-wrapper">
						<text class="nav-icon">🍽️</text>
					</view>
					<text class="nav-text">菜品管理</text>
					<text class="nav-desc">管理菜品信息、价格、库存</text>
				</view>
				
				<view class="nav-item" @click="navigateToOrders">
					<view class="nav-icon-wrapper">
						<text class="nav-icon">📋</text>
					</view>
					<text class="nav-text">订单管理</text>
					<text class="nav-desc">查看和处理客户订单</text>
				</view>
				
				<view class="nav-item" @click="navigateToStats">
					<view class="nav-icon-wrapper">
						<text class="nav-icon">📊</text>
					</view>
					<text class="nav-text">数据统计</text>
					<text class="nav-desc">查看营收和销售数据</text>
				</view>
			</view>
		</view>

		<!-- 快捷操作区域 -->
		<view class="quick-actions">
			<text class="actions-title">快捷操作</text>
			<view class="actions-list">
				<view class="action-item" @click="quickAddProduct">
					<text class="action-icon">➕</text>
					<text class="action-text">添加菜品</text>
				</view>
				<view class="action-item" @click="viewPendingOrders">
					<text class="action-icon">⏰</text>
					<text class="action-text">待处理订单</text>
					<view class="badge" v-if="pendingOrdersCount > 0">
						<text class="badge-text">{{ pendingOrdersCount }}</text>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { mapState, mapActions } from 'vuex'

export default {
	name: 'MerchantIndex',
	data() {
		return {
			currentTime: '',
			todayOrders: 0,
			todayRevenue: '¥0',
			totalProducts: 0,
			pendingOrdersCount: 0
		}
	},
	computed: {
		...mapState(['user']),
		merchantName() {
			return this.user?.name || '商户'
		}
	},
	onLoad() {
		this.updateCurrentTime()
		this.loadDashboardData()
		// 每分钟更新一次时间
		this.timeInterval = setInterval(() => {
			this.updateCurrentTime()
		}, 60000)
	},
	onUnload() {
		if (this.timeInterval) {
			clearInterval(this.timeInterval)
		}
	},
	methods: {
		...mapActions(['logout']),
		
		updateCurrentTime() {
			const now = new Date()
			const hours = now.getHours().toString().padStart(2, '0')
			const minutes = now.getMinutes().toString().padStart(2, '0')
			const month = (now.getMonth() + 1).toString().padStart(2, '0')
			const day = now.getDate().toString().padStart(2, '0')
			this.currentTime = `${month}月${day}日 ${hours}:${minutes}`
		},
		
		async loadDashboardData() {
			try {
				// 加载今日统计数据
				const today = new Date().toISOString().split('T')[0]
				
				// 获取今日订单数据
				const ordersRes = await this.$api.getOrders({
					date: today
				})
				
				if (ordersRes.success) {
					this.todayOrders = ordersRes.data.length
					this.pendingOrdersCount = ordersRes.data.filter(order => order.status === 'pending').length
					
					// 计算今日营收
					const revenue = ordersRes.data
						.filter(order => order.status !== 'cancelled')
						.reduce((sum, order) => sum + order.totalAmount, 0)
					this.todayRevenue = `¥${revenue.toFixed(2)}`
				}
				
				// 获取菜品总数
				const productsRes = await this.$api.getProducts()
				if (productsRes.success) {
					this.totalProducts = productsRes.data.length
				}
			} catch (error) {
				console.error('加载仪表板数据失败:', error)
			}
		},
		
		// 导航方法
		navigateToProducts() {
			uni.navigateTo({
				url: '/pages/merchant/product'
			})
		},
		
		navigateToOrders() {
			uni.navigateTo({
				url: '/pages/merchant/order'
			})
		},
		
		navigateToStats() {
			uni.navigateTo({
				url: '/pages/merchant/stats'
			})
		},
		
		// 快捷操作方法
		quickAddProduct() {
			uni.navigateTo({
				url: '/pages/merchant/product?action=add'
			})
		},
		
		viewPendingOrders() {
			uni.navigateTo({
				url: '/pages/merchant/order?filter=pending'
			})
		},
		
		async handleLogout() {
			try {
				await uni.showModal({
					title: '确认退出',
					content: '确定要退出登录吗？',
					confirmText: '退出',
					cancelText: '取消'
				})
				
				await this.logout()
				uni.reLaunch({
					url: '/pages/login/login'
				})
			} catch (error) {
				if (error.cancel) {
					return // 用户取消退出
				}
				console.error('退出登录失败:', error)
			}
		}
	}
}
</script>

<style scoped>
.container {
	min-height: 100vh;
	background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%);
	padding: 0;
}

/* 头部区域 */
.header {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	padding: 60rpx 40rpx 40rpx;
	color: white;
}

.welcome-section {
	display: flex;
	flex-direction: column;
}

.welcome-text {
	font-size: 28rpx;
	opacity: 0.9;
	margin-bottom: 8rpx;
}

.merchant-name {
	font-size: 48rpx;
	font-weight: bold;
	margin-bottom: 8rpx;
}

.current-time {
	font-size: 24rpx;
	opacity: 0.8;
}

.logout-btn {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 16rpx;
	border-radius: 12rpx;
	background: rgba(255, 255, 255, 0.2);
	backdrop-filter: blur(10rpx);
}

.logout-icon {
	font-size: 32rpx;
	margin-bottom: 4rpx;
}

.logout-text {
	font-size: 20rpx;
}

/* 统计卡片 */
.stats-overview {
	display: flex;
	gap: 20rpx;
	padding: 0 40rpx 40rpx;
}

.stat-card {
	flex: 1;
	background: rgba(255, 255, 255, 0.95);
	border-radius: 16rpx;
	padding: 32rpx 24rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.1);
}

.stat-number {
	font-size: 36rpx;
	font-weight: bold;
	color: #FF6B35;
	margin-bottom: 8rpx;
}

.stat-label {
	font-size: 24rpx;
	color: #666;
}

/* 功能导航区域 */
.function-nav {
	background: white;
	border-radius: 32rpx 32rpx 0 0;
	padding: 40rpx;
	margin-top: 20rpx;
	flex: 1;
}

.nav-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 32rpx;
}

.nav-grid {
	display: flex;
	flex-direction: column;
	gap: 24rpx;
}

.nav-item {
	display: flex;
	align-items: center;
	padding: 32rpx 24rpx;
	background: #F8F9FA;
	border-radius: 16rpx;
	border: 2rpx solid transparent;
	transition: all 0.3s ease;
}

.nav-item:active {
	background: #E3F2FD;
	border-color: #FF6B35;
	transform: scale(0.98);
}

.nav-icon-wrapper {
	width: 80rpx;
	height: 80rpx;
	border-radius: 16rpx;
	background: linear-gradient(135deg, #FF6B35, #F7931E);
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 24rpx;
}

.nav-icon {
	font-size: 36rpx;
}

.nav-text {
	font-size: 28rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 4rpx;
}

.nav-desc {
	font-size: 22rpx;
	color: #666;
}

/* 快捷操作区域 */
.quick-actions {
	padding: 0 40rpx 40rpx;
}

.actions-title {
	font-size: 28rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 24rpx;
}

.actions-list {
	display: flex;
	gap: 20rpx;
}

.action-item {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 24rpx 16rpx;
	background: #F8F9FA;
	border-radius: 12rpx;
	position: relative;
	transition: all 0.3s ease;
}

.action-item:active {
	background: #E3F2FD;
	transform: scale(0.95);
}

.action-icon {
	font-size: 32rpx;
	margin-bottom: 8rpx;
}

.action-text {
	font-size: 22rpx;
	color: #333;
}

.badge {
	position: absolute;
	top: 16rpx;
	right: 16rpx;
	background: #FF4444;
	border-radius: 20rpx;
	min-width: 32rpx;
	height: 32rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.badge-text {
	font-size: 18rpx;
	color: white;
	font-weight: bold;
}
</style>