<script setup>
// GX 예약 카드
const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
})

// 부모에 이벤트 전달
const emit = defineEmits(['detail', 'cancel'])

/**
 * 상태 한글 표시
 */
const statusTextMap = {
  CONFIRMED: '승인',
  PENDING: '대기',
  CANCELLED: '취소',
  COMPLETED: '수강 완료',
}

/**
 * 상태별 badge class 반환
 */
const getStatusClass = (status) => {
  if (status === 'CONFIRMED') return 'confirmed'
  if (status === 'PENDING') return 'pending'
  if (status === 'CANCELLED') return 'cancelled'
  return 'completed'
}

/**
 * 취소 가능한 상태인지 판단
 */
const canCancel = () => {
  return ['CONFIRMED', 'PENDING'].includes(props.item.status)
}

/**
 * 날짜 포맷팅
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

const getReservationImage = (facilityName) => {
  if (facilityName?.includes('독서실')) return '/images/facility-library.jpg'
  if (facilityName?.includes('헬스')) return '/images/facility-gym.jpg'
  if (facilityName?.includes('골프')) return '/images/facility-golf.jpg'
  if (facilityName?.includes('GX') || facilityName?.includes('필라테스')) {
    return '/images/facility-gx.jpg'
  }
  return '/images/facility-default.jpg'
}


</script>

<template>
  <article class="reservation-card gx-card">
    <!-- GX 썸네일 -->
    <div class="thumb-wrap">
      <img :src="getReservationImage(item.facilityName)" alt="GX 이미지" class="thumb" />
    </div>

    <!-- 카드 본문 -->
    <div class="card-body">
      <!-- 상단: 프로그램명 + 상태 -->
      <div class="body-top">
        <div class="title-wrap">
          <p class="category">{{ item.facilityTypeName }}</p>
          <h3 class="title">{{ item.facilityName }}</h3>
        </div>

        <span :class="['status-badge', getStatusClass(item.status)]">
          {{ statusTextMap[item.status] }}
        </span>
      </div>

      <!-- GX 정보 -->
      <div class="info-grid">
        <div class="info-item">
          <span class="label">수강 기간</span>
          <span class="value">
            {{ formatDate(item.courseStartDate) }} ~ {{ formatDate(item.courseEndDate) }}
          </span>
        </div>

        <div class="info-item">
          <span class="label">수업 시간</span>
          <span class="value">{{ item.startTime }} ~ {{ item.endTime }}</span>
        </div>

        <div class="info-item">
          <span class="label">등록일</span>
          <span class="value">{{ formatDate(item.createdAt) }}</span>
        </div>
      </div>

      <!-- 하단 버튼 -->
      <div class="action-row">
        <button class="btn-outline" @click="emit('detail')">상세보기</button>
        <button v-if="canCancel()" class="btn-danger" @click="emit('cancel')">예약 취소</button>
      </div>
    </div>
  </article>
</template>

<style scoped>
.reservation-card {
  display: flex;
  gap: 14px;
  padding: 14px 16px;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  background: #FFFFFF;
  box-shadow: 0 6px 18px rgba(30, 42, 62, 0.05);
}

.thumb-wrap {
  flex-shrink: 0;
}

.thumb {
  width: 132px;
  height: 88px;
  object-fit: cover;
  border-radius: 12px;
  display: block;
}

.card-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.body-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.title-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.category {
  font-size: 12px;
  color: #757575;
}

.title {
  font-size: 17px;
  font-weight: 800;
  color: #333333;
  line-height: 1.2;
}

.status-badge {
  flex-shrink: 0;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.status-badge.confirmed {
  background: #E8F6ED;
  color: #2F855A;
}

.status-badge.pending {
  background: #FFF4E5;
  color: #C08B2D;
}

.status-badge.cancelled {
  background: #FDECEC;
  color: #E53E3E;
}

.status-badge.completed {
  background: #EEF3FB;
  color: #4973E5;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.label {
  font-size: 12px;
  color: #757575;
}

.value {
  font-size: 13px;
  color: #333333;
  font-weight: 600;
}

.action-row {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: auto;
}

.btn-outline,
.btn-danger {
  height: 32px;
  padding: 0 12px;
  border-radius: 8px;
  font-size: 12px;
}

.btn-outline {
  background: #FFFFFF;
  color: #333333;
  border: 1px solid #D5DCE6;
}

.btn-outline:hover {
  background: #F8FAFC;
}

.btn-danger {
  background: #FFFFFF;
  color: #E53E3E;
  border: 1px solid #F3B1B1;
}

.btn-danger:hover {
  background: #FFF5F5;
}
</style>