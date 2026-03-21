<script setup>
import { reactive, onMounted } from 'vue'
import Pagination from '@/components/layout/Pagination.vue'
import ActionResultModal from '@/components/common/ActionResultModal.vue'
import ResidentReservationList from '@/components/reservation/ResidentReservationList.vue'
import ResidentReservationDetailModal from '@/components/reservation/ResidentReservationDetailModal.vue'
import ResidentReservationCancelModal from '@/components/reservation/ResidentReservationCancelModal.vue'
import reservationAPI from '@/api/reservation'
import { useReservationStore } from '@/stores/modules/reservation.js'

const reservationStore = useReservationStore()

const state = reactive({
  isLoading: false,

  // 목록
  reservationList: [],

  // 탭
  tab: 'UPCOMING', // UPCOMING / PAST

  // 검색
  keyword: '',

  // 페이지
  currentPage: 1,
  size: 4,
  maxPage: 0,
  totalFiltered: 0,
  totalAll: reservationStore.myTotalCount || 0,

  // 모달
  selectedReservation: null,
  detailModalOpen: false,
  cancelModalOpen: false,

  resultModal: {
    show: false,
    title: '',
    subtitle: '',
    desc: '',
    itemName: '',
    time: '',
    actionLabel: '',
    actor: '입주민',
    type: 'success',
  },
})

// ㄴ 결과 모달 시간용
const getNowText = () => {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const hh = String(now.getHours()).padStart(2, '0')
  const mi = String(now.getMinutes()).padStart(2, '0')
  return `${yyyy}.${mm}.${dd} ${hh}:${mi}`
}

//목록 조회
const fetchMyReservations = async () => {
  state.isLoading = true

  try {
    await reservationStore.fetchMyReservationList({
      page: state.currentPage,
      size: state.size,
      tab: state.tab,
      keyword: state.keyword?.trim() || undefined,
    })

    state.reservationList = reservationStore.myReservationList || []
  } catch (error) {
    console.error('내 예약 조회 실패', error)
    state.reservationList = []
  } finally {
    state.isLoading = false
  }
}

//최대 페이지 조회
const getMaxPage = async () => {
  try {
    await reservationStore.fetchMyReservationCount({
      page: state.currentPage,
      size: state.size,
      tab: state.tab,
      keyword: state.keyword?.trim() || undefined,
    })

    state.maxPage = reservationStore.myReservationMaxPage || 0
    state.totalFiltered = reservationStore.myReservationTotalCount || 0

  } catch (error) {
    console.error('최대 페이지 조회 실패:', error)
    state.maxPage = 0
    state.totalFiltered = 0
  }
}

//탭 변경
const changeTab = async (tab) => {
  if (state.tab === tab) return
  state.tab = tab
  state.currentPage = 1
  await fetchMyReservations()
  await getMaxPage()
}

// ㄴ 검색
const handleSearch = async () => {
  state.currentPage = 1
  await fetchMyReservations()
  await getMaxPage()
}

// ㄴ 검색 초기화
const resetSearch = async () => {
  state.keyword = ''
  state.currentPage = 1
  await fetchMyReservations()
  await getMaxPage()
}

// ㄴ 페이지 변경
const handlePageChange = async (page) => {
  if (page < 1 || page > state.maxPage) return
  state.currentPage = page
  await fetchMyReservations()
}

// ㄴ 상세 모달
const handleOpenDetail = (item) => {
  state.selectedReservation = item
  state.detailModalOpen = true
}

const handleCloseDetail = () => {
  state.detailModalOpen = false
}

// ㄴ 취소 모달
const handleOpenCancel = (item) => {
  state.selectedReservation = item
  state.cancelModalOpen = true
}

const handleCloseCancel = () => {
  state.cancelModalOpen = false
}

// ㄴ 예약 취소
const handleConfirmCancel = async () => {
  if (!state.selectedReservation?.reservationId) return

  try {
    await reservationAPI.cancelReservation(state.selectedReservation.reservationId)

    state.cancelModalOpen = false

    state.resultModal.type = 'success'
    state.resultModal.title = '예약 취소가 완료되었습니다'
    state.resultModal.subtitle = state.selectedReservation.facilityName
    state.resultModal.desc = '선택한 예약이 정상적으로 취소되었습니다.'
    state.resultModal.itemName = state.selectedReservation.facilityName
    state.resultModal.time = getNowText()
    state.resultModal.actionLabel = '예약 취소'
    state.resultModal.actor = '입주민'
    state.resultModal.show = true

    await fetchMyReservations()
  } catch (error) {
    console.error('예약 취소 실패', error)

    state.resultModal.type = 'danger'
    state.resultModal.title = '예약 취소에 실패했습니다'
    state.resultModal.subtitle = state.selectedReservation?.facilityName || '예약'
    state.resultModal.desc =
      error.response?.data?.resultMessage || '잠시 후 다시 시도해주세요.'
    state.resultModal.itemName = state.selectedReservation?.facilityName || '예약'
    state.resultModal.time = getNowText()
    state.resultModal.actionLabel = '예약 취소'
    state.resultModal.actor = '입주민'
    state.resultModal.show = true
  }
}

const handleCloseResult = () => {
  state.resultModal.show = false
}

//최초 조회
onMounted(async () => {
  await fetchMyReservations()
  await getMaxPage()
})

</script>

<template>
  <div class="my-reservation-view">
    <!-- 탭 -->
    <div class="tab-bar">
      <div class="tabs">
        <button
          class="tab-btn"
          :class="{ active: state.tab === 'UPCOMING' }"
          @click="changeTab('UPCOMING')"
        >
          이용 예정
        </button>

        <button
          class="tab-btn"
          :class="{ active: state.tab === 'PAST' }"
          @click="changeTab('PAST')"
        >
          지난 예약
        </button>
      </div>
    </div>

    <!-- 검색 -->
    <div class="search-row">
      <div class="search-wrap">
        <svg
          class="search-icon"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="2"
          stroke="currentColor"
          width="16"
          height="16"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>

        <input
          v-model="state.keyword"
          class="search-input"
          type="text"
          placeholder="시설명 검색"
          @keyup.enter="handleSearch"
        />
      </div>

      <button class="search-btn" @click="handleSearch">검색</button>
      <button class="reset-btn" @click="resetSearch">초기화</button>
    </div>

    <!-- 리스트 카드 -->
    <div class="list-card">
      <ResidentReservationList
        :list="state.reservationList"
        :is-loading="state.isLoading"
        @detail="handleOpenDetail"
        @cancel="handleOpenCancel"
      />
    </div>

    <!-- 페이지네이션 -->
    <Pagination
      :current-page="state.currentPage"
      :max-page="state.maxPage"
      :total-all="state.totalAll"
      :total-filtered="state.totalFiltered"
      unit="건"
      active-color="#4973E5"
      @change="handlePageChange"
    />

    <!-- 상세 모달 -->
    <ResidentReservationDetailModal
      v-if="state.detailModalOpen && state.selectedReservation"
      :item="state.selectedReservation"
      @close="handleCloseDetail"
    />

    <!-- 취소 모달 -->
    <ResidentReservationCancelModal
      v-if="state.cancelModalOpen && state.selectedReservation"
      :item="state.selectedReservation"
      @close="handleCloseCancel"
      @confirm="handleConfirmCancel"
    />

    <!-- 결과 모달 -->
    <ActionResultModal
      v-if="state.resultModal.show"
      :title="state.resultModal.title"
      :subtitle="state.resultModal.subtitle"
      :desc="state.resultModal.desc"
      :type="state.resultModal.type"
      :item-name="state.resultModal.itemName"
      :time="state.resultModal.time"
      :action-label="state.resultModal.actionLabel"
      :actor="state.resultModal.actor"
      @close="handleCloseResult"
    />
  </div>
</template>

<style scoped>
.my-reservation-view {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

/* 탭 */
.tab-bar {
  display: flex;
  justify-content: flex-start;
  align-items: center;
}

.tabs {
  display: flex;
  gap: 4px;
  background: #ffffff;
  border-radius: 10px;
  padding: 4px;
}

.tab-btn {
  padding: 8px 20px;
  border: none;
  background: transparent;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.18s;
}

.tab-btn.active {
  background: #4973E5;
  color: #ffffff;
  font-weight: 700;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.08);
}

/* 검색 */
.search-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-wrap {
  width: 320px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: #ffffff;
  border: 1px solid #E2E8F0;
  border-radius: 10px;
}

.search-icon {
  color: #9ca3af;
  flex-shrink: 0;
}

.search-input {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  font-size: 13px;
  color: #333333;
}

.search-input::placeholder {
  color: #bdbdbd;
}

.search-btn,
.reset-btn {
  height: 40px;
  padding: 0 16px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.15s;
}

.search-btn {
  border: none;
  background: #4973E5;
  color: #ffffff;
}

.search-btn:hover {
  background: #3f66d1;
}

.reset-btn {
  border: 1px solid #E2E8F0;
  background: #ffffff;
  color: #687282;
}

.reset-btn:hover {
  background: #F8FAFC;
}

/* 리스트 카드 */
.list-card {
  background: #ffffff;
  border: 1px solid #E2E8F0;
  border-radius: 16px;
  overflow: hidden;
}
</style>