<script setup>
import {ref, computed, inject, onMounted} from 'vue'
import {
  getAdminFixedVisitorVehicles,
  getAdminFixedVisitorVehicleStats,
  registerFixedVisitorVehicle
} from '@/api/visitorVehicle.js'
import householdAPI from '@/api/household.js'

import Modal from '@/components/Modal.vue'
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
const dongOptions = ref([])  // ← 추가

const registerModal = ref({show: false, loading: false, error: ''})
const form = ref({vehicleNumber: '', visitorName: '', purpose: '', startDate: '', endDate: ''})

const today = new Date().toISOString().slice(0, 10)

const columns = [
  {label: '차량번호', key: 'vehicleNumber'},
  {label: '방문자', key: 'visitorName'},
  {label: '방문 목적', key: 'purpose'},
  {label: '시작일', key: 'startDate'},
  {label: '종료일', key: 'endDate'},
  {label: '등록자', key: 'userName'},
  {label: '세대', key: 'unit'},
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
    list.value = data.content
    totalPages.value = data.totalPages
    totalCount.value = data.totalCount
  } catch (e) {
    console.error('고정 방문차량 목록 조회 실패', e)
  }
}

// ← 추가
const fetchDongs = async () => {
  try {
    const res = await householdAPI.getDongs()
    dongOptions.value = res.data.resultData
  } catch (e) {
    console.error('동 목록 조회 실패', e)
  }
}

const doSearch = () => {
  currentPage.value = 1
  fetchList()
}

const resetFilters = () => {
  vehicleNumber.value = ''
  dong.value = ''
  doSearch()
}

const goToPage = (page) => {
  currentPage.value = page
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

const submitRegister = async () => {
  if (!form.value.vehicleNumber || !form.value.startDate) {
    registerModal.value.error = '차량번호와 시작일은 필수입니다.'
    return
  }
  registerModal.value.loading = true
  try {
    await registerFixedVisitorVehicle({
      ...form.value,
      endDate: form.value.endDate || null,
    })
    closeRegisterModal()
    fetchList()
    fetchStats()
  } catch (e) {
    registerModal.value.error = '등록에 실패했습니다.'
  } finally {
    registerModal.value.loading = false
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
          <input class="search-input" type="text" placeholder="차량번호 검색"
                 v-model="vehicleNumber" @keyup.enter="doSearch"/>
        </div>

        <!-- ← 텍스트 인풋 제거 후 셀렉트로 교체 -->
        <select class="filter-select" v-model="dong" @change="doSearch">
          <option value="">전체 동</option>
          <option v-for="d in dongOptions" :key="d" :value="d">{{ d }}</option>
        </select>

      </FilterBar>

      <AdminTable :columns="columns" :rows="tableRows"/>

      <Pagination
          :currentPage="currentPage"
          :maxPage="totalPages"
          :totalAll="totalCount"
          :totalFiltered="totalCount"
          unit="건"
          @change="goToPage"
      />

    </div>

    <Modal v-if="registerModal.show" title="고정 방문차량 등록"
               subtitle="종료일 미입력 시 무기한으로 등록됩니다." @close="closeRegisterModal">

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
        <input class="form-input" v-model="form.purpose" type="text" placeholder="방문 목적"/>
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

    </Modal>

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
  color: #A0AEC0;
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

/* ← 추가 */
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
  font-weight: 600;
  color: #4A5568;
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
  color: #A0AEC0;
  margin-left: 4px;
}

.form-error {
  font-size: 12px;
  color: #E53E3E;
  margin-top: 6px;
}

.btn-cancel {
  padding: 9px 20px;
  border: 1px solid #E2E8F0;
  border-radius: 7px;
  background: #fff;
  font-size: 13px;
  color: #718096;
  cursor: pointer;
}

.btn-cancel:hover {
  background: #F5F6F8;
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
</style>