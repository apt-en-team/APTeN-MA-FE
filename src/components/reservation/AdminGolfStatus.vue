<script setup>
import { reactive, computed, watch } from 'vue'
import reservationAPI from '@/api/reservation'
import AdminReservationDetailModal from '@/components/reservation/Adminreservationdetailmodal.vue'

// 부모에서 선택한 날짜 받기
const props = defineProps({
  selectedDate: {
    type: String,
    default: '',
  },
})

// 골프 상태
const state = reactive({
  loading: false,
  timeRows: [],
  detailModal: {
    show: false,
    reservationId: null,
  },
})

// 날짜 텍스트 포맷
const selectedDateLabel = computed(() => {
  const date = new Date(props.selectedDate)
  if (Number.isNaN(date.getTime())) return props.selectedDate

  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const dayNames = ['일', '월', '화', '수', '목', '금', '토']
  const dayName = dayNames[date.getDay()]

  return `${month}월 ${day}일 (${dayName})`
})

// raw 리스트를 시간행 표 구조로 변환
// GolfSlotRes 기준:
// startTime, endTime, seatNo, userName, dong, ho, status
const buildGolfRows = (list = []) => {
  const grouped = {}

  list.forEach((item) => {
    const key = `${item.startTime}~${item.endTime}`

    if (!grouped[key]) {
      grouped[key] = {
        time: key,
        seats: {
          1: null,
          2: null,
          3: null,
          4: null,
          5: null,
        },
      }
    }

    if (item.seatNo) {
      grouped[key].seats[item.seatNo] = {
        reservationId: item.reservationId,
        userName: item.userName,
        household: `${item.dong || ''} ${item.ho || ''}`.trim(),
        status: item.status,
      }
    }
  })

  return Object.values(grouped)
}

// 골프 상세 조회
const fetchGolfDetail = async () => {
  if (!props.selectedDate) return

  state.loading = true

  try {
    const result = await reservationAPI.getGolfDetail({
      startDate: props.selectedDate,
      endDate: props.selectedDate,
      typeId: 3,
    })

    const data = result.data?.resultData || []
    const list = Array.isArray(data.slotList) ? data.slotList : (Array.isArray(data) ? data : [])

    state.timeRows = buildGolfRows(list)
  } catch (error) {
    console.error('골프 상세 조회 실패:', error)
    state.timeRows = []
  } finally {
    state.loading = false
  }
}

// 날짜 변경 시 재조회
watch(
  () => props.selectedDate,
  () => {
    fetchGolfDetail()
  },
  { immediate: true }
)

//상서보기 모달 열기
const openDetailModal = (seat) => {
  if (!seat || !seat.reservationId) return

  state.detailModal.reservationId = seat.reservationId
  state.detailModal.show = true
}

const closeDetailModal = () => {
  state.detailModal.show = false
  state.detailModal.reservationId = null
}

</script>

<template>
  <div class="golf-page">
    <div v-if="state.loading" class="empty-text">골프 데이터를 불러오는 중입니다.</div>
    <div class="golf-table-wrap">
      <h3 class="table-title">{{ selectedDateLabel }} 타석 현황</h3>

      <table class="golf-table">
        <thead>
          <tr>
            <th class="time-head">시간</th>
            <th>1번 타석</th>
            <th>2번 타석</th>
            <th>3번 타석</th>
            <th>4번 타석</th>
            <th>5번 타석</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!state.loading && state.timeRows.length === 0">
            <td colspan="6" class="empty-row">예약 데이터가 없습니다.</td>
          </tr>
          <tr v-for="row in state.timeRows" :key="row.time">
            <td class="time-cell">{{ row.time }}</td>

            <td
              v-for="seatNo in [1, 2, 3, 4, 5]"
              :key="`${row.time}-${seatNo}`"
              class="seat-cell"
              :class="{ clickable: !!row.seats[seatNo] }"
              @click="row.seats[seatNo] && openDetailModal(row.seats[seatNo])"
            >
              <template v-if="row.seats[seatNo]">
                <div class="seat-user-box">
                  <p class="seat-user-name">{{ row.seats[seatNo].userName }}</p>
                  <p class="seat-user-household">{{ row.seats[seatNo].household }}</p>
                </div>
              </template>
              <template v-else>
                <span class="empty-mark">-</span>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <AdminReservationDetailModal
      v-if="state.detailModal.show"
      :reservation-id="state.detailModal.reservationId"
      @close="closeDetailModal"
      @cancelled="
        async () => {
          closeDetailModal()
          await fetchGolfDetail()
        }
      "
    />
  </div>
</template>

<style scoped>
.golf-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.golf-table-wrap {
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
}

.table-title {
  margin: 0;
  padding: 20px 20px 12px;
  font-size: 20px;
  font-weight: 900;
  color: #1A202C;
  font-family: 'Noto Sans KR', sans-serif;
}

.golf-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.golf-table th,
.golf-table td {
  border: 1px solid #E2E8F0;
  text-align: center;
  vertical-align: middle;
  font-family: 'Noto Sans KR', sans-serif;
}

.golf-table th {
  background: #F8FAFC;
  color: #718096;
  font-size: 14px;
  font-weight: 800;
  padding: 18px 12px;
}

.time-head {
  width: 220px;
}

.time-cell {
  padding: 28px 12px;
  font-size: 18px;
  font-weight: 900;
  color: #1A202C;
  background: #fff;
}

.seat-cell {
  padding: 20px 8px;
  min-height: 150px;
}

.seat-user-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  line-height: 1.6;
}

.seat-user-name {
  margin: 0;
  font-size: 16px;
  font-weight: 900;
  color: #1A202C;
}

.seat-user-household {
  margin: 0;
  font-size: 14px;
  color: #718096;
}

.empty-mark {
  color: #CBD5E0;
  font-size: 22px;
  font-weight: 700;
}

.empty-text {
  font-size: 13px;
  color: #718096;
  font-family: 'Noto Sans KR', sans-serif;
}

.empty-row {
  text-align: center;
  color: #94A3B8;
  padding: 24px;
}

.seat-cell.clickable {
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease;
}

.seat-cell.clickable:hover {
  background: #F8FAFC;
}

</style>