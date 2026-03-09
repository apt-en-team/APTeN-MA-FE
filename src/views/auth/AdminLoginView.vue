<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/modules/auth.js'

const router = useRouter()
const auth = useAuthStore()

// 입력값
const email = ref('')
const password = ref('')

// 에러 메시지
const errorMsg = ref('')

// 로그인 요청 로딩 상태
const loading = ref(false)

// 비밀번호 표시 여부 토글
const showPassword = ref(false)

// 관리자 로그인 처리 (POST /api/auth/login)
// ADMIN 계정만 허용, RESIDENT 계정으로 시도 시 로그아웃 후 에러 표시
async function handleLogin() {
  loading.value = true
  errorMsg.value = ''
  try {
    const user = await auth.login(email.value, password.value)
    if (user.role !== 'ADMIN') {
      errorMsg.value = '관리자 계정이 아닙니다. 입주민 로그인을 이용해주세요.'
      await auth.logout()
    } else {
      router.push('/admin/dashboard')
    }
  } catch (e) {
    errorMsg.value = e.response?.data?.resultMessage || '로그인에 실패했습니다'
  }
  loading.value = false
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <div class="logo">
        <div class="logo-icon admin">A</div>
        <h1>관리자 로그인</h1>
        <p>아파트엔 관리자 전용</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="input-group">
          <label>이메일</label>
          <input v-model="email" type="email" placeholder="관리자 이메일" required />
        </div>
        <div class="input-group">
          <label>비밀번호</label>
          <div class="input-with-icon">
            <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="비밀번호"
                required
            />
            <!-- 눈 아이콘 클릭 시 비밀번호 표시/숨기기 토글 -->
            <button type="button" class="btn-eye" @click="showPassword = !showPassword">
              <i :class="showPassword ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye'"></i>
            </button>
          </div>
        </div>
        <p v-if="errorMsg" class="error">{{ errorMsg }}</p>
        <button type="submit" class="btn-login" :disabled="loading">
          {{ loading ? '로그인 중...' : '관리자 로그인' }}
        </button>
      </form>

      <p class="bottom-links">
        <router-link to="/">메인으로 돌아가기</router-link>
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
  background: #1A1A2E;
}
.login-card {
  background: #222236;
  border-radius: 16px;
  padding: 40px;
  width: 400px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.3);
  border: 1px solid #2D3142;
}
.logo { text-align: center; margin-bottom: 32px; }
.logo-icon {
  width: 48px; height: 48px; border-radius: 12px;
  color: #fff; font-size: 20px; font-weight: bold;
  display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px;
}
.logo-icon.admin { background: #2D3142; }
.logo h1 { font-size: 22px; color: #fff; margin: 0; }
.logo p { font-size: 13px; color: #7B7F8E; margin-top: 4px; }
.input-group { margin-bottom: 16px; }
.input-group label { display: block; font-size: 13px; font-weight: 600; color: #aaa; margin-bottom: 6px; }
.input-group input {
  width: 100%; padding: 10px 14px; border: 1px solid #3A3F52;
  border-radius: 8px; font-size: 14px; box-sizing: border-box;
  background: #1A1A2E; color: #fff;
}
.input-group input:focus { outline: none; border-color: #4973E5; }
.input-group input::placeholder { color: #5A5E6E; }
.input-with-icon { position: relative; }
.input-with-icon input { width: 100%; padding-right: 42px; box-sizing: border-box; }
.btn-eye {
  position: absolute; right: 12px; top: 50%;
  transform: translateY(-50%);
  background: none; border: none; cursor: pointer;
  font-size: 15px; color: #999; padding: 0;
}
.btn-eye:hover { color: #333; }
.error { color: #E05555; font-size: 13px; margin-bottom: 12px; }
.btn-login {
  width: 100%; padding: 12px; background: #4973E5; color: #fff;
  border: none; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer;
}
.error { color: #E05555; font-size: 13px; margin-bottom: 12px; }
.btn-login {
  width: 100%; padding: 12px; background: #4973E5; color: #fff;
  border: none; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer;
}
.btn-login:disabled { opacity: 0.6; }
.bottom-links { text-align: center; margin-top: 24px; font-size: 13px; }
.bottom-links a { color: #7B7F8E; text-decoration: none; }
.bottom-links a:hover { color: #4973E5; }
</style>