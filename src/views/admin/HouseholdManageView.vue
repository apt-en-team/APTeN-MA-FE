<script setup>
import { reactive, computed, onMounted } from 'vue'
import householdAPI from '@/api/household.js'

// ── 통계 카드 데이터 ──────────────────────────────────────────
const stats = reactive({
  total: 0, occupied: 0, empty: 0,
  needCare: 0, monthNew: 0, moveIn: 0, moveOut: 0,
})

const occupiedRate = computed(() => {
  if (!stats.total) return 0
  return ((stats.occupied / stats.total) * 100).toFixed(1)
})

// ── 목록 데이터 ───────────────────────────────────────────────
const households = reactive({ list: [] })

// ── 필터 ──────────────────────────────────────────────────────
const filter = reactive({ searchText: '', dong: '', status: '', type: '' })

const dongOptions = computed(() => {
  const set = new Set(households.list.map(h => h.dong))
  return [...set].sort()
})

const filteredList = computed(() =>
  households.list.filter(h => {
    const matchSearch = !filter.searchText || h.dong.includes(filter.searchText) || h.ho.includes(filter.searchText)
    const matchDong   = !filter.dong   || h.dong   === filter.dong
    const matchStatus = !filter.status || h.status === filter.status
    return matchSearch && matchDong && matchStatus
  })
)

const resetFilters = () => Object.assign(filter, { searchText: '', dong: '', status: '', type: '' })

// ── 체크박스 ──────────────────────────────────────────────────
const allChecked = computed({
  get: () => households.list.length > 0 && households.list.every(h => h.checked),
  set: (val) => households.list.forEach(h => h.checked = val),
})
const toggleAll = () => households.list.forEach(h => h.checked = allChecked.value)

// ── 페이지네이션 ──────────────────────────────────────────────
const pageSize   = 10
const pagination = reactive({ currentPage: 1, totalPages: 1 })

const pageNumbers = computed(() => {
  const pages = []
  const start = Math.max(1, pagination.currentPage - 2)
  const end   = Math.min(pagination.totalPages, pagination.currentPage + 2)
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

// ── 상태 스타일 ──────────────────────────────────────────────
const statusClass = (status) => {
  if (status === '입주')    return 'status-success'
  if (status === '퇴거')    return 'status-danger'
  if (status === '전출예정') return 'status-warning'
  return 'status-gray'
}

// ── 오늘 날짜 포맷 (YYYY.MM.DD) ──────────────────────────────
const todayFormatted = () => {
  const d  = new Date()
  const yy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yy}.${mm}.${dd}`
}

// ── 세대 추가 모달 ────────────────────────────────────────────
// AdminLayout 의 "+ 세대 추가" 버튼 클릭 → openModal() 호출로 열림
const modal = reactive({
  show:    false,   // 모달 표시 여부
  dong:    '',      // 동 (필수 | 백엔드 household.dong)
  ho:      '',      // 호수 (필수 | 백엔드 household.ho)
  // ── 아래 3개는 화면 표시용 (현재 백엔드 전송 안 함) ──────────
  // household 테이블에 없는 컬럼이므로 등록 후 별도 로직 필요 시 추가
  status:   '공실', // 입주 상태 - 신규 세대는 이력 없으므로 항상 공실
  carCount: '',     // 등록 차량 수 - vehicle 테이블에서 별도 관리
  regDate:  '',     // 등록일 - DB에서 created_at = NOW() 로 자동 저장
  memo:     '',     // 비고 - 현재 household 테이블에 컬럼 없음
  // ── 상태 ──────────────────────────────────────────────────
  error:   '',      // 에러 메시지 (예: "이미 존재하는 세대입니다")
  loading: false,   // 등록 중 버튼 비활성화용
})

// 모달 열기 (AdminLayout 에서 currentView.value?.openModal() 로 호출)
const openModal = () => {
  modal.show     = true
  modal.dong     = ''
  modal.ho       = ''
  modal.status   = '공실'
  modal.carCount = ''
  modal.regDate  = todayFormatted()  // 오늘 날짜 자동 입력
  modal.memo     = ''
  modal.error    = ''
  modal.loading  = false
}

// 모달 닫기
const closeModal = () => { modal.show = false }

// AdminLayout 의 ref="currentView" 에서 openModal() 을 호출할 수 있도록 노출
defineExpose({ openModal })

// ── API: 통계 조회 ────────────────────────────────────────────
// GET /api/admin/households/stats
const fetchStats = async () => {
  try {
    const res = await householdAPI.getStats()
    // 백엔드 응답: { resultMessage, resultData: { total, occupied, empty, ... } }
    // null 방어 처리 (데이터 없을 때 SUM() 이 null 반환할 수 있음)
    const d = res.data.resultData
    Object.assign(stats, {
      total:    d.total    ?? 0,
      occupied: d.occupied ?? 0,
      empty:    d.empty    ?? 0,
      needCare: d.needCare ?? 0,
      monthNew: d.monthNew ?? 0,
      moveIn:   d.moveIn   ?? 0,
      moveOut:  d.moveOut  ?? 0,
    })
  } catch (e) {
    console.error('통계 조회 실패', e)
  }
}

// ── API: 세대 목록 조회 (페이징) ─────────────────────────────
// GET /api/admin/households?page=0&size=10
const fetchHouseholds = async (page = 0) => {
  try {
    const res  = await householdAPI.getHouseholds(page, pageSize)
    // 백엔드 응답: { resultMessage, resultData: { content, page, totalPages, ... } }
    const data = res.data.resultData
    households.list        = data.content.map(h => ({ ...h, checked: false }))
    pagination.currentPage = data.page + 1   // 백엔드 0-based → 프론트 1-based
    pagination.totalPages  = data.totalPages
  } catch (e) {
    console.error('세대 목록 조회 실패', e)
  }
}

// ── API: 세대 등록 ────────────────────────────────────────────
// POST /api/admin/households  Body: { dong, ho }
// household 테이블 컬럼이 dong, ho, created_at 만 있으므로 그것만 전송
const submitCreate = async () => {
  // 필수값 검사
  if (!modal.dong.trim() || !modal.ho.trim()) {
    modal.error = '동과 호수를 모두 입력해주세요'
    return
  }

  modal.loading = true
  modal.error   = ''

  try {
    // 1단계: 세대 등록 (dong, ho → household 테이블)
    const res = await householdAPI.createHousehold({ dong: modal.dong, ho: modal.ho })
    const newId = res.data.resultData?.householdId

    // 2단계: 입주 상태가 공실이 아니면 이력 등록 (household_history 테이블)
    // 공실은 이력 없음 = 공실로 간주하는 비즈니스 로직
    if (modal.status !== '공실' && newId) {
      await householdAPI.createHistory(newId, { status: modal.status })
    }

    closeModal()
    // 등록 성공 후 목록 + 통계 재조회
    await fetchHouseholds()
    await fetchStats()
  } catch (e) {
    // 백엔드 에러 메시지 표시 (예: "이미 존재하는 세대입니다")
    modal.error = e.response?.data?.resultMessage || '세대 등록에 실패했습니다'
  } finally {
    modal.loading = false
  }
}

// ── 페이지 변경 ───────────────────────────────────────────────
const changePage = (page) => {
  fetchHouseholds(page - 1)  // 프론트 1-based → 백엔드 0-based 변환
}

// ── 컴포넌트 마운트 시 초기 데이터 로드 ─────────────────────
onMounted(() => {
  fetchStats()
  fetchHouseholds()
})
</script>

<template>
  <div class="household-page">

    <!-- 통계 카드 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">전체 세대</div>
        <div class="stat-value">{{ stats.total }} <span class="stat-unit">세대</span></div>
        <div class="stat-desc">등록 세대 기준</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">입주 세대</div>
        <div class="stat-value">{{ stats.occupied }} <span class="stat-unit">세대</span></div>
        <div class="stat-desc success">전체 대비 {{ occupiedRate }}%</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">공실 세대</div>
        <div class="stat-value">{{ stats.empty }} <span class="stat-unit">세대</span></div>
        <div class="stat-desc warning">관리 필요 {{ stats.needCare }}세대</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">이번 달 등록</div>
        <div class="stat-value">+{{ stats.monthNew }} <span class="stat-unit">세대</span></div>
        <div class="stat-desc">전입 {{ stats.moveIn }} · 전출 {{ stats.moveOut }}</div>
      </div>
    </div>

    <!-- 테이블 섹션 -->
    <div class="table-section">

      <!-- 필터 바 -->
      <div class="filter-bar">
        <div class="filter-left">
          <div class="search-wrap">
            <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input class="search-input" type="text" placeholder="동, 호수로 검색" v-model="filter.searchText" />
          </div>
          <select class="filter-select" v-model="filter.dong">
            <option value="">전체 동</option>
            <option v-for="dong in dongOptions" :key="dong" :value="dong">{{ dong }}</option>
          </select>
          <select class="filter-select" v-model="filter.status">
            <option value="">입주 상태</option>
            <option value="입주">입주</option>
            <option value="퇴거">퇴거</option>
            <option value="공실">공실</option>
            <option value="전출예정">전출예정</option>
          </select>
          <select class="filter-select" v-model="filter.type">
            <option value="">세대 유형</option>
            <option value="일반">일반</option>
            <option value="상가">상가</option>
          </select>
          <button class="btn-reset" @click="resetFilters">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            초기화
          </button>
        </div>
        <div class="filter-right">
          <button class="btn-excel">
            <span class="excel-icon">E</span> 엑셀 다운로드
          </button>
        </div>
      </div>

      <!-- 테이블 -->
      <table class="data-table">
        <thead>
          <tr>
            <th class="col-check"><input type="checkbox" v-model="allChecked" @change="toggleAll" /></th>
            <th>ID</th>
            <th>동</th>
            <th>호수</th>
            <th>등록일</th>
            <th>입주상태</th>
            <th>차량</th>
            <th>관리</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in filteredList" :key="item.householdId">
            <td class="col-check"><input type="checkbox" v-model="item.checked" /></td>
            <td class="col-id">#{{ item.householdId }}</td>
            <td>{{ item.dong }}</td>
            <td>{{ item.ho }}</td>
            <td>{{ item.createdAt ?? '-' }}</td>
            <td><span :class="['status-badge', statusClass(item.status)]">{{ item.status ?? '-' }}</span></td>
            <td>{{ item.carCount != null ? item.carCount + '대' : '-' }}</td>
            <td>
              <button v-if="item.status === '공실'" class="btn-register">등록</button>
              <span v-else class="col-empty">-</span>
            </td>
          </tr>
          <tr v-if="filteredList.length === 0">
            <td colspan="8" class="empty-row">데이터가 없습니다.</td>
          </tr>
        </tbody>
      </table>

      <!-- 페이지네이션 -->
      <div class="pagination-wrap">
        <div class="pagination-info">총 {{ stats.total }}세대 · 페이지당 {{ pageSize }}개</div>
        <div class="pagination">
          <button class="page-btn" :disabled="pagination.currentPage <= 1" @click="changePage(pagination.currentPage - 1)">‹</button>
          <button v-for="p in pageNumbers" :key="p" :class="['page-btn', pagination.currentPage === p ? 'active' : '']" @click="changePage(p)">{{ p }}</button>
          <button class="page-btn" :disabled="pagination.currentPage >= pagination.totalPages" @click="changePage(pagination.currentPage + 1)">›</button>
        </div>
        <div class="pagination-spacer"></div>
      </div>
    </div>

    <!-- ── 세대 등록 모달 ──────────────────────────────────────
         AdminLayout "+ 세대 추가" → openModal() → modal.show = true
         오버레이 클릭 시 닫힘
    ──────────────────────────────────────────────────────────── -->
    <div v-if="modal.show" class="modal-overlay" @click.self="closeModal">
      <div class="modal">

        <!-- 헤더 -->
        <div class="modal-header">
          <div>
            <h2 class="modal-title">세대 등록</h2>
            <p class="modal-subtitle">새 세대 정보를 입력해주세요</p>
          </div>
          <button class="modal-close" @click="closeModal">✕</button>
        </div>

        <!-- 바디 -->
        <div class="modal-body">

          <!-- 동 / 호수 (2열) -->
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">동 (dong) <span class="required">*</span></label>
              <input
                class="form-input"
                type="text"
                placeholder="예: 101동"
                v-model="modal.dong"
              />
            </div>
            <div class="form-group">
              <label class="form-label">호수 (ho) <span class="required">*</span></label>
              <input
                class="form-input"
                type="text"
                placeholder="예: 601호"
                v-model="modal.ho"
              />
            </div>
          </div>

          <!-- 입주 상태 / 등록 차량 수 (2열) -->
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">입주 상태 <span class="required">*</span></label>
              <select class="form-input form-select" v-model="modal.status">
                <option value="공실">공실</option>
                <option value="입주">입주</option>
                <option value="퇴거">퇴거</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">등록 차량 수</label>
              <!-- 차량은 vehicle 테이블에서 별도 관리 (현재는 표시만) -->
              <input
                class="form-input"
                type="text"
                placeholder="0대"
                v-model="modal.carCount"
                disabled
              />
            </div>
          </div>

          <!-- 등록일 -->
          <div class="form-group">
            <label class="form-label">등록일 <span class="required">*</span></label>
            <!-- DB에서 created_at = NOW() 자동 저장, 화면 표시만 -->
            <input
              class="form-input"
              type="text"
              v-model="modal.regDate"
              disabled
            />
          </div>

          <!-- 비고 (선택) -->
          <div class="form-group">
            <label class="form-label">비고 (선택)</label>
            <textarea
              class="form-input form-textarea"
              placeholder="관리자 메모 입력"
              v-model="modal.memo"
              rows="3"
            />
          </div>

          <!-- 안내 문구 -->
          <p class="form-hint">* 표시는 필수 입력 항목입니다.</p>

          <!-- 에러 메시지 (예: "이미 존재하는 세대입니다") -->
          <p v-if="modal.error" class="form-error">{{ modal.error }}</p>

        </div>

        <!-- 푸터 -->
        <div class="modal-footer">
          <button class="btn-cancel" @click="closeModal">취소</button>
          <button class="btn-submit" @click="submitCreate" :disabled="modal.loading">
            {{ modal.loading ? '등록 중...' : '등록하기' }}
          </button>
        </div>

      </div>
    </div>

  </div>
</template>

<style scoped>
* { box-sizing: border-box; margin: 0; padding: 0; }

.household-page {
  display: flex; flex-direction: column; gap: 20px;
  font-family: 'Noto Sans KR', sans-serif; color: #333333;
}

/* ── 통계 카드 ── */
.stats-grid { display: grid; grid-template-columns: repeat(4, 273px); gap: 14px; }

.stat-card {
  width: 273px; height: 139px; background: #fff; border-radius: 10px;
  padding: 22px 24px; border: 1px solid #E2E8F0;
  display: flex; flex-direction: column; justify-content: space-between;
}
.stat-label { font-size: 12px; color: #718096; font-weight: 500; }
.stat-value { font-size: 32px; font-weight: 700; color: #1A202C; line-height: 1; }
.stat-unit  { font-size: 14px; font-weight: 400; color: #A0AEC0; }
.stat-desc  { font-size: 12px; color: #A0AEC0; }
.stat-desc.success { color: #4D8B5A; }
.stat-desc.warning { color: #C08B2D; }

/* ── 테이블 섹션 ── */
.table-section { background: #fff; border-radius: 10px; border: 1px solid #E2E8F0; overflow: hidden; }

/* ── 필터 바 ── */
.filter-bar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 20px; border-bottom: 1px solid #E2E8F0;
}
.filter-left  { display: flex; align-items: center; gap: 8px; }
.filter-right { display: flex; align-items: center; }

.search-wrap {
  display: flex; align-items: center;
  border: 1px solid #E2E8F0; border-radius: 7px;
  padding: 7px 12px; gap: 6px; background: #F5F6F8;
}
.search-icon { color: #A0AEC0; flex-shrink: 0; }
.search-input {
  border: none; background: transparent; font-size: 13px;
  outline: none; color: #333; width: 150px; font-family: 'Noto Sans KR', sans-serif;
}
.search-input::placeholder { color: #CBD5E0; }

.filter-select {
  border: 1px solid #E2E8F0; border-radius: 7px;
  padding: 7px 28px 7px 12px; font-size: 13px; color: #333;
  background: #fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23A0AEC0' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat right 10px center;
  appearance: none; cursor: pointer; outline: none; font-family: 'Noto Sans KR', sans-serif;
}

.btn-reset {
  display: flex; align-items: center; gap: 5px;
  padding: 7px 12px; border: 1px solid #E2E8F0; border-radius: 7px;
  background: #fff; font-size: 12px; color: #718096; cursor: pointer;
  font-family: 'Noto Sans KR', sans-serif;
}
.btn-excel {
  display: flex; align-items: center; gap: 6px;
  padding: 7px 14px; border: 1px solid #E2E8F0; border-radius: 7px;
  background: #fff; font-size: 13px; color: #333; cursor: pointer;
  font-family: 'Noto Sans KR', sans-serif;
}
.excel-icon {
  background: #4D8B5A; color: #fff; width: 18px; height: 18px;
  border-radius: 3px; display: inline-flex; align-items: center;
  justify-content: center; font-size: 10px; font-weight: 700;
}

/* ── 테이블 ── */
.data-table { width: 100%; border-collapse: collapse; }
.data-table th {
  padding: 11px 16px; text-align: left; font-size: 12px;
  font-weight: 600; color: #718096; background: #F5F6F8; border-bottom: 1px solid #E2E8F0;
}
.data-table td { padding: 13px 16px; font-size: 13px; color: #333; border-bottom: 1px solid #E2E8F0; }
.data-table tr:last-child td { border-bottom: none; }
.data-table tbody tr:hover td { background: #F5F6F8; }
.col-check { width: 44px; }
.col-id    { color: #A0AEC0; }
.col-empty { color: #CBD5E0; }
.empty-row { text-align: center; color: #A0AEC0; font-size: 13px; padding: 48px 0; }

.status-badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
.status-success { background: #EBF5EE; color: #4D8B5A; }
.status-danger  { background: #FEE2E2; color: #E53E3E; }
.status-warning { background: #FEF3C7; color: #C08B2D; }
.status-gray    { background: #EDF2F7; color: #718096; }

.btn-register {
  padding: 4px 14px; background: #EBF5EE; color: #4D8B5A;
  border: 1px solid #C6E6CC; border-radius: 6px;
  font-size: 12px; font-weight: 600; cursor: pointer; font-family: 'Noto Sans KR', sans-serif;
}

/* ── 페이지네이션 ── */
.pagination-wrap {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 20px; border-top: 1px solid #E2E8F0;
}
.pagination-info,
.pagination-spacer { flex: 1; font-size: 12px; color: #A0AEC0; }
.pagination { display: flex; align-items: center; justify-content: center; gap: 4px; }
.page-btn {
  width: 30px; height: 30px; border: 1px solid #E2E8F0; border-radius: 6px;
  background: #fff; font-size: 12px; color: #718096; cursor: pointer;
  display: flex; align-items: center; justify-content: center; font-family: 'Noto Sans KR', sans-serif;
}
.page-btn:hover:not(:disabled) { background: #F5F6F8; }
.page-btn:disabled { opacity: 0.4; cursor: default; }
.page-btn.active   { background: #2B3A55; color: #fff; border-color: #2B3A55; }

/* ── 세대 등록 모달 ── */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.45);
  display: flex; align-items: center; justify-content: center; z-index: 1000;
}
.modal {
  background: #fff; border-radius: 12px; width: 480px;
  padding: 28px; box-shadow: 0 10px 40px rgba(0,0,0,0.15);
  max-height: 90vh; overflow-y: auto;
}
.modal-header {
  display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px;
}
.modal-title    { font-size: 18px; font-weight: 700; color: #1A202C; }
.modal-subtitle { font-size: 12px; color: #A0AEC0; margin-top: 3px; }
.modal-close    { background: none; border: none; font-size: 16px; color: #A0AEC0; cursor: pointer; flex-shrink: 0; }
.modal-close:hover { color: #333; }

.modal-body { display: flex; flex-direction: column; gap: 14px; }

/* 2열 레이아웃 (동/호수, 입주상태/차량수) */
.form-row   { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-label { font-size: 13px; font-weight: 600; color: #4A5568; }
.required   { color: #E53E3E; }

.form-input {
  border: 1px solid #E2E8F0; border-radius: 7px; padding: 10px 14px;
  font-size: 13px; color: #333; outline: none;
  font-family: 'Noto Sans KR', sans-serif; transition: border-color 0.15s;
  width: 100%;
}
.form-input:focus  { border-color: #2B3A55; }
.form-input:disabled { background: #F5F6F8; color: #A0AEC0; cursor: default; }
.form-input::placeholder { color: #CBD5E0; }

.form-select { appearance: none; cursor: pointer; }

.form-textarea {
  resize: none;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 13px;
}

/* 안내/에러 문구 */
.form-hint  { font-size: 12px; color: #A0AEC0; margin-top: 2px; }
.form-error { font-size: 12px; color: #E53E3E; margin-top: 2px; }

.modal-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px; }
.btn-cancel {
  padding: 9px 20px; border: 1px solid #E2E8F0; border-radius: 7px;
  background: #fff; font-size: 13px; color: #718096; cursor: pointer;
  font-family: 'Noto Sans KR', sans-serif;
}
.btn-cancel:hover { background: #F5F6F8; }
.btn-submit {
  padding: 9px 24px; background: #2B3A55; color: #fff;
  border: none; border-radius: 7px; font-size: 13px; font-weight: 600;
  cursor: pointer; font-family: 'Noto Sans KR', sans-serif;
}
.btn-submit:hover:not(:disabled) { background: #1E2A3E; }
.btn-submit:disabled { opacity: 0.5; cursor: default; }
</style>