<script setup>
import { computed, onMounted, reactive, ref, watch, inject  } from 'vue'
import { useRoute } from 'vue-router'
import vehicleAPI from '@/api/vehicle.js'
import { useVehicleStore } from '@/stores/modules/vehicle.js'

import StatsCards from '@/components/admin/StatsCards.vue'
import FilterBar from '@/components/layout/FilterBar.vue';
import AdminTable from '@/components/admin/AdminTable.vue'
import Pagination from '@/components/layout/Pagination.vue'
import BaseModal  from '@/components/common/BeseModel.vue'

const route        = useRoute()
const vehicleStore = useVehicleStore()
const registerOpenModal = inject('registerOpenModal')


// 상태 관리
const state = reactive({
  list:             [],
  searchQuery:      '',
  filterStatus:     '',
  filterHousehold:  '',
  filterType:       '',
  filterDong:       '',
  dongs:            [],
  size:             10,
  currentPage:      1,
  maxPage:          0,
  totalFiltered:    0,
  totalAll:         0,
})

// 모달 상태
const detailModal   = reactive({ show: false, vehicle: null })
const approveModal  = reactive({ show: false, vehicle: null, loading: false })
const rejectModal   = reactive({ show: false, vehicle: null, loading: false, reason: '', memo: '' })
const registerModal = reactive({ show: false, loading: false })
const successModal  = reactive({ show: false, message: '' })

// 등록 폼 데이터
const registerForm  = reactive({
  dong:         '',
  householdId:  null,
  userId:       null,
  licensePlate: '',
  carModel:     '',
  carType:      '',
})

// 필드별 에러 메시지
const errors = reactive({
  userId:       '',
  licensePlate: '',
  carModel:     '',
  carType:      '',
  general:      '',
})

const registerDongs      = ref([])
const registerHouseholds = ref([])
const registerResidents  = ref([])
const vehicleCount       = ref(0)

const rejectReasons = ['중복 차량', '세대 한도 초과', '정보 불일치', '직접 입력']

// 테이블 컬럼 정의
const columns = [
  { label: 'ID',       key: 'vehicleId' },
  { label: '차량번호',  key: 'licensePlate' },
  { label: '차종',      key: 'carModel' },
  { label: '소속 세대', key: 'household' },
  { label: '등록자',    key: 'user' },
  { label: '승인 상태', key: 'status' },
  { label: '등록일',    key: 'createdAt' },
]

// 통계 카드 데이터
const statsCards = computed(() => [
  { label: '전체 등록 차량', value: vehicleStore.total, unit: '대', desc: '승인 완료 기준', status: '' },
  { label: '승인 대기', value: vehicleStore.pending, unit: '대', desc: '즉시 처리 필요', descClass: 'urgent', status: 'PENDING' },
  { label: '승인 완료', value: vehicleStore.approved, unit: '대', desc: '정상 등록', status: 'APPROVED' },
  { label: '거부', value: vehicleStore.rejected, unit: '대', desc: '재신청 가능', status: 'REJECTED' },
])

// 헬퍼 함수
const statusLabel = (s) => ({ APPROVED: '승인', PENDING: '대기', REJECTED: '거부' }[s] ?? s)
const statusClass = (s) => ({ APPROVED: 'approved', PENDING: 'pending', REJECTED: 'rejected' }[s] ?? '')
const formatDate  = (val) => val ? val.replace('T', ' ').substring(0, 16) : '-'

const householdLabel = (household) => {
  if (!household) return '-'
  return `${household.dong ?? ''} ${household.ho ?? ''}`.trim() || '-'
}

const getInitial = (name) => {
  if (!name) return '?'
  return name.charAt(0)
}

const getApprovalDate = (vehicle) => {
  if (vehicle?.approvedAt) return formatDate(vehicle.approvedAt)
  if (vehicle?.status === 'REJECTED' && vehicle?.deletedAt) return formatDate(vehicle.deletedAt)
  if (vehicle?.updatedAt && vehicle?.status !== 'PENDING') return formatDate(vehicle.updatedAt)
  return '-'
}

const getApprover = (vehicle) => {
  if (vehicle?.approvedBy) return '관리자'
  if (vehicle?.rejectedBy) return '관리자'
  if (vehicle?.status === 'APPROVED' || vehicle?.status === 'REJECTED') return '관리자'
  return '-'
}

// 대기 상태를 최상단으로 정렬
const sortByPendingFirst = (list) =>
  [...list].sort((a, b) => {
    if (a.status === 'PENDING' && b.status !== 'PENDING') return -1
    if (a.status !== 'PENDING' && b.status === 'PENDING') return 1
    return 0
  })

// API 호출 함수
const fetchVehicles = async () => {
  try {
    const { data } = await vehicleAPI.getAllVehicles({
      search:      state.searchQuery    || null,
      status:      state.filterStatus   || null,
      householdId: state.filterHousehold || null,
      carType:     state.filterType     || null,
      dong:        state.filterDong     || null,
      page:        state.currentPage - 1,
      size:        state.size,
    })
    
    const result        = data.resultData
    state.list          = sortByPendingFirst(result.content ?? [])
    state.maxPage       = result.totalPages ?? 0
    state.totalFiltered = result.content?.length ?? 0 
    state.totalAll      = vehicleStore.total ?? 0
    
  } catch (e) { console.error('차량 목록 조회 실패', e) }
}

const fetchStats = () => vehicleStore.fetchStats()

const fetchDongs = async () => {
  try {
    const { data } = await vehicleAPI.getDongs()
    state.dongs = data.resultData ?? []
  } catch (e) { console.error('동 목록 조회 실패', e) }
}

// 통계 카드 클릭 핸들러
const handleStatsCardClick = (card) => {
  state.filterStatus = card.status
  state.currentPage = 1
  fetchVehicles()
}

// 성공 모달
const openSuccessModal = (message) => {
  successModal.message = message
  successModal.show = true
}

const closeSuccessModal = () => {
  successModal.show = false
  successModal.message = ''
}

// 상세 모달
const openDetailModal = async (vehicle) => { 
  detailModal.vehicle = vehicle
  detailModal.show = true
  
  if (vehicle?.household?.dong) {
    try {
      const { data } = await vehicleAPI.getAllVehicles({ 
        dong: vehicle.household.dong,
        size: 999,
        status: null
      })
      
      const sameHouseholdVehicles = data.resultData?.content?.filter(
        v => v.household?.ho === vehicle.household.ho
      ) ?? []
      
      vehicleCount.value = sameHouseholdVehicles.length
    } catch (e) { 
      console.error('차량 개수 조회 실패', e)
      vehicleCount.value = 0
    }
  } else {
    vehicleCount.value = 0
  }
}

const closeDetailModal = () => { 
  detailModal.show = false
  detailModal.vehicle = null 
}

// 승인 모달
const openApproveModal  = (vehicle) => { 
  approveModal.vehicle = vehicle
  approveModal.loading = false
  approveModal.show = true 
}

const closeApproveModal = () => { 
  approveModal.show = false
  approveModal.vehicle = null 
}

const handleApprove = async () => {
  approveModal.loading = true
  try {
    await vehicleAPI.approveVehicle(approveModal.vehicle.vehicleId)
    closeApproveModal()
    await Promise.all([fetchVehicles(), fetchStats()])
  } catch (e) { 
    console.error('승인 실패', e) 
  } finally { 
    approveModal.loading = false 
  }
}

// 거부 모달
const openRejectModal = (vehicle) => {
  rejectModal.vehicle = vehicle
  rejectModal.loading = false
  rejectModal.reason  = ''
  rejectModal.memo    = ''
  rejectModal.show    = true
}

const closeRejectModal = () => { 
  rejectModal.show = false
  rejectModal.vehicle = null 
}

const handleReject = async () => {
  rejectModal.loading = true
  try {
    await vehicleAPI.rejectVehicle(rejectModal.vehicle.vehicleId)
    closeRejectModal()
    await Promise.all([fetchVehicles(), fetchStats()])
  } catch (e) { 
    console.error('거부 실패', e) 
  } finally { 
    rejectModal.loading = false 
  }
}

// 등록 모달
const openRegisterModal = async () => {
  registerForm.dong         = ''
  registerForm.householdId  = null
  registerForm.userId       = null
  registerForm.licensePlate = ''
  registerForm.carModel     = ''
  registerForm.carType      = ''
  
  errors.userId       = ''
  errors.licensePlate = ''
  errors.carModel     = ''
  errors.carType      = ''
  errors.general      = ''
  
  registerHouseholds.value  = []
  registerResidents.value   = []
  vehicleCount.value        = 0

  try {
    const { data } = await vehicleAPI.getHouseholdDongs()
    registerDongs.value = data.resultData ?? []
  } catch (e) { 
    console.error('동 목록 조회 실패', e) 
  }

  registerModal.show = true
}

const closeRegisterModal = () => { 
  registerModal.show = false 
}

const onDongChange = async () => {
  registerForm.householdId  = null
  registerForm.userId       = null
  registerResidents.value   = []
  vehicleCount.value        = 0

  if (!registerForm.dong) { 
    registerHouseholds.value = []
    return 
  }
  
  try {
    const { data } = await vehicleAPI.getHouseholds({ dong: registerForm.dong })
    registerHouseholds.value = data.resultData ?? []
  } catch (e) { 
    console.error('세대 목록 조회 실패', e) 
  }
}

const onHouseholdChange = async () => {
  registerForm.userId = null
  vehicleCount.value  = 0

  if (!registerForm.householdId) { 
    registerResidents.value = []
    return 
  }
  
  try {
    const [residentRes, vehicleRes] = await Promise.all([
      vehicleAPI.getResidents(registerForm.householdId),
      vehicleAPI.getAllVehicles({ householdId: registerForm.householdId, size: 999 }),
    ])
    registerResidents.value = residentRes.data.resultData ?? []
    vehicleCount.value = vehicleRes.data.resultData?.content?.length ?? 0
  } catch (e) { 
    console.error('입주민/차량 조회 실패', e) 
  }
}

const handleRegister = async () => {
  // 에러 초기화
  errors.userId = ''
  errors.licensePlate = ''
  errors.carModel = ''
  errors.carType = ''
  errors.general = ''

  // 유효성 검사
  if (!registerForm.userId) {
    errors.userId = '입주민을 선택해주세요.'
    return
  }
  if (!registerForm.licensePlate) {
    errors.licensePlate = '차량 번호를 입력해주세요.'
    return
  }
  if (!registerForm.carModel) {
    errors.carModel = '차 모델을 입력해주세요.'
    return
  }
  if (!registerForm.carType) {
    errors.carType = '차종을 선택해주세요.'
    return
  }
  if (vehicleCount.value >= 2) {
    errors.general = '세대당 최대 2대까지 등록 가능합니다.'
    return
  }

  // 중복 체크 (REJECTED 제외)
  try {
    const { data } = await vehicleAPI.getAllVehicles({ 
      search: registerForm.licensePlate,
      size: 999 
    })
    
    const existingVehicle = data.resultData?.content?.find(
      v => v.licensePlate === registerForm.licensePlate && 
           (v.status === 'APPROVED' || v.status === 'PENDING')
    )
    
    if (existingVehicle) {
      errors.licensePlate = '이미 등록된 차량입니다. (승인 또는 대기 중)'
      return
    }
  } catch (e) {
    console.error('중복 체크 실패:', e)
  }

  registerModal.loading = true
  
   try {
    // APPROVED 상태로 등록
    await vehicleAPI.adminRegisterVehicle({
      userId:       registerForm.userId,
      licensePlate: registerForm.licensePlate,
      carModel:     registerForm.carModel,
      carType:      registerForm.carType,
      status:       'APPROVED',
    })
    closeRegisterModal()
     
    // 약간의 딜레이 후 새로고침 (DB 커밋 대기)
    await new Promise(resolve => setTimeout(resolve, 500))
    
    await Promise.all([fetchVehicles(), fetchStats()])
    openSuccessModal('차량이 등록되었습니다.')
  } catch (e) {
    console.error('등록 실패:', e)
    const errorMsg = e.response?.data?.resultMessage ?? '등록에 실패했습니다.'
    if (errorMsg.includes('차량') || errorMsg.includes('번호')) {
      errors.licensePlate = errorMsg
    } else {
      errors.general = errorMsg
    }
  } finally {
    registerModal.loading = false
  }
}

// 검색 및 필터
watch(() => route.query.register, (val) => {
  if (val) openRegisterModal()
})

const doSearch = () => { 
  state.currentPage = 1
  fetchVehicles() 
}

let searchTimer = null
const onSearch = () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => doSearch(), 300)
}

const resetFilters = () => {
  state.searchQuery     = ''
  state.filterStatus    = ''
  state.filterHousehold = ''
  state.filterType      = ''
  state.filterDong      = ''
  state.currentPage     = 1
  fetchVehicles()
}

const goToPage = (page) => { 
  state.currentPage = page
  fetchVehicles() 
}

onMounted(() => { 
  fetchVehicles()
  fetchStats()
  fetchDongs() 

  // 모달 열기 함수 등록
  if (registerOpenModal) {
    registerOpenModal(openRegisterModal)
  }
})
</script>

<template>
  <div class="vehicle-list-view">

    <!-- 통계 카드 -->
    <div class="stats-cards">
      <div 
        v-for="(stat, index) in statsCards" 
        :key="index" 
        class="stat-card"
        @click="handleStatsCardClick(stat)"
      >
        <div class="stat-label">{{ stat.label }}</div>
        <div class="stat-value-wrap">
          <span class="stat-value">{{ stat.value }}</span>
          <span class="stat-unit">{{ stat.unit }}</span>
        </div>
        <div class="stat-desc" :class="stat.descClass">{{ stat.desc }}</div>
      </div>
    </div>

    <div class="table-section">

      <!-- 필터 및 검색 -->
      <FilterBar @reset="resetFilters">
        <div class="search-wrap">
          <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input v-model="state.searchQuery" class="search-input" placeholder="차량번호, 차종, 세대 검색" @input="onSearch" />
        </div>
        <select v-model="state.filterStatus" class="filter-select" @change="doSearch">
          <option value="">승인 상태</option>
          <option value="APPROVED">승인</option>
          <option value="PENDING">대기</option>
          <option value="REJECTED">거부</option>
        </select>
        <select v-model="state.filterDong" class="filter-select" @change="doSearch">
          <option value="">세대 선택</option>
          <option v-for="dong in state.dongs" :key="dong" :value="dong">{{ dong }}</option>
        </select>
        <select v-model="state.filterType" class="filter-select" @change="doSearch">
          <option value="">차종</option>
          <option value="경차">경차</option>
          <option value="승용차">승용차</option>
          <option value="SUV">SUV</option>
          <option value="승합차">승합차</option>
        </select>
      </FilterBar>

      <!-- 테이블 -->
      <AdminTable :columns="columns" :rows="state.list" @row-click="openDetailModal">      
        <template #cell-vehicleId="{ row }">
          <span class="td-cell td-id">#{{ row.vehicleId }}</span>
        </template>
        <template #cell-licensePlate="{ row }">
          <span class="td-cell td-plate">{{ row.licensePlate }}</span>
        </template>
        <template #cell-carModel="{ row }">
          <span class="td-cell">{{ row.carModel ?? '-' }}</span>
        </template>
        <template #cell-household="{ row }">
          <span class="td-cell">{{ householdLabel(row.household) }}</span>
        </template>
        <template #cell-user="{ row }">
          <span class="td-cell">{{ row.user?.name ?? '-' }}</span>
        </template>
        <template #cell-status="{ row }">
          <span class="td-cell status-badge" :class="statusClass(row.status)">
            {{ statusLabel(row.status) }}
          </span>
        </template>
        <template #cell-createdAt="{ row }">
          <span class="td-cell">{{ formatDate(row.createdAt) }}</span>
        </template>
        <template #action="{ row }">
          <div class="action-buttons">
            <template v-if="row.status === 'PENDING'">
              <button class="btn-approve" @click.stop="openApproveModal(row)">승인</button>
              <button class="btn-reject"  @click.stop="openRejectModal(row)">거부</button>
            </template>
          </div>
        </template>
      </AdminTable>

      <!-- 페이지네이션 -->
      <Pagination
        :currentPage="state.currentPage"
        :maxPage="state.maxPage"
        :totalAll="state.totalAll"
        :totalFiltered="state.totalFiltered"
        unit="대"
        @change="goToPage"
      />
    </div>

    <!-- 상세 모달 -->
    <BaseModal v-if="detailModal.show" title="차량 상세 정보" :subtitle="'ID #' + detailModal.vehicle?.vehicleId" @close="closeDetailModal">
      
      <div class="new-modal-badge-wrap">
        <span :class="['new-modal-badge', statusClass(detailModal.vehicle?.status)]">
          {{ statusLabel(detailModal.vehicle?.status) }}
        </span>
      </div>

      <h2 class="new-modal-title">{{ detailModal.vehicle?.licensePlate }}</h2>

      <p class="new-modal-subtitle">
        {{ detailModal.vehicle?.carModel ?? '-' }} · {{ householdLabel(detailModal.vehicle?.household) }}
      </p>

      <div class="new-modal-grid">
        <div class="new-modal-cell">
          <span class="new-modal-label">차량 ID</span>
          <span class="new-modal-value">#{{ detailModal.vehicle?.vehicleId }}</span>
        </div>
        <div class="new-modal-cell">
          <span class="new-modal-label">차량번호</span>
          <span class="new-modal-value">{{ detailModal.vehicle?.licensePlate }}</span>
        </div>
        <div class="new-modal-cell">
          <span class="new-modal-label">차종</span>
          <span class="new-modal-value">{{ detailModal.vehicle?.carModel ?? '-' }}</span>
        </div>
        <div class="new-modal-cell">
          <span class="new-modal-label">소속 세대</span>
          <span class="new-modal-value">{{ householdLabel(detailModal.vehicle?.household) }}</span>
        </div>
        <div class="new-modal-cell">
          <span class="new-modal-label">등록자</span>
          <span class="new-modal-value">{{ detailModal.vehicle?.user?.name ?? '-' }}</span>
        </div>
        <div class="new-modal-cell">
          <span class="new-modal-label">등록일</span>
          <span class="new-modal-value">{{ formatDate(detailModal.vehicle?.createdAt) }}</span>
        </div>
        <div class="new-modal-cell">
          <span class="new-modal-label">승인 상태</span>
          <span :class="['new-modal-badge', statusClass(detailModal.vehicle?.status)]">
            {{ statusLabel(detailModal.vehicle?.status) }}
          </span>
        </div>
        <div class="new-modal-cell">
          <span class="new-modal-label">승인/거부일</span>
          <span class="new-modal-value">{{ getApprovalDate(detailModal.vehicle) }}</span>
        </div>
        <div class="new-modal-cell">
          <span class="new-modal-label">승인자</span>
          <span class="new-modal-value">{{ getApprover(detailModal.vehicle) }}</span>
        </div>
      </div>

      <div class="new-modal-section-title">소속 세대 정보</div>

      <div class="new-modal-household">
        <div class="new-modal-avatar">{{ getInitial(detailModal.vehicle?.user?.name) }}</div>
        <div class="new-modal-household-info">
          <div class="new-modal-household-name">{{ detailModal.vehicle?.user?.name ?? '-' }}</div>
          <div class="new-modal-household-desc">{{ householdLabel(detailModal.vehicle?.household) }} · 세대주</div>
        </div>
        <div class="new-modal-household-badge">차량 {{ vehicleCount }}개 보유</div>
      </div>

      <template #footer>
        <button class="new-modal-close-btn" @click="closeDetailModal">닫기</button>
      </template>
    </BaseModal>

    <!-- 승인 모달 -->
    <BaseModal v-if="approveModal.show" title="차량을 승인하시겠습니까?" @close="closeApproveModal">
      <div class="confirm-vehicle-card">
        <div class="confirm-vehicle-info">
          <span class="confirm-plate">{{ approveModal.vehicle?.licensePlate }}</span>
          <span class="status-badge pending">대기</span>
        </div>
        <p class="confirm-vehicle-sub">{{ approveModal.vehicle?.carModel ?? '-' }} · {{ householdLabel(approveModal.vehicle?.household) }}</p>
      </div>
      <p class="confirm-hint">승인 시 해당 세대에 알림이 발송됩니다.</p>
      <template #footer>
        <button class="btn-cancel" @click="closeApproveModal">취소</button>
        <button class="btn-submit-approve" @click="handleApprove" :disabled="approveModal.loading">{{ approveModal.loading ? '처리 중...' : '승인' }}</button>
      </template>
    </BaseModal>

    <!-- 거부 모달 -->
    <BaseModal v-if="rejectModal.show" title="차량 거부" :subtitle="'ID ' + rejectModal.vehicle?.vehicleId" @close="closeRejectModal">
      <div class="confirm-vehicle-card">
        <div class="confirm-vehicle-info">
          <span class="confirm-plate">{{ rejectModal.vehicle?.licensePlate }}</span>
          <span class="status-badge pending">대기</span>
        </div>
        <p class="confirm-vehicle-sub">{{ rejectModal.vehicle?.carModel ?? '-' }} · {{ householdLabel(rejectModal.vehicle?.household) }}</p>
      </div>
      <div class="form-group">
        <label class="form-label">거부 사유 <span class="required">*</span></label>
        <select class="form-select" v-model="rejectModal.reason">
          <option value="">사유 선택</option>
          <option v-for="r in rejectReasons" :key="r" :value="r">{{ r }}</option>
        </select>
      </div>
      <div class="reason-chips">
        <button v-for="r in rejectReasons" :key="r" :class="['reason-chip', { active: rejectModal.reason === r }]" @click="rejectModal.reason = r">{{ r }}</button>
      </div>
      <div class="form-group">
        <label class="form-label">상세 내용 (선택)</label>
        <textarea class="form-textarea" v-model="rejectModal.memo" placeholder="거부 사유를 상세히 입력해주세요." rows="3" />
      </div>
      <template #footer>
        <button class="btn-cancel" @click="closeRejectModal">취소</button>
        <button class="btn-submit-reject" @click="handleReject" :disabled="rejectModal.loading || !rejectModal.reason">{{ rejectModal.loading ? '처리 중...' : '거부 확인' }}</button>
      </template>
    </BaseModal>

    <!-- 차량 등록 모달 -->
    <BaseModal v-if="registerModal.show" title="차량 등록" subtitle="새 차량 정보를 입력해주세요" @close="closeRegisterModal">

      <div class="form-group">
        <label class="form-label">소속 세대 <span class="required">*</span></label>
        <div class="form-row-2">
          <select v-model="registerForm.dong" class="form-select" @change="onDongChange">
            <option value="">동 선택</option>
            <option v-for="dong in registerDongs" :key="dong" :value="dong">{{ dong }}</option>
          </select>
          <select v-model="registerForm.householdId" class="form-select" @change="onHouseholdChange" :disabled="!registerForm.dong">
            <option :value="null">호수 선택</option>
            <option v-for="h in registerHouseholds" :key="h.householdId" :value="h.householdId">{{ h.ho }}</option>
          </select>
        </div>
        <div v-if="registerForm.householdId" class="vehicle-count-badge" :class="{ full: vehicleCount >= 2 }">
          현재 등록 차량 {{ vehicleCount }} / 2대
          <span v-if="vehicleCount >= 2"> · 등록 불가</span>
        </div>
        <span v-if="errors.general" class="field-error">{{ errors.general }}</span>
      </div>

      <div class="form-group">
        <label class="form-label">등록자 (입주민) <span class="required">*</span></label>
        <select 
          v-model="registerForm.userId" 
          class="form-select"
          :class="{ 'input-error': errors.userId }"
          :disabled="!registerForm.householdId"
        >
          <option :value="null">입주민 선택</option>
          <option v-for="r in registerResidents" :key="r.userId" :value="r.userId">{{ r.name }}</option>
        </select>
        <span v-if="errors.userId" class="field-error">{{ errors.userId }}</span>
      </div>

      <div class="form-group">
        <label class="form-label">차량 번호 <span class="required">*</span></label>
        <input 
          v-model="registerForm.licensePlate" 
          class="form-input"
          :class="{ 'input-error': errors.licensePlate }"
          placeholder="예: 12가 3456" 
        />
        <span v-if="errors.licensePlate" class="field-error">{{ errors.licensePlate }}</span>
      </div>

      <div class="form-row-2">
        <div class="form-group">
          <label class="form-label">차 모델 <span class="required">*</span></label>
          <input 
            v-model="registerForm.carModel" 
            class="form-input" 
            :class="{ 'input-error': errors.carModel }"
            placeholder="예: 현대 소나타" 
          />
          <span v-if="errors.carModel" class="field-error">{{ errors.carModel }}</span>
        </div>
        <div class="form-group">
          <label class="form-label">차종 <span class="required">*</span></label>
          <select 
            v-model="registerForm.carType" 
            class="form-select"
            :class="{ 'input-error': errors.carType }"
          >
            <option value="">선택</option>
            <option value="경차">경차</option>
            <option value="승용차">승용차</option>
            <option value="SUV">SUV</option>
            <option value="승합차">승합차</option>
          </select>
          <span v-if="errors.carType" class="field-error">{{ errors.carType }}</span>
        </div>
      </div>

      <div class="form-divider"></div>

      <template #footer>
        <span class="form-hint">* 표시는 필수 입력 항목입니다.</span>
        <button type="button" class="btn-cancel" @click="closeRegisterModal">취소</button>
        <button 
          type="button"
          class="btn-submit-approve" 
          @click="handleRegister" 
          :disabled="registerModal.loading || vehicleCount >= 2"
        >
          {{ registerModal.loading ? '등록 중...' : '등록하기' }}
        </button>
      </template>
    </BaseModal>

    <!-- 성공 모달 -->
    <BaseModal v-if="successModal.show" title="등록 완료" @close="closeSuccessModal">
      <div class="success-modal-content">
        <div class="success-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4D8B5A" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9 12l2 2 4-4"/>
          </svg>
        </div>
        <p class="success-message">{{ successModal.message }}</p>
      </div>
      <template #footer>
        <button class="btn-submit-approve" style="width: 100%;" @click="closeSuccessModal">확인</button>
      </template>
    </BaseModal>

  </div>
</template>

<style scoped>
* { box-sizing: border-box; margin: 0; padding: 0; }
.vehicle-list-view { display: flex; flex-direction: column; font-family: 'Noto Sans KR', sans-serif; color: #333; }

/* 통계 카드 */
.stats-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px; }
.stat-card { background: #fff; border: 1px solid #E2E8F0; border-radius: 10px; padding: 20px; cursor: pointer; transition: all 0.2s; }
.stat-card:hover { border-color: #2B3A55; box-shadow: 0 4px 12px rgba(43, 58, 85, 0.1); transform: translateY(-2px); }
.stat-label { font-size: 13px; color: #718096; margin-bottom: 8px; }
.stat-value-wrap { display: flex; align-items: baseline; gap: 4px; margin-bottom: 4px; }
.stat-value { font-size: 28px; font-weight: 700; color: #1A202C; }
.stat-unit { font-size: 14px; color: #A0AEC0; }
.stat-desc { font-size: 11px; color: #A0AEC0; }
.stat-desc.urgent { color: #E53E3E; font-weight: 600; }

/* 테이블 영역 */
.table-section { background: #fff; border-radius: 10px; border: 1px solid #E2E8F0; overflow: hidden; }
.search-wrap { display: flex; align-items: center; border: 1px solid #E2E8F0; border-radius: 7px; padding: 7px 12px; gap: 6px; background: #F5F6F8; }
.search-icon { color: #A0AEC0; flex-shrink: 0; }
.search-input { border: none; background: transparent; font-size: 13px; outline: none; color: #333; width: 150px; font-family: 'Noto Sans KR', sans-serif; }
.search-input::placeholder { color: #CBD5E0; }
.filter-select { border: 1px solid #E2E8F0; border-radius: 7px; padding: 7px 28px 7px 12px; font-size: 13px; color: #333; background: #fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23A0AEC0' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat right 10px center; appearance: none; cursor: pointer; outline: none; font-family: 'Noto Sans KR', sans-serif; }

/* 상태 뱃지 */
.status-badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
.status-badge.approved { background: #EBF5EE; color: #4D8B5A; }
.status-badge.pending { background: #FEF9C3; color: #ca8a04; }
.status-badge.rejected { background: #FEE2E2; color: #E53E3E; }

/* 테이블 셀 */
.td-cell { display: block; width: 100%; height: 100%; padding: 13px 16px; box-sizing: border-box; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.td-id { color: #A0AEC0; font-size: 12px; }
.td-plate { font-weight: 600; }

/* 액션 버튼 */
.action-buttons { display: flex; gap: 6px; align-items: center; justify-content: center; }
.btn-approve { padding: 4px 14px; background: #EBF5EE; color: #4D8B5A; border: 1px solid #C6E6CC; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: 'Noto Sans KR', sans-serif; }
.btn-approve:hover { background: #d4edda; }
.btn-reject { padding: 4px 14px; background: #FEE2E2; color: #E53E3E; border: 1px solid #FECACA; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: 'Noto Sans KR', sans-serif; }
.btn-reject:hover { background: #fecaca; }

/* 상세 모달 */
.new-modal-badge-wrap { margin-bottom: 16px; }
.new-modal-badge { display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 11px; font-weight: 500; width: fit-content; }
.new-modal-badge.approved { background: #C6F6D5; color: #276749; }
.new-modal-badge.pending { background: #FEFCE8; color: #C08B2D; }
.new-modal-badge.rejected { background: #FFF5F5; color: #E53E3E; }
.new-modal-title { font-size: 22px; font-weight: 700; color: #1A202C; margin-bottom: 8px; line-height: 1.2; }
.new-modal-subtitle { font-size: 11px; color: #A0AEC0; margin-bottom: 20px; }
.new-modal-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 32px; }
.new-modal-cell { display: flex; flex-direction: column; gap: 4px; }
.new-modal-label { font-size: 11px; color: #A0AEC0; font-weight: 400; }
.new-modal-value { font-size: 13px; color: #1A202C; font-weight: 500; }
.new-modal-section-title { font-size: 12px; font-weight: 600; color: #4A5568; margin-bottom: 16px; margin-top: 8px; }
.new-modal-household { display: flex; align-items: center; gap: 12px; background: #F7FAFC; padding: 16px; border-radius: 12px; margin-bottom: 24px; }
.new-modal-avatar { width: 40px; height: 40px; border-radius: 50%; background: #2D3748; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700; flex-shrink: 0; }
.new-modal-household-info { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.new-modal-household-name { font-size: 13px; font-weight: 700; color: #1A202C; }
.new-modal-household-desc { font-size: 11px; color: #A0AEC0; }
.new-modal-household-badge { padding: 6px 14px; background: #E2E8F0; color: #4A5568; border-radius: 20px; font-size: 12px; font-weight: 600; white-space: nowrap; }
.new-modal-close-btn { width: 100%; padding: 12px; background: #2D3748; color: #fff; border: none; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'Noto Sans KR', sans-serif; transition: background 0.2s; }
.new-modal-close-btn:hover { background: #1A202C; }

/* 승인/거부 확인 모달 */
.confirm-vehicle-card { background: #F5F6F8; border-radius: 8px; padding: 14px 16px; margin-bottom: 16px; }
.confirm-vehicle-info { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
.confirm-plate { font-size: 15px; font-weight: 700; color: #1A202C; }
.confirm-vehicle-sub { font-size: 12px; color: #718096; }
.confirm-hint { font-size: 12px; color: #A0AEC0; text-align: center; margin-top: 8px; }

/* 성공 모달 */
.success-modal-content { display: flex; flex-direction: column; align-items: center; padding: 20px 0; }
.success-icon { margin-bottom: 16px; }
.success-message { font-size: 15px; font-weight: 600; color: #1A202C; text-align: center; }

/* 폼 스타일 */
.form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
.form-label { font-size: 13px; font-weight: 600; color: #4A5568; }
.required { color: #E53E3E; }
.form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.form-input { border: 1px solid #E2E8F0; border-radius: 7px; padding: 10px 14px; font-size: 13px; color: #333; outline: none; width: 100%; font-family: 'Noto Sans KR', sans-serif; }
.form-input:focus { border-color: #2B3A55; }
.field-error { font-size: 12px; color: #E53E3E; margin-top: 4px; display: block; }
.input-error { border-color: #E53E3E !important; }
.form-select { border: 1px solid #E2E8F0; border-radius: 7px; padding: 9px 32px 9px 12px; font-size: 13px; color: #333; background: #fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23A0AEC0' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat right 12px center; appearance: none; outline: none; width: 100%; font-family: 'Noto Sans KR', sans-serif; }
.vehicle-count-badge { margin-top: 6px; font-size: 12px; font-weight: 600; color: #4D8B5A; }
.vehicle-count-badge.full { color: #E53E3E; }

.form-divider { height: 1px; background: #E2E8F0; margin: 4px 0; }
.form-hint { font-size: 11px; color: #A0AEC0; margin-right: auto; }

/* 거부 사유 칩 */
.reason-chips { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
.reason-chip { padding: 6px 14px; border: 1px solid #E2E8F0; border-radius: 20px; font-size: 12px; color: #718096; background: #fff; cursor: pointer; font-family: 'Noto Sans KR', sans-serif; transition: all 0.15s; }
.reason-chip.active { background: #2B3A55; color: #fff; border-color: #2B3A55; }
.reason-chip:hover:not(.active) { background: #F5F6F8; }

.form-textarea { border: 1px solid #E2E8F0; border-radius: 7px; padding: 10px 14px; font-size: 13px; color: #333; outline: none; resize: none; width: 100%; font-family: 'Noto Sans KR', sans-serif; }
.form-textarea:focus { border-color: #2B3A55; }

/* 모달 버튼 */
.btn-cancel { padding: 9px 20px; border: 1px solid #E2E8F0; border-radius: 7px; background: #fff; font-size: 13px; color: #718096; cursor: pointer; font-family: 'Noto Sans KR', sans-serif; }
.btn-cancel:hover { background: #F5F6F8; }
.btn-submit-approve { padding: 9px 24px; background: #2B3A55; color: #fff; border: none; border-radius: 7px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'Noto Sans KR', sans-serif; }
.btn-submit-approve:hover:not(:disabled) { background: #1E2A3E; }
.btn-submit-reject { padding: 9px 24px; background: #E53E3E; color: #fff; border: none; border-radius: 7px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'Noto Sans KR', sans-serif; }
.btn-submit-reject:hover:not(:disabled) { background: #c53030; }
.btn-submit-approve:disabled,
.btn-submit-reject:disabled { opacity: 0.5; cursor: default; }
</style>