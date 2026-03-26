<script setup>
import {onMounted, ref} from 'vue'
import {useRouter, useRoute} from 'vue-router'
import {useAuthStore} from '@/stores/modules/auth.js'
import axios from 'axios'
// 세대 정보 입력 모달 → BaseModal (폼 모달)
import BaseModal from '@/components/common/BeseModel.vue'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const showModal = ref(false)
const dong = ref('')
const ho = ref('')
const phone = ref('')
const errorMsg = ref('')

// 마운트 시 로그인 상태 확인 후 분기
// - PENDING + 동호수 없음 → 세대 정보 입력 모달
// - PENDING + 동호수 있음 → 대시보드로 이동
// - REJECTED → 로그인 페이지로 이동
// - APPROVED → 대시보드로 이동
// - 비로그인 → 로그인 페이지로 이동
onMounted(async () => {
  await auth.fetchMe()

  if (auth.isLoggedIn) {
    if (auth.user?.status === 'PENDING') {
      if (auth.user?.householdId) {
        router.replace('/resident/dashboard')
      } else {
        showModal.value = true
      }
    } else if (auth.user?.status === 'REJECTED') {
      router.replace('/login?error=rejected')
    } else {
      redirectToDashboard()
    }
  } else {
    router.replace('/login')
  }
})

function redirectToDashboard() {
  const role = route.query.role || auth.user?.role
  if (role === 'ADMIN') {
    router.replace('/admin/dashboard')
  } else {
    router.replace('/resident/dashboard')
  }
}

// 동호수 + 전화번호로 세대 연결 (PATCH /api/auth/link-household)
async function linkHousehold() {
  errorMsg.value = ''

  if (!dong.value || !ho.value || !phone.value) {
    errorMsg.value = '동, 호수, 전화번호를 모두 입력해주세요'
    return
  }

  try {
    await axios.patch('/api/auth/link-household', {
      dong: dong.value + '동',
      ho: ho.value + '호',
      phone: phone.value
    }, {withCredentials: true})

    await auth.fetchMe()
    showModal.value = false
    router.replace('/resident/dashboard')
  } catch (e) {
    errorMsg.value = e.response?.data?.resultMessage || '존재하지 않는 동호수입니다'
  }
}

// 전화번호 자동 하이픈 포맷
function formatPhone(e) {
  const nums = e.target.value.replace(/\D/g, '').slice(0, 11)
  if (nums.length < 4) phone.value = nums
  else if (nums.length < 8) phone.value = `${nums.slice(0, 3)}-${nums.slice(3)}`
  else phone.value = `${nums.slice(0, 3)}-${nums.slice(3, 7)}-${nums.slice(7)}`
}

function formatDong(e) {
  dong.value = e.target.value.replace(/\D/g, '')
}

function formatHo(e) {
  ho.value = e.target.value.replace(/\D/g, '')
}
</script>

<template>
  <div class="callback-page">

    <!-- 로딩 화면 (모달 뜨기 전) -->
    <div v-if="!showModal" class="loading-card">
      <div class="spinner"></div>
      <p>소셜 로그인 처리 중...</p>
    </div>

    <!-- 세대 정보 입력 모달: BaseModal (입주민 폼 모달) -->
    <BaseModal
        v-if="showModal"
        title="세대 정보 입력"
        subtitle="거주 중인 동호수와 전화번호를 입력해주세요"
        :hide-footer="true"
        @close="showModal = false"
    >
      <div class="input-group">
        <div class="input-row">
          <div class="input-item">
            <label>동</label>
            <div class="input-with-suffix">
              <input v-model="dong" type="text" placeholder="101" @input="formatDong"/>
              <span class="suffix">동</span>
            </div>
          </div>
          <div class="input-item">
            <label>호수</label>
            <div class="input-with-suffix">
              <input v-model="ho" type="text" placeholder="101" @input="formatHo"/>
              <span class="suffix">호</span>
            </div>
          </div>
        </div>
      </div>

      <div class="input-item phone-item">
        <label>전화번호</label>
        <input v-model="phone" type="text" placeholder="010-1234-5678" @input="formatPhone"/>
      </div>

      <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>

      <!-- hide-footer라 footer 슬롯 대신 body 안에 버튼 배치 -->
      <button class="btn-confirm" @click="linkHousehold">확인</button>
    </BaseModal>

  </div>
</template>

<style scoped>
.callback-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F5F6FA;
}

.loading-card {
  text-align: center;
}

.loading-card p {
  color: #666;
  margin-top: 16px;
  font-size: 14px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #E8EBF0;
  border-top-color: #4973E5;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.input-row {
  display: flex;
  gap: 12px;
}

.input-item {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.phone-item {
  margin-top: 12px;
}

.input-item label {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.input-with-suffix {
  position: relative;
}

.input-with-suffix input {
  width: 100%;
  padding: 10px 30px 10px 14px;
  border: 1px solid #E0E3EA;
  border-radius: 8px;
  font-size: 14px;
  color: #333;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.input-with-suffix input:focus {
  border-color: #4973E5;
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

.input-item input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #E0E3EA;
  border-radius: 8px;
  font-size: 14px;
  color: #333;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.input-item input:focus {
  border-color: #4973E5;
}

.error-msg {
  margin-top: 10px;
  font-size: 12px;
  color: #E53E3E;
}

.btn-confirm {
  width: 100%;
  margin-top: 20px;
  padding: 12px;
  background: #4973E5;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-confirm:hover {
  background: #496cc8;
}
</style>