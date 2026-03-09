<script setup>
import { reactive, computed, onMounted } from 'vue'
import householdAPI from '@/api/household.js'
import BaseModal from '@/components/common/BeseModel.vue'

const state = reactive({
  // 세대 목록
  list: [],
  dongOptions: [],   // 백엔드에서 전체 동 목록 받아옴

  // 통계 카드
  total:    0,
  occupied: 0,
  empty:    0,
  needCare: 0,
  monthNew: 0,
  moveIn:   0,
  moveOut:  0,

  // 필터
  dong:       '',
  ho:         '',
  status:     '',

  // 페이지네이션
  size:        10,
  currentPage: 1,
  maxPage:     0,
})

// 세대 상세 모달
const detailModal = reactive({
  show:      false,
  item:      null,
  residents: [],
  loading:   false,
})

// 세대 수정 모달 
const editModal = reactive({
  show:    false,
  item:    null,
  selectedUserIds: [],
  status:  '',
  loading: false,
  error:   '',
})

// 승인 확인 모달
const confirmModal = reactive({
  show: false, item: null, users: [], loading: false,
})


// ─────────────────────────────────────────────
//  computed
// ─────────────────────────────────────────────

const occupiedRate = computed(() => {
  if (!state.total) return 0
  return ((state.occupied / state.total) * 100).toFixed(1)
})

const allChecked = computed({
  get: () => state.list.length > 0 && state.list.every(h => h.checked),
  set: (val) => state.list.forEach(h => h.checked = val),
})

const pageGroupSize  = 10
const currentGroup   = computed(() => Math.ceil(state.currentPage / pageGroupSize))
const startPage      = computed(() => (currentGroup.value - 1) * pageGroupSize + 1)
const endPage        = computed(() => Math.min(currentGroup.value * pageGroupSize, state.maxPage))
const displayedPages = computed(() => {
  const pages = []
  for (let i = startPage.value; i <= endPage.value; i++) pages.push(i)
  return pages
})

const statusClass = (status) => {
  if (status === '입주') return 'status-success'
  if (status === '퇴거') return 'status-danger'
  return 'status-gray'
}

const todayFormatted = () => {
  const d = new Date()
  return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`
}

// 이름 첫 글자 아바타
const nameInitial = (name) => name ? name.charAt(0) : '?'


// ─────────────────────────────────────────────
//  이벤트 핸들러
// ─────────────────────────────────────────────

const toggleAll = () => state.list.forEach(h => h.checked = allChecked.value)

const resetFilters = () => {
  state.ho = ''; state.dong = ''; state.status = ''
  doSearch()
}

const doSearch = () => {
  state.currentPage = 1
  getMaxPage()
  goToList()
}

const isNeedCare = (item) => {
  if (item.status !== '퇴거' && item.status !== '공실') return false
  const oneMonthAgo = new Date()
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
  return new Date(item.createdAt) <= oneMonthAgo
}


// ─────────────────────────────────────────────
//  API 통신 함수
// ─────────────────────────────────────────────

const fetchStats = async () => {
  try {
    const result = await householdAPI.getStats()
    const d = result.data.resultData
    state.total    = d.total    ?? 0
    state.occupied = d.occupied ?? 0
    state.empty    = d.empty    ?? 0
    state.needCare = d.needCare ?? 0
    state.moveIn   = d.moveIn   ?? 0
    state.moveOut  = d.moveOut  ?? 0
    state.monthNew = state.moveIn + state.moveOut
  } catch (e) { console.error('통계 조회 실패', e) }
}

const fetchDongs = async () => {
  try {
    const result = await householdAPI.getDongs()
    state.dongOptions = result.data.resultData
  } catch (e) { console.error('동 목록 조회 실패', e) }
}

const getMaxPage = async () => {
  try {
    const result = await householdAPI.getMaxPage(state.size, state.dong, state.ho, state.status)
    state.maxPage = result.data.resultData
  } catch (e) { console.error('maxPage 조회 실패', e) }
}

const goToList = async () => {
  try {
    const result = await householdAPI.getHouseholds(state.currentPage, state.size, state.dong, state.ho, state.status)
    state.list = result.data.resultData.map(h => ({ ...h, checked: false }))
  } catch (e) { console.error('세대 목록 조회 실패', e) }
}

const goToPage = (page) => { state.currentPage = page; goToList() }
const up     = () => { if (state.currentPage >= state.maxPage) return; goToPage(state.currentPage + 1) }
const down   = () => { if (state.currentPage <= 1) return; goToPage(state.currentPage - 1) }
const endup  = () => goToPage(state.maxPage)
const stdown = () => goToPage(1)

// 입주상태 수정 → household_history 에 이력 등록
const submitEdit = async () => {
  if (!editModal.status) { editModal.error = '입주 상태를 선택해주세요'; return }
  if (editModal.status === editModal.item?.status) { editModal.error = '현재와 동일한 상태입니다'; return }

  // if (editModal.status === '퇴거' && editModal.selectedUserIds.length === 0) {
  //   editModal.error = '퇴거할 입주민을 1명 이상 선택해주세요'
  //   return
  // }

  editModal.loading = true; editModal.error = ''
  try {
if (editModal.status === '퇴거') {
  if (editModal.selectedUserIds.length > 0) {
    // 입주민 있으면 선택한 사람 각각 퇴거 처리
    for (const userId of editModal.selectedUserIds) {
      await householdAPI.createHistory(editModal.item.householdId, {
        status: '퇴거',
        userId: userId
      })
    }
  } else {
    // 입주민 없으면 userId null 로 이력만 등록
    await householdAPI.createHistory(editModal.item.householdId, {
      status: '퇴거',
      userId: null
    })
  }
} else {
  await householdAPI.createHistory(editModal.item.householdId, {
    status: editModal.status,
    userId: null
  })
}
    closeEditModal(); fetchStats(); goToList()
  } catch (e) {
    editModal.error = e.response?.data?.resultMessage || '수정에 실패했습니다'
  } finally { editModal.loading = false }
}

// 승인
const handleApprove = async (userId) => {
  try {
    await householdAPI.approveUser(userId)
    confirmModal.users = confirmModal.users.filter(u => u.userId !== userId)
    if (confirmModal.users.length === 0) { closeConfirmModal(); fetchStats(); goToList() }
  } catch (e) { console.error('승인 실패', e) }
}

// 거부
const handleReject = async (userId) => {
  try {
    await householdAPI.rejectUser(userId)
    confirmModal.users = confirmModal.users.filter(u => u.userId !== userId)
    if (confirmModal.users.length === 0) { closeConfirmModal(); goToList() }
  } catch (e) { console.error('거부 실패', e) }
}

onMounted(() => { fetchStats(); fetchDongs(); getMaxPage(); goToList() })


// ─────────────────────────────────────────────
//  모달 열기 / 닫기
// ─────────────────────────────────────────────

const openModal = () => {
  modal.show = true; modal.dong = ''; modal.ho = ''
  modal.status = '공실'; modal.regDate = todayFormatted()
  modal.memo = ''; modal.error = ''; modal.loading = false
}
const closeModal = () => { modal.show = false }
defineExpose({ openModal })

// 세대 상세 - 입주민 목록도 함께 조회
const openDetailModal = async (item, householdId) => {
  const id = householdId ?? item.householdId
  const target = item ?? state.list.find(h => h.householdId === id)
  detailModal.item      = target
  detailModal.residents = []
  detailModal.show      = true
  detailModal.loading   = true
  try {
    const result = await householdAPI.getResidents(id)
    detailModal.residents = result.data.resultData
  } catch (e) { console.error('입주민 조회 실패', e) }
  finally { detailModal.loading = false }
}
const closeDetailModal = () => { detailModal.show = false }

// 세대 수정 모달 - 상세 모달에서 수정 버튼 클릭 시
const openEditModal = () => {
  editModal.item    = detailModal.item
  editModal.status  = detailModal.item?.status ?? '공실'
  editModal.selectedUserIds = []
  editModal.error   = ''
  editModal.loading = false
  editModal.show    = true
  detailModal.show  = false   // 상세 모달 닫고 수정 모달 열기
}
const closeEditModal = () => { editModal.show = false }

// 승인 확인 모달
const openConfirmModal = async (e, item) => {
  e.stopPropagation()
  confirmModal.item = item; confirmModal.show = true
  confirmModal.users = []; confirmModal.loading = true
  try {
    const result = await householdAPI.getPendingUsers(item.householdId)
    confirmModal.users = result.data.resultData
  } catch (e) { console.error('대기 유저 조회 실패', e) }
  finally { confirmModal.loading = false }
}
const closeConfirmModal = () => { confirmModal.show = false }
</script>

<template>
  <div class="household-page">

    <!-- 통계 카드 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">전체 세대</div>
        <div class="stat-value">{{ state.total }}<span class="stat-unit"> 세대</span></div>
        <div class="stat-desc">등록 세대 기준</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">입주 세대</div>
        <div class="stat-value">{{ state.occupied }}<span class="stat-unit"> 세대</span></div>
        <div class="stat-desc success">전체 대비 {{ occupiedRate }}%</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">공실 세대</div>
        <div class="stat-value">{{ state.empty }}<span class="stat-unit"> 세대</span></div>
        <div class="stat-desc warning">관리 필요 {{ state.needCare }}세대</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">이번 달 변동</div>
        <div class="stat-value">{{ state.monthNew }}<span class="stat-unit"> 건</span></div>
        <div class="stat-desc">전입 {{ state.moveIn }} · 전출 {{ state.moveOut }}</div>
      </div>
    </div>

    <div class="table-section">

      <!-- 필터 바 -->
      <div class="filter-bar">
        <div class="filter-left">
          <div class="search-wrap">
            <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input class="search-input" type="text" placeholder="호수로 검색" v-model="state.ho" @keyup.enter="doSearch" />
          </div>
          <select class="filter-select" v-model="state.dong" @change="doSearch">
            <option value="">전체 동</option>
            <option v-for="dong in state.dongOptions" :key="dong" :value="dong">{{ dong }}</option>
          </select>
          <select class="filter-select" v-model="state.status" @change="doSearch">
            <option value="">입주 상태</option>
            <option value="입주">입주</option>
            <option value="퇴거">퇴거</option>
            <option value="공실">공실</option>
          </select>
          <button class="btn-reset" @click="resetFilters">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            초기화
          </button>
        </div>
      </div>

      <!-- 테이블 -->
      <div v-if="state.list.length === 0" class="empty-row">데이터가 없습니다.</div>
      <table v-else class="data-table">
        <thead>
          <tr>
            <th class="col-check"><input type="checkbox" v-model="allChecked" @change="toggleAll" /></th>
            <th>ID</th><th>동</th><th>호수</th><th>등록일</th>
            <th>입주상태</th><th>차량</th><th>관리</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in state.list" :key="item.householdId" @click="openDetailModal(item)">
            <td class="col-check"><input type="checkbox" v-model="item.checked" @click.stop /></td>
            <td class="col-id">#{{ item.householdId }}</td>
            <td>{{ item.dong }}</td>
            <td>{{ item.ho }}</td>
            <td>{{ item.createdAt ?? '-' }}</td>
            <td><span :class="['status-badge', statusClass(item.status)]">{{ item.status ?? '-' }}</span></td>
            <td>{{ item.carCount != null ? item.carCount + '대' : '-' }}</td>
            <td>
              <button v-if="item.pendingCount > 0" class="btn-register"
                @click.stop="openConfirmModal($event, item)">
                승인요청 ({{ item.pendingCount }})
              </button>
              <button v-else-if="isNeedCare(item)" class="btn-warning">
                장기공실
              </button>
              <span v-else class="col-empty">-</span>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- 페이지네이션 -->
      <div class="pagination-wrap">
        <div class="pagination-info">총 {{ state.total }}세대 · 페이지당 {{ state.size }}개</div>
        <div class="pagination">
          <button v-show="state.currentPage !== 1" class="page-btn" @click="stdown">&lt;&lt;</button>
          <button v-show="state.currentPage !== 1" class="page-btn" @click="down">&lt;</button>
          <span v-for="item in displayedPages" :key="item" class="page-btn"
            :class="{ active: item === state.currentPage }" @click="goToPage(item)">{{ item }}</span>
          <button v-show="state.currentPage !== state.maxPage" class="page-btn" @click="up">&gt;</button>
          <button v-show="state.currentPage !== state.maxPage" class="page-btn" @click="endup">&gt;&gt;</button>
        </div>
        <div class="pagination-spacer"></div>
      </div>
    </div>

    <!-- ── 세대 상세 모달  ── -->
    <BaseModal v-if="detailModal.show" title="세대 상세 정보" :subtitle="'ID #' + detailModal.item?.householdId" @close="closeDetailModal">

      <!-- 상태 배지 + 동/호 타이틀 -->
      <div class="detail-hero">
        <span :class="['detail-status-badge', statusClass(detailModal.item?.status)]">
          {{ detailModal.item?.status ?? '공실' }}
        </span>
        <h2 class="detail-title">{{ detailModal.item?.dong }} {{ detailModal.item?.ho }}</h2>
        <p class="detail-sub">세대 정보</p>
      </div>

      <div class="detail-divider"></div>

      <!-- 세대 정보 그리드 -->
      <div class="detail-grid">
        <div class="detail-cell">
          <span class="detail-cell-label">세대 ID</span>
          <span class="detail-cell-value">#{{ detailModal.item?.householdId }}</span>
        </div>
        <div class="detail-cell">
          <span class="detail-cell-label">등록일</span>
          <span class="detail-cell-value">{{ detailModal.item?.createdAt ?? '-' }}</span>
        </div>
        <div class="detail-cell">
          <span class="detail-cell-label">동 (dong)</span>
          <span class="detail-cell-value">{{ detailModal.item?.dong }}</span>
        </div>
        <div class="detail-cell">
          <span class="detail-cell-label">호수 (ho)</span>
          <span class="detail-cell-value">{{ detailModal.item?.ho }}</span>
        </div>
        <div class="detail-cell">
          <span class="detail-cell-label">입주 상태</span>
          <span class="detail-cell-value">{{ detailModal.item?.status ?? '공실' }}</span>
        </div>
        <div class="detail-cell">
          <span class="detail-cell-label">등록 차량 수</span>
          <span class="detail-cell-value">{{ detailModal.item?.carCount != null ? detailModal.item.carCount + '대' : '-' }}</span>
        </div>
      </div>

      <div class="detail-divider"></div>

      <!-- 등록 입주민 -->
      <div class="detail-section-title">등록 입주민</div>
      <div v-if="detailModal.loading" class="detail-empty">조회 중...</div>
      <div v-else-if="detailModal.residents.length === 0" class="detail-empty">등록된 입주민이 없습니다.</div>
      <div v-else v-for="r in detailModal.residents" :key="r.userId" class="resident-row">
        <div class="resident-avatar">{{ nameInitial(r.name) }}</div>
        <div class="resident-info">
          <span class="resident-name">{{ r.name }}</span>
          <span class="resident-contact">{{ r.phone }} · {{ r.email }}</span>
        </div>
        <span class="resident-tag">입주민</span>
      </div>

      <template #footer>
        <button class="btn-cancel" @click="closeDetailModal">닫기</button>
        <button class="btn-submit" @click="openEditModal">수정</button>
      </template>
    </BaseModal>


    <!-- ── 세대 수정 모달 ── -->
    <BaseModal
      v-if="editModal.show"
      title="세대 정보 수정"
      :subtitle="'ID #' + editModal.item?.householdId + ' · ' + editModal.item?.dong + ' ' + editModal.item?.ho"
      @close="closeEditModal"
    >
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">동 (dong)</label>
          <input class="form-input" type="text" :value="editModal.item?.dong" disabled />
        </div>
        <div class="form-group">
          <label class="form-label">호수 (ho)</label>
          <input class="form-input" type="text" :value="editModal.item?.ho" disabled />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">입주 상태 <span class="required">*</span></label>
          <select class="form-input form-select" v-model="editModal.status">
            <option value="입주">입주</option>
            <option value="퇴거">퇴거</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">등록 차량 수</label>
          <input class="form-input" type="text" :value="editModal.item?.carCount != null ? editModal.item.carCount + '대' : '-'" disabled />
        </div>
      </div>
      <div v-if="editModal.status === '퇴거'" class="form-group">
        <label class="form-label">퇴거 입주민 선택 <span class="required">*</span></label>

        <div v-if="detailModal.residents.length === 0" class="form-hint">
          등록된 입주민이 없습니다.
        </div>

        <div
          v-for="r in detailModal.residents"
          :key="r.userId"
          class="resident-check-row"
        >
          <input
            type="checkbox"
            :id="'resident-' + r.userId"
            :value="r.userId"
            v-model="editModal.selectedUserIds"
          />
          <label :for="'resident-' + r.userId" class="resident-check-label">
            {{ r.name }} · {{ r.phone }}
          </label>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">등록일</label>
        <input class="form-input" type="text" :value="editModal.item?.createdAt ?? '-'" disabled />
      </div>
      <p class="form-hint" style="margin-top: 4px">* 수정 내역은 이력에 자동 기록됩니다.</p>
      <p v-if="editModal.error" class="form-error">{{ editModal.error }}</p>
      <template #footer>
        <button class="btn-cancel" @click="closeEditModal">취소</button>
        <button class="btn-submit" @click="submitEdit" :disabled="editModal.loading">
          {{ editModal.loading ? '처리 중...' : '수정 완료' }}
        </button>
      </template>
    </BaseModal>


    <!-- ── 승인 확인 모달 ── -->
    <BaseModal v-if="confirmModal.show" title="승인 처리" @close="closeConfirmModal">
      <p class="confirm-message">
        {{ confirmModal.item?.dong }} {{ confirmModal.item?.ho }} 세대<br>
        승인 대기 중인 회원 {{ confirmModal.users.length }}명
      </p>
      <div v-if="confirmModal.loading" class="detail-empty">조회 중...</div>
      <div v-else-if="confirmModal.users.length === 0" class="detail-empty">대기 중인 회원이 없습니다.</div>
      <div v-else v-for="user in confirmModal.users" :key="user.userId" class="pending-user-row">
        <div class="pending-user-info">
          <span class="pending-user-name">{{ user.name }}</span>
          <span class="pending-user-phone">{{ user.phone }}</span>
        </div>
        <div class="pending-user-actions">
          <button class="btn-danger" @click="handleReject(user.userId)">거부</button>
          <button class="btn-submit" @click="handleApprove(user.userId)">승인</button>
        </div>
      </div>
      <p class="form-hint" style="text-align:center; margin-top:8px">승인 시 입주 이력이 자동으로 등록됩니다.</p>
      <template #footer>
        <button class="btn-cancel" @click="closeConfirmModal">닫기</button>
      </template>
    </BaseModal>

  </div>
</template>

<style scoped>
* { box-sizing: border-box; margin: 0; padding: 0; }
.household-page { display: flex; flex-direction: column; gap: 20px; font-family: 'Noto Sans KR', sans-serif; color: #333; }

/* 통계 카드 */
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
.stat-card { height: 139px; background: #fff; border-radius: 10px; padding: 22px 24px; border: 1px solid #E2E8F0; display: flex; flex-direction: column; justify-content: space-between; }
.stat-label { font-size: 12px; color: #718096; font-weight: 500; }
.stat-value { font-size: 32px; font-weight: 700; color: #1A202C; line-height: 1; }
.stat-unit  { font-size: 14px; font-weight: 400; color: #A0AEC0; }
.stat-desc  { font-size: 12px; color: #A0AEC0; }
.stat-desc.success { color: #4D8B5A; }
.stat-desc.warning { color: #C08B2D; }

/* 테이블 섹션 */
.table-section { background: #fff; border-radius: 10px; border: 1px solid #E2E8F0; overflow: hidden; }

/* 필터 바 */
.filter-bar { display: flex; align-items: center; padding: 14px 20px; border-bottom: 1px solid #E2E8F0; }
.filter-left { display: flex; align-items: center; gap: 8px; }
.search-wrap { display: flex; align-items: center; border: 1px solid #E2E8F0; border-radius: 7px; padding: 7px 12px; gap: 6px; background: #F5F6F8; }
.search-icon { color: #A0AEC0; flex-shrink: 0; }
.search-input { border: none; background: transparent; font-size: 13px; outline: none; color: #333; width: 150px; font-family: 'Noto Sans KR', sans-serif; }
.search-input::placeholder { color: #CBD5E0; }
.filter-select { border: 1px solid #E2E8F0; border-radius: 7px; padding: 7px 28px 7px 12px; font-size: 13px; color: #333; background: #fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23A0AEC0' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat right 10px center; appearance: none; cursor: pointer; outline: none; font-family: 'Noto Sans KR', sans-serif; }
.btn-reset { display: flex; align-items: center; gap: 5px; padding: 7px 12px; border: 1px solid #E2E8F0; border-radius: 7px; background: #fff; font-size: 12px; color: #718096; cursor: pointer; font-family: 'Noto Sans KR', sans-serif; }
.btn-reset:hover { background: #F5F6F8; }

/* 테이블 */
.data-table { width: 100%; border-collapse: collapse; }
.data-table th { padding: 11px 16px; text-align: left; font-size: 12px; font-weight: 600; color: #718096; background: #F5F6F8; border-bottom: 1px solid #E2E8F0; }
.data-table td { padding: 13px 16px; font-size: 13px; color: #333; border-bottom: 1px solid #E2E8F0; }
.data-table tr:last-child td { border-bottom: none; }
.data-table tbody tr:hover td { background: #F5F6F8; }
.data-table tbody tr { cursor: pointer; }
.col-check { width: 44px; }
.col-id    { color: #A0AEC0; }
.col-empty { color: #CBD5E0; }
.empty-row { text-align: center; color: #A0AEC0; font-size: 13px; padding: 48px 0; }
.status-badge   { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
.status-success { background: #EBF5EE; color: #4D8B5A; }
.status-danger  { background: #FEE2E2; color: #E53E3E; }
.status-gray    { background: #EDF2F7; color: #718096; }
.btn-register { padding: 4px 14px; background: #EBF5EE; color: #4D8B5A; border: 1px solid #C6E6CC; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: 'Noto Sans KR', sans-serif; }
.btn-register:hover { background: #d4edda; }

/* 페이지네이션 */
.pagination-wrap { display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; border-top: 1px solid #E2E8F0; }
.pagination-info, .pagination-spacer { flex: 1; font-size: 12px; color: #A0AEC0; }
.pagination { display: flex; align-items: center; justify-content: center; gap: 4px; }
.page-btn { width: 30px; height: 30px; border: 1px solid #E2E8F0; border-radius: 6px; background: #fff; font-size: 12px; color: #718096; cursor: pointer; display: flex; align-items: center; justify-content: center; font-family: 'Noto Sans KR', sans-serif; }
.page-btn:hover  { background: #F5F6F8; }
.page-btn.active { background: #2B3A55; color: #fff; border-color: #2B3A55; }

/* 세대 상세 모달 내부 */
.detail-hero { margin-bottom: 14px; }
.detail-status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 8px; }
.detail-title { font-size: 26px; font-weight: 700; color: #1A202C; margin-bottom: 2px; }
.detail-sub   { font-size: 13px; color: #A0AEC0; }
.detail-divider { height: 1px; background: #E2E8F0; margin: 14px 0; }
.detail-grid  { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.detail-cell  { display: flex; flex-direction: column; gap: 4px; }
.detail-cell-label { font-size: 12px; color: #A0AEC0; }
.detail-cell-value { font-size: 14px; font-weight: 600; color: #1A202C; }
.detail-section-title { font-size: 13px; font-weight: 600; color: #4A5568; margin-bottom: 10px; }
.detail-empty { font-size: 13px; color: #A0AEC0; text-align: center; padding: 12px 0; }

/* 입주민 행 */
.resident-row    { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid #F5F6F8; }
.resident-row:last-child { border-bottom: none; }
.resident-avatar { width: 36px; height: 36px; border-radius: 50%; background: #2B3A55; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; flex-shrink: 0; }
.resident-info   { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.resident-name   { font-size: 14px; font-weight: 600; color: #1A202C; }
.resident-contact { font-size: 12px; color: #718096; }
.resident-tag    { font-size: 11px; font-weight: 600; color: #4D8B5A; background: #EBF5EE; padding: 3px 8px; border-radius: 10px; }

/* 폼 공통 */
.form-row    { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }
.form-group  { display: flex; flex-direction: column; gap: 6px; }
.form-label  { font-size: 13px; font-weight: 600; color: #4A5568; }
.required    { color: #E53E3E; }
.form-input  { border: 1px solid #E2E8F0; border-radius: 7px; padding: 10px 14px; font-size: 13px; color: #333; outline: none; font-family: 'Noto Sans KR', sans-serif; width: 100%; }
.form-input:focus    { border-color: #2B3A55; }
.form-input:disabled { background: #F5F6F8; color: #A0AEC0; }
.form-input::placeholder { color: #CBD5E0; }
.form-select   { appearance: none; cursor: pointer; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23A0AEC0' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; padding-right: 32px; }
.form-textarea { resize: none; font-size: 13px; font-family: 'Noto Sans KR', sans-serif; }
.form-hint   { font-size: 12px; color: #A0AEC0; }
.form-error  { font-size: 12px; color: #E53E3E; margin-top: 6px; }

/* 버튼 공통 */
.btn-cancel    { padding: 9px 20px; border: 1px solid #E2E8F0; border-radius: 7px; background: #fff; font-size: 13px; color: #718096; cursor: pointer; font-family: 'Noto Sans KR', sans-serif; }
.btn-cancel:hover { background: #F5F6F8; }
.btn-secondary { padding: 9px 20px; background: #EBF5EE; color: #4D8B5A; border: 1px solid #C6E6CC; border-radius: 7px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'Noto Sans KR', sans-serif; }
.btn-secondary:hover { background: #d4edda; }
.btn-danger    { padding: 9px 20px; background: #FEE2E2; color: #E53E3E; border: 1px solid #FECACA; border-radius: 7px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'Noto Sans KR', sans-serif; }
.btn-danger:hover    { background: #fecaca; }
.btn-submit    { padding: 9px 24px; background: #2B3A55; color: #fff; border: none; border-radius: 7px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'Noto Sans KR', sans-serif; }
.btn-submit:hover:not(:disabled) { background: #1E2A3E; }
.btn-submit:disabled { opacity: 0.5; cursor: default; }
.btn-warning { padding: 4px 14px; background: #FFF7E6; color: #C08B2D; border: 1px solid #F6D98A; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: default; font-family: 'Noto Sans KR', sans-serif; }

/* 승인 모달 */
.confirm-message { font-size: 15px; font-weight: 500; text-align: center; padding: 12px 0; color: #1A202C; line-height: 1.6; }
.pending-user-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; border: 1px solid #E2E8F0; border-radius: 8px; background: #F5F6F8; margin-bottom: 8px; }
.pending-user-info  { display: flex; flex-direction: column; gap: 3px; }
.pending-user-name  { font-size: 14px; font-weight: 600; color: #1A202C; }
.pending-user-phone { font-size: 12px; color: #718096; }
.pending-user-actions { display: flex; gap: 6px; }

.resident-check-row  { display: flex; align-items: center; gap: 10px; padding: 8px 12px; border: 1px solid #E2E8F0; border-radius: 7px; margin-bottom: 6px; }
.resident-check-label { font-size: 13px; color: #333; cursor: pointer; }
</style>