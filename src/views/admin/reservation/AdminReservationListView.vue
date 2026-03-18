<script setup>
import { reactive, computed, onMounted  } from 'vue'
import { useRouter } from 'vue-router'

import StatsCards from '@/components/admin/StatsCards.vue'
import AdminTable from '@/components/admin/AdminTable.vue'
import Pagination from '@/components/admin/Pagination.vue'
import AdminReservationDetailModal from '@/components/reservation/Adminreservationdetailmodal.vue'
import AdminFacilityListModal      from '@/components/reservation/Adminfacilitylistmodal.vue'
import reservationAPI from '@/api/reservation'

const router = useRouter()
 
// ── 상태 ─────────────────────────────────────────────────────
const state = reactive({
  // 목록
  list:            [],
  facilityTypes:     [],
 
  // 필터
  userName:   '',
  facilityName: '',
  status:     '',
  date:       '',
 
  // 페이지네이션
  size:          10,
  currentPage:   1,
  maxPage:       0,
  totalFiltered: 0,
 
  // 통계 (별도 조회)
  todayTotal:     0,
  todayConfirmed: 0,
  todayCancelled: 0,
  monthTotal:     0,
  totalCount:     0,
 
  // GX 승인 대기 건수
  gxPendingCount: 0,
})
 
// ── 모달 ─────────────────────────────────────────────────────
const detailModal   = reactive({ show: false, reservationId: null })
const facilityModal = reactive({ show: false })
 
// ── 테이블 컬럼 ───────────────────────────────────────────────
const columns = [
  { key: 'reservationId',   label: 'ID'       },
  { key: 'userName',        label: '예약자'    },
  { key: 'facilityName',    label: '시설명'    },
  { key: 'reservationDate', label: '예약 날짜' },
  { key: 'time',            label: '시간'      },
  { key: 'household',       label: '세대'      },
  { key: 'status',          label: '상태'      },
  { key: 'createdAt',       label: '예약일'    },
]
 
// ── 통계 카드 ─────────────────────────────────────────────────
const stats = computed(() => [
  { label: '오늘 전체 예약', value: state.todayTotal     + '건', desc: '오늘 기준'    },
  { label: '진행 중 예약',   value: state.todayConfirmed + '건', desc: '현재 이용 중' },
  { label: '취소된 예약',    value: state.todayCancelled + '건', desc: '오늘 기준'    },
  { label: '이번 달 누적',   value: state.totalFiltered  + '건', desc: '전체 기준'    },
])
 
// ── computed ──────────────────────────────────────────────────
const statusLabel = (s) => ({ CONFIRMED:'확정', PENDING:'대기', CANCELLED:'취소', COMPLETED:'완료' }[s] || s)
const statusClass = (s) => ({ CONFIRMED:'badge-confirmed', PENDING:'badge-pending', CANCELLED:'badge-cancelled', COMPLETED:'badge-completed' }[s] || '')
 
// ── API ───────────────────────────────────────────────────────
const fetchFacilities = async () => {
  try {
    const result = await reservationAPI.getFacilities()
    state.facilityTypes = result.data.resultData || []
  } catch (e) { console.error('시설 목록 조회 실패', e) }
}
 
// 오늘 날짜 통계 (별도 조회 - 페이지네이션과 무관)
const fetchTodayStats = async () => {
  try {
    const result = await reservationAPI.TodayStats()
    state.todayTotal = result.data.resultData.todayTotal
    state.todayConfirmed = result.data.resultData.todayConfirmed
    state.todayCancelled = result.data.resultData.todayCancelled
    state.monthTotal = result.data.resultData.monthTotal
    state.totalCount = result.data.resultData.totalCount
  } catch (e) { console.error('오늘 통계 조회 실패', e) }
}
 
const fetchGxPendingCount = async () => {
  try {
    const result = await reservationAPI.getGxPendingCount()
    state.gxPendingCount = result.data.resultData.pendingCount
    console.log('GX 대기 건수:', state.gxPendingCount)
  } catch (e) { console.error('GX 대기 건수 조회 실패', e) }
}

const getMaxPage = async () => {
  try {
    const result = await reservationAPI.getMaxPage({
      size: state.size,
      userName: state.userName || undefined,
      facilityName: state.facilityName || undefined,
      status: state.status || undefined,
      reservationDate: state.date || undefined
    })
    const d = result.data.resultData
    state.maxPage       = d.maxPage
    state.totalFiltered = d.totalCount
  } catch (e) { console.error('maxPage 조회 실패', e) }
}

const goToList = async () => {
  try {
    const result = await reservationAPI.getAdminReservations({
      page: state.currentPage,
      size: state.size,
      userName: state.userName || undefined,
      facilityName: state.facilityName || undefined,
      status: state.status || undefined,
      reservationDate: state.date || undefined
    })

    const data = result.data.resultData
    const list = data.content || data

    state.list = list.map(h => ({ ...h, checked: false }))
  } catch (e) {
    console.error('세대 목록 조회 실패', e)
  }
}
 
const doSearch = () => { state.currentPage = 1; getMaxPage(); goToList() }
const resetFilters = () => {
  state.userName   = ''
  state.facilityName = ''
  state.status     = ''
  state.date       = ''
  doSearch()
}
const goToPage = (page) => { state.currentPage = page; goToList() }
 
// ── 모달 ─────────────────────────────────────────────────────
const openDetailModal  = (item) => { detailModal.reservationId = item.reservationId; detailModal.show = true }
const closeDetailModal = () => { detailModal.show = false; detailModal.reservationId = null }
const openFacilityModal  = () => { facilityModal.show = true }
const closeFacilityModal = () => { facilityModal.show = false }

 
onMounted(() => {
  fetchFacilities()
  fetchGxPendingCount()
  fetchTodayStats()
  getMaxPage()
  goToList()
})
</script>
 
<template>
  <div class="reservation-page">
    <!-- 통계 카드 -->
    <StatsCards :stats="stats" />
 
    <div class="table-section">
 
      <!-- 필터 -->
      <div class="filter-bar">
        <div class="filter-left" style="flex: 1;">
          <!-- 필터 요소들 왼쪽 그룹 -->
            <div class="filter-group">
              <div class="search-wrap">
                <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  class="search-input" type="text"
                  placeholder="예약자 이름 검색"
                  v-model="state.userName"
                  @keyup.enter="doSearch"
                />
              </div>
              <select class="filter-select" v-model="state.facilityName" @change="doSearch">
                <option value="">시설 선택</option>
                <option v-for="f in state.facilityTypes" :key="f.typeId" :value="f.name">{{ f.name }}</option>
              </select>
              <select class="filter-select" v-model="state.status" @change="doSearch">
                <option value="">예약 상태</option>
                <option value="CONFIRMED">확정</option>
                <option value="PENDING">대기</option>
                <option value="CANCELLED">취소</option>
                <option value="COMPLETED">완료</option>
              </select>
              <input class="filter-date" type="date" v-model="state.date" @change="doSearch" />
            <button class="btn-reset" @click="resetFilters">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
              </svg>
              초기화
            </button>
            </div>
          <!-- 시설별 현황 버튼 오른쪽 고정 -->
           <span class="filter-spacer"></span>
          <button class="btn-facility" @click="openFacilityModal">시설별 현황 →</button>
        </div>
      </div>
 
      <!-- 테이블 -->
      <AdminTable :columns="columns" :rows="state.list" @row-click="openDetailModal">
        <template #cell-reservationId="{ value }">
          <span class="cell-id">{{ value }}</span>
        </template>
        <template #cell-time="{ row }">
          {{ row.startTime }} ~ {{ row.endTime }}
        </template>
        <template #cell-household="{ row }">
          {{ row.dong }} {{ row.ho }}
        </template>
        <template #cell-status="{ value }">
          <span :class="['status-badge', statusClass(value)]">{{ statusLabel(value) }}</span>
        </template>
        <template #cell-createdAt="{ value }">
          {{ value?.slice(0, 10) }}
        </template>
      </AdminTable>
 
      <!-- 페이지네이션 -->
      <Pagination
        :currentPage="state.currentPage"
        :maxPage="state.maxPage"
        :totalAll="state.totalCount"
        :totalFiltered="state.totalFiltered"
        @change="goToPage"
      />
 
    </div>
 
    <!-- 예약 상세 모달 -->
    <AdminReservationDetailModal
      v-if="detailModal.show"
      :reservation-id="detailModal.reservationId"
      @close="closeDetailModal"
      @cancelled="() => { closeDetailModal(); doSearch(); fetchTodayStats() }"
    />
 
    <!-- 시설 리스트 모달 -->
    <AdminFacilityListModal
      v-if="facilityModal.show"
      :facilities="state.facilityTypes"
      @close="closeFacilityModal"
    />
 
  </div>
</template>
 
<style scoped>
* { box-sizing: border-box; margin: 0; padding: 0; }
.reservation-page { display: flex; flex-direction: column; font-family: 'Noto Sans KR', sans-serif; color: #333; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.page-title  { font-size: 22px; font-weight: 700; color: #1A202C; }
.gx-pending-badge {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 16px; border-radius: 20px;
  background: #FFF7E6; border: 1px solid #F6D98A;
  color: #C08B2D; font-size: 13px; font-weight: 600;
  cursor: pointer; font-family: 'Noto Sans KR', sans-serif;
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255, 152, 0, 0.3); }
  50%       { box-shadow: 0 0 0 6px rgba(255, 152, 0, 0); }
}
.table-section { background: #fff; border-radius: 10px; border: 1px solid #E2E8F0; overflow: hidden; }
 
/* 필터 레이아웃 - 왼쪽 그룹과 오른쪽 버튼 분리 */
.filter-group {
  display: flex; align-items: center; gap: 8px; flex: 1;
}
.search-wrap  {
  display: flex; align-items: center;
  border: 1px solid #E2E8F0; border-radius: 7px;
  padding: 7px 12px; gap: 6px; background: #F5F6F8;
}
.search-icon  { color: #A0AEC0; flex-shrink: 0; }
.search-input {
  border: none; background: transparent;
  font-size: 13px; outline: none; color: #333;
  width: 150px; font-family: 'Noto Sans KR', sans-serif;
}
.search-input::placeholder { color: #CBD5E0; }
.filter-select {
  border: 1px solid #E2E8F0; border-radius: 7px;
  padding: 7px 28px 7px 12px; font-size: 13px; color: #333;
  background: #fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23A0AEC0' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat right 10px center;
  appearance: none; cursor: pointer; outline: none;
  font-family: 'Noto Sans KR', sans-serif;
}
.filter-date  {
  border: 1px solid #E2E8F0; border-radius: 7px;
  padding: 7px 12px; font-size: 13px; color: #333;
  outline: none; font-family: 'Noto Sans KR', sans-serif; cursor: pointer;
}
.btn-facility {
  padding: 7px 16px; background: #2B3A55; color: #fff;
  border: none; border-radius: 7px; font-size: 13px;
  font-weight: 600; cursor: pointer; white-space: nowrap;
  font-family: 'Noto Sans KR', sans-serif; flex-shrink: 0;
}
.btn-facility:hover { background: #1E2A3E; }
 
.status-badge   { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }

.badge-confirmed { background: #e6f4ea; color: #2e7d32; }
.badge-pending   { background: #fff3e0; color: #e65100; }
.badge-cancelled { background: #fce4ec; color: #c62828; }
.badge-completed { background: #EDF2F7; color: #718096; }
.badge-approved  { background: #e3f2fd; color: #1565c0; }
.badge-rejected  { background: #fce4ec; color: #c62828; }
.badge-waiting   { background: #f3e5f5; color: #6a1b9a; }

.filter-bar   { display: flex; align-items: center; padding: 14px 20px; border-bottom: 1px solid #E2E8F0; }
.filter-left  { display: flex; align-items: center; gap: 8px; flex: 1; }
.filter-spacer { flex: 1; }
.btn-reset    { display: flex; align-items: center; gap: 5px; padding: 7px 12px; border: 1px solid #E2E8F0; border-radius: 7px; background: #fff; font-size: 12px; color: #718096; cursor: pointer; font-family: 'Noto Sans KR', sans-serif; }
.btn-reset:hover { background: #F5F6F8; }
</style>