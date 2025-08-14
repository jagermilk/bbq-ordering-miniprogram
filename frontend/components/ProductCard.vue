<template>
	<view class="product-card" @click="handleClick">
		<image 
			class="product-image" 
			:src="product.image || '/static/default-food.png'"
			mode="aspectFill"
			@error="handleImageError"
		></image>
		
		<view class="product-info">
			<view class="product-header">
				<text class="product-name">{{ product.name }}</text>
				<view class="product-status" v-if="showStatus">
					<view class="status-badge" :class="{ available: product.isAvailable }">
						<text class="status-text">{{ product.isAvailable ? '在售' : '下架' }}</text>
					</view>
				</view>
			</view>
			
			<text class="product-desc" v-if="product.description">{{ product.description }}</text>
			
			<view class="product-footer">
				<view class="price-section">
					<text class="product-price">{{ formatPrice(product.price) }}</text>
					<text class="product-category" v-if="product.category">{{ product.category }}</text>
				</view>
				
				<!-- 顾客模式：数量控制 -->
				<view class="quantity-controls" v-if="mode === 'customer' && product.isAvailable">
					<view class="quantity-btn minus" @click.stop="decreaseQuantity" v-if="quantity > 0">
						<text class="btn-icon">-</text>
					</view>
					<text class="quantity-text" v-if="quantity > 0">{{ quantity }}</text>
					<view class="quantity-btn plus" @click.stop="increaseQuantity">
						<text class="btn-icon">+</text>
					</view>
				</view>
				
				<!-- 商户模式：操作按钮 -->
				<view class="merchant-actions" v-if="mode === 'merchant'">
					<view class="action-btn edit" @click.stop="handleEdit">
						<text class="action-icon">✏️</text>
					</view>
					<view class="action-btn toggle" @click.stop="handleToggle">
						<text class="action-icon">{{ product.isAvailable ? '⏸️' : '▶️' }}</text>
					</view>
					<view class="action-btn delete" @click.stop="handleDelete">
						<text class="action-icon">🗑️</text>
					</view>
				</view>
			</view>
		</view>
		
		<!-- 不可用遮罩 -->
		<view class="unavailable-mask" v-if="!product.isAvailable && mode === 'customer'">
			<text class="unavailable-text">暂时售罄</text>
		</view>
	</view>
</template>

<script>
import { formatPrice } from '@/utils/utils.js';

export default {
	name: 'ProductCard',
	props: {
		// 商品信息
		product: {
			type: Object,
			required: true,
			default: () => ({})
		},
		// 模式：customer(顾客) | merchant(商户)
		mode: {
			type: String,
			default: 'customer'
		},
		// 是否显示状态标签
		showStatus: {
			type: Boolean,
			default: false
		},
		// 初始数量
		initialQuantity: {
			type: Number,
			default: 0
		}
	},
	
	data() {
		return {
			quantity: this.initialQuantity
		}
	},
	
	watch: {
		initialQuantity(newVal) {
			this.quantity = newVal;
		}
	},
	
	methods: {
		// 处理卡片点击
		handleClick() {
			this.$emit('click', this.product);
		},
		
		// 增加数量
		increaseQuantity() {
			if (!this.product.isAvailable) return;
			
			this.quantity++;
			this.$emit('quantity-change', {
				product: this.product,
				quantity: this.quantity,
				action: 'increase'
			});
		},
		
		// 减少数量
		decreaseQuantity() {
			if (this.quantity <= 0) return;
			
			this.quantity--;
			this.$emit('quantity-change', {
				product: this.product,
				quantity: this.quantity,
				action: 'decrease'
			});
		},
		
		// 处理编辑
		handleEdit() {
			this.$emit('edit', this.product);
		},
		
		// 处理状态切换
		handleToggle() {
			this.$emit('toggle', this.product);
		},
		
		// 处理删除
		handleDelete() {
			this.$emit('delete', this.product);
		},
		
		// 处理图片加载错误
		handleImageError() {
			console.log('图片加载失败:', this.product.image);
		},
		
		// 工具函数
		formatPrice
	}
}
</script>

<style scoped>
.product-card {
	background: #FFFFFF;
	border-radius: 20rpx;
	padding: 25rpx;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
	transition: all 0.2s;
	position: relative;
	overflow: hidden;
}

.product-card:active {
	transform: scale(0.98);
}

.product-image {
	width: 100%;
	height: 200rpx;
	border-radius: 15rpx;
	margin-bottom: 20rpx;
}

.product-info {
	display: flex;
	flex-direction: column;
	gap: 15rpx;
}

.product-header {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: 15rpx;
}

.product-name {
	font-size: 28rpx;
	font-weight: bold;
	color: #333333;
	line-height: 1.3;
	flex: 1;
	overflow: hidden;
	text-overflow: ellipsis;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
}

.product-status {
	flex-shrink: 0;
}

.status-badge {
	padding: 6rpx 12rpx;
	border-radius: 12rpx;
	background-color: #FF4D4F;
}

.status-badge.available {
	background-color: #52C41A;
}

.status-text {
	font-size: 20rpx;
	color: #FFFFFF;
	font-weight: bold;
}

.product-desc {
	font-size: 24rpx;
	color: #666666;
	line-height: 1.4;
	overflow: hidden;
	text-overflow: ellipsis;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
}

.product-footer {
	display: flex;
	justify-content: space-between;
	align-items: flex-end;
	gap: 15rpx;
}

.price-section {
	display: flex;
	flex-direction: column;
	gap: 8rpx;
	flex: 1;
}

.product-price {
	font-size: 32rpx;
	font-weight: bold;
	color: #FF6B35;
}

.product-category {
	font-size: 20rpx;
	color: #999999;
	background-color: #F8F9FA;
	padding: 4rpx 10rpx;
	border-radius: 10rpx;
	align-self: flex-start;
}

/* 数量控制 */
.quantity-controls {
	display: flex;
	align-items: center;
	gap: 15rpx;
	flex-shrink: 0;
}

.quantity-btn {
	width: 60rpx;
	height: 60rpx;
	border-radius: 50%;
	background-color: #FF6B35;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.2s;
}

.quantity-btn.minus {
	background-color: #E9ECEF;
}

.quantity-btn:active {
	transform: scale(0.9);
}

.btn-icon {
	font-size: 28rpx;
	color: #FFFFFF;
	font-weight: bold;
}

.quantity-btn.minus .btn-icon {
	color: #666666;
}

.quantity-text {
	font-size: 28rpx;
	font-weight: bold;
	color: #333333;
	min-width: 40rpx;
	text-align: center;
}

/* 商户操作 */
.merchant-actions {
	display: flex;
	gap: 10rpx;
	flex-shrink: 0;
}

.action-btn {
	width: 50rpx;
	height: 50rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.2s;
}

.action-btn.edit {
	background-color: #1890FF;
}

.action-btn.toggle {
	background-color: #52C41A;
}

.action-btn.delete {
	background-color: #FF4D4F;
}

.action-btn:active {
	transform: scale(0.9);
}

.action-icon {
	font-size: 20rpx;
}

/* 不可用遮罩 */
.unavailable-mask {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.6);
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 20rpx;
}

.unavailable-text {
	font-size: 28rpx;
	color: #FFFFFF;
	font-weight: bold;
	background: rgba(255, 77, 79, 0.9);
	padding: 15rpx 30rpx;
	border-radius: 25rpx;
}

/* 响应式调整 */
@media (max-width: 750rpx) {
	.product-card {
		padding: 20rpx;
	}
	
	.product-image {
		height: 180rpx;
	}
	
	.product-name {
		font-size: 26rpx;
	}
	
	.product-price {
		font-size: 28rpx;
	}
	
	.quantity-btn {
		width: 50rpx;
		height: 50rpx;
	}
	
	.btn-icon {
		font-size: 24rpx;
	}
}
</style>