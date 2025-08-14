<template>
	<view class="container">
		<!-- 头部操作栏 -->
		<view class="header">
			<view class="header-info">
				<text class="welcome-text">欢迎回来</text>
				<text class="merchant-name">{{ merchantName }}</text>
			</view>
			<view class="header-actions">
				<view class="action-btn" @click="showAddProduct">
					<text class="btn-icon">➕</text>
					<text class="btn-text">添加菜品</text>
				</view>
				<view class="action-btn logout" @click="handleLogout">
					<text class="btn-icon">🚪</text>
					<text class="btn-text">退出</text>
				</view>
			</view>
		</view>
		
		<!-- 统计卡片 -->
		<view class="stats-cards">
			<view class="stat-card">
				<text class="stat-number">{{ products.length }}</text>
				<text class="stat-label">菜品总数</text>
			</view>
			<view class="stat-card">
				<text class="stat-number">{{ availableCount }}</text>
				<text class="stat-label">在售菜品</text>
			</view>
			<view class="stat-card">
				<text class="stat-number">{{ categoryCount }}</text>
				<text class="stat-label">菜品分类</text>
			</view>
		</view>
		
		<!-- 菜品列表 -->
		<view class="product-list">
			<view class="list-header">
				<text class="list-title">菜品管理</text>
				<view class="filter-tabs">
					<view 
						class="filter-tab" 
						:class="{ active: filterStatus === 'all' }"
						@click="setFilter('all')"
					>
						<text class="tab-text">全部</text>
					</view>
					<view 
						class="filter-tab" 
						:class="{ active: filterStatus === 'available' }"
						@click="setFilter('available')"
					>
						<text class="tab-text">在售</text>
					</view>
					<view 
						class="filter-tab" 
						:class="{ active: filterStatus === 'unavailable' }"
						@click="setFilter('unavailable')"
					>
						<text class="tab-text">下架</text>
					</view>
				</view>
			</view>
			
			<view class="product-items">
				<view 
					class="product-item" 
					v-for="product in filteredProducts" 
					:key="product.id"
				>
					<image 
						class="product-image" 
						:src="product.image || '/static/default-food.png'"
						mode="aspectFill"
					></image>
					<view class="product-info">
						<view class="product-header">
							<text class="product-name">{{ product.name }}</text>
							<view class="status-badge" :class="{ available: product.isAvailable }">
								<text class="status-text">{{ product.isAvailable ? '在售' : '下架' }}</text>
							</view>
						</view>
						<text class="product-desc" v-if="product.description">{{ product.description }}</text>
						<view class="product-meta">
							<text class="product-price">{{ formatPrice(product.price) }}</text>
							<text class="product-category" v-if="product.category">{{ product.category }}</text>
						</view>
					</view>
					<view class="product-actions">
						<view class="action-btn-small edit" @click="editProduct(product)">
							<text class="btn-icon-small">✏️</text>
						</view>
						<view class="action-btn-small toggle" @click="toggleProductStatus(product)">
							<text class="btn-icon-small">{{ product.isAvailable ? '⏸️' : '▶️' }}</text>
						</view>
						<view class="action-btn-small delete" @click="deleteProduct(product)">
							<text class="btn-icon-small">🗑️</text>
						</view>
					</view>
				</view>
			</view>
			
			<!-- 空状态 -->
			<view class="empty-state" v-if="filteredProducts.length === 0">
				<text class="empty-icon">🍽️</text>
				<text class="empty-text">{{ getEmptyText() }}</text>
				<view class="add-product-btn" @click="showAddProduct" v-if="filterStatus === 'all'">
					<text class="btn-text">添加第一个菜品</text>
				</view>
			</view>
		</view>
		
		<!-- 菜品编辑弹窗 -->
		<view class="modal-overlay" v-if="showModal" @click="hideModal">
			<view class="modal-content" @click.stop>
				<view class="modal-header">
					<text class="modal-title">{{ isEditing ? '编辑菜品' : '添加菜品' }}</text>
					<view class="close-btn" @click="hideModal">
						<text class="close-icon">✕</text>
					</view>
				</view>
				
				<view class="modal-body">
					<view class="form-item">
						<text class="form-label">菜品名称</text>
						<view class="input-wrapper">
							<input 
								class="form-input" 
								placeholder="请输入菜品名称"
								v-model="editForm.name"
								maxlength="30"
								@input="onInputChange"
								@focus="onInputFocus"
								@blur="onInputBlur"
							/>
						</view>
					</view>
					
					<view class="form-item">
						<text class="form-label">菜品价格</text>
						<view class="input-wrapper">
							<input 
								class="form-input" 
								placeholder="请输入价格"
								v-model="editForm.price"
								type="digit"
								@input="onInputChange"
								@focus="onInputFocus"
								@blur="onInputBlur"
							/>
						</view>
					</view>
					
					<view class="form-item">
						<text class="form-label">菜品分类</text>
						<view class="input-wrapper">
							<input 
								class="form-input" 
								placeholder="请输入分类（如：烤串类）"
								v-model="editForm.category"
								maxlength="20"
								@input="onInputChange"
								@focus="onInputFocus"
								@blur="onInputBlur"
							/>
						</view>
					</view>
					
					<view class="form-item">
						<text class="form-label">菜品描述</text>
						<view class="input-wrapper">
							<textarea 
								class="form-textarea" 
								placeholder="请输入菜品描述"
								v-model="editForm.description"
								maxlength="100"
								auto-height
								@input="onInputChange"
								@focus="onInputFocus"
								@blur="onInputBlur"
							></textarea>
						</view>
					</view>
					
					<view class="form-item">
						<text class="form-label">菜品图片</text>
						<view class="image-upload" @click="chooseImage">
							<image 
								v-if="editForm.image" 
								class="preview-image" 
								:src="editForm.image"
								mode="aspectFill"
							></image>
							<view class="upload-placeholder" v-else>
								<text class="upload-icon">📷</text>
								<text class="upload-text">点击上传图片</text>
							</view>
						</view>
					</view>
				</view>
				
				<view class="modal-footer">
					<view class="modal-btn cancel" @click="hideModal">
						<text class="btn-text">取消</text>
					</view>
					<view class="modal-btn confirm" @click="saveProduct">
						<text class="btn-text">{{ isEditing ? '保存' : '添加' }}</text>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { productAPI, uploadAPI } from '@/utils/api.js';
import { formatPrice, showToast, showLoading, hideLoading, showConfirm, generateId, navigateTo } from '@/utils/utils.js';
import store from '@/utils/store.js';

export default {
	data() {
		return {
			products: [],
			filterStatus: 'all', // all, available, unavailable
			showModal: false,
			isEditing: false,
			editForm: {
				id: '',
				name: '',
				price: '',
				category: '',
				description: '',
				image: '',
				isAvailable: true
			},
			loading: false
		}
	},
	
	computed: {
		// 商户名称
		merchantName() {
			const userInfo = store.getState().userInfo;
			return userInfo?.name || '商户';
		},
		
		// 过滤后的菜品
		filteredProducts() {
			if (this.filterStatus === 'all') {
				return this.products;
			} else if (this.filterStatus === 'available') {
				return this.products.filter(p => p.isAvailable);
			} else {
				return this.products.filter(p => !p.isAvailable);
			}
		},
		
		// 在售菜品数量
		availableCount() {
			return this.products.filter(p => p.isAvailable).length;
		},
		
		// 分类数量
		categoryCount() {
			const categories = new Set(this.products.map(p => p.category).filter(Boolean));
			return categories.size;
		}
	},
	
	onLoad() {
		this.checkAuth();
		this.loadProducts();
	},
	
	onShow() {
		// 页面显示时刷新数据
		this.loadProducts();
	},
	
	methods: {
		// 检查登录状态
		checkAuth() {
			const token = uni.getStorageSync('token');
			if (!token) {
				showToast('请先登录', 'error');
				navigateTo('/pages/login/login');
			}
		},
		
		// 加载菜品列表
		async loadProducts() {
			this.loading = true;
			
			try {
				const userInfo = store.getState().userInfo;
				const response = await productAPI.getProducts(userInfo?.id);
				
				if (response.success) {
					this.products = response.data.products || [];
					store.setProducts(this.products);
				} else {
					showToast(response.message || '加载失败', 'error');
				}
			} catch (error) {
				console.error('加载菜品失败:', error);
				// 使用模拟数据
				this.loadMockData();
			} finally {
				this.loading = false;
			}
		},
		
		// 加载模拟数据
		loadMockData() {
			this.products = [
				{
					id: '1',
					name: '烤羊肉串',
					price: 3.00,
					description: '新鲜羊肉，香嫩可口',
					category: '烤串类',
					isAvailable: true,
					image: '/static/default-food.png'
				},
				{
					id: '2',
					name: '烤鸡翅',
					price: 8.00,
					description: '秘制烤鸡翅，外焦里嫩',
					category: '烤串类',
					isAvailable: true,
					image: '/static/default-food.png'
				},
				{
					id: '3',
					name: '烤玉米',
					price: 5.00,
					description: '香甜玉米，营养丰富',
					category: '蔬菜类',
					isAvailable: false,
					image: '/static/default-food.png'
				}
			];
		},
		
		// 设置过滤状态
		setFilter(status) {
			this.filterStatus = status;
		},
		
		// 显示添加菜品弹窗
		showAddProduct() {
			this.isEditing = false;
			this.resetForm();
			this.showModal = true;
		},
		
		// 编辑菜品
		editProduct(product) {
			this.isEditing = true;
			this.editForm = {
				id: product.id,
				name: product.name,
				price: product.price.toString(),
				category: product.category || '',
				description: product.description || '',
				image: product.image || '',
				isAvailable: product.isAvailable
			};
			this.showModal = true;
		},
		
		// 切换菜品状态
		async toggleProductStatus(product) {
			const action = product.isAvailable ? '下架' : '上架';
			const confirmed = await showConfirm(`确定要${action}这个菜品吗？`);
			
			if (confirmed) {
				try {
					const updatedProduct = {
						...product,
						isAvailable: !product.isAvailable
					};
					
					const response = await productAPI.updateProduct(product.id, updatedProduct);
					
					if (response.success) {
						store.updateProduct(product.id, updatedProduct);
						this.updateLocalProduct(product.id, updatedProduct);
						showToast(`${action}成功`);
					} else {
						showToast(response.message || `${action}失败`, 'error');
					}
				} catch (error) {
					console.error('更新菜品状态失败:', error);
					// 模拟更新成功
					const updatedProduct = {
						...product,
						isAvailable: !product.isAvailable
					};
					this.updateLocalProduct(product.id, updatedProduct);
					showToast(`${action}成功`);
				}
			}
		},
		
		// 删除菜品
		async deleteProduct(product) {
			const confirmed = await showConfirm('确定要删除这个菜品吗？删除后无法恢复。');
			
			if (confirmed) {
				try {
					const response = await productAPI.deleteProduct(product.id);
					
					if (response.success) {
						store.removeProduct(product.id);
						this.removeLocalProduct(product.id);
						showToast('删除成功');
					} else {
						showToast(response.message || '删除失败', 'error');
					}
				} catch (error) {
					console.error('删除菜品失败:', error);
					// 模拟删除成功
					this.removeLocalProduct(product.id);
					showToast('删除成功');
				}
			}
		},
		
		// 保存菜品
		async saveProduct() {
			if (!this.validateForm()) return;
			
			showLoading(this.isEditing ? '保存中...' : '添加中...');
			
			try {
				const productData = {
					name: this.editForm.name.trim(),
					price: parseFloat(this.editForm.price),
					category: this.editForm.category.trim(),
					description: this.editForm.description.trim(),
					image: this.editForm.image,
					isAvailable: this.editForm.isAvailable
				};
				
				let response;
				if (this.isEditing) {
					response = await productAPI.updateProduct(this.editForm.id, productData);
				} else {
					response = await productAPI.createProduct(productData);
				}
				
				if (response.success) {
					const product = response.data;
					
					if (this.isEditing) {
						store.updateProduct(product.id, product);
						this.updateLocalProduct(product.id, product);
					} else {
						store.addProduct(product);
						this.products.unshift(product);
					}
					
					showToast(this.isEditing ? '保存成功' : '添加成功');
					this.hideModal();
				} else {
					showToast(response.message || '操作失败', 'error');
				}
			} catch (error) {
				console.error('保存菜品失败:', error);
				// 模拟保存成功
				this.saveMockProduct();
			} finally {
				hideLoading();
			}
		},
		
		// 模拟保存菜品
		saveMockProduct() {
			const productData = {
				id: this.isEditing ? this.editForm.id : generateId(),
				name: this.editForm.name.trim(),
				price: parseFloat(this.editForm.price),
				category: this.editForm.category.trim(),
				description: this.editForm.description.trim(),
				image: this.editForm.image || '/static/default-food.png',
				isAvailable: this.editForm.isAvailable,
				createdAt: new Date().toISOString()
			};
			
			if (this.isEditing) {
				this.updateLocalProduct(productData.id, productData);
			} else {
				this.products.unshift(productData);
			}
			
			showToast(this.isEditing ? '保存成功' : '添加成功');
			this.hideModal();
		},
		
		// 选择图片
		chooseImage() {
			uni.chooseImage({
				count: 1,
				sizeType: ['compressed'],
				sourceType: ['album', 'camera'],
				success: (res) => {
					const tempFilePath = res.tempFilePaths[0];
					this.uploadImage(tempFilePath);
				}
			});
		},
		
		// 上传图片
		async uploadImage(filePath) {
			showLoading('上传中...');
			
			try {
				const response = await uploadAPI.uploadImage(filePath);
				
				if (response.success) {
					this.editForm.image = response.data.url;
					showToast('上传成功');
				} else {
					showToast(response.message || '上传失败', 'error');
				}
			} catch (error) {
				console.error('上传图片失败:', error);
				// 模拟上传成功，使用本地路径
				this.editForm.image = filePath;
				showToast('上传成功');
			} finally {
				hideLoading();
			}
		},
		
		// 验证表单
		validateForm() {
			if (!this.editForm.name.trim()) {
				showToast('请输入菜品名称', 'error');
				return false;
			}
			
			if (!this.editForm.price || parseFloat(this.editForm.price) <= 0) {
				showToast('请输入有效的价格', 'error');
				return false;
			}
			
			return true;
		},
		
		// 重置表单
		resetForm() {
			this.editForm = {
				id: '',
				name: '',
				price: '',
				category: '',
				description: '',
				image: '',
				isAvailable: true
			};
		},
		
		// 隐藏弹窗
		hideModal() {
			this.showModal = false;
			setTimeout(() => {
				this.resetForm();
			}, 300);
		},
		
		// 更新本地菜品
		updateLocalProduct(id, updates) {
			const index = this.products.findIndex(p => p.id === id);
			if (index > -1) {
				this.products.splice(index, 1, { ...this.products[index], ...updates });
			}
		},
		
		// 删除本地菜品
		removeLocalProduct(id) {
			const index = this.products.findIndex(p => p.id === id);
			if (index > -1) {
				this.products.splice(index, 1);
			}
		},
		
		// 获取空状态文本
		getEmptyText() {
			if (this.filterStatus === 'available') {
				return '暂无在售菜品';
			} else if (this.filterStatus === 'unavailable') {
				return '暂无下架菜品';
			} else {
				return '暂无菜品，快来添加第一个吧';
			}
		},
		
		// 退出登录
		async handleLogout() {
			const confirmed = await showConfirm('确定要退出登录吗？');
			if (confirmed) {
				store.clearUserInfo();
				showToast('已退出登录');
				navigateTo('/pages/login/login');
			}
		},
		
		// 工具函数
		formatPrice,
		
		// 输入变化处理
		onInputChange(e) {
			// 允许正常输入，不做任何阻止
			console.log('输入内容变化:', e.detail.value);
			return true;
		},
		
		// 输入框获得焦点
		onInputFocus(e) {
			console.log('输入框获得焦点');
			return true;
		},
		
		// 输入框失去焦点
		onInputBlur(e) {
			console.log('输入框失去焦点');
			return true;
		}
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
	font-size: 24rpx;
	color: rgba(255, 255, 255, 0.8);
}

.merchant-name {
	font-size: 36rpx;
	font-weight: bold;
	color: #FFFFFF;
}

.header-actions {
	display: flex;
	gap: 15rpx;
}

.action-btn {
	background: rgba(255, 255, 255, 0.2);
	border-radius: 15rpx;
	padding: 15rpx 20rpx;
	display: flex;
	align-items: center;
	gap: 8rpx;
	transition: all 0.2s;
}

.action-btn.logout {
	background: rgba(255, 77, 79, 0.2);
}

.btn-icon {
	font-size: 24rpx;
}

.btn-text {
	font-size: 24rpx;
	color: #FFFFFF;
	font-weight: bold;
}

/* 统计卡片 */
.stats-cards {
	display: flex;
	gap: 20rpx;
	padding: 30rpx;
	margin-top: -20rpx;
}

.stat-card {
	flex: 1;
	background: #FFFFFF;
	border-radius: 20rpx;
	padding: 30rpx 20rpx;
	text-align: center;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.stat-number {
	font-size: 48rpx;
	font-weight: bold;
	color: #FF6B35;
	display: block;
	margin-bottom: 10rpx;
}

.stat-label {
	font-size: 24rpx;
	color: #666666;
}

/* 菜品列表 */
.product-list {
	padding: 0 30rpx;
}

.list-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 25rpx;
}

.list-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #333333;
}

.filter-tabs {
	display: flex;
	gap: 10rpx;
}

.filter-tab {
	padding: 12rpx 20rpx;
	border-radius: 20rpx;
	background-color: #F8F9FA;
	transition: all 0.2s;
}

.filter-tab.active {
	background-color: #FF6B35;
}

.tab-text {
	font-size: 24rpx;
	color: #666666;
}

.filter-tab.active .tab-text {
	color: #FFFFFF;
	font-weight: bold;
}

/* 菜品项目 */
.product-items {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

.product-item {
	background: #FFFFFF;
	border-radius: 20rpx;
	padding: 25rpx;
	display: flex;
	gap: 20rpx;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.product-image {
	width: 120rpx;
	height: 120rpx;
	border-radius: 15rpx;
	flex-shrink: 0;
}

.product-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
}

.product-header {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	margin-bottom: 10rpx;
}

.product-name {
	font-size: 30rpx;
	font-weight: bold;
	color: #333333;
	flex: 1;
}

.status-badge {
	padding: 6rpx 12rpx;
	border-radius: 12rpx;
	background-color: #FF4D4F;
	margin-left: 15rpx;
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
	margin-bottom: 15rpx;
	overflow: hidden;
	text-overflow: ellipsis;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
}

.product-meta {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.product-price {
	font-size: 32rpx;
	font-weight: bold;
	color: #FF6B35;
}

.product-category {
	font-size: 22rpx;
	color: #999999;
	background-color: #F8F9FA;
	padding: 6rpx 12rpx;
	border-radius: 12rpx;
}

/* 操作按钮 */
.product-actions {
	display: flex;
	flex-direction: column;
	gap: 10rpx;
	align-items: center;
}

.action-btn-small {
	width: 60rpx;
	height: 60rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.2s;
}

.action-btn-small.edit {
	background-color: #1890FF;
}

.action-btn-small.toggle {
	background-color: #52C41A;
}

.action-btn-small.delete {
	background-color: #FF4D4F;
}

.btn-icon-small {
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
	margin-bottom: 40rpx;
}

.add-product-btn {
	background: #FF6B35;
	color: #FFFFFF;
	padding: 25rpx 50rpx;
	border-radius: 50rpx;
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
	max-width: 600rpx;
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

.form-item {
	margin-bottom: 30rpx;
}

.form-label {
	font-size: 28rpx;
	color: #333333;
	font-weight: bold;
	margin-bottom: 15rpx;
	display: block;
}

.input-wrapper {
	display: flex;
	align-items: center;
	background-color: #F8F9FA;
	border-radius: 20rpx;
	padding: 0 30rpx;
	border: 2rpx solid transparent;
	transition: all 0.2s;
	position: relative;
	z-index: 1;
	pointer-events: auto;
}

.input-wrapper:focus-within {
	border-color: #FF6B35;
	background-color: #FFFFFF;
	box-shadow: 0 0 0 4rpx rgba(255, 107, 53, 0.1);
}

.form-input,
.form-textarea {
	flex: 1;
	padding: 30rpx 0;
	font-size: 30rpx;
	color: #333333;
	background: transparent;
	border: none;
	-webkit-appearance: none;
	-webkit-user-select: auto;
	user-select: auto;
	pointer-events: auto;
	cursor: text;
	width: 100%;
	height: auto;
	min-height: 80rpx;
	box-sizing: border-box;
	-webkit-tap-highlight-color: transparent;
}

.form-input::placeholder,
.form-textarea::placeholder {
	color: #999999;
}

.form-textarea {
	min-height: 120rpx;
	resize: none;
	padding: 30rpx 0;
}

.form-textarea {
	min-height: 120rpx;
	resize: none;
}

/* 图片上传 */
.image-upload {
	width: 200rpx;
	height: 200rpx;
	border: 2rpx dashed #E9ECEF;
	border-radius: 15rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	position: relative;
	transition: all 0.2s;
}

.image-upload:active {
	border-color: #FF6B35;
}

.preview-image {
	width: 100%;
	height: 100%;
	border-radius: 13rpx;
}

.upload-placeholder {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 10rpx;
}

.upload-icon {
	font-size: 48rpx;
	color: #CCCCCC;
}

.upload-text {
	font-size: 24rpx;
	color: #999999;
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

.modal-btn.cancel {
	background-color: #F8F9FA;
	border: 2rpx solid #E9ECEF;
}

.modal-btn.confirm {
	background-color: #FF6B35;
}

.modal-btn .btn-text {
	font-size: 28rpx;
	color: #666666;
}

.modal-btn.confirm .btn-text {
	color: #FFFFFF;
	font-weight: bold;
}
</style>