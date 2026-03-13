<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useHouseholdStore } from '@/stores/modules/household.js'
import { useVehicleStore }   from '@/stores/modules/vehicle.js'
import StatsCards from '@/components/admin/StatsCards.vue'

const router = useRouter()
const vehicleStore   = useVehicleStore()    

// ── 로딩 / 에러 상태 ──
const isLoading = ref(false)
const hasError  = ref(false)

// ── 피니아 스토어 ──
const householdStore = useHouseholdStore()

// ── 대시보드 데이터 fetch ──
const fetchDashboardData = async () => {
  isLoading.value = true
  hasError.value  = false
  try {
    await Promise.all([
      householdStore.fetchStats(),   // 세대 통계
      // parkingStore.fetchStats(),  // 나중에 주차 추가
      // reservationStore.fetchStats(), // 나중에 예약 추가
    ])

    // 패널 데이터 - API 연결 후 교체
    dashboardState.visitors   = []
    dashboardState.facilities = []
    dashboardState.records    = []
    dashboardState.posts      = []

  } catch (e) {
    console.error('대시보드 데이터 오류:', e)
    hasError.value = true
  } finally {
    isLoading.value = false
  }
}

// ── 주차/예약 summary (나중에 피니아 스토어로 대체) ──
const summary = reactive({
  pendingCount: null,  // 승인 대기 건수
  parkingUsed:  null,  // 주차 사용 면수
  parkingTotal: null,  // 주차 전체 면수
  todayReserve: null,  // 오늘 예약 건수
  reserveDiff:  null,  // 전일 대비 증감
})

// ── 패널 목록 ──
const dashboardState = reactive({
  visitors:   [],
  facilities: [],
  records:    [],
  posts:      [],
})

// ── computed ──
const parkingPercent = computed(() => {
  if (!summary.parkingUsed || !summary.parkingTotal) return null
  return Math.round((summary.parkingUsed / summary.parkingTotal) * 100)
})

const reserveDiffLabel = computed(() => {
  if (summary.reserveDiff === null) return null
  return (summary.reserveDiff >= 0 ? '+' : '') + summary.reserveDiff + '건'
})

// ── StatsCards 에 넘길 데이터 ──
const dashboardStats = computed(() => [
  {
    label:     '승인 대기',
    value:     summary.pendingCount ?? '-',
    unit:      summary.pendingCount !== null ? '건' : '',
    desc:      summary.pendingCount !== null ? '입주민차량 승인 필요' : '데이터 없음',
    descClass: 'highlight-orange',
    iconClass: 'icon-orange',
  },
  {
    label:     '주차 현황',
    value:     parkingPercent.value ?? '-',
    unit:      parkingPercent.value !== null ? '%' : '',
    desc:      summary.parkingUsed !== null
                 ? `${summary.parkingUsed} / ${summary.parkingTotal}면 사용중`
                 : '데이터 없음',
    progress:  parkingPercent.value,
    iconClass: 'icon-blue',
  },
  {
    label:     '오늘 예약',
    value:     summary.todayReserve ?? '-',
    unit:      summary.todayReserve !== null ? '건' : '',
    desc:      reserveDiffLabel.value !== null
                 ? `전일 대비 ${reserveDiffLabel.value}`
                 : '데이터 없음',
    descClass: 'highlight-green',
    iconClass: 'icon-green',
  },
  {
    label:     '전체 세대',
    value:     householdStore.total || '-',
    unit:      householdStore.total ? '세대' : '',
    desc:      householdStore.total
                 ? `입주 ${householdStore.occupied}세대 · 공실 ${householdStore.empty}세대`
                 : '데이터 없음',
    iconClass: 'icon-gray',
  },
])

onMounted(() => {
  console.log('대시보드 마운트됨')
  fetchDashboardData()
})
</script>

<template>
  <div class="admin-dashboard">

    <!-- 로딩 -->
    <div v-if="isLoading" class="status-overlay">
      <span class="status-spinner" />
      <p class="status-text">데이터를 불러오는 중입니다...</p>
    </div>

    <!-- 에러 -->
    <div v-else-if="hasError" class="status-overlay status-error">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8"  x2="12"    y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <p class="status-text">데이터를 불러오는 중 오류가 발생했습니다.</p>
      <button class="retry-btn" @click="fetchDashboardData">다시 시도</button>
    </div>

    <!-- 대시보드 본문 -->
    <div v-else class="dashboard-wrapper">

      <!-- ── 요약 카드 4개 ── -->
      <section class="summary-section">
        <StatsCards :stats="dashboardStats" :showIcon="true"
          @click-0="router.push({ name: 'AdminVehicleListView' })"
          @click-1="router.push({ name: 'ParkingDashboardView' })"
          @click-2="router.push({ name: 'AdminReservationListView' })"
          @click-3="router.push({ name: 'HouseholdManage' })"
        >
          <!-- 승인 대기 아이콘 -->
          <template #icon-0>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </template>
          <!-- 주차 현황 아이콘 -->
          <template #icon-1>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M9 17V9h4a2 2 0 010 4H9"/>
            </svg>
          </template>
          <!-- 오늘 예약 아이콘 -->
          <template #icon-2>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </template>
          <!-- 전체 세대 아이콘 -->
          <template #icon-3>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              <polyline points="9,22 9,12 15,12 15,22"/>
            </svg>
          </template>
        </StatsCards>
      </section>

      <!-- ── 중간 행: 방문차량 / 시설 예약 ── -->
      <section class="middle-grid">

        <!-- 방문차량 관리 패널 -->
        <div class="panel">
          <div class="panel-header">
            <h2 class="panel-title">방문차량 목록</h2>
            <router-link :to="{ name: 'AdminVehicleListView' }" class="panel-more">전체보기 →</router-link>
          </div>
          <div v-if="dashboardState.visitors.length > 0" class="visitor-list">
            <div
              v-for="vehicle in dashboardState.visitors"
              :key="vehicle.plate"
              class="visitor-item card-clickable"
              @click="router.push({ name: 'AdminVehicleListView' })"
            >
              <div class="visitor-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="1" y="9" width="22" height="9" rx="2"/>
                  <path d="M5 9V6a2 2 0 012-2h10a2 2 0 012 2v3"/>
                  <circle cx="7" cy="18" r="2"/>
                  <circle cx="17" cy="18" r="2"/>
                </svg>
              </div>
              <div class="visitor-info">
                <strong class="visitor-plate">{{ vehicle.plate }}</strong>
                <span class="visitor-detail">{{ vehicle.resident }} · {{ vehicle.unit }} · {{ vehicle.purpose }}</span>
                <span class="visitor-date">{{ vehicle.date }}</span>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="1" y="9" width="22" height="9" rx="2"/>
              <path d="M5 9V6a2 2 0 012-2h10a2 2 0 012 2v3"/>
              <circle cx="7" cy="18" r="2"/>
              <circle cx="17" cy="18" r="2"/>
            </svg>
            <span class="empty-text">방문차량 기록이 없습니다</span>
          </div>
        </div>

        <!-- 오늘 시설 예약 현황 패널 -->
        <div class="panel">
          <div class="panel-header">
            <h2 class="panel-title">오늘 시설 예약 현황</h2>
            <router-link :to="{ name: 'AdminReservationListView' }" class="panel-more">전체보기 →</router-link>
          </div>
          <div v-if="dashboardState.facilities.length > 0" class="facility-list">
            <div
              v-for="facility in dashboardState.facilities"
              :key="facility.name"
              class="facility-item card-clickable"
              @click="router.push({ name: 'AdminReservationListView' })"
            >
              <div class="facility-bar" :class="'bar-' + facility.barColor"></div>
              <div class="facility-left">
                <strong class="facility-name">{{ facility.name }}</strong>
                <span class="facility-time">{{ facility.hours }}</span>
              </div>
              <div class="facility-right">
                <div class="facility-name-row">
                  <div class="progress-bar">
                    <div class="progress-fill" :class="facility.barColor" :style="{ width: facility.percent + '%' }"></div>
                  </div>
                  <span class="facility-count">
                    <span :class="['count-current', facility.isFull ? 'count-red' : '']">{{ facility.current }}</span>
                    / {{ facility.total }} 타임
                  </span>
                </div>
                <span class="facility-percent" :class="facility.isFull ? 'text-red' : ''">{{ facility.percent }}%</span>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span class="empty-text">오늘 예약된 시설이 없습니다</span>
          </div>
        </div>

      </section>

      <!-- ── 하단 행: 입출차 기록 / 게시판 활동 ── -->
      <section class="bottom-grid">

        <!-- 최근 입출차 기록 패널 -->
        <div class="panel">
          <div class="panel-header">
            <h2 class="panel-title">최근 입출차 기록</h2>
            <router-link :to="{ name: 'AdminParkingLog' }" class="panel-more">전체보기 →</router-link>
          </div>
          <template v-if="dashboardState.records.length > 0">
            <table class="entry-table">
              <thead>
                <tr>
                  <th>구분</th>
                  <th>차량번호</th>
                  <th>유형</th>
                  <th>세대</th>
                  <th>시각</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="record in dashboardState.records" :key="record.plate + record.time">
                  <td>
                    <span :class="['tag-direction', record.direction === 'IN' ? 'tag-in' : 'tag-out']">
                      {{ record.direction }}
                    </span>
                  </td>
                  <td class="plate-cell">{{ record.plate }}</td>
                  <td>
                    <span :class="['tag-type', record.typeClass]">{{ record.type }}</span>
                  </td>
                  <td class="unit-cell">{{ record.unit }}</td>
                  <td class="time-cell">{{ record.time }}</td>
                </tr>
              </tbody>
            </table>
          </template>
          <div v-else class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
              <rect x="9" y="3" width="6" height="4" rx="1"/>
              <line x1="9" y1="12" x2="15" y2="12"/>
              <line x1="9" y1="16" x2="13" y2="16"/>
            </svg>
            <span class="empty-text">최근 입출차 기록이 없습니다</span>
          </div>
        </div>

        <!-- 최근 게시판 활동 패널 -->
        <div class="panel">
          <div class="panel-header">
            <h2 class="panel-title">최근 게시판 활동</h2>
            <router-link :to="{ name: 'AdminBoardList' }" class="panel-more">전체보기 →</router-link>
          </div>
          <div v-if="dashboardState.posts.length > 0" class="board-list">
            <div
              v-for="post in dashboardState.posts"
              :key="post.id"
              class="board-item card-clickable"
              @click="router.push({ name: 'AdminBoardList' })"
            >
              <div class="board-left">
                <span :class="['board-tag', post.tagClass]">{{ post.tag }}</span>
                <div class="board-content">
                  <span class="board-title">{{ post.title }}</span>
                  <span class="board-meta">{{ post.author }}<template v-if="post.views"> · {{ post.views }}</template></span>
                </div>
              </div>
              <div class="board-right">
                <span v-if="post.comments" class="board-comments">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                  </svg>
                  {{ post.comments }}
                </span>
                <span class="board-date">{{ post.date }}</span>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
            <span class="empty-text">최근 게시글이 없습니다</span>
          </div>
        </div>

      </section>
    </div>

  </div>
</template>

<style scoped>
* { box-sizing: border-box; margin: 0; padding: 0; }

.admin-dashboard { width: 100%; min-height: 100%; }

/* 로딩 / 에러 오버레이 */
.status-overlay {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 400px;
}

.status-spinner {
  display: block;
  width: 36px;
  height: 36px;
  border: 3px solid #e5e7eb;
  border-top-color: #2B3A55;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.status-text { font-size: 14px; color: #92959D; }

.status-error svg { width: 40px; height: 40px; color: #C08B2D; }

.retry-btn {
  margin-top: 4px;
  padding: 8px 20px;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  background: #2B3A55;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.retry-btn:hover { background: #3D5170; }

/* 대시보드 래퍼 */
.dashboard-wrapper {
  width: 100%;
}

/* 클릭 가능 공통 */
.card-clickable {
  cursor: pointer;
  transition: box-shadow 0.15s ease, transform 0.15s ease;
}

.card-clickable:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

/* 패널 그리드 */
.middle-grid,
.bottom-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
}

.panel {
  background: #fff;
  border-radius: 15px;
  border: 1px solid #e9ecf1;
  padding: 20px;
  height: 340px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  border-bottom: 1px solid #f3f4f6;
  padding-bottom: 10px;
}

.panel-title { font-size: 18px; font-weight: 700; color: #333333; }

.panel-more { font-size: 13px; color: #3D5170; text-decoration: none; }
.panel-more:hover { color: #3b6ef8; }

/* 빈 상태 */
.empty-state {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 10px; padding: 36px 0;
}

.empty-state svg { width: 36px; height: 36px; color: #d1d5db; }

.empty-text { font-size: 13px; color: #b0b8c9; font-weight: 500; }

/* 방문차량 */
.visitor-list { display: flex; flex-direction: column; gap: 12px; }

.visitor-item {
  display: flex; align-items: center; gap: 12px;
  padding: 10px; border-radius: 10px; background: #f9fafb;
}

.visitor-icon {
  width: 36px; height: 36px;
  background: #E8EBF2; border-radius: 50px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

.visitor-icon svg { width: 18px; height: 18px; color: #2B3A55; }

.visitor-info { display: flex; flex-direction: column; gap: 2px; }

.visitor-plate  { font-size: 14px; font-weight: 700; color: #333333; }
.visitor-detail { font-size: 12px; color: #687282; }
.visitor-date   { font-size: 11px; color: #687282; }

/* 시설 */
.facility-list { display: flex; flex-direction: column; gap: 12px; }

.facility-item {
  display: flex; align-items: center; gap: 12px;
  padding: 15px 16px; border-radius: 10px;
  background: #f9fafb; justify-content: space-between;
}

.facility-bar { width: 4px; height: 44px; border-radius: 5px; flex-shrink: 0; }

.bar-dark   { background: #2B3A55; }
.bar-green  { background: #4D8B5A; }
.bar-yellow { background: #C08B2D; }

.facility-left {
  flex: 1; display: flex; flex-direction: column; gap: 4px; min-width: 100px;
}

.facility-right {
  width: 160px; flex-shrink: 0;
  display: flex; flex-direction: column; gap: 6px;
}

.facility-name-row { display: flex; align-items: center; gap: 10px; }
.facility-name-row .progress-bar { flex: 1; }

.facility-name    { font-size: 14px; font-weight: 600; color: #333333; }
.facility-time    { font-size: 12px; color: #687282; }
.facility-count   { font-size: 12px; color: #92959D; }
.facility-percent { font-size: 12px; color: #6B7280; min-width: 32px; }

.count-current { font-weight: 700; color: #4D8B5A; }
.count-red     { color: #C08B2D !important; }
.text-red      { color: #E53E3E !important; }

/* 입출차 테이블 */
.entry-table { width: 100%; border-collapse: collapse; font-size: 13px; }

.entry-table th {
  text-align: left; font-size: 11px; font-weight: 600;
  color: #687282; padding: 4px 8px 10px;
  border-bottom: 1px solid #f3f4f6; letter-spacing: 1.5px;
}

.entry-table td {
  padding: 10px 8px;
  border-bottom: 1px solid #F7F8FA;
  color: #374151;
}

.entry-table tr:last-child td { border-bottom: none; }

.tag-direction {
  display: block; font-size: 10px; font-weight: 700;
  padding: 2px 0; border-radius: 5px;
  min-width: 36px; text-align: center;
}

.tag-in  { background: #C6F6D5; color: #4D8B5A; }
.tag-out { background: #FFF5F5; color: #E53E3E; }

.tag-type { display: inline-block; font-size: 11px; padding: 2px 8px; border-radius: 5px; }

.type-registered   { background: #E8EBF2; color: #2B3A55; }
.type-unregistered { background: #FDF6E8; color: #C08B2D; }
.type-visitor      { background: #EDEEF2; color: #6B7280; }

.plate-cell { color: #333333; }
.unit-cell  { color: #687282; }
.time-cell  { color: #92959D; font-size: 13px; }

/* 게시판 */
.board-list { display: flex; flex-direction: column; gap: 0; }

.board-item {
  display: flex; align-items: center;
  justify-content: space-between;
  padding: 12px 14px; background: #f9fafb;
  border-radius: 10px; margin-bottom: 8px;
}

.board-item:last-child { margin-bottom: 0; }

.board-left { display: flex; align-items: flex-start; gap: 10px; flex: 1; }

.board-tag {
  display: inline-block; font-size: 10px; font-weight: 700;
  padding: 2px 7px; border-radius: 5px;
  flex-shrink: 0; margin-top: 1px;
}

.tag-notice { background: #1E2A3E; color: #FFFFFF; }
.tag-free   { background: #EDF2F7; color: #4A5568; }

.board-content { display: flex; flex-direction: column; gap: 2px; }

.board-title { font-size: 13px; font-weight: 500; color: #111827; }
.board-meta  { font-size: 11px; color: #687282; }

.board-right {
  display: flex; align-items: center;
  gap: 8px; flex-shrink: 0; margin-left: 12px;
}

.board-comments {
  display: flex; align-items: center; gap: 3px;
  font-size: 18px; color: #C08B2D; font-weight: 600;
}

.board-comments svg { width: 13px; height: 13px; }

.board-date { font-size: 11px; color: #92959D; }
</style>