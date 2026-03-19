<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import facilityAPI from '@/api/facility.js'

const router = useRouter()

/** 공지 데이터 */
const notices = ref([])

/** 내 예약 (임시 - 나중에 API 연결 가능) */
const reservations = ref([
  { id: 1, day: '07', name: '헬스장', time: '오늘 9시 ~ 10시' },
  { id: 2, day: '08', name: '독서실', time: '3월 1일 4시 ~ 5시' },
  { id: 3, day: '12', name: '그룹PT', time: '3월 8일 3시 ~ 4시' },
])

/** 공지 조회 */
const fetchNotices = async () => {
  try {
    const { data } = await noticeAPI.getNotices()
    notices.value = data.resultData ?? []
  } catch (e) {
    console.error('공지 조회 실패', e)
  }
}

/** 페이지 이동 */
const notice = () => {
  router.push('/resident/board/notice')
}

const reservation = () => {
  router.push('/resident/my-reservation')
}



/** 날짜 포맷 (2026-03-18 → 26.03.18) */
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const yy = String(d.getFullYear()).slice(2)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yy}.${mm}.${dd}`
}

onMounted(fetchNotices)
</script>

<template>
  <div class="sidebar">

    <!-- 공지 -->
    <div class="box">
      <div class="header">
        <span>관련 공지</span>
        <span class="more" @click="notice">더보기 →</span>
      </div>

      <div class="notice-list">
        <div
          v-for="n in notices"
          :key="n.noticeId"
          class="notice-item"
          @click="goToNoticeDetail(n.noticeId)"
        >
          <div class="thumb"></div>

          <div class="info">
            <div class="title">{{ n.title }}</div>
            <div class="date">
              등록일자: {{ formatDate(n.createdAt) }}
            </div>
          </div>
        </div>

        <div v-if="notices.length === 0" class="empty">
          공지가 없습니다.
        </div>
      </div>
    </div>

    <!-- 내 예약 -->
    <div class="box">
      <div class="header">
        <span>내 예약</span>
        <span class="more" @click="reservation">더보기 →</span>
      </div>

      <div class="reservation-list">
        <div
          v-for="r in reservations"
          :key="r.id"
          class="reservation-item"
          @click="goToMyReservation"
        >
          <div class="day">{{ r.day }}</div>

          <div class="info">
            <div class="name">{{ r.name }}</div>
            <div class="time">{{ r.time }}</div>
          </div>
        </div>

        <div v-if="reservations.length === 0" class="empty">
          예약 내역이 없습니다.
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.sidebar {
  width: 280px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 공통 박스 */
.box {
  background: #fff;
  border: 1px solid #E2E8F0;
  border-radius: 10px;
  padding: 16px;
}

.header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-weight: 700;
}

.more {
  font-size: 12px;
  color: #A0AEC0;
  cursor: pointer;
}

.more:hover {
  color: #2B3A55;
}

/* 공지 */
.notice-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notice-item {
  display: flex;
  gap: 10px;
  cursor: pointer;
}

.notice-item:hover {
  opacity: 0.8;
}

.thumb {
  width: 100px;
  height: 70px;
  border-radius: 8px;
  background: #EDF2F7;
}

.title {
  font-size: 12px;
  font-weight: 600;
}

.date {
  font-size: 11px;
  color: #A0AEC0;
}

/* 예약 */
.reservation-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.reservation-item {
  display: flex;
  gap: 12px;
  align-items: center;
  cursor: pointer;
}

.reservation-item:hover {
  opacity: 0.8;
}

.day {
  width: 36px;
  height: 36px;
  background: #F0F4FF;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: #2B3A55;
}

.name {
  font-size: 13px;
  font-weight: 600;
}

.time {
  font-size: 11px;
  color: #A0AEC0;
}

/* 빈 상태 */
.empty {
  text-align: center;
  font-size: 12px;
  color: #A0AEC0;
  padding: 20px 0;
}
</style>