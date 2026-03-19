<script setup>
import { reactive, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AdminStudyRoomStatus from '@/components/reservation/AdminStudyRoomStatus.vue'
import AdminGymStatus from '@/components/reservation/AdminGymStatus.vue'
import AdminGolfStatus from '@/components/reservation/AdminGolfStatus.vue'
import AdminGxStatus from '@/components/reservation/AdminGxStatus.vue'

const route = useRoute()
const router = useRouter()

// 시설 타입 탭 목록
const facilityTypeTabs = [
  { typeId: 1, name: '독서실' },
  { typeId: 2, name: '헬스장' },
  { typeId: 3, name: '골프연습장' },
  { typeId: 4, name: 'GX' },
]

// 상단 공통 상태
// typeId / date / month / 요약칩 상태
const state = reactive({
  selectedTypeId: 1,
  selectedDate: new Date().toISOString().slice(0, 10),
  selectedMonth: new Date().toISOString().slice(0, 7),

  // 독서실 요약
  studySummary: {
    maleReservedCount: 0,
    maleTotalCount: 12,
    femaleReservedCount: 0,
    femaleTotalCount: 12,
  },

  // 헬스장 요약
  gymSummary: {
    totalCount: 0,
    confirmedCount: 0,
    cancelledCount: 0,
  },
})

// 자식 컴포넌트에서 올려준 요약 데이터 반영
const updateStudySummary = (summary) => {
  state.studySummary = {
    maleReservedCount: summary?.maleReservedCount || 0,
    maleTotalCount: summary?.maleTotalCount || 12,
    femaleReservedCount: summary?.femaleReservedCount || 0,
    femaleTotalCount: summary?.femaleTotalCount || 12,
  }
}

const updateGymSummary = (summary) => {
  state.gymSummary = {
    totalCount: summary?.totalCount || 0,
    confirmedCount: summary?.confirmedCount || 0,
    cancelledCount: summary?.cancelledCount || 0,
  }
}

// 라우트 파라미터와 동기화
const syncTypeIdFromRoute = () => {
  const typeId = Number(route.params.typeId || 1)
  state.selectedTypeId = [1, 2, 3, 4].includes(typeId) ? typeId : 1
}

// 탭 클릭 시 페이지 이동
const changeType = (typeId) => {
  router.push(`/admin/reservations/facility-status/${typeId}`)
}

// 현재 타입에 따른 요약칩 표시 여부
const showStudySummary = computed(() => state.selectedTypeId === 1)
const showGymSummary = computed(() => state.selectedTypeId === 2)

// 라우트 변경 감지
watch(
  () => route.params.typeId,
  () => {
    syncTypeIdFromRoute()
  }
)

onMounted(() => {
  syncTypeIdFromRoute()
})
</script>

<template>
  <div class="facility-status-page">
    <!-- 상단 제어 카드 -->
    <div class="top-controls-card">
      <!-- 탭 영역 -->
      <div class="tab-bar">
        <button
          v-for="tab in facilityTypeTabs"
          :key="tab.typeId"
          class="tab-btn"
          :class="{ active: state.selectedTypeId === tab.typeId }"
          @click="changeType(tab.typeId)"
        >
          {{ tab.name }}
        </button>
      </div>

      <!-- 필터 + 요약칩 영역 -->
      <div class="top-filter-area">
        <!-- 날짜/월 필터 -->
        <div class="filter-left">
          <template v-if="state.selectedTypeId !== 4">
            <label class="filter-label">조회 날짜</label>
            <input v-model="state.selectedDate" class="date-input" type="date" />
          </template>

          <template v-else>
            <label class="filter-label">조회 월</label>
            <input v-model="state.selectedMonth" class="date-input" type="month" />
          </template>
        </div>

        <!-- 요약칩 -->
        <div class="filter-right">
          <!-- 독서실 요약칩 -->
          <template v-if="showStudySummary">
            <div class="summary-chip study-chip">
              남자 독서실 {{ state.studySummary.maleReservedCount }}/{{ state.studySummary.maleTotalCount }}
            </div>
            <div class="summary-chip study-chip">
              여자 독서실 {{ state.studySummary.femaleReservedCount }}/{{ state.studySummary.femaleTotalCount }}
            </div>
          </template>

          <!-- 헬스장 요약칩 -->
          <template v-if="showGymSummary">
            <div class="summary-chip gym-chip">
              총 예약 {{ state.gymSummary.totalCount }}명
            </div>
            <div class="summary-chip confirmed-chip">
              확정 {{ state.gymSummary.confirmedCount }}명
            </div>
            <div class="summary-chip cancelled-chip">
              취소 {{ state.gymSummary.cancelledCount }}명
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- 본문 카드 -->
    <div class="content-card">
      <AdminStudyRoomStatus
        v-if="state.selectedTypeId === 1"
        :selected-date="state.selectedDate"
        @update-summary="updateStudySummary"
      />

      <AdminGymStatus
        v-else-if="state.selectedTypeId === 2"
        :selected-date="state.selectedDate"
        @update-summary="updateGymSummary"
      />

      <AdminGolfStatus
        v-else-if="state.selectedTypeId === 3"
        :selected-date="state.selectedDate"
      />

      <AdminGxStatus
        v-else-if="state.selectedTypeId === 4"
        :selected-month="state.selectedMonth"
      />
    </div>
  </div>
</template>

<style scoped>
.facility-status-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #F5F6F8;
}

/* 상단 제어 카드 */
.top-controls-card {
  background: #fff;
  border: 1px solid #E2E8F0;
  border-radius: 10px;
  overflow: hidden;
}

/* 탭 */
.tab-bar {
  display: flex;
  gap: 0;
  border-bottom: 1px solid #E2E8F0;
  padding: 0 20px;
}

.tab-btn {
  padding: 14px 16px;
  border: none;
  background: transparent;
  font-size: 13px;
  font-weight: 500;
  color: #718096;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: all 0.15s;
  font-family: 'Noto Sans KR', sans-serif;
}

.tab-btn:hover {
  color: #2B3A55;
}

.tab-btn.active {
  color: #2B3A55;
  font-weight: 700;
  border-bottom-color: #2B3A55;
}

/* 필터 */
.top-filter-area {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 20px;
  background: #ffffff;
}

.filter-left,
.filter-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.filter-label {
  font-size: 13px;
  font-weight: 600;
  color: #718096;
  font-family: 'Noto Sans KR', sans-serif;
}

.date-input {
  padding: 7px 12px;
  border: 1px solid #E2E8F0;
  border-radius: 7px;
  font-size: 13px;
  color: #374151;
  outline: none;
  font-family: 'Noto Sans KR', sans-serif;
}

.summary-chip {
  height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  font-weight: 700;
  font-family: 'Noto Sans KR', sans-serif;
}

.study-chip {
  background: #e8eaf6;
  color: #3949ab;
}

.gym-chip {
  background: #EDF2F7;
  color: #718096;
}

.confirmed-chip {
  background: #e6f4ea;
  color: #2e7d32;
}

.cancelled-chip {
  background: #fce4ec;
  color: #E53E3E;
}

/* 본문 카드 */
.content-card {
  background: #ffffff;
  border: 1px solid #E2E8F0;
  border-radius: 10px;
  padding: 20px;
  min-height: 520px;
}
</style>