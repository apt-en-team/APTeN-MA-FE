<script setup>
import {ref} from 'vue'
import api from '@/api/axios.js'

const email = ref('')
const errorMsg = ref('')
const successMsg = ref('')
const loading = ref(false)

// 비밀번호 재설정 메일 발송 요청
async function handleSubmit() {
  loading.value = true
  errorMsg.value = ''
  successMsg.value = ''
  try {
    await api.post('/mail/password-reset', {email: email.value})
    successMsg.value = '비밀번호 재설정 메일이 발송되었습니다. 이메일을 확인해주세요.'
  } catch (e) {
    errorMsg.value = e.response?.data?.resultMessage || '메일 발송에 실패했습니다'
  }
  loading.value = false
}

</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <div class="logo">
        <div class="logo-icon resident">A</div>
        <h1>비밀번호 찾기</h1>
        <p>가입한 이메일로 재설정 링크를 보내드립니다</p>
      </div>

      <form @submit.prevent="handleSubmit" class="login-form">
        <div class="input-group">
          <label>이메일</label>
          <input v-model="email" type="email" placeholder="가입한 이메일을 입력하세요" required/>
        </div>

        <p v-if="errorMsg" class="error">{{ errorMsg }}</p>
        <p v-if="successMsg" class="success">{{ successMsg }}</p>

        <button type="submit" class="btn-login" :disabled="loading">
          {{ loading ? '발송 중...' : '재설정 메일 발송' }}
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