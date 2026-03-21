<script setup>
// 공통 모달 컴포넌트
import Modal from '@/components/common/BeseModel.vue'

//이미지 import
import readingroomImg from '@/assets/images/readingroom.png'
import ptImg from '@/assets/images/PT.png'
import golfImg from '@/assets/images/golf.png'
import pilatesImg from '@/assets/images/pilates.png'
import groupPtImg from '@/assets/images/Group PT.png'

// 부모에서 전달받는 예약 정보
const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
})

// 부모에게 닫기 이벤트 전달
const emit = defineEmits(['close'])

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

/**
 * 예약 상태 한글 매핑
 */
const statusTextMap = {
  CONFIRMED: '승인',
  PENDING: '대기',
  CANCELLED: '취소',
  COMPLETED: '이용 완료',
}

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
 * 백엔드가 10:00:00 형식으로 줄 수도 있어서 앞 5자리만 잘라 사용
 */
const formatTime = (timeStr) => {
  if (!timeStr) return '-'
  return String(timeStr).slice(0, 5)
}
</script>

<template>
  <!-- 공통 Base Modal -->
  <Modal
    :title="item.facilityName"
    subtitle="예약 상세 정보"
    @close="emit('close')"
  >
    <div class="detail-wrap">
      <!-- 상단 썸네일 -->
      <div class="thumb-box">
        <img
        :src="getReservationImage(item.facilityName)"
        :alt="item.facilityName"
        class="reservation-thumb"
      />
      </div>

      <!-- 예약 기본 정보 -->
      <div class="detail-grid">
        <!-- 예약 구분 -->
        <div class="detail-row">
          <span class="label">예약 구분</span>
          <span class="value">
            {{ item.typeName === 'GX' ? 'GX 강습' : '편의시설' }}
          </span>
        </div>

        <!-- 시설 종류 -->
        <div class="detail-row">
          <span class="label">시설 종류</span>
          <span class="value">{{ item.facilityName || '-' }}</span>
        </div>

        <!-- 상태 -->
        <div class="detail-row">
          <span class="label">예약 상태</span>
          <span class="value">{{ statusTextMap[item.status] || '-' }}</span>
        </div>

        <!-- GX 예약일 경우 -->
        <template v-if="item.typeName === 'GX'">
          <div class="detail-row">
            <span class="label">수강 기간</span>
            <span class="value">
              {{ formatDate(item.startDate) }} ~ {{ formatDate(item.endDate) }}
            </span>
          </div>

          <div class="detail-row">
            <span class="label">수업 시간</span>
            <span class="value">
              {{ formatTime(item.startTime) }} ~ {{ formatTime(item.endTime) }}
            </span>
          </div>
        </template>

        <!-- 일반 시설 예약일 경우 -->
        <template v-else>
          <div class="detail-row">
            <span class="label">예약 일자</span>
            <span class="value">{{ formatDate(item.reservationDate) }}</span>
          </div>

          <div class="detail-row">
            <span class="label">이용 시간</span>
            <span class="value">
              {{ formatTime(item.startTime) }} ~ {{ formatTime(item.endTime) }}
            </span>
          </div>

          <div class="detail-row">
            <span class="label">좌석 정보</span>
            <span class="value">{{ item.seatNo ? `${item.seatNo}번` : '-' }}</span>
          </div>
        </template>

        <!-- 등록일 -->
        <div class="detail-row">
          <span class="label">등록일</span>
          <span class="value">{{ formatDate(item.createdAt) }}</span>
        </div>
      </div>
    </div>

    <!-- 푸터 버튼 -->
    <template #footer>
      <button class="btn-close" @click="emit('close')">닫기</button>
    </template>
  </Modal>
</template>

<style scoped>
/* 상세 모달 전체 래퍼 */
.detail-wrap {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 썸네일 영역 */
.thumb-box {
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #E2E8F0;
}

/* 썸네일 이미지 */
.thumb {
  width: 100%;
  height: 220px;
  object-fit: cover;
  display: block;
}

/* 정보 리스트 */
.detail-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 한 줄 정보 */
.detail-row {
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

/* 닫기 버튼 */
.btn-close {
  min-width: 88px;
  height: 40px;
  padding: 0 16px;
  border: 1px solid #D5DCE6;
  border-radius: 8px;
  background: #FFFFFF;
  color: #333333;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.btn-close:hover {
  background: #F8FAFC;
}

.reservation-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  border-radius: 10px;
}
</style>