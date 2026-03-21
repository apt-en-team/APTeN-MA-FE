<script setup>
// 공통 모달 컴포넌트
import Modal from '@/components/common/BeseModel.vue'

// 부모에서 전달받는 예약 정보
const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
})

// 부모에게 닫기 / 취소 확정 이벤트 전달
const emit = defineEmits(['close', 'confirm'])

/**
 * 날짜 문자열 포맷팅
 * ex) 2026-03-20 -> 2026.03.20
 */
const formatDate = (dateStr) => {
  if (!dateStr) return '-'

  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return dateStr

  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')

  return `${yyyy}.${mm}.${dd}`
}

/**
 * 시간 문자열 포맷팅
 */
const formatTime = (timeStr) => {
  if (!timeStr) return '-'
  return String(timeStr).slice(0, 5)
}

/**
 * 취소 버튼 클릭 시 부모에 confirm 이벤트 전달
 */
const handleConfirm = () => {
  emit('confirm')
}
</script>

<template>
  <!-- 공통 Base Modal -->
  <Modal
    :title="`${item.facilityName} 예약 취소`"
    subtitle="취소 후 되돌릴 수 없습니다."
    @close="emit('close')"
  >
    <div class="cancel-wrap">
      <!-- 안내 문구 -->
      <div class="info-box">
        <p class="info-title">예약 정보를 확인해주세요</p>
        <p class="info-desc">
          선택한 예약을 정말 취소하시겠습니까?
        </p>
      </div>

      <!-- 취소 대상 예약 요약 -->
      <div class="reservation-summary">
        <!-- 시설명 -->
        <div class="summary-row">
          <span class="label">시설명</span>
          <span class="value">{{ item.facilityName }}</span>
        </div>

        <!-- GX 예약이면 기간 표시 -->
        <template v-if="item.typeName === 'GX'">
          <div class="summary-row">
            <span class="label">수강 기간</span>
            <span class="value">
              {{ formatDate(item.startDate) }} ~ {{ formatDate(item.endDate) }}
            </span>
          </div>

          <div class="summary-row">
            <span class="label">수업 시간</span>
            <span class="value">
              {{ formatTime(item.startTime) }} ~ {{ formatTime(item.endTime) }}
            </span>
          </div>
        </template>

        <!-- 일반 예약이면 예약일시 표시 -->
        <template v-else>
          <div class="summary-row">
            <span class="label">예약 일자</span>
            <span class="value">{{ formatDate(item.reservationDate) }}</span>
          </div>

          <div class="summary-row">
            <span class="label">이용 시간</span>
            <span class="value">
              {{ formatTime(item.startTime) }} ~ {{ formatTime(item.endTime) }}
            </span>
          </div>

          <div class="summary-row">
            <span class="label">좌석 정보</span>
            <span class="value">{{ item.seatNo ? `${item.seatNo}번` : '-' }}</span>
          </div>
        </template>
      </div>
    </div>

    <!-- 푸터 버튼 -->
    <template #footer>
      <button class="btn-secondary" @click="emit('close')">닫기</button>
      <button class="btn-danger" @click="handleConfirm">예약 취소</button>
    </template>
  </Modal>
</template>

<style scoped>
/* 취소 모달 전체 래퍼 */
.cancel-wrap {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 상단 안내 박스 */
.info-box {
  padding: 14px 16px;
  border-radius: 10px;
  background: #FFF8F8;
  border: 1px solid #F5D0D0;
}

/* 안내 제목 */
.info-title {
  font-size: 13px;
  font-weight: 700;
  color: #333333;
  margin-bottom: 4px;
}

/* 안내 설명 */
.info-desc {
  font-size: 12px;
  color: #757575;
}

/* 예약 요약 영역 */
.reservation-summary {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 한 줄 요약 */
.summary-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  background: #F8FAFC;
}

/* 왼쪽 라벨 */
.label {
  font-size: 12px;
  color: #757575;
}

/* 오른쪽 값 */
.value {
  font-size: 13px;
  color: #333333;
  font-weight: 600;
  text-align: right;
}

/* 닫기 / 취소 버튼 공통 */
.btn-secondary,
.btn-danger {
  min-width: 96px;
  height: 40px;
  padding: 0 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

/* 닫기 버튼 */
.btn-secondary {
  border: 1px solid #D5DCE6;
  background: #FFFFFF;
  color: #333333;
}

.btn-secondary:hover {
  background: #F8FAFC;
}

/* 취소 버튼 */
.btn-danger {
  border: 1px solid #E53E3E;
  background: #E53E3E;
  color: #FFFFFF;
}

.btn-danger:hover {
  background: #d43d3d;
}
</style>