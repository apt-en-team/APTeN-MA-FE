<script setup>
import { reactive, watch } from 'vue'
import BaseModal from '@/components/common/BeseModel.vue'
import ActionResultModal from '@/components/common/ActionResultModal.vue'
import reservationAPI from '@/api/reservation'

const props = defineProps({
  // 상세 조회할 예약 ID
  reservationId: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['close', 'cancelled'])

// 상세 모달 상태
const state = reactive({
  reservation: null,
  isLoading: false,
  showConfirm: false,
  isProcessing: false,
  errorMsg: '',
})

// 공통 결과 모달 상태
const resultModal = reactive({
  show: false,
  type: 'danger',
  title: '',
  subtitle: '',
  desc: '',
  itemName: '',
  time: '',
  actionLabel: '',
  actor: '관리사무소',
})

// 결과 모달 열기
const openResultModal = ({ type = 'danger', title, subtitle, desc, itemName, actionLabel }) => {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const hh = String(now.getHours()).padStart(2, '0')
  const mi = String(now.getMinutes()).padStart(2, '0')

  resultModal.type = type
  resultModal.title = title
  resultModal.subtitle = subtitle
  resultModal.desc = desc
  resultModal.itemName = itemName
  resultModal.time = `${yyyy}.${mm}.${dd} ${hh}:${mi}`
  resultModal.actionLabel = actionLabel
  resultModal.show = true
}

// 결과 모달 닫기
const closeResultModal = () => {
  resultModal.show = false
}

// reservationId 변경 시 상세 조회
watch(
  () => props.reservationId,
  async (id) => {
    if (!id) return

    state.isLoading = true
    state.errorMsg = ''

    try {
      const res = await reservationAPI.getAdminReservationDetail(id)
      state.reservation = res.data.resultData
    } catch (e) {
      console.error(e)
      state.reservation = null
    } finally {
      state.isLoading = false
    }
  },
  { immediate: true }
)

// 관리자 강제 취소 처리
const handleForceCancel = async () => {
  state.isProcessing = true
  state.errorMsg = ''

  try {
    await reservationAPI.forceCancel(props.reservationId)

    const itemName = state.reservation
      ? `${state.reservation.facilityName} · ${state.reservation.userName}`
      : `예약 #${props.reservationId}`

    state.showConfirm = false

    // 취소 완료 결과 모달 표시
    openResultModal({
      type: 'danger',
      title: '예약 취소가 완료되었습니다',
      subtitle: '예약 취소 처리',
      desc: '예약자에게 취소 안내가 반영됩니다.',
      itemName,
      actionLabel: '예약 강제 취소',
    })

    emit('cancelled')
  } catch (e) {
    state.errorMsg = e.response?.data?.resultMessage || '취소 처리 중 오류가 발생했습니다.'
  } finally {
    state.isProcessing = false
  }
}

// 상태 텍스트
const statusLabel = (s) => ({
  CONFIRMED: '확정',
  PENDING: '대기',
  CANCELLED: '취소',
  COMPLETED: '완료'
}[s] || s)

// 상태 배지 클래스
const statusClass = (s) => ({
  CONFIRMED: 'badge-confirmed',
  PENDING: 'badge-pending',
  CANCELLED: 'badge-cancelled',
  COMPLETED: 'badge-completed'
}[s] || '')

// 날짜 포맷
const fmt = (dt) => dt ? dt.replace('T', ' ').slice(0, 16) : '-'

// 취소 가능 상태
const isCancellable = (s) => s === 'CONFIRMED' || s === 'PENDING'
</script>

<template>
  <!-- 예약 상세 모달 -->
  <BaseModal
    title="예약 상세 정보"
    :subtitle="`ID ${reservationId}`"
    @close="$emit('close')"
  >
    <div v-if="state.isLoading" class="loading">로딩 중...</div>

    <template v-else-if="state.reservation">
      <div class="summary">
        <span :class="['badge', statusClass(state.reservation.status)]">
          {{ statusLabel(state.reservation.status) }}
        </span>
        <h3 class="facility-name">{{ state.reservation.facilityName }}</h3>
        <p v-if="state.reservation.programId !== null" class="date-time">
          GX 기간 &nbsp;·&nbsp;
          {{ state.reservation.startDate }} ~ {{ state.reservation.endDate }}
        </p>
      </div>

      <div class="detail-grid">
        <div class="detail-item">
          <span class="label">예약 ID</span>
          <span class="value">{{ state.reservation.reservationId }}</span>
        </div>
        <div class="detail-item">
          <span class="label">예약자</span>
          <span class="value">{{ state.reservation.userName }}</span>
        </div>
        <div class="detail-item">
          <span class="label">시설명</span>
          <span class="value">{{ state.reservation.facilityName }}</span>
        </div>
        <div class="detail-item">
          <span class="label">소속 세대</span>
          <span class="value">{{ state.reservation.dong }} {{ state.reservation.ho }}</span>
        </div>
        <div class="detail-item">
          <span class="label">예약 날짜</span>
          <span class="value">{{ state.reservation.reservationDate }}</span>
        </div>
        <div class="detail-item">
          <span class="label">시간</span>
          <span class="value">{{ state.reservation.startTime }} ~ {{ state.reservation.endTime }}</span>
        </div>
        <div class="detail-item">
          <span class="label">예약 상태</span>
          <span :class="['badge', statusClass(state.reservation.status)]">
            {{ statusLabel(state.reservation.status) }}
          </span>
        </div>
        <div class="detail-item">
          <span class="label">예약일</span>
          <span class="value">{{ fmt(state.reservation.createdAt) }}</span>
        </div>
        <div v-if="state.reservation.approvedAt" class="detail-item">
          <span class="label">승인일</span>
          <span class="value">{{ fmt(state.reservation.approvedAt) }}</span>
        </div>
        <div v-if="state.reservation.cancelledAt" class="detail-item">
          <span class="label">취소일</span>
          <span class="value">{{ fmt(state.reservation.cancelledAt) }}</span>
        </div>
        <div v-if="state.reservation.seatNo" class="detail-item">
          <span class="label">좌석 번호</span>
          <span class="value">{{ state.reservation.seatNo }}번</span>
        </div>
        <div v-if="state.reservation.status == 'CONFIRMED' || state.reservation.status == 'PENDING'" class="detail-item">
          <span class="label">현재 예약 인원</span>
          <span class="value">
            {{ (state.reservation.currentCount || 0) + (state.reservation.pendingCount || 0) }} / {{ state.reservation.maxCapacity }}명
          </span>
        </div>
      </div>
    </template>

    <template #footer>
      <button
        v-if="state.reservation && isCancellable(state.reservation.status)"
        class="btn-danger"
        @click="state.showConfirm = true"
      >
        예약 취소
      </button>
      <button class="btn-primary" @click="$emit('close')">닫기</button>
    </template>
  </BaseModal>

  <!-- 취소 확인 모달 -->
  <BaseModal
    v-if="state.showConfirm"
    title="예약을 취소하시겠습니까?"
    subtitle="취소된 예약은 복구가 불가합니다."
    @close="state.showConfirm = false"
  >
    <div v-if="state.reservation" class="confirm-info">
      <span class="confirm-facility">{{ state.reservation.facilityName }}</span>
      <span :class="['badge', statusClass(state.reservation.status)]">{{ statusLabel(state.reservation.status) }}</span>
      <p>{{ state.reservation.reservationDate }} · {{ state.reservation.startTime }} ~ {{ state.reservation.endTime }}</p>
      <p>{{ state.reservation.userName }} · {{ state.reservation.dong }} {{ state.reservation.ho }}</p>
    </div>

    <p class="confirm-notice">취소 시 예약자에게 알림이 발송됩니다.</p>
    <p v-if="state.errorMsg" class="error-msg">{{ state.errorMsg }}</p>

    <template #footer>
      <button class="btn-secondary" @click="state.showConfirm = false">돌아가기</button>
      <button class="btn-danger" :disabled="state.isProcessing" @click="handleForceCancel">
        {{ state.isProcessing ? '처리 중...' : '강제 취소 승인' }}
      </button>
    </template>
  </BaseModal>

  <!-- 공통 결과 모달 -->
  <ActionResultModal
    v-if="resultModal.show"
    :title="resultModal.title"
    :subtitle="resultModal.subtitle"
    :desc="resultModal.desc"
    :type="resultModal.type"
    :item-name="resultModal.itemName"
    :time="resultModal.time"
    :action-label="resultModal.actionLabel"
    :actor="resultModal.actor"
    @close="closeResultModal"
  />
</template>

<style scoped>
.loading { text-align: center; padding: 40px; color: #888; }
.summary { background: #f8f9fa; border-radius: 8px; padding: 16px; margin-bottom: 20px; }
.facility-name { font-size: 20px; font-weight: 700; margin: 8px 0 4px; }
.date-time { font-size: 13px; color: #666; }
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; border-top: 1px solid #eee; }
.detail-item { padding: 12px 4px; border-bottom: 1px solid #eee; display: flex; flex-direction: column; gap: 4px; }
.label { font-size: 12px; color: #888; }
.value { font-size: 14px; font-weight: 500; }
.badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 500; }
.badge-confirmed { background: #e6f4ea; color: #2e7d32; }
.badge-pending { background: #fff3e0; color: #e65100; }
.badge-cancelled { background: #fce4ec; color: #c62828; }
.badge-completed { background: #e8eaf6; color: #3949ab; }
.confirm-info { background: #fff5f5; border-left: 3px solid #ff4d4f; padding: 12px; border-radius: 4px; font-size: 13px; color: #555; }
.confirm-info p { margin: 4px 0; }
.confirm-facility { font-weight: 600; font-size: 14px; display: block; margin-bottom: 6px; }
.confirm-notice { color: #888; font-size: 12px; margin-top: 8px !important; }
.btn-primary { padding: 9px 20px; border-radius: 8px; background: #1E2533; border: none; color: #fff; font-size: 14px; cursor: pointer; }
.btn-secondary { padding: 9px 20px; border-radius: 8px; background: #f5f5f5; border: none; color: #333; font-size: 14px; cursor: pointer; }
.btn-danger { padding: 9px 20px; border-radius: 8px; background: #fff; border: 1px solid #ff4d4f; color: #ff4d4f; font-size: 14px; cursor: pointer; }
.btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }
.error-msg {
  color: #ff4d4f;
  padding: 8px;
  border-radius: 4px;
  font-size: 0.85rem;
  margin-top: 15px;
  text-align: center;
}
button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>