<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

// ── 데이터 상태 ───────────────────────────────────────────────
const allNotices = ref([])
const loading    = ref(false)

// TODO: Spring Boot API 연동 시 아래 주석 해제
// async function fetchNotices() {
//   loading.value = true
//   try {
//     const res = await axios.get('/api/notices')
//     allNotices.value = res.data
//   } catch (e) {
//     console.error('공지사항 조회 실패', e)
//   } finally {
//     loading.value = false
//   }
// }
// onMounted(fetchNotices)

// ── 상태 ──────────────────────────────────────────────────────
const searchKeyword  = ref('')
const selectedCat    = ref('')
const selectedAuthor = ref('')
const currentPage    = ref(1)
const perPage        = 9
const hoveredId      = ref(null)
const selectedId     = ref(null)
const showModal      = ref(false)
const selectedNotice = ref(null)

const categories = ['시설 청소', '정기 점검', '관리비', '안전', '행사']

// ── 필터링 & 페이징 ───────────────────────────────────────────
const filtered = computed(() => {
  return allNotices.value.filter(n => {
    const kw = searchKeyword.value.trim().toLowerCase()
    const matchKw  = !kw || n.title.toLowerCase().includes(kw) || n.category.toLowerCase().includes(kw)
    const matchCat = !selectedCat.value  || n.category === selectedCat.value
    const matchAut = !selectedAuthor.value || n.author === selectedAuthor.value
    return matchKw && matchCat && matchAut
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / perPage)))

const paginated = computed(() => {
  const start = (currentPage.value - 1) * perPage
  return filtered.value.slice(start, start + perPage)
})

const pageNumbers = computed(() => {
  const total = totalPages.value
  const cur   = currentPage.value
  let nums = []
  if (total <= 7) {
    nums = Array.from({ length: total }, (_, i) => i + 1)
  } else if (cur <= 4) {
    for (let i = 1; i <= 5; i++) nums.push(i)
    nums.push(-1) // 앞쪽 ellipsis
    nums.push(total)
  } else if (cur >= total - 3) {
    nums.push(1)
    nums.push(-2) // 뒤쪽 ellipsis
    for (let i = total - 4; i <= total; i++) nums.push(i)
  } else {
    nums.push(1)
    nums.push(-1)
    for (let i = cur - 1; i <= cur + 1; i++) nums.push(i)
    nums.push(-2)
    nums.push(total)
  }
  return nums // 음수는 ellipsis, 양수는 페이지 번호
})

function goPage(p) {
  if (p < 1 || p > totalPages.value) return
  currentPage.value = p
}

// 모달 열릴 때 body 스크롤 잠금
watch(showModal, (val) => {
  document.body.style.overflow = val ? 'hidden' : ''
})

const openDropdown = ref(null) // 'cat' | 'author' | null

function toggleDropdown(name) {
  openDropdown.value = openDropdown.value === name ? null : name
}
function selectCat(val) {
  selectedCat.value = val
  openDropdown.value = null
  onFilterChange()
}
function selectAuthor(val) {
  selectedAuthor.value = val
  openDropdown.value = null
  onFilterChange()
}
function onOutsideClick(e) {
  if (!e.target.closest('.custom-select')) openDropdown.value = null
}
onMounted(()   => document.addEventListener('click', onOutsideClick))
onUnmounted(() => document.removeEventListener('click', onOutsideClick))

function resetFilters() {
  searchKeyword.value  = ''
  selectedCat.value    = ''
  selectedAuthor.value = ''
  currentPage.value    = 1
  openDropdown.value   = null
}

// 검색/필터 변경 시 1페이지로
function onFilterChange() { currentPage.value = 1 }

// ── 모달 ──────────────────────────────────────────────────────
function openNotice(notice) {
  selectedId.value     = notice.id
  selectedNotice.value = notice
  showModal.value      = true
  // 조회수 증가 (UX)
  notice.views++
}
function closeModal() {
  showModal.value = false
  setTimeout(() => { selectedNotice.value = null }, 250)
}

// ── 태그 색상 ─────────────────────────────────────────────────
function tagClass(tag) {
  if (tag === '신규')   return 'tag-new'
  if (tag === '수정됨') return 'tag-edit'
  return 'tag-default'
}
</script>

<template>
  <div class="notice-page">

    <!-- 툴바 -->
    <div class="toolbar">
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

      <!-- 카테고리 드롭다운 -->
      <div class="custom-select" :class="{ open: openDropdown === 'cat' }">
        <button class="cs-trigger" @click.stop="toggleDropdown('cat')">
          <span :class="{ 'cs-placeholder': !selectedCat }">{{ selectedCat || '카테고리' }}</span>
          <svg class="cs-arrow" viewBox="0 0 10 6" width="10" height="6">
            <path d="M0 0l5 6 5-6z" fill="currentColor"/>
          </svg>
        </button>
        <div class="cs-dropdown" v-show="openDropdown === 'cat'">
          <div class="cs-option" :class="{ selected: !selectedCat }" @click="selectCat('')">전체</div>
          <div
            v-for="c in categories" :key="c"
            class="cs-option" :class="{ selected: selectedCat === c }"
            @click="selectCat(c)"
          >{{ c }}</div>
        </div>
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
          <div class="cs-option" :class="{ selected: selectedAuthor === '관리사무소' }" @click="selectAuthor('관리사무소')">관리사무소</div>
        </div>
      </div>

      <button class="btn-reset" @click="resetFilters">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="13" height="13">
          <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"/>
        </svg>
        초기화
      </button>

    </div>

    <!-- 테이블 -->
    <div class="table-wrap">
      <table class="notice-table">
        <thead>
          <tr>
            <th class="col-check"><input type="checkbox" /></th>
            <th class="col-id">ID</th>
            <th class="col-cat">카테고리</th>
            <th class="col-title">제목</th>
            <th class="col-author">작성자</th>
            <th class="col-comments">댓글</th>
            <th class="col-views">조회</th>
            <th class="col-date">작성일</th>
            <th class="col-change">변경내역</th>
            <th class="col-action">상세보기</th>
          </tr>
        </thead>
        <tbody>

          <!-- 데이터 없음 -->
          <tr v-if="paginated.length === 0">
            <td colspan="10">
              <div class="empty-state">
                <div class="empty-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" width="40" height="40">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 1 1 0-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 0 1-1.44-4.282m3.102.069a18.03 18.03 0 0 1-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 0 1 8.835 2.535M10.34 6.66a23.847 23.847 0 0 0 8.835-2.535m0 0A23.74 23.74 0 0 0 18.795 3m.38 1.125a23.91 23.91 0 0 1 1.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 0 0 1.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 0 1 0 3.46"/>
                  </svg>
                </div>
                <p class="empty-title">등록된 공지사항이 없습니다</p>
                <p class="empty-sub">
                  {{ searchKeyword || selectedCat || selectedAuthor ? '검색 조건을 변경하거나 초기화해 주세요.' : '아직 작성된 공지사항이 없습니다.' }}
                </p>
                <button v-if="searchKeyword || selectedCat || selectedAuthor" class="btn-reset-inline" @click="resetFilters">필터 초기화</button>
              </div>
            </td>
          </tr>

          <!-- 목록 -->
          <tr
            v-for="notice in paginated"
            :key="notice.id"
            class="notice-row"
            :class="{
              'row-pinned':   notice.pinned,
              'row-hovered':  hoveredId  === notice.id,
              'row-selected': selectedId === notice.id,
            }"
            @mouseenter="hoveredId = notice.id"
            @mouseleave="hoveredId = null"
            @click="openNotice(notice)"
          >
            <td class="col-check" @click.stop><input type="checkbox" /></td>
            <td class="col-id">
              <span v-if="notice.pinned" class="pin-icon" title="고정">📌</span>
              <span v-else>#{{ notice.id }}</span>
            </td>
            <td class="col-cat"><span class="cat-label">{{ notice.category }}</span></td>
            <td class="col-title">
              <span class="badge-gong">공지</span>
              <span class="title-text" :class="{ 'title-pinned': notice.pinned }">{{ notice.title }}</span>
              <span v-if="notice.comments > 0" class="comment-count">[{{ notice.comments }}]</span>
            </td>
            <td class="col-author">{{ notice.author }}</td>
            <td class="col-comments">{{ notice.comments }}</td>
            <td class="col-views">{{ notice.views }}</td>
            <td class="col-date">{{ notice.date }}</td>
            <td class="col-change">
              <span v-for="tag in notice.tags" :key="tag" class="tag" :class="tagClass(tag)">{{ tag }}</span>
            </td>
            <td class="col-action">
              <button class="btn-detail" @click.stop="openNotice(notice)">열람</button>
            </td>
          </tr>

        </tbody>
      </table>
    </div>

    <!-- 페이지네이션 -->
    <div class="pagination" v-if="filtered.length > 0">
      <button class="page-btn" :disabled="currentPage === 1" @click="goPage(currentPage - 1)">‹</button>
      <template v-for="p in pageNumbers" :key="p">
        <span v-if="p < 0" class="page-ellipsis">…</span>
        <button
          v-else
          class="page-btn"
          :class="{ active: p === currentPage }"
          @click="goPage(p)"
        >{{ p }}</button>
      </template>
      <button class="page-btn" :disabled="currentPage === totalPages" @click="goPage(currentPage + 1)">›</button>
    </div>

    <!-- 요약 -->
    <p class="summary">총 {{ filtered.length }}개 · 페이지당 {{ perPage }}개</p>

  </div>

  <!-- ── 상세 모달 ── -->
  <Transition name="modal-fade">
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-box" v-if="selectedNotice">
        <div class="modal-header">
          <div class="modal-meta">
            <span class="badge-gong">공지</span>
            <span class="modal-cat">{{ selectedNotice.category }}</span>
          </div>
          <button class="modal-close" @click="closeModal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <h2 class="modal-title">{{ selectedNotice.title }}</h2>
        <div class="modal-info">
          <span>{{ selectedNotice.author }}</span>
          <span>·</span>
          <span>{{ selectedNotice.date }}</span>
          <span>·</span>
          <span>조회 {{ selectedNotice.views }}</span>
          <span v-for="tag in selectedNotice.tags" :key="tag" class="tag ml-6" :class="tagClass(tag)">{{ tag }}</span>
        </div>
        <div class="modal-divider"/>
        <div class="modal-body">
          <p>안녕하세요, <strong>APTEN 관리사무소</strong>입니다.</p>
          <p>입주민 여러분의 쾌적한 주거 환경을 위해 아래와 같이 안내 드립니다.</p>
          <br/>
          <p><strong>■ 작업 일시</strong></p>
          <p>2025년 12월 15일(일) 오전 09:00 ~ 오후 13:00</p>
          <br/>
          <p><strong>■ 작업 내용</strong></p>
          <p>지하 1층 ~ 지하 3층 주차장 전체 청소 작업</p>
          <br/>
          <p><strong>■ 유의사항</strong></p>
          <p>작업 시간 동안 해당 구역 차량 이동이 제한될 수 있으니 양해 부탁드립니다. 작업 전날인 12월 14일(토) 자정까지 차량을 이동해 주시기 바랍니다.</p>
          <br/>
          <p>문의사항은 관리사무소(☎ 02-0000-0000)로 연락 주시기 바랍니다.</p>
          <p>감사합니다.</p>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* ── 기본 ───────────────────────────────────────────────────── */
.notice-page {
  width: 100%;
}

/* ── 툴바 ───────────────────────────────────────────────────── */
.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

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

/* 커스텀 드롭다운 */
.custom-select {
  position: relative;
}
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
  overflow: hidden;
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

.btn-reset {
  display: flex; align-items: center; gap: 5px;
  padding: 8px 14px;
  border: 1px solid #E0E3EB;
  border-radius: 8px;
  background: #fff;
  font-size: 13px; color: #555;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-reset:hover { background: #F5F6FA; }

/* ── 테이블 ─────────────────────────────────────────────────── */
.table-wrap {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #E8EBF0;
}

.notice-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.notice-table thead tr {
  background: #F8F9FC;
  border-bottom: 1px solid #E8EBF0;
}

.notice-table th {
  padding: 11px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #888;
  text-align: center;
  white-space: nowrap;
}

/* 컬럼 너비 */
.col-check    { width: 36px; }
.col-id       { width: 50px; }
.col-cat      { width: 100px; }
.col-title    { text-align: left !important; min-width: 280px; white-space: normal; }
.col-author   { width: 90px; }
.col-comments { width: 44px; }
.col-views    { width: 52px; }
.col-date     { width: 96px; }
.col-change   { width: 100px; }
.col-action   { width: 80px; }

/* 행 */
.notice-row td {
  padding: 12px 12px;
  border-bottom: 1px solid #F0F2F6;
  text-align: center;
  color: #555;
  white-space: nowrap;
  transition: background 0.12s;
  cursor: pointer;
}

.notice-row:last-child td { border-bottom: none; }

.notice-row.row-hovered td  { background: #F4F7FE; }
.notice-row.row-selected td { background: #EEF3FB; }
.notice-row.row-pinned td   { background: #FAFBFF; }
.notice-row.row-pinned.row-hovered td { background: #EEF3FB; }

/* 핀 아이콘 */
.pin-icon { font-size: 13px; }

/* 카테고리 라벨 */
.cat-label {
  font-size: 11px;
  color: #777;
  background: #F0F2F6;
  padding: 3px 7px;
  border-radius: 4px;
  white-space: nowrap;
}

/* 공지 배지 */
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
  flex-shrink: 0;
}

/* 제목 */
.col-title { display: table-cell; }
.title-text {
  color: #1A1A2E;
  font-weight: 500;
  vertical-align: middle;
  transition: color 0.12s;
}
.row-hovered .title-text { color: #4973E5; }
.title-pinned { font-weight: 700; }
.comment-count { font-size: 12px; color: #4973E5; margin-left: 4px; vertical-align: middle; }

/* 태그 */
.tag {
  display: inline-block;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 4px;
  margin-right: 4px;
}
.tag-new     { background: #DCFCE7; color: #15803D; border: 1px solid #BBF7D0; }
.tag-edit    { background: #FEF3C7; color: #92400E; border: 1px solid #FDE68A; }
.tag-default { background: #F0F2F6; color: #666; }
.ml-6 { margin-left: 6px; }

/* 열람 버튼 */
.btn-detail {
  padding: 5px 14px;
  border: 1px solid #D1D8F0;
  border-radius: 6px;
  background: #fff;
  font-size: 12px; color: #4973E5;
  cursor: pointer;
  font-weight: 600;
  white-space: nowrap;
  transition: background 0.12s, border-color 0.12s;
}
.btn-detail:hover { background: #EEF3FB; border-color: #4973E5; }

/* ── 빈 상태 ─────────────────────────────────────────────────── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 24px;
  gap: 8px;
}
.empty-icon {
  width: 72px; height: 72px;
  background: #EEF3FB;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 8px;
  color: #9BB3EF;
}
.empty-title {
  font-size: 15px; font-weight: 700; color: #444;
}
.empty-sub {
  font-size: 13px; color: #999; text-align: center;
}
.btn-reset-inline {
  margin-top: 8px;
  padding: 8px 20px;
  background: #4973E5;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13px; font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-reset-inline:hover { background: #3860CC; }

/* ── 페이지네이션 ────────────────────────────────────────────── */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-top: 20px;
}
.page-btn {
  min-width: 32px; height: 32px;
  border: 1px solid #E0E3EB;
  border-radius: 6px;
  background: #fff;
  font-size: 13px; color: #555;
  cursor: pointer;
  transition: background 0.12s, border-color 0.12s, color 0.12s;
  display: flex; align-items: center; justify-content: center;
}
.page-btn:hover:not(:disabled) { background: #EEF3FB; border-color: #4973E5; color: #4973E5; }
.page-btn.active { background: #4973E5; border-color: #4973E5; color: #fff; font-weight: 700; }
.page-btn:disabled { opacity: 0.35; cursor: default; }
.page-ellipsis { font-size: 13px; color: #B0B5C3; padding: 0 4px; }

/* ── 요약 ───────────────────────────────────────────────────── */
.summary {
  font-size: 12px;
  color: #999;
  text-align: left;
  margin-top: 12px;
}

/* ── 모달 ───────────────────────────────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(10, 15, 40, 0.35);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-box {
  background: #fff;
  border-radius: 16px;
  width: 640px;
  max-width: calc(100vw - 32px);
  max-height: 80vh;
  overflow-y: auto;
  padding: 28px 32px;
  box-shadow: 0 20px 60px rgba(73, 115, 229, 0.15), 0 4px 16px rgba(0,0,0,0.08);
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.modal-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}
.modal-cat {
  font-size: 12px;
  color: #777;
  background: #F0F2F6;
  padding: 3px 8px;
  border-radius: 4px;
}
.modal-close {
  width: 32px; height: 32px;
  border: 1px solid #E8EBF0;
  border-radius: 8px;
  background: #fff;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  color: #666;
  transition: background 0.12s;
}
.modal-close:hover { background: #F5F6FA; }

.modal-title {
  font-size: 18px;
  font-weight: 700;
  color: #1A1A2E;
  line-height: 1.4;
  margin-bottom: 10px;
}
.modal-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #999;
  flex-wrap: wrap;
}
.modal-divider {
  height: 1px;
  background: #E8EBF0;
  margin: 16px 0;
}
.modal-body {
  font-size: 14px;
  line-height: 1.8;
  color: #444;
}
.modal-body strong { color: #1A1A2E; }

/* ── 트랜지션 ────────────────────────────────────────────────── */
.modal-fade-enter-active,
.modal-fade-leave-active { transition: opacity 0.2s ease; }
.modal-fade-enter-from,
.modal-fade-leave-to { opacity: 0; }
</style>