<script setup>
import { ref, watch, computed } from 'vue'
import BaseModal from '@/components/common/BeseModel.vue'
import reservationAPI from '@/api/reservation'

const props = defineProps({
  program: { type: Object, required: true }
})
const emit = defineEmits(['close', 'approved'])

const pendingList  = ref([])
const isLoading    = ref(false)
const isProcessing = ref(false)

watch(() => props.program, async (p) => {
  if (!p) return
  isLoading.value = true
  try {
    const res = await reservationAPI.getAdminReservations({ status: 'PENDING', facilityId: p.facilityId, size: 100, page: 1 })
    pendingList.value = res.data.resultData?.content || res.data.resultData || []
  } catch (e) { console.error(e) }
  finally { isLoading.value = false }
}, { immediate: true })

const pendingCount = computed(() => pendingList.value.length)
const maxCapacity  = computed(() => props.program?.maxCapacity || 0)
const overflowCount = computed(() => Math.max(0, pendingCount.value - maxCapacity.value))

const handleApprove = async () => {
  isProcessing.value = true
  try {
    const res = await reservationAPI.approveGx(props.program.programId)
    const r = res.data.resultData
    alert(`승인 완료\n확정: ${r.confirmedCount}명 / 취소: ${r.cancelledCount}명`)
    emit('approved')
    emit('close')
  } catch (e) {
    alert(e.response?.data?.resultMessage || '승인 처리 중 오류가 발생했습니다.')
  } finally {
    isProcessing.value = false
  }
}
</script>

<template>
  <BaseModal
    :title="program.facilityName"
    subtitle="GX 일괄 승인 처리"
    @close="$emit('close')"
  >
    <!-- 현황 카드 -->
    <div class="stat-row">
      <div class="stat-card">
        <span class="stat-label">승인 대기</span>
        <span class="stat-value pending">{{ pendingCount }}명</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">최대 정원</span>
        <span class="stat-value">{{ maxCapacity }}명</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">정원 초과</span>
        <span class="stat-value" :class="overflowCount > 0 ? 'overflow' : ''">{{ overflowCount }}명</span>
      </div>
    </div>

    <!-- 안내 -->
    <div class="notice">
      신청 순서대로 <strong>{{ Math.min(pendingCount, maxCapacity) }}명</strong> 확정되며,
      나머지 <strong>{{ overflowCount }}명</strong>은 자동 취소됩니다.
    </div>

    <!-- 대기 목록 -->
    <div v-if="isLoading" class="loading">로딩 중...</div>
    <div v-else class="pending-list">
      <div
        v-for="(item, idx) in pendingList"
        :key="item.reservationId"
        :class="['pending-item', idx < maxCapacity ? 'will-confirm' : 'will-cancel']"
      >
        <span class="order">{{ idx + 1 }}</span>
        <div class="user-info">
          <span class="user-name">{{ item.userName }}</span>
          <span class="user-dong">{{ item.dong }} {{ item.ho }}</span>
        </div>
        <span :class="['item-badge', idx < maxCapacity ? 'badge-confirm' : 'badge-cancel']">
          {{ idx < maxCapacity ? '확정 예정' : '취소 예정' }}
        </span>
      </div>
      <div v-if="!isLoading && pendingList.length === 0" class="empty">
        승인 대기 중인 신청이 없습니다.
      </div>
    </div>

    <template #footer>
      <button class="btn-secondary" @click="$emit('close')">닫기</button>
      <button
        class="btn-primary"
        :disabled="pendingCount === 0 || isProcessing"
        @click="handleApprove"
      >{{ isProcessing ? '처리 중...' : '일괄 승인' }}</button>
    </template>
  </BaseModal>
</template>

<style scoped>
.stat-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px; }
.stat-card { background: #f8f9fa; border-radius: 8px; padding: 14px; text-align: center; }
.stat-label { display: block; font-size: 12px; color: #888; margin-bottom: 6px; }
.stat-value { font-size: 22px; font-weight: 700; color: #1E2533; }
.stat-value.pending  { color: #e65100; }
.stat-value.overflow { color: #c62828; }
.notice { background: #fff3e0; border-left: 3px solid #ff9800; padding: 12px; border-radius: 4px; margin-bottom: 16px; font-size: 13px; color: #555; }
.pending-list { max-height: 280px; overflow-y: auto; margin-bottom: 4px; }
.pending-item { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 8px; margin-bottom: 6px; }
.will-confirm { background: #e6f4ea; }
.will-cancel  { background: #fce4ec; }
.order { font-size: 12px; color: #888; min-width: 20px; text-align: center; }
.user-info { flex: 1; }
.user-name { font-size: 14px; font-weight: 500; display: block; }
.user-dong { font-size: 12px; color: #888; }
.item-badge { font-size: 11px; padding: 3px 8px; border-radius: 12px; }
.badge-confirm { background: #c8e6c9; color: #2e7d32; }
.badge-cancel  { background: #ffcdd2; color: #c62828; }
.empty { text-align: center; padding: 30px; color: #888; font-size: 14px; }
.loading { text-align: center; padding: 30px; color: #888; }
.btn-primary   { padding: 9px 20px; border-radius: 8px; background: #1E2533; border: none; color: #fff; font-size: 14px; cursor: pointer; }
.btn-primary:disabled { background: #ccc; cursor: not-allowed; }
.btn-secondary { padding: 9px 20px; border-radius: 8px; background: #f5f5f5; border: none; color: #333; font-size: 14px; cursor: pointer; }
</style>