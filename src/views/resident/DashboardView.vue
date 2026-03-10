<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/modules/auth.js'
import { useRouter } from 'vue-router'
import axios from '@/api/axios'
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

onMounted(async () => {
  try {
    const { data } = await axios.get('/dashboard')
    stats.value = data.stats
    notices.value = data.notices
    reservations.value = data.reservations
  } catch (e) {
    console.warn('대시보드 API 오류:', e)
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
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4973E5" stroke-width="1.5">
            <path d="M1 3h15v13H1z"/>
            <path d="M16 8h4l3 3v5h-7V8z"/>
            <circle cx="5.5" cy="18.5" r="2.5"/>
            <circle cx="18.5" cy="18.5" r="2.5"/>
          </svg>
        </div>
      </div>

      <!-- 예약 현황 -->
      <div class="stat-card" @click="router.push('/resident/facility')">
        <div class="stat-label">예약 현황</div>
        <div class="stat-value" :class="{ empty: stats.reservations === 0 }">
          {{ stats.reservations }} <span class="stat-unit">건</span>
        </div>
        <div class="stat-desc">{{ stats.reservations === 0 ? '예약 내역이 없습니다' : '이번 주 예약' }}</div>
        <div class="stat-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4973E5" stroke-width="1.5">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
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
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4973E5" stroke-width="1.5">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
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
          <span class="card-title">📢 최근 공지사항</span>
          <span class="card-more" @click="router.push('/resident/board/notice')">전체보기 →</span>
        </div>
        <div class="card-body">
          <div v-if="notices.length === 0" class="empty-state">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" stroke-width="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="9" y1="13" x2="15" y2="13"/>
              <line x1="9" y1="17" x2="12" y2="17"/>
            </svg>
            <p>등록된 공지사항이 없습니다.</p>
          </div>
          <div
            v-for="notice in notices"
            :key="notice.id"
            class="notice-item"
            @click="router.push('/resident/boards')"
          >
            <div class="notice-row">
              <span v-if="notice.type" class="notice-badge">{{ notice.type }}</span>
              <span v-else class="notice-dot">•</span>
              <span class="notice-title">{{ notice.title }}</span>
            </div>
            <p class="notice-content">{{ notice.content }}</p>
            <p class="notice-meta">{{ notice.date }} · {{ notice.author }}</p>
          </div>
        </div>
      </div>

      <!-- 내 예약 현황 -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">📅 내 예약 현황</span>
          <span class="card-more" @click="router.push('/resident/my-reservation')">전체보기 →</span>
        </div>
        <div class="card-body">
          <div v-if="reservations.length === 0" class="empty-state">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" stroke-width="1.5">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <p>예약 내역이 없습니다.</p>
          </div>
          <div
            v-for="res in reservations"
            :key="res.id"
            class="reservation-item"
            @click="router.push('/resident/reservations')"
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