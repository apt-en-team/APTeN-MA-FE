<script setup>
import {reactive, computed, onMounted} from 'vue'
import {getAdminVisitorVehicles, getAdminVisitorVehicleStats} from '@/api/visitorVehicle.js'

import StatsCards from '@/components/admin/StatsCards.vue'
import FilterBar from '@/components/layout/FilterBar.vue'
import AdminTable from '@/components/admin/AdminTable.vue'
import Pagination from '@/components/layout/Pagination.vue'

const state = reactive({
  list: [],
  stats: {
    todayCount: 0,
    tomorrowCount: 0,
    totalCount: 0,
    monthCount: 0,
  },
  activeTab: 'all',
  licensePlate: '',
  size: 10,
  currentPage: 1,
  totalPages: 0,
  totalCount: 0,
})

// isEntered 컬럼 추가 (parking_log 연동 완료)
const columns = [
  {label: '차량번호', key: 'licensePlate'},
  {label: '방문자', key: 'visitorName'},
  {label: '방문목적', key: 'visitPurpose'},
  {label: '방문일', key: 'visitDate'},
  {label: '등록자', key: 'userName'},
  {label: '세대', key: 'unit'},
  {label: '입차 여부', key: 'isEntered'},
  {label: '상태', key: 'statusLabel'},
]

const tabs = [
  {key: 'all', label: '전체'},
  {key: 'today', label: '오늘 방문'},
  {key: 'tomorrow', label: '내일 방문'},
]

const getDateString = (offset = 0) => {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const statsData = computed(() => [
  {label: '오늘 방문 예정', value: state.stats.todayCount, unit: '대', desc: `${getDateString(0)} 기준`},
  {label: '내일 방문 예정', value: state.stats.tomorrowCount, unit: '대', desc: `${getDateString(1)} 기준`},
  {label: '이번 달 방문', value: state.stats.monthCount, unit: '건', desc: '월간 누적'},
  {label: '전체 등록 건수', value: state.stats.totalCount, unit: '건', desc: '전체 누적'},
])

const tableRows = computed(() =>
    state.list.map(item => ({
      ...item,
      unit: item.dong && item.ho ? `${item.dong} ${item.ho}` : '-',
      statusLabel: item.isDeleted === 1 ? '삭제됨'
          : item.status === 'CANCELLED' ? '취소됨'
              : '승인',
      statusType: item.isDeleted === 1 ? 'deleted'
          : item.status === 'CANCELLED' ? 'cancelled'
              : 'approved',
    }))
)

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

const fetchList = async () => {
  try {
    const params = {page: state.currentPage, size: state.size}
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

const switchTab = (tabKey) => {
  state.activeTab = tabKey
  state.currentPage = 1
  state.licensePlate = ''
  fetchList()
}

const doSearch = () => {
  state.currentPage = 1
  fetchList()
}

const resetFilters = () => {
  state.licensePlate = ''
  doSearch()
}

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

    <StatsCards :stats="statsData"/>

    <div class="table-section">

      <div class="tab-bar">
        <button
            v-for="tab in tabs"
            :key="tab.key"
            :class="['tab-btn', { active: state.activeTab === tab.key }]"
            @click="switchTab(tab.key)"
        >
          {{ tab.label }}
          <span v-if="tab.key === 'today'" class="tab-badge">{{ state.stats.todayCount }}</span>
          <span v-if="tab.key === 'tomorrow'" class="tab-badge">{{ state.stats.tomorrowCount }}</span>
        </button>
      </div>

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

      <AdminTable :columns="columns" :rows="tableRows">

        <!-- 입차 여부 배지: parking_log 연동으로 실시간 반영 -->
        <template #cell-isEntered="{ row }">
        <span :class="['status-badge', row.entered ? 'status-approved' : 'status-grey']">
          {{ row.entered ? '입차완료' : '미입차' }}
        </span>
        </template>

        <!-- 상태 배지 -->
        <template #cell-statusLabel="{ row }">
          <span :class="['status-badge', `status-${row.statusType}`]">
            {{ row.statusLabel }}
          </span>
        </template>

      </AdminTable>

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

.table-section {
  background: #fff;
  border-radius: 10px;
  border: 1px solid #E2E8F0;
  overflow: hidden;
}

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
  background: #C6F6D5;
  color: #276749;
}

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

.status-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
}

.status-approved {
  background: #C6F6D5;
  color: #276749;
}

.status-grey {
  background: #EDF2F7;
  color: #718096;
}

.status-cancelled {
  background: #EDF2F7;
  color: #718096;
}

.status-deleted {
  background: #FEE2E2;
  color: #E53E3E;
}
</style>