<script setup>
import {reactive, computed, onMounted, inject} from 'vue'
import {getAdminVisitorVehicles, getAdminVisitorVehicleStats} from '@/api/visitorVehicle.js'
import axios from '@/api/axios.js'

import StatsCards from '@/components/admin/StatsCards.vue'
import FilterBar from '@/components/layout/FilterBar.vue'
import AdminTable from '@/components/admin/AdminTable.vue'
import Pagination from '@/components/layout/Pagination.vue'
import BaseModal from '@/components/common/BeseModel.vue'
import ActionResultModal from '@/components/common/ActionResultModal.vue'

const registerOpenModal = inject('registerOpenModal')

const state = reactive({
  list: [],
  stats: {todayCount: 0, tomorrowCount: 0, totalCount: 0, monthCount: 0},
  activeTab: 'all',
  licensePlate: '',
  size: 10,
  currentPage: 1,
  totalPages: 0,
  totalCount: 0,
  showRegisterModal: false,
  searchDong: '',
  searchHo: '',
  searchResults: [],
  selectedUser: null,
  showDropdown: false,
  form: {licensePlate: '', visitorName: '', visitPurpose: '', visitDate: ''},
  submitting: false,
  submitError: '',
  // 등록 완료 모달 (ActionResultModal)
  showSuccessModal: false,
  successLicensePlate: '',
})

const purposeTags = ['택배 수령', '친척 방문', '지인 방문', '이사 도우미', '인테리어 공사', '기타']
const today = new Date().toISOString().split('T')[0]

const columns = [
  {label: '차량번호', key: 'licensePlate'},
  {label: '방문자', key: 'visitorName'},
  {label: '방문목적', key: 'visitPurpose'},
  {label: '방문일', key: 'visitDate'},
  {label: '등록자', key: 'userName'},
  {label: '세대', key: 'unit'},
  {label: '입차 여부', key: 'isEntered'},
  {label: '상태', key: 'statusLabel'},
]

const tabs = [
  {key: 'all', label: '전체'},
  {key: 'today', label: '오늘 방문'},
  {key: 'tomorrow', label: '내일 방문'},
]

const getDateString = (offset = 0) => {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const statsData = computed(() => [
  {label: '오늘 방문 예정', value: state.stats.todayCount, unit: '대', desc: `${getDateString(0)} 기준`},
  {label: '내일 방문 예정', value: state.stats.tomorrowCount, unit: '대', desc: `${getDateString(1)} 기준`},
  {label: '이번 달 방문', value: state.stats.monthCount, unit: '건', desc: '월간 누적'},
  {label: '전체 등록 건수', value: state.stats.totalCount, unit: '건', desc: '전체 누적'},
])

const tableRows = computed(() =>
    state.list.map(item => ({
      ...item,
      unit: item.dong && item.ho ? `${item.dong} ${item.ho}` : '-',
      statusLabel: item.isDeleted === 1 ? '삭제됨' : item.status === 'CANCELLED' ? '취소됨' : '승인',
      statusType: item.isDeleted === 1 ? 'deleted' : item.status === 'CANCELLED' ? 'cancelled' : 'approved',
    }))
)

const fetchStats = async () => {
  try {
    const res = await getAdminVisitorVehicleStats()
    const data = res.data
    state.stats.todayCount = data.todayCount ?? 0
    state.stats.tomorrowCount = data.tomorrowCount ?? 0
    state.stats.totalCount = data.totalCount ?? 0
    state.stats.monthCount = data.monthCount ?? 0
  } catch (e) {
    console.error('방문차량 통계 조회 실패', e)
  }
}

const fetchList = async () => {
  try {
    const params = {page: state.currentPage, size: state.size}
    if (state.activeTab === 'today') params.visitDate = getDateString(0)
    if (state.activeTab === 'tomorrow') params.visitDate = getDateString(1)
    if (state.licensePlate) params.licensePlate = state.licensePlate
    const res = await getAdminVisitorVehicles(params)
    const data = res.data
    state.list = data.content
    state.totalPages = data.totalPages
    state.totalCount = data.totalCount
  } catch (e) {
    console.error('관리자 방문차량 조회 실패', e)
  }
}

const switchTab = (tabKey) => {
  state.activeTab = tabKey
  state.currentPage = 1
  state.licensePlate = ''
  fetchList()
}
const doSearch = () => {
  state.currentPage = 1;
  fetchList()
}
const resetFilters = () => {
  state.licensePlate = '';
  doSearch()
}
const goToPage = (page) => {
  state.currentPage = page;
  fetchList()
}

const openRegisterModal = () => {
  state.searchDong = ''
  state.searchHo = ''
  state.searchResults = []
  state.selectedUser = null
  state.showDropdown = false
  state.form = {licensePlate: '', visitorName: '', visitPurpose: '', visitDate: ''}
  state.submitError = ''
  state.showRegisterModal = true
}
const closeRegisterModal = () => {
  state.showRegisterModal = false;
  state.submitError = ''
}

const searchUser = async () => {
  if (!state.searchDong.trim() && !state.searchHo.trim()) return
  try {
    const res = await axios.get('/admin/users/search', {
      params: {
        dong: state.searchDong.trim() || undefined,
        ho: state.searchHo.trim() || undefined,
      }
    })
    state.searchResults = res.data?.resultData ?? res.data ?? []
    state.showDropdown = true
  } catch (e) {
    console.error('입주민 검색 실패', e)
    state.searchResults = []
  }
}

const selectUser = (user) => {
  state.selectedUser = user;
  state.showDropdown = false
}
const clearSelectedUser = () => {
  state.selectedUser = null;
  state.searchDong = '';
  state.searchHo = '';
  state.searchResults = [];
  state.showDropdown = false
}
const selectPurposeTag = (tag) => {
  state.form.visitPurpose = tag
}

// 등록 제출 → 성공 시 등록 모달 닫고 ActionResultModal 오픈
const submitRegister = async () => {
  if (!state.selectedUser) {
    state.submitError = '등록 입주민을 선택해주세요.';
    return
  }
  if (!state.form.licensePlate.trim()) {
    state.submitError = '방문 차량번호를 입력해주세요.';
    return
  }
  if (!state.form.visitPurpose.trim()) {
    state.submitError = '방문 목적을 입력해주세요.';
    return
  }
  if (!state.form.visitDate) {
    state.submitError = '방문 예정일을 선택해주세요.';
    return
  }

  state.submitting = true
  state.submitError = ''
  try {
    await axios.post('/admin/visitor-vehicles', {
      userId: state.selectedUser.userId,
      licensePlate: state.form.licensePlate.trim(),
      visitorName: state.form.visitorName.trim() || null,
      visitPurpose: state.form.visitPurpose.trim(),
      visitDate: state.form.visitDate,
    })
    state.successLicensePlate = state.form.licensePlate.trim()
    await fetchList()
    await fetchStats()
    closeRegisterModal()
    state.showSuccessModal = true
  } catch (e) {
    state.submitError = '등록에 실패했습니다.'
    console.error(e)
  } finally {
    state.submitting = false
  }
}

onMounted(() => {
  registerOpenModal(openRegisterModal)
  fetchStats()
  fetchList()
})
</script>

<template>
  <div class="visitor-vehicle-page">

    <StatsCards :stats="statsData"/>

    <div class="table-section">
      <div class="tab-bar">
        <button v-for="tab in tabs" :key="tab.key" :class="['tab-btn', { active: state.activeTab === tab.key }]"
                @click="switchTab(tab.key)">
          {{ tab.label }}
          <span v-if="tab.key === 'today'" class="tab-badge">{{ state.stats.todayCount }}</span>
          <span v-if="tab.key === 'tomorrow'" class="tab-badge">{{ state.stats.tomorrowCount }}</span>
        </button>
      </div>

      <FilterBar @reset="resetFilters">
        <div class="search-wrap">
          <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input class="search-input" type="text" placeholder="차량번호 검색" v-model="state.licensePlate"
                 @keyup.enter="doSearch"/>
        </div>
      </FilterBar>

      <AdminTable :columns="columns" :rows="tableRows">
        <template #cell-isEntered="{ row }">
          <span :class="['status-badge', row.entered ? 'status-approved' : 'status-grey']">{{
              row.entered ? '입차완료' : '미입차'
            }}</span>
        </template>
        <template #cell-statusLabel="{ row }">
          <span :class="['status-badge', `status-${row.statusType}`]">{{ row.statusLabel }}</span>
        </template>
      </AdminTable>

      <Pagination :currentPage="state.currentPage" :maxPage="state.totalPages" :totalAll="state.totalCount"
                  :totalFiltered="state.totalCount" unit="건" @change="goToPage"/>
    </div>

    <!-- 방문차량 등록 모달: BaseModal -->
    <BaseModal v-if="state.showRegisterModal" title="방문차량 등록" subtitle="입주민이 방문차량을 사전 등록합니다"
               @close="closeRegisterModal">
      <div class="modal-form">
        <div class="form-group">
          <label class="form-label">등록 입주민 <span class="required">*</span></label>
          <div v-if="state.selectedUser" class="selected-user-badge">
            ✓ {{ state.selectedUser.dong }} {{ state.selectedUser.ho }} · {{ state.selectedUser.name }}
            <button class="clear-btn" @click="clearSelectedUser">✕</button>
          </div>
          <div v-else class="search-row">
            <input class="form-input" type="text" placeholder="동 (예: 103동)" v-model="state.searchDong"
                   @keyup.enter="searchUser"/>
            <input class="form-input" type="text" placeholder="호수 (예: 101호)" v-model="state.searchHo"
                   @keyup.enter="searchUser"/>
            <button class="search-btn-inline" @click="searchUser">검색</button>
          </div>
          <div v-if="state.showDropdown && state.searchResults.length > 0" class="search-dropdown">
            <div v-for="user in state.searchResults" :key="user.userId" class="search-item" @click="selectUser(user)">
              <span class="search-item-name">{{ user.name }}</span>
              <span class="search-item-unit">{{ user.dong }} {{ user.ho }}</span>
            </div>
          </div>
          <div v-else-if="state.showDropdown && state.searchResults.length === 0" class="search-empty">검색 결과가 없습니다.
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">방문 차량번호 <span class="required">*</span></label>
            <input class="form-input" type="text" placeholder="예: 12가 3456" v-model="state.form.licensePlate"/>
          </div>
          <div class="form-group">
            <label class="form-label">방문자 이름</label>
            <input class="form-input" type="text" placeholder="예: 홍길동" v-model="state.form.visitorName"/>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">방문 목적 <span class="required">*</span></label>
          <input class="form-input" type="text" placeholder="방문 목적 선택 또는 직접 입력" v-model="state.form.visitPurpose"/>
          <div class="tag-list">
            <button v-for="tag in purposeTags" :key="tag"
                    :class="['tag-btn', state.form.visitPurpose === tag ? 'tag-active' : '']"
                    @click="selectPurposeTag(tag)">{{ tag }}
            </button>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">방문 예정일 <span class="required">*</span></label>
          <input class="form-input" type="date" :min="today" v-model="state.form.visitDate"/>
        </div>
        <p v-if="state.submitError" class="error-msg">{{ state.submitError }}</p>
        <p class="form-note">* 표시는 필수 입력 항목입니다.</p>
      </div>
      <template #footer>
        <button class="btn-cancel" @click="closeRegisterModal">취소</button>
        <button class="btn-primary" @click="submitRegister" :disabled="state.submitting">
          {{ state.submitting ? '등록 중...' : '등록하기' }}
        </button>
      </template>
    </BaseModal>

    <!-- 등록 완료 모달: ActionResultModal (관리자 → theme="admin") -->
    <ActionResultModal
        v-if="state.showSuccessModal"
        type="success"
        title="등록 완료"
        subtitle="방문차량이 등록되었습니다"
        :item-name="state.successLicensePlate"
        action-label="방문차량 등록"
        confirm-text="확인"
        theme="admin"
        @close="state.showSuccessModal = false"
    />

  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.visitor-vehicle-page {
  display: flex;
  flex-direction: column;
}

.table-section {
  background: #fff;
  border-radius: 10px;
  border: 1px solid #E2E8F0;
  overflow: hidden;
}

.tab-bar {
  display: flex;
  align-items: center;
  border-bottom: 1px solid #E2E8F0;
  padding: 0 16px;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 14px 16px;
  font-size: 13px;
  font-weight: 500;
  color: #687282;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  cursor: pointer;
}

.tab-btn.active {
  color: #2D3748;
  font-weight: 700;
  border-bottom-color: #2D3748;
}

.tab-badge {
  background: #EDF2F7;
  color: #687282;
  font-size: 11px;
  font-weight: 600;
  padding: 1px 7px;
  border-radius: 20px;
}

.tab-btn.active .tab-badge {
  background: #C6F6D5;
  color: #276749;
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
  width: 160px;
}

.search-input::placeholder {
  color: #CBD5E0;
}

.status-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
}

.status-approved {
  background: #C6F6D5;
  color: #276749;
}

.status-grey {
  background: #EDF2F7;
  color: #687282;
}

.status-cancelled {
  background: #EDF2F7;
  color: #687282;
}

.status-deleted {
  background: #FEE2E2;
  color: #E53E3E;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  position: relative;
}

.form-label {
  font-size: 13px;
  color: #687282;
}

.required {
  color: #E53E3E;
}

.search-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.search-row .form-input {
  flex: 1;
}

.search-btn-inline {
  padding: 0 16px;
  height: 42px;
  background: #2B3A55;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
}

.search-btn-inline:hover {
  background: #1E2A3E;
}

.selected-user-badge {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: #EEF0FD;
  border: 1px solid #2B3A55;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #2B3A55;
}

.clear-btn {
  background: none;
  border: none;
  color: #687282;
  cursor: pointer;
  font-size: 13px;
  padding: 0 4px;
}

.clear-btn:hover {
  color: #E53E3E;
}

.search-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #fff;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  z-index: 10;
  max-height: 160px;
  overflow-y: auto;
}

.search-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  cursor: pointer;
  font-size: 13px;
}

.search-item:hover {
  background: #F7F8FC;
}

.search-item-name {
  font-weight: 600;
  color: #2D3748;
}

.search-item-unit {
  font-size: 12px;
  color: #687282;
}

.search-empty {
  font-size: 12px;
  color: #687282;
  padding: 8px 14px;
}

.form-input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  font-size: 13px;
  outline: none;
  color: #2D3748;
}

.form-input:focus {
  border-color: #2B3A55;
}

.form-input::placeholder {
  color: #CBD5E0;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}

.tag-btn {
  padding: 4px 12px;
  border: 1px solid #E2E8F0;
  border-radius: 20px;
  font-size: 12px;
  background: #fff;
  color: #687282;
  cursor: pointer;
  transition: all 0.12s;
}

.tag-btn:hover {
  background: #F0F4FF;
  border-color: #2B3A55;
  color: #2B3A55;
}

.tag-active {
  background: #EEF0FD;
  border-color: #2B3A55;
  color: #2B3A55;
  font-weight: 600;
}

.form-note {
  font-size: 11px;
  color: #687282;
}

.error-msg {
  font-size: 12px;
  color: #E53E3E;
}

.btn-primary {
  padding: 9px 18px;
  background: #2B3A55;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary:hover {
  background: #1E2A3E;
}

.btn-primary:disabled {
  background: #687282;
  cursor: default;
}

.btn-cancel {
  padding: 9px 18px;
  background: #fff;
  color: #687282;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
}

.btn-cancel:hover {
  background: #F5F6F8;
}
</style>