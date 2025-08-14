<template>
	<view class="container">
		<view class="login-card">
			<view class="header">
				<image class="logo" src="/static/logo.png"></image>
				<text class="title">商户登录</text>
				<text class="subtitle">管理您的烧烤摊</text>
			</view>
			
			<view class="form">
				<view class="form-item">
					<view class="input-wrapper">
						<text class="input-icon">👤</text>
						<input 
							class="form-input" 
							placeholder="请输入用户名"
							v-model="form.username"
							maxlength="20"
							@input="clearError"
							@focus="onInputFocus"
							@blur="onInputBlur"
						/>
					</view>
				</view>
				
				<view class="form-item">
					<view class="input-wrapper">
						<text class="input-icon">🔒</text>
						<input 
							class="form-input" 
							placeholder="请输入密码"
							v-model="form.password"
							type="password"
							maxlength="20"
							@input="clearError"
							@focus="onInputFocus"
							@blur="onInputBlur"
						/>
					</view>
				</view>
				
				<view class="error-message" v-if="errorMessage">
					<text class="error-text">{{ errorMessage }}</text>
				</view>
				
				<view class="login-btn" :class="{ disabled: !canLogin || logging }" @click="handleLogin">
					<text class="btn-text">{{ logging ? '登录中...' : '登录' }}</text>
				</view>
			</view>
			
			<view class="demo-info">
				<text class="demo-title">演示账号</text>
				<text class="demo-text">用户名：admin</text>
				<text class="demo-text">密码：123456</text>
			</view>
		</view>
		
		<view class="footer">
			<text class="footer-text">烧烤摆摊点单系统</text>
			<text class="footer-desc">为您的生意提供数字化解决方案</text>
		</view>
	</view>
</template>

<script>
import { authAPI } from '@/utils/api.js';
import { showToast, showLoading, hideLoading, navigateTo } from '@/utils/utils.js';
import store from '@/utils/store.js';

export default {
	data() {
		return {
			form: {
				username: '',
				password: ''
			},
			errorMessage: '',
			logging: false
		}
	},
	
	computed: {
		// 是否可以登录
		canLogin() {
			return this.form.username.trim() && this.form.password.trim();
		}
	},
	
	onLoad() {
		// 检查是否已经登录
		const token = uni.getStorageSync('token');
		if (token) {
			// 已登录，跳转到商户管理页面
			this.redirectToMerchant();
		}
	},
	
	methods: {
		// 处理登录
		async handleLogin() {
			if (!this.canLogin || this.logging) return;
			
			this.logging = true;
			this.errorMessage = '';
			showLoading('登录中...');
			
			try {
				const response = await authAPI.login(this.form.username, this.form.password);
				
				if (response.success) {
					// 登录成功
					const { token, user } = response.data;
					
					// 保存用户信息和token
					store.setToken(token);
					store.setUserInfo(user);
					
					showToast('登录成功！');
					
					// 跳转到商户管理页面
					setTimeout(() => {
						this.redirectToMerchant();
					}, 1000);
				} else {
					this.errorMessage = response.message || '登录失败';
				}
			} catch (error) {
				console.error('登录失败:', error);
				// 使用演示账号进行模拟登录
				this.handleDemoLogin();
			} finally {
				this.logging = false;
				hideLoading();
			}
		},
		
		// 演示登录
		handleDemoLogin() {
			if (this.form.username === 'admin' && this.form.password === '123456') {
				// 模拟登录成功
				const mockUser = {
					id: '689d94697c14eb9f089306fd',
					username: 'admin',
					name: '烧烤摊示例店',
					role: 'merchant'
				};
				
				const mockToken = 'mock_token_' + Date.now();
				
				// 保存用户信息
				store.setToken(mockToken);
				store.setUserInfo(mockUser);
				
				showToast('登录成功！');
				
				// 跳转到商户管理页面
				setTimeout(() => {
					this.redirectToMerchant();
				}, 1000);
			} else {
				this.errorMessage = '用户名或密码错误';
			}
		},
		
		// 跳转到商户管理页面
		redirectToMerchant() {
			uni.redirectTo({
				url: '/pages/merchant/product'
			});
		},
		
		// 清除错误信息
		clearError() {
			if (this.errorMessage) {
				this.errorMessage = '';
			}
		},
		
		// 输入框获得焦点
		onInputFocus(e) {
			console.log('输入框获得焦点');
		},
		
		// 输入框失去焦点
		onInputBlur(e) {
			console.log('输入框失去焦点');
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
	justify-content: center;
	align-items: center;
	padding: 60rpx 40rpx;
}

.login-card {
	background: #FFFFFF;
	border-radius: 30rpx;
	padding: 60rpx 40rpx;
	width: 100%;
	max-width: 600rpx;
	box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.1);
}

/* 头部 */
.header {
	text-align: center;
	margin-bottom: 60rpx;
}

.logo {
	width: 120rpx;
	height: 120rpx;
	border-radius: 20rpx;
	margin-bottom: 30rpx;
}

.title {
	font-size: 48rpx;
	font-weight: bold;
	color: #333333;
	display: block;
	margin-bottom: 15rpx;
}

.subtitle {
	font-size: 28rpx;
	color: #666666;
	display: block;
}

/* 表单 */
.form {
	margin-bottom: 40rpx;
}

.form-item {
	margin-bottom: 30rpx;
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

.input-icon {
	font-size: 32rpx;
	margin-right: 20rpx;
	color: #666666;
}

.form-input {
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

.form-input::placeholder {
	color: #999999;
}

/* 错误信息 */
.error-message {
	margin-bottom: 30rpx;
	padding: 20rpx;
	background-color: rgba(255, 77, 79, 0.1);
	border-radius: 15rpx;
	border-left: 6rpx solid #FF4D4F;
}

.error-text {
	font-size: 26rpx;
	color: #FF4D4F;
}

/* 登录按钮 */
.login-btn {
	background: #FF6B35;
	border-radius: 20rpx;
	padding: 30rpx;
	text-align: center;
	transition: all 0.2s;
	box-shadow: 0 8rpx 24rpx rgba(255, 107, 53, 0.3);
}

.login-btn:active {
	transform: scale(0.98);
}

.login-btn.disabled {
	background-color: #CCCCCC;
	box-shadow: none;
	transform: none;
}

.btn-text {
	font-size: 32rpx;
	font-weight: bold;
	color: #FFFFFF;
}

.login-btn.disabled .btn-text {
	color: #999999;
}

/* 演示信息 */
.demo-info {
	background-color: #F8F9FA;
	border-radius: 15rpx;
	padding: 25rpx;
	text-align: center;
}

.demo-title {
	font-size: 26rpx;
	font-weight: bold;
	color: #666666;
	margin-bottom: 15rpx;
	display: block;
}

.demo-text {
	font-size: 24rpx;
	color: #999999;
	margin-bottom: 8rpx;
	display: block;
}

.demo-text:last-child {
	margin-bottom: 0;
}

/* 底部 */
.footer {
	text-align: center;
	margin-top: 60rpx;
}

.footer-text {
	font-size: 28rpx;
	font-weight: bold;
	color: rgba(255, 255, 255, 0.9);
	margin-bottom: 10rpx;
	display: block;
}

.footer-desc {
	font-size: 24rpx;
	color: rgba(255, 255, 255, 0.7);
}
</style>
