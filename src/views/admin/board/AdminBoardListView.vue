<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBoardStore } from '@/stores/modules/board'
import StatsGrid  from '@/components/admin/StatsCards.vue'
import DataTable  from '@/components/admin/AdminTable.vue'
import FilterBar  from '@/components/layout/FilterBar.vue'
import Pagination from '@/components/layout/Pagination.vue'
import Modal from '@/components/Modal.vue'

const router = useRouter()
const boardStore = useBoardStore()

// ── 탭 ───────────────────────────────────────────────────────
const activeTab = ref('ALL') // 'ALL' | 'NOTICE' | 'FREE'

// ── 필터 ─────────────────────────────────────────────────────
const searchKeyword = ref('')
const filterCategory = ref('')
const filterDeleted  = ref('')

// ── 페이지 ───────────────────────────────────────────────────
const currentPage = ref(1)
const PAGE_SIZE   = 9

// ── 데이터 불러오기 ───────────────────────────────────────────
const loading = ref(false)

async function fetchData() {
  loading.value = true
  try {
    const category = activeTab.value === 'ALL' ? '' : activeTab.value
    await boardStore.fetchAdminPosts({ category, page: currentPage.value, size: PAGE_SIZE })
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)

// ── 탭 변경 ──────────────────────────────────────────────────
function setTab(tab) {
  activeTab.value  = tab
  currentPage.value = 1
  filterCategory.value = '' // 탭 변경 시 카테고리 필터 초기화
  fetchData()
}

// ── 필터 초기화 ───────────────────────────────────────────────
function resetFilters() {
  searchKeyword.value  = ''
  filterCategory.value = ''
  filterDeleted.value  = ''
}

// ── 목록 (프론트 필터링) ──────────────────────────────────────
const posts = computed(() => boardStore.adminPosts ?? [])

const filteredPosts = computed(() => {
  return posts.value.filter(p => {
    const kw = searchKeyword.value.trim().toLowerCase()
    const matchKw  = !kw || p.title.toLowerCase().includes(kw) || p.authorName?.toLowerCase().includes(kw)
    const matchCat = !filterCategory.value || p.category === filterCategory.value
    const matchDel = filterDeleted.value === '' || String(p.isDeleted) === filterDeleted.value
    return matchKw && matchCat && matchDel
  })
})

// ── 통계 카드 (API 없으므로 totalCount 활용) ──────────────────
const stats = computed(() => [
  {
    label: '전체 게시글',
    value: boardStore.adminTotalCount ?? 0,
    unit: '개',
    desc: `공지 · 자유 전체`,
  },
  {
    label: '오늘 작성',
    value: '-',
    unit: '개',
    desc: '통계 API 연동 후 표시',
  },
  {
    label: '전체 댓글',
    value: '-',
    unit: '개',
    desc: '통계 API 연동 후 표시',
  },
  {
    label: '삭제된 글',
    value: '-',
    unit: '개',
    desc: '통계 API 연동 후 표시',
  },
])

// ── 테이블 컬럼 ───────────────────────────────────────────────
const columns = [
  { label: 'ID',     key: 'boardId' },
  { label: '카테고리', key: 'category' },
  { label: '제목',    key: 'title' },
  { label: '작성자',  key: 'authorName' },
  { label: '댓글',    key: 'commentCount' },
  { label: '조회',    key: 'viewCount' },
  { label: '작성일',  key: 'createdAt' },
  { label: '삭제여부', key: 'isDeleted' },
]

// ── 날짜 포맷 ─────────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return '-'
  return dateStr.replace('T', ' ').slice(0, 10)
}

// ── 페이지 변경 ───────────────────────────────────────────────
function onPageChange(page) {
  currentPage.value = page
  fetchData()
}

// ── 탭별 카운트 ───────────────────────────────────────────────
const tabCounts = computed(() => ({
  ALL:    boardStore.adminTotalCount ?? 0,
  NOTICE: boardStore.adminNoticeTotalCount ?? 0,
  FREE:   boardStore.adminFreeTotalCount ?? 0,
  INQUIRY: boardStore.adminInquiryTotalCount ?? 0,
}))
</script>

<template>
  <div class="admin-board">

    <!-- 통계 카드 -->
    <StatsGrid :stats="stats" />

    <!-- 메인 카드 -->
    <div class="board-card">

      <!-- 탭 -->
      <div class="tab-bar">
        <button class="tab-btn" :class="{ active: activeTab === 'ALL' }" @click="setTab('ALL')">
          전체 <span class="tab-count">{{ tabCounts.ALL }}</span>
        </button>
        <button class="tab-btn" :class="{ active: activeTab === 'NOTICE' }" @click="setTab('NOTICE')">
          공지사항 <span class="tab-count">{{ tabCounts.NOTICE }}</span>
        </button>
        <button class="tab-btn" :class="{ active: activeTab === 'FREE' }" @click="setTab('FREE')">
          자유게시판 <span class="tab-count">{{ tabCounts.FREE }}</span>
        </button>
        <button class="tab-btn" :class="{ active: activeTab === 'INQUIRY' }" @click="setTab('INQUIRY')">
          문의사항 <span class="tab-count">{{ tabCounts.INQUIRY }}</span>
        </button>
      </div>

      <!-- 필터 -->
      <FilterBar @reset="resetFilters">
        <!-- 검색 -->
        <div class="search-wrap">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="13" height="13">
            <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/>
          </svg>
          <input v-model="searchKeyword" class="search-input" placeholder="제목, 작성자 검색" />
        </div>

        <!-- 카테고리 필터 -->
        <select v-model="filterCategory" class="filter-select">
          <option value="">카테고리</option>
          <option value="NOTICE">공지</option>
          <option value="FREE">자유</option>
          <option value="INQUIRY">문의</option>
        </select>

        <!-- 삭제여부 필터 -->
        <select v-model="filterDeleted" class="filter-select">
          <option value="">삭제 여부</option>
          <option value="0">정상</option>
          <option value="1">삭제</option>
        </select>
      </FilterBar>

      <!-- 테이블 -->
      <DataTable
        :columns="columns"
        :rows="filteredPosts"
        @row-click="row => router.push(`/admin/boards/${row.boardId}`)"
      >
        <!-- ID -->
        <template #cell-boardId="{ row }">
          #{{ row.boardId }}
        </template>

        <!-- 카테고리 배지 -->
        <template #cell-category="{ row }">
          <span class="badge" :class="row.category === 'NOTICE' ? 'badge-notice' : 'badge-free'">
            {{ row.category === 'NOTICE' ? '공지' : row.category === 'FREE' ? '자유' : '문의' }}
          </span>
        </template>

        <!-- 제목 + 댓글수 -->
        <template #cell-title="{ row }">
          <span class="title-text">{{ row.title }}</span>
          <span v-if="row.commentCount > 0" class="comment-count">[{{ row.commentCount }}]</span>
        </template>

        <!-- 작성일 -->
        <template #cell-createdAt="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>

        <!-- 삭제여부 -->
        <template #cell-isDeleted="{ row }">
          <span class="status-badge" :class="row.isDeleted ? 'status-deleted' : 'status-normal'">
            {{ row.isDeleted ? '삭제' : '정상' }}
          </span>
        </template>
      </DataTable>

      <!-- 페이지네이션 -->
      <Pagination
        :current-page="currentPage"
        :max-page="boardStore.adminMaxPage ?? 1"
        :total-all="boardStore.adminTotalCount ?? 0"
        :total-filtered="filteredPosts.length"
        unit="개"
        @change="onPageChange"
      />
    </div>
  </div>
</template>

<style scoped>
.admin-board { display: flex; flex-direction: column; gap: 0; }

/* 메인 카드 */
.board-card {
  background: #fff;
  border-radius: 10px;
  border: 1px solid #E2E8F0;
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
  border: none; background: transparent;
  font-size: 13px; font-weight: 500; color: #718096;
  cursor: pointer; border-bottom: 2px solid transparent;
  margin-bottom: -1px; transition: all 0.15s;
  font-family: 'Noto Sans KR', sans-serif;
  display: flex; align-items: center; gap: 6px;
}
.tab-btn:hover { color: #2B3A55; }
.tab-btn.active { color: #2B3A55; font-weight: 700; border-bottom-color: #2B3A55; }
.tab-count {
  font-size: 11px; font-weight: 600;
  background: #F5F6F8; color: #718096;
  padding: 1px 7px; border-radius: 99px;
}
.tab-btn.active .tab-count { background: #2B3A55; color: #fff; }

/* 검색 */
.search-wrap { position: relative; }
.search-icon {
  position: absolute; left: 9px; top: 50%;
  transform: translateY(-50%); stroke: #A0AEC0;
}
.search-input {
  padding: 7px 12px 7px 28px;
  border: 1px solid #E2E8F0; border-radius: 7px;
  font-size: 13px; outline: none; width: 200px;
  font-family: 'Noto Sans KR', sans-serif;
}
.search-input:focus { border-color: #2B3A55; }

/* 필터 셀렉트 */
.filter-select {
  padding: 7px 28px 7px 10px;
  border: 1px solid #E2E8F0; border-radius: 7px;
  font-size: 13px; color: #374151; outline: none;
  background: #fff; cursor: pointer;
  font-family: 'Noto Sans KR', sans-serif;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23A0AEC0'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
}

/* 배지 */
.badge {
  display: inline-block; font-size: 11px; font-weight: 700;
  padding: 2px 8px; border-radius: 4px;
}
.badge-notice { background: #2B3A55; color: #fff; }
.badge-free   { background: #EEF2FF; color: #4338CA; }

/* 제목 */
.title-text { font-weight: 500; color: #1A202C; }
.comment-count { font-size: 12px; color: #4973E5; margin-left: 4px; }

/* 상태 배지 */
.status-badge {
  display: inline-block; font-size: 11px; font-weight: 600;
  padding: 3px 10px; border-radius: 99px;
}
.status-normal  { background: #C6F6D5; color: #276749; }
.status-deleted { background: #FED7D7; color: #9B2C2C; }
</style>