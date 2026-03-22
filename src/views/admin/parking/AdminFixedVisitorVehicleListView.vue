<script setup>
import {ref, computed, inject, onMounted} from 'vue'
import {
  getAdminFixedVisitorVehicles,
  getAdminFixedVisitorVehicleStats,
  adminRegisterFixedVisitorVehicle,
  deleteAdminFixedVisitorVehicle
} from '@/api/visitorVehicle.js'
import householdAPI from '@/api/household.js'

import BaseModal from '@/components/common/BeseModel.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import ActionResultModal from '@/components/common/ActionResultModal.vue'
import StatsCards from '@/components/admin/StatsCards.vue'
import FilterBar from '@/components/layout/FilterBar.vue'
import AdminTable from '@/components/admin/AdminTable.vue'
import Pagination from '@/components/layout/Pagination.vue'

const registerOpenModal = inject('registerOpenModal')

const list = ref([])
const currentPage = ref(1)
const totalPages = ref(0)
const totalCount = ref(0)
const size = ref(10)

const statTotal = ref(0)
const statUnlimited = ref(0)
const statMonth = ref(0)
const statActive = ref(0)

const vehicleNumber = ref('')
const dong = ref('')
const dongOptions = ref([])

const registerModal = ref({show: false, loading: false, error: ''})
const form = ref({vehicleNumber: '', visitorName: '', purpose: '', startDate: '', endDate: ''})

// 등록 완료 모달 (ActionResultModal)
const successModal = ref({show: false, vehicleNumber: ''})

const detailModal = ref({show: false, item: null, loading: false})
const confirmModal = ref({show: false, loading: false})

const now = new Date()
const today = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0]

const purposeTags = ['정기 배송', '시설 관리', '청소 업체', '경비 업체', '친인척 방문', '기타']
const selectPurposeTag = (tag) => {
  form.value.purpose = form.value.purpose === tag ? '' : tag
}

const columns = [
  {label: '차량번호', key: 'vehicleNumber'},
  {label: '방문자', key: 'visitorName'},
  {label: '방문 목적', key: 'purpose'},
  {label: '시작일', key: 'startDate'},
  {label: '종료일', key: 'endDate'},
  {label: '등록자', key: 'userName'},
  {label: '세대', key: 'unit'},
  {label: '상태', key: 'status'},
]

const statsData = computed(() => [
  {label: '전체 등록 건수', value: statTotal.value, unit: '건', desc: '전체 누적'},
  {label: '무기한 차량', value: statUnlimited.value, unit: '대', desc: '종료일 미설정'},
  {label: '이번 달 등록', value: statMonth.value, unit: '건', desc: '월간 누적'},
  {label: '활성 차량', value: statActive.value, unit: '대', desc: '오늘 기준'},
])

const tableRows = computed(() =>
    list.value.map(item => ({
      ...item,
      endDate: item.endDate || '무기한',
      unit: item.dong && item.ho ? `${item.dong} ${item.ho}` : '-',
      status: item.isDeleted === 1 ? 'deleted' : 'active',
    }))
)

const fetchStats = async () => {
  try {
    const res = await getAdminFixedVisitorVehicleStats()
    const data = res.data
    statTotal.value = data.totalCount || 0
    statUnlimited.value = data.unlimitedCount || 0
    statMonth.value = data.monthCount || 0
    statActive.value = data.activeCount || 0
  } catch (e) {
    console.error('고정 방문차량 통계 조회 실패', e)
  }
}

const fetchList = async () => {
  try {
    const params = {page: currentPage.value, size: size.value}
    if (vehicleNumber.value) params.vehicleNumber = vehicleNumber.value
    if (dong.value) params.dong = dong.value
    const res = await getAdminFixedVisitorVehicles(params)
    const data = res.data
    list.value = data.content ?? data ?? []
    totalPages.value = data.totalPages ?? 0
    totalCount.value = data.totalCount ?? data.length ?? 0
  } catch (e) {
    console.error('고정 방문차량 목록 조회 실패', e)
  }
}

const fetchDongs = async () => {
  try {
    const res = await householdAPI.getDongs()
    dongOptions.value = res.data.resultData
  } catch (e) {
    console.error('동 목록 조회 실패', e)
  }
}

const doSearch = () => {
  currentPage.value = 1;
  fetchList()
}
const resetFilters = () => {
  vehicleNumber.value = '';
  dong.value = '';
  doSearch()
}
const goToPage = (page) => {
  currentPage.value = page;
  fetchList()
}

const openRegisterModal = () => {
  form.value = {vehicleNumber: '', visitorName: '', purpose: '', startDate: '', endDate: ''}
  registerModal.value.error = ''
  registerModal.value.loading = false
  registerModal.value.show = true
}
const closeRegisterModal = () => {
  registerModal.value.show = false
}

// 등록 제출 → 성공 시 등록 모달 닫고 ActionResultModal 오픈
const submitRegister = async () => {
  if (!form.value.vehicleNumber || !form.value.startDate) {
    registerModal.value.error = '차량번호와 시작일은 필수입니다.'
    return
  }
  registerModal.value.loading = true
  try {
    await adminRegisterFixedVisitorVehicle({
      ...form.value,
      endDate: form.value.endDate || null,
    })
    successModal.value.vehicleNumber = form.value.vehicleNumber
    closeRegisterModal()
    fetchList()
    fetchStats()
    successModal.value.show = true
  } catch (e) {
    registerModal.value.error = '등록에 실패했습니다.'
  } finally {
    registerModal.value.loading = false
  }
}

const openDetailModal = (item) => {
  detailModal.value.item = item;
  detailModal.value.show = true
}
const closeDetailModal = () => {
  detailModal.value.show = false;
  detailModal.value.item = null
}

const handleDelete = async () => {
  confirmModal.value.loading = true
  try {
    await deleteAdminFixedVisitorVehicle(detailModal.value.item.fixedId)
    confirmModal.value.show = false
    closeDetailModal()
    fetchList()
    fetchStats()
  } catch (e) {
    console.error('고정 방문차량 삭제 실패', e)
  } finally {
    confirmModal.value.loading = false
  }
}

onMounted(() => {
  registerOpenModal(openRegisterModal)
  fetchDongs()
  fetchStats()
  fetchList()
})
</script>

<template>
  <div class="fixed-vehicle-admin">

    <StatsCards :stats="statsData"/>

    <div class="table-section">
      <FilterBar @reset="resetFilters">
        <div class="search-wrap">
          <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input class="search-input" type="text" placeholder="차량번호 검색" v-model="vehicleNumber"
                 @keyup.enter="doSearch"/>
        </div>
        <select class="filter-select" v-model="dong" @change="doSearch">
          <option value="">전체 동</option>
          <option v-for="d in dongOptions" :key="d" :value="d">{{ d }}</option>
        </select>
      </FilterBar>

      <AdminTable :columns="columns" :rows="tableRows" @row-click="openDetailModal">
        <template #cell-status="{ row }">
          <span :class="['status-badge', row.status === 'deleted' ? 'status-deleted' : 'status-active']">
            {{ row.status === 'deleted' ? '삭제됨' : '활성' }}
          </span>
        </template>
      </AdminTable>

      <Pagination :currentPage="currentPage" :maxPage="totalPages" :totalAll="totalCount" :totalFiltered="totalCount"
                  unit="건" @change="goToPage"/>
    </div>

    <!-- 등록 모달: BaseModal -->
    <BaseModal v-if="registerModal.show" title="고정 방문차량 등록" subtitle="종료일 미입력 시 무기한으로 등록됩니다."
               @close="closeRegisterModal">
      <div class="form-group">
        <label class="form-label">차량번호 <span class="required">*</span></label>
        <input class="form-input" v-model="form.vehicleNumber" type="text" placeholder="예: 12가3456"/>
      </div>
      <div class="form-group">
        <label class="form-label">방문자 이름 <span class="required">*</span></label>
        <input class="form-input" v-model="form.visitorName" type="text" placeholder="홍길동"/>
      </div>
      <div class="form-group">
        <label class="form-label">방문 목적</label>
        <input class="form-input" v-model="form.purpose" type="text" placeholder="방문 목적 선택 또는 직접 입력"/>
        <div class="tag-list">
          <button v-for="tag in purposeTags" :key="tag" :class="['tag-btn', form.purpose === tag ? 'tag-active' : '']"
                  @click="selectPurposeTag(tag)">{{ tag }}
          </button>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">시작일 <span class="required">*</span></label>
          <input class="form-input" v-model="form.startDate" type="date" :min="today"/>
        </div>
        <div class="form-group">
          <label class="form-label">종료일 <span class="optional">(미입력 시 무기한)</span></label>
          <input class="form-input" v-model="form.endDate" type="date" :min="form.startDate || today"/>
        </div>
      </div>
      <p v-if="registerModal.error" class="form-error">{{ registerModal.error }}</p>
      <template #footer>
        <button class="btn-cancel" @click="closeRegisterModal">취소</button>
        <button class="btn-submit" @click="submitRegister" :disabled="registerModal.loading">
          {{ registerModal.loading ? '등록 중...' : '등록하기' }}
        </button>
      </template>
    </BaseModal>

    <!-- 등록 완료 모달: ActionResultModal (관리자 → theme="admin") -->
    <ActionResultModal
        v-if="successModal.show"
        type="success"
        title="등록 완료"
        subtitle="고정 방문차량이 등록되었습니다"
        :item-name="successModal.vehicleNumber"
        action-label="고정 방문차량 등록"
        confirm-text="확인"
        theme="admin"
        @close="successModal.show = false"
    />

    <!-- 상세 모달: BaseModal -->
    <BaseModal v-if="detailModal.show" title="고정 방문차량 상세" :subtitle="'ID #' + detailModal.item?.fixedId"
               @close="closeDetailModal">
      <div class="detail-hero">
        <h2 class="detail-title">{{ detailModal.item?.vehicleNumber }}</h2>
        <p class="detail-sub">{{ detailModal.item?.visitorName }}</p>
      </div>
      <div class="detail-divider"></div>
      <div class="detail-grid">
        <div class="detail-cell"><span class="detail-cell-label">차량번호</span><span
            class="detail-cell-value">{{ detailModal.item?.vehicleNumber }}</span></div>
        <div class="detail-cell"><span class="detail-cell-label">방문자</span><span
            class="detail-cell-value">{{ detailModal.item?.visitorName || '-' }}</span></div>
        <div class="detail-cell"><span class="detail-cell-label">방문 목적</span><span
            class="detail-cell-value">{{ detailModal.item?.purpose || '-' }}</span></div>
        <div class="detail-cell"><span class="detail-cell-label">세대</span><span
            class="detail-cell-value">{{ detailModal.item?.unit || '-' }}</span></div>
        <div class="detail-cell"><span class="detail-cell-label">시작일</span><span
            class="detail-cell-value">{{ detailModal.item?.startDate }}</span></div>
        <div class="detail-cell"><span class="detail-cell-label">종료일</span><span
            class="detail-cell-value">{{ detailModal.item?.endDate || '무기한' }}</span></div>
        <div class="detail-cell"><span class="detail-cell-label">등록자</span><span
            class="detail-cell-value">{{ detailModal.item?.userName || '-' }}</span></div>
        <div class="detail-cell"><span class="detail-cell-label">등록일</span><span
            class="detail-cell-value">{{ detailModal.item?.createdAt || '-' }}</span></div>
      </div>
      <template #footer>
        <div style="display:flex; justify-content:space-between; width:100%;">
          <button class="btn-danger-outline" @click="confirmModal.show = true" :disabled="detailModal.item?.isDeleted === 1">
            {{ detailModal.item?.isDeleted === 1 ? '이미 삭제됨' : '삭제' }}
          </button>
          <button class="btn-submit" @click="closeDetailModal">닫기</button>
        </div>
      </template>
    </BaseModal>

    <!-- 삭제 확인 모달: ConfirmModal (관리자 → theme="admin") -->
    <ConfirmModal
        v-if="confirmModal.show"
        title="고정 방문차량을 삭제하시겠습니까?"
        subtitle="삭제된 데이터는 복구할 수 없습니다."
        item-label="차량번호"
        action-text="방문자 · 세대"
        :item-name="detailModal.item?.vehicleNumber"
        :action-label="`${detailModal.item?.visitorName || '-'} · ${detailModal.item?.unit || '-'}`"
        confirm-text="삭제"
        confirm-type="danger"
        theme="admin"
        :loading="confirmModal.loading"
        @confirm="handleDelete"
        @cancel="confirmModal.show = false"
    />

  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.fixed-vehicle-admin {
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

.status-active {
  background: #C6F6D5;
  color: #276749;
}

.status-deleted {
  background: #FEE2E2;
  color: #E53E3E;
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
  margin-bottom: 14px;
}

.form-label {
  font-size: 13px;
  color: #687282;
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

.required {
  color: #E53E3E;
}

.optional {
  font-size: 11px;
  font-weight: 400;
  color: #687282;
  margin-left: 4px;
}

.form-error {
  font-size: 12px;
  color: #E53E3E;
  margin-top: 6px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
}

.tag-btn {
  padding: 5px 14px;
  border: 1px solid #E2E8F0;
  border-radius: 20px;
  font-size: 12px;
  background: #fff;
  color: #687282;
  cursor: pointer;
  transition: all 0.12s;
}

.tag-btn:hover {
  background: #EEF0FD;
  border-color: #2B3A55;
  color: #2B3A55;
}

.tag-active {
  background: #EEF0FD;
  border-color: #2B3A55;
  color: #2B3A55;
  font-weight: 600;
}

.detail-hero {
  margin-bottom: 14px;
}

.detail-title {
  font-size: 20px;
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

.btn-cancel {
  padding: 9px 20px;
  border: 1px solid #E2E8F0;
  border-radius: 7px;
  background: #fff;
  font-size: 13px;
  color: #333;
  cursor: pointer;
}

.btn-cancel:hover {
  background: #F5F6F8;
}

.btn-danger {
  padding: 9px 14px;
  background: #FFF5F5;
  color: #E53E3E;
  border: 1px solid #FECACA;
  border-radius: 7px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.btn-danger:hover:not(:disabled) {
  background: #FECACA;
}

.btn-danger:disabled {
  opacity: 0.5;
  cursor: default;
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

.btn-danger-outline {
  padding: 9px 14px;
  background: #fff;
  color: #E53E3E;
  border: 1px solid #FECACA;
  border-radius: 7px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.btn-danger-outline:hover:not(:disabled) {
  background: #E53E3E;
  color: #fff
}

.btn-danger-outline:disabled {
  opacity: 0.5;
  cursor: default;
}
</style>