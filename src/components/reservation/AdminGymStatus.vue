<script setup>
import { reactive, watch } from 'vue'
import reservationAPI from '@/api/reservation'
import AdminReservationDetailModal from '@/components/reservation/Adminreservationdetailmodal.vue'

// 부모에서 선택한 날짜 받기
const props = defineProps({
  selectedDate: {
    type: String,
    default: '',
  },
})

// 부모에 요약값 전달
const emit = defineEmits(['update-summary'])

// 헬스장 상태
const state = reactive({
  loading: false,
  reservationUsers: [],
  detailModal: {
    show: false,
    reservationId: null,
  },
  
})

const statusLabel = (status) => {
  return {
    CONFIRMED: '확정',
    CANCELLED: '취소',
    PENDING: '대기',
    COMPLETED: '완료',
  }[status] || status
}

const statusClass = (status) => {
  return {
    CONFIRMED: 'confirmed',
    CANCELLED: 'cancelled',
    PENDING: 'pending',
    COMPLETED: 'completed',
  }[status] || ''
}

// 헬스장 상세 조회
// 응답 예시:
// {
//   totalCount: 7,
//   confirmedCount: 5,
//   cancelledCount: 2,
//   userList: [...]
// }
// 또는 배열만 줄 수도 있음
const fetchGymDetail = async () => {
  if (!props.selectedDate) return

  state.loading = true

  try {
    const result = await reservationAPI.getGymDetail({
      startDate: props.selectedDate,
      endDate: props.selectedDate,
      typeId: 2,
    })

    const data = result.data?.resultData || {}

    // 백엔드가 GymDetailRes로 줄 경우
    if (Array.isArray(data.userList)) {
      state.reservationUsers = data.userList

      emit('update-summary', {
        totalCount: data.totalCount || 0,
        confirmedCount: data.confirmedCount || 0,
        cancelledCount: data.cancelledCount || 0,
      })
    } else {
      // 백엔드가 배열만 줄 경우
      const list = Array.isArray(data) ? data : []
      state.reservationUsers = list

      emit('update-summary', {
        totalCount: list.length,
        confirmedCount: list.filter((item) => item.status === 'CONFIRMED').length,
        cancelledCount: list.filter((item) => item.status === 'CANCELLED').length,
      })
    }
  } catch (error) {
    console.error('헬스장 상세 조회 실패:', error)

    state.reservationUsers = []

    emit('update-summary', {
      totalCount: 0,
      confirmedCount: 0,
      cancelledCount: 0,
    })
  } finally {
    state.loading = false
  }
}

// 날짜 변경 시 재조회
watch(
  () => props.selectedDate,
  () => {
    fetchGymDetail()
  },
  { immediate: true }
)

//리스트 클릭 상세보기
const openDetailModal = (item) => {
  if (!item.reservationId) return

  state.detailModal.reservationId = item.reservationId
  state.detailModal.show = true
}

const closeDetailModal = () => {
  state.detailModal.show = false
  state.detailModal.reservationId = null
}

</script>

<template>
  <div class="gym-page">
    <div v-if="state.loading" class="empty-text">헬스장 데이터를 불러오는 중입니다.</div>
    <div class="table-wrap">
      <table class="custom-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>예약자</th>
            <th>세대</th>
            <th>상태</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!state.loading && state.reservationUsers.length === 0">
            <td colspan="4" class="empty-row">예약 데이터가 없습니다.</td>
          </tr>

          <tr
            v-for="item in state.reservationUsers"
            :key="item.reservationId"
            class="clickable-row"
            @click="openDetailModal(item)"
          >
            <td>{{ item.reservationId }}</td>
            <td>{{ item.userName }}</td>
            <td>{{ item.dong }} {{ item.ho }}</td>
            <td>
              <span class="status-badge" :class="statusClass(item.status)">
                {{ statusLabel(item.status) }}
              </span>
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
          await fetchGymDetail()
        }
      "
    />
  </div>
</template>

<style scoped>
.gym-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.table-wrap {
  overflow: hidden;
  border: 1px solid #E2E8F0;
  border-radius: 10px;
}

.custom-table {
  width: 100%;
  border-collapse: collapse;
}

.custom-table th,
.custom-table td {
  padding: 14px 12px;
  border-bottom: 1px solid #EDF2F7;
  text-align: left;
  font-size: 13px;
  font-family: 'Noto Sans KR', sans-serif;
}

.custom-table th {
  background: #F8FAFC;
  color: #718096;
  font-weight: 700;
}

.custom-table td {
  color: #2D3748;
}

.status-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 999px;
}

.status-badge.confirmed {
  background: #C6F6D5;
  color: #276749;
}

.status-badge.cancelled {
  background: #FED7D7;
  color: #9B2C2C;
}

.status-badge.pending {
  background: #FEEBC8;
  color: #9C4221;
}

.empty-text {
  font-size: 13px;
  color: #718096;
  font-family: 'Noto Sans KR', sans-serif;
}

.empty-row {
  text-align: center;
  color: #94A3B8;
}
.status-badge.completed {
  background: #E2E8F0;
  color: #475569;
}

.clickable-row {
  cursor: pointer;
  transition: background 0.2s ease;
}

.clickable-row:hover {
  background: #F8FAFC;
}
</style>