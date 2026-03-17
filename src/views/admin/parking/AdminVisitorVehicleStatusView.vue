<script setup>
import {reactive, computed, onMounted} from 'vue'
import {getAdminVisitorVehicles, getAdminVisitorVehicleStats} from '@/api/visitorVehicle.js'

import StatsCards from '@/components/admin/StatsCards.vue'
import FilterBar from '@/components/layout/FilterBar.vue'
import AdminTable from '@/components/admin/AdminTable.vue'
import Pagination from '@/components/layout/Pagination.vue'

const state = reactive({
  list: [],
  // 통계 카드 데이터 (API-070)
  stats: {
    todayCount: 0,
    tomorrowCount: 0,
    totalCount: 0,
    monthCount: 0,
  },
  // 활성 탭: 'all' | 'today' | 'tomorrow'
  activeTab: 'today',
  // 차량번호 검색 필터
  licensePlate: '',
  // 페이지네이션
  size: 10,
  currentPage: 1,
  totalPages: 0,
  totalCount: 0,
})

// 테이블 컬럼 정의
// TODO: parking_log 연동 후 { label: '입차 여부', key: 'isEntered' } 추가
const columns = [
  {label: '차량번호', key: 'licensePlate'},
  {label: '방문자', key: 'visitorName'},
  {label: '방문목적', key: 'visitPurpose'},
  {label: '방문일', key: 'visitDate'},
  {label: '등록자', key: 'userName'},
  {label: '세대', key: 'unit'},
]

// 탭 목록 정의
const tabs = [
  {key: 'all', label: '전체'},
  {key: 'today', label: '오늘 방문'},
  {key: 'tomorrow', label: '내일 방문'},
]

// 날짜 문자열 반환 (YYYY-MM-DD, 로컬 시간 기준)
const getDateString = (offset = 0) => {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// StatsCards에 넘길 통계 데이터
const statsData = computed(() => [
  {
    label: '오늘 방문 예정',
    value: state.stats.todayCount,
    unit: '대',
    desc: `${getDateString(0)} 기준`,
  },
  {
    label: '내일 방문 예정',
    value: state.stats.tomorrowCount,
    unit: '대',
    desc: `${getDateString(1)} 기준`,
  },
  {
    label: '이번 달 방문',
    value: state.stats.monthCount,
    unit: '건',
    desc: '월간 누적',
  },
  {
    label: '전체 등록 건수',
    value: state.stats.totalCount,
    unit: '건',
    desc: '전체 누적',
  },
])

// dong + ho 합쳐서 세대 컬럼 표시
const tableRows = computed(() =>
    state.list.map(item => ({
      ...item,
      unit: item.dong && item.ho ? `${item.dong} ${item.ho}` : '-',
    }))
)

// 통계 조회 (API-070)
const fetchStats = async () => {
  try {
    const res = await getAdminVisitorVehicleStats()
    const data = res.data
    state.stats.todayCount = data.todayCount ?? 0
    state.stats.tomorrowCount = data.tomorrowCount ?? 0
    state.stats.totalCount = data.totalCount ?? 0
    state.stats.monthCount = data.monthCount ?? 0
  } catch (e) {
    console.error('방문차량 통계 조회 실패', e)
  }
}

// 목록 조회 (API-069)
const fetchList = async () => {
  try {
    const params = {
      page: state.currentPage,
      size: state.size,
    }
    if (state.activeTab === 'today') params.visitDate = getDateString(0)
    if (state.activeTab === 'tomorrow') params.visitDate = getDateString(1)
    if (state.licensePlate) params.licensePlate = state.licensePlate

    const res = await getAdminVisitorVehicles(params)
    const data = res.data

    state.list = data.content
    state.totalPages = data.totalPages
    state.totalCount = data.totalCount
  } catch (e) {
    console.error('관리자 방문차량 조회 실패', e)
  }
}

// 탭 전환
const switchTab = (tabKey) => {
  state.activeTab = tabKey
  state.currentPage = 1
  state.licensePlate = ''
  fetchList()
}

// 검색
const doSearch = () => {
  state.currentPage = 1
  fetchList()
}

// 필터 초기화
const resetFilters = () => {
  state.licensePlate = ''
  doSearch()
}

// 페이지 이동
const goToPage = (page) => {
  state.currentPage = page
  fetchList()
}

onMounted(() => {
  fetchStats()
  fetchList()
})
</script>

<template>
  <div class="visitor-vehicle-page">

    <!-- 통계 카드 (StatsCards 컴포넌트) -->
    <StatsCards :stats="statsData"/>

    <!-- 테이블 섹션 -->
    <div class="table-section">

      <!-- 탭: 전체 / 오늘 방문 / 내일 방문 -->
      <div class="tab-bar">
        <button
            v-for="tab in tabs"
            :key="tab.key"
            :class="['tab-btn', { active: state.activeTab === tab.key }]"
            @click="switchTab(tab.key)"
        >
          {{ tab.label }}
          <span v-if="tab.key === 'today'" class="tab-badge">
            {{ state.stats.todayCount }}
          </span>
          <span v-if="tab.key === 'tomorrow'" class="tab-badge">
            {{ state.stats.tomorrowCount }}
          </span>
        </button>
      </div>

      <!-- 차량번호 검색 필터 -->
      <FilterBar @reset="resetFilters">
        <div class="search-wrap">
          <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
              class="search-input"
              type="text"
              placeholder="차량번호 검색"
              v-model="state.licensePlate"
              @keyup.enter="doSearch"
          />
        </div>
      </FilterBar>

      <!-- 방문차량 목록 테이블 -->
      <AdminTable :columns="columns" :rows="tableRows">
        <!--
          TODO: parking_log 연동 후 주석 해제
          <template #cell-isEntered="{ row }">
            <span :class="['status-badge', row.isEntered ? 'status-success' : 'status-gray']">
              {{ row.isEntered ? '입차완료' : '미입차' }}
            </span>
          </template>
        -->
      </AdminTable>

      <!-- 페이지네이션 -->
      <Pagination
          :currentPage="state.currentPage"
          :maxPage="state.totalPages"
          :totalAll="state.totalCount"
          :totalFiltered="state.totalCount"
          unit="건"
          @change="goToPage"
      />

    </div>
  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.visitor-vehicle-page {
  display: flex;
  flex-direction: column;
}

/* 테이블 섹션 */
.table-section {
  background: #fff;
  border-radius: 10px;
  border: 1px solid #E2E8F0;
  overflow: hidden;
}

/* 탭 */
.tab-bar {
  display: flex;
  gap: 0;
  border-bottom: 1px solid #E2E8F0;
  padding: 0 16px;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 14px 16px;
  font-size: 13px;
  font-weight: 500;
  color: #A0AEC0;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
}

.tab-btn:hover {
  color: #4A5568;
}

.tab-btn.active {
  color: #2D3748;
  font-weight: 700;
  border-bottom-color: #2D3748;
}

.tab-badge {
  background: #EDF2F7;
  color: #718096;
  font-size: 11px;
  font-weight: 600;
  padding: 1px 7px;
  border-radius: 20px;
}

.tab-btn.active .tab-badge {
  background: #EBF5EE;
  color: #4D8B5A;
}

/* 필터 */
.search-wrap {
  display: flex;
  align-items: center;
  border: 1px solid #E2E8F0;
  border-radius: 7px;
  padding: 7px 12px;
  gap: 6px;
  background: #F5F6F8;
}

.search-icon {
  color: #A0AEC0;
  flex-shrink: 0;
}

.search-input {
  border: none;
  background: transparent;
  font-size: 13px;
  outline: none;
  width: 160px;
}

.search-input::placeholder {
  color: #CBD5E0;
}

/* 상태 배지 (parking_log 연동 후 사용) */
.status-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
}

.status-success {
  background: #EBF5EE;
  color: #4D8B5A;
}

.status-gray {
  background: #EDF2F7;
  color: #718096;
}
</style>