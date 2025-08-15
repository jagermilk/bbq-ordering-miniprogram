<template>
	<view class="order-status">
		<view class="status-header">
			<text class="order-number">订单号：{{ order.orderNumber }}</text>
			<text class="order-time">{{ formatTime(order.createdAt) }}</text>
		</view>
		
		<view class="status-progress">
			<view class="progress-bar">
				<view 
					class="progress-fill" 
					:style="{ width: progressWidth + '%' }"
				></view>
			</view>
			
			<view class="status-steps">
				<view 
					class="status-step" 
					v-for="(step, index) in statusSteps" 
					:key="index"
					:class="{ 
						active: step.active, 
						completed: step.completed,
						rejected: step.rejected
					}"
				>
					<view class="step-icon">
						<text class="icon-text">{{ step.icon }}</text>
					</view>
					<text class="step-label">{{ step.label }}</text>
					<text class="step-time" v-if="step.time">{{ step.time }}</text>
				</view>
			</view>
		</view>
		
		<view class="status-info">
			<view class="current-status" :class="getStatusClass(order.status)">
				<text class="status-icon">{{ getStatusIcon(order.status) }}</text>
				<view class="status-content">
					<text class="status-title">{{ getStatusTitle(order.status) }}</text>
					<text class="status-desc">{{ getStatusDesc(order.status) }}</text>
				</view>
			</view>
			
			<!-- 预计完成时间 -->
			<view class="estimated-time" v-if="estimatedTime && order.status === 'preparing'">
				<text class="time-label">预计完成时间：</text>
				<text class="time-value">{{ estimatedTime }}</text>
			</view>
			
			<!-- 拒绝原因 -->
			<view class="reject-reason" v-if="order.status === 'rejected' && order.rejectReason">
				<text class="reason-label">拒绝原因：</text>
				<text class="reason-text">{{ order.rejectReason }}</text>
			</view>
		</view>
		
		<!-- 操作按钮 -->
		<view class="status-actions" v-if="showActions">
			<view 
				class="action-btn refresh" 
				@click="handleRefresh"
				v-if="order.status !== 'completed' && order.status !== 'rejected'"
			>
				<text class="btn-text">刷新状态</text>
			</view>
			
			<view 
				class="action-btn continue" 
				@click="handleContinue"
				v-if="order.status === 'completed'"
			>
				<text class="btn-text">继续点餐</text>
			</view>
			
			<view 
				class="action-btn reorder" 
				@click="handleReorder"
				v-if="order.status === 'rejected'"
			>
				<text class="btn-text">重新下单</text>
			</view>
		</view>
	</view>
</template>

<script>
import { formatTime, getOrderStatusText, navigateTo } from '@/utils/utils.js';

export default {
	name: 'OrderStatus',
	props: {
		// 订单信息
		order: {
			type: Object,
			required: true,
			default: () => ({})
		},
		// 是否显示操作按钮
		showActions: {
			type: Boolean,
			default: true
		},
		// 是否显示详细时间
		showDetailTime: {
			type: Boolean,
			default: false
		}
	},
	
	computed: {
		// 状态步骤
		statusSteps() {
			const steps = [
				{
					key: 'pending',
					label: '待接单',
					icon: '⏳',
					completed: this.isStepCompleted('pending'),
					active: this.order.status === 'pending',
					rejected: this.order.status === 'rejected',
					time: this.getStepTime('pending')
				},
				{
					key: 'preparing',
					label: '制作中',
					icon: '🔥',
					completed: this.isStepCompleted('preparing'),
					active: this.order.status === 'preparing',
					rejected: false,
					time: this.getStepTime('preparing')
				},
				{
					key: 'completed',
					label: '已完成',
					icon: '✅',
					completed: this.isStepCompleted('completed'),
					active: this.order.status === 'completed',
					rejected: false,
					time: this.getStepTime('completed')
				}
			];
			
			return steps;
		},
		
		// 进度条宽度
		progressWidth() {
			switch (this.order.status) {
				case 'pending':
					return 0;
				case 'preparing':
					return 50;
				case 'completed':
					return 100;
				case 'rejected':
					return 25;
				default:
					return 0;
			}
		},
		
		// 预计完成时间
		estimatedTime() {
			if (this.order.status !== 'preparing') return '';
			
			// 根据订单创建时间和商品数量估算
			const createdTime = new Date(this.order.createdAt);
			const itemCount = this.order.items?.reduce((total, item) => total + item.quantity, 0) || 1;
			// 每个商品预计2分钟，最少10分钟
			const estimatedMinutes = Math.max(10, itemCount * 2);
			const estimatedTime = new Date(createdTime.getTime() + estimatedMinutes * 60000);
			
			return this.formatTime(estimatedTime.toISOString());
		}
	},
	
	methods: {
		// 判断步骤是否完成
		isStepCompleted(stepKey) {
			const statusOrder = ['pending', 'preparing', 'completed'];
			const currentIndex = statusOrder.indexOf(this.order.status);
			const stepIndex = statusOrder.indexOf(stepKey);
			
			if (this.order.status === 'rejected') {
				return stepKey === 'pending';
			}
			
			return currentIndex > stepIndex;
		},
		
		// 获取步骤时间
		getStepTime(stepKey) {
			if (!this.showDetailTime) return '';
			
			// 这里可以根据实际业务逻辑返回各步骤的时间
			if (stepKey === 'pending' && this.order.createdAt) {
				return this.formatTime(this.order.createdAt);
			}
			
			if (stepKey === 'preparing' && this.order.acceptedAt) {
				return this.formatTime(this.order.acceptedAt);
			}
			
			if (stepKey === 'completed' && this.order.completedAt) {
				return this.formatTime(this.order.completedAt);
			}
			
			return '';
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
		
		// 获取状态图标
		getStatusIcon(status) {
			const icons = {
				pending: '⏳',
				preparing: '🔥',
				completed: '✅',
				rejected: '❌'
			};
			return icons[status] || '❓';
		},
		
		// 获取状态标题
		getStatusTitle(status) {
			return getOrderStatusText(status);
		},
		
		// 获取状态描述
		getStatusDesc(status) {
			const descriptions = {
				pending: '商家正在确认您的订单，请稍候...',
				preparing: '商家正在为您精心制作，请耐心等待',
				completed: '您的订单已制作完成，请及时取餐',
				rejected: '很抱歉，商家无法接受此订单'
			};
			return descriptions[status] || '';
		},
		
		// 刷新状态
		handleRefresh() {
			this.$emit('refresh', this.order);
		},
		
		// 继续点餐
		handleContinue() {
			this.$emit('continue', this.order);
			navigateTo('/pages/menu/menu');
		},
		
		// 重新下单
		handleReorder() {
			this.$emit('reorder', this.order);
			navigateTo('/pages/menu/menu');
		},
		
		// 工具函数
		formatTime
	}
}
</script>

<style scoped>
.order-status {
	background: #FFFFFF;
	border-radius: 20rpx;
	padding: 30rpx;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

/* 状态头部 */
.status-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 30rpx;
	padding-bottom: 20rpx;
	border-bottom: 1rpx solid #F8F9FA;
}

.order-number {
	font-size: 28rpx;
	font-weight: bold;
	color: #333333;
}

.order-time {
	font-size: 24rpx;
	color: #666666;
}

/* 进度条 */
.status-progress {
	margin-bottom: 30rpx;
}

.progress-bar {
	height: 6rpx;
	background-color: #F8F9FA;
	border-radius: 3rpx;
	margin-bottom: 30rpx;
	overflow: hidden;
}

.progress-fill {
	height: 100%;
	background: linear-gradient(90deg, #FF6B35, #FFA940);
	border-radius: 3rpx;
	transition: width 0.5s ease;
}

/* 状态步骤 */
.status-steps {
	display: flex;
	justify-content: space-between;
	position: relative;
}

.status-step {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 10rpx;
	flex: 1;
	position: relative;
}

.step-icon {
	width: 60rpx;
	height: 60rpx;
	border-radius: 50%;
	background-color: #F8F9FA;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.3s;
	border: 3rpx solid #F8F9FA;
}

.status-step.active .step-icon {
	background-color: #FF6B35;
	border-color: #FF6B35;
}

.status-step.completed .step-icon {
	background-color: #52C41A;
	border-color: #52C41A;
}

.status-step.rejected .step-icon {
	background-color: #FF4D4F;
	border-color: #FF4D4F;
}

.icon-text {
	font-size: 24rpx;
	color: #999999;
}

.status-step.active .icon-text,
.status-step.completed .icon-text,
.status-step.rejected .icon-text {
	color: #FFFFFF;
}

.step-label {
	font-size: 22rpx;
	color: #666666;
	font-weight: bold;
	text-align: center;
}

.status-step.active .step-label {
	color: #FF6B35;
}

.status-step.completed .step-label {
	color: #52C41A;
}

.status-step.rejected .step-label {
	color: #FF4D4F;
}

.step-time {
	font-size: 20rpx;
	color: #999999;
	text-align: center;
}

/* 当前状态信息 */
.status-info {
	margin-bottom: 30rpx;
}

.current-status {
	display: flex;
	align-items: center;
	gap: 20rpx;
	padding: 25rpx;
	border-radius: 15rpx;
	margin-bottom: 20rpx;
}

.current-status.pending {
	background: linear-gradient(135deg, #FFF7E6, #FFFBE6);
}

.current-status.preparing {
	background: linear-gradient(135deg, #E6F7FF, #F0F9FF);
}

.current-status.completed {
	background: linear-gradient(135deg, #F6FFED, #FCFFE6);
}

.current-status.rejected {
	background: linear-gradient(135deg, #FFF2F0, #FFF1F0);
}

.status-icon {
	font-size: 48rpx;
	line-height: 1;
}

.status-content {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 8rpx;
}

.status-title {
	font-size: 28rpx;
	font-weight: bold;
	color: #333333;
}

.status-desc {
	font-size: 24rpx;
	color: #666666;
	line-height: 1.4;
}

/* 预计时间 */
.estimated-time {
	display: flex;
	align-items: center;
	gap: 10rpx;
	padding: 15rpx 20rpx;
	background-color: #E6F7FF;
	border-radius: 10rpx;
	margin-bottom: 15rpx;
}

.time-label {
	font-size: 24rpx;
	color: #666666;
}

.time-value {
	font-size: 24rpx;
	color: #1890FF;
	font-weight: bold;
}

/* 拒绝原因 */
.reject-reason {
	display: flex;
	flex-direction: column;
	gap: 10rpx;
	padding: 15rpx 20rpx;
	background-color: #FFF2F0;
	border-radius: 10rpx;
}

.reason-label {
	font-size: 24rpx;
	color: #666666;
}

.reason-text {
	font-size: 24rpx;
	color: #FF4D4F;
	line-height: 1.4;
}

/* 操作按钮 */
.status-actions {
	display: flex;
	gap: 15rpx;
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
	background-color: #52C41A;
}

.action-btn.reorder {
	background-color: #FF6B35;
}

.action-btn:active {
	transform: scale(0.98);
}

.btn-text {
	font-size: 26rpx;
	color: #666666;
	font-weight: bold;
}

.action-btn.continue .btn-text,
.action-btn.reorder .btn-text {
	color: #FFFFFF;
}

/* 响应式调整 */
@media (max-width: 750rpx) {
	.order-status {
		padding: 25rpx;
	}
	
	.step-icon {
		width: 50rpx;
		height: 50rpx;
	}
	
	.icon-text {
		font-size: 20rpx;
	}
	
	.step-label {
		font-size: 20rpx;
	}
	
	.status-icon {
		font-size: 40rpx;
	}
	
	.status-title {
		font-size: 26rpx;
	}
	
	.status-desc {
		font-size: 22rpx;
	}
}
</style>