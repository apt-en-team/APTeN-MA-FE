<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import axios from '@/api/axios.js'
import VueApexCharts from 'vue3-apexcharts'
import StatsCards from '@/components/admin/StatsCards.vue'

// 상태

const selectedTab = ref('month')  // 선택된 기간 탭
const customStart = ref('')       // 직접 선택 - 시작일
const customEnd   = ref('')       // 직접 선택 - 종료일
const statistics  = ref([])       // API 응답 원본 배열
const loading     = ref(false)    // 로딩 여부

// 탭별 날짜 범위 + type 계산
// type: 'hourly' → x축 00~23시간 / 'daily' → x축 날짜
const fmt = (d) => d.toISOString().split('T')[0] // Date → 'YYYY-MM-DD'

// 선택된 탭에 따라 API에 넘길 날짜 범위와 집계 타입을 계산
// start/end: 'YYYY-MM-DD' 형태 / type: 'hourly'(시간대별) | 'daily'(일별)
const dateRange = computed(() => {
  const today = new Date()
  switch (selectedTab.value) {

    case 'today':
      // 오늘 하루 → 시작/종료 모두 오늘, 시간대별 집계
      return { start: fmt(today), end: fmt(today), type: 'hourly' }

    case 'week': {
      // 이번 주 → 오늘 기준 6일 전 ~ 오늘 (7일치), 일별 집계
      const s = new Date(today); s.setDate(today.getDate() - 6)
      return { start: fmt(s), end: fmt(today), type: 'daily' }
    }

    case 'month': {
      // 이번 달 → 이번 달 1일 ~ 오늘, 시간대별 집계
      const s = new Date(today.getFullYear(), today.getMonth(), 1)
      return { start: fmt(s), end: fmt(today), type: 'hourly' }
    }

    case '3months': {
      // 최근 3개월 → 2달 전 1일 ~ 오늘, 일별 집계
      // ex) 오늘이 3월이면 1월 1일부터
      const s = new Date(today); s.setMonth(today.getMonth() - 2); s.setDate(1)
      return { start: fmt(s), end: fmt(today), type: 'daily' }
    }

    case 'custom':
      // 직접 선택 → 사용자가 입력한 날짜 그대로 사용, 일별 집계
      return { start: customStart.value, end: customEnd.value, type: 'daily' }

    default:
      // 탭 값이 없거나 알 수 없는 경우 오늘 기준으로 fallback
      return { start: fmt(today), end: fmt(today), type: 'hourly' }
  }
})

// API 조회 (GET /api/admin/parking/stats)

const fetchStats = async () => {
  // 직접 선택 탭인데 날짜가 없으면 조회 안 함
  if (selectedTab.value === 'custom' && (!customStart.value || !customEnd.value)) return
  loading.value = true
  try {
    const res = await axios.get('/admin/parking/stats', {
      params: {
        start_date:dateRange.value.start,
        end_date: dateRange.value.end,
        type: dateRange.value.type,
      }
    })
    const data = res.data?.resultData ?? res.data
    statistics.value = data.statistics ?? []
  } catch (e) {
    console.error('주차 통계 조회 실패', e)
    statistics.value = []
  } finally {
    loading.value = false
  }
}

// 탭 변경 시 자동 재조회 (직접 선택은 조회 버튼 클릭 시 수동 조회)
watch(selectedTab, () => {
  if (selectedTab.value !== 'custom') fetchStats()
})

onMounted(fetchStats)

// 상단 통계 카드 계산
const isHourly = computed(() => dateRange.value.type === 'hourly')

// 기간 내 총 입차 건수
const totalIn = computed(() =>
    statistics.value.reduce((s, r) => s + (r.totalIn ?? r.total_in ?? 0), 0)
)

// 기간 내 총 출차 건수
const totalOut = computed(() =>
    statistics.value.reduce((s, r) => s + (r.totalOut ?? r.total_out ?? 0), 0)
)

// 일 평균 입차: 총 입차 / 고유 날짜 수
const avgDailyIn = computed(() => {
  const dates = new Set(statistics.value.map(r => r.date).filter(Boolean))
  const days = dates.size || 1
  return Math.round(totalIn.value / days)
})

// 피크 타임 (hourly): 시간대별 입차 합산이 가장 많은 시간
const peakHour = computed(() => {
  const hourly = statistics.value.filter(r => r.hour != null)
  if (!hourly.length) return null
  const byHour = {}
  hourly.forEach(r => {
    byHour[r.hour] = (byHour[r.hour] || 0) + (r.totalIn ?? r.total_in ?? 0)
  })
  const peak = Object.entries(byHour).sort((a, b) => b[1] - a[1])[0]
  return peak ? Number(peak[0]) : null
})

// 피크 날짜 (daily): 날짜별 입차 합산이 가장 많은 날
const peakDate = computed(() => {
  const daily = statistics.value.filter(r => r.date != null)
  if (!daily.length) return null
  const byDate = {}
  daily.forEach(r => {
    byDate[r.date] = (byDate[r.date] || 0) + (r.totalIn ?? r.total_in ?? 0)
  })
  const peak = Object.entries(byDate).sort((a, b) => b[1] - a[1])[0]
  return peak ? peak[0] : null
})

// 피크 사용률: current_count 최댓값
const peakRate = computed(() =>
    Math.max(...statistics.value.map(r => r.currentCount ?? r.current_count ?? 0), 0)
)

// 미등록 차량 비율: 미등록 / 총 입차 * 100
const unregisteredRate = computed(() => {
  const total = statistics.value.reduce((s, r) => s + (r.totalIn ?? r.total_in ?? 0), 0)
  const unreg  = statistics.value.reduce((s, r) => s + (r.unregistered ?? 0), 0)
  return total > 0 ? Math.round((unreg / total) * 100) : 0
})

// StatsCards 컴포넌트에 넘길 데이터 (모두 실제 데이터 기반)
const statsData = computed(() => [
  {
    // 탭에 따라 레이블 변경
    label: selectedTab.value === 'today' ? '오늘 총 입차'
        : selectedTab.value === 'week'  ? '이번 주 총 입차'
            : selectedTab.value === 'month' ? '이번 달 총 입차'
                : '기간 내 총 입차',
    value: totalIn.value,
    unit: '건',
    // 출차 대비 입차 비율로 desc 표시
    desc: totalOut.value > 0
        ? `출차 ${totalOut.value}건`
        : '출차 없음',
    descClass: 'highlight-green',
  },
  {
    label: '일 평균 입차',
    value: avgDailyIn.value,
    unit: '건',
    // hourly면 피크 시간, daily면 피크 날짜 표시
    desc: isHourly.value && peakHour.value != null
        ? `가장 바쁜 시간 ${String(peakHour.value).padStart(2, '0')}:00`
        : peakDate.value
            ? `가장 바쁜 날 ${peakDate.value}`
            : '-',
  },
  {
    label: '피크 타임 사용률',
    value: peakRate.value,
    unit: '%',
    // hourly면 피크 시간대, daily면 기간 내 최대라고 표시
    desc: isHourly.value && peakHour.value != null
        ? `${peakHour.value}시 ~ ${peakHour.value + 1}시`
        : peakRate.value > 0
            ? '기간 내 최대'
            : '-',
    descClass: peakRate.value >= 90 ? 'warning' : peakRate.value >= 70 ? 'highlight-orange' : '',
  },
  {
    label: '미등록 차량 비율',
    value: unregisteredRate.value,
    unit: '%',
    // 미등록 실제 건수도 함께 표시
    desc: statistics.value.reduce((s, r) => s + (r.unregistered ?? 0), 0) > 0
        ? `미등록 ${statistics.value.reduce((s, r) => s + (r.unregistered ?? 0), 0)}건`
        : '미등록 없음',
    descClass: unregisteredRate.value > 10 ? 'warning' : '',
  },
])

// ApexCharts 데이터 가공
// { x: 레이블, y: 값 } 형태로 넘겨야 막대 중앙에 레이블이 맞춰짐
// categories 방식은 bar 차트에서 레이블이 막대 경계에 찍혀 어긋남
// x축 카테고리: hourly → 00~23, daily → 날짜 배열
const chartCategories = computed(() => {
  if (isHourly.value) {
    return Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
  }
  return [...new Set(statistics.value.map(r => r.date).filter(Boolean))].sort()
})

// 입차 시리즈: { x: 시간/날짜, y: 건수 } 형태
const inSeries = computed(() => {
  if (isHourly.value) {
    return Array.from({ length: 24 }, (_, h) => ({
      x: String(h).padStart(2, '0'),
      y: statistics.value
          .filter(r => r.hour === h)
          .reduce((s, r) => s + (r.totalIn ?? r.total_in ?? 0), 0)
    }))
  }
  return chartCategories.value.map(date => ({
    x: date,
    y: statistics.value
        .filter(r => r.date === date)
        .reduce((s, r) => s + (r.totalIn ?? r.total_in ?? 0), 0)
  }))
})

// 출차 시리즈: { x: 시간/날짜, y: 건수 } 형태
const outSeries = computed(() => {
  if (isHourly.value) {
    return Array.from({ length: 24 }, (_, h) => ({
      x: String(h).padStart(2, '0'),
      y: statistics.value
          .filter(r => r.hour === h)
          .reduce((s, r) => s + (r.totalOut ?? r.total_out ?? 0), 0)
    }))
  }
  return chartCategories.value.map(date => ({
    x: date,
    y: statistics.value
        .filter(r => r.date === date)
        .reduce((s, r) => s + (r.totalOut ?? r.total_out ?? 0), 0)
  }))
})

// ApexCharts에 넘길 최종 시리즈
const chartSeries = computed(() => [
  { name: '입차', data: inSeries.value },
  { name: '출차', data: outSeries.value },
])

// ApexCharts 옵션
const chartOptions = computed(() => ({
  chart: {
    type: 'bar',
    toolbar: { show: false },
    fontFamily: 'Noto Sans KR, sans-serif',
    background: 'transparent',
    animations: { enabled: true, speed: 400 },
  },
  plotOptions: {
    bar: {
      borderRadius: 3,
      columnWidth: isHourly.value ? '65%' : '50%',
    },
  },
  colors: ['#4973E5', '#F59E0B'],
  dataLabels: { enabled: false },
  stroke: { show: false },
  xaxis: {
    type: 'category',
    // categories 없이 { x, y } 데이터로 넘기면 x값이 레이블로 자동 사용됨
    // → 막대 중앙에 레이블이 정확히 맞춰짐
    labels: {
      style: { fontSize: '11px', colors: '#687282' },
      rotate: chartCategories.value.length > 20 ? -45 : 0,
    },
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: {
    min: 0,
    labels: {
      style: { fontSize: '11px', colors: '#687282' },
      // 소수점 값은 빈 문자열 → 정수 눈금만 표시
      formatter: val => Number.isInteger(val) ? String(val) : '',
    },
  },
  grid: {
    borderColor: '#F1F3F5',
    strokeDashArray: 4,
    yaxis: { lines: { show: true } },
    xaxis: { lines: { show: false } },
  },
  legend: {
    show: true,
    position: 'top',
    horizontalAlign: 'right',
    offsetY: -8,
    markers: { radius: 3, width: 10, height: 10 },
    labels: { colors: '#687282' },
    fontSize: '12px',
  },
  tooltip: {
    style: { fontFamily: 'Noto Sans KR, sans-serif', fontSize: '13px' },
    // 커스텀 툴팁: 입차(파랑) / 출차(주황) 색상 구분
    custom: ({ series, seriesIndex, dataPointIndex, w }) => {
      const cat    = w.globals.labels[dataPointIndex]
      const inVal  = series[0][dataPointIndex]
      const outVal = series[1][dataPointIndex]
      return `<div style="
        background:#fff;
        border:1.5px solid #E2E8F0;
        border-radius:8px;
        padding:10px 14px;
        font-size:13px;
        font-family:Noto Sans KR,sans-serif;
        box-shadow:0 2px 8px rgba(0,0,0,0.07);
        min-width:120px;
      ">
        <div style="font-size:11px;color:#687282;margin-bottom:8px;font-weight:600;">
          ${isHourly.value ? cat + '시' : cat}
        </div>
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
          <span style="width:8px;height:8px;border-radius:2px;background:#4973E5;display:inline-block;"></span>
          <span style="color:#687282;">입차</span>
          <span style="margin-left:auto;font-weight:600;color:#4973E5;">${inVal}건</span>
        </div>
        <div style="display:flex;align-items:center;gap:6px;">
          <span style="width:8px;height:8px;border-radius:2px;background:#F59E0B;display:inline-block;"></span>
          <span style="color:#687282;">출차</span>
          <span style="margin-left:auto;font-weight:600;color:#F59E0B;">${outVal}건</span>
        </div>
      </div>`
    },
  },
  states: {
    hover:  { filter: { type: 'lighten', value: 0.08 } },
    active: { filter: { type: 'none' } },
  },
}))

// 차트 상단 기준 텍스트 (ex. "2026-03-01 ~ 2026-03-19 기준")
const chartSubtitle = computed(() => {
  const { start, end } = dateRange.value
  if (!start) return ''
  return start === end ? `${start} 기준` : `${start} ~ ${end} 기준`
})

// 탭 목록
const tabs = [
  { key: 'today',   label: '오늘' },
  { key: 'week',    label: '이번 주' },
  { key: 'month',   label: '이번 달' },
  { key: '3months', label: '최근 3개월' },
  { key: 'custom',  label: '직접 선택' },
]
</script>

<template>
  <div class="parking-stats-page">

    <!-- 상단 통계 카드 4개 -->
    <StatsCards :stats="statsData"/>

    <!-- 차트 카드 -->
    <div class="chart-card">

      <!-- 탭 바 -->
      <div class="tab-bar">
        <button
            v-for="tab in tabs"
            :key="tab.key"
            :class="['tab-btn', selectedTab === tab.key ? 'tab-active' : '']"
            @click="selectedTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- 직접 선택 시 날짜 입력 + 조회 버튼 -->
      <div v-if="selectedTab === 'custom'" class="custom-range">
        <input type="date" v-model="customStart" class="date-input"/>
        <span class="date-sep">~</span>
        <input type="date" v-model="customEnd" class="date-input"/>
        <button class="btn-search" @click="fetchStats">조회</button>
      </div>

      <!-- 차트 본문 -->
      <div class="chart-section">
        <div class="chart-header">
          <span class="chart-title">시간대별 입출차 현황</span>
          <span class="chart-sub">{{ chartSubtitle }}</span>
        </div>

        <!-- 로딩 중 -->
        <div v-if="loading" class="chart-empty">조회 중...</div>

        <!-- 데이터 없음 -->
        <div v-else-if="statistics.length === 0" class="chart-empty">
          해당 기간의 데이터가 없습니다.
        </div>

        <!-- ApexCharts 막대 차트
             isHourly: true  → x축 00~23시간 (오늘/이번달)
             isHourly: false → x축 날짜 (이번주/최근3개월/직접선택) -->
        <VueApexCharts
            v-else
            type="bar"
            height="340"
            :options="chartOptions"
            :series="chartSeries"
        />
      </div>
    </div>

  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.parking-stats-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.chart-card {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #E2E8F0;
  overflow: hidden;
}

/* 탭 바 */
.tab-bar {
  display: flex;
  padding: 0 24px;
  border-bottom: 1px solid #F1F3F5;
}

.tab-btn {
  padding: 14px 20px;
  font-size: 13px;
  font-weight: 500;
  color: #687282;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: all 0.15s;
  margin-bottom: -1px;
}

.tab-btn:hover { color: #1E2A3E; }

.tab-active {
  color: #1A1A2E;
  font-weight: 700;
  border-bottom: 2px solid #1A1A2E;
}

/* 직접 선택 날짜 입력 영역 */
.custom-range {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 24px;
  background: #F8FAFC;
  border-bottom: 1px solid #F1F3F5;
}

.date-input {
  padding: 7px 12px;
  border: 1px solid #E2E8F0;
  border-radius: 7px;
  font-size: 13px;
  color: #687282;
  outline: none;
}

.date-input:focus { border-color: #1E2A3E; }

.date-sep {
  font-size: 13px;
  color: #687282;
}

.btn-search {
  padding: 7px 20px;
  background: #1E2A3E;
  color: #fff;
  border: none;
  border-radius: 7px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

/* 차트 영역 */
.chart-section { padding: 24px; }

.chart-header {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 16px;
}

.chart-title {
  font-size: 15px;
  font-weight: 700;
  color: #1A1A2E;
}

.chart-sub {
  font-size: 12px;
  color: #687282;
}

.chart-empty {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 340px;
  font-size: 13px;
  color: #687282;
}
</style>