<template>
  <div class="mypage">

    <!-- 탈퇴 섹션 -->
    <div class="card danger-zone">
      <h3>회원 탈퇴</h3>
      <p class="danger-desc">
        탈퇴 시 계정에 로그인할 수 없게 됩니다.<br />
        작성한 게시글, 예약 내역, 차량 이력 등의 데이터는 보존됩니다.
      </p>

      <label class="check-label">
        <input type="checkbox" v-model="confirmed" />
        위 내용을 확인했으며 탈퇴에 동의합니다
      </label>

      <p v-if="errorMsg" class="error">{{ errorMsg }}</p>

      <button
          class="btn-deactivate"
          :disabled="!confirmed || loading"
          @click="handleDeactivate"
      >
        {{ loading ? '처리 중...' : '탈퇴하기' }}
      </button>
    </div>

    <!-- 탈퇴 완료 모달 -->
    <div v-if="showModal" class="modal-overlay">
      <div class="modal">
        <div class="modal-icon">✓</div>
        <h4>탈퇴가 완료되었습니다</h4>
        <p>그동안 아파트엔을 이용해 주셔서 감사합니다.</p>
        <button class="btn-confirm" @click="goLogin">확인</button>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/modules/auth.js'

const router = useRouter()
const auth = useAuthStore()

const confirmed = ref(false)
const loading = ref(false)
const errorMsg = ref('')
const showModal = ref(false)

async function handleDeactivate() {
  errorMsg.value = ''
  loading.value = true
  try {
    await auth.deactivate()
    showModal.value = true
  } catch (e) {
    errorMsg.value = e.response?.data?.resultMessage || '탈퇴 처리에 실패했습니다'
  } finally {
    loading.value = false
  }
}

function goLogin() {
  router.push('/resident/login')
}
</script>

<style scoped>
.mypage {
  max-width: 480px;
}
.card {
  background: #fff;
  border-radius: 12px;
  padding: 28px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}
.danger-zone {
  border: 1px solid #FFE0E0;
}
.danger-zone h3 {
  font-size: 15px;
  font-weight: 700;
  color: #E05555;
  margin: 0 0 12px;
}
.danger-desc {
  font-size: 13px;
  color: #666;
  line-height: 1.7;
  margin: 0 0 20px;
}
.check-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #333;
  cursor: pointer;
  margin-bottom: 20px;
}
.check-label input { cursor: pointer; }
.error {
  font-size: 13px;
  color: #E05555;
  margin-bottom: 12px;
}
.btn-deactivate {
  padding: 10px 24px;
  background: #E05555;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
}
.btn-deactivate:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.btn-deactivate:not(:disabled):hover { opacity: 0.85; }

/* 완료 모달 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.modal {
  background: #fff;
  border-radius: 16px;
  padding: 40px 32px;
  text-align: center;
  width: 320px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.12);
}
.modal-icon {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #E8F9F1;
  color: #22A86E;
  font-size: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}
.modal h4 {
  font-size: 17px;
  color: #1A1A2E;
  margin: 0 0 8px;
}
.modal p {
  font-size: 13px;
  color: #999;
  margin: 0 0 24px;
}
.btn-confirm {
  width: 100%;
  padding: 11px;
  background: #4F6EF7;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
</style>