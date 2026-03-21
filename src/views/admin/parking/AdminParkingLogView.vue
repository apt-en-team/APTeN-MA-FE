<script setup>
import {reactive, computed, onMounted, inject} from 'vue'
import {getParkingLogStats, getParkingLogs, createParkingLog} from '@/api/parking.js'

import StatsCards from '@/components/admin/StatsCards.vue'
import FilterBar from '@/components/layout/FilterBar.vue'
import AdminTable from '@/components/admin/AdminTable.vue'
import Pagination from '@/components/layout/Pagination.vue'
import Model from '@/components/Modal.vue'

// ── 상태 ──────────────────────────────────────────────────────
const state = reactive({
  list: [], // 입출차 기록 목록

  // 상단 통계 카드 데이터 (오늘 입출차, 미등록, 이번달 전체)
  stats: {
    todayIn: 0,
    todayOut: 0,
    unregistered: 0,
    monthTotal: 0,
  },

  // 검색 필터
  licensePlate: '',
  entryType: '',
  vehicleType: '',
  startDate: '',
  endDate: '',

  // 페이지네이션
  size: 10,
  currentPage: 1,
  totalPages: 0,
  totalCount: 0,

  // 등록 모달
  showRegisterModal: false,
  form: {
    licensePlate: '',
    entryType: 'IN',
    loggedAt: '',
    note: '',
  },
  result: null,       // 등록 후 API 응답 결과
  submitting: false,  // 등록 요청 중 여부
  submitError: '',    // 등록 실패 에러 메시지

  // 성공 모달
  showSuccessModal: false,
  successResult: null, // 등록 성공 결과 데이터

  // 상세 모달
  showDetailModal: false,
  selectedRow: null, // 클릭한 행 데이터
})

// ── 등록 모달 기록 시각 기본값 (YYYY-MM-DD HH:mm) ─────────────
const getNow = () => {
  const d = new Date()
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// ── 테이블 컬럼 정의 ──────────────────────────────────────────
const columns = [
  {label: 'ID', key: 'logId'},
  {label: '차량번호', key: 'licensePlate'},
  {label: '입/출차', key: 'entryType'},
  {label: '차량 유형', key: 'vehicleType'},
  {label: '기록 시각', key: 'loggedAt'},
  {label: '비고', key: 'vehicleInfo'},
]

// ── 상단 통계 카드 데이터 ─────────────────────────────────────
const statsData = computed(() => [
  {label: '오늘 입차', value: state.stats.todayIn, unit: '건', desc: '오늘 기준'},
  {label: '오늘 출차', value: state.stats.todayOut, unit: '건', desc: '오늘 기준'},
  {
    label: '미등록 차량',
    value: state.stats.unregistered,
    unit: '건',
    desc: state.stats.unregistered > 0 ? '즉시 확인 필요' : '정상',
    descClass: state.stats.unregistered > 0 ? 'warning' : '',
  },
  {label: '이번 달 전체', value: state.stats.monthTotal, unit: '건', desc: '월간 누적'},
])

// ── API 조회 ──────────────────────────────────────────────────

// 입출차 통계 조회 (GET /parking/logs/stats)
// 오늘 입차/출차, 미등록 건수, 이번달 전체 건수
const fetchStats = async () => {
  try {
    const res = await getParkingLogStats()
    const data = res.data?.resultData ?? res.data
    state.stats.todayIn = data.todayIn ?? 0
    state.stats.todayOut = data.todayOut ?? 0
    state.stats.unregistered = data.unregistered ?? 0
    state.stats.monthTotal = data.monthTotal ?? 0
  } catch (e) {
    console.error('입출차 통계 조회 실패', e)
  }
}

// 입출차 기록 목록 조회 (GET /parking/logs)
// 차량번호, 입출차 구분, 차량 유형, 날짜 범위 필터 + 페이지네이션
const fetchList = async () => {
  try {
    const params = {page: state.currentPage, size: state.size}
    if (state.licensePlate) params.licensePlate = state.licensePlate
    if (state.startDate) params.startDate = state.startDate
    if (state.endDate) params.endDate = state.endDate
    if (state.entryType) params.entryType = state.entryType
    if (state.vehicleType) params.vehicleType = state.vehicleType

    const res = await getParkingLogs(params)
    const data = res.data?.resultData ?? res.data
    state.list = data.content ?? []
    state.totalPages = data.totalPages ?? 0
    state.totalCount = data.totalCount ?? 0
  } catch (e) {
    console.error('입출차 기록 조회 실패', e)
  }
}

// ── 필터 처리 ──────────────────────────────────────────────────
const filteredRows = computed(() => state.list)

// 검색 버튼 클릭 또는 엔터 시 1페이지부터 재조회
const doSearch = () => {
  state.currentPage = 1
  fetchList()
}

// 필터 초기화 후 재조회
const resetFilters = () => {
  state.licensePlate = ''
  state.entryType = ''
  state.vehicleType = ''
  state.startDate = ''
  state.endDate = ''
  doSearch()
}

// 페이지 변경 시 해당 페이지 조회
const goToPage = (page) => {
  state.currentPage = page
  fetchList()
}

// ── 날짜 포맷 (ISO → 'YYYY-MM-DD HH:mm') ─────────────────────
const formatDate = (val) => {
  if (!val) return '-'
  return val.replace('T', ' ').slice(0, 16)
}

// ── 등록 모달 ─────────────────────────────────────────────────

// 등록 모달 열기 (폼 초기화 후 오픈)
const openRegisterModal = () => {
  state.form.licensePlate = ''
  state.form.entryType = 'IN'
  state.form.loggedAt = getNow()
  state.form.note = ''
  state.result = null
  state.submitError = ''
  state.showRegisterModal = true
}

// 등록 모달 닫기
const closeRegisterModal = () => {
  state.showRegisterModal = false
}

// 입출차 기록 수동 등록 (POST /parking/logs)
// 등록 성공 시 등록 모달 닫고 성공 모달 오픈
const submitLog = async () => {
  if (!state.form.licensePlate.trim()) {
    state.submitError = '차량번호를 입력해주세요.'
    return
  }
  state.submitting = true
  state.submitError = ''
  state.result = null
  try {
    const res = await createParkingLog({
      licensePlate: state.form.licensePlate.trim(),
      entryType: state.form.entryType,
    })
    state.result = res.data?.resultData ?? res.data
    state.successResult = state.result
    fetchList()
    fetchStats()
    // 등록 모달 닫고 성공 모달 열기
    closeRegisterModal()
    state.showSuccessModal = true
  } catch (e) {
    state.submitError = '기록 생성에 실패했습니다.'
    console.error(e)
  } finally {
    state.submitting = false
  }
}

// ── 상세 모달 ─────────────────────────────────────────────────

// 상세 모달 열기 (행 클릭 시 호출)
const openDetailModal = (row) => {
  state.selectedRow = row;
  state.showDetailModal = true
}

// 상세 모달 닫기
const closeDetailModal = () => {
  state.showDetailModal = false;
  state.selectedRow = null
}

// ── 차량 유형별 뱃지 CSS 클래스 반환 ─────────────────────────
const typeClass = (type) => {
  switch (type) {
    case '등록차량':
      return 'type-registered'
    case '방문차량':
      return 'type-visitor'
    case '고정방문차량':
      return 'type-fixed'
    default:
      return 'type-unknown'
  }
}

// 상위 레이아웃에서 등록 모달 오픈 함수를 inject받아 등록 버튼과 연결
const registerOpenModal = inject('registerOpenModal', null)

onMounted(() => {
  fetchList()
  fetchStats()
  if (registerOpenModal) registerOpenModal(openRegisterModal)
})
</script>

<template>
  <div class="parking-log-page">

    <!-- 상단 통계 카드 4개 (오늘 입출차, 미등록, 이번달 전체) -->
    <StatsCards :stats="statsData"/>

    <!-- 필터 + 테이블 + 페이지네이션 섹션 -->
    <div class="table-section">
      <FilterBar @reset="resetFilters">
        <!-- 차량번호 검색 -->
        <div class="search-wrap">
          <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input class="search-input" type="text" placeholder="차량번호 검색" v-model="state.licensePlate"
                 @keyup.enter="doSearch"/>
        </div>
        <!-- 입/출차 필터 -->
        <select class="filter-select" v-model="state.entryType" @change="doSearch">
          <option value="">입/출차</option>
          <option value="IN">입차</option>
          <option value="OUT">출차</option>
        </select>
        <!-- 차량 유형 필터 -->
        <select class="filter-select" v-model="state.vehicleType" @change="doSearch">
          <option value="">차량 유형</option>
          <option value="등록차량">등록차량</option>
          <option value="방문차량">방문차량</option>
          <option value="고정방문차량">고정방문차량</option>
          <option value="미등록차량">미등록차량</option>
        </select>
        <!-- 날짜 범위 필터 -->
        <input class="filter-date" type="date" v-model="state.startDate" @change="doSearch"/>
        <span class="date-sep">~</span>
        <input class="filter-date" type="date" v-model="state.endDate" @change="doSearch"/>
      </FilterBar>

      <!-- 테이블 (행 클릭 시 상세 모달 오픈) -->
      <AdminTable :columns="columns" :rows="filteredRows" @row-click="openDetailModal">
        <template #cell-logId="{ row }"><span class="log-id">#{{ row.logId }}</span></template>
        <template #cell-licensePlate="{ row }"><span class="license">{{ row.licensePlate }}</span></template>
        <template #cell-entryType="{ row }">
          <span :class="['badge-entry', row.entryType === 'IN' ? 'badge-in' : 'badge-out']">{{ row.entryType }}</span>
        </template>
        <template #cell-vehicleType="{ row }">
          <span :class="['badge-type', typeClass(row.vehicleType)]">{{ row.vehicleType ?? '미등록차량' }}</span>
        </template>
        <template #cell-loggedAt="{ row }">{{ formatDate(row.loggedAt) }}</template>
        <template #cell-vehicleInfo="{ row }"><span class="vehicle-info">{{ row.vehicleInfo ?? '-' }}</span></template>
      </AdminTable>

      <Pagination
          :currentPage="state.currentPage"
          :maxPage="state.totalPages"
          :totalAll="state.totalCount"
          :totalFiltered="filteredRows.length"
          unit="건"
          @change="goToPage"
      />
    </div>

    <!-- 등록 모달: 차량번호 + 입/출차 선택으로 수동 기록 등록 -->
    <Model v-if="state.showRegisterModal" title="입출차 기록 등록" subtitle="수동으로 입출차 기록을 추가합니다" @close="closeRegisterModal">
      <div class="modal-form">
        <div class="form-group">
          <label class="form-label">차량번호 <span class="required">*</span></label>
          <input class="form-input" type="text" placeholder="예: 12가 3456" v-model="state.form.licensePlate"
                 @keyup.enter="submitLog"/>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">입/출차 <span class="required">*</span></label>
            <div class="entry-type-btns">
              <button :class="['type-btn type-in', state.form.entryType === 'IN' ? 'active' : '']"
                      @click="state.form.entryType = 'IN'">IN
              </button>
              <button :class="['type-btn type-out', state.form.entryType === 'OUT' ? 'active' : '']"
                      @click="state.form.entryType = 'OUT'">OUT
              </button>
            </div>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">기록 시각</label>
          <div class="input-icon-wrap">
            <input class="form-input" type="text" v-model="state.form.loggedAt"/>
            <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">비고 (선택)</label>
          <textarea class="form-textarea" placeholder="관리자 메모 입력 (선택사항)" v-model="state.form.note" rows="3"/>
        </div>
        <p v-if="state.submitError" class="error-msg">{{ state.submitError }}</p>
        <p class="form-note">* 표시는 필수 입력 정보입니다.</p>
      </div>
      <template #footer>
        <button class="btn-cancel" @click="closeRegisterModal">취소</button>
        <button class="btn-primary" @click="submitLog" :disabled="state.submitting">
          {{ state.submitting ? '등록 중...' : '등록하기' }}
        </button>
      </template>
    </Model>

    <!-- 성공 모달: 등록 완료 후 결과 표시 -->
    <Model v-if="state.showSuccessModal" title="등록 완료" subtitle="입출차 기록이 성공적으로 등록되었습니다"
           @close="state.showSuccessModal = false">
      <div class="success-body">
        <div class="success-icon">✓</div>
        <div class="success-plate">{{ state.form.licensePlate }}</div>
        <div class="success-grid">
          <div class="success-cell">
            <span class="success-label">입/출차</span>
            <span :class="['badge-entry', state.form.entryType === 'IN' ? 'badge-in' : 'badge-out']">{{
                state.form.entryType
              }}</span>
          </div>
          <div class="success-cell">
            <span class="success-label">차량 유형</span>
            <span :class="['badge-type', typeClass(state.successResult?.vehicleType)]">{{
                state.successResult?.vehicleType ?? '미등록차량'
              }}</span>
          </div>
          <div class="success-cell" v-if="state.successResult?.vehicleInfo">
            <span class="success-label">차량 정보</span>
            <span class="success-value">{{ state.successResult.vehicleInfo }}</span>
          </div>
        </div>
      </div>
      <template #footer>
        <button class="btn-primary" @click="state.showSuccessModal = false">확인</button>
      </template>
    </Model>

    <!-- 상세 모달: 선택한 입출차 기록 상세 정보 표시 -->
    <Model v-if="state.showDetailModal && state.selectedRow" title="입출차 기록 상세"
           :subtitle="`ID #${state.selectedRow.logId}`" @close="closeDetailModal">
      <div class="detail-body">
        <div class="detail-header">
          <span :class="['badge-entry', state.selectedRow.entryType === 'IN' ? 'badge-in' : 'badge-out']">{{
              state.selectedRow.entryType
            }}</span>
          <div class="detail-plate">{{ state.selectedRow.licensePlate }}</div>
          <div class="detail-type">{{ state.selectedRow.vehicleType ?? '미등록차량' }}</div>
        </div>
        <div class="detail-divider"/>
        <div class="detail-grid">
          <div class="detail-item"><span class="detail-label">기록 ID</span><span
              class="detail-value">#{{ state.selectedRow.logId }}</span></div>
          <div class="detail-item"><span class="detail-label">차량번호</span><span
              class="detail-value">{{ state.selectedRow.licensePlate }}</span></div>
          <div class="detail-item">
            <span class="detail-label">입/출차</span>
            <span :class="['badge-entry', state.selectedRow.entryType === 'IN' ? 'badge-in' : 'badge-out']">{{
                state.selectedRow.entryType
              }}</span>
          </div>
          <div class="detail-item"><span class="detail-label">기록 시각</span><span
              class="detail-value">{{ formatDate(state.selectedRow.loggedAt) }}</span></div>
          <div class="detail-item">
            <span class="detail-label">등록 차량 여부</span>
            <span :class="['badge-type', typeClass(state.selectedRow.vehicleType)]">
       {{ state.selectedRow.vehicleType ?? '미등록' }}
       <template v-if="state.selectedRow.vehicleId"> ({{ state.selectedRow.vehicleId }})</template>
       <template
           v-else-if="!state.selectedRow.vehicleId && !state.selectedRow.visitorVehicleId && !state.selectedRow.fixedVisitorVehicleId"> (0)</template>
      </span>
          </div>
          <div class="detail-item"><span class="detail-label">비고</span><span
              class="detail-value">{{ state.selectedRow.vehicleInfo ?? '-' }}</span></div>
        </div>
        <!-- 미등록 차량 경고 박스 -->
        <div
            v-if="!state.selectedRow.vehicleId && !state.selectedRow.visitorVehicleId && !state.selectedRow.fixedVisitorVehicleId"
            class="warning-box">
          미등록 차량입니다.<br/>등록 여부를 확인하고 필요시 조치해주세요.
        </div>
      </div>
      <template #footer>
        <button class="btn-primary" @click="closeDetailModal">닫기</button>
      </template>
    </Model>
  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.parking-log-page {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.table-section {
  background: #fff;
  border-radius: 10px;
  border: 1px solid #E2E8F0;
  overflow: hidden;
}

.btn-primary {
  padding: 9px 18px;
  background: #2B3A55;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary:hover {
  background: #1E2A3E;
}

.btn-primary:disabled {
  background: #687282;
  cursor: default;
}

.btn-cancel {
  padding: 9px 18px;
  background: #fff;
  color: #687282;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
}

.btn-cancel:hover {
  background: #F5F6F8;
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
  color: #687282;
  flex-shrink: 0;
}

.search-input {
  border: none;
  background: transparent;
  font-size: 13px;
  outline: none;
  width: 150px;
}

.search-input::placeholder {
  color: #CBD5E0;
}

.filter-select {
  padding: 7px 10px;
  border: 1px solid #E2E8F0;
  border-radius: 7px;
  background: #fff;
  font-size: 13px;
  color: #687282;
  outline: none;
  cursor: pointer;
}

.filter-date {
  padding: 7px 10px;
  border: 1px solid #E2E8F0;
  border-radius: 7px;
  background: #fff;
  font-size: 13px;
  color: #687282;
  outline: none;
}

.date-sep {
  font-size: 13px;
  color: #687282;
}

.log-id {
  color: #687282;
  font-size: 12px;
}

.license {
  font-weight: 500;
  font-size: 14px;
  letter-spacing: 0.5px;
}

.vehicle-info {
  color: #687282;
  font-size: 12px;
}

.badge-entry {
  display: inline-block;
  padding: 4px 18px;
  border-radius: 18px;
  font-size: 11px;
  font-weight: 700;
}

.badge-in {
  background: #C6F6D5;
  color: #276749;
}

.badge-out {
  background: #FFF5F5;
  color: #E53E3E;
}

.badge-type {
  display: inline-block;
  padding: 6px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
}

.type-registered {
  background: #E8EBF2;
  color: #2B3A55;
}

.type-visitor {
  background: #EBF4FF;
  color: #2B6CB0;
}

.type-fixed {
  background: #FDF6E8;
  color: #C08B2D;
}

.type-unknown {
  background: #EDF2F7;
  color: #687282;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 13px;
  font-weight: 600;
  color: #687282;
}

.required {
  color: #E53E3E;
}

.form-input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  font-size: 13px;
  outline: none;
}

.form-input:focus {
  border-color: #2B3A55;
}

.input-icon-wrap {
  position: relative;
}

.input-icon-wrap .form-input {
  padding-right: 40px;
}

.input-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #687282;
  pointer-events: none;
}

.form-textarea {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  font-size: 13px;
  outline: none;
  resize: none;
  color: #687282;
}

.form-textarea:focus {
  border-color: #2B3A55;
}

.form-textarea::placeholder {
  color: #CBD5E0;
}

.entry-type-btns {
  display: flex;
  gap: 0;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  overflow: hidden;
}

.type-btn {
  flex: 1;
  padding: 10px;
  border: none;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  background: #F5F6F8;
  color: #687282;
  transition: all 0.15s;
}

.type-in.active, .type-out.active {
  background: #2B3A55;
  color: #fff;
}

.form-note {
  font-size: 11px;
  color: #687282;
  margin-top: 4px;
}

.error-msg {
  font-size: 12px;
  color: #E53E3E;
}

.success-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 8px 0;
}

.success-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #C6F6D5;
  color: #276749;
  font-size: 24px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.success-plate {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: 1px;
  color: #1A202C;
}

.success-grid {
  display: flex;
  gap: 24px;
  background: #F5F6F8;
  border-radius: 10px;
  padding: 14px 20px;
  width: 100%;
  justify-content: center;
}

.success-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.success-label {
  font-size: 11px;
  color: #687282;
  font-weight: 500;
}

.success-value {
  font-size: 13px;
  font-weight: 500;
  color: #1A202C;
}

.detail-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;
}

.detail-plate {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: 1px;
  margin-top: 6px;
}

.detail-type {
  font-size: 13px;
  color: #687282;
}

.detail-divider {
  height: 1px;
  background: #E2E8F0;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px 24px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;
}

.detail-label {
  font-size: 11px;
  color: #687282;
  font-weight: 500;
}

.detail-value {
  font-size: 13px;
  font-weight: 500;
}

.warning-box {
  background: #FFF8E6;
  border: 1px solid #F6D860;
  border-radius: 8px;
  padding: 12px;
  font-size: 12px;
  color: #7A5C00;
}
</style>