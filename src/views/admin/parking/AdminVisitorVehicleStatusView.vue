<script setup>
import {reactive, computed, onMounted} from 'vue'
import {getAdminVisitorVehicles, getAdminVisitorVehicleStats} from '@/api/visitorVehicle.js'

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

/*
 * 날짜 문자열 반환 (YYYY-MM-DD)
 * - toISOString() 대신 로컬 시간 기준으로 직접 계산 (UTC 오차 방지)
 * @param offset 오늘 기준 날짜 오프셋 (0: 오늘, 1: 내일)
 */
const getDateString = (offset = 0) => {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/*
 * 테이블 행 데이터 가공
 * - dong + ho를 합쳐 '세대' 컬럼으로 표시
 * - 둘 중 하나라도 없으면 '-' 표시
 */
const tableRows = computed(() =>
    state.list.map(item => ({
      ...item,
      unit: item.dong && item.ho ? `${item.dong} ${item.ho}` : '-',
    }))
)

// 상태 배지 CSS 클래스 반환 (현재 미사용, parking_log 연동 후 활성화)
const statusClass = (status) => {
  if (status === 'APPROVED') return 'status-success'
  if (status === 'CANCELLED') return 'status-danger'
  return 'status-gray'
}

// 상태 한글 변환 (현재 미사용, parking_log 연동 후 활성화)
const statusLabel = (status) => {
  if (status === 'APPROVED') return '승인'
  if (status === 'CANCELLED') return '취소'
  return status
}

/*
 * 통계 카드 데이터 조회 (API-070)
 * - 오늘/내일/이번 달/전체 건수를 한 번에 조회
 */
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

/*
 * 방문차량 목록 조회 (API-069)
 * - 활성 탭에 따라 visitDate 파라미터 자동 설정
 *   - today: 오늘 날짜
 *   - tomorrow: 내일 날짜
 *   - all: 날짜 필터 없음 (전체 조회)
 */
const fetchList = async () => {
  try {
    const params = {
      page: state.currentPage,
      size: state.size,
    }

    // 탭에 따른 날짜 필터 적용
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

/* 탭 전환: 탭 변경 시 페이지/필터 초기화 후 목록 재조회 */
const switchTab = (tabKey) => {
  state.activeTab = tabKey
  state.currentPage = 1
  state.licensePlate = ''
  fetchList()
}

/* 검색: 페이지 1로 초기화 후 목록 재조회 */
const doSearch = () => {
  state.currentPage = 1
  fetchList()
}

/* 필터 초기화: 차량번호 검색어 초기화 후 재조회 */
const resetFilters = () => {
  state.licensePlate = ''
  doSearch()
}

/* 페이지 이동 */
const goToPage = (page) => {
  state.currentPage = page
  fetchList()
}

// 마운트 시 통계 + 목록 동시 조회
onMounted(() => {
  fetchStats()
  fetchList()
})
</script>

<template>
  <div class="visitor-vehicle-page">

    <!-- 통계 카드 4개 (API-070) -->
    <div class="stat-cards">

      <!-- 오늘 방문 예정 건수 -->
      <div class="stat-card">
        <p class="stat-label">오늘 방문 예정</p>
        <p class="stat-value">
          {{ state.stats.todayCount }}<span class="stat-unit">대</span>
        </p>
        <p class="stat-sub">{{ getDateString(0) }} 기준</p>
      </div>

      <!-- 내일 방문 예정 건수 -->
      <div class="stat-card">
        <p class="stat-label">내일 방문 예정</p>
        <p class="stat-value">
          {{ state.stats.tomorrowCount }}<span class="stat-unit">대</span>
        </p>
        <p class="stat-sub">{{ getDateString(1) }} 기준</p>
      </div>

      <!-- 이번 달 방문 누적 건수 -->
      <div class="stat-card">
        <p class="stat-label">이번 달 방문</p>
        <p class="stat-value">
          {{ state.stats.monthCount }}<span class="stat-unit">건</span>
        </p>
        <p class="stat-sub">월간 누적</p>
      </div>

      <!-- 전체 등록 누적 건수 -->
      <div class="stat-card">
        <p class="stat-label">전체 등록 건수</p>
        <p class="stat-value">
          {{ state.stats.totalCount }}<span class="stat-unit">건</span>
        </p>
        <p class="stat-sub">전체 누적</p>
      </div>

    </div>

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
          <!-- 오늘/내일 탭에만 건수 뱃지 표시 -->
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
          - isEntered: true → 입차완료 (초록), false → 미입차 (회색)
        -->
        <!-- <template #cell-isEntered="{ row }">
          <span :class="['status-badge', row.isEntered ? 'status-success' : 'status-gray']">
            {{ row.isEntered ? '입차완료' : '미입차' }}
          </span>
        </template> -->
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
  gap: 20px;
}

/* 통계 카드 */
.stat-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-card {
  background: #fff;
  border: 1px solid #E2E8F0;
  border-radius: 10px;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 13px;
  color: #718096;
  font-weight: 500;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1A202C;
  line-height: 1.2;
  margin-top: 6px;
}

.stat-unit {
  font-size: 14px;
  font-weight: 500;
  color: #718096;
  margin-left: 3px;
}

.stat-sub {
  font-size: 12px;
  color: #A0AEC0;
  margin-top: 2px;
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

/* 탭 건수 뱃지: 기본 회색, 활성 탭은 초록 */
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

/* 상태 배지 (parking_log 연동 후 사용)*/
.status-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
}

/* 입차완료 */
.status-success {
  background: #EBF5EE;
  color: #4D8B5A;
}

/* 미입차 */
.status-gray {
  background: #EDF2F7;
  color: #718096;
}
</style>