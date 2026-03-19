<script setup>
import { reactive, computed, onMounted } from 'vue'
import householdAPI from '@/api/household.js'
import { useHouseholdStore } from '@/stores/modules/household.js'

import Modal from '@/components/common/BeseModel.vue'
import ActionResultModal from '@/components/common/ActionResultModal.vue'
import StatsCards from '@/components/admin/StatsCards.vue'
import FilterBar from '@/components/layout/FilterBar.vue'
import AdminTable from '@/components/admin/AdminTable.vue'
import Pagination from '@/components/layout/Pagination.vue'

const householdStore = useHouseholdStore()

// 페이지 상태
const state = reactive({
  list: [],
  dongOptions: [],

  // 검색 필터
  dong: '',
  ho: '',
  status: '',

  // 페이지네이션
  size: 10,
  currentPage: 1,
  maxPage: 0,
  totalFiltered: 0
})

// 상세 모달 상태
const detailModal = reactive({
  show: false,
  item: null,
  residents: [],
  loading: false
})

// 수정 모달 상태
const editModal = reactive({
  show: false,
  item: null,
  selectedUserIds: [],
  status: '',
  loading: false,
  error: ''
})

// 승인 처리 모달 상태
const confirmModal = reactive({
  show: false,
  item: null,
  users: [],
  loading: false
})

// 공통 결과 모달 상태
const resultModal = reactive({
  show: false,
  type: 'success',
  title: '',
  subtitle: '',
  desc: '',
  itemName: '',
  time: '',
  actionLabel: '',
  actor: '관리사무소',
})

// 테이블 컬럼
const columns = [
  { label: 'ID', key: 'householdId' },
  { label: '동', key: 'dong' },
  { label: '호수', key: 'ho' },
  { label: '등록일', key: 'lastChangedAt' },
  { label: '입주상태', key: 'status' },
  { label: '차량', key: 'carCount' },
]

// 상단 통계 카드
const stats = computed(() => [
  { label: '전체 세대', value: householdStore.total, unit: '세대', desc: '등록 세대 기준' },
  {
    label: '입주 세대',
    value: householdStore.occupied,
    unit: '세대',
    desc: `전체 대비 ${occupiedRate.value}%`,
    descClass: 'success'
  },
  {
    label: '공실 세대',
    value: householdStore.empty,
    unit: '세대',
    desc: `관리 필요 ${householdStore.needCare}세대`,
    descClass: 'warning'
  },
  {
    label: '이번 달 변동',
    value: householdStore.monthNew,
    unit: '건',
    desc: `전입 ${householdStore.moveIn} · 전출 ${householdStore.moveOut}`
  },
])

// 입주율 계산
const occupiedRate = computed(() => {
  if (!householdStore.total) return 0
  return ((householdStore.occupied / householdStore.total) * 100).toFixed(1)
})

// 상태 배지 클래스
const statusClass = (status) => {
  if (status === '입주') return 'status-success'
  if (status === '퇴거') return 'status-danger'
  return 'status-gray'
}

// 장기공실 여부 판단
const isNeedCare = (item) => {
  if (item.status !== '퇴거' && item.status !== '공실') return false
  const oneMonthAgo = new Date()
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
  return new Date(item.lastChangedAt) <= oneMonthAgo
}

// 입주민 아바타용 이니셜
const nameInitial = (name) => name ? name.charAt(0) : '?'

// 공통 결과 모달 열기
const openResultModal = ({ type = 'success', title, subtitle, desc, itemName, actionLabel }) => {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const hh = String(now.getHours()).padStart(2, '0')
  const mi = String(now.getMinutes()).padStart(2, '0')

  resultModal.type = type
  resultModal.title = title
  resultModal.subtitle = subtitle
  resultModal.desc = desc
  resultModal.itemName = itemName
  resultModal.time = `${yyyy}.${mm}.${dd} ${hh}:${mi}`
  resultModal.actionLabel = actionLabel
  resultModal.show = true
}

// 결과 모달 닫기
const closeResultModal = () => {
  resultModal.show = false
}

// 통계 조회
const fetchStats = () => householdStore.fetchStats()

// 동 목록 조회
const fetchDongs = async () => {
  try {
    const result = await householdAPI.getDongs()
    state.dongOptions = result.data.resultData
  } catch (e) {
    console.error('동 목록 조회 실패', e)
  }
}

// 최대 페이지 조회
const getMaxPage = async () => {
  try {
    const result = await householdAPI.getMaxPage(state.size, state.dong, state.ho, state.status)
    const d = result.data.resultData
    state.maxPage = d.maxPage
    state.totalFiltered = d.totalCount
  } catch (e) {
    console.error('maxPage 조회 실패', e)
  }
}

// 세대 목록 조회
const goToList = async () => {
  try {
    const result = await householdAPI.getHouseholds(state.currentPage, state.size, state.dong, state.ho, state.status)
    state.list = result.data.resultData.map(h => ({ ...h, checked: false }))
  } catch (e) {
    console.error('세대 목록 조회 실패', e)
  }
}

// 검색 실행
const doSearch = () => {
  state.currentPage = 1
  getMaxPage()
  goToList()
}

// 필터 초기화
const resetFilters = () => {
  state.ho = ''
  state.dong = ''
  state.status = ''
  doSearch()
}

// 페이지 이동
const goToPage = (page) => {
  state.currentPage = page
  goToList()
}

// 상세 모달 열기 + 입주민 조회
const openDetailModal = async (item) => {
  detailModal.item = item
  detailModal.residents = []
  detailModal.show = true
  detailModal.loading = true

  try {
    const result = await householdAPI.getResidents(item.householdId)
    detailModal.residents = result.data.resultData
  } catch (e) {
    console.error('입주민 조회 실패', e)
  } finally {
    detailModal.loading = false
  }
}

// 상세 모달 닫기
const closeDetailModal = () => {
  detailModal.show = false
}

// 수정 모달 열기
const openEditModal = () => {
  editModal.item = detailModal.item
  editModal.status = detailModal.item?.status ?? '공실'
  editModal.selectedUserIds = []
  editModal.error = ''
  editModal.loading = false
  editModal.show = true
  detailModal.show = false
}

// 수정 모달 닫기
const closeEditModal = () => {
  editModal.show = false
}

// 세대 상태 수정
const submitEdit = async () => {
  if (!editModal.status) {
    editModal.error = '입주 상태를 선택해주세요'
    return
  }

  if (editModal.status === editModal.item?.status) {
    editModal.error = '현재와 동일한 상태입니다'
    return
  }

  editModal.loading = true
  editModal.error = ''

  try {
    // 퇴거 처리 시 선택한 입주민별로 이력 등록
    if (editModal.status === '퇴거') {
      if (editModal.selectedUserIds.length > 0) {
        for (const userId of editModal.selectedUserIds) {
          await householdAPI.createHistory(editModal.item.householdId, { status: '퇴거', userId })
        }
      } else {
        await householdAPI.createHistory(editModal.item.householdId, { status: '퇴거', userId: null })
      }
    } else {
      await householdAPI.createHistory(editModal.item.householdId, { status: editModal.status, userId: null })
    }

    const itemName = `${editModal.item?.dong} ${editModal.item?.ho}`
    const changedTo = editModal.status

    closeEditModal()

    // 결과 모달 표시
    openResultModal({
      type: 'success',
      title: '세대 상태 변경이 완료되었습니다',
      subtitle: '세대 정보 수정',
      desc: `${itemName} 세대의 상태가 ${changedTo}(으)로 변경되었습니다.`,
      itemName,
      actionLabel: '세대 상태 변경',
    })

    fetchStats()
    goToList()
  } catch (e) {
    editModal.error = e.response?.data?.resultMessage || '수정에 실패했습니다'
  } finally {
    editModal.loading = false
  }
}

// 승인 요청 모달 열기
const openConfirmModal = async (e, item) => {
  e.stopPropagation()
  confirmModal.item = item
  confirmModal.show = true
  confirmModal.users = []
  confirmModal.loading = true

  try {
    const result = await householdAPI.getPendingUsers(item.householdId)
    confirmModal.users = result.data.resultData
  } catch (e) {
    console.error('대기 유저 조회 실패', e)
  } finally {
    confirmModal.loading = false
  }
}

// 승인 요청 모달 닫기
const closeConfirmModal = () => {
  confirmModal.show = false
}

// 회원 승인
const handleApprove = async (userId) => {
  try {
    const targetUser = confirmModal.users.find(u => u.userId === userId)

    await householdAPI.approveUser(userId)

    confirmModal.users = confirmModal.users.filter(u => u.userId !== userId)
    closeConfirmModal()

    openResultModal({
      type: 'success',
      title: '승인이 완료되었습니다',
      subtitle: '회원 승인 처리',
      desc: '입주민에게 승인 안내가 반영됩니다.',
      itemName: targetUser?.name || '승인 회원',
      actionLabel: '회원 승인',
    })

    fetchStats()
    goToList()
  } catch (e) {
    console.error('승인 실패', e)
  }
}

// 회원 거부
const handleReject = async (userId) => {
  try {
    const targetUser = confirmModal.users.find(u => u.userId === userId)

    await householdAPI.rejectUser(userId)

    confirmModal.users = confirmModal.users.filter(u => u.userId !== userId)
    closeConfirmModal()

    openResultModal({
      type: 'danger',
      title: '거부가 완료되었습니다',
      subtitle: '회원 거부 처리',
      desc: '입주민에게 거부 안내가 반영됩니다.',
      itemName: targetUser?.name || '거부 회원',
      actionLabel: '회원 거부',
    })

    goToList()
  } catch (e) {
    console.error('거부 실패', e)
  }
}

// 초기 데이터 로딩
onMounted(() => {
  fetchStats()
  fetchDongs()
  getMaxPage()
  goToList()
})
</script>

<template>
  <div class="household-page">
    <StatsCards :stats="stats" />

    <div class="table-section">
      <FilterBar @reset="resetFilters">
        <div class="search-wrap">
          <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input class="search-input" type="text" placeholder="호수로 검색" v-model="state.ho" @keyup.enter="doSearch"/>
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
      </FilterBar>

      <AdminTable :columns="columns" :rows="state.list" @row-click="openDetailModal">
        <template #cell-status="{ row }">
          <span :class="['status-badge', statusClass(row.status)]">{{ row.status ?? '-' }}</span>
        </template>

        <template #cell-carCount="{ row }">
          {{ row.carCount > 0 ? row.carCount + '대' : '-' }}
        </template>

        <template #action="{ row }">
          <button v-if="row.pendingCount > 0" class="btn-register" @click.stop="openConfirmModal($event, row)">승인요청</button>
          <button v-else-if="isNeedCare(row)" class="btn-warning">장기공실</button>
          <span v-else class="col-empty">-</span>
        </template>
      </AdminTable>

      <Pagination
        :currentPage="state.currentPage"
        :maxPage="state.maxPage"
        :totalAll="householdStore.total"
        :totalFiltered="state.totalFiltered"
        unit="세대"
        @change="goToPage"
      />
    </div>

    <!-- 상세 모달 -->
    <Modal
      v-if="detailModal.show"
      title="세대 상세 정보"
      :subtitle="'ID #' + detailModal.item?.householdId"
      @close="closeDetailModal"
    >
      <div class="detail-hero">
        <span :class="['detail-status-badge', statusClass(detailModal.item?.status)]">{{ detailModal.item?.status ?? '공실' }}</span>
        <h2 class="detail-title">{{ detailModal.item?.dong }} {{ detailModal.item?.ho }}</h2>
        <p class="detail-sub">세대 정보</p>
      </div>

      <div class="detail-divider"></div>

      <div class="detail-grid">
        <div class="detail-cell"><span class="detail-cell-label">세대 ID</span><span class="detail-cell-value">#{{ detailModal.item?.householdId }}</span></div>
        <div class="detail-cell"><span class="detail-cell-label">등록일</span><span class="detail-cell-value">{{ detailModal.item?.createdAt ?? '-' }}</span></div>
        <div class="detail-cell"><span class="detail-cell-label">동 (dong)</span><span class="detail-cell-value">{{ detailModal.item?.dong }}</span></div>
        <div class="detail-cell"><span class="detail-cell-label">호수 (ho)</span><span class="detail-cell-value">{{ detailModal.item?.ho }}</span></div>
        <div class="detail-cell"><span class="detail-cell-label">입주 상태</span><span class="detail-cell-value">{{ detailModal.item?.status ?? '공실' }}</span></div>
        <div class="detail-cell"><span class="detail-cell-label">등록 차량 수</span><span class="detail-cell-value">{{ detailModal.item?.carCount != null ? detailModal.item.carCount + '대' : '-' }}</span></div>
      </div>

      <div class="detail-divider"></div>

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
    </Modal>

    <!-- 수정 모달 -->
    <Modal
      v-if="editModal.show"
      title="세대 정보 수정"
      :subtitle="'ID #' + editModal.item?.householdId + ' · ' + editModal.item?.dong + ' ' + editModal.item?.ho"
      @close="closeEditModal"
    >
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">동 (dong)</label>
          <input class="form-input" :value="editModal.item?.dong" disabled />
        </div>

        <div class="form-group">
          <label class="form-label">호수 (ho)</label>
          <input class="form-input" :value="editModal.item?.ho" disabled />
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
          <input class="form-input" :value="editModal.item?.carCount != null ? editModal.item.carCount + '대' : '-'" disabled />
        </div>
      </div>

      <div v-if="editModal.status === '퇴거'" class="form-group">
        <label class="form-label">퇴거 입주민 선택</label>
        <div v-if="detailModal.residents.length === 0" class="form-hint">등록된 입주민이 없습니다.</div>

        <div v-for="r in detailModal.residents" :key="r.userId" class="resident-check-row">
          <input type="checkbox" :id="'resident-' + r.userId" :value="r.userId" v-model="editModal.selectedUserIds" />
          <label :for="'resident-' + r.userId" class="resident-check-label">{{ r.name }} · {{ r.phone }}</label>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">등록일</label>
        <input class="form-input" :value="editModal.item?.createdAt ?? '-'" disabled />
      </div>

      <p class="form-hint" style="margin-top:4px">* 수정 내역은 이력에 자동 기록됩니다.</p>
      <p v-if="editModal.error" class="form-error">{{ editModal.error }}</p>

      <template #footer>
        <button class="btn-cancel" @click="closeEditModal">취소</button>
        <button class="btn-submit" @click="submitEdit" :disabled="editModal.loading">
          {{ editModal.loading ? '처리 중...' : '수정 완료' }}
        </button>
      </template>
    </Modal>

    <!-- 승인 처리 모달 -->
    <Modal v-if="confirmModal.show" title="승인 처리" @close="closeConfirmModal">
      <p class="confirm-message">{{ confirmModal.item?.dong }} {{ confirmModal.item?.ho }} 세대<br>승인 대기 중인 회원 {{ confirmModal.users.length }}명</p>

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

      <p class="form-hint" style="text-align:center;margin-top:8px">승인 시 입주 이력이 자동으로 등록됩니다.</p>

      <template #footer>
        <button class="btn-cancel" @click="closeConfirmModal">닫기</button>
      </template>
    </Modal>

    <!-- 공통 결과 모달 -->
    <ActionResultModal
      v-if="resultModal.show"
      :title="resultModal.title"
      :subtitle="resultModal.subtitle"
      :desc="resultModal.desc"
      :type="resultModal.type"
      :item-name="resultModal.itemName"
      :time="resultModal.time"
      :action-label="resultModal.actionLabel"
      :actor="resultModal.actor"
      @close="closeResultModal"
    />
  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.household-page {
  display: flex;
  flex-direction: column;

  color: #333;
}

.table-section {
  background: #fff;
  border-radius: 10px;
  border: 1px solid #E2E8F0;
  overflow: hidden;
}

.search-wrap {
  display: flex;
  align-items: center;
  border: 1px solid #E2E8F0;
  border-radius: 7px;
  padding: 7px 12px;
  gap: 6px;
  background: #F5F6F8;
}

.search-icon {
  color: #687282;
  flex-shrink: 0;
}

.search-input {
  border: none;
  background: transparent;
  font-size: 13px;
  outline: none;
  color: #333;
  width: 150px;

}

.search-input::placeholder {
  color: #CBD5E0;
}

.filter-select {
  border: 1px solid #E2E8F0;
  border-radius: 7px;
  padding: 7px 28px 7px 12px;
  font-size: 13px;
  color: #333;
  background: #fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23A0AEC0' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat right 10px center;
  appearance: none;
  cursor: pointer;
  outline: none;

}

.status-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
}

.status-success {
  background: #C6F6D5;
  color: #276749;
}

.status-danger {
  background: #FEE2E2;
  color: #E53E3E;
}

.status-gray {
  background: #EDF2F7;
  color: #687282;
}

.col-empty {
  color: #CBD5E0;
}

.btn-register {
  padding: 4px 14px;
  background: #C6F6D5;
  color: #276749;
  border: 1px solid #C6E6CC;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;

}

.btn-warning {
  padding: 4px 14px;
  background: #FFF7E6;
  color: #C08B2D;
  border: 1px solid #F6D98A;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: default;

}

.btn-cancel {
  padding: 9px 20px;
  border: 1px solid #E2E8F0;
  border-radius: 7px;
  background: #fff;
  font-size: 13px;
  color: #687282;
  cursor: pointer;

}

.btn-cancel:hover {
  background: #F5F6F8;
}

.btn-danger {
  padding: 9px 20px;
  background: #FEE2E2;
  color: #E53E3E;
  border: 1px solid #FECACA;
  border-radius: 7px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;

}

.btn-submit {
  padding: 9px 24px;
  background: #2B3A55;
  color: #fff;
  border: none;
  border-radius: 7px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;

}

.btn-submit:hover:not(:disabled) {
  background: #1E2A3E;
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: default;
}

.detail-hero {
  margin-bottom: 14px;
}

.detail-status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 8px;
}

.detail-title {
  font-size: 26px;
  font-weight: 700;
  color: #1A202C;
  margin-bottom: 2px;
}

.detail-sub {
  font-size: 13px;
  color: #687282;
}

.detail-divider {
  height: 1px;
  background: #E2E8F0;
  margin: 14px 0;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.detail-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-cell-label {
  font-size: 12px;
  color: #687282;
}

.detail-cell-value {
  font-size: 14px;
  font-weight: 500;
  color: #1A202C;
}

.detail-section-title {
  font-size: 13px;
  font-weight: 600;
  color: #687282;
  margin-bottom: 10px;
}

.detail-empty {
  font-size: 13px;
  color: #687282;
  text-align: center;
  padding: 12px 0;
}

.resident-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #F5F6F8;
}

.resident-row:last-child {
  border-bottom: none;
}

.resident-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #2B3A55;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  flex-shrink: 0;
}

.resident-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.resident-name {
  font-size: 14px;
  font-weight: 600;
  color: #1A202C;
}

.resident-contact {
  font-size: 12px;
  color: #687282;
}

.resident-tag {
  font-size: 11px;
  font-weight: 600;
  color: #276749;
  background: #C6F6D5;
  padding: 3px 8px;
  border-radius: 10px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 14px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 13px;
  font-weight: 600;
  color: #687282;
}

.required {
  color: #E53E3E;
}

.form-input {
  border: 1px solid #E2E8F0;
  border-radius: 7px;
  padding: 10px 14px;
  font-size: 13px;
  color: #333;
  outline: none;

  width: 100%;
}

.form-input:focus {
  border-color: #2B3A55;
}

.form-input:disabled {
  background: #F5F6F8;
  color: #687282;
}

.form-select {
  appearance: none;
  cursor: pointer;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23A0AEC0' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 32px;
}

.form-hint {
  font-size: 12px;
  color: #687282;
}

.form-error {
  font-size: 12px;
  color: #E53E3E;
  margin-top: 6px;
}

.confirm-message {
  font-size: 15px;
  font-weight: 500;
  text-align: center;
  padding: 12px 0;
  color: #1A202C;
  line-height: 1.6;
}

.pending-user-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  background: #F5F6F8;
  margin-bottom: 8px;
}

.pending-user-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.pending-user-name {
  font-size: 14px;
  font-weight: 600;
  color: #1A202C;
}

.pending-user-phone {
  font-size: 12px;
  color: #687282;
}

.pending-user-actions {
  display: flex;
  gap: 6px;
}

.resident-check-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border: 1px solid #E2E8F0;
  border-radius: 7px;
  margin-bottom: 6px;
}

.resident-check-label {
  font-size: 13px;
  color: #333;
  cursor: pointer;
}
</style>