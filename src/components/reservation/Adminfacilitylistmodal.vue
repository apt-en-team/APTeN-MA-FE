<script setup>
import BaseModal from '@/components/common/BeseModel.vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  facilities: { type: Array, default: () => [] }
})
const emit   = defineEmits(['close'])
const router = useRouter()

const goToFacility = (facility) => {
  emit('close')
  router.push({ name: 'AdminFacilityCalendar', params: { typeId: facility.typeId } })
}
</script>

<template>
  <BaseModal title="시설 리스트" @close="$emit('close')">
    <div class="facility-grid">
      <button
        v-for="f in facilities"
        :key="f.typeId"
        class="facility-item"
        @click="goToFacility(f)"
      >
        <span class="facility-name">{{ f.name }}</span>
        <span class="facility-go">보러가기 →</span>
      </button>
    </div>
    <template #footer>
      <button class="btn-primary" @click="$emit('close')">닫기</button>
    </template>
  </BaseModal>
</template>

<style scoped>
.facility-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.facility-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 18px 20px; border-radius: 12px;
  background: #f1f3f4; border: none; cursor: pointer;
  transition: background 0.15s;
}
.facility-item:hover { background: #e8eaf6; }
.facility-name { font-size: 15px; font-weight: 500; color: #1E2533; }
.facility-go   { font-size: 12px; color: #888; }
.btn-primary   { padding: 9px 20px; border-radius: 8px; background: #1E2533; border: none; color: #fff; font-size: 14px; cursor: pointer; }
</style>