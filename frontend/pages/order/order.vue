<template>
	<view class="container">
		<!-- 当前订单 -->
		<view class="current-order" v-if="currentOrder">
			<view class="order-header">
				<text class="order-title">当前订单</text>
				<text class="order-number">排队号：{{ currentOrder.queueNumber || '待分配' }}</text>
			</view>
			
			<!-- 订单状态进度条 -->
			<view class="status-progress">
				<view class="progress-step" :class="{ active: isStepActive('pending'), completed: isStepCompleted('pending') }">
					<view class="step-circle">
						<text class="step-icon">📝</text>
					</view>
					<text class="step-text">待确认</text>
				</view>
				
				<view class="progress-line" :class="{ active: isStepCompleted('pending') }"></view>
				
				<view class="progress-step" :class="{ active: isStepActive('cooking'), completed: isStepCompleted('cooking') }">
					<view class="step-circle">
						<text class="step-icon">🔥</text>
					</view>
					<text class="step-text">制作中</text>
				</view>
				
				<view class="progress-line" :class="{ active: isStepCompleted('cooking') }"></view>
				
				<view class="progress-step" :class="{ active: isStepActive('ready'), completed: isStepCompleted('ready') }">
					<view class="step-circle">
						<text class="step-icon">✅</text>
					</view>
					<text class="step-text">待取餐</text>
				</view>
			</view>
			
			<!-- 当前状态信息 -->
			<view class="status-info">
				<view class="status-card">
					<text class="status-title">{{ getStatusTitle(currentOrder.status) }}</text>
					<text class="status-desc">{{ getStatusDesc(currentOrder.status) }}</text>
					<text class="estimated-time" v-if="estimatedTime">预计等待时间：{{ estimatedTime }}</text>
				</view>
			</view>
			
			<!-- 订单详情 -->
			<view class="order-details">
				<view class="detail-section">
					<text class="section-title">订单信息</text>
					<view class="detail-row">
						<text class="detail-label">订单编号</text>
						<text class="detail-value">{{ currentOrder.id.slice(-8).toUpperCase() }}</text>
					</view>
					<view class="detail-row">
						<text class="detail-label">下单时间</text>
						<text class="detail-value">{{ formatTime(currentOrder.createdAt) }}</text>
					</view>
					<view class="detail-row">
						<text class="detail-label">用餐方式</text>
						<text class="detail-value">{{ currentOrder.dineType === 'dine-in' ? '堂食' : '打包' }}</text>
					</view>
					<view class="detail-row" v-if="currentOrder.customerInfo.nickname">
						<text class="detail-label">联系人</text>
						<text class="detail-value">{{ currentOrder.customerInfo.nickname }}</text>
					</view>
				</view>
				
				<view class="detail-section">
					<text class="section-title">商品清单</text>
					<view class="item-list">
						<view class="order-item" v-for="item in currentOrder.items" :key="item.productId">
							<text class="item-name">{{ item.name }}</text>
							<text class="item-quantity">x{{ item.quantity }}</text>
							<text class="item-price">{{ formatPrice(item.price * item.quantity) }}</text>
						</view>
					</view>
					<view class="total-row">
						<text class="total-label">合计</text>
						<text class="total-price">{{ formatPrice(currentOrder.totalAmount) }}</text>
					</view>
				</view>
			</view>
			
			<!-- 操作按钮 -->
			<view class="action-buttons">
				<view class="action-btn refresh" @click="refreshOrder">
					<text class="btn-text">刷新状态</text>
				</view>
				<view class="action-btn continue" @click="continueShopping">
					<text class="btn-text">继续点餐</text>
				</view>
			</view>
		</view>
		
		<!-- 历史订单 -->
		<view class="order-history" v-if="historyOrders.length > 0">
			<text class="history-title">历史订单</text>
			<view class="history-list">
				<view 
					class="history-item" 
					v-for="order in historyOrders" 
					:key="order.id"
					@click="viewOrderDetail(order)"
				>
					<view class="history-header">
						<text class="history-number">订单 {{ order.id.slice(-8).toUpperCase() }}</text>
						<view class="status-badge" :style="{ backgroundColor: getOrderStatusColor(order.status) }">
							<text class="status-text">{{ getOrderStatusText(order.status) }}</text>
						</view>
					</view>
					<text class="history-time">{{ formatTime(order.createdAt) }}</text>
					<text class="history-total">{{ formatPrice(order.totalAmount) }}</text>
				</view>
			</view>
		</view>
		
		<!-- 空状态 -->
		<view class="empty-state" v-if="!currentOrder && historyOrders.length === 0">
			<text class="empty-icon">📋</text>
			<text class="empty-text">暂无订单</text>
			<text class="empty-desc">去菜品页面下单吧</text>
			<view class="go-menu-btn" @click="goToMenu">
				<text class="btn-text">去点餐</text>
			</view>
		</view>
	</view>
</template>

<script>
import { orderAPI } from '@/utils/api.js';
import { formatPrice, formatTime, getOrderStatusText, getOrderStatusColor, showToast, showLoading, hideLoading } from '@/utils/utils.js';
import store from '@/utils/store.js';

export default {
	data() {
		return {
			refreshing: false,
			estimatedTime: ''
		}
	},
	
	computed: {
		// 当前订单
		currentOrder() {
			return store.getState().currentOrder;
		},
		
		// 历史订单
		historyOrders() {
			const orders = store.getState().orders;
			const currentOrderId = this.currentOrder?.id;
			return orders.filter(order => order.id !== currentOrderId);
		}
	},
	
	onLoad() {
		this.loadOrders();
		this.calculateEstimatedTime();
	},
	
	onShow() {
		// 页面显示时刷新数据
		this.$forceUpdate();
		this.calculateEstimatedTime();
	},
	
	methods: {
		// 加载订单数据
		async loadOrders() {
			try {
				const response = await orderAPI.getOrders();
				if (response.success) {
					store.setOrders(response.data);
				}
			} catch (error) {
				console.error('加载订单失败:', error);
				// 使用本地存储的订单数据
			}
		},
		
		// 判断步骤是否激活
		isStepActive(step) {
			if (!this.currentOrder) return false;
			const status = this.currentOrder.status;
			
			const stepMap = {
				'pending': 'pending',
				'confirmed': 'cooking',
				'cooking': 'cooking',
				'ready': 'ready'
			};
			
			return stepMap[status] === step;
		},
		
		// 判断步骤是否完成
		isStepCompleted(step) {
			if (!this.currentOrder) return false;
			const status = this.currentOrder.status;
			
			const stepOrder = ['pending', 'cooking', 'ready'];
			const statusOrder = ['pending', 'confirmed', 'cooking', 'ready'];
			
			const currentStepIndex = stepOrder.indexOf(step);
			const currentStatusIndex = statusOrder.indexOf(status);
			
			if (step === 'pending') {
				return currentStatusIndex > 0;
			} else if (step === 'cooking') {
				return currentStatusIndex > 2;
			} else if (step === 'ready') {
				return currentStatusIndex > 3;
			}
			
			return false;
		},
		
		// 获取状态标题
		getStatusTitle(status) {
			const titleMap = {
				'pending': '订单已提交',
				'confirmed': '订单已确认',
				'cooking': '正在制作中',
				'ready': '制作完成',
				'completed': '订单已完成',
				'cancelled': '订单已取消'
			};
			return titleMap[status] || '未知状态';
		},
		
		// 获取状态描述
		getStatusDesc(status) {
			const descMap = {
				'pending': '商家正在确认您的订单，请稍候...',
				'confirmed': '商家已确认订单，开始制作美食',
				'cooking': '您的美食正在精心制作中，请耐心等待',
				'ready': '您的订单已制作完成，请及时取餐',
				'completed': '感谢您的光临，期待下次再来',
				'cancelled': '订单已取消，如有疑问请联系商家'
			};
			return descMap[status] || '';
		},
		
		// 计算预计等待时间
		calculateEstimatedTime() {
			if (!this.currentOrder) return;
			
			const status = this.currentOrder.status;
			const queueNumber = this.currentOrder.queueNumber || 0;
			
			if (status === 'pending') {
				this.estimatedTime = '2-5分钟';
			} else if (status === 'confirmed' || status === 'cooking') {
				const estimatedMinutes = Math.max(5, queueNumber * 2);
				this.estimatedTime = `${estimatedMinutes}-${estimatedMinutes + 5}分钟`;
			} else if (status === 'ready') {
				this.estimatedTime = '请及时取餐';
			} else {
				this.estimatedTime = '';
			}
		},
		
		// 刷新订单状态
		async refreshOrder() {
			if (this.refreshing || !this.currentOrder) return;
			
			this.refreshing = true;
			showLoading('刷新中...');
			
			try {
				const response = await orderAPI.getOrderDetail(this.currentOrder.id);
				if (response.success) {
					const updatedOrder = response.data;
					store.setCurrentOrder(updatedOrder);
					store.updateOrder(updatedOrder.id, updatedOrder);
					this.calculateEstimatedTime();
					showToast('状态已更新');
				} else {
					showToast(response.message || '刷新失败', 'error');
				}
			} catch (error) {
				console.error('刷新订单失败:', error);
				// 模拟状态更新
				this.simulateStatusUpdate();
			} finally {
				this.refreshing = false;
				hideLoading();
			}
		},
		
		// 模拟状态更新
		simulateStatusUpdate() {
			if (!this.currentOrder) return;
			
			const statusFlow = ['pending', 'confirmed', 'cooking', 'ready', 'completed'];
			const currentIndex = statusFlow.indexOf(this.currentOrder.status);
			
			if (currentIndex < statusFlow.length - 1) {
				const nextStatus = statusFlow[currentIndex + 1];
				const updatedOrder = {
					...this.currentOrder,
					status: nextStatus
				};
				
				store.setCurrentOrder(updatedOrder);
				store.updateOrder(updatedOrder.id, updatedOrder);
				this.calculateEstimatedTime();
				showToast('状态已更新');
			} else {
				showToast('订单状态已是最新');
			}
		},
		
		// 继续购物
		continueShopping() {
			uni.switchTab({ url: '/pages/menu/menu' });
		},
		
		// 查看订单详情
		viewOrderDetail(order) {
			store.setCurrentOrder(order);
			this.calculateEstimatedTime();
			this.$forceUpdate();
		},
		
		// 跳转到菜品页面
		goToMenu() {
			uni.switchTab({ url: '/pages/menu/menu' });
		},
		
		// 工具函数
		formatPrice,
		formatTime,
		getOrderStatusText,
		getOrderStatusColor
	}
}
</script>

<style scoped>
.container {
	min-height: 100vh;
	background-color: #F8F9FA;
	padding: 30rpx;
	padding-bottom: 120rpx;
}

/* 当前订单 */
.current-order {
	margin-bottom: 40rpx;
}

.order-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 30rpx;
}

.order-title {
	font-size: 36rpx;
	font-weight: bold;
	color: #333333;
}

.order-number {
	font-size: 28rpx;
	color: #FF6B35;
	font-weight: bold;
}

/* 状态进度条 */
.status-progress {
	display: flex;
	align-items: center;
	justify-content: space-between;
	background: #FFFFFF;
	border-radius: 20rpx;
	padding: 40rpx 30rpx;
	margin-bottom: 30rpx;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.progress-step {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 15rpx;
	flex: 1;
}

.step-circle {
	width: 80rpx;
	height: 80rpx;
	border-radius: 50%;
	background-color: #E9ECEF;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.3s;
}

.progress-step.active .step-circle,
.progress-step.completed .step-circle {
	background-color: #FF6B35;
}

.step-icon {
	font-size: 36rpx;
}

.step-text {
	font-size: 24rpx;
	color: #666666;
	text-align: center;
}

.progress-step.active .step-text,
.progress-step.completed .step-text {
	color: #FF6B35;
	font-weight: bold;
}

.progress-line {
	height: 4rpx;
	background-color: #E9ECEF;
	flex: 1;
	margin: 0 20rpx;
	transition: all 0.3s;
}

.progress-line.active {
	background-color: #FF6B35;
}

/* 状态信息 */
.status-info {
	margin-bottom: 30rpx;
}

.status-card {
	background: #FFFFFF;
	border-radius: 20rpx;
	padding: 40rpx 30rpx;
	text-align: center;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.status-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #333333;
	margin-bottom: 15rpx;
	display: block;
}

.status-desc {
	font-size: 28rpx;
	color: #666666;
	line-height: 1.5;
	margin-bottom: 20rpx;
	display: block;
}

.estimated-time {
	font-size: 26rpx;
	color: #FF6B35;
	font-weight: bold;
	display: block;
}

/* 订单详情 */
.order-details {
	margin-bottom: 30rpx;
}

.detail-section {
	background: #FFFFFF;
	border-radius: 20rpx;
	padding: 30rpx;
	margin-bottom: 20rpx;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.section-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #333333;
	margin-bottom: 25rpx;
	display: block;
}

.detail-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 15rpx 0;
	border-bottom: 1rpx solid #F8F9FA;
}

.detail-row:last-child {
	border-bottom: none;
}

.detail-label {
	font-size: 28rpx;
	color: #666666;
}

.detail-value {
	font-size: 28rpx;
	color: #333333;
}

/* 商品清单 */
.item-list {
	margin-bottom: 20rpx;
}

.order-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 15rpx 0;
	border-bottom: 1rpx solid #F8F9FA;
}

.order-item:last-child {
	border-bottom: none;
}

.item-name {
	flex: 1;
	font-size: 28rpx;
	color: #333333;
}

.item-quantity {
	font-size: 26rpx;
	color: #666666;
	margin: 0 20rpx;
}

.item-price {
	font-size: 28rpx;
	color: #FF6B35;
	font-weight: bold;
}

.total-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding-top: 20rpx;
	border-top: 2rpx solid #E9ECEF;
}

.total-label {
	font-size: 32rpx;
	font-weight: bold;
	color: #333333;
}

.total-price {
	font-size: 36rpx;
	font-weight: bold;
	color: #FF6B35;
}

/* 操作按钮 */
.action-buttons {
	display: flex;
	gap: 20rpx;
	margin-bottom: 30rpx;
}

.action-btn {
	flex: 1;
	padding: 25rpx;
	border-radius: 15rpx;
	text-align: center;
	transition: all 0.2s;
}

.action-btn.refresh {
	background-color: #F8F9FA;
	border: 2rpx solid #E9ECEF;
}

.action-btn.continue {
	background-color: #FF6B35;
}

.action-btn .btn-text {
	font-size: 28rpx;
	color: #666666;
}

.action-btn.continue .btn-text {
	color: #FFFFFF;
	font-weight: bold;
}

/* 历史订单 */
.order-history {
	margin-bottom: 30rpx;
}

.history-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #333333;
	margin-bottom: 25rpx;
	display: block;
}

.history-list {
	display: flex;
	flex-direction: column;
	gap: 15rpx;
}

.history-item {
	background: #FFFFFF;
	border-radius: 15rpx;
	padding: 25rpx;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
	transition: all 0.2s;
}

.history-item:active {
	transform: scale(0.98);
}

.history-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 15rpx;
}

.history-number {
	font-size: 28rpx;
	font-weight: bold;
	color: #333333;
}

.status-badge {
	padding: 8rpx 16rpx;
	border-radius: 20rpx;
}

.status-text {
	font-size: 22rpx;
	color: #FFFFFF;
	font-weight: bold;
}

.history-time {
	font-size: 24rpx;
	color: #666666;
	margin-bottom: 10rpx;
	display: block;
}

.history-total {
	font-size: 28rpx;
	color: #FF6B35;
	font-weight: bold;
	display: block;
}

/* 空状态 */
.empty-state {
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
</style>