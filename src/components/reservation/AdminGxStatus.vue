<script setup>
import { reactive, computed, watch } from 'vue'
import reservationAPI from '@/api/reservation'
import AdminGxPendingModalView from '@/components/reservation/Admingxapprovalmodal.vue'

// 부모에서 선택한 월 받기
const props = defineProps({
  selectedMonth: {
    type: String,
    default: '',
  },
})

// GX 상태
const state = reactive({
  loadingPrograms: false,
  loadingUsers: false,

  selectedProgramId: null,

  modal: {
    open: false,
  },

  programList: [],
  userList: [],
})

// yyyy-mm -> startDate / endDate 만들기
const getMonthRange = (monthValue) => {
  if (!monthValue) {
    return { startDate: '', endDate: '' }
  }

  const [year, month] = monthValue.split('-').map(Number)
  const lastDay = new Date(year, month, 0).getDate()

  return {
    startDate: `${monthValue}-01`,
    endDate: `${monthValue}-${String(lastDay).padStart(2, '0')}`,
  }
}

const displayMonth = computed(() => {
  if (!props.selectedMonth) return ''
  return Number(props.selectedMonth.split('-')[1]) + '월'
})

// 현재 선택 프로그램
const selectedProgram = computed(() => {
  return state.programList.find((item) => item.programId === state.selectedProgramId) || null
})

// GX 프로그램 목록 조회
// 기존 getGxPrograms = /api/admin/reservations/gx-programs
const fetchGxPrograms = async () => {
  const { startDate, endDate } = getMonthRange(props.selectedMonth)
  if (!startDate || !endDate) return

  state.loadingPrograms = true

  try {
    const result = await reservationAPI.getGxPrograms({
      typeId: 4,
      startDate,
      endDate,
    })

    const data = result.data?.resultData || []
    state.programList = Array.isArray(data) ? data : []

    if (state.programList.length > 0) {
      state.selectedProgramId = state.programList[0].programId
      await fetchGxUsers()
    } else {
      state.selectedProgramId = null
      state.userList = []
    }
  } catch (error) {
    console.error('GX 프로그램 목록 조회 실패:', error)
    state.programList = []
    state.selectedProgramId = null
    state.userList = []
  } finally {
    state.loadingPrograms = false
  }
}

// GX 프로그램별 사용자 목록 조회
const fetchGxUsers = async () => {
  if (!state.selectedProgramId) return

  const { startDate, endDate } = getMonthRange(props.selectedMonth)

  state.loadingUsers = true

  try {
    const result = await reservationAPI.getGxUsersByProgram({
      programId: state.selectedProgramId,
      startDate,
      endDate,
    })

    const data = result.data?.resultData || []
    state.userList = Array.isArray(data) ? data : []
  } catch (error) {
    console.error('GX 사용자 목록 조회 실패:', error)
    state.userList = []
  } finally {
    state.loadingUsers = false
  }
}

// 프로그램 선택
const selectProgram = async (programId) => {
  state.selectedProgramId = programId
  await fetchGxUsers()
}

// 대기 승인 모달 열기/닫기
const openPendingModal = () => {
  if (!selectedProgram.value || selectedProgram.value.pendingCount === 0) return
  state.modal.open = true
}

const closePendingModal = () => {
  state.modal.open = false
}

// 승인 후 재조회
const handleApproved = async () => {
  closePendingModal()
  await fetchGxPrograms()
}

// 상태 텍스트 / 클래스
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
    CONFIRMED: 'confirmed',
    PENDING: 'pending',
    CANCELLED: 'cancelled',
    COMPLETED: 'completed',
  }[status] || ''
}

// 월 변경 시 프로그램 목록 재조회
watch(
  () => props.selectedMonth,
  async () => {
    await fetchGxPrograms()
  },
  { immediate: true }
)
</script>

<template>
  <div class="gx-page">
    <div v-if="state.loadingPrograms" class="empty-text">GX 프로그램 데이터를 불러오는 중입니다.</div>
    <div class="gx-layout">
      <div class="program-panel">
        <div class="program-list">
          <div
            v-for="program in state.programList"
            :key="program.programId"
            class="program-item"
            :class="{ active: state.selectedProgramId === program.programId }"
            @click="selectProgram(program.programId)"
          >
            <div class="program-top">
              <p class="program-name">{{ displayMonth }} {{ program.facilityName }}</p>

              <span v-if="program.pendingCount > 0" class="pending-badge">
                대기 {{ program.pendingCount }}
              </span>
            </div>

            <div class="program-bottom">
              <div class="program-capacity">
                신청 {{ program.pendingCount + program.confirmedCount }} / 정원 {{ program.maxCapacity }}명
              </div>

              <div class="program-counts-right">
                <span class="count-chip confirmed-chip">확정 {{ program.confirmedCount }}</span>
                <span class="count-chip cancelled-chip">취소 {{ program.cancelledCount }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="selectedProgram" class="detail-panel">
        <div class="detail-head">
          <div>
            <h3 class="detail-title">{{ selectedProgram.name }}</h3>
            <p class="detail-desc">선택한 프로그램의 예약자 목록입니다.</p>
          </div>

          <button
            class="btn-approve"
            :disabled="selectedProgram.pendingCount === 0"
            @click="openPendingModal"
          >
            대기 인원 승인
          </button>
        </div>

        <table class="custom-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>이름</th>
              <th>세대</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!state.loadingUsers && state.userList.length === 0">
              <td colspan="4" class="empty-row">예약 데이터가 없습니다.</td>
            </tr>

            <tr v-for="user in state.userList" :key="user.reservationId">
              <td>{{ user.reservationId }}</td>
              <td>{{ user.userName }}</td>
              <td>{{ user.dong }} {{ user.ho }}</td>
              <td>
                <span class="status-badge" :class="statusClass(user.status)">
                  {{ statusLabel(user.status) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

      <AdminGxPendingModalView
        v-if="state.modal.open"
        :program="selectedProgram"
        :user-list="state.userList"
        @close="closePendingModal"
        @approved="handleApproved"
      />
  </div>
</template>

<style scoped>
.gx-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.gx-layout {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 20px;
}

.program-panel,
.detail-panel {
  border: 1px solid #E2E8F0;
  border-radius: 10px;
  background: #FFFFFF;
  padding: 16px;
}

.program-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.program-item {
  padding: 20px 24px;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  background: #F8FAFC;
  cursor: pointer;
  transition: all 0.15s;
}

.program-item:hover {
  background: #F1F5F9;
}

.program-item.active {
  background: #EEF2FF;
  border-color: #C7D2FE;
}

.program-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 28px;
}

.program-name {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  color: #1A202C;
  line-height: 1.4;
  font-family: 'Noto Sans KR', sans-serif;
}

.pending-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 10px;
  border-radius: 20px;
  background: #F6E3BF;
  color: #A35318;
  font-size: 12px;
  font-weight: 600;
  font-family: 'Noto Sans KR', sans-serif;
  flex-shrink: 0;
}

.program-bottom {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
}

.program-capacity {
  font-size: 14px;
  font-weight: 600;
  color: #757575;
  line-height: 1.5;
  font-family: 'Noto Sans KR', sans-serif;
}

.program-counts-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.count-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  font-family: 'Noto Sans KR', sans-serif;
}

.confirmed-chip {
  background: #D9F0DC;
  color: #2E7D32;
}

.cancelled-chip {
  background: #F8D9D9;
  color: #B93838;
}
.detail-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.detail-title {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: #1A202C;
  font-family: 'Noto Sans KR', sans-serif;
}

.detail-desc {
  margin: 6px 0 0;
  font-size: 12px;
  color: #718096;
  font-family: 'Noto Sans KR', sans-serif;
}

.btn-approve {
  height: 36px;
  padding: 0 14px;
  border: none;
  border-radius: 8px;
  background: #2B3A55;
  color: #FFFFFF;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  font-family: 'Noto Sans KR', sans-serif;
}

.btn-approve:disabled {
  background: #CBD5E1;
  cursor: not-allowed;
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
  background: #E6F4EA;
  color: #4D8B5A;
}

.status-badge.pending {
  background: #FFF3E0;
  color: #C08B2D;
}

.status-badge.cancelled {
  background: #FCE4EC;
  color: #E53E3E;
}

.status-badge.completed {
  background: #E2E8F0;
  color: #475569;
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

@media (max-width: 1200px) {
  .gx-layout {
    grid-template-columns: 1fr;
  }
}
</style>