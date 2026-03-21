<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useBoardStore } from '@/stores/modules/board'
import { useRouter } from 'vue-router'
import AdminTable from '@/components/admin/AdminTable.vue'
import FilterBar from '@/components/layout/FilterBar.vue'
import Pagination from '@/components/layout/Pagination.vue'

const router = useRouter()
const boardStore = useBoardStore()
const loading = ref(false)

// ── 상태 ──────────────────────────────────────────────────────
const searchKeyword  = ref('')
const selectedAuthor = ref('')
const currentPage    = ref(1)
const perPage        = 9
const hoveredId      = ref(-1)

// ── 테이블 컬럼 정의 ──────────────────────────────────────────
const columns = [
  { label: 'ID',    key: 'boardId' },
  { label: '제목',  key: 'title' },
  { label: '작성자', key: 'authorName' },
  { label: '댓글',  key: 'commentCount' },
  { label: '조회',  key: 'viewCount' },
  { label: '작성일', key: 'createdAt' },
]

// ── 데이터 불러오기 ──────────────────────────────────────────
onMounted(async () => {
  loading.value = true
  try {
    await boardStore.fetchNotices()
  } finally {
    loading.value = false
  }
  document.addEventListener('click', onOutsideClick)
})

// ── 날짜 포맷 ─────────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return ''
  return dateStr.replace('T', ' ').slice(0, 10)
}

// ── 필터링 & 페이징 ───────────────────────────────────────────
const filtered = computed(() => {
  return (boardStore.notices || []).filter(n => {
    const kw = searchKeyword.value.trim().toLowerCase()
    const matchKw  = !kw || n.title.toLowerCase().includes(kw)
    const matchAut = !selectedAuthor.value || n.authorName === selectedAuthor.value
    return matchKw && matchAut
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / perPage)))

const paginated = computed(() => {
  const start = (currentPage.value - 1) * perPage
  return filtered.value.slice(start, start + perPage)
})

function goPage(p) {
  if (p < 1 || p > totalPages.value) return
  currentPage.value = p
}

// ── 드롭다운 ─────────────────────────────────────────────────
const openDropdown = ref(null)

function toggleDropdown(name) {
  openDropdown.value = openDropdown.value === name ? null : name
}
function selectAuthor(val) {
  selectedAuthor.value = val
  openDropdown.value = null
  onFilterChange()
}
function onOutsideClick(e) {
  if (!e.target.closest('.custom-select')) openDropdown.value = null
}
onUnmounted(() => document.removeEventListener('click', onOutsideClick))

function resetFilters() {
  searchKeyword.value  = ''
  selectedAuthor.value = ''
  currentPage.value    = 1
  openDropdown.value   = null
}

function onFilterChange() { currentPage.value = 1 }

// ── 열람 처리 ─────────────────────────────────────────────────
const readIds = ref(new Set(JSON.parse(localStorage.getItem('readNoticeIds') || '[]')))

function openNotice(notice) {
  readIds.value.add(notice.boardId)
  localStorage.setItem('readNoticeIds', JSON.stringify([...readIds.value]))
  router.push(`/resident/board/notice/${notice.boardId}`)
}
</script>

<template>
  <div class="notice-page">

    <!-- 툴바 -->
    <FilterBar @reset="resetFilters">
      <!-- 검색 -->
      <div class="search-wrap">
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/>
        </svg>
        <input
          v-model="searchKeyword"
          class="search-input"
          placeholder="관련검색어 입력"
          @input="onFilterChange"
        />
      </div>

      <!-- 작성자 드롭다운 -->
      <div class="custom-select" :class="{ open: openDropdown === 'author' }">
        <button class="cs-trigger" @click.stop="toggleDropdown('author')">
          <span :class="{ 'cs-placeholder': !selectedAuthor }">{{ selectedAuthor || '작성자' }}</span>
          <svg class="cs-arrow" viewBox="0 0 10 6" width="10" height="6">
            <path d="M0 0l5 6 5-6z" fill="currentColor"/>
          </svg>
        </button>
        <div class="cs-dropdown" v-show="openDropdown === 'author'">
          <div class="cs-option" :class="{ selected: !selectedAuthor }" @click="selectAuthor('')">전체</div>
          <div class="cs-option" :class="{ selected: selectedAuthor === '관리자' }" @click="selectAuthor('관리자')">관리자</div>
          <div class="cs-option" :class="{ selected: selectedAuthor === '관리사무소' }" @click="selectAuthor('관리사무소')">관리사무소</div>
          <div class="cs-option" :class="{ selected: selectedAuthor === '입주자 대표' }" @click="selectAuthor('입주자 대표')">입주자 대표</div>
        </div>
      </div>
    </FilterBar>

    <!-- 테이블 -->
    <AdminTable
      :columns="columns"
      :rows="paginated"
      @row-click="openNotice"
    >
      <!-- ID 셀: 역순 번호 -->
      <template #cell-boardId="{ row, index }">
        #{{ filtered.length - ((currentPage - 1) * perPage + paginated.indexOf(row)) }}
      </template>

      <!-- 제목 셀: 공지 배지 + 댓글 수 -->
      <template #cell-title="{ row }">
        <span class="badge-gong">공지</span>
        <span class="title-text">{{ row.title }}</span>
        <span v-if="row.commentCount > 0" class="comment-count">[{{ row.commentCount }}]</span>
      </template>

      <!-- 작성일 셀: 포맷 -->
      <template #cell-createdAt="{ row }">
        {{ formatDate(row.createdAt) }}
      </template>

      <!-- 열람 여부 헤더 -->
      <template #action-header>열람 여부</template>

      <!-- 관리(열람) 버튼 -->
      <template #action="{ row }">
        <button
          class="btn-detail"
          :class="{ 'btn-read': readIds.has(row.boardId) }"
          @click.stop="openNotice(row)"
        >
          {{ readIds.has(row.boardId) ? '열람완료' : '열람' }}
        </button>
      </template>
    </AdminTable>

    <!-- 페이지네이션 -->
    <Pagination
      :currentPage="currentPage"
      :maxPage="totalPages"
      :totalAll="boardStore.notices?.length ?? 0"
      :totalFiltered="filtered.length"
      unit="개"
      @change="goPage"
    />

  </div>
</template>

<style scoped>
.notice-page {
  width: 100%;
}

/* ── 검색 ───────────────────────────────────────────────────── */
.search-wrap {
  position: relative;
  flex: 0 0 220px;
}
.search-icon {
  position: absolute;
  left: 10px; top: 50%; transform: translateY(-50%);
  width: 14px; height: 14px; stroke: #B0B5C3;
}
.search-input {
  width: 100%;
  padding: 8px 12px 8px 32px;
  border: 1px solid #E0E3EB;
  border-radius: 8px;
  font-size: 13px;
  background: #fff;
  color: #333;
  outline: none;
  transition: border-color 0.15s;
}
.search-input:focus { border-color: #4973E5; }
.search-input::placeholder { color: #B0B5C3; }

/* ── 커스텀 드롭다운 ─────────────────────────────────────────── */
.custom-select { position: relative; }
.cs-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border: 1px solid #E0E3EB;
  border-radius: 8px;
  background: #fff;
  font-size: 13px;
  color: #333;
  cursor: pointer;
  white-space: nowrap;
  transition: border-color 0.15s, box-shadow 0.15s;
  min-width: 110px;
}
.cs-trigger:hover { border-color: #4973E5; }
.custom-select.open .cs-trigger {
  border-color: #4973E5;
  box-shadow: 0 0 0 3px rgba(73,115,229,0.12);
}
.cs-placeholder { color: #B0B5C3; }
.cs-arrow {
  margin-left: auto;
  color: #B0B5C3;
  transition: transform 0.2s;
  flex-shrink: 0;
}
.custom-select.open .cs-arrow { transform: rotate(180deg); color: #4973E5; }
.cs-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  min-width: 100%;
  background: #fff;
  border: 1px solid #E0E3EB;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(73,115,229,0.10), 0 2px 8px rgba(0,0,0,0.06);
  z-index: 200;
  padding: 4px;
}
.cs-option {
  padding: 9px 12px;
  font-size: 13px;
  color: #444;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.1s, color 0.1s;
}
.cs-option:hover { background: #EEF3FB; color: #4973E5; }
.cs-option.selected { color: #4973E5; font-weight: 600; background: #EEF3FB; }

/* ── 제목 셀 ─────────────────────────────────────────────────── */
.badge-gong {
  display: inline-block;
  background: #4973E5;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  margin-right: 6px;
  vertical-align: middle;
}
.title-text {
  color: #1A1A2E;
  font-weight: 500;
  vertical-align: middle;
}
.comment-count {
  font-size: 12px;
  color: #4973E5;
  margin-left: 4px;
  vertical-align: middle;
}

/* ── 테이블 래퍼 border-radius ───────────────────────────────── */
:deep(.data-table) {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #E8EBF0;
}
:deep(.data-table tbody tr:hover td) {
  background: #F4F7FE;
  color: #333;
}

/* ── 페이지네이션 active 색상 override (#2B3A55 → #4973E5) ───── */
:deep(.page-btn.active) {
  background: #4973E5;
  border-color: #4973E5;
  color: #fff;
}
:deep(.page-btn:hover:not(:disabled)) {
  color: #fff;
  background-color: #416adb;
}

/* ── 열람 버튼 ───────────────────────────────────────────────── */
.btn-detail {
  padding: 5px 14px;
  border: 1px solid #D1D8F0;
  border-radius: 6px;
  background: #fff;
  font-size: 12px;
  color: #4973E5;
  cursor: pointer;
  font-weight: 600;
  white-space: nowrap;
  transition: background 0.12s, border-color 0.12s;
}
.btn-detail:hover { background: #EEF3FB; border-color: #4973E5; }
.btn-read {
  background: #f3f4f6;
  color: #9ca3af;
  border-color: #e5e7eb;
  cursor: default;
}
</style>