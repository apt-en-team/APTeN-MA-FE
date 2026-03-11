<script setup>
import {ref, onMounted} from 'vue'
import {useRouter, useRoute} from 'vue-router'
import api from '@/api/axios.js'

const router = useRouter()
const route = useRoute()

const token = ref('')
const newPassword = ref('')
const newPasswordConfirm = ref('')
const errorMsg = ref('')
const successMsg = ref('')
const loading = ref(false)
const showPassword = ref(false)
const showPasswordConfirm = ref(false)

// URL에서 토큰 추출
onMounted(() => {
  token.value = route.query.token
  if (!token.value) {
    errorMsg.value = '유효하지 않은 접근입니다.'
  }
})

// 비밀번호 재설정 요청
async function handleSubmit() {
  errorMsg.value = ''
  successMsg.value = ''

  // 비밀번호 일치 여부 확인
  if (newPassword.value !== newPasswordConfirm.value) {
    errorMsg.value = '비밀번호가 일치하지 않습니다.'
    return
  }

  loading.value = true
  try {
    await api.post('/mail/reset-password', {
      token: token.value,
      newPassword: newPassword.value
    })
    successMsg.value = '비밀번호가 변경되었습니다. 로그인 페이지로 이동합니다.'
    setTimeout(() => router.push('/login'), 1500)
  } catch (e) {
    errorMsg.value = e.response?.data?.resultMessage || '비밀번호 변경에 실패했습니다.'
  }
  loading.value = false
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <div class="logo">
        <div class="logo-icon resident">A</div>
        <h1>비밀번호 재설정</h1>
        <p>새로운 비밀번호를 입력해주세요</p>
      </div>

      <form @submit.prevent="handleSubmit" class="login-form">

        <!-- 새 비밀번호 -->
        <div class="input-group">
          <label>새 비밀번호</label>
          <div class="input-with-icon">
            <input
                v-model="newPassword"
                :type="showPassword ? 'text' : 'password'"
                placeholder="8자 이상, 영문+숫자"
                required
            />
            <button type="button" class="btn-eye" @click="showPassword = !showPassword">
              <i :class="showPassword ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye'"></i>
            </button>
          </div>
        </div>

        <!-- 새 비밀번호 확인 -->
        <div class="input-group">
          <label>새 비밀번호 확인</label>
          <div class="input-with-icon">
            <input
                v-model="newPasswordConfirm"
                :type="showPasswordConfirm ? 'text' : 'password'"
                placeholder="비밀번호 재입력"
                required
            />
            <button type="button" class="btn-eye" @click="showPasswordConfirm = !showPasswordConfirm">
              <i :class="showPasswordConfirm ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye'"></i>
            </button>
          </div>
          <!-- 비밀번호 일치 여부 실시간 표시 -->
          <p v-if="newPasswordConfirm" :class="newPassword === newPasswordConfirm ? 'msg-ok' : 'msg-err'">
            {{ newPassword === newPasswordConfirm ? '비밀번호가 일치합니다' : '비밀번호가 일치하지 않습니다' }}
          </p>
        </div>

        <p v-if="errorMsg" class="error">{{ errorMsg }}</p>
        <p v-if="successMsg" class="success">{{ successMsg }}</p>

        <button type="submit" class="btn-login" :disabled="loading || !token">
          {{ loading ? '변경 중...' : '비밀번호 변경' }}
        </button>
      </form>

      <p class="bottom-links">
        <router-link to="/login">로그인으로 돌아가기</router-link>
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
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
}

.logo {
  text-align: center;
  margin-bottom: 32px;
}

.logo-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  color: #fff;
  font-size: 20px;
  font-weight: bold;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.logo-icon.resident {
  background: #4973E5;
}

.logo h1 {
  font-size: 22px;
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
  border-color: #4973E5;
}

.input-with-icon {
  position: relative;
}

.input-with-icon input {
  width: 100%;
  padding-right: 42px;
  box-sizing: border-box;
}

.btn-eye {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 15px;
  color: #999;
  padding: 0;
}

.btn-eye i {
  color: #999;
}

.btn-eye i:hover {
  color: #333;
}

.msg-ok {
  color: #2EAD5C;
  font-size: 12px;
  margin-top: 4px;
}

.msg-err {
  color: #E05555;
  font-size: 12px;
  margin-top: 4px;
}

.error {
  color: #E05555;
  font-size: 13px;
  margin-bottom: 12px;
}

.success {
  color: #2EAD5C;
  font-size: 13px;
  margin-bottom: 12px;
}

.btn-login {
  width: 100%;
  padding: 12px;
  background: #4973E5;
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

.bottom-links {
  text-align: center;
  margin-top: 20px;
  font-size: 13px;
}

.bottom-links a {
  color: #4973E5;
  text-decoration: none;
  font-weight: 600;
}
</style>