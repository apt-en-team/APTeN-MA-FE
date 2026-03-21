<script setup>
//이미지 import
import readingroomImg from '@/assets/images/readingroom.png'
import ptImg from '@/assets/images/PT.png'
import golfImg from '@/assets/images/golf.png'
import pilatesImg from '@/assets/images/pilates.png'
import groupPtImg from '@/assets/images/Group PT.png'

//props
const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
})

//이벤트
const emit = defineEmits(['detail', 'cancel'])

//상태 텍스트
const statusTextMap = {
  CONFIRMED: '승인',
  PENDING: '대기',
  CANCELLED: '취소',
  COMPLETED: '완료',
}

//상태 클래스
const getStatusClass = (status) => {
  if (status === 'CONFIRMED') return 'available'
  if (status === 'PENDING') return 'pending'
  if (status === 'CANCELLED') return 'closed'
  return 'completed'
}

//취소 가능 여부
const canCancel = () => {
  return ['CONFIRMED', 'PENDING'].includes(props.item.status)
}

//GX 여부
const isGxReservation = () => {
  const name = props.item.facilityName || ''
  const typeName = props.item.typeName || ''
  return name.includes('GX') || name.includes('필라테스') || name.includes('그룹PT') || typeName.includes('GX')
}

//날짜 포맷
const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return dateStr

  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}.${mm}.${dd}`
}

//시간 포맷
const formatTime = (timeStr) => {
  if (!timeStr) return '-'
  return String(timeStr).slice(0, 5)
}

//좌석 텍스트
const getSeatText = () => {
  if (!props.item.seatNo) return '-'
  return `${props.item.seatNo}번 좌석`
}

//상태 텍스트
const getStatusText = (status) => {
  return statusTextMap[status] || '완료'
}

//이미지 매핑
const getReservationImage = (name) => {
  if (!name) return readingroomImg
  if (name.includes('독서실')) return readingroomImg
  if (name.includes('헬스')) return ptImg
  if (name.includes('골프')) return golfImg
  if (name.includes('필라테스')) return pilatesImg
  if (name.includes('그룹PT')) return groupPtImg
  if (name.includes('GX')) return pilatesImg
  return readingroomImg
}

//설명 텍스트
const getDescription = () => {
  if (isGxReservation()) {
    return `기간 : ${props.item.startDate} ~ ${props.item.endDate}`
  }

  if ((props.item.facilityName || '').includes('독서실')) {
    return `좌석 예약${props.item.seatNo ? ` (${props.item.seatNo}번)` : ''}`
  }

  if ((props.item.facilityName || '').includes('골프')) {
    return `타석 예약${props.item.seatNo ? ` (${props.item.seatNo}번)` : ''}`
  }

  if ((props.item.facilityName || '').includes('헬스')) {
    return '자유 이용 예약'
  }

  return '시설 예약 내역'
}
</script>

<template>
  <article class="reservation-card">
    <!--이미지-->
    <div class="reservation-img">
      <img
        :src="getReservationImage(item.facilityName)"
        :alt="item.facilityName"
        class="reservation-thumb"
      />
    </div>

    <!--정보-->
    <div class="reservation-info">
      <div class="reservation-header">
        <span class="reservation-name">{{ item.facilityName }}</span>

        <span :class="['status-badge', getStatusClass(item.status)]">
          {{ getStatusText(item.status) }}
        </span>
      </div>

      <p class="reservation-desc">{{ getDescription() }}</p>

      <div class="reservation-meta">
        <!--GX-->
        <template v-if="isGxReservation()">
          <span class="meta-item">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            수업 시간: {{ formatTime(item.startTime) }} ~ {{ formatTime(item.endTime) }}
          </span>
        </template>

        <!--헬스장-->
        <template v-else-if="item.typeName == '헬스장'">
          <span class="meta-item">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            운영 시간: 05:00 ~ {{ formatTime(item.endTime) }}
          </span>
        </template>

        <!--독서실-->
        <template v-else-if="item.typeName == '독서실'">
          <span class="meta-item">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            운영 시간: {{ formatTime(item.startTime) }} ~ {{ formatTime(item.endTime) }}
          </span>
        </template>

        <!--골프연습장-->
        <template v-else-if="item.typeName == '골프연습장'">
          <span class="meta-item">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            예약 시간: {{ formatTime(item.startTime) }} ~ {{ formatTime(item.endTime) }}
          </span>
        </template>

          <span class="meta-item">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M8 2v4M16 2v4M3 10h18M5 6h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"/>
            </svg>
            예약일: {{ formatDate(item.reservationDate) }}
          </span>
      </div>
    </div>

    <!--버튼-->
    <div class="reservation-actions">
      <button class="action-btn detail-btn" @click.stop="emit('detail')">
        상세보기
      </button>

      <button
        v-if="canCancel()"
        class="action-btn cancel-btn"
        @click.stop="emit('cancel')"
      >
        예약 취소
      </button>
    </div>
  </article>
</template>

<style scoped>
.reservation-card {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #E2E8F0;
  padding: 16px;
  display: flex;
  gap: 16px;
  align-items: center;
  cursor: default;
  transition: box-shadow 0.15s;
}

.reservation-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.06);
  border-color: #D5DCE6;
}

.reservation-img {
  width: 180px;
  height: 110px;
  background: #F5F6F8;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.reservation-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  border-radius: 10px;
}

.reservation-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}

.reservation-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.reservation-name {
  font-size: 18px;
  font-weight: 700;
  color: #1A202C;
  line-height: 1.2;
}

.reservation-desc {
  font-size: 15px;
  font-weight: 600;
  color: #718096;
  line-height: 1.4;
}

.reservation-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 12px;
  margin-top: 2px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #718096;
}

.reservation-actions {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 8px;
  flex-shrink: 0;
}

.action-btn {
  min-width: 84px;
  height: 32px;
  padding: 0 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.detail-btn {
  background: #FFFFFF;
  color: #333333;
  border: 1px solid #D5DCE6;
}

.detail-btn:hover {
  background: #F8FAFC;
}

.cancel-btn {
  background: #FFFFFF;
  color: #E53E3E;
  border: 1px solid #F3B1B1;
}

.cancel-btn:hover {
  background: #FFF5F5;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
}

.status-badge.available {
  background: #E5F8EB;
  color: #50C878;
}

.status-badge.pending {
  background: #FFF4E5;
  color: #C08B2D;
}

.status-badge.closed {
  background: #FDECEC;
  color: #E53E3E;
}

.status-badge.completed {
  background: #EEF3FB;
  color: #4973E5;
}
</style>