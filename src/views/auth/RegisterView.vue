<script setup>
import {ref, reactive} from 'vue'
import {useRouter} from 'vue-router'
import {useAuthStore} from '@/stores/modules/auth.js'
import api from '@/api/axios.js'

const router = useRouter()
const auth = useAuthStore()

// 회원가입 폼 데이터
const form = reactive({
  email: '', password: '', name: '', phone: '', dong: '', ho: ''
})

// 비밀번호 확인 입력값 (form.password와 일치 여부 검사용)
const passwordConfirm = ref('')

// 비밀번호 / 비밀번호 확인 표시 여부 토글
const showPassword = ref(false)
const showPasswordConfirm = ref(false)

// 이메일 중복 확인 완료 여부 (회원가입 전 반드시 확인해야 함)
const emailChecked = ref(false)
// 이메일 중복 확인 결과 메시지
const emailCheckMsg = ref('')
// 이메일 사용 가능 여부 (true: 사용 가능, false: 중복)
const emailCheckOk = ref(false)

// 최종 에러 / 성공 메시지
const errorMsg = ref('')
const successMsg = ref('')

// 회원가입 요청 로딩 상태
const loading = ref(false)

// 이메일 중복 확인 (GET /api/auth/check-email)
// 200 → 사용 가능, 409 → 이미 사용 중
async function checkEmail() {
  emailCheckMsg.value = ''
  emailCheckOk.value = false
  emailChecked.value = false

  if (!form.email) {
    emailCheckMsg.value = '이메일을 입력해주세요'
    return
  }

  try {
    await api.get(`/auth/check-email?email=${form.email}`)
    emailCheckMsg.value = '사용 가능한 이메일입니다'
    emailCheckOk.value = true
    emailChecked.value = true
  } catch (e) {
    emailCheckMsg.value = e.response?.data?.resultMessage || '이미 사용 중인 이메일입니다'
    emailCheckOk.value = false
  }
}

// 회원가입 처리 (POST /api/auth/register)
// 성공 시 1.5초 후 로그인 페이지로 이동
async function handleRegister() {
  errorMsg.value = ''
  successMsg.value = ''

  // 이메일 중복 확인을 먼저 해야 진행 가능
  if (!emailChecked.value) {
    errorMsg.value = '이메일 중복 확인을 해주세요'
    return
  }

  // 비밀번호 일치 여부 검사
  if (form.password !== passwordConfirm.value) {
    errorMsg.value = '비밀번호가 일치하지 않습니다'
    return
  }

  loading.value = true
  try {
    const payload = {
      ...form,
      dong: form.dong + '동',
      ho: form.ho + '호'
    }
    await auth.register(payload)
    successMsg.value = '회원가입 성공! 로그인 페이지로 이동합니다'
    setTimeout(() => router.push('/login'), 1500)
  } catch (e) {
    errorMsg.value = e.response?.data?.resultMessage || '회원가입에 실패했습니다'
  }
  loading.value = false
}

// 휴대폰 자동 하이픈 포맷 (숫자만 입력 → 010-1234-5678)
function formatPhone(e) {
  const nums = e.target.value.replace(/\D/g, '').slice(0, 11)
  if (nums.length < 4) form.phone = nums
  else if (nums.length < 8) form.phone = `${nums.slice(0,3)}-${nums.slice(3)}`
  else form.phone = `${nums.slice(0,3)}-${nums.slice(3,7)}-${nums.slice(7)}`
}

// 동 숫자만 입력받기
function formatDong(e) {
  form.dong = e.target.value.replace(/\D/g, '')
}

// 호 숫자만 입력받기
function formatHo(e) {
  form.ho = e.target.value.replace(/\D/g, '')
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

        <!-- 이메일 + 중복확인 -->
        <div class="input-group">
          <label>이메일</label>
          <div class="input-with-btn">
            <input v-model="form.email" type="email" placeholder="이메일" required @input="emailChecked = false"/>
            <button type="button" class="btn-check" @click="checkEmail">중복확인</button>
          </div>
          <p v-if="emailCheckMsg" :class="emailCheckOk ? 'msg-ok' : 'msg-err'">{{ emailCheckMsg }}</p>
        </div>

        <!-- 비밀번호 -->
        <div class="input-group">
          <label>비밀번호</label>
          <div class="input-with-icon">
            <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="8자 이상, 영문+숫자"
                required
            />
            <!-- 눈 아이콘 클릭 시 비밀번호 표시/숨기기 토글 -->
            <button type="button" class="btn-eye" @click="showPassword = !showPassword">
              <i :class="showPassword ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye'"></i>
            </button>
          </div>
        </div>

        <!-- 비밀번호 확인 -->
        <div class="input-group">
          <label>비밀번호 확인</label>
          <div class="input-with-icon">
            <input
                v-model="passwordConfirm"
                :type="showPasswordConfirm ? 'text' : 'password'"
                placeholder="비밀번호 재입력"
                required
            />
            <!-- 눈 아이콘 클릭 시 비밀번호 표시/숨기기 토글 -->
            <button type="button" class="btn-eye" @click="showPasswordConfirm = !showPasswordConfirm">
              <i :class="showPasswordConfirm ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye'"></i>
            </button>
          </div>
          <!-- 비밀번호 일치 여부 실시간 표시 -->
          <p v-if="passwordConfirm" :class="form.password === passwordConfirm ? 'msg-ok' : 'msg-err'">
            {{ form.password === passwordConfirm ? '비밀번호가 일치합니다' : '비밀번호가 일치하지 않습니다' }}
          </p>
        </div>

        <!-- 이름 -->
        <div class="input-group">
          <label>이름</label>
          <input v-model="form.name" type="text" placeholder="이름" required/>
        </div>

        <!-- 휴대폰 -->
        <div class="input-group">
          <label>휴대폰</label>
          <input v-model="form.phone" type="text" placeholder="010-0000-0000" @input="formatPhone"/>
        </div>

        <!-- 동/호 -->
        <div class="input-row">
          <div class="input-group">
            <label>동</label>
            <div class="input-with-suffix">
              <input v-model="form.dong" type="text" placeholder="101" required @input="formatDong"/>
              <span class="suffix">동</span>
            </div>
          </div>
          <div class="input-group">
            <label>호</label>
            <div class="input-with-suffix">
              <input v-model="form.ho" type="text" placeholder="101" required @input="formatHo"/>
              <span class="suffix">호</span>
            </div>
          </div>
        </div>

        <p v-if="errorMsg" class="error">{{ errorMsg }}</p>
        <p v-if="successMsg" class="success">{{ successMsg }}</p>

        <button type="submit" class="btn-register" :disabled="loading">
          {{ loading ? '가입 중...' : '회원가입' }}
        </button>
      </form>

      <p class="login-link">
        이미 계정이 있으신가요?
        <router-link to="/login">로그인</router-link>
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
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
}

.logo {
  text-align: center;
  margin-bottom: 28px;
}

.logo-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #4973E5;
  color: #fff;
  font-size: 20px;
  font-weight: bold;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
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
  margin-bottom: 14px;
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

.input-row {
  display: flex;
  gap: 12px;
}

.input-row .input-group {
  flex: 1;
}

.input-with-suffix {
  position: relative;
}

.input-with-suffix input {
  width: 100%;
  padding-right: 30px;
  box-sizing: border-box;
}

.suffix {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
  color: #333;
  pointer-events: none;
}

/* 이메일 중복확인 */
.input-with-btn {
  display: flex;
  gap: 8px;
}

.input-with-btn input {
  flex: 1;
}

.btn-check {
  padding: 10px 14px;
  background: #4973E5;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.btn-check:hover {
  background: #3a5bd9;
}

/* 비밀번호 눈 아이콘 */
.input-with-icon {
  position: relative;
}

.input-with-icon input {
  width: 100%;
  padding-right: 42px;
  box-sizing: border-box;
}

.btn-eye i {
  color: #999;
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

.btn-eye:hover {
  color: #333;
}

.error {
  color: #E05555;
  font-size: 13px;
  margin-bottom: 12px;
}

/* 메시지 */
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

.btn-register {
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

.btn-register:disabled {
  opacity: 0.6;
}

.login-link {
  text-align: center;
  margin-top: 20px;
  font-size: 13px;
  color: #999;
}

.login-link a {
  color: #4973E5;
  text-decoration: none;
  font-weight: 600;
}
</style>