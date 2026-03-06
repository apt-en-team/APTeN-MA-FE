<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/modules/auth.js'

const router = useRouter()
const auth = useAuthStore()

const form = reactive({
  email: '', password: '', name: '', phone: '', dong: '', ho: ''
})
const errorMsg = ref('')
const successMsg = ref('')
const loading = ref(false)

async function handleRegister() {
  loading.value = true
  errorMsg.value = ''
  successMsg.value = ''
  try {
    await auth.register(form)
    successMsg.value = '회원가입 성공! 로그인 페이지로 이동합니다'
    setTimeout(() => router.push('/login'), 1500)
  } catch (e) {
    errorMsg.value = e.response?.data?.resultMessage || '회원가입에 실패했습니다'
  }
  loading.value = false
}
</script>

<template>
  <div class="register-page">
    <div class="register-card">
      <div class="logo">
        <div class="logo-icon">A</div>
        <h1>회원가입</h1>
        <p>아파트엔에 가입하세요</p>
      </div>

      <form @submit.prevent="handleRegister" class="register-form">
        <div class="input-group">
          <label>이메일</label>
          <input v-model="form.email" type="email" placeholder="이메일" required />
        </div>
        <div class="input-group">
          <label>비밀번호</label>
          <input v-model="form.password" type="password" placeholder="8자 이상, 영문+숫자" required />
        </div>
        <div class="input-group">
          <label>이름</label>
          <input v-model="form.name" type="text" placeholder="이름" required />
        </div>
        <div class="input-group">
          <label>휴대폰</label>
          <input v-model="form.phone" type="text" placeholder="010-0000-0000" />
        </div>
        <div class="input-row">
          <div class="input-group">
            <label>동</label>
            <input v-model="form.dong" type="text" placeholder="101동" required />
          </div>
          <div class="input-group">
            <label>호</label>
            <input v-model="form.ho" type="text" placeholder="1201호" required />
          </div>
        </div>

        <p v-if="errorMsg" class="error">{{ errorMsg }}</p>
        <p v-if="successMsg" class="success">{{ successMsg }}</p>

        <button type="submit" class="btn-register" :disabled="loading">
          {{ loading ? '가입 중...' : '회원가입' }}
        </button>
      </form>

      <p class="login-link">
        이미 계정이 있으신가요? <router-link to="/login">로그인</router-link>
      </p>
    </div>
  </div>
</template>

<style scoped>
.register-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F5F6FA;
}
.register-card {
  background: #fff;
  border-radius: 16px;
  padding: 40px;
  width: 420px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.08);
}
.logo { text-align: center; margin-bottom: 28px; }
.logo-icon {
  width: 48px; height: 48px; border-radius: 12px;
  background: #4F6EF7; color: #fff; font-size: 20px; font-weight: bold;
  display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px;
}
.logo h1 { font-size: 22px; color: #1A1A2E; margin: 0; }
.logo p { font-size: 13px; color: #999; margin-top: 4px; }
.input-group { margin-bottom: 14px; }
.input-group label { display: block; font-size: 13px; font-weight: 600; color: #333; margin-bottom: 6px; }
.input-group input {
  width: 100%; padding: 10px 14px; border: 1px solid #E0E3EB;
  border-radius: 8px; font-size: 14px; box-sizing: border-box;
}
.input-group input:focus { outline: none; border-color: #4F6EF7; }
.input-row { display: flex; gap: 12px; }
.input-row .input-group { flex: 1; }
.error { color: #E05555; font-size: 13px; margin-bottom: 12px; }
.success { color: #2EAD5C; font-size: 13px; margin-bottom: 12px; }
.btn-register {
  width: 100%; padding: 12px; background: #4F6EF7; color: #fff;
  border: none; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer;
}
.btn-register:disabled { opacity: 0.6; }
.login-link { text-align: center; margin-top: 20px; font-size: 13px; color: #999; }
.login-link a { color: #4F6EF7; text-decoration: none; font-weight: 600; }
</style>
