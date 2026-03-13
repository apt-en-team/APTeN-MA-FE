<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import vehicleAPI from '@/api/vehicle.js'

import StatsCards from '@/components/admin/StatsCards.vue'
import FilterBar  from '@/components/admin/FilterBar.vue'
import AdminTable from '@/components/admin/AdminTable.vue'
import Pagination from '@/components/admin/Pagination.vue'

const state = reactive({
  list: [],
  householdOptions: [],

  // 필터
  searchQuery:     '',
  filterStatus:    '',
  filterHousehold: '',
  filterType:      '',

  // 페이지네이션
  size:          10,
  currentPage:   1,
  maxPage:       0,
  totalFiltered: 0,
})

const stats = ref({ total: 0, pending: 0, approved: 0, rejected: 0 })
const selectedIds = ref([])
const selectAll   = ref(false)

// ── 테이블 컬럼 ──
const columns = [
  { label: '',        key: 'checkbox' },
  { label: 'ID',      key: 'id' },
  { label: '차량번호', key: 'plateNumber' },
  { label: '차종',     key: 'type' },
  { label: '소속 세대', key: 'household' },
  { label: '등록자',   key: 'registrant' },
  { label: '승인 상태', key: 'status' },
  { label: '등록일',   key: 'registeredAt' },
]

// ── 통계 카드 데이터 ──
const statsCards = computed(() => [
  { label: '전체 등록 차량', value: stats.value.total,    unit: '대', desc: '승인 완료 기준' },
  { label: '승인 대기',      value: stats.value.pending,  unit: '대', desc: '즉시 처리 필요', descClass: 'urgent' },
  { label: '승인 완료',      value: stats.value.approved, unit: '대', desc: '정상 등록' },
  { label: '거부',           value: stats.value.rejected, unit: '대', desc: '재신청 가능' },
])

// ── 유틸 ──
const statusLabel = (s) => ({ APPROVED: '승인', PENDING: '대기', REJECTED: '거부' }[s] ?? s)
const statusClass = (s) => ({ APPROVED: 'approved', PENDING: 'pending', REJECTED: 'rejected' }[s] ?? '')

const toggleSelectAll = () => {
  selectedIds.value = selectAll.value ? state.list.map(v => v.id) : []
}

// ── API 호출 ──
const fetchVehicles = async () => {
  try {
    const params = {
      page: state.currentPage - 1,
      size: state.size,
      ...(state.searchQuery     && { search:    state.searchQuery }),
      ...(state.filterStatus    && { status:    state.filterStatus }),
      ...(state.filterHousehold && { household: state.filterHousehold }),
      ...(state.filterType      && { type:      state.filterType }),
    }
const fetchVehicles = async () => {
  try {
    const { data } = await vehicleAPI.getAllVehicles()
    state.list          = data.resultData        // ← .resultData
    state.totalFiltered = data.resultData.length
    state.maxPage       = Math.max(1, Math.ceil(data.resultData.length / state.size))
  } catch (e) {
    console.error('차량 목록 조회 실패', e)
  }
}
}

const fetchStats = async () => {
  try {
    const { data } = await vehicleAPI.getVehicleStats()
    stats.value = data.resultData 
  } catch (e) {
    console.error('통계 조회 실패', e)
  }
}

const handleApprove = async (id) => {
  try {
    await vehicleAPI.approveVehicle(id)
    await Promise.all([fetchVehicles(), fetchStats()])
  } catch (e) {
    console.error('승인 실패', e)
  }
}

const handleReject = async (id) => {
  try {
    await vehicleAPI.rejectVehicle(id)
    await Promise.all([fetchVehicles(), fetchStats()])
  } catch (e) {
    console.error('거부 실패', e)
  }
}

const doSearch = () => { state.currentPage = 1; fetchVehicles() }
const resetFilters = () => {
  state.searchQuery     = ''
  state.filterStatus    = ''
  state.filterHousehold = ''
  state.filterType      = ''
  doSearch()
}
const goToPage = (page) => { state.currentPage = page; fetchVehicles() }

let searchTimer = null
const onSearch = () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => doSearch(), 300)
}

onMounted(() => { fetchVehicles(); fetchStats() })
</script>

<template>
  <div class="vehicle-list-view">

    <!-- 통계 카드 -->
    <StatsCards :stats="statsCards" />

    <div class="table-section">

      <!-- 필터 -->
      <FilterBar @reset="resetFilters">
        <div class="search-wrap">
          <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            v-model="state.searchQuery"
            class="search-input"
            placeholder="차량번호, 차종, 세대 검색"
            @input="onSearch"
          />
        </div>
        <select v-model="state.filterStatus" class="filter-select" @change="doSearch">
          <option value="">승인 상태</option>
          <option value="APPROVED">승인</option>
          <option value="PENDING">대기</option>
          <option value="REJECTED">거부</option>
        </select>
        <select v-model="state.filterHousehold" class="filter-select" @change="doSearch">
          <option value="">세대 선택</option>
          <option v-for="h in state.householdOptions" :key="h.value" :value="h.value">{{ h.label }}</option>
        </select>
        <select v-model="state.filterType" class="filter-select" @change="doSearch">
          <option value="">차종</option>
          <option value="sedan">승용차</option>
          <option value="suv">SUV</option>
          <option value="van">승합차</option>
        </select>
      </FilterBar>

      <!-- 테이블 -->
      <AdminTable :columns="columns" :rows="state.list">

        <!-- 체크박스 -->
        <template #cell-checkbox="{ row }">
          <input type="checkbox" :value="row.id" v-model="selectedIds" />
        </template>

        <!-- ID -->
        <template #cell-id="{ row }">
          <span class="td-id">#{{ row.id }}</span>
        </template>

        <!-- 차량번호 -->
        <template #cell-plateNumber="{ row }">
          <span class="td-plate">{{ row.plateNumber }}</span>
        </template>

        <!-- 승인 상태 배지 -->
        <template #cell-status="{ row }">
          <span class="status-badge" :class="statusClass(row.status)">
            {{ statusLabel(row.status) }}
          </span>
        </template>

        <!-- 관리 버튼 -->
        <template #action="{ row }">
          <div class="action-buttons" v-if="row.status === 'PENDING'">
            <button class="btn-approve" @click.stop="handleApprove(row.id)">승인</button>
            <button class="btn-reject"  @click.stop="handleReject(row.id)">거부</button>
          </div>
          <span v-else class="col-empty">-</span>
        </template>

      </AdminTable>

      <!-- 페이지네이션 -->
      <Pagination
        :currentPage="state.currentPage"
        :maxPage="state.maxPage"
        :totalFiltered="state.totalFiltered"
        unit="대"
        @change="goToPage"
      />

    </div>
  </div>
</template>

<style scoped>
* { box-sizing: border-box; margin: 0; padding: 0; }

.vehicle-list-view { padding-left: 32px; padding-right: 32px; display: flex; flex-direction: column; gap: 20px; font-family: 'Noto Sans KR', sans-serif; color: #333; }

.table-section { background: #fff; border-radius: 10px; border: 1px solid #E2E8F0; overflow: hidden; }

/* 필터 내부 요소 */
.search-wrap { display: flex; align-items: center; border: 1px solid #E2E8F0; border-radius: 7px; padding: 7px 12px; gap: 6px; background: #F5F6F8; }
.search-icon { color: #A0AEC0; flex-shrink: 0; }
.search-input { border: none; background: transparent; font-size: 13px; outline: none; color: #333; width: 150px; font-family: 'Noto Sans KR', sans-serif; }
.search-input::placeholder { color: #CBD5E0; }
.filter-select { border: 1px solid #E2E8F0; border-radius: 7px; padding: 7px 28px 7px 12px; font-size: 13px; color: #333; background: #fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23A0AEC0' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat right 10px center; appearance: none; cursor: pointer; outline: none; font-family: 'Noto Sans KR', sans-serif; }

/* 배지/버튼 */
.status-badge          { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
.status-badge.approved { background: #EBF5EE; color: #4D8B5A; }
.status-badge.pending  { background: #FEF9C3; color: #ca8a04; }
.status-badge.rejected { background: #FEE2E2; color: #E53E3E; }
.td-id    { color: #A0AEC0; font-size: 12px; }
.td-plate { font-weight: 600; }
.col-empty { color: #CBD5E0; }
.action-buttons { display: flex; gap: 6px; }
.btn-approve { padding: 4px 14px; background: #EBF5EE; color: #4D8B5A; border: 1px solid #C6E6CC; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: 'Noto Sans KR', sans-serif; }
.btn-approve:hover { background: #d4edda; }
.btn-reject  { padding: 4px 14px; background: #FEE2E2; color: #E53E3E; border: 1px solid #FECACA; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: 'Noto Sans KR', sans-serif; }
.btn-reject:hover { background: #fecaca; }
</style>