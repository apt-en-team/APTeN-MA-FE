<script setup>
import {reactive, computed, onMounted} from 'vue'
import {getAdminParkingStatus, updateParkingLot} from '@/api/parking.js'
import VueApexCharts from 'vue3-apexcharts'
import StatsCards from '@/components/admin/StatsCards.vue'
import Modal from '@/components/Modal.vue'

// ── 상태 ──────────────────────────────────────────────────────
const state = reactive({
  totalSpaces: 0,        // 전체 주차면 수
  currentCount: 0,       // 현재 주차 중인 차량 수
  availableCount: 0,     // 현재 가용 주차면 수
  registeredCount: 0,    // 등록 차량 수
  visitorCount: 0,       // 방문 차량 수
  fixedVisitorCount: 0,  // 고정방문 차량 수
  unregisteredCount: 0,  // 미등록 차량 수
  loading: true,

  // 주차장 수정 모달 상태
  showEditModal: false,
  editForm: {id: null, name: '', totalSpaces: '', note: ''},
  submitting: false,
  submitError: '',
})

// ── 주차 사용률 계산 (현재 주차 중 / 전체 주차면 * 100) ───────
const usageRate = computed(() =>
    state.totalSpaces > 0 ? Math.round((state.currentCount / state.totalSpaces) * 100) : 0
)

// ── 상단 통계 카드 데이터 ─────────────────────────────────────
const statsData = computed(() => [
  {label: '전체 주차면', value: state.totalSpaces, unit: '면', desc: '총 주차 가능 대수'},
  {
    label: '현재 사용 중',
    value: state.currentCount,
    unit: '면',
    desc: `사용률 ${usageRate.value}%`,
    descClass: usageRate.value >= 90 ? 'warning' : usageRate.value >= 70 ? 'highlight-orange' : 'highlight-green',
  },
  {
    label: '현재 가용',
    value: state.availableCount,
    unit: '면',
    desc: state.availableCount === 0 ? '여유 없음' : '여유 있음',
    descClass: state.availableCount === 0 ? 'warning' : 'success',
  },
  {
    label: '미등록 차량',
    value: state.unregisteredCount,
    unit: '개',
    desc: state.currentCount > 0
        ? `전체 대비 ${Math.round((state.unregisteredCount / state.currentCount) * 100) || 0}%`
        : '-',
    descClass: state.unregisteredCount > 0 ? 'highlight-orange' : '',
  },
])

// ── 도넛 차트 색상 ────────────────────────────────────────────
// 등록/방문/고정방문/미등록 순서
const defaultColors = ['#4973E5', '#34D399', '#818CF8', '#F59E0B']
const hoverColors = ['#3560D4', '#20C080', '#6366F1', '#E08A00']

// 도넛 차트 시리즈 (등록/방문/고정방문/미등록 순서)
const chartSeries = computed(() => [
  state.registeredCount,
  state.visitorCount,
  state.fixedVisitorCount,
  state.unregisteredCount,
])

// ── ApexCharts 도넛 차트 옵션 ─────────────────────────────────
const chartOptions = computed(() => ({
  chart: {
    type: 'donut',
    events: {
      // 호버 시 해당 색상만 진하게 변경
      dataPointMouseEnter: (event, chartContext, config) => {
        const colors = [...defaultColors]
        colors[config.dataPointIndex] = hoverColors[config.dataPointIndex]
        chartContext.updateOptions({colors}, false, false)
      },
      dataPointMouseLeave: (event, chartContext) => {
        chartContext.updateOptions({colors: defaultColors}, false, false)
      },
    },
  },
  labels: ['등록 차량', '방문 차량', '고정방문 차량', '미등록'],
  colors: defaultColors,
  states: {hover: {filter: {type: 'none'}}, active: {filter: {type: 'none'}}},
  legend: {show: false},
  plotOptions: {
    pie: {
      expandOnClick: true,
      donut: {
        size: '52%',
        labels: {
          show: true,
          // 중앙 레이블: 사용률 % 표시
          total: {show: true, label: '사용률', fontSize: '13px', color: '#687282', formatter: () => `${usageRate.value}%`},
          // 호버 시 현재/전체 면 표시
          value: {
            show: true,
            fontSize: '13px',
            color: '#687282',
            formatter: () => `${state.currentCount} / ${state.totalSpaces}면`
          },
          name: {fontSize: '13px', color: '#687282', offsetY: -10},
        },
      },
    },
  },
  dataLabels: {enabled: false},
  stroke: {show: false},
  tooltip: {
    y: {formatter: (val) => `${val}대`},
    // 커스텀 툴팁: 유형명 + 대수 표시
    custom: ({series, seriesIndex}) => {
      const colors = ['#4973E5', '#34D399', '#818CF8', '#F59E0B']
      const labels = ['등록 차량', '방문 차량', '고정방문 차량', '미등록']
      const color = colors[seriesIndex]
      const label = labels[seriesIndex]
      const value = series[seriesIndex]
      return `<div style="background:#fff;border:2px solid ${color};border-radius:8px;padding:8px 14px;font-size:13px;font-family:Noto Sans KR,sans-serif;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <span style="color:${color};font-weight:700;">${label}</span>
    <span style="margin-left:8px;font-weight:700;">${value}대</span>
   </div>`
    },
  },
}))

// ── API 조회 ──────────────────────────────────────────────────

// 주차 현황 조회 (GET /parking/status)
// 등록/방문/고정방문/미등록 차량 수 포함
const fetchStatus = async () => {
  try {
    const res = await getAdminParkingStatus()
    const data = res.data?.resultData ?? res.data
    state.totalSpaces = data.totalSpaces ?? 0
    state.currentCount = data.currentCount ?? 0
    state.availableCount = data.availableCount ?? 0
    state.registeredCount = data.registeredCount ?? 0
    state.visitorCount = data.visitorCount ?? 0
    state.fixedVisitorCount = data.fixedVisitorCount ?? 0
    state.unregisteredCount = data.unregisteredCount ?? 0
  } catch (e) {
    console.error('주차 현황 조회 실패', e)
  } finally {
    state.loading = false
  }
}

// ── 수정 모달 ─────────────────────────────────────────────────

// 주차장 수정 모달 열기 (현재 데이터로 폼 초기화)
const openEditModal = () => {
  state.editForm.name = 'APTEN 아파트 통합 주차장'
  state.editForm.totalSpaces = state.totalSpaces
  state.editForm.note = ''
  state.submitError = ''
  state.showEditModal = true
}

// 주차장 수정 모달 닫기
const closeEditModal = () => {
  state.showEditModal = false
  state.submitError = ''
}

// 주차장 수정 제출 (PUT /api/admin/parking/lots/{id})
// current_count는 parking_log 집계로 계산하므로 요청에 포함하지 않음
const submitEdit = async () => {
  if (!state.editForm.name.trim()) {
    state.submitError = '주차장 이름을 입력해주세요.';
    return
  }
  if (!state.editForm.totalSpaces) {
    state.submitError = '전체 주차면 수를 입력해주세요.';
    return
  }
  state.submitting = true
  state.submitError = ''
  try {
    await updateParkingLot(state.editForm.id ?? 1, {
      name: state.editForm.name.trim(),
      totalSpaces: Number(state.editForm.totalSpaces),
      note: state.editForm.note.trim() || null,
    })
    await fetchStatus() // 수정 후 현황 새로고침
    closeEditModal()
  } catch (e) {
    state.submitError = '수정에 실패했습니다.'
    console.error(e)
  } finally {
    state.submitting = false
  }
}

onMounted(fetchStatus)
</script>

<template>
  <div class="parking-dashboard">

    <!-- 상단 통계 카드 4개 (전체/사용중/가용/미등록) -->
    <StatsCards :stats="statsData"/>

    <!-- 하단 좌우 2분할 레이아웃 -->
    <div class="dashboard-grid">

      <!-- 왼쪽: 주차장 상세 + 차량 유형별 현황 -->
      <div class="card">
        <div class="section-header">
          <div class="section-title">주차장 상세</div>
          <!-- 수정 버튼 클릭 시 수정 모달 오픈 -->
          <button class="btn-edit" @click="openEditModal">수정</button>
        </div>

        <!-- 주차 사용률 프로그레스 바 (90% 이상: 빨강, 70% 이상: 주황, 미만: 파랑) -->
        <div class="usage-section">
          <div class="usage-header">
            <span class="usage-label">주차 사용률</span>
            <span class="usage-rate">{{ usageRate }}%</span>
          </div>
          <div class="usage-bar">
            <div
                class="usage-fill"
                :style="{ width: usageRate + '%' }"
                :class="{ 'fill-danger': usageRate >= 90, 'fill-warning': usageRate >= 70 && usageRate < 90, 'fill-safe': usageRate < 70 }"
            />
          </div>
          <div class="usage-footer">
            <span>사용 {{ state.currentCount }}면</span>
            <span>여유 {{ state.availableCount }}면</span>
          </div>
        </div>

        <!-- 차량 유형별 현황 (등록/방문/고정방문/미등록) -->
        <div class="type-title">차량 유형별 현황</div>
        <div class="type-grid">
          <div class="type-card type-registered">
            <div class="type-icon icon-registered">등</div>
            <div class="type-info">
              <span class="type-name">등록 차량</span>
              <div class="type-count">{{ state.registeredCount }}대 <span class="type-rate">{{
                  state.currentCount > 0 ? Math.round(state.registeredCount / state.currentCount * 100) : 0
                }}%</span></div>
            </div>
          </div>
          <div class="type-card type-visitor">
            <div class="type-icon icon-visitor">방</div>
            <div class="type-info">
              <span class="type-name">방문 차량</span>
              <div class="type-count">{{ state.visitorCount }}대 <span class="type-rate">{{
                  state.currentCount > 0 ? Math.round(state.visitorCount / state.currentCount * 100) : 0
                }}%</span></div>
            </div>
          </div>
          <div class="type-card type-fixed">
            <div class="type-icon icon-fixed">고</div>
            <div class="type-info">
              <span class="type-name">고정방문 차량</span>
              <div class="type-count">{{ state.fixedVisitorCount }}대 <span class="type-rate">{{
                  state.currentCount > 0 ? Math.round(state.fixedVisitorCount / state.currentCount * 100) : 0
                }}%</span></div>
            </div>
          </div>
          <div class="type-card type-unregistered">
            <div class="type-icon icon-unregistered">미</div>
            <div class="type-info">
              <span class="type-name">미등록 차량</span>
              <div class="type-count">{{ state.unregisteredCount }}대 <span class="type-rate">{{
                  state.currentCount > 0 ? Math.round(state.unregisteredCount / state.currentCount * 100) : 0
                }}%</span></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 오른쪽: 실시간 주차 현황 도넛 차트 -->
      <div class="card">
        <div class="section-title">실시간 주차 현황</div>
        <div class="section-sub">현재 기준</div>
        <div class="chart-wrap">
          <!-- 주차 차량이 있을 때만 차트 렌더링 -->
          <VueApexCharts v-if="!state.loading && state.currentCount > 0" type="donut" height="300"
                         :options="chartOptions" :series="chartSeries"/>
          <div v-else-if="state.loading" class="chart-empty">조회 중...</div>
          <div v-else class="chart-empty">현재 주차 중인 차량이 없습니다</div>
        </div>
        <!-- 범례 (등록/방문/고정방문/미등록) -->
        <div class="legend">
          <div class="legend-item"><span class="legend-dot dot-registered"/><span class="legend-label">등록 차량</span><span
              class="legend-value">{{ state.registeredCount }}대</span></div>
          <div class="legend-item"><span class="legend-dot dot-visitor"/><span class="legend-label">방문 차량</span><span
              class="legend-value">{{ state.visitorCount }}대</span></div>
          <div class="legend-item"><span class="legend-dot dot-fixed"/><span class="legend-label">고정방문</span><span
              class="legend-value">{{ state.fixedVisitorCount }}대</span></div>
          <div class="legend-item"><span class="legend-dot dot-unregistered"/><span class="legend-label">미등록</span><span
              class="legend-value">{{ state.unregisteredCount }}대</span></div>
        </div>
      </div>
    </div>

    <!-- 주차장 수정 모달 -->
    <Modal v-if="state.showEditModal" title="주차장 수정" subtitle="ID #1 · 지하 1층" @close="closeEditModal">
      <div class="modal-form">
        <div class="form-group">
          <label class="form-label">주차장 이름<span class="required">*</span></label>
          <input class="form-input" type="text" placeholder="예: 지하 1층" v-model="state.editForm.name"/>
        </div>
        <!-- 전체 주차면 (현재 사용 중은 parking_log 집계로 계산하므로 수동 입력 불가) -->
        <div class="form-group">
          <label class="form-label">전체 주차면<span class="required">*</span></label>
          <input class="form-input" type="number" min="0" placeholder="예: 120" v-model="state.editForm.totalSpaces"/>
        </div>
        <div class="form-group">
          <label class="form-label">비고 (선택)</label>
          <textarea class="form-textarea" placeholder="관리자 메모 입력 (선택사항)" v-model="state.editForm.note" rows="3"/>
        </div>
        <p v-if="state.submitError" class="error-msg">{{ state.submitError }}</p>
        <p class="form-note">* 표시는 필수 입력 항목입니다.</p>
      </div>
      <template #footer>
        <button class="btn-cancel" @click="closeEditModal">취소</button>
        <button class="btn-primary" @click="submitEdit" :disabled="state.submitting">
          {{ state.submitting ? '수정 중...' : '수정 완료' }}
        </button>
      </template>
    </Modal>
  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.parking-dashboard {
  display: flex;
  flex-direction: column;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.card {
  background: #fff;
  border-radius: 10px;
  border: 1px solid #E2E8F0;
  padding: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
}

.section-sub {
  font-size: 12px;
  color: #687282;
  margin-bottom: 24px;
}

.btn-edit {
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 600;
  color: #687282;
  background: #F5F6F8;
  border: 1px solid #E2E8F0;
  border-radius: 7px;
  cursor: pointer;
}

.btn-edit:hover {
  background: #EDF2F7;
}

.usage-section {
  margin-bottom: 28px;
}

.usage-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.usage-label {
  font-size: 13px;
  color: #687282;
  font-weight: 500;
}

.usage-rate {
  font-size: 13px;
  font-weight: 700;
}

.usage-bar {
  width: 100%;
  height: 10px;
  background: #EDF2F7;
  border-radius: 5px;
  overflow: hidden;
  margin-bottom: 8px;
}

.usage-fill {
  height: 100%;
  border-radius: 5px;
  transition: width 0.6s ease;
}

.fill-safe {
  background: #4973E5;
}

.fill-warning {
  background: #F59E0B;
}

.fill-danger {
  background: #E53E3E;
}

.usage-footer {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #687282;
}

.type-title {
  font-size: 13px;
  font-weight: 600;
  color: #687282;
  margin-bottom: 12px;
}

.type-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.type-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 10px;
  min-height: 80px;
}

.type-registered {
  background: #F0F4FF;
}

.type-visitor {
  background: #F0FFF4;
}

.type-fixed {
  background: #F3F0FF;
}

.type-unregistered {
  background: #FFF7ED;
}

.type-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}

.icon-registered {
  background: #4973E5;
}

.icon-visitor {
  background: #34D399;
}

.icon-fixed {
  background: #818CF8;
}

.icon-unregistered {
  background: #F59E0B;
}

.type-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.type-name {
  font-size: 12px;
  color: #687282;
}

.type-count {
  font-size: 16px;
  font-weight: 700;
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.chart-wrap {
  display: flex;
  justify-content: center;
  align-items: center;
}

.chart-empty {
  font-size: 13px;
  color: #687282;
}

.legend {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #E2E8F0;
  font-size: 14px;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot-registered {
  background: #4973E5;
}

.dot-visitor {
  background: #34D399;
}

.dot-fixed {
  background: #818CF8;
}

.dot-unregistered {
  background: #F59E0B;
}

:deep(.apexcharts-pie-series path) {
  transition: transform 0.2s ease;
  transform-origin: center;
  transform-box: fill-box;
}

:deep(.apexcharts-pie-series path:hover) {
  transform: scale(1.02);
  cursor: pointer;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 13px;
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
  color: #2D3748;
}

.form-input:focus {
  border-color: #2B3A55;
}

.form-input::placeholder {
  color: #CBD5E0;
}

.form-textarea {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  font-size: 13px;
  outline: none;
  resize: none;
  color: #2D3748;
}

.form-textarea:focus {
  border-color: #2B3A55;
}

.form-textarea::placeholder {
  color: #CBD5E0;
}

.form-note {
  font-size: 11px;
  color: #687282;
}

.error-msg {
  font-size: 12px;
  color: #E53E3E;
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
</style>