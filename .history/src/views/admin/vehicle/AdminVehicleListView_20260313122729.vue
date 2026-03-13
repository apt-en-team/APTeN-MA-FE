<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import vehicleAPI from '@/api/vehicle.js'

import StatsCards from '@/components/admin/StatsCards.vue'
import FilterBar  from '@/components/admin/FilterBar.vue'
import AdminTable from '@/components/admin/AdminTable.vue'
import Pagination from '@/components/admin/Pagination.vue'
import BaseModal from '@/components/common/BeseModel.vue'

const state = reactive({
  list: [],
  householdOptions: [],
  searchQuery:     '',
  filterStatus:    '',
  filterHousehold: '',
  filterType:      '',
  size:          10,
  currentPage:   1,
  maxPage:       0,
  totalFiltered: 0,
})

const stats = ref({ total: 0, pending: 0, approved: 0, rejected: 0 })
const selectedIds = ref([])
const selectAll   = ref(false)

// ── 모달 상태 ──
const confirmModal = reactive({
  show:   false,
  type:   '',      // 'approve' | 'reject'
  vehicle: null,
  loading: false,
})

const columns = [
  { label: '',         key: 'checkbox' },
  { label: 'ID',       key: 'vehicleId' },
  { label: '차량번호',  key: 'licensePlate' },
  { label: '차종',      key: 'carModel' },
  { label: '승인 상태', key: 'status' },
  { label: '등록일',    key: 'createdAt' },
]

const statsCards = computed(() => [
  { label: '전체 등록 차량', value: stats.value.total,    unit: '대', desc: '승인 완료 기준' },
  { label: '승인 대기',      value: stats.value.pending,  unit: '대', desc: '즉시 처리 필요', descClass: 'urgent' },
  { label: '승인 완료',      value: stats.value.approved, unit: '대', desc: '정상 등록' },
  { label: '거부',           value: stats.value.rejected, unit: '대', desc: '재신청 가능' },
])

const statusLabel = (s) => ({ APPROVED: '승인', PENDING: '대기', REJECTED: '거부' }[s] ?? s)
const statusClass = (s) => ({ APPROVED: 'approved', PENDING: 'pending', REJECTED: 'rejected' }[s] ?? '')

const toggleSelectAll = () => {
  selectedIds.value = selectAll.value ? state.list.map(v => v.vehicleId) : []
}

// ── API 호출 ──
const fetchVehicles = async () => {
  try {
    const { data } = await vehicleAPI.getAllVehicles()
    state.list          = data.resultData
    state.totalFiltered = data.resultData.length
    state.maxPage       = Math.max(1, Math.ceil(data.resultData.length / state.size))
  } catch (e) {
    console.error('차량 목록 조회 실패', e)
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

// ── 모달 열기 ──
const openConfirmModal = (type, vehicle) => {
  confirmModal.type    = type
  confirmModal.vehicle = vehicle
  confirmModal.loading = false
  confirmModal.show    = true
}

const closeConfirmModal = () => {
  confirmModal.show    = false
  confirmModal.vehicle = null
  confirmModal.loading = false
}

// ── 승인/거부 처리 ──
const handleConfirm = async () => {
  confirmModal.loading = true
  try {
    if (confirmModal.type === 'approve') {
      await vehicleAPI.approveVehicle(confirmModal.vehicle.vehicleId)
    } else {
      await vehicleAPI.rejectVehicle(confirmModal.vehicle.vehicleId)
    }
    closeConfirmModal()
    await Promise.all([fetchVehicles(), fetchStats()])
  } catch (e) {
    console.error('처리 실패', e)
  } finally {
    confirmModal.loading = false
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

    <StatsCards :stats="statsCards" />

    <div class="table-section">

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

      <AdminTable :columns="columns" :rows="state.list">

        <template #cell-checkbox="{ row }">
          <input type="checkbox" :value="row.vehicleId" v-model="selectedIds" />
        </template>

        <template #cell-vehicleId="{ row }">
          <span class="td-id">#{{ row.vehicleId }}</span>
        </template>

        <template #cell-licensePlate="{ row }">
          <span class="td-plate">{{ row.licensePlate }}</span>
        </template>

        <template #cell-status="{ row }">
          <span class="status-badge" :class="statusClass(row.status)">
            {{ statusLabel(row.status) }}
          </span>
        </template>

        <template #action="{ row }">
          <div class="action-buttons" v-if="row.status === 'PENDING'">
            <button class="btn-approve" @click.stop="openConfirmModal('approve', row)">승인</button>
            <button class="btn-reject"  @click.stop="openConfirmModal('reject', row)">거부</button>
          </div>
          <span v-else class="col-empty">-</span>
        </template>

      </AdminTable>

      <Pagination
        :currentPage="state.currentPage"
        :maxPage="state.maxPage"
        :totalFiltered="state.totalFiltered"
        unit="대"
        @change="goToPage"
      />

    </div>

    <!-- 승인/거부 확인 모달 -->
    <BaseModal
      v-if="confirmModal.show"
      :title="confirmModal.type === 'approve' ? '차량 승인' : '차량 거부'"
      :subtitle="confirmModal.vehicle?.licensePlate + ' · ' + confirmModal.vehicle?.carModel"
      @close="closeConfirmModal"
    >
      <p class="confirm-message">
        <strong>{{ confirmModal.vehicle?.licensePlate }}</strong> 차량을<br>
        {{ confirmModal.type === 'approve' ? '승인' : '거부' }} 하시겠습니까?
      </p>

      <template #footer>
        <button class="btn-cancel" @click="closeConfirmModal">취소</button>
        <button
          :class="confirmModal.type === 'approve' ? 'btn-submit-approve' : 'btn-submit-reject'"
          @click="handleConfirm"
          :disabled="confirmModal.loading"
        >
          {{ confirmModal.loading ? '처리 중...' : confirmModal.type === 'approve' ? '승인' : '거부' }}
        </button>
      </template>
    </BaseModal>

  </div>
</template>

<style scoped>
* { box-sizing: border-box; margin: 0; padding: 0; }

.vehicle-list-view { padding-left: 32px; padding-right: 32px; display: flex; flex-direction: column; gap: 20px; font-family: 'Noto Sans KR', sans-serif; color: #333; }
.table-section { background: #fff; border-radius: 10px; border: 1px solid #E2E8F0; overflow: hidden; }

.search-wrap { display: flex; align-items: center; border: 1px solid #E2E8F0; border-radius: 7px; padding: 7px 12px; gap: 6px; background: #F5F6F8; }
.search-icon { color: #A0AEC0; flex-shrink: 0; }
.search-input { border: none; background: transparent; font-size: 13px; outline: none; color: #333; width: 150px; font-family: 'Noto Sans KR', sans-serif; }
.search-input::placeholder { color: #CBD5E0; }
.filter-select { border: 1px solid #E2E8F0; border-radius: 7px; padding: 7px 28px 7px 12px; font-size: 13px; color: #333; background: #fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23A0AEC0' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat right 10px center; appearance: none; cursor: pointer; outline: none; font-family: 'Noto Sans KR', sans-serif; }

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
.btn-reject:hover  { background: #fecaca; }

/* 모달 내부 */
.confirm-message { font-size: 15px; font-weight: 500; text-align: center; padding: 12px 0; color: #1A202C; line-height: 1.8; }
.btn-cancel { padding: 9px 20px; border: 1px solid #E2E8F0; border-radius: 7px; background: #fff; font-size: 13px; color: #718096; cursor: pointer; font-family: 'Noto Sans KR', sans-serif; }
.btn-cancel:hover { background: #F5F6F8; }
.btn-submit-approve { padding: 9px 24px; background: #4D8B5A; color: #fff; border: none; border-radius: 7px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'Noto Sans KR', sans-serif; }
.btn-submit-approve:hover:not(:disabled) { background: #3d7049; }
.btn-submit-reject  { padding: 9px 24px; background: #E53E3E; color: #fff; border: none; border-radius: 7px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'Noto Sans KR', sans-serif; }
.btn-submit-reject:hover:not(:disabled)  { background: #c53030; }
.btn-submit-approve:disabled,
.btn-submit-reject:disabled { opacity: 0.5; cursor: default; }
</style>