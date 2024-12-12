<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <img src="../assets/logo.png" alt="Logo" class="logo">
        <h2>SPK Vendor Alat Tulis</h2>
        <p>Silakan login untuk melanjutkan</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label>
            <i class="fas fa-user"></i>
            Username
          </label>
          <input 
            type="text" 
            v-model="username" 
            required
            placeholder="Masukkan username"
            :class="{ 'error': errors.username }"
          >
          <span class="error-message" v-if="errors.username">{{ errors.username }}</span>
        </div>

        <div class="form-group">
          <label>
            <i class="fas fa-lock"></i>
            Password
          </label>
          <div class="password-input">
            <input 
              :type="showPassword ? 'text' : 'password'" 
              v-model="password" 
              required
              placeholder="Masukkan password"
              :class="{ 'error': errors.password }"
            >
            <i 
              class="fas" 
              :class="showPassword ? 'fa-eye-slash' : 'fa-eye'"
              @click="showPassword = !showPassword"
            ></i>
          </div>
          <span class="error-message" v-if="errors.password">{{ errors.password }}</span>
        </div>

        <!-- Captcha -->
        <div class="form-group captcha-group">
          <label>Captcha</label>
          <div class="captcha-container">
            <div class="captcha-image" ref="captchaRef">
              {{ captchaText }}
            </div>
            <button type="button" @click="regenerateCaptcha" class="refresh-btn">
              <i class="fas fa-sync-alt"></i>
            </button>
          </div>
          <input 
            type="text" 
            v-model="captchaInput"
            placeholder="Masukkan captcha"
            :class="{ 'error': errors.captcha }"
            required
          >
          <span class="error-message" v-if="errors.captcha">{{ errors.captcha }}</span>
        </div>

        <button type="submit" :disabled="loading" class="login-btn">
          <i class="fas fa-sign-in-alt"></i>
          {{ loading ? 'Memproses...' : 'Login' }}
        </button>
      </form>

      <!-- Alert Message -->
      <div v-if="alertMessage" :class="['alert', alertMessage.type]">
        {{ alertMessage.text }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const loading = ref(false)
const showPassword = ref(false)
const captchaText = ref('')
const captchaInput = ref('')
const errors = ref({})
const alertMessage = ref(null)

// Generate random captcha text
const generateCaptcha = () => {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
  let captcha = ''
  for (let i = 0; i < 6; i++) {
    captcha += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return captcha
}

const regenerateCaptcha = () => {
  captchaText.value = generateCaptcha()
  captchaInput.value = ''
}

const validateForm = () => {
  errors.value = {}
  let isValid = true

  if (!username.value) {
    errors.value.username = 'Username harus diisi'
    isValid = false
  }

  if (!password.value) {
    errors.value.password = 'Password harus diisi'
    isValid = false
  }

  if (captchaInput.value.toLowerCase() !== captchaText.value.toLowerCase()) {
    errors.value.captcha = 'Captcha tidak sesuai'
    isValid = false
  }

  return isValid
}

const handleLogin = async () => {
  if (!validateForm()) return

  loading.value = true
  try {
    const success = await authStore.login(username.value, password.value)
    if (success) {
      alertMessage.value = {
        type: 'success',
        text: 'Login berhasil! Mengalihkan...'
      }
      setTimeout(() => {
        router.push('/dashboard')
      }, 1000)
    } else {
      alertMessage.value = {
        type: 'error',
        text: 'Username atau password salah'
      }
      regenerateCaptcha()
    }
  } catch (error) {
    console.error('Login error:', error)
    alertMessage.value = {
      type: 'error',
      text: 'Terjadi kesalahan saat login'
    }
    regenerateCaptcha()
  }
  loading.value = false
}

onMounted(() => {
  regenerateCaptcha()
})
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;
}

.login-card {
  background: rgba(255, 255, 255, 0.95);
  padding: 2rem;
  border-radius: 15px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
  position: relative;
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.logo {
  width: 80px;
  height: 80px;
  margin-bottom: 1rem;
}

.login-header h2 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.login-header p {
  color: #666;
  font-size: 0.9rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  color: #2c3e50;
  font-weight: 500;
}

input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
}

input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

input.error {
  border-color: #e74c3c;
}

.password-input {
  position: relative;
}

.password-input i {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  color: #666;
}

.captcha-group {
  margin-top: 1.5rem;
}

.captcha-container {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.captcha-image {
  flex: 1;
  padding: 0.75rem;
  background: #f0f0f0;
  border-radius: 8px;
  font-family: 'Courier New', monospace;
  font-size: 1.2rem;
  text-align: center;
  letter-spacing: 3px;
  user-select: none;
}

.refresh-btn {
  padding: 0.75rem;
  background: #f0f0f0;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.refresh-btn:hover {
  background: #e0e0e0;
}

.login-btn {
  width: 100%;
  padding: 0.75rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.error-message {
  color: #e74c3c;
  font-size: 0.8rem;
  margin-top: 0.25rem;
}

.alert {
  position: absolute;
  bottom: -60px;
  left: 0;
  right: 0;
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
  animation: slideUp 0.3s ease;
}

.alert.success {
  background: #2ecc71;
  color: white;
}

.alert.error {
  background: #e74c3c;
  color: white;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@media (max-width: 480px) {
  .login-card {
    padding: 1.5rem;
  }
}
</style>