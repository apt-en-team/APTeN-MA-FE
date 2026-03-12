<script setup>
import { computed } from 'vue'

const props = defineProps({
  currentPage: Number,
  maxPage:     Number,
  totalAll:    Number,   // 전체 건수 (예: 세대 총합)
  totalFiltered: Number, // 필터된 건수
  unit:        { type: String, default: '건' }
})
const emit = defineEmits(['change'])

const pageGroupSize = 10
const currentGroup  = computed(() => Math.ceil(props.currentPage / pageGroupSize))
const startPage     = computed(() => (currentGroup.value - 1) * pageGroupSize + 1)
const endPage       = computed(() => Math.min(currentGroup.value * pageGroupSize, props.maxPage))
const displayedPages = computed(() => {
  const pages = []
  for (let i = startPage.value; i <= endPage.value; i++) pages.push(i)
  return pages
})
</script>

<template>
  <div class="pagination-wrap">
    <div class="pagination-info">
      총 {{ totalAll }}{{ unit }} 중 {{ totalFiltered }}{{ unit }} 조회
    </div>
    <div class="pagination">
      <button class="page-btn" :disabled="currentPage === 1"       @click="emit('change', 1)">&lt;&lt;</button>
      <button class="page-btn" :disabled="currentPage === 1"       @click="emit('change', currentPage - 1)">&lt;</button>
      <span
        v-for="p in displayedPages" :key="p"
        class="page-btn" :class="{ active: p === currentPage }"
        @click="emit('change', p)"
      >{{ p }}</span>
      <button class="page-btn" :disabled="currentPage === maxPage || maxPage === 0" @click="emit('change', currentPage + 1)">&gt;</button>
      <button class="page-btn" :disabled="currentPage === maxPage || maxPage === 0" @click="emit('change', maxPage)">&gt;&gt;</button>
    </div>
    <div class="pagination-spacer"></div>
  </div>
</template>

<style scoped>
.pagination-wrap { display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; border-top: 1px solid #E2E8F0; }
.pagination-info, .pagination-spacer { flex: 1; font-size: 12px; color: #A0AEC0; }
.pagination { display: flex; align-items: center; justify-content: center; gap: 4px; }
.page-btn { width: 30px; height: 30px; border: 1px solid #E2E8F0; border-radius: 6px; background: #fff; font-size: 12px; color: #718096; cursor: pointer; display: flex; align-items: center; justify-content: center; font-family: 'Noto Sans KR', sans-serif; }
.page-btn:hover   { background: #F5F6F8; }
.page-btn.active  { background: #2B3A55; color: #fff; border-color: #2B3A55; }
.page-btn:disabled { color: #E2E8F0; cursor: default; background: #fff; }
.page-btn:disabled:hover { background: #fff; }
</style>