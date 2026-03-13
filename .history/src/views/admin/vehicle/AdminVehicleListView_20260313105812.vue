<script setup>
import { ref, computed, onMounted } from 'vue'


// ── 상태 변수 ──────────────────────────────────────
const vehicles        = ref([])
const loading         = ref(false)
const searchQuery     = ref('')
const filterStatus    = ref('')
const filterHousehold = ref('')
const filterType      = ref('')
const currentPage     = ref(1)
const pageSize        = ref(9)
const totalCount      = ref(0)
const selectedIds     = ref([])
const selectAll       = ref(false)
const householdOptions = ref([])
const stats = ref({ total: 0, pending: 0, approved: 0, rejected: 0 })

// ── 계산된 값 ──────────────────────────────────────
const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize.value)))

const pageNumbers = computed(() => {
  const pages = []
  const total = totalPages.value
  const cur   = currentPage.value
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    pages.push(1)
    if (cur > 3) pages.push('...')
    for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) pages.push(i)
    if (cur < total - 2) pages.push('...')
    pages.push(total)
  }
  return pages
})

// ── API 호출 ───────────────────────────────────────
const fetchVehicles = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value - 1,
      size: pageSize.value,
      ...(searchQuery.value     && { search:    searchQuery.value }),
      ...(filterStatus.value    && { status:    filterStatus.value }),
      ...(filterHousehold.value && { household: filterHousehold.value }),
      ...(filterType.value      && { type:      filterType.value }),
    }
    const { data } = await getVehicleList(params)
    vehicles.value   = data.content
    totalCount.value = data.totalElements
  } catch (e) {
    console.error('차량 목록 조회 실패', e)
  } finally {
    loading.value = false
  }
}

const fetchStats = async () => {
  try {
    const { data } = await getVehicleStats()
    stats.value = data
  } catch (e) {
    console.error('통계 조회 실패', e)
  }
}

const handleApprove = async (id) => {
  try {
    await apiApprove(id)
    await Promise.all([fetchVehicles(), fetchStats()])
  } catch (e) {
    console.error('승인 실패', e)
  }
}

const handleReject = async (id) => {
  try {
    await apiReject(id)
    await Promise.all([fetchVehicles(), fetchStats()])
  } catch (e) {
    console.error('거부 실패', e)
  }
}

// ── 유틸 함수 ──────────────────────────────────────
const statusLabel = (s) => ({ APPROVED: '승인', PENDING: '대기', REJECTED: '거부' }[s] ?? s)
const statusClass = (s) => ({ APPROVED: 'approved', PENDING: 'pending', REJECTED: 'rejected' }[s] ?? '')

const resetFilters = () => {
  searchQuery.value     = ''
  filterStatus.value    = ''
  filterHousehold.value = ''
  filterType.value      = ''
  currentPage.value     = 1
  fetchVehicles()
}

const goPage = (page) => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
  fetchVehicles()
}

const toggleSelectAll = () => {
  selectedIds.value = selectAll.value ? vehicles.value.map(v => v.id) : []
}

const onFilterChange = () => {
  currentPage.value = 1
  fetchVehicles()
}

let searchTimer = null
const onSearch = () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    currentPage.value = 1
    fetchVehicles()
  }, 300)
}

onMounted(() => {
  fetchVehicles()
  fetchStats()
})
</script>


<template>
  <div class="vehicle-list-view">

    <!-- ── 통계 카드 4개 ── -->
    <div class="stats-grid">
      <div class="stat-card">
        <p class="stat-label">전체 등록 차량</p>
        <p class="stat-value">{{ stats.total }}<span class="stat-unit">대</span></p>
        <p class="stat-desc">승인 완료 기준</p>
      </div>
      <div class="stat-card">
        <p class="stat-label">승인 대기</p>
        <p class="stat-value">{{ stats.pending }}<span class="stat-unit">대</span></p>
        <p class="stat-desc urgent">즉시 처리 필요</p>
      </div>
      <div class="stat-card">
        <p class="stat-label">승인 완료</p>
        <p class="stat-value">{{ stats.approved }}<span class="stat-unit">대</span></p>
        <p class="stat-desc">정상 등록</p>
      </div>
      <div class="stat-card">
        <p class="stat-label">거부</p>
        <p class="stat-value">{{ stats.rejected }}<span class="stat-unit">대</span></p>
        <p class="stat-desc">재신청 가능</p>
      </div>
    </div>

    <!-- ── 필터 + 테이블 + 페이지네이션 카드 섹션 ── -->
    <div class="table-section">

      <!-- 필터 바 -->
      <div class="filter-bar">
        <div class="search-wrap">
          <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            v-model="searchQuery"
            class="search-input"
            placeholder="차량번호, 차종, 세대 검색"
            @input="onSearch"
          />
        </div>
        <select v-model="filterStatus" class="filter-select" @change="onFilterChange">
          <option value="">승인 상태</option>
          <option value="APPROVED">승인</option>
          <option value="PENDING">대기</option>
          <option value="REJECTED">거부</option>
        </select>
        <select v-model="filterHousehold" class="filter-select" @change="onFilterChange">
          <option value="">세대 선택</option>
          <option v-for="h in householdOptions" :key="h.value" :value="h.value">{{ h.label }}</option>
        </select>
        <select v-model="filterType" class="filter-select" @change="onFilterChange">
          <option value="">차종</option>
          <option value="sedan">승용차</option>
          <option value="suv">SUV</option>
          <option value="van">승합차</option>
        </select>
        <button class="btn-reset" @click="resetFilters">↺ 초기화</button>
      </div>

      <!-- 차량 목록 테이블 -->
      <div class="table-wrap">
        <table class="vehicle-table">
          <thead>
            <tr>
              <th><input type="checkbox" v-model="selectAll" @change="toggleSelectAll" /></th>
              <th>ID</th>
              <th>차량번호</th>
              <th>차종</th>
              <th>소속 세대</th>
              <th>등록자</th>
              <th>승인 상태</th>
              <th>등록일</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="9" class="empty-row">
                <span class="loading-spinner" />
                불러오는 중...
              </td>
            </tr>
            <tr v-else-if="vehicles.length === 0">
              <td colspan="9" class="empty-row">차량 데이터가 없습니다.</td>
            </tr>
            <template v-else>
              <tr
                v-for="vehicle in vehicles"
                :key="vehicle.id"
                :class="{ selected: selectedIds.includes(vehicle.id) }"
              >
                <td><input type="checkbox" :value="vehicle.id" v-model="selectedIds" /></td>
                <td class="td-id">#{{ vehicle.id }}</td>
                <td class="td-plate">{{ vehicle.plateNumber }}</td>
                <td>{{ vehicle.type }}</td>
                <td>{{ vehicle.household }}</td>
                <td>{{ vehicle.registrant }}</td>
                <td>
                  <span class="status-badge" :class="statusClass(vehicle.status)">
                    {{ statusLabel(vehicle.status) }}
                  </span>
                </td>
                <td>{{ vehicle.registeredAt }}</td>
                <td>
                  <div class="action-buttons" v-if="vehicle.status === 'PENDING'">
                    <button class="btn-approve" @click="handleApprove(vehicle.id)">승인</button>
                    <button class="btn-reject"  @click="handleReject(vehicle.id)">거부</button>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <!-- 페이지네이션 -->
      <div class="table-bottom">
        <p class="table-footer">총 {{ totalCount }}대 · 페이지당 {{ pageSize }}개</p>
        <div class="pagination">
          <button class="page-btn" :disabled="currentPage === 1" @click="goPage(currentPage - 1)">‹</button>
          <template v-for="page in pageNumbers" :key="page">
            <span v-if="page === '...'" class="page-ellipsis">···</span>
            <button
              v-else
              class="page-btn"
              :class="{ active: page === currentPage }"
              @click="goPage(page)"
            >{{ page }}</button>
          </template>
          <button class="page-btn" :disabled="currentPage === totalPages" @click="goPage(currentPage + 1)">›</button>
        </div>
        <div class="pagination-spacer"></div>
      </div>

    </div><!-- /table-section -->

  </div>
</template>


<style scoped>
* { box-sizing: border-box; margin: 0; padding: 0; }

.vehicle-list-view { padding-left: 32px; padding-right: 32px; display: flex; flex-direction: column; gap: 20px; font-family: 'Noto Sans KR', sans-serif; color: #333; }

.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
.stat-card { height: 139px; background: #fff; border-radius: 10px; padding: 22px 24px; border: 1px solid #E2E8F0; display: flex; flex-direction: column; justify-content: space-between; }
.stat-label { font-size: 12px; color: #718096; font-weight: 500; }
.stat-value { font-size: 32px; font-weight: 700; color: #1A202C; line-height: 1; }
.stat-unit  { font-size: 14px; font-weight: 400; color: #A0AEC0; }
.stat-desc  { font-size: 12px; color: #A0AEC0; }
.stat-desc.urgent { color: #C08B2D; font-weight: 600; }

.table-section { background: #fff; border-radius: 10px; border: 1px solid #E2E8F0; overflow: hidden; }

.filter-bar { display: flex; align-items: center; gap: 8px; padding: 14px 20px; border-bottom: 1px solid #E2E8F0; flex-wrap: wrap; }
.search-wrap { display: flex; align-items: center; border: 1px solid #E2E8F0; border-radius: 7px; padding: 7px 12px; gap: 6px; background: #F5F6F8; }
.search-icon { color: #A0AEC0; flex-shrink: 0; }
.search-input { border: none; background: transparent; font-size: 13px; outline: none; color: #333; width: 150px; font-family: 'Noto Sans KR', sans-serif; }
.search-input::placeholder { color: #CBD5E0; }
.filter-select { border: 1px solid #E2E8F0; border-radius: 7px; padding: 7px 28px 7px 12px; font-size: 13px; color: #333; background: #fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23A0AEC0' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat right 10px center; appearance: none; cursor: pointer; outline: none; font-family: 'Noto Sans KR', sans-serif; }
.btn-reset { display: flex; align-items: center; gap: 5px; padding: 7px 12px; border: 1px solid #E2E8F0; border-radius: 7px; background: #fff; font-size: 12px; color: #718096; cursor: pointer; font-family: 'Noto Sans KR', sans-serif; }
.btn-reset:hover { background: #F5F6F8; }

.vehicle-table { width: 100%; border-collapse: collapse; }
.vehicle-table th { padding: 11px 16px; text-align: left; font-size: 12px; font-weight: 600; color: #718096; background: #F5F6F8; border-bottom: 1px solid #E2E8F0; white-space: nowrap; }
.vehicle-table td { padding: 13px 16px; font-size: 13px; color: #333; border-bottom: 1px solid #E2E8F0; }
.vehicle-table tbody tr:last-child td { border-bottom: none; }
.vehicle-table tbody tr:hover td { background: #F5F6F8; cursor: pointer; }
.vehicle-table tbody tr.selected td { background: #EFF6FF; }
.td-id    { color: #A0AEC0; font-size: 12px; }
.td-plate { font-weight: 600; }
.empty-row { text-align: center; color: #A0AEC0; font-size: 13px; padding: 48px 0 !important; }
.loading-spinner { display: inline-block; width: 14px; height: 14px; border: 2px solid #e2e8f0; border-top-color: #64748b; border-radius: 50%; animation: spin 0.7s linear infinite; margin-right: 6px; vertical-align: middle; }
@keyframes spin { to { transform: rotate(360deg); } }

.status-badge          { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
.status-badge.approved { background: #EBF5EE; color: #4D8B5A; }
.status-badge.pending  { background: #FEF9C3; color: #ca8a04; }
.status-badge.rejected { background: #FEE2E2; color: #E53E3E; }

.action-buttons { display: flex; gap: 6px; }
.btn-approve { padding: 4px 14px; background: #EBF5EE; color: #4D8B5A; border: 1px solid #C6E6CC; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: 'Noto Sans KR', sans-serif; }
.btn-approve:hover { background: #d4edda; }
.btn-reject  { padding: 4px 14px; background: #FEE2E2; color: #E53E3E; border: 1px solid #FECACA; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: 'Noto Sans KR', sans-serif; }
.btn-reject:hover { background: #fecaca; }

.table-bottom { display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; border-top: 1px solid #E2E8F0; }
.table-footer { flex: 1; font-size: 12px; color: #A0AEC0; }
.pagination-spacer { flex: 1; }
.pagination { display: flex; align-items: center; justify-content: center; gap: 4px; }
.page-btn { width: 30px; height: 30px; border: 1px solid #E2E8F0; border-radius: 6px; background: #fff; font-size: 12px; color: #718096; cursor: pointer; display: flex; align-items: center; justify-content: center; font-family: 'Noto Sans KR', sans-serif; transition: all 0.15s; }
.page-btn:hover:not(:disabled) { background: #F5F6F8; }
.page-btn.active { background: #2B3A55; color: #fff; border-color: #2B3A55; font-weight: 700; }
.page-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.page-ellipsis { color: #A0AEC0; font-size: 13px; padding: 0 2px; }
</style>