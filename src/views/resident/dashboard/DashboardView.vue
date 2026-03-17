<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/modules/auth.js'
import { useRouter } from 'vue-router'
import axios from '@/api/axios.js'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Autoplay, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'

const auth = useAuthStore()
const router = useRouter()

// 더미 데이터 (추후 API 연결)
const stats = ref({
  vehicles: 0,
  reservations: 0,
  visitorVehicles: 0,
  parkingRate: 0
})

const notices = ref([])

const reservations = ref([])

// onMounted(async () => {
//   try {
//     const { data } = await axios.get('/dashboard')
//     stats.value = data.stats ?? stats.value
//     notices.value = data.notices ?? []
//     reservations.value = data.reservations ?? []
//   } catch (e) {
//     console.warn('대시보드 API 오류:', e)
//   }
// })

onMounted(async () => {
  try {
    // 공지사항
    const noticeRes = await axios.get('/boards', { params: { category: 'NOTICE', page: 1, size: 3 } })
    notices.value = noticeRes.data.content ?? []

    // 예약 현황
    const reservationRes = await axios.get('/reservations/my')
    reservations.value = reservationRes.data ?? []

    // stats는 차량/방문차량/주차 API 붙으면 그때 채우기
  } catch (e) {
    console.warn('대시보드 로딩 오류:', e)
  }
})

const today = computed(() => {
  const d = new Date()
  const days = ['일', '월', '화', '수', '목', '금', '토']
  return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')} (${days[d.getDay()]})`
})

const dong = computed(() => auth.user?.dong || '101동')
const ho = computed(() => auth.user?.ho || '1201호')

const modules = [Autoplay, Pagination]

const banners = [
  {
    tag: 'APTEN',
    title: '편안한 일상, 스마트한 관리',
    desc: '주차, 예약, 공지사항을 한 곳에서 확인하세요.',
    badge: null,
    badgeClass: null,
    bg: 'https://images.unsplash.com/photo-1533280385001-c32ffcbd52a7?q=80&w=2070&auto=format&fit=crop'
  },
  {
    tag: 'COMMUNITY PROGRAM',
    title: '아파트 커뮤니티 신규 강좌 모집',
    desc: '요가 · 필라테스 · 갤러리댄스 · 영어회화 3월 개강',
    badge: '선착순 20명',
    badgeClass: 'badge-green',
    bg: 'https://images.unsplash.com/photo-1651077837628-52b3247550ae?q=80&w=1074&auto=format&fit=crop'
  },
  {
    tag: 'RESIDENT BENEFIT',
    title: '이마트 그린점 입주민 특별 할인',
    desc: '그린아파트 입주민 앱 제시 시 전 품목 5% 추가 할인',
    badge: '~3.28 까지',
    badgeClass: 'badge-red',
    bg: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1074&auto=format&fit=crop'
  },
  {
    tag: 'GOVERNMENT SUPPORT',
    title: '2026 주거 복지 보조금 신청 안내',
    desc: '에너지 월납 보조금 · 주거급여 · 청년 월세 지원 | 신청기간 ~06.31',
    badge: '신청하기 →',
    badgeClass: 'badge-yellow',
    bg: 'https://images.unsplash.com/photo-1525953776754-6c4b7ee655ab?q=80&w=1021&auto=format&fit=crop'
  },
]

function stripHtml(html) {
  if (!html) return ''
  
  return html
    .replace(/<[^>]*>/g, '')         // 1. 모든 HTML 태그 제거
    .replace(/&nbsp;/g, ' ')         // 2. 연속 공백 기호 변환
    .replace(/&lt;/g, '<')           // 3. 부등호 변환
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .trim()                          // 4. 앞뒤 쓸데없는 공백 제거
    .slice(0, 100)                   // 5. 요약
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return dateStr.split('T')[0] // '2024-03-27' 형태로 출력
}

</script>

<template>
  <div class="dashboard">

    <!-- 헤더 -->
    <div class="dash-header">
      <div>
        <h1 class="greeting">안녕하세요, {{ auth.user?.name || '김가은' }}님</h1>
        <p class="sub-info">{{ today }} · {{ dong }} {{ ho }}</p>
      </div>
    </div>

    <!-- 배너 -->
    <Swiper
      :modules="modules"
      :autoplay="{ delay: 3000, disableOnInteraction: false }"
      :pagination="{ clickable: true }"
      :slides-per-view="1"
      :speed="900"
      loop
      class="banner-swiper"
    >
      <SwiperSlide v-for="(banner, i) in banners" :key="i">
        <div class="banner" :style="{ backgroundImage: `url(${banner.bg})` }">
          <div class="banner-overlay">
            <div class="banner-badge">{{ banner.tag }}</div>
            <h2 class="banner-title">{{ banner.title }}</h2>
            <p class="banner-desc">{{ banner.desc }}</p>
            <span v-if="banner.badge" :class="['banner-chip', banner.badgeClass]">{{ banner.badge }}</span>
          </div>
        </div>
      </SwiperSlide>
    </Swiper>

    <!-- 미니 카드 -->
    <div class="stat-grid">
      <!-- 내 차량 -->
      <div class="stat-card" @click="router.push('/resident/my-vehicle')">
        <div class="stat-label">내 차량</div>
        <div class="stat-value" :class="{ empty: stats.vehicles === 0 }">
          {{ stats.vehicles }} <span class="stat-unit">대</span>
        </div>
        <div class="stat-desc">{{ stats.vehicles === 0 ? '등록된 차량이 없습니다' : '최대 2대 등록 가능' }}</div>
        <div class="stat-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4973E5" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
            <circle cx="7" cy="17" r="2"/>
            <path d="M9 17h6"/>
            <circle cx="17" cy="17" r="2"/>
          </svg>
        </div>
      </div>

      <!-- 예약 현황 -->
      <div class="stat-card" @click="router.push('/resident/my-reservation')">
        <div class="stat-label">예약 현황</div>
        <div class="stat-value" :class="{ empty: stats.reservations === 0 }">
          {{ stats.reservations }} <span class="stat-unit">건</span>
        </div>
        <div class="stat-desc">{{ stats.reservations === 0 ? '예약 내역이 없습니다' : '이번 주 예약' }}</div>
        <div class="stat-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4973E5" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"/>
          </svg>
        </div>
      </div>

      <!-- 방문차량 -->
      <div class="stat-card" @click="router.push('/resident/visitor-vehicles/list')">
        <div class="stat-label">방문 차량</div>
        <div class="stat-value" :class="{ empty: stats.visitorVehicles === 0 }">
          {{ stats.visitorVehicles }} <span class="stat-unit">대</span>
        </div>
        <div class="stat-desc">{{ stats.visitorVehicles === 0 ? '방문 차량이 없습니다' : '승인 대기' }}</div>
        <div class="stat-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4973E5" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/>
          </svg>
        </div>
      </div>

      <!-- 주차 현황 -->
      <div class="stat-card" @click="router.push('/resident/parking/status')">
        <div class="stat-label">주차 현황</div>
        <div class="stat-value" :class="{ empty: stats.parkingRate === 0 }">
          {{ stats.parkingRate }} <span class="stat-unit">%</span>
        </div>
        <div class="parking-bar">
          <div class="parking-fill" :style="{ width: stats.parkingRate + '%' }"></div>
        </div>
        <div class="stat-icon"></div>
      </div>
    </div>

    <!-- 하단 컬럼 두 개 -->
    <div class="bottom-grid">

      <!-- 최근 공지사항 -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">📢최근 공지사항</span>
          <span class="card-more" @click="router.push('/resident/board/notice')">전체보기 →</span>
        </div>
        <div class="card-body">
          <div v-if="notices.length === 0" class="empty-state">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"/>
            </svg>
            <p>등록된 공지사항이 없습니다.</p>
          </div>
          <div
            v-for="notice in notices"
            :key="notice.boardId"
            class="notice-item"
            @click="router.push(`/resident/board/notice/${notice.boardId}`)"
          >
            <div class="notice-row">
              <span v-if="notice.category" class="notice-badge">{{ notice.category }}</span>
              <span v-else class="notice-dot">•</span>
              <span class="notice-title">{{ notice.title }}</span>
            </div>
            <p class="notice-content">{{ stripHtml(notice.content) }}</p>
            <p class="notice-meta">{{ notice.createdAt?.split('T')[0] }} · {{ notice.authorName }}</p>
          </div>
        </div>
      </div>

      <!-- 내 예약 현황 -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">📅내 예약 현황</span>
          <span class="card-more" @click="router.push('/resident/my-reservation')">전체보기 →</span>

        </div>
        <div class="card-body">
          <div v-if="reservations.length === 0" class="empty-state">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"/>
            </svg>
            <p>예약 내역이 없습니다.</p>
          </div>
          <div
            v-for="res in reservations"
            :key="res.reservationId"
            class="reservation-item"
            @click="router.push(`/resident/reservations/${res.reservationId}`)"
          >
            <div class="res-left">
              <span
                class="res-badge"
                :class="`res-badge--${res.statusColor}`"
              >{{ res.status }}</span>
              <div>
                <div class="res-facility">{{ res.facility }}</div>
                <div class="res-date">{{ res.date }} · {{ res.time }}</div>
                <div class="res-desc">{{ res.desc }}</div>
              </div>
            </div>
            <button v-if="res.canCancel" class="btn-cancel" @click.stop>취소</button>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>

/* 헤더 */
.dash-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.greeting {
  font-size: 22px;
  font-weight: 700;
  color: #333333;
  margin: 0;
}
.sub-info {
  font-size: 13px;
  color: #999;
  margin-top: 4px;
}
.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.dashboard { display: flex; flex-direction: column; gap: 20px; }

/* 배너 */
.banner-swiper {
  width: 100%;
  height: 160px;
  border-radius: 16px;
  overflow: hidden;
}
.swiper-slide {
  width: 100%;
  height: 160px;
}
.banner {
  width: 100%;
  height: 160px;
  background-size: cover;
  background-position: center;
  position: relative;
}
.banner-chip {
  margin-top: 10px;
  color: #111;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 20px;
  width: fit-content;
}
/* .badge-blue   { background: #4973E5; color: #fff; } */
.badge-red    { background: #FF6B6B; color: #fff; }
.badge-green  { background: #52B788; color: #fff; }
.badge-yellow   { background: #FFD700; color: #333; }
.banner-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to right, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.1) 100%);
  padding: 28px 32px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.banner-badge {
  font-size: 11px;
  font-weight: 700;
  color: rgba(255,255,255,0.8);
  letter-spacing: 2px;
  margin-bottom: 8px;
}
.banner-title {
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 6px;
}
.banner-desc {
  font-size: 13px;
  color: rgba(255,255,255,0.75);
  margin: 0;
}

/* 미니 카드 */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
.stat-card {
  background: #fff;
  border-radius: 14px;
  padding: 20px;
  border: 1px solid #ECEEF3;
  cursor: pointer;
  position: relative;
  transition: box-shadow 0.2s;
}
.stat-card:hover { box-shadow: 0 4px 16px rgba(73,115,229,0.1); }
.stat-label {
  font-size: 12px;
  color: #999;
  margin-bottom: 8px;
}
.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #333333;
}
.stat-value.empty { color: #D1D5DB; }
.stat-unit {
  font-size: 14px;
  font-weight: 400;
  color: #999;
}
.stat-desc {
  font-size: 11px;
  color: #bbb;
  margin-top: 4px;
}
.stat-icon {
  position: absolute;
  right: 20px;
  bottom: 20px;
  opacity: 0.5;
}
.parking-bar {
  height: 6px;
  background: #ECEEF3;
  border-radius: 99px;
  margin-top: 10px;
  overflow: hidden;
}
.parking-fill {
  height: 100%;
  background: #4973E5;
  border-radius: 99px;
  transition: width 0.5s ease;
}

/* 하단 그리드 */
.bottom-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.card {
  background: #fff;
  border-radius: 14px;
  border: 1px solid #ECEEF3;
  overflow: hidden;
}
.card-header {
  padding: 16px 20px;
  border-bottom: 1px solid #F3F4F8;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-title {
  font-size: 14px;
  font-weight: 600;
  color: #333333;
}
.card-more {
  font-size: 12px;
  color: #999;
  cursor: pointer;
}
.card-more:hover { color: #4973E5; }
.card-body { padding: 8px 0; }

/* 빈 상태 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 36px 20px;
  gap: 12px;
}
.empty-state p {
  font-size: 13px;
  color: #C0C4CE;
  margin: 0;
}

/* 공지사항 */
.notice-item {
  padding: 12px 20px;
  border-bottom: 1px solid #F7F8FA;
  cursor: pointer;
  transition: background 0.15s;
}
.notice-item:hover { background: #F7F8FC; }
.notice-item:last-child { border-bottom: none; }
.notice-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}
.notice-badge {
  font-size: 10px;
  font-weight: 600;
  color: #4973E5;
  background: #EEF0FD;
  padding: 2px 7px;
  border-radius: 4px;
}
.notice-dot {
  color: #ccc;
  font-size: 16px;
  line-height: 1;
}
.notice-title {
  font-size: 13px;
  font-weight: 500;
  color: #333333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 280px;
}
.notice-content {
  font-size: 12px;
  color: #999;
  margin: 2px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.notice-meta {
  font-size: 11px;
  color: #bbb;
  margin: 0;
}

/* 예약 현황 */
.reservation-item {
  padding: 14px 20px;
  border-bottom: 1px solid #F7F8FA;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: background 0.15s;
}
.reservation-item:hover { background: #F7F8FC; }
.reservation-item:last-child { border-bottom: none; }
.res-left {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}
.res-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 4px;
  white-space: nowrap;
  margin-top: 2px;
}
.res-badge--blue { background: #EEF0FD; color: #4973E5; }
.res-badge--orange { background: #FFF4E5; color: #F59E0B; }
.res-badge--gray { background: #F3F4F6; color: #9CA3AF; }
.res-facility {
  font-size: 13px;
  font-weight: 600;
  color: #333333;
}
.res-date {
  font-size: 12px;
  color: #888;
  margin-top: 2px;
}
.res-desc {
  font-size: 11px;
  color: #bbb;
  margin-top: 2px;
}
.btn-cancel {
  padding: 5px 14px;
  border: 1px solid #E0E3EB;
  border-radius: 6px;
  background: #fff;
  font-size: 12px;
  color: #666;
  cursor: pointer;
  white-space: nowrap;
}
.btn-cancel:hover { background: #FFF0F0; color: #EF4444; border-color: #EF4444; }
</style>