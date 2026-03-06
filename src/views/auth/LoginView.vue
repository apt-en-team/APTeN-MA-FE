<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/modules/auth.js'

const router = useRouter()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const errorMsg = ref('')
const loading = ref(false)

// 일반 로그인
async function handleLogin() {
  loading.value = true
  errorMsg.value = ''
  try {
    const user = await auth.login(email.value, password.value)
    // role에 따라 대시보드로 이동
    if (user.role === 'ADMIN') {
      router.push('/admin/dashboard')
    } else {
      router.push('/resident/dashboard')
    }
  } catch (e) {
    errorMsg.value = e.response?.data?.resultMessage || '로그인에 실패했습니다'
  }
  loading.value = false
}

// 소셜 로그인 (백엔드 OAuth2 엔드포인트로 리다이렉트)
function socialLogin(provider) {
  window.location.href = `http://localhost:8080/oauth2/authorization/${provider}`
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <div class="logo">
        <div class="logo-icon">A</div>
        <h1>아파트엔</h1>
        <p>스마트 주거·생활 통합 관리 시스템</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="input-group">
          <label>이메일</label>
          <input v-model="email" type="email" placeholder="이메일을 입력하세요" required />
        </div>
        <div class="input-group">
          <label>비밀번호</label>
          <input v-model="password" type="password" placeholder="비밀번호를 입력하세요" required />
        </div>
        <p v-if="errorMsg" class="error">{{ errorMsg }}</p>
        <button type="submit" class="btn-login" :disabled="loading">
          {{ loading ? '로그인 중...' : '로그인' }}
        </button>
      </form>

      <div class="divider"><span>또는</span></div>

      <!-- 소셜 로그인 -->
      <div class="social-buttons">
        <button @click="socialLogin('google')" class="btn-social google">
          Google 로그인
        </button>
        <button @click="socialLogin('kakao')" class="btn-social kakao">
          Kakao 로그인
        </button>
        <button @click="socialLogin('naver')" class="btn-social naver">
          Naver 로그인
        </button>
      </div>

      <p class="register-link">
        아직 계정이 없으신가요? <router-link to="/register">회원가입</router-link>
      </p>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F5F6FA;
}
.login-card {
  background: #fff;
  border-radius: 16px;
  padding: 40px;
  width: 400px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.08);
}
.logo {
  text-align: center;
  margin-bottom: 32px;
}
.logo-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #4F6EF7;
  color: #fff;
  font-size: 20px;
  font-weight: bold;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}
.logo h1 {
  font-size: 24px;
  color: #1A1A2E;
  margin: 0;
}
.logo p {
  font-size: 13px;
  color: #999;
  margin-top: 4px;
}
.input-group {
  margin-bottom: 16px;
}
.input-group label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #333;
  margin-bottom: 6px;
}
.input-group input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #E0E3EB;
  border-radius: 8px;
  font-size: 14px;
  box-sizing: border-box;
}
.input-group input:focus {
  outline: none;
  border-color: #4F6EF7;
}
.error {
  color: #E05555;
  font-size: 13px;
  margin-bottom: 12px;
}
.btn-login {
  width: 100%;
  padding: 12px;
  background: #4F6EF7;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}
.btn-login:disabled {
  opacity: 0.6;
}
.divider {
  text-align: center;
  margin: 24px 0;
  position: relative;
}
.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: #E8EBF0;
}
.divider span {
  background: #fff;
  padding: 0 12px;
  position: relative;
  color: #999;
  font-size: 13px;
}
.social-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.btn-social {
  width: 100%;
  padding: 10px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid #E0E3EB;
  background: #fff;
}
.btn-social.google { color: #EA4335; }
.btn-social.google:hover { background: #FFF0EF; }
.btn-social.kakao { color: #3C1E1E; background: #FEE500; border-color: #FEE500; }
.btn-social.naver { color: #fff; background: #03C75A; border-color: #03C75A; }
.register-link {
  text-align: center;
  margin-top: 20px;
  font-size: 13px;
  color: #999;
}
.register-link a {
  color: #4F6EF7;
  text-decoration: none;
  font-weight: 600;
}
</style>
