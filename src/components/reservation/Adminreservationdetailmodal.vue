<script setup>
import { ref, watch } from 'vue'
import BaseModal from '@/components/common/BeseModel.vue'
import reservationAPI from '@/api/reservation'

const props = defineProps({
  reservationId: { type: Number, required: true }
})
const emit = defineEmits(['close', 'cancelled'])

const reservation  = ref(null)
const isLoading    = ref(false)
const showConfirm  = ref(false)
const isProcessing = ref(false)
const errorMsg = ref('')

watch(() => props.reservationId, async (id) => {
  if (!id) return
  isLoading.value = true
  try {
    const res = await reservationAPI.getAdminReservationDetail(id)
    reservation.value = res.data.resultData
  } catch (e) {
    console.error(e)
  } finally {
    isLoading.value = false
  }
}, { immediate: true })

const handleForceCancel = async () => {
  isProcessing.value = true
  errorMsg.value = ''
  try {
    await reservationAPI.forceCancel(props.reservationId)
    emit('cancelled')
    emit('close')
    showConfirm.value  = false
  } catch (e) {
    errorMsg.value = (e.response?.data?.resultMessage || '취소 처리 중 오류가 발생했습니다.')
  } finally {
    isProcessing.value = false
  }
}

const statusLabel = (s) => ({ CONFIRMED:'확정', PENDING:'대기', CANCELLED:'취소', COMPLETED:'완료' }[s] || s)
const statusClass = (s) => ({ CONFIRMED:'badge-confirmed', PENDING:'badge-pending', CANCELLED:'badge-cancelled', COMPLETED:'badge-completed' }[s] || '')
const fmt = (dt) => dt ? dt.replace('T',' ').slice(0,16) : '-'
const isCancellable = (s) => s === 'CONFIRMED' || s === 'PENDING'
</script>

<template>
  <!-- 상세 모달 -->
  <BaseModal
    :title="`예약 상세 정보`"
    :subtitle="`ID ${reservationId}`"
    @close="$emit('close')"
  >
    <div v-if="isLoading" class="loading">로딩 중...</div>

    <template v-else-if="reservation">
      <!-- 요약 헤더 -->
      <div class="summary">
        <span :class="['badge', statusClass(reservation.status)]">
          {{ statusLabel(reservation.status) }}
        </span>
        <h3 class="facility-name">{{ reservation.facilityName }}</h3>
        <p v-if="reservation.programId !== null" class="date-time">
          GX 기간 &nbsp;·&nbsp;
          {{ reservation.startDate }} ~ {{ reservation.endDate }}
        </p>
      </div>

      <!-- 상세 그리드 -->
      <div class="detail-grid">
        <div class="detail-item">
          <span class="label">예약 ID</span>
          <span class="value">{{ reservation.reservationId }}</span>
        </div>
        <div class="detail-item">
          <span class="label">예약자</span>
          <span class="value">{{ reservation.userName }}</span>
        </div>
        <div class="detail-item">
          <span class="label">시설명</span>
          <span class="value">{{ reservation.facilityName }}</span>
        </div>
        <div class="detail-item">
          <span class="label">소속 세대</span>
          <span class="value">{{ reservation.dong }} {{ reservation.ho }}</span>
        </div>
        <div class="detail-item">
          <span class="label">예약 날짜</span>
          <span class="value">{{ reservation.reservationDate }}</span>
        </div>
        <div class="detail-item">
          <span class="label">시간</span>
          <span class="value">{{ reservation.startTime }} ~ {{ reservation.endTime }}</span>
        </div>
        <div class="detail-item">
          <span class="label">예약 상태</span>
          <span :class="['badge', statusClass(reservation.status)]">
            {{ statusLabel(reservation.status) }}
          </span>
        </div>
        <div class="detail-item">
          <span class="label">예약일</span>
          <span class="value">{{ fmt(reservation.createdAt) }}</span>
        </div>
        <div v-if="reservation.approvedAt" class="detail-item">
          <span class="label">승인일</span>
          <span class="value">{{ fmt(reservation.approvedAt) }}</span>
        </div>
        <div v-if="reservation.cancelledAt" class="detail-item">
          <span class="label">취소일</span>
          <span class="value">{{ fmt(reservation.cancelledAt) }}</span>
        </div>
        <div v-if="reservation.seatNo" class="detail-item">
          <span class="label">좌석 번호</span>
          <span class="value">{{ reservation.seatNo }}번</span>
        </div>
        <div v-if="reservation.currentCount != null" class="detail-item">
          <span class="label">현재 예약 인원</span>
          <span class="value">{{ reservation.currentCount + reservation.pendingCount }} / {{ reservation.maxCapacity }}명</span>
        </div>
      </div>
    </template>

    <template #footer>
      <button
        v-if="reservation && isCancellable(reservation.status)"
        class="btn-danger"
        @click="showConfirm = true"
      >예약 취소</button>
      <button class="btn-primary" @click="$emit('close')">닫기</button>
    </template>
  </BaseModal>

  <!-- 취소 확인 모달 (중첩) -->
<BaseModal
    v-if="showConfirm"
    title="예약을 취소하시겠습니까?"
    subtitle="취소된 예약은 복구가 불가합니다."
    @close="showConfirm = false"
  >
    <div v-if="reservation" class="confirm-info">
      <span class="confirm-facility">{{ reservation.facilityName }}</span>
      <span :class="['badge', statusClass(reservation.status)]">{{ statusLabel(reservation.status) }}</span>
      <p>{{ reservation.reservationDate }} · {{ reservation.startTime }} ~ {{ reservation.endTime }}</p>
      <p>{{ reservation.userName }} · {{ reservation.dong }} {{ reservation.ho }}</p>
    </div>
      <p class="confirm-notice">취소 시 예약자에게 알림이 발송됩니다.</p>
      <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>

    <template #footer>
      <button class="btn-secondary" @click="showConfirm = false">돌아가기</button>
      <button class="btn-danger" :disabled="isProcessing" @click="handleForceCancel">
        {{ isProcessing ? '처리 중...' : '강제 취소 승인' }}
      </button>
    </template>
  </BaseModal>
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
.badge-pending   { background: #fff3e0; color: #e65100; }
.badge-cancelled { background: #fce4ec; color: #c62828; }
.badge-completed { background: #e8eaf6; color: #3949ab; }
.confirm-info { background: #fff5f5; border-left: 3px solid #ff4d4f; padding: 12px; border-radius: 4px; font-size: 13px; color: #555; }
.confirm-info p { margin: 4px 0; }
.confirm-facility { font-weight: 600; font-size: 14px; display: block; margin-bottom: 6px; }
.confirm-notice { color: #888; font-size: 12px; margin-top: 8px !important; }
.btn-primary   { padding: 9px 20px; border-radius: 8px; background: #1E2533; border: none; color: #fff; font-size: 14px; cursor: pointer; }
.btn-secondary { padding: 9px 20px; border-radius: 8px; background: #f5f5f5; border: none; color: #333; font-size: 14px; cursor: pointer; }
.btn-danger    { padding: 9px 20px; border-radius: 8px; background: #fff; border: 1px solid #ff4d4f; color: #ff4d4f; font-size: 14px; cursor: pointer; }
.btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }
.error-msg {
  color: #ff4d4f; 
  padding: 8px;
  border-radius: 4px;
  font-size: 0.85rem;
  margin-top: 15px;
  text-align: center;
}

/* 버튼 로딩 시 스타일 */
button:disabled {
  opacity: 0.6;
  cursor: not-allowed;}
</style>