<script setup>
//카드 컴포넌트
import ResidentReservationCard from '@/components/reservation/ResidentReservationCard.vue'

//props
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

//이벤트
const emit = defineEmits(['detail', 'cancel'])
</script>

<template>
  <div class="reservation-list-wrap">
    <!--로딩-->
    <div v-if="isLoading" class="empty-box">
      예약 내역을 불러오는 중입니다.
    </div>

    <!--빈값-->
    <div v-else-if="list.length === 0" class="empty-box">
      조건에 맞는 예약 내역이 없습니다.
    </div>

    <!--리스트-->
    <div v-else class="reservation-list">
      <ResidentReservationCard
        v-for="item in list"
        :key="item.reservationId"
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