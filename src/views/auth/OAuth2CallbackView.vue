<script setup>
import {onMounted, ref} from 'vue'
import {useRouter, useRoute} from 'vue-router'
import {useAuthStore} from '@/stores/modules/auth.js'
import axios from 'axios'
import Modal from '@/components/Modal.vue'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

// 모달 표시 여부
const showModal = ref(false)

// 세대 정보 입력값
const dong = ref('')
const ho = ref('')
const phone = ref('')

// 에러 메시지
const errorMsg = ref('')

onMounted(async () => {
  await auth.fetchMe()

  if (auth.isLoggedIn) {
    if (auth.user?.status === 'PENDING') {
      showModal.value = true
    } else {
      redirectToDashboard()
    }
  } else {
    router.replace('/login')
  }
})

// role에 따라 대시보드로 이동
function redirectToDashboard() {
  const role = route.query.role || auth.user?.role
  if (role === 'ADMIN') {
    router.replace('/admin/dashboard')
  } else {
    router.replace('/resident/dashboard')
  }
}

// 동호수 + 전화번호 연결 API 호출
async function linkHousehold() {
  errorMsg.value = ''

  if (!dong.value || !ho.value || !phone.value) {
    errorMsg.value = '동, 호수, 전화번호를 모두 입력해주세요'
    return
  }

  try {
    await axios.patch('/api/auth/link-household', {
      dong: dong.value,
      ho: ho.value,
      phone: phone.value
    }, {withCredentials: true})

    await auth.fetchMe()
    showModal.value = false
    redirectToDashboard()
  } catch (e) {
    errorMsg.value = e.response?.data?.resultMessage || '존재하지 않는 동호수입니다'
  }
}
</script>

<template>
  <div class="callback-page">
    <div class="loading-card">
      <div class="spinner"></div>
      <p>소셜 로그인 처리 중...</p>
    </div>

    <!-- 세대 정보 입력 모달 -->
    <Modal
        v-if="showModal"
        title="세대 정보 입력"
        subtitle="거주 중인 동호수와 전화번호를 입력해주세요"
        @close="showModal = false"
    >
      <!-- 입력 폼 -->
      <div class="input-group">
        <div class="input-item">
          <label>동</label>
          <input v-model="dong" type="text" placeholder="예) 101동"/>
        </div>
        <div class="input-item">
          <label>호수</label>
          <input v-model="ho" type="text" placeholder="예) 101호"/>
        </div>
      </div>

      <!-- 전화번호 입력 -->
      <div class="input-item phone-item">
        <label>전화번호</label>
        <input v-model="phone" type="text" placeholder="예) 010-1234-5678"/>
      </div>

      <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>

      <!-- 버튼 -->
      <template #footer>
        <button class="btn-confirm" @click="linkHousehold">확인</button>
      </template>
    </Modal>
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
  border-top-color: #4F6EF7;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.input-group {
  display: flex;
  gap: 12px;
}

.input-item {
  flex: 1;
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

.input-item input {
  padding: 10px 14px;
  border: 1px solid #E0E3EA;
  border-radius: 8px;
  font-size: 14px;
  color: #333;
  outline: none;
  transition: border-color 0.2s;
}

.input-item input:focus {
  border-color: #4F6EF7;
}

.error-msg {
  margin-top: 10px;
  font-size: 12px;
  color: #E53E3E;
}

.btn-confirm {
  width: 100%;
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