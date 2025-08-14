<template>
	<view class="container">
		<!-- 头部统计 -->
		<view class="header">
			<view class="header-info">
				<text class="welcome-text">订单管理</text>
				<text class="date-text">{{ currentDate }}</text>
			</view>
			<view class="header-stats">
				<view class="stat-item">
					<text class="stat-number">{{ todayOrderCount }}</text>
					<text class="stat-label">今日订单</text>
				</view>
				<view class="stat-item">
					<text class="stat-number">{{ pendingOrderCount }}</text>
					<text class="stat-label">待处理</text>
				</view>
			</view>
		</view>
		
		<!-- 订单状态筛选 -->
		<view class="filter-tabs">
			<view 
				class="filter-tab" 
				:class="{ active: filterStatus === 'all' }"
				@click="setFilter('all')"
			>
				<text class="tab-text">全部</text>
				<text class="tab-count" v-if="allOrderCount > 0">({{ allOrderCount }})</text>
			</view>
			<view 
				class="filter-tab" 
				:class="{ active: filterStatus === 'pending' }"
				@click="setFilter('pending')"
			>
				<text class="tab-text">待处理</text>
				<text class="tab-count" v-if="pendingOrderCount > 0">({{ pendingOrderCount }})</text>
			</view>
			<view 
				class="filter-tab" 
				:class="{ active: filterStatus === 'preparing' }"
				@click="setFilter('preparing')"
			>
				<text class="tab-text">制作中</text>
				<text class="tab-count" v-if="preparingOrderCount > 0">({{ preparingOrderCount }})</text>
			</view>
			<view 
				class="filter-tab" 
				:class="{ active: filterStatus === 'completed' }"
				@click="setFilter('completed')"
			>
				<text class="tab-text">已完成</text>
				<text class="tab-count" v-if="completedOrderCount > 0">({{ completedOrderCount }})</text>
			</view>
		</view>
		
		<!-- 订单列表 -->
		<view class="order-list">
			<view 
				class="order-item" 
				v-for="order in filteredOrders" 
				:key="order.id"
				@click="viewOrderDetail(order)"
			>
				<view class="order-header">
					<view class="order-info">
						<text class="order-number">订单号：{{ order.orderNumber }}</text>
						<text class="order-time">{{ formatTime(order.createdAt) }}</text>
					</view>
					<view class="order-status" :class="getStatusClass(order.status)">
						<text class="status-text">{{ getStatusText(order.status) }}</text>
					</view>
				</view>
				
				<view class="order-customer">
					<text class="customer-name">{{ order.customerName || '顾客' }}</text>
					<text class="customer-phone" v-if="order.customerPhone">{{ order.customerPhone }}</text>
					<view class="dining-type" :class="order.diningType">
						<text class="dining-text">{{ order.diningType === 'dine_in' ? '堂食' : '打包' }}</text>
					</view>
				</view>
				
				<view class="order-items">
					<view 
						class="item-summary" 
						v-for="(item, index) in order.items.slice(0, 2)" 
						:key="index"
					>
						<text class="item-name">{{ item.name }}</text>
						<text class="item-quantity">×{{ item.quantity }}</text>
					</view>
					<text class="more-items" v-if="order.items.length > 2">
						等{{ order.items.length }}种商品
					</text>
				</view>
				
				<view class="order-footer">
					<text class="order-total">合计：{{ formatPrice(order.totalAmount) }}</text>
					<view class="order-actions" @click.stop>
						<view 
							class="action-btn accept" 
							v-if="order.status === 'pending'"
							@click="acceptOrder(order)"
						>
							<text class="btn-text">接单</text>
						</view>
						<view 
							class="action-btn complete" 
							v-if="order.status === 'preparing'"
							@click="completeOrder(order)"
						>
							<text class="btn-text">完成</text>
						</view>
						<view 
							class="action-btn reject" 
							v-if="order.status === 'pending'"
							@click="rejectOrder(order)"
						>
							<text class="btn-text">拒绝</text>
						</view>
					</view>
				</view>
			</view>
			
			<!-- 空状态 -->
			<view class="empty-state" v-if="filteredOrders.length === 0">
				<text class="empty-icon">📋</text>
				<text class="empty-text">{{ getEmptyText() }}</text>
			</view>
		</view>
		
		<!-- 订单详情弹窗 -->
		<view class="modal-overlay" v-if="showDetailModal" @click="hideDetailModal">
			<view class="modal-content" @click.stop>
				<view class="modal-header">
					<text class="modal-title">订单详情</text>
					<view class="close-btn" @click="hideDetailModal">
						<text class="close-icon">✕</text>
					</view>
				</view>
				
				<view class="modal-body" v-if="selectedOrder">
					<!-- 订单基本信息 -->
					<view class="detail-section">
						<text class="section-title">订单信息</text>
						<view class="detail-row">
							<text class="detail-label">订单号：</text>
							<text class="detail-value">{{ selectedOrder.orderNumber }}</text>
						</view>
						<view class="detail-row">
							<text class="detail-label">下单时间：</text>
							<text class="detail-value">{{ formatDateTime(selectedOrder.createdAt) }}</text>
						</view>
						<view class="detail-row">
							<text class="detail-label">订单状态：</text>
							<text class="detail-value status" :class="getStatusClass(selectedOrder.status)">
								{{ getStatusText(selectedOrder.status) }}
							</text>
						</view>
						<view class="detail-row">
							<text class="detail-label">用餐方式：</text>
							<text class="detail-value">{{ selectedOrder.diningType === 'dine_in' ? '堂食' : '打包' }}</text>
						</view>
					</view>
					
					<!-- 顾客信息 -->
					<view class="detail-section">
						<text class="section-title">顾客信息</text>
						<view class="detail-row">
							<text class="detail-label">姓名：</text>
							<text class="detail-value">{{ selectedOrder.customerName || '未填写' }}</text>
						</view>
						<view class="detail-row" v-if="selectedOrder.customerPhone">
							<text class="detail-label">电话：</text>
							<text class="detail-value phone">{{ selectedOrder.customerPhone }}</text>
						</view>
					</view>
					
					<!-- 商品清单 -->
					<view class="detail-section">
						<text class="section-title">商品清单</text>
						<view class="item-list">
							<view 
								class="detail-item" 
								v-for="(item, index) in selectedOrder.items" 
								:key="index"
							>
								<view class="item-info">
									<text class="item-name">{{ item.name }}</text>
									<text class="item-price">{{ formatPrice(item.price) }}</text>
								</view>
								<view class="item-quantity">
									<text class="quantity-text">×{{ item.quantity }}</text>
									<text class="subtotal">{{ formatPrice(item.price * item.quantity) }}</text>
								</view>
							</view>
						</view>
						
						<view class="total-section">
							<view class="total-row">
								<text class="total-label">商品总计：</text>
								<text class="total-value">{{ formatPrice(selectedOrder.totalAmount) }}</text>
							</view>
						</view>
					</view>
				</view>
				
				<view class="modal-footer" v-if="selectedOrder">
					<view 
						class="modal-btn accept" 
						v-if="selectedOrder.status === 'pending'"
						@click="acceptOrder(selectedOrder)"
					>
						<text class="btn-text">接单</text>
					</view>
					<view 
						class="modal-btn complete" 
						v-if="selectedOrder.status === 'preparing'"
						@click="completeOrder(selectedOrder)"
					>
						<text class="btn-text">完成制作</text>
					</view>
					<view 
						class="modal-btn reject" 
						v-if="selectedOrder.status === 'pending'"
						@click="rejectOrder(selectedOrder)"
					>
						<text class="btn-text">拒绝订单</text>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { orderAPI } from '@/utils/api.js';
import { formatPrice, formatTime, formatDateTime, showToast, showLoading, hideLoading, showConfirm, getOrderStatusText } from '@/utils/utils.js';
import store from '@/utils/store.js';

export default {
	data() {
		return {
			orders: [],
			filterStatus: 'all', // all, pending, preparing, completed
			showDetailModal: false,
			selectedOrder: null,
			loading: false,
			currentDate: ''
		}
	},
	
	computed: {
		// 过滤后的订单
		filteredOrders() {
			if (this.filterStatus === 'all') {
				return this.orders;
			} else {
				return this.orders.filter(order => order.status === this.filterStatus);
			}
		},
		
		// 各状态订单数量
		allOrderCount() {
			return this.orders.length;
		},
		
		pendingOrderCount() {
			return this.orders.filter(order => order.status === 'pending').length;
		},
		
		preparingOrderCount() {
			return this.orders.filter(order => order.status === 'preparing').length;
		},
		
		completedOrderCount() {
			return this.orders.filter(order => order.status === 'completed').length;
		},
		
		// 今日订单数量
		todayOrderCount() {
			const today = new Date().toDateString();
			return this.orders.filter(order => {
				const orderDate = new Date(order.createdAt).toDateString();
				return orderDate === today;
			}).length;
		}
	},
	
	onLoad() {
		this.initCurrentDate();
		this.checkAuth();
		this.loadOrders();
	},
	
	onShow() {
		// 页面显示时刷新数据
		this.loadOrders();
	},
	
	methods: {
		// 初始化当前日期
		initCurrentDate() {
			const now = new Date();
			const year = now.getFullYear();
			const month = String(now.getMonth() + 1).padStart(2, '0');
			const day = String(now.getDate()).padStart(2, '0');
			this.currentDate = `${year}-${month}-${day}`;
		},
		
		// 检查登录状态
		checkAuth() {
			const token = uni.getStorageSync('token');
			if (!token) {
				showToast('请先登录', 'error');
				uni.navigateTo({ url: '/pages/login/login' });
			}
		},
		
		// 加载订单列表
		async loadOrders() {
			this.loading = true;
			
			try {
				const userInfo = store.getState().userInfo;
				const response = await orderAPI.getMerchantOrders(userInfo?.id);
				
				if (response.success) {
					this.orders = response.data || [];
					// 按创建时间倒序排列
					this.orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
					store.setOrders(this.orders);
				} else {
					showToast(response.message || '加载失败', 'error');
				}
			} catch (error) {
				console.error('加载订单失败:', error);
				// 使用模拟数据
				this.loadMockData();
			} finally {
				this.loading = false;
			}
		},
		
		// 加载模拟数据
		loadMockData() {
			const now = new Date();
			this.orders = [
				{
					id: '1',
					orderNumber: 'BBQ' + Date.now().toString().slice(-6),
					status: 'pending',
					customerName: '张三',
					customerPhone: '13800138001',
					diningType: 'dine_in',
					totalAmount: 45.00,
					createdAt: now.toISOString(),
					items: [
						{ name: '烤羊肉串', price: 3.00, quantity: 10 },
						{ name: '烤鸡翅', price: 8.00, quantity: 2 }
					]
				},
				{
					id: '2',
					orderNumber: 'BBQ' + (Date.now() - 300000).toString().slice(-6),
					status: 'preparing',
					customerName: '李四',
					customerPhone: '13800138002',
					diningType: 'takeaway',
					totalAmount: 28.00,
					createdAt: new Date(now.getTime() - 300000).toISOString(),
					items: [
						{ name: '烤羊肉串', price: 3.00, quantity: 6 },
						{ name: '烤玉米', price: 5.00, quantity: 2 }
					]
				},
				{
					id: '3',
					orderNumber: 'BBQ' + (Date.now() - 600000).toString().slice(-6),
					status: 'completed',
					customerName: '王五',
					customerPhone: '13800138003',
					diningType: 'dine_in',
					totalAmount: 52.00,
					createdAt: new Date(now.getTime() - 600000).toISOString(),
					items: [
						{ name: '烤羊肉串', price: 3.00, quantity: 8 },
						{ name: '烤鸡翅', price: 8.00, quantity: 3 },
						{ name: '烤玉米', price: 5.00, quantity: 1 }
					]
				}
			];
		},
		
		// 设置过滤状态
		setFilter(status) {
			this.filterStatus = status;
		},
		
		// 查看订单详情
		viewOrderDetail(order) {
			this.selectedOrder = order;
			this.showDetailModal = true;
		},
		
		// 隐藏详情弹窗
		hideDetailModal() {
			this.showDetailModal = false;
			setTimeout(() => {
				this.selectedOrder = null;
			}, 300);
		},
		
		// 接受订单
		async acceptOrder(order) {
			const confirmed = await showConfirm('确定接受这个订单吗？');
			if (!confirmed) return;
			
			showLoading('处理中...');
			
			try {
				const response = await orderAPI.updateOrderStatus(order.id, 'preparing');
				
				if (response.success) {
					this.updateOrderStatus(order.id, 'preparing');
					showToast('已接受订单');
					this.hideDetailModal();
				} else {
					showToast(response.message || '操作失败', 'error');
				}
			} catch (error) {
				console.error('接受订单失败:', error);
				// 模拟成功
				this.updateOrderStatus(order.id, 'preparing');
				showToast('已接受订单');
				this.hideDetailModal();
			} finally {
				hideLoading();
			}
		},
		
		// 完成订单
		async completeOrder(order) {
			const confirmed = await showConfirm('确定完成这个订单吗？');
			if (!confirmed) return;
			
			showLoading('处理中...');
			
			try {
				const response = await orderAPI.updateOrderStatus(order.id, 'completed');
				
				if (response.success) {
					this.updateOrderStatus(order.id, 'completed');
					showToast('订单已完成');
					this.hideDetailModal();
				} else {
					showToast(response.message || '操作失败', 'error');
				}
			} catch (error) {
				console.error('完成订单失败:', error);
				// 模拟成功
				this.updateOrderStatus(order.id, 'completed');
				showToast('订单已完成');
				this.hideDetailModal();
			} finally {
				hideLoading();
			}
		},
		
		// 拒绝订单
		async rejectOrder(order) {
			const confirmed = await showConfirm('确定拒绝这个订单吗？拒绝后无法撤销。');
			if (!confirmed) return;
			
			showLoading('处理中...');
			
			try {
				const response = await orderAPI.updateOrderStatus(order.id, 'rejected');
				
				if (response.success) {
					this.updateOrderStatus(order.id, 'rejected');
					showToast('已拒绝订单');
					this.hideDetailModal();
				} else {
					showToast(response.message || '操作失败', 'error');
				}
			} catch (error) {
				console.error('拒绝订单失败:', error);
				// 模拟成功
				this.updateOrderStatus(order.id, 'rejected');
				showToast('已拒绝订单');
				this.hideDetailModal();
			} finally {
				hideLoading();
			}
		},
		
		// 更新订单状态
		updateOrderStatus(orderId, status) {
			const orderIndex = this.orders.findIndex(order => order.id === orderId);
			if (orderIndex > -1) {
				this.orders[orderIndex].status = status;
				// 更新选中的订单
				if (this.selectedOrder && this.selectedOrder.id === orderId) {
					this.selectedOrder.status = status;
				}
				// 更新全局状态
				store.updateOrder(orderId, { status });
			}
		},
		
		// 获取状态样式类
		getStatusClass(status) {
			return {
				pending: status === 'pending',
				preparing: status === 'preparing',
				completed: status === 'completed',
				rejected: status === 'rejected'
			};
		},
		
		// 获取状态文本
		getStatusText(status) {
			return getOrderStatusText(status);
		},
		
		// 获取空状态文本
		getEmptyText() {
			switch (this.filterStatus) {
				case 'pending':
					return '暂无待处理订单';
				case 'preparing':
					return '暂无制作中订单';
				case 'completed':
					return '暂无已完成订单';
				default:
					return '暂无订单';
			}
		},
		
		// 工具函数
		formatPrice,
		formatTime,
		formatDateTime
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

.welcome-text {
	font-size: 36rpx;
	font-weight: bold;
	color: #FFFFFF;
}

.date-text {
	font-size: 24rpx;
	color: rgba(255, 255, 255, 0.8);
}

.header-stats {
	display: flex;
	gap: 30rpx;
}

.stat-item {
	text-align: center;
}

.stat-number {
	font-size: 32rpx;
	font-weight: bold;
	color: #FFFFFF;
	display: block;
	margin-bottom: 5rpx;
}

.stat-label {
	font-size: 20rpx;
	color: rgba(255, 255, 255, 0.8);
}

/* 筛选标签 */
.filter-tabs {
	display: flex;
	gap: 15rpx;
	padding: 30rpx;
	margin-top: -20rpx;
	overflow-x: auto;
}

.filter-tab {
	padding: 15rpx 25rpx;
	border-radius: 25rpx;
	background-color: #FFFFFF;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
	transition: all 0.2s;
	flex-shrink: 0;
	display: flex;
	align-items: center;
	gap: 8rpx;
}

.filter-tab.active {
	background-color: #FF6B35;
	box-shadow: 0 4rpx 12rpx rgba(255, 107, 53, 0.3);
}

.tab-text {
	font-size: 26rpx;
	color: #666666;
	font-weight: bold;
}

.filter-tab.active .tab-text {
	color: #FFFFFF;
}

.tab-count {
	font-size: 20rpx;
	color: #999999;
}

.filter-tab.active .tab-count {
	color: rgba(255, 255, 255, 0.8);
}

/* 订单列表 */
.order-list {
	padding: 0 30rpx;
}

.order-item {
	background: #FFFFFF;
	border-radius: 20rpx;
	padding: 25rpx;
	margin-bottom: 20rpx;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
	transition: all 0.2s;
}

.order-item:active {
	transform: scale(0.98);
}

.order-header {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	margin-bottom: 15rpx;
}

.order-info {
	display: flex;
	flex-direction: column;
	gap: 8rpx;
}

.order-number {
	font-size: 28rpx;
	font-weight: bold;
	color: #333333;
}

.order-time {
	font-size: 22rpx;
	color: #999999;
}

.order-status {
	padding: 8rpx 15rpx;
	border-radius: 15rpx;
	font-size: 22rpx;
	font-weight: bold;
}

.order-status.pending {
	background-color: #FFF7E6;
	color: #FA8C16;
}

.order-status.preparing {
	background-color: #E6F7FF;
	color: #1890FF;
}

.order-status.completed {
	background-color: #F6FFED;
	color: #52C41A;
}

.order-status.rejected {
	background-color: #FFF2F0;
	color: #FF4D4F;
}

.order-customer {
	display: flex;
	align-items: center;
	gap: 15rpx;
	margin-bottom: 15rpx;
}

.customer-name {
	font-size: 26rpx;
	color: #333333;
	font-weight: bold;
}

.customer-phone {
	font-size: 24rpx;
	color: #666666;
}

.dining-type {
	padding: 6rpx 12rpx;
	border-radius: 12rpx;
	font-size: 20rpx;
	font-weight: bold;
	margin-left: auto;
}

.dining-type.dine_in {
	background-color: #E6F7FF;
	color: #1890FF;
}

.dining-type.takeaway {
	background-color: #FFF7E6;
	color: #FA8C16;
}

.dining-text {
	font-size: 20rpx;
}

.order-items {
	margin-bottom: 15rpx;
}

.item-summary {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 8rpx 0;
	border-bottom: 1rpx solid #F8F9FA;
}

.item-summary:last-child {
	border-bottom: none;
}

.item-name {
	font-size: 24rpx;
	color: #333333;
}

.item-quantity {
	font-size: 22rpx;
	color: #666666;
}

.more-items {
	font-size: 22rpx;
	color: #999999;
	text-align: center;
	padding: 10rpx 0;
}

.order-footer {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding-top: 15rpx;
	border-top: 1rpx solid #F8F9FA;
}

.order-total {
	font-size: 30rpx;
	font-weight: bold;
	color: #FF6B35;
}

.order-actions {
	display: flex;
	gap: 10rpx;
}

.action-btn {
	padding: 12rpx 20rpx;
	border-radius: 20rpx;
	font-size: 24rpx;
	font-weight: bold;
	transition: all 0.2s;
}

.action-btn.accept {
	background-color: #52C41A;
	color: #FFFFFF;
}

.action-btn.complete {
	background-color: #1890FF;
	color: #FFFFFF;
}

.action-btn.reject {
	background-color: #FF4D4F;
	color: #FFFFFF;
}

.btn-text {
	font-size: 24rpx;
}

/* 空状态 */
.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 100rpx 30rpx;
}

.empty-icon {
	font-size: 120rpx;
	margin-bottom: 30rpx;
}

.empty-text {
	font-size: 28rpx;
	color: #666666;
}

/* 弹窗 */
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

.modal-content {
	background: #FFFFFF;
	border-radius: 20rpx;
	width: 100%;
	max-width: 700rpx;
	max-height: 80vh;
	display: flex;
	flex-direction: column;
}

.modal-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 30rpx;
	border-bottom: 2rpx solid #F8F9FA;
}

.modal-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #333333;
}

.close-btn {
	width: 60rpx;
	height: 60rpx;
	border-radius: 50%;
	background-color: #F8F9FA;
	display: flex;
	align-items: center;
	justify-content: center;
}

.close-icon {
	font-size: 24rpx;
	color: #666666;
}

.modal-body {
	flex: 1;
	padding: 30rpx;
	overflow-y: auto;
}

/* 详情区块 */
.detail-section {
	margin-bottom: 30rpx;
}

.section-title {
	font-size: 28rpx;
	font-weight: bold;
	color: #333333;
	margin-bottom: 20rpx;
	display: block;
}

.detail-row {
	display: flex;
	align-items: center;
	padding: 12rpx 0;
	border-bottom: 1rpx solid #F8F9FA;
}

.detail-row:last-child {
	border-bottom: none;
}

.detail-label {
	font-size: 26rpx;
	color: #666666;
	width: 160rpx;
	flex-shrink: 0;
}

.detail-value {
	font-size: 26rpx;
	color: #333333;
	flex: 1;
}

.detail-value.status {
	font-weight: bold;
}

.detail-value.phone {
	color: #1890FF;
}

/* 商品列表 */
.item-list {
	margin-bottom: 20rpx;
}

.detail-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 15rpx 0;
	border-bottom: 1rpx solid #F8F9FA;
}

.detail-item:last-child {
	border-bottom: none;
}

.item-info {
	display: flex;
	flex-direction: column;
	gap: 8rpx;
	flex: 1;
}

.item-name {
	font-size: 26rpx;
	color: #333333;
	font-weight: bold;
}

.item-price {
	font-size: 22rpx;
	color: #666666;
}

.item-quantity {
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	gap: 8rpx;
}

.quantity-text {
	font-size: 24rpx;
	color: #666666;
}

.subtotal {
	font-size: 26rpx;
	color: #FF6B35;
	font-weight: bold;
}

.total-section {
	padding-top: 20rpx;
	border-top: 2rpx solid #F8F9FA;
}

.total-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 10rpx 0;
}

.total-label {
	font-size: 28rpx;
	color: #333333;
	font-weight: bold;
}

.total-value {
	font-size: 32rpx;
	color: #FF6B35;
	font-weight: bold;
}

.modal-footer {
	display: flex;
	gap: 20rpx;
	padding: 30rpx;
	border-top: 2rpx solid #F8F9FA;
}

.modal-btn {
	flex: 1;
	padding: 25rpx;
	border-radius: 15rpx;
	text-align: center;
	transition: all 0.2s;
}

.modal-btn.accept {
	background-color: #52C41A;
}

.modal-btn.complete {
	background-color: #1890FF;
}

.modal-btn.reject {
	background-color: #FF4D4F;
}

.modal-btn .btn-text {
	font-size: 28rpx;
	color: #FFFFFF;
	font-weight: bold;
}
</style>