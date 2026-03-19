<script setup>
import { reactive, watch } from 'vue'
import reservationAPI from '@/api/reservation'

// 부모에서 선택한 조회 날짜 받기
const props = defineProps({
  selectedDate: {
    type: String,
    default: '',
  },
})

// 부모로 요약값 전달
const emit = defineEmits(['update-summary'])

// 독서실 좌석 상태
// API 연결용 상태
const state = reactive({
  loading: false,

  maleRoom: [],
  femaleRoom: [],
})

// API 응답을 남/여 좌석 배열로 변환
// 빈 좌석도 1~12번까지 채워서 프론트에 맞춤
const buildSeatList = (reservedList = [], totalCount = 12) => {
  const result = []

  for (let seatNo = 1; seatNo <= totalCount; seatNo++) {
    const found = reservedList.find((item) => item.seatNo === seatNo)

    if (found) {
      result.push({
        seatNo,
        reserved: true,
        userName: found.userName,
        household: `${found.dong || ''} ${found.ho || ''}`.trim(),
        status: found.status,
      })
    } else {
      result.push({
        seatNo,
        reserved: false,
        userName: '',
        household: '',
        status: '',
      })
    }
  }

  return result
}

// 독서실 상세 조회
// 백엔드 응답 예시 가정:
// {
//   maleSeats: [...],
//   femaleSeats: [...]
// }
// 또는 resultData 안에 바로 배열이 온다고 가정
const fetchStudyRoomDetail = async () => {
  if (!props.selectedDate) return

  state.loading = true

  try {
    const result = await reservationAPI.getStudyRoomDetail({
      startDate: props.selectedDate,
      endDate: props.selectedDate,
      typeId: 1,
    })

    const data = result.data?.resultData || {}
    const maleSeats = data.maleSeats || []
    const femaleSeats = data.femaleSeats || []

    state.maleRoom = buildSeatList(maleSeats, 12)
    state.femaleRoom = buildSeatList(femaleSeats, 12)

    emit('update-summary', {
      maleReservedCount: maleSeats.length,
      maleTotalCount: 12,
      femaleReservedCount: femaleSeats.length,
      femaleTotalCount: 12,
    })
  } catch (error) {
    console.error('독서실 상세 조회 실패:', error)

    state.maleRoom = buildSeatList([], 12)
    state.femaleRoom = buildSeatList([], 12)

    emit('update-summary', {
      maleReservedCount: 0,
      maleTotalCount: 12,
      femaleReservedCount: 0,
      femaleTotalCount: 12,
    })
  } finally {
    state.loading = false
  }
}

// 날짜 변경 시 재조회
watch(
  () => props.selectedDate,
  () => {
    fetchStudyRoomDetail()
  },
  { immediate: true }
)
</script>

<template>
  <div class="study-page">
    <div v-if="state.loading" class="empty-text">독서실 데이터를 불러오는 중입니다.</div>
    <div class="room-grid">
      <div class="room-panel">
        <div class="panel-head">
          <h3 class="panel-title">독서실(남)</h3>
          <span class="panel-desc">좌석 12석</span>
        </div>

        <div class="seat-grid">
          <div
            v-for="seat in state.maleRoom"
            :key="`male-${seat.seatNo}`"
            class="seat-box"
            :class="{ reserved: seat.reserved }"
          >
            <p class="seat-no">{{ seat.seatNo }}번</p>
            <template v-if="seat.reserved">
              <p class="seat-user">{{ seat.userName }}</p>
              <p class="seat-household">{{ seat.household }}</p>
            </template>
            <template v-else>
              <p class="seat-empty">빈자리</p>
            </template>
          </div>
        </div>
      </div>

      <div class="room-panel">
        <div class="panel-head">
          <h3 class="panel-title">독서실(여)</h3>
          <span class="panel-desc">좌석 12석</span>
        </div>

        <div class="seat-grid">
          <div
            v-for="seat in state.femaleRoom"
            :key="`female-${seat.seatNo}`"
            class="seat-box"
            :class="{ reserved: seat.reserved }"
          >
            <p class="seat-no">{{ seat.seatNo }}번</p>
            <template v-if="seat.reserved">
              <p class="seat-user">{{ seat.userName }}</p>
              <p class="seat-household">{{ seat.household }}</p>
            </template>
            <template v-else>
              <p class="seat-empty">빈자리</p>
            </template>
          </div>
        </div>
      </div>
    </div>
    <div v-if="!state.loading && state.maleRoom.length === 0 && state.femaleRoom.length === 0" class="empty-text">
  예약 데이터가 없습니다.
</div>
  </div>
</template>

<style scoped>
.study-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.room-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.room-panel {
  border: 1px solid #E2E8F0;
  border-radius: 10px;
  padding: 18px;
  background: #fff;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.panel-title {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: #1A202C;
  font-family: 'Noto Sans KR', sans-serif;
}

.panel-desc {
  font-size: 12px;
  color: #718096;
  font-family: 'Noto Sans KR', sans-serif;
}

.seat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.seat-box {
  min-height: 92px;
  padding: 12px;
  border: 1px solid #E2E8F0;
  border-radius: 10px;
  background: #F8FAFC;
}

.seat-box.reserved {
  background: #EEF2FF;
  border-color: #C7D2FE;
}

.seat-no {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 800;
  color: #334155;
  font-family: 'Noto Sans KR', sans-serif;
}

.seat-user {
  margin: 0 0 4px;
  font-size: 13px;
  font-weight: 700;
  color: #2B3A55;
  font-family: 'Noto Sans KR', sans-serif;
}

.seat-household,
.seat-empty {
  margin: 0;
  font-size: 12px;
  color: #718096;
  line-height: 1.5;
  font-family: 'Noto Sans KR', sans-serif;
}

.empty-text {
  font-size: 13px;
  color: #718096;
  font-family: 'Noto Sans KR', sans-serif;
}
</style>