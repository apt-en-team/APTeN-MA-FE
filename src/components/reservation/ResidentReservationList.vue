<script setup>
// 일반 예약 카드
import ResidentReservationCard from '@/components/reservation/ResidentReservationCard.vue'
// GX 예약 카드
import ResidentGxReservationCard from '@/components/reservation/ResidentGxReservationCard.vue'

// 부모에서 받은 props
defineProps({
  list: {
    type: Array,
    default: () => [],
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
})

// 부모에 이벤트 전달
const emit = defineEmits(['detail', 'cancel'])
</script>

<template>
  <div class="reservation-list-wrap">
    <!-- 로딩 상태 -->
    <div v-if="isLoading" class="empty-box">
      예약 내역을 불러오는 중입니다.
    </div>

    <!-- 데이터 없을 때 -->
    <div v-else-if="list.length === 0" class="empty-box">
      조건에 맞는 예약 내역이 없습니다.
    </div>

    <!-- 데이터 있을 때 -->
    <div v-else class="reservation-list">
      <component
        v-for="item in list"
        :key="item.reservationId"
        :is="item.reservationType === 'GX' ? ResidentGxReservationCard : ResidentReservationCard"
        :item="item"
        @detail="emit('detail', item)"
        @cancel="emit('cancel', item)"
      />
    </div>
  </div>
</template>

<style scoped>
.reservation-list-wrap {
  min-height: 420px;
  padding: 20px;
}

.reservation-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.empty-box {
  min-height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed #E2E8F0;
  border-radius: 12px;
  background: #F8FAFC;
  color: #757575;
  font-size: 13px;
}
</style>