<script setup>
import { reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import AdminGxApprovalModal from '@/components/reservation/Admingxapprovalmodal.vue'
import reservationAPI from '@/api/reservation'

const route = useRoute()
 
// ── 상태 ─────────────────────────────────────────────────────
const state = reactive({
  // 시설 정보
  facility: null,
 
  // 달력
  currentYear:  new Date().getFullYear(),
  currentMonth: new Date().getMonth(),   // 0-indexed
  selectedDate: new Date().toISOString().slice(0, 10),
 
  // 예약 데이터
  monthReservations: [],
  dayReservations:   [],
  gxProgramList:     [],
  isLoading:         false,
})
 
// ── 모달 ─────────────────────────────────────────────────────
const gxModal = reactive({ show: false, program: null })
 
// ── computed ──────────────────────────────────────────────────
const facilityType = computed(() => {
  const type = state.facility?.typeName
  if (type === '헬스장') return 'gym'
  if (type === '독서실') return 'library'
  if (type === '골프연습장') return 'golf'
  if (type === 'GX') return 'gx'
  return 'default'
})
 
const monthLabel = computed(() => `${state.currentYear}년 ${state.currentMonth + 1}월`)
 
const todayStr = new Date().toISOString().slice(0, 10)
 
const dailyCounts = computed(() => {
  const map = {}
  state.monthReservations.forEach(r => {
    map[r.reservationDate] = (map[r.reservationDate] || 0) + 1
  })
  return map
})
 
const calendarDays = computed(() => {
  const y = state.currentYear
  const m = state.currentMonth
  const firstDow = new Date(y, m, 1).getDay()
  const lastDay  = new Date(y, m + 1, 0).getDate()
  const days = []
  for (let i = 0; i < firstDow; i++) days.push(null)
  for (let d = 1; d <= lastDay; d++) {
    const ds = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    days.push({ date: d, dateStr: ds, count: dailyCounts.value[ds] || 0 })
  }
  return days
})
 
// 헬스장 방문자
const gymVisitors = computed(() =>
  state.dayReservations.filter(r => ['CONFIRMED', 'COMPLETED'].includes(r.status))
)
 
// 독서실 좌석
const maxSeats = computed(() => state.facility?.maxCapacity || 12)
const seatMap  = computed(() => {
  const map = {}
  state.dayReservations.forEach(r => { if (r.seatNo) map[r.seatNo] = r })
  return map
})
const seats = computed(() =>
  Array.from({ length: maxSeats.value }, (_, i) => ({
    no: i + 1, reservation: seatMap.value[i + 1] || null
  }))
)
 
// 골프 시간 × 타석
const timeSlots = computed(() => {
  const map = {}
  state.dayReservations.forEach(r => {
    if (!map[r.startTime]) map[r.startTime] = { startTime: r.startTime, endTime: r.endTime, seats: {} }
    if (r.seatNo) map[r.startTime].seats[r.seatNo] = r
  })
  return Object.values(map).sort((a, b) => a.startTime.localeCompare(b.startTime))
})
const golfSeats = computed(() =>
  Array.from({ length: state.facility?.maxCapacity || 5 }, (_, i) => i + 1)
)
 
// ── API ───────────────────────────────────────────────────────
const fetchMonthData = async () => {
  if (!state.facility) return
  const y = state.currentYear
  const m = String(state.currentMonth + 1).padStart(2, '0')
  const lastDay = new Date(y, state.currentMonth + 1, 0).getDate()
  state.isLoading = true
  try {
    const result = await reservationAPI.getReservationsByFacility({
      typeId: route.params.typeId,
      startDate:  `${y}-${m}-01`,
      endDate:    `${y}-${m}-${lastDay}`
    })
    state.monthReservations = result.data.resultData?.content || result.data.resultData || []
    if (facilityType.value === 'gx') buildGxPrograms()
  } catch (e) { console.error('월 예약 조회 실패', e) }
  finally { state.isLoading = false }
}
 
const fetchDayData = async (dateStr) => {
  if (!state.facility || facilityType.value === 'gx') return
  state.isLoading = true
  try {
    const result = await reservationAPI.getAdminReservations({
      typeId: route.params.typeId,
      startDate: dateStr, endDate: dateStr,
      size: 200, page: 1
    })
    state.dayReservations = result.data.resultData?.content || result.data.resultData || []
  } catch (e) { console.error('일 예약 조회 실패', e) }
  finally { state.isLoading = false }
}
 
const buildGxPrograms = () => {
  const map = {}
  state.monthReservations.forEach(r => {
    if (!r.programId) return
    if (!map[r.programId]) {
      map[r.programId] = {
        programId:    r.programId,
        facilityId:   r.facilityId,
        facilityName: r.facilityName,
        maxCapacity:  r.maxCapacity,
        confirmed: 0, pending: 0, cancelled: 0,
      }
    }
    if (r.status === 'CONFIRMED')      map[r.programId].confirmed++
    else if (r.status === 'PENDING')   map[r.programId].pending++
    else if (r.status === 'CANCELLED') map[r.programId].cancelled++
  })
  state.gxProgramList = Object.values(map)
}
 
// ── 달력 네비게이션 ───────────────────────────────────────────
const prevMonth = () => {
  if (state.currentMonth === 0) { state.currentMonth = 11; state.currentYear-- }
  else state.currentMonth--
  fetchMonthData()
}
const nextMonth = () => {
  if (state.currentMonth === 11) { state.currentMonth = 0; state.currentYear++ }
  else state.currentMonth++
  fetchMonthData()
}
 
const selectDate = (day) => {
  if (!day) return
  state.selectedDate = day.dateStr
  fetchDayData(day.dateStr)
}
 
// ── GX 모달 ───────────────────────────────────────────────────
const openGxApproval  = (prog) => { gxModal.program = prog; gxModal.show = true }
const closeGxApproval = ()     => { gxModal.show = false; gxModal.program = null }
 
// ── 유틸 ─────────────────────────────────────────────────────
const fmtDate = (d) => {
  if (!d) return ''
  const dow = ['일','월','화','수','목','금','토'][new Date(d).getDay()]
  const [, m, day] = d.split('-')
  return `${m}월 ${day}일 (${dow})`
}
 
// ── 초기 로드 ─────────────────────────────────────────────────
onMounted(async () => {
  try {
    const result = await reservationAPI.getFacilityList()
    const all = result.data.resultData || []
    state.facility = all.find(f => String(f.typeId) === String(route.params.typeId))
    await fetchMonthData()
    if (facilityType.value !== 'gx') await fetchDayData(state.selectedDate)
  } catch (e) { console.error('시설 정보 로드 실패', e) }
})
</script>
 
<template>
  <div class="page-wrap">
    <!-- 브레드크럼 -->
    <p class="breadcrumb">
      <router-link to="/admin/reservations">전체 예약 현황</router-link>
      &nbsp;/&nbsp; {{ state.facility?.name }} 예약 현황
    </p>
    <h1 class="page-title">{{ state.facility?.name }} 예약 현황</h1>
 
    <div class="layout">
 
      <!-- ── 왼쪽: 달력 ── -->
      <div class="calendar-panel">
        <div class="cal-header">
          <button class="cal-nav" @click="prevMonth">‹</button>
          <span class="cal-month">{{ monthLabel }}</span>
          <button class="cal-nav" @click="nextMonth">›</button>
        </div>
        <div class="cal-grid">
          <div v-for="d in ['일','월','화','수','목','금','토']" :key="d" class="cal-dow">{{ d }}</div>
          <div
            v-for="(day, i) in calendarDays" :key="i"
            :class="['cal-cell', {
              empty:    !day,
              selected: day?.dateStr === state.selectedDate,
              today:    day?.dateStr === todayStr,
              sunday:   i % 7 === 0,
              saturday: i % 7 === 6,
            }]"
            @click="selectDate(day)"
          >
            <template v-if="day">
              <span class="cal-date">{{ day.date }}</span>
              <span v-if="day.count > 0" class="cal-count">{{ day.count }}건</span>
              <div v-if="day.count > 0" class="cal-bar" :style="{ width: Math.min(100, day.count * 5) + '%' }"></div>
            </template>
          </div>
        </div>
      </div>
 
      <!-- ── 오른쪽: 현황 ── -->
      <div class="status-panel">
 
        <!-- 헬스장 -->
        <template v-if="facilityType === 'gym'">
          <h2 class="panel-title">{{ fmtDate(state.selectedDate) }} 방문 현황</h2>
          <div class="gym-summary">
            <span class="gym-count">{{ gymVisitors.length }}</span>
            <span class="gym-label">명 방문</span>
          </div>
          <div v-if="state.isLoading" class="loading">로딩 중...</div>
          <div v-else-if="gymVisitors.length === 0" class="empty">예약 내역이 없습니다.</div>
          <div v-else class="visitor-list">
            <div v-for="r in gymVisitors" :key="r.reservationId" class="visitor-item">
              <span class="v-name">{{ r.userName }}</span>
              <span class="v-dong">{{ r.dong }} {{ r.ho }}</span>
            </div>
          </div>
        </template>
 
        <!-- 독서실 -->
        <template v-else-if="facilityType === 'library'">
          <h2 class="panel-title">{{ fmtDate(state.selectedDate) }} 좌석 현황</h2>
          <p class="panel-sub">{{ state.facility?.name }} · 최대 {{ maxSeats }}석</p>
          <div v-if="state.isLoading" class="loading">로딩 중...</div>
          <div v-else class="seat-grid">
            <div
              v-for="seat in seats" :key="seat.no"
              :class="['seat-card', seat.reservation ? 'occupied' : 'available']"
            >
              <span class="seat-no">{{ seat.no }}번</span>
              <template v-if="seat.reservation">
                <span class="seat-user">{{ seat.reservation.userName }}</span>
                <span class="seat-dong">{{ seat.reservation.dong }} {{ seat.reservation.ho }}</span>
              </template>
              <span v-else class="seat-empty">빈 자리</span>
            </div>
          </div>
        </template>
 
        <!-- 골프연습장 -->
        <template v-else-if="facilityType === 'golf'">
          <h2 class="panel-title">{{ fmtDate(state.selectedDate) }} 타석 현황</h2>
          <div v-if="state.isLoading" class="loading">로딩 중...</div>
          <div v-else-if="timeSlots.length === 0" class="empty">예약 내역이 없습니다.</div>
          <div v-else class="golf-wrap">
            <table class="golf-table">
              <thead>
                <tr>
                  <th>시간</th>
                  <th v-for="s in golfSeats" :key="s">{{ s }}번 타석</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="slot in timeSlots" :key="slot.startTime">
                  <td class="time-cell">{{ slot.startTime }}~{{ slot.endTime }}</td>
                  <td v-for="s in golfSeats" :key="s">
                    <template v-if="slot.seats[s]">
                      <span class="golf-user">{{ slot.seats[s].userName }}</span><br>
                      <small class="golf-dong">{{ slot.seats[s].dong }} {{ slot.seats[s].ho }}</small>
                    </template>
                    <span v-else class="golf-empty">-</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
 
        <!-- GX -->
        <template v-else-if="facilityType === 'gx'">
          <h2 class="panel-title">{{ state.currentMonth + 1 }}월 GX 프로그램 현황</h2>
          <p class="panel-sub">프로그램 선택 후 일괄 승인할 수 있습니다.</p>
          <div v-if="state.isLoading" class="loading">로딩 중...</div>
          <div v-else-if="state.gxProgramList.length === 0" class="empty">등록된 프로그램이 없습니다.</div>
          <div v-else class="gx-list">
            <div v-for="prog in state.gxProgramList" :key="prog.programId" class="gx-card">
              <div class="gx-card-left">
                <p class="gx-name">{{ prog.facilityName }}</p>
                <div class="gx-badges">
                  <span class="gx-badge confirmed">확정 {{ prog.confirmed }}명</span>
                  <span class="gx-badge pending">대기 {{ prog.pending }}명</span>
                  <span class="gx-badge cancelled">취소 {{ prog.cancelled }}명</span>
                </div>
                <div class="gx-bar-wrap">
                  <div class="gx-bar-fill" :style="{ width: Math.min(100, (prog.confirmed / prog.maxCapacity) * 100) + '%' }"></div>
                </div>
                <p class="gx-capacity">{{ prog.confirmed }} / {{ prog.maxCapacity }}명 확정</p>
              </div>
              <button v-if="prog.pending > 0" class="btn-approve" @click="openGxApproval(prog)">
                일괄 승인
                <span class="btn-badge">{{ prog.pending }}</span>
              </button>
              <span v-else class="approved-label">승인 완료</span>
            </div>
          </div>
        </template>
 
      </div>
    </div>
 
    <!-- GX 승인 모달 -->
    <AdminGxApprovalModal
      v-if="gxModal.show"
      :program="gxModal.program"
      @close="closeGxApproval"
      @approved="() => { closeGxApproval(); fetchMonthData() }"
    />
  </div>
</template>
 
<style scoped>
* { box-sizing: border-box; margin: 0; padding: 0; }
.page-wrap  { padding: 28px; font-family: 'Noto Sans KR', sans-serif; color: #333; }
.breadcrumb { font-size: 13px; color: #888; margin-bottom: 8px; }
.breadcrumb a { color: #888; text-decoration: none; }
.breadcrumb a:hover { text-decoration: underline; }
.page-title { font-size: 22px; font-weight: 700; color: #1A202C; margin-bottom: 20px; }
.layout { display: grid; grid-template-columns: 380px 1fr; gap: 24px; align-items: start; }
/* 달력 */
.calendar-panel { background: #fff; border-radius: 10px; padding: 20px; border: 1px solid #E2E8F0; }
.cal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.cal-nav    { background: none; border: none; font-size: 22px; cursor: pointer; color: #555; padding: 2px 8px; }
.cal-month  { font-size: 16px; font-weight: 600; color: #1A202C; }
.cal-grid   { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }
.cal-dow    { text-align: center; font-size: 12px; color: #A0AEC0; padding: 4px 0; font-weight: 600; }
.cal-cell   { min-height: 58px; padding: 4px; border-radius: 6px; cursor: pointer; transition: background 0.1s; }
.cal-cell.empty   { cursor: default; }
.cal-cell:hover:not(.empty) { background: #F5F6F8; }
.cal-cell.selected { background: #2B3A55; }
.cal-cell.selected .cal-date  { color: #fff; }
.cal-cell.selected .cal-count { color: #aaa; }
.cal-cell.today .cal-date { color: #4973E5; font-weight: 700; }
.cal-cell.sunday  .cal-date { color: #E53E3E; }
.cal-cell.saturday .cal-date { color: #3182CE; }
.cal-date  { font-size: 12px; display: block; text-align: center; color: #1A202C; }
.cal-count { font-size: 10px; color: #A0AEC0; display: block; text-align: center; margin-top: 2px; }
.cal-bar   { height: 3px; background: #4973E5; border-radius: 2px; margin-top: 3px; }
.cal-cell.selected .cal-bar { background: #7ca0e8; }
/* 현황 패널 */
.status-panel { background: #fff; border-radius: 10px; padding: 24px; border: 1px solid #E2E8F0; min-height: 500px; }
.panel-title  { font-size: 16px; font-weight: 700; color: #1A202C; margin-bottom: 4px; }
.panel-sub    { font-size: 13px; color: #A0AEC0; margin-bottom: 20px; }
.loading      { text-align: center; padding: 60px; color: #A0AEC0; font-size: 13px; }
.empty        { text-align: center; padding: 60px; color: #CBD5E0; font-size: 13px; }
/* 헬스장 */
.gym-summary { display: flex; align-items: baseline; gap: 6px; margin: 16px 0 20px; }
.gym-count   { font-size: 52px; font-weight: 700; color: #2B3A55; }
.gym-label   { font-size: 16px; color: #A0AEC0; }
.visitor-list { max-height: 420px; overflow-y: auto; }
.visitor-item { display: flex; justify-content: space-between; padding: 10px 14px; border-radius: 8px; background: #F5F6F8; margin-bottom: 6px; }
.v-name { font-size: 14px; font-weight: 600; color: #1A202C; }
.v-dong { font-size: 12px; color: #718096; }
/* 독서실 */
.seat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 4px; }
.seat-card { padding: 12px 8px; border-radius: 8px; text-align: center; }
.seat-card.available { background: #EBF5EE; }
.seat-card.occupied  { background: #FFF7E6; }
.seat-no    { font-size: 11px; color: #A0AEC0; display: block; margin-bottom: 4px; }
.seat-user  { font-size: 13px; font-weight: 600; color: #1A202C; display: block; }
.seat-dong  { font-size: 11px; color: #718096; display: block; }
.seat-empty { font-size: 12px; color: #CBD5E0; }
/* 골프 */
.golf-wrap  { overflow-x: auto; margin-top: 4px; }
.golf-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.golf-table th { background: #F5F6F8; padding: 10px 12px; text-align: center; border: 1px solid #E2E8F0; font-weight: 600; color: #718096; }
.golf-table td { padding: 10px 12px; text-align: center; border: 1px solid #E2E8F0; vertical-align: middle; }
.time-cell  { font-weight: 600; white-space: nowrap; background: #FAFAFA; color: #1A202C; }
.golf-user  { font-size: 12px; font-weight: 600; color: #1A202C; }
.golf-dong  { font-size: 11px; color: #718096; }
.golf-empty { color: #E2E8F0; }
/* GX */
.gx-list { display: flex; flex-direction: column; gap: 12px; }
.gx-card { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-radius: 10px; border: 1px solid #E2E8F0; }
.gx-card-left { flex: 1; }
.gx-name   { font-size: 15px; font-weight: 700; color: #1A202C; margin: 0 0 8px; }
.gx-badges { display: flex; gap: 6px; margin-bottom: 10px; }
.gx-badge  { font-size: 12px; padding: 3px 8px; border-radius: 12px; font-weight: 600; }
.gx-badge.confirmed { background: #EBF5EE; color: #4D8B5A; }
.gx-badge.pending   { background: #FFF7E6; color: #C08B2D; }
.gx-badge.cancelled { background: #FEE2E2; color: #E53E3E; }
.gx-bar-wrap { height: 6px; background: #E2E8F0; border-radius: 4px; margin-bottom: 6px; max-width: 300px; }
.gx-bar-fill { height: 100%; background: #2B3A55; border-radius: 4px; transition: width 0.4s; }
.gx-capacity { font-size: 12px; color: #A0AEC0; margin: 0; }
.btn-approve {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 18px; border-radius: 7px;
  background: #2B3A55; border: none;
  color: #fff; font-size: 13px; font-weight: 600;
  cursor: pointer; white-space: nowrap; flex-shrink: 0;
  font-family: 'Noto Sans KR', sans-serif;
}
.btn-approve:hover { background: #1E2A3E; }
.btn-badge {
  background: #C08B2D; color: #fff;
  font-size: 11px; font-weight: 700;
  width: 20px; height: 20px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
}
.approved-label { font-size: 13px; color: #4D8B5A; font-weight: 600; flex-shrink: 0; }
</style>