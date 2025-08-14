<template>
	<view class="container">
		<!-- 头部 -->
		<view class="header">
			<view class="header-info">
				<text class="title">数据统计</text>
				<text class="subtitle">经营数据一目了然</text>
			</view>
			<view class="date-selector" @click="showDatePicker">
				<text class="date-text">{{ selectedDateText }}</text>
				<text class="date-icon">📅</text>
			</view>
		</view>
		
		<!-- 核心指标卡片 -->
		<view class="metrics-cards">
			<view class="metric-card revenue">
				<view class="metric-icon">💰</view>
				<view class="metric-info">
					<text class="metric-value">{{ formatPrice(stats.totalRevenue) }}</text>
					<text class="metric-label">总营收</text>
					<text class="metric-change" :class="{ positive: stats.revenueChange >= 0 }">
						{{ stats.revenueChange >= 0 ? '+' : '' }}{{ stats.revenueChange }}%
					</text>
				</view>
			</view>
			
			<view class="metric-card orders">
				<view class="metric-icon">📋</view>
				<view class="metric-info">
					<text class="metric-value">{{ stats.totalOrders }}</text>
					<text class="metric-label">订单数</text>
					<text class="metric-change" :class="{ positive: stats.ordersChange >= 0 }">
						{{ stats.ordersChange >= 0 ? '+' : '' }}{{ stats.ordersChange }}%
					</text>
				</view>
			</view>
		</view>
		
		<view class="metrics-cards">
			<view class="metric-card customers">
				<view class="metric-icon">👥</view>
				<view class="metric-info">
					<text class="metric-value">{{ stats.totalCustomers }}</text>
					<text class="metric-label">顾客数</text>
					<text class="metric-change" :class="{ positive: stats.customersChange >= 0 }">
						{{ stats.customersChange >= 0 ? '+' : '' }}{{ stats.customersChange }}%
					</text>
				</view>
			</view>
			
			<view class="metric-card avg-order">
				<view class="metric-icon">📊</view>
				<view class="metric-info">
					<text class="metric-value">{{ formatPrice(stats.avgOrderValue) }}</text>
					<text class="metric-label">客单价</text>
					<text class="metric-change" :class="{ positive: stats.avgOrderChange >= 0 }">
						{{ stats.avgOrderChange >= 0 ? '+' : '' }}{{ stats.avgOrderChange }}%
					</text>
				</view>
			</view>
		</view>
		
		<!-- 趋势图表 -->
		<view class="chart-section">
			<view class="section-header">
				<text class="section-title">营收趋势</text>
				<view class="chart-tabs">
					<view 
						class="chart-tab" 
						:class="{ active: chartType === 'revenue' }"
						@click="setChartType('revenue')"
					>
						<text class="tab-text">营收</text>
					</view>
					<view 
						class="chart-tab" 
						:class="{ active: chartType === 'orders' }"
						@click="setChartType('orders')"
					>
						<text class="tab-text">订单</text>
					</view>
				</view>
			</view>
			
			<view class="chart-container">
				<!-- 简化的图表展示 -->
				<view class="simple-chart">
					<view class="chart-bars">
						<view 
							class="chart-bar" 
							v-for="(item, index) in chartData" 
							:key="index"
							:style="{ height: item.height + '%' }"
						></view>
					</view>
					<view class="chart-labels">
						<text 
							class="chart-label" 
							v-for="(item, index) in chartData" 
							:key="index"
						>
							{{ item.label }}
						</text>
					</view>
				</view>
			</view>
		</view>
		
		<!-- 热销商品 -->
		<view class="popular-products">
			<view class="section-header">
				<text class="section-title">热销商品</text>
				<text class="section-subtitle">TOP 5</text>
			</view>
			
			<view class="product-list">
				<view 
					class="product-item" 
					v-for="(product, index) in popularProducts" 
					:key="index"
				>
					<view class="product-rank" :class="getRankClass(index)">
						<text class="rank-number">{{ index + 1 }}</text>
					</view>
					<image 
						class="product-image" 
						:src="product.image || '/static/default-food.png'"
						mode="aspectFill"
					></image>
					<view class="product-info">
						<text class="product-name">{{ product.name }}</text>
						<text class="product-sales">销量：{{ product.sales }}份</text>
					</view>
					<view class="product-revenue">
						<text class="revenue-amount">{{ formatPrice(product.revenue) }}</text>
					</view>
				</view>
			</view>
		</view>
		
		<!-- 订单状态分布 -->
		<view class="order-status">
			<view class="section-header">
				<text class="section-title">订单状态</text>
			</view>
			
			<view class="status-grid">
				<view class="status-item pending">
					<view class="status-icon">⏳</view>
					<text class="status-count">{{ orderStatus.pending }}</text>
					<text class="status-label">待处理</text>
				</view>
				<view class="status-item preparing">
					<view class="status-icon">🔥</view>
					<text class="status-count">{{ orderStatus.preparing }}</text>
					<text class="status-label">制作中</text>
				</view>
				<view class="status-item completed">
					<view class="status-icon">✅</view>
					<text class="status-count">{{ orderStatus.completed }}</text>
					<text class="status-label">已完成</text>
				</view>
				<view class="status-item rejected">
					<view class="status-icon">❌</view>
					<text class="status-count">{{ orderStatus.rejected }}</text>
					<text class="status-label">已拒绝</text>
				</view>
			</view>
		</view>
		
		<!-- 营业时间分析 -->
		<view class="time-analysis">
			<view class="section-header">
				<text class="section-title">营业时间分析</text>
			</view>
			
			<view class="time-slots">
				<view 
					class="time-slot" 
					v-for="(slot, index) in timeSlots" 
					:key="index"
				>
					<text class="time-label">{{ slot.time }}</text>
					<view class="time-bar">
						<view 
							class="time-progress" 
							:style="{ width: slot.percentage + '%' }"
						></view>
					</view>
					<text class="time-count">{{ slot.orders }}单</text>
				</view>
			</view>
		</view>
		
		<!-- 日期选择器弹窗 -->
		<view class="modal-overlay" v-if="showDateModal" @click="hideDatePicker">
			<view class="date-modal" @click.stop>
				<view class="date-header">
					<text class="date-title">选择日期范围</text>
					<view class="close-btn" @click="hideDatePicker">
						<text class="close-icon">✕</text>
					</view>
				</view>
				
				<view class="date-options">
					<view 
						class="date-option" 
						:class="{ active: selectedPeriod === 'today' }"
						@click="selectPeriod('today')"
					>
						<text class="option-text">今天</text>
					</view>
					<view 
						class="date-option" 
						:class="{ active: selectedPeriod === 'week' }"
						@click="selectPeriod('week')"
					>
						<text class="option-text">本周</text>
					</view>
					<view 
						class="date-option" 
						:class="{ active: selectedPeriod === 'month' }"
						@click="selectPeriod('month')"
					>
						<text class="option-text">本月</text>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { statsAPI } from '@/utils/api.js';
import { formatPrice, showToast, showLoading, hideLoading } from '@/utils/utils.js';
import store from '@/utils/store.js';

export default {
	data() {
		return {
			stats: {
				totalRevenue: 0,
				revenueChange: 0,
				totalOrders: 0,
				ordersChange: 0,
				totalCustomers: 0,
				customersChange: 0,
				avgOrderValue: 0,
				avgOrderChange: 0
			},
			chartType: 'revenue', // revenue, orders
			chartData: [],
			popularProducts: [],
			orderStatus: {
				pending: 0,
				preparing: 0,
				completed: 0,
				rejected: 0
			},
			timeSlots: [],
			selectedPeriod: 'today',
			showDateModal: false,
			loading: false
		}
	},
	
	computed: {
		selectedDateText() {
			switch (this.selectedPeriod) {
				case 'today':
					return '今天';
				case 'week':
					return '本周';
				case 'month':
					return '本月';
				default:
					return '今天';
			}
		}
	},
	
	onLoad() {
		this.checkAuth();
		this.loadStats();
	},
	
	onShow() {
		// 页面显示时刷新数据
		this.loadStats();
	},
	
	methods: {
		// 检查登录状态
		checkAuth() {
			const token = uni.getStorageSync('token');
			if (!token) {
				showToast('请先登录', 'error');
				uni.navigateTo({ url: '/pages/login/login' });
			}
		},
		
		// 加载统计数据
		async loadStats() {
			this.loading = true;
			
			try {
				const userInfo = store.getState().userInfo;
				const response = await statsAPI.getStats(userInfo?.id, this.selectedPeriod);
				
				if (response.success) {
					this.stats = response.data.overview;
					this.popularProducts = response.data.popularProducts || [];
					this.orderStatus = response.data.orderStatus;
					this.timeSlots = response.data.timeSlots || [];
					this.updateChartData();
				} else {
					showToast(response.message || '加载失败', 'error');
				}
			} catch (error) {
				console.error('加载统计数据失败:', error);
				// 使用模拟数据
				this.loadMockData();
			} finally {
				this.loading = false;
			}
		},
		
		// 加载模拟数据
		loadMockData() {
			this.stats = {
				totalRevenue: 1580.50,
				revenueChange: 12.5,
				totalOrders: 45,
				ordersChange: 8.3,
				totalCustomers: 38,
				customersChange: 15.2,
				avgOrderValue: 35.12,
				avgOrderChange: 3.8
			};
			
			this.popularProducts = [
				{ name: '烤羊肉串', sales: 120, revenue: 360.00, image: '/static/default-food.png' },
				{ name: '烤鸡翅', sales: 85, revenue: 680.00, image: '/static/default-food.png' },
				{ name: '烤玉米', sales: 65, revenue: 325.00, image: '/static/default-food.png' },
				{ name: '烤茄子', sales: 45, revenue: 270.00, image: '/static/default-food.png' },
				{ name: '烤韭菜', sales: 38, revenue: 190.00, image: '/static/default-food.png' }
			];
			
			this.orderStatus = {
				pending: 3,
				preparing: 5,
				completed: 42,
				rejected: 2
			};
			
			this.timeSlots = [
				{ time: '10:00', orders: 5, percentage: 25 },
				{ time: '12:00', orders: 15, percentage: 75 },
				{ time: '14:00', orders: 8, percentage: 40 },
				{ time: '16:00', orders: 12, percentage: 60 },
				{ time: '18:00', orders: 20, percentage: 100 },
				{ time: '20:00', orders: 18, percentage: 90 },
				{ time: '22:00', orders: 6, percentage: 30 }
			];
			
			this.updateChartData();
		},
		
		// 更新图表数据
		updateChartData() {
			if (this.chartType === 'revenue') {
				// 模拟营收数据
				this.chartData = [
					{ label: '周一', value: 280, height: 70 },
					{ label: '周二', value: 320, height: 80 },
					{ label: '周三', value: 180, height: 45 },
					{ label: '周四', value: 400, height: 100 },
					{ label: '周五', value: 350, height: 87 },
					{ label: '周六', value: 480, height: 120 },
					{ label: '周日', value: 420, height: 105 }
				];
			} else {
				// 模拟订单数据
				this.chartData = [
					{ label: '周一', value: 8, height: 60 },
					{ label: '周二', value: 12, height: 90 },
					{ label: '周三', value: 6, height: 45 },
					{ label: '周四', value: 15, height: 112 },
					{ label: '周五', value: 10, height: 75 },
					{ label: '周六', value: 18, height: 135 },
					{ label: '周日', value: 14, height: 105 }
				];
			}
		},
		
		// 设置图表类型
		setChartType(type) {
			this.chartType = type;
			this.updateChartData();
		},
		
		// 显示日期选择器
		showDatePicker() {
			this.showDateModal = true;
		},
		
		// 隐藏日期选择器
		hideDatePicker() {
			this.showDateModal = false;
		},
		
		// 选择时间段
		selectPeriod(period) {
			this.selectedPeriod = period;
			this.hideDatePicker();
			this.loadStats();
		},
		
		// 获取排名样式类
		getRankClass(index) {
			if (index === 0) return 'gold';
			if (index === 1) return 'silver';
			if (index === 2) return 'bronze';
			return 'normal';
		},
		
		// 工具函数
		formatPrice
	}
}
</script>

<style scoped>
.container {
	min-height: 100vh;
	background-color: #F8F9FA;
	padding-bottom: 120rpx;
}

/* 头部 */
.header {
	background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%);
	padding: 40rpx 30rpx 30rpx;
	display: flex;
	justify-content: space-between;
	align-items: flex-end;
}

.header-info {
	display: flex;
	flex-direction: column;
	gap: 8rpx;
}

.title {
	font-size: 36rpx;
	font-weight: bold;
	color: #FFFFFF;
}

.subtitle {
	font-size: 24rpx;
	color: rgba(255, 255, 255, 0.8);
}

.date-selector {
	background: rgba(255, 255, 255, 0.2);
	border-radius: 20rpx;
	padding: 15rpx 20rpx;
	display: flex;
	align-items: center;
	gap: 10rpx;
	transition: all 0.2s;
}

.date-text {
	font-size: 24rpx;
	color: #FFFFFF;
	font-weight: bold;
}

.date-icon {
	font-size: 20rpx;
}

/* 指标卡片 */
.metrics-cards {
	display: flex;
	gap: 20rpx;
	padding: 30rpx;
	margin-top: -20rpx;
}

.metric-card {
	flex: 1;
	background: #FFFFFF;
	border-radius: 20rpx;
	padding: 30rpx 25rpx;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
	display: flex;
	align-items: center;
	gap: 20rpx;
}

.metric-icon {
	font-size: 48rpx;
	width: 80rpx;
	height: 80rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
}

.metric-card.revenue .metric-icon {
	background: linear-gradient(135deg, #52C41A 0%, #73D13D 100%);
}

.metric-card.orders .metric-icon {
	background: linear-gradient(135deg, #1890FF 0%, #40A9FF 100%);
}

.metric-card.customers .metric-icon {
	background: linear-gradient(135deg, #722ED1 0%, #9254DE 100%);
}

.metric-card.avg-order .metric-icon {
	background: linear-gradient(135deg, #FA8C16 0%, #FFA940 100%);
}

.metric-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 5rpx;
}

.metric-value {
	font-size: 32rpx;
	font-weight: bold;
	color: #333333;
}

.metric-label {
	font-size: 22rpx;
	color: #666666;
}

.metric-change {
	font-size: 20rpx;
	color: #FF4D4F;
	font-weight: bold;
}

.metric-change.positive {
	color: #52C41A;
}

/* 图表区域 */
.chart-section {
	margin: 30rpx;
	background: #FFFFFF;
	border-radius: 20rpx;
	padding: 30rpx;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.section-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 30rpx;
}

.section-title {
	font-size: 28rpx;
	font-weight: bold;
	color: #333333;
}

.chart-tabs {
	display: flex;
	gap: 10rpx;
}

.chart-tab {
	padding: 10rpx 20rpx;
	border-radius: 15rpx;
	background-color: #F8F9FA;
	transition: all 0.2s;
}

.chart-tab.active {
	background-color: #FF6B35;
}

.tab-text {
	font-size: 22rpx;
	color: #666666;
}

.chart-tab.active .tab-text {
	color: #FFFFFF;
	font-weight: bold;
}

.chart-container {
	height: 300rpx;
}

.simple-chart {
	height: 100%;
	display: flex;
	flex-direction: column;
}

.chart-bars {
	flex: 1;
	display: flex;
	align-items: flex-end;
	gap: 15rpx;
	padding: 20rpx 0;
}

.chart-bar {
	flex: 1;
	background: linear-gradient(to top, #FF6B35, #FFA940);
	border-radius: 8rpx 8rpx 0 0;
	min-height: 20rpx;
	transition: all 0.3s;
}

.chart-labels {
	display: flex;
	gap: 15rpx;
	padding-top: 15rpx;
	border-top: 1rpx solid #F8F9FA;
}

.chart-label {
	flex: 1;
	text-align: center;
	font-size: 20rpx;
	color: #666666;
}

/* 热销商品 */
.popular-products {
	margin: 30rpx;
	background: #FFFFFF;
	border-radius: 20rpx;
	padding: 30rpx;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.section-subtitle {
	font-size: 22rpx;
	color: #FF6B35;
	font-weight: bold;
}

.product-list {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

.product-item {
	display: flex;
	align-items: center;
	gap: 20rpx;
	padding: 20rpx;
	background-color: #F8F9FA;
	border-radius: 15rpx;
}

.product-rank {
	width: 50rpx;
	height: 50rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

.product-rank.gold {
	background: linear-gradient(135deg, #FFD700, #FFA500);
}

.product-rank.silver {
	background: linear-gradient(135deg, #C0C0C0, #A9A9A9);
}

.product-rank.bronze {
	background: linear-gradient(135deg, #CD7F32, #B8860B);
}

.product-rank.normal {
	background: linear-gradient(135deg, #E9ECEF, #DEE2E6);
}

.rank-number {
	font-size: 24rpx;
	font-weight: bold;
	color: #FFFFFF;
}

.product-rank.normal .rank-number {
	color: #666666;
}

.product-image {
	width: 80rpx;
	height: 80rpx;
	border-radius: 12rpx;
	flex-shrink: 0;
}

.product-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 8rpx;
}

.product-name {
	font-size: 26rpx;
	font-weight: bold;
	color: #333333;
}

.product-sales {
	font-size: 22rpx;
	color: #666666;
}

.product-revenue {
	text-align: right;
}

.revenue-amount {
	font-size: 28rpx;
	font-weight: bold;
	color: #FF6B35;
}

/* 订单状态 */
.order-status {
	margin: 30rpx;
	background: #FFFFFF;
	border-radius: 20rpx;
	padding: 30rpx;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.status-grid {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 20rpx;
}

.status-item {
	padding: 25rpx;
	border-radius: 15rpx;
	text-align: center;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 10rpx;
}

.status-item.pending {
	background: linear-gradient(135deg, #FFF7E6, #FFFBE6);
}

.status-item.preparing {
	background: linear-gradient(135deg, #E6F7FF, #F0F9FF);
}

.status-item.completed {
	background: linear-gradient(135deg, #F6FFED, #FCFFE6);
}

.status-item.rejected {
	background: linear-gradient(135deg, #FFF2F0, #FFF1F0);
}

.status-icon {
	font-size: 36rpx;
}

.status-count {
	font-size: 32rpx;
	font-weight: bold;
	color: #333333;
}

.status-label {
	font-size: 22rpx;
	color: #666666;
}

/* 营业时间分析 */
.time-analysis {
	margin: 30rpx;
	background: #FFFFFF;
	border-radius: 20rpx;
	padding: 30rpx;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.time-slots {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

.time-slot {
	display: flex;
	align-items: center;
	gap: 20rpx;
}

.time-label {
	font-size: 24rpx;
	color: #333333;
	width: 100rpx;
	flex-shrink: 0;
}

.time-bar {
	flex: 1;
	height: 20rpx;
	background-color: #F8F9FA;
	border-radius: 10rpx;
	overflow: hidden;
}

.time-progress {
	height: 100%;
	background: linear-gradient(90deg, #FF6B35, #FFA940);
	border-radius: 10rpx;
	transition: width 0.3s;
}

.time-count {
	font-size: 22rpx;
	color: #666666;
	width: 80rpx;
	text-align: right;
	flex-shrink: 0;
}

/* 日期选择弹窗 */
.modal-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
	padding: 40rpx;
}

.date-modal {
	background: #FFFFFF;
	border-radius: 20rpx;
	width: 100%;
	max-width: 500rpx;
}

.date-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 30rpx;
	border-bottom: 2rpx solid #F8F9FA;
}

.date-title {
	font-size: 28rpx;
	font-weight: bold;
	color: #333333;
}

.close-btn {
	width: 50rpx;
	height: 50rpx;
	border-radius: 50%;
	background-color: #F8F9FA;
	display: flex;
	align-items: center;
	justify-content: center;
}

.close-icon {
	font-size: 20rpx;
	color: #666666;
}

.date-options {
	padding: 30rpx;
	display: flex;
	flex-direction: column;
	gap: 15rpx;
}

.date-option {
	padding: 25rpx;
	border-radius: 15rpx;
	background-color: #F8F9FA;
	text-align: center;
	transition: all 0.2s;
}

.date-option.active {
	background-color: #FF6B35;
}

.option-text {
	font-size: 26rpx;
	color: #333333;
	font-weight: bold;
}

.date-option.active .option-text {
	color: #FFFFFF;
}
</style>