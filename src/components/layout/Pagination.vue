<script setup>
import {computed} from 'vue'

// Props 정의
const props = defineProps({
  currentPage: Number, // 현재 페이지 번호
  maxPage: Number, // 전체 페이지 수
  totalAll: Number, // 전체 건수 (예: 세대 총합)
  totalFiltered: Number,  // 필터된 건수
  unit: {type: String, default: '건'} // 건수 단위
})

const emit = defineEmits(['change'])

const pageGroupSize = 10 // 한 번에 표시할 페이지 버튼 수

// 현재 페이지가 속한 그룹 번호 (1, 2, 3 ...)
const currentGroup = computed(() => Math.ceil(props.currentPage / pageGroupSize))

// 현재 그룹의 첫 번째 페이지 번호
const startPage = computed(() => (currentGroup.value - 1) * pageGroupSize + 1)

// 현재 그룹의 마지막 페이지 번호 (maxPage 초과 방지)
const endPage = computed(() => Math.min(currentGroup.value * pageGroupSize, props.maxPage))

// 현재 그룹에서 표시할 페이지 번호 배열
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
      <button class="page-btn" :disabled="currentPage === 1" @click="emit('change', 1)">&lt;&lt;</button>
      <button class="page-btn" :disabled="currentPage === 1" @click="emit('change', currentPage - 1)">&lt;</button>
      <span
          v-for="p in displayedPages" :key="p"
          class="page-btn" :class="{ active: p === currentPage }"
          @click="emit('change', p)"
      >{{ p }}</span>
      <button class="page-btn" :disabled="currentPage === maxPage || maxPage === 0"
              @click="emit('change', currentPage + 1)">&gt;
      </button>
      <button class="page-btn" :disabled="currentPage === maxPage || maxPage === 0" @click="emit('change', maxPage)">
        &gt;&gt;
      </button>
    </div>
    <div class="pagination-spacer"></div>
  </div>
</template>

<style scoped>
.pagination-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-top: 1px solid #E2E8F0;
}

.pagination-info, .pagination-spacer {
  flex: 1;
  font-size: 12px;
  color: #687282;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.page-btn {
  width: 30px;
  height: 30px;
  border: 1px solid #E2E8F0;
  border-radius: 6px;
  background: #fff;
  font-size: 12px;
  color: #687282;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

}

.page-btn:hover {
  background: #F5F6F8;
}

.page-btn.active {
  background: #2B3A55;
  color: #fff;
  border-color: #2B3A55;
}

.page-btn:disabled {
  color: #E2E8F0;
  cursor: default;
  background: #fff;
}

.page-btn:disabled:hover {
  background: #fff;
}
</style>