<script setup>
import { computed, onMounted, reactive } from 'vue'
import vehicleAPI from '@/api/vehicle.js'
import { useVehicleStore } from '@/stores/modules/vehicle.js'

import StatsCards from '@/components/admin/StatsCards.vue'
import FilterBar  from '@/components/admin/FilterBar.vue'
import AdminTable from '@/components/admin/AdminTable.vue'
import Pagination from '@/components/admin/Pagination.vue'
import BaseModal  from '@/components/common/BeseModel.vue'

const vehicleStore = useVehicleStore()

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

const selectedIds = reactive([])

// ── 모달 상태 ──
const detailModal  = reactive({ show: false, vehicle: null })
const approveModal = reactive({ show: false, vehicle: null, loading: false })
const rejectModal  = reactive({ show: false, vehicle: null, loading: false, reason: '', memo: '' })

const rejectReasons = ['중복 차량', '세대 한도 초과', '정보 불일치', '직접 입력']

// ── 테이블 컬럼 ──
const columns = [
  { label: '',         key: 'checkbox' },
  { label: 'ID',       key: 'vehicleId' },
  { label: '차량번호',  key: 'licensePlate' },
  { label: '차종',      key: 'carModel' },
  { label: '승인 상태', key: 'status' },
  { label: '등록일',    key: 'createdAt' },
]

// ── 통계 카드 ──
const statsCards = computed(() => [
  { label: '전체 등록 차량', value: vehicleStore.total,    unit: '대', desc: '승인 완료 기준' },
  { label: '승인 대기',      value: vehicleStore.pending,  unit: '대', desc: '즉시 처리 필요', descClass: 'urgent' },
  { label: '승인 완료',      value: vehicleStore.approved, unit: '대', desc: '정상 등록' },
  { label: '거부',           value: vehicleStore.rejected, unit: '대', desc: '재신청 가능' },
])

// ── 유틸 ──
const statusLabel = (s) => ({ APPROVED: '승인', PENDING: '대기', REJECTED: '거부' }[s] ?? s)
const statusClass = (s) => ({ APPROVED: 'approved', PENDING: 'pending', REJECTED: 'rejected' }[s] ?? '')


// ── API ──
const fetchVehicles = async () => {
  try {
    const { data } = await vehicleAPI.getAllVehicles({
      search: state.searchQuery || null,
      status: state.filterStatus || null,
      page:   state.currentPage - 1,  // 백엔드 0-based
      size:   state.size,
    })
    state.list          = data.resultData.content
    state.totalFiltered = data.resultData.totalElements
    state.maxPage       = data.resultData.totalPages
  } catch (e) { console.error('차량 목록 조회 실패', e) }
}

const fetchStats = () => vehicleStore.fetchStats()

// ── 상세 모달 ──
const openDetailModal  = (vehicle) => { detailModal.vehicle = vehicle; detailModal.show = true }
const closeDetailModal = () => { detailModal.show = false; detailModal.vehicle = null }

// ── 승인 모달 ──
const openApproveModal  = (vehicle) => { approveModal.vehicle = vehicle; approveModal.loading = false; approveModal.show = true }
const closeApproveModal = () => { approveModal.show = false; approveModal.vehicle = null }

const handleApprove = async () => {
  approveModal.loading = true
  try {
    await vehicleAPI.approveVehicle(approveModal.vehicle.vehicleId)
    closeApproveModal()
    await Promise.all([fetchVehicles(), fetchStats()])
  } catch (e) { console.error('승인 실패', e) }
  finally { approveModal.loading = false }
}

// ── 거부 모달 ──
const openRejectModal = (vehicle) => {
  rejectModal.vehicle = vehicle
  rejectModal.loading = false
  rejectModal.reason  = ''
  rejectModal.memo    = ''
  rejectModal.show    = true
}
const closeRejectModal = () => { rejectModal.show = false; rejectModal.vehicle = null }

const handleReject = async () => {
  rejectModal.loading = true
  try {
    await vehicleAPI.rejectVehicle(rejectModal.vehicle.vehicleId)
    closeRejectModal()
    await Promise.all([fetchVehicles(), fetchStats()])
  } catch (e) { console.error('거부 실패', e) }
  finally { rejectModal.loading = false }
}

// ── 검색/필터/페이지 ──
const doSearch = () => { state.currentPage = 1; fetchVehicles() }

const goToPage = (page) => { state.currentPage = page; fetchVehicles() }
const resetFilters = () => {
  state.searchQuery = ''; state.filterStatus = ''
  state.filterHousehold = ''; state.filterType = ''
  doSearch()
}

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
          <input v-model="state.searchQuery" class="search-input" placeholder="차량번호, 차종, 세대 검색" @input="onSearch" />
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
          <option value="compact">경차</option>          
          <option value="sedan">승용차</option>
          <option value="suv">SUV</option>
          <option value="van">승합차</option>
        </select>
      </FilterBar>

      <AdminTable :columns="columns" :rows="state.list">

        <template #cell-checkbox="{ row }">
          <input type="checkbox" :value="row.vehicleId" v-model="selectedIds" @click.stop />
        </template>

        <!-- 클릭 시 상세 모달 — 각 셀에 클릭 이벤트 -->
        <template #cell-vehicleId="{ row }">
          <span class="td-id td-clickable" @click="openDetailModal(row)">#{{ row.vehicleId }}</span>
        </template>

        <template #cell-licensePlate="{ row }">
          <span class="td-plate td-clickable" @click="openDetailModal(row)">{{ row.licensePlate }}</span>
        </template>

        <template #cell-carModel="{ row }">
          <span class="td-clickable" @click="openDetailModal(row)">{{ row.carModel ?? '-' }}</span>
        </template>

        <template #cell-status="{ row }">
          <span class="status-badge td-clickable" :class="statusClass(row.status)" @click="openDetailModal(row)">
            {{ statusLabel(row.status) }}
          </span>
        </template>

        <template #cell-createdAt="{ row }">
          <span class="td-clickable" @click="openDetailModal(row)">{{ row.createdAt ?? '-' }}</span>
        </template>

        <!-- 승인/거부 버튼만 action에 — 가운데 정렬 -->
        <template #action="{ row }">
          <div class="action-buttons">
            <template v-if="row.status === 'PENDING'">
              <button class="btn-approve" @click.stop="openApproveModal(row)">승인</button>
              <button class="btn-reject"  @click.stop="openRejectModal(row)">거부</button>
            </template>
          </div>
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

    <!-- ── 상세 모달 ── -->
    <BaseModal
      v-if="detailModal.show"
      title="차량 상세 정보"
      :subtitle="'ID #' + detailModal.vehicle?.vehicleId"
      @close="closeDetailModal"
    >
      <div class="detail-hero">
        <span :class="['detail-status-badge', statusClass(detailModal.vehicle?.status)]">
          {{ statusLabel(detailModal.vehicle?.status) }}
        </span>
        <h2 class="detail-title">{{ detailModal.vehicle?.licensePlate }}</h2>
        <p class="detail-sub">{{ detailModal.vehicle?.carModel ?? '-' }} · 차량 정보</p>
      </div>
      <div class="detail-divider"></div>
      <div class="detail-grid">
        <div class="detail-cell">
          <span class="detail-cell-label">차량 ID</span>
          <span class="detail-cell-value">#{{ detailModal.vehicle?.vehicleId }}</span>
        </div>
        <div class="detail-cell">
          <span class="detail-cell-label">차량번호</span>
          <span class="detail-cell-value">{{ detailModal.vehicle?.licensePlate }}</span>
        </div>
        <div class="detail-cell">
          <span class="detail-cell-label">차종</span>
          <span class="detail-cell-value">{{ detailModal.vehicle?.carModel ?? '-' }}</span>
        </div>
        <div class="detail-cell">
          <span class="detail-cell-label">등록일</span>
          <span class="detail-cell-value">{{ detailModal.vehicle?.createdAt ?? '-' }}</span>
        </div>
        <div class="detail-cell">
          <span class="detail-cell-label">승인 상태</span>
          <span :class="['detail-status-badge', statusClass(detailModal.vehicle?.status)]">
            {{ statusLabel(detailModal.vehicle?.status) }}
          </span>
        </div>
        <div class="detail-cell">
          <span class="detail-cell-label">승인/거부일</span>
          <span class="detail-cell-value">{{ detailModal.vehicle?.approvedAt ?? '-' }}</span>
        </div>
      </div>
      <template #footer>
        <button class="btn-cancel" @click="closeDetailModal">닫기</button>
      </template>
    </BaseModal>

    <!-- ── 승인 모달 ── -->
    <BaseModal
      v-if="approveModal.show"
      title="차량을 승인하시겠습니까?"
      @close="closeApproveModal"
    >
      <div class="confirm-vehicle-card">
        <div class="confirm-vehicle-info">
          <span class="confirm-plate">{{ approveModal.vehicle?.licensePlate }}</span>
          <span class="status-badge pending">대기</span>
        </div>
        <p class="confirm-vehicle-sub">{{ approveModal.vehicle?.carModel ?? '-' }}</p>
      </div>
      <p class="confirm-hint">승인 시 해당 세대에 알림이 발송됩니다.</p>
      <template #footer>
        <button class="btn-cancel" @click="closeApproveModal">취소</button>
        <button class="btn-submit-approve" @click="handleApprove" :disabled="approveModal.loading">
          {{ approveModal.loading ? '처리 중...' : '승인' }}
        </button>
      </template>
    </BaseModal>

    <!-- ── 거부 모달 ── -->
    <BaseModal
      v-if="rejectModal.show"
      title="차량 거부"
      :subtitle="'ID ' + rejectModal.vehicle?.vehicleId"
      @close="closeRejectModal"
    >
      <div class="confirm-vehicle-card">
        <div class="confirm-vehicle-info">
          <span class="confirm-plate">{{ rejectModal.vehicle?.licensePlate }}</span>
          <span class="status-badge pending">대기</span>
        </div>
        <p class="confirm-vehicle-sub">{{ rejectModal.vehicle?.carModel ?? '-' }}</p>
      </div>
      <div class="form-group">
        <label class="form-label">거부 사유 <span class="required">*</span></label>
        <select class="form-select" v-model="rejectModal.reason">
          <option value="">사유 선택</option>
          <option v-for="r in rejectReasons" :key="r" :value="r">{{ r }}</option>
        </select>
      </div>
      <div class="reason-chips">
        <button
          v-for="r in rejectReasons"
          :key="r"
          :class="['reason-chip', { active: rejectModal.reason === r }]"
          @click="rejectModal.reason = r"
        >{{ r }}</button>
      </div>
      <div class="form-group">
        <label class="form-label">상세 내용 (선택)</label>
        <textarea
          class="form-textarea"
          v-model="rejectModal.memo"
          placeholder="거부 사유를 상세히 입력해주세요."
          rows="3"
        />
      </div>
      <template #footer>
        <button class="btn-cancel" @click="closeRejectModal">취소</button>
        <button
          class="btn-submit-reject"
          @click="handleReject"
          :disabled="rejectModal.loading || !rejectModal.reason"
        >
          {{ rejectModal.loading ? '처리 중...' : '거부 확인' }}
        </button>
      </template>
    </BaseModal>

  </div>
</template>

<style scoped>
* { box-sizing: border-box; margin: 0; padding: 0; }

.vehicle-list-view {  display: flex; flex-direction: column; font-family: 'Noto Sans KR', sans-serif; color: #333; }
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

/* 행 클릭 커서 */
.td-clickable { cursor: pointer; }
.td-clickable:hover { opacity: 0.7; }

.action-buttons { display: flex; gap: 6px; align-items: center; justify-content: center; }
.btn-approve { padding: 4px 14px; background: #EBF5EE; color: #4D8B5A; border: 1px solid #C6E6CC; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: 'Noto Sans KR', sans-serif; }
.btn-approve:hover { background: #d4edda; }
.btn-reject  { padding: 4px 14px; background: #FEE2E2; color: #E53E3E; border: 1px solid #FECACA; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: 'Noto Sans KR', sans-serif; }
.btn-reject:hover  { background: #fecaca; }

/* 모달 공통 */
.detail-hero { margin-bottom: 14px; }
.detail-status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 8px; }
.detail-status-badge.approved { background: #EBF5EE; color: #4D8B5A; }
.detail-status-badge.pending  { background: #FEF9C3; color: #ca8a04; }
.detail-status-badge.rejected { background: #FEE2E2; color: #E53E3E; }
.detail-title  { font-size: 26px; font-weight: 700; color: #1A202C; margin-bottom: 2px; margin-top: 8px; }
.detail-sub    { font-size: 13px; color: #A0AEC0; }
.detail-divider { height: 1px; background: #E2E8F0; margin: 14px 0; }
.detail-grid   { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.detail-cell   { display: flex; flex-direction: column; gap: 4px; }
.detail-cell-label { font-size: 12px; color: #A0AEC0; }
.detail-cell-value { font-size: 14px; font-weight: 600; color: #1A202C; }

/* 승인/거부 모달 카드 */
.confirm-vehicle-card { background: #F5F6F8; border-radius: 8px; padding: 14px 16px; margin-bottom: 16px; }
.confirm-vehicle-info { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
.confirm-plate { font-size: 15px; font-weight: 700; color: #1A202C; }
.confirm-vehicle-sub { font-size: 12px; color: #718096; }
.confirm-hint  { font-size: 12px; color: #A0AEC0; text-align: center; margin-top: 8px; }

/* 거부 모달 폼 */
.form-group  { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
.form-label  { font-size: 13px; font-weight: 600; color: #4A5568; }
.required    { color: #E53E3E; }
.form-select { border: 1px solid #E2E8F0; border-radius: 7px; padding: 9px 32px 9px 12px; font-size: 13px; color: #333; background: #fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23A0AEC0' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat right 12px center; appearance: none; outline: none; width: 100%; font-family: 'Noto Sans KR', sans-serif; }
.reason-chips { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
.reason-chip  { padding: 6px 14px; border: 1px solid #E2E8F0; border-radius: 20px; font-size: 12px; color: #718096; background: #fff; cursor: pointer; font-family: 'Noto Sans KR', sans-serif; transition: all 0.15s; }
.reason-chip.active { background: #2B3A55; color: #fff; border-color: #2B3A55; }
.reason-chip:hover:not(.active) { background: #F5F6F8; }
.form-textarea { border: 1px solid #E2E8F0; border-radius: 7px; padding: 10px 14px; font-size: 13px; color: #333; outline: none; resize: none; width: 100%; font-family: 'Noto Sans KR', sans-serif; }
.form-textarea:focus { border-color: #2B3A55; }

/* 버튼 */
.btn-cancel { padding: 9px 20px; border: 1px solid #E2E8F0; border-radius: 7px; background: #fff; font-size: 13px; color: #718096; cursor: pointer; font-family: 'Noto Sans KR', sans-serif; }
.btn-cancel:hover { background: #F5F6F8; }
.btn-submit-approve { padding: 9px 24px; background: #2B3A55; color: #fff; border: none; border-radius: 7px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'Noto Sans KR', sans-serif; }
.btn-submit-approve:hover:not(:disabled) { background: #1E2A3E; }
.btn-submit-reject { padding: 9px 24px; background: #E53E3E; color: #fff; border: none; border-radius: 7px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'Noto Sans KR', sans-serif; }
.btn-submit-reject:hover:not(:disabled) { background: #c53030; }
.btn-submit-approve:disabled,
.btn-submit-reject:disabled { opacity: 0.5; cursor: default; }
</style>