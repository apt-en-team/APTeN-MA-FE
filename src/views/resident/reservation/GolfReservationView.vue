<script setup>
import { onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import FacilityLayout from '@/components/layout/FacilityLayout.vue'
import facilityAPI from '@/api/facility.js'
import reservationAPI from '@/api/reservation.js'
import Modal from '@/components/common/BeseModel.vue'
import ActionResultModal from '@/components/common/ActionResultModal.vue'

//라우터
const route = useRoute()
const router = useRouter()

//요일
const weekMap = ['일', '월', '화', '수', '목', '금', '토']

//상태
const state = reactive({
  loading: false,
  reserving: false,

  facilityId: Number(route.query.facilityId),
  typeId: Number(route.query.typeId),

  facility: {},

  //날짜 관련
  startOffset: 0,
  dateList: [],
  selectedDate: '',

  //시간 관련
  timeSlotList: [],
  selectedSlot: null,

  //타석 관련
  seatList: [],
  selectedSeatNo: null,

  //안내 모달
  infoModalOpen: false,
  infoModalTitle: '',
  infoModalDesc: '',

  //결과 모달
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

//현재 시각 텍스트
const getNowText = () => {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const hh = String(now.getHours()).padStart(2, '0')
  const mi = String(now.getMinutes()).padStart(2, '0')
  return `${yyyy}.${mm}.${dd} ${hh}:${mi}`
}

//안내 모달 열기
const openInfoModal = (title, desc) => {
  state.infoModalTitle = title
  state.infoModalDesc = desc
  state.infoModalOpen = true
}

//안내 모달 닫기
const closeInfoModal = () => {
  state.infoModalOpen = false
}

//결과 모달 닫기
const closeResultModal = () => {
  state.resultModal.show = false
}

//시설 상세 조회
const fetchFacility = async () => {
  try {
    const { data } = await facilityAPI.getFacility(state.facilityId)
    state.facility = data.resultData || {}
  } catch (error) {
    console.error('시설 상세 조회 실패', error)
  }
}

//날짜 7일 생성
const makeDateList = () => {
  const list = []

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 0; i < 7; i++) {
    const date = new Date()
    date.setDate(date.getDate() + state.startOffset + i)
    date.setHours(0, 0, 0, 0)

    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')

    list.push({
      fullDate: `${yyyy}-${mm}-${dd}`,
      day: weekMap[date.getDay()],
      date: dd,
      disabled: date < today,
    })
  }

  state.dateList = list

  const selectableDate = list.find(item => !item.disabled)

  if (!list.some(item => item.fullDate === state.selectedDate && !item.disabled)) {
    state.selectedDate = selectableDate?.fullDate || ''
  }
}

//기본 타석 생성
const makeSeatList = () => {
  const maxSeat = state.facility.maxCapacity || 5

  state.seatList = Array.from({ length: maxSeat }, (_, index) => ({
    seatNo: index + 1,
    label: `G-${index + 1}`,
    available: true,
  }))
}

//시간대 조회
const fetchAvailableSlots = async () => {
  if (!state.selectedDate || !state.facilityId) return

  try {
    const { data } = await reservationAPI.getAvailableSlots({
      facilityId: state.facilityId,
      reservationDate: state.selectedDate,
    })

    const list = data.resultData || []

    state.timeSlotList = list.map(slot => ({
      startTime: slot.startTime,
      endTime: slot.endTime,
      availableCount: slot.availableCount,
      disabled: slot.availableCount <= 0,
    }))

    state.selectedSlot = null
    state.selectedSeatNo = null
    makeSeatList()
  } catch (error) {
    console.error('골프 시간 조회 실패', error)
    state.timeSlotList = []
    state.selectedSlot = null
    state.selectedSeatNo = null
    makeSeatList()
  }
}

//타석 상태 조회
const fetchSeatStatus = async () => {
  if (!state.selectedDate || !state.selectedSlot || !state.facilityId) return

  try {
    makeSeatList()
    const { data } = await reservationAPI.getGolfSeatStatus({
      facilityId: state.facilityId,
      reservationDate: state.selectedDate,
      startTime: state.selectedSlot.startTime,
    })
    const reservedSeats = data.resultData || []

    state.seatList = state.seatList.map(seat => ({
      ...seat,
      available: !reservedSeats.some(item => item.seatNo === seat.seatNo),
    }))

    if (state.selectedSeatNo) {
      const stillAvailable = state.seatList.find(
        seat => seat.seatNo === state.selectedSeatNo && seat.available
      )
      if (!stillAvailable) {
        state.selectedSeatNo = null
      }
    }
  } catch (error) {
    console.error('골프 타석 상태 조회 실패', error)
    makeSeatList()
  }
}

//이전 주
const movePrevWeek = async () => {
  state.startOffset -= 7
  makeDateList()
  state.selectedSlot = null
  state.selectedSeatNo = null
  await fetchAvailableSlots()
}

//다음 주
const moveNextWeek = async () => {
  state.startOffset += 7
  makeDateList()
  state.selectedSlot = null
  state.selectedSeatNo = null
  await fetchAvailableSlots()
}

//날짜 선택
const selectDate = async (item) => {
  if (item.disabled) return
  state.selectedDate = item.fullDate
  state.selectedSlot = null
  state.selectedSeatNo = null
  await fetchAvailableSlots()
}

//시간 선택
const selectSlot = async (slot) => {
  if (slot.disabled) return
  state.selectedSlot = slot
  state.selectedSeatNo = null
  await fetchSeatStatus()
}

//타석 선택
const selectSeat = (seat) => {
  if (!seat.available) return
  state.selectedSeatNo = seat.seatNo
}

//시간 텍스트
const formatSlotText = (slot) => {
  return `${String(slot.startTime).slice(0, 5)}~${String(slot.endTime).slice(0, 5)}`
}

//잔여석 수
const getRemainSeatCount = () => {
  return state.seatList.filter(seat => seat.available).length
}

//예약
const handleReserve = async () => {
  if (!state.selectedDate) {
    openInfoModal('예약 안내', '날짜를 선택해주세요.')
    return
  }

  if (!state.selectedSlot) {
    openInfoModal('예약 안내', '시간을 선택해주세요.')
    return
  }

  if (!state.selectedSeatNo) {
    openInfoModal('예약 안내', '타석을 선택해주세요.')
    return
  }

  state.reserving = true

  try {
    await reservationAPI.createReservation({
      facilityId: state.facilityId,
      reservationDate: state.selectedDate,
      startTime: state.selectedSlot.startTime,
      endTime: state.selectedSlot.endTime,
      seatNo: state.selectedSeatNo,
    })

    state.resultModal.type = 'success'
    state.resultModal.title = '예약이 완료되었습니다'
    state.resultModal.subtitle = state.facility.name || '골프연습장'
    state.resultModal.desc = '선택한 시간과 타석이 정상적으로 예약되었습니다.'
    state.resultModal.itemName = `${state.facility.name || '골프연습장'} ${state.selectedSeatNo}번 타석`
    state.resultModal.time = getNowText()
    state.resultModal.actionLabel = '예약 완료'
    state.resultModal.actor = '입주민'
    state.resultModal.show = true
  } catch (error) {
    console.error('골프 예약 실패', error)

    state.resultModal.type = 'danger'
    state.resultModal.title = '예약에 실패했습니다'
    state.resultModal.subtitle = state.facility.name || '골프연습장'
    state.resultModal.desc = error.response?.data?.resultMessage || '잠시 후 다시 시도해주세요.'
    state.resultModal.itemName = `${state.facility.name || '골프연습장'} ${state.selectedSeatNo || '-'}번 타석`
    state.resultModal.time = getNowText()
    state.resultModal.actionLabel = '예약 실패'
    state.resultModal.actor = '입주민'
    state.resultModal.show = true
  } finally {
    state.reserving = false
  }
}

//결과 모달 확인
const handleConfirmResult = async () => {
  closeResultModal()
  await router.push({
    name: 'MyReservation',
  })
}

//이전
const goBack = () => {
  router.back()
}

//초기 진입
onMounted(async () => {
  state.loading = true

  try {
    makeDateList()
    await fetchFacility()
    makeSeatList()
    await fetchAvailableSlots()
  } finally {
    state.loading = false
  }
})
</script>

<template>
  <FacilityLayout>
    <!-- 브레드크럼 -->
    <div class="breadcrumb">
      <span class="breadcrumb-title">{{ state.facility.name || '골프연습장' }} 예약하기</span>
      <span class="breadcrumb-sep"> / </span>
      <span class="breadcrumb-sub">편의 시설</span>
    </div>

    <!-- 로딩 -->
    <div v-if="state.loading" class="loading-box">
      불러오는 중...
    </div>

    <!-- 본문 -->
    <div v-else class="reservation-card">
      <!-- 날짜 선택 -->
      <section class="section-box">
        <h3 class="section-title">날짜 선택</h3>

        <div class="date-row">
          <button class="nav-btn" @click="movePrevWeek">‹</button>

          <button
            v-for="item in state.dateList"
            :key="item.fullDate"
            class="date-chip"
            :class="{
              active: state.selectedDate === item.fullDate,
              disabled: item.disabled,
            }"
            @click="selectDate(item)"
          >
            <span class="date-day">{{ item.day }}</span>
            <span class="date-num">{{ item.date }}</span>
          </button>

          <button class="nav-btn" @click="moveNextWeek">›</button>
        </div>
      </section>

      <!-- 시간 선택 -->
      <section class="section-box">
        <h3 class="section-title">시간 선택</h3>

        <div class="time-grid">
          <button
            v-for="slot in state.timeSlotList"
            :key="`${slot.startTime}-${slot.endTime}`"
            class="time-btn"
            :class="{
              active:
                state.selectedSlot?.startTime === slot.startTime &&
                state.selectedSlot?.endTime === slot.endTime,
              disabled: slot.disabled,
            }"
            @click="selectSlot(slot)"
          >
            {{ formatSlotText(slot) }}
          </button>
        </div>
      </section>

      <!-- 자리 선택 -->
      <section class="section-box">
        <h3 class="section-title">자리 선택</h3>

        <div class="seat-top-row">
          <div class="remain-box">잔여석 {{ getRemainSeatCount() }}석 ↺</div>

          <div class="seat-guide-title">자리배치도</div>

          <div class="legend-wrap">
            <div class="legend-item">
              <span class="legend-box available"></span>
              <span>예약가능</span>
            </div>
            <div class="legend-item">
              <span class="legend-box disabled"></span>
              <span>예약마감</span>
            </div>
          </div>
        </div>

        <!-- 골프는 기본 배치도 표시 -->
        <div class="seat-grid golf-grid">
          <button
            v-for="seat in state.seatList"
            :key="seat.seatNo"
            class="seat-btn"
            :class="{
              active: state.selectedSeatNo === seat.seatNo,
              disabled: !seat.available,
            }"
            @click="selectSeat(seat)"
          >
            {{ seat.label }}
          </button>
        </div>
      </section>

      <!-- 버튼 -->
      <div class="bottom-btn-row">
        <button class="btn-back" @click="goBack">이전</button>
        <button class="btn-primary" :disabled="state.reserving" @click="handleReserve">
          {{ state.reserving ? '예약 중...' : '예약하기' }}
        </button>
      </div>
    </div>

    <!-- 안내 모달 -->
    <Modal
      v-if="state.infoModalOpen"
      :title="state.infoModalTitle"
      :subtitle="state.infoModalDesc"
      @close="closeInfoModal"
    >
      <template #footer>
        <button class="modal-confirm-btn" @click="closeInfoModal">확인</button>
      </template>
    </Modal>

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
      @close="handleConfirmResult"
    />
  </FacilityLayout>
</template>

<style scoped>
* { box-sizing: border-box; }

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 20px;
}

.breadcrumb-title {
  font-size: 20px;
  font-weight: 700;
  color: #1A202C;
}

.breadcrumb-sep {
  font-size: 18px;
  color: #A0AEC0;
}

.breadcrumb-sub {
  font-size: 16px;
  color: #A0AEC0;
}

.loading-box {
  min-height: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #A0AEC0;
  font-size: 14px;
}

.reservation-card {
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 16px;
  padding: 36px 40px;
}

.section-box + .section-box {
  margin-top: 32px;
}

.section-title {
  font-size: 24px;
  font-weight: 700;
  color: #333333;
  margin-bottom: 22px;
}

.date-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
}

.nav-btn {
  width: 28px;
  height: 28px;
  border: 1px solid #E2E8F0;
  border-radius: 6px;
  background: #F8FAFC;
  color: #94A3B8;
  cursor: pointer;
}

.date-chip {
  width: 72px;
  height: 72px;
  border: 1px solid #D9DEE8;
  border-radius: 16px;
  background: #FFFFFF;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: pointer;
}

.date-chip.active {
  background: #4973E5;
  border-color: #4973E5;
  color: #FFFFFF;
}

.date-chip.disabled {
  background: #E5E7EB;
  border-color: #E5E7EB;
  color: #9CA3AF;
  cursor: default;
}

.date-day {
  font-size: 13px;
  font-weight: 500;
}

.date-num {
  font-size: 18px;
  font-weight: 700;
}

.time-grid {
  display: grid;
  grid-template-columns: repeat(6, 100px);
  gap: 12px;
  justify-content: center;
}

.time-btn {
  min-height: 50px;
  border: 1px solid #D9DEE8;
  border-radius: 16px;
  background: #FFFFFF;
  color: #333333;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.time-btn.active {
  background: #4973E5;
  border-color: #4973E5;
  color: #FFFFFF;
}

.time-btn.disabled {
  background: #D9D9D9;
  border-color: #D9D9D9;
  color: #8C8C8C;
  cursor: default;
}

.seat-top-row {
  display: grid;
  grid-template-columns: 120px 1fr auto;
  align-items: center;
  gap: 14px;
  margin-bottom: 20px;
}

.remain-box {
  height: 36px;
  border: 1px solid #E2E8F0;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: #333333;
  font-weight: 600;
}

.seat-guide-title {
  height: 36px;
  border: 1px solid #E2E8F0;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #757575;
  font-size: 13px;
  font-weight: 600;
}

.legend-wrap {
  display: flex;
  align-items: center;
  gap: 16px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #757575;
  font-size: 12px;
}

.legend-box {
  width: 32px;
  height: 16px;
  border-radius: 6px;
  border: 1px solid #D9DEE8;
}

.legend-box.available {
  background: #FFFFFF;
}

.legend-box.disabled {
  background: #D9D9D9;
  border-color: #D9D9D9;
}

.seat-grid {
  display: grid;
  gap: 12px;
  justify-content: center;
}

.golf-grid {
  grid-template-columns: repeat(5, 78px);
}

.seat-btn {
  width: 78px;
  height: 58px;
  border: 1px solid #D9DEE8;
  border-radius: 16px;
  background: #FFFFFF;
  color: #4A4A4A;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
}

.seat-btn.active {
  background: #4973E5;
  border-color: #4973E5;
  color: #FFFFFF;
}

.seat-btn.disabled {
  background: #D9D9D9;
  border-color: #D9D9D9;
  color: #8C8C8C;
  cursor: default;
}

.bottom-btn-row {
  display: flex;
  justify-content: center;
  gap: 14px;
  margin-top: 40px;
}

.btn-back {
  min-width: 120px;
  height: 46px;
  border: 1px solid #E2E8F0;
  border-radius: 10px;
  background: #FFFFFF;
  color: #718096;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary {
  min-width: 140px;
  height: 46px;
  border: none;
  border-radius: 10px;
  background: #4973E5;
  color: #FFFFFF;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary:disabled {
  background: #A0AEC0;
  cursor: default;
}

.modal-confirm-btn {
  min-width: 120px;
  height: 42px;
  border: none;
  border-radius: 8px;
  background: #4973E5;
  color: #FFFFFF;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
</style>