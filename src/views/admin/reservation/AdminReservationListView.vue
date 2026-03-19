<script setup>
import { reactive, computed, onMounted  } from 'vue'
import { useRouter } from 'vue-router'

import StatsCards from '@/components/admin/StatsCards.vue'
import AdminTable from '@/components/admin/AdminTable.vue'
import Pagination from '@/components/layout/Pagination.vue'
import AdminReservationDetailModal from '@/components/reservation/Adminreservationdetailmodal.vue'
import reservationAPI from '@/api/reservation'

const router = useRouter()

// 상태 관리
const state = reactive({
  // 예약 목록
  list: [],

  // 시설 타입 목록 (시설 선택 필터용)
  facilityTypes: [],

  // 필터 값
  userName: '',
  facilityName: '',
  status: '',
  date: '',

  // 페이지네이션
  size: 10,
  currentPage: 1,
  maxPage: 0,
  totalFiltered: 0,

  // 상단 통계 카드
  todayTotal: 0,
  todayConfirmed: 0,
  todayCancelled: 0,
  monthTotal: 0,
  totalCount: 0,

  // GX 대기 건수
  gxPendingCount: 0,
})

// 상세 모달 상태
const detailModal = reactive({
  show: false,
  reservationId: null,
})

// 테이블 컬럼 정의
const columns = [
  { key: 'reservationId', label: 'ID' },
  { key: 'userName', label: '예약자' },
  { key: 'facilityName', label: '시설명' },
  { key: 'reservationDate', label: '예약 날짜' },
  { key: 'time', label: '시간' },
  { key: 'household', label: '세대' },
  { key: 'status', label: '상태' },
  { key: 'createdAt', label: '예약일' },
]

// 통계 카드 데이터
const stats = computed(() => [
  { label: '오늘 전체 예약', value: `${state.todayTotal}건`, desc: '오늘 기준' },
  { label: '진행 중 예약', value: `${state.todayConfirmed}건`, desc: '현재 이용 중' },
  { label: '취소된 예약', value: `${state.todayCancelled}건`, desc: '오늘 기준' },
  { label: '이번 달 누적', value: `${state.totalFiltered}건`, desc: '전체 기준' },
])

// 상태 텍스트 / 뱃지 클래스
const statusLabel = (status) => {
  return {
    CONFIRMED: '확정',
    PENDING: '대기',
    CANCELLED: '취소',
    COMPLETED: '완료',
  }[status] || status
}

const statusClass = (status) => {
  return {
    CONFIRMED: 'badge-confirmed',
    PENDING: 'badge-pending',
    CANCELLED: 'badge-cancelled',
    COMPLETED: 'badge-completed',
  }[status] || ''
}

// API - 시설 목록 조회
const fetchFacilities = async () => {
  try {
    const result = await reservationAPI.getFacilityTypes()
    state.facilityTypes = result.data.resultData || []
  } catch (error) {
    console.error('시설 목록 조회 실패:', error)
  }
}

// API - 오늘 통계 조회
const fetchTodayStats = async () => {
  try {
    const result = await reservationAPI.TodayStats()
    const data = result.data.resultData || {}

    state.todayTotal = data.todayTotal || 0
    state.todayConfirmed = data.todayConfirmed || 0
    state.todayCancelled = data.todayCancelled || 0
    state.monthTotal = data.monthTotal || 0
    state.totalCount = data.totalCount || 0
  } catch (error) {
    console.error('오늘 통계 조회 실패:', error)
  }
}

// API - GX 대기 건수 조회
const fetchGxPendingCount = async () => {
  try {
    const result = await reservationAPI.getGxPendingCount()
    state.gxPendingCount = result.data.resultData?.pendingCount || 0
  } catch (error) {
    console.error('GX 대기 건수 조회 실패:', error)
  }
}

// API - 최대 페이지 수 조회
const getMaxPage = async () => {
  try {
    const result = await reservationAPI.getMaxPage({
      size: state.size,
      userName: state.userName || undefined,
      facilityName: state.facilityName || undefined,
      status: state.status || undefined,
      reservationDate: state.date || undefined,
    })

    const data = result.data.resultData || {}

    state.maxPage = data.maxPage || 1
    state.totalFiltered = data.totalCount || 0
  } catch (error) {
    console.error('최대 페이지 조회 실패:', error)
  }
}

// API - 예약 목록 조회
const fetchReservationList = async () => {
  try {
    const result = await reservationAPI.getAdminReservations({
      page: state.currentPage,
      size: state.size,
      userName: state.userName || undefined,
      facilityName: state.facilityName || undefined,
      status: state.status || undefined,
      reservationDate: state.date || undefined,
    })

    const data = result.data.resultData
    const list = data?.content || data || []

    state.list = list.map((item) => ({
      ...item,
      checked: false,
    }))
  } catch (error) {
    console.error('예약 목록 조회 실패:', error)
  }
}

// 검색 실행
const doSearch = async () => {
  state.currentPage = 1
  await getMaxPage()
  await fetchReservationList()
}

// 필터 초기화
const resetFilters = async () => {
  state.userName = ''
  state.facilityName = ''
  state.status = ''
  state.date = ''

  await doSearch()
}

// 페이지 이동
const goToPage = async (page) => {
  state.currentPage = page
  await fetchReservationList()
}

// 예약 상세 모달 열기/닫기
const openDetailModal = (item) => {
  detailModal.reservationId = item.reservationId
  detailModal.show = true
}

const closeDetailModal = () => {
  detailModal.show = false
  detailModal.reservationId = null
}

// 초기 데이터 로딩
onMounted(async () => {
  await fetchFacilities()
  await fetchGxPendingCount()
  await fetchTodayStats()
  await getMaxPage()
  await fetchReservationList()
})
</script>

<template>
  <div class="reservation-page">
    <!-- 상단 통계 카드 -->
    <StatsCards :stats="stats" />

    <div class="table-section">
      <!-- 필터 영역 -->
      <div class="filter-bar">
        <div class="filter-left">
          <!-- 예약자 이름 검색 -->
          <div class="search-wrap">
            <svg
              class="search-icon"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>

            <input
              v-model="state.userName"
              class="search-input"
              type="text"
              placeholder="예약자 이름 검색"
              @keyup.enter="doSearch"
            />
          </div>

          <!-- 시설 선택 -->
          <select v-model="state.facilityName" class="filter-select" @change="doSearch">
            <option value="">시설 선택</option>
            <option
              v-for="facility in state.facilityTypes"
              :key="facility.typeId || facility.id"
              :value="facility.name"
            >
              {{ facility.name }}
            </option>
          </select>

          <!-- 예약 상태 -->
          <select v-model="state.status" class="filter-select" @change="doSearch">
            <option value="">예약 상태</option>
            <option value="CONFIRMED">확정</option>
            <option value="PENDING">대기</option>
            <option value="CANCELLED">취소</option>
            <option value="COMPLETED">완료</option>
          </select>

          <!-- 날짜 선택 -->
          <input v-model="state.date" class="filter-date" type="date" @change="doSearch" />

          <!-- 초기화 버튼 -->
          <button class="btn-reset" @click="resetFilters">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            초기화
          </button>
        </div>
      </div>

      <!-- 예약 테이블 -->
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
          <span :class="['status-badge', statusClass(value)]">
            {{ statusLabel(value) }}
          </span>
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
      @cancelled="
        async () => {
          closeDetailModal()
          await doSearch()
          await fetchTodayStats()
        }
      "
    />
  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

.reservation-page {
  display: flex;
  flex-direction: column;
  color: #1f2937;
}

.table-section {
  background: #ffffff;
  border: 1px solid #e9eef5;
  border-radius: 16px;
  overflow: hidden;
}

.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid #edf2f7;
  background: #ffffff;
}

.filter-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  flex: 1;
}

.filter-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.search-wrap {
  position: relative;
  width: 190px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
}

.search-input,
.filter-select,
.filter-date {
  height: 40px;
  border: 1px solid #dbe3ef;
  border-radius: 10px;
  background: #ffffff;
  color: #334155;
  font-size: 14px;
  outline: none;
}

.search-input {
  width: 100%;
  padding: 0 12px 0 34px;
}

.filter-select {
  min-width: 120px;
  padding: 0 12px;
}

.filter-date {
  min-width: 150px;
  padding: 0 12px;
}

.btn-reset,
.btn-facility {
  height: 40px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s ease;
}

.btn-reset {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 14px;
  border: 1px solid #dbe3ef;
  background: #ffffff;
  color: #334155;
}

.btn-reset:hover {
  background: #f8fafc;
}

.btn-facility {
  padding: 0 18px;
  border: none;
  background: #2B3A55;
  color: #ffffff;
}

.btn-facility:hover {
  background: #1E2A3E;
}

.cell-id {
  color: #64748b;
  font-weight: 600;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
}

.badge-confirmed {
  background: #e6f4ea;
  color: #2e7d32;
}

.badge-pending {
  background: #fff3e0;
  color: #e65100;
}

.badge-cancelled {
  background: #fce4ec;
  color: #c62828;
}

.badge-completed {
  background: #e8eaf6;
  color: #3949ab;
}
</style>