<script setup>
import {ref, computed, inject, onMounted} from 'vue'
import {
  getAdminFixedVisitorVehicles,
  getAdminFixedVisitorVehicleStats,
  registerFixedVisitorVehicle,
  deleteAdminFixedVisitorVehicle
} from '@/api/visitorVehicle.js'
import householdAPI from '@/api/household.js'

import Modal from '@/components/Modal.vue'
import StatsCards from '@/components/admin/StatsCards.vue'
import FilterBar from '@/components/layout/FilterBar.vue'
import AdminTable from '@/components/admin/AdminTable.vue'
import Pagination from '@/components/layout/Pagination.vue'

// AdminLayout 탑바 버튼과 이 페이지의 등록 모달을 연결하기 위해 inject 사용
// AdminLayout이 provide로 제공한 registerOpenModal 함수를 받아옴
// 탑바 버튼 클릭 시 → AdminLayout → registerOpenModal → openRegisterModal 실행
const registerOpenModal = inject('registerOpenModal')

// ── 목록 데이터
const list = ref([])           // API에서 받아온 원본 목록 데이터
const currentPage = ref(1)     // 현재 페이지 번호 (1부터 시작)
const totalPages = ref(0)      // 전체 페이지 수 (페이지네이션에 사용)
const totalCount = ref(0)      // 전체 데이터 건수
const size = ref(10)           // 한 페이지에 표시할 데이터 수

// ── 통계 카드 데이터
const statTotal = ref(0)       // 전체 등록 건수
const statUnlimited = ref(0)   // 무기한 차량 수 (endDate가 null인 것)
const statMonth = ref(0)       // 이번 달 등록 건수
const statActive = ref(0)      // 활성 차량 수 (오늘 기준 start~end 사이)

// ── 필터
const vehicleNumber = ref('')  // 차량번호 검색 필터
const dong = ref('')           // 동 필터 (셀렉트박스)
const dongOptions = ref([])    // 셀렉트박스 옵션 목록 (householdAPI.getDongs()로 채워짐)

// ── 모달 상태
// 등록 모달: show(표시여부), loading(등록 중 버튼 비활성화), error(에러 메시지)
const registerModal = ref({show: false, loading: false, error: ''})

// 등록 폼 데이터: 모달 열 때마다 빈 값으로 초기화
const form = ref({vehicleNumber: '', visitorName: '', purpose: '', startDate: '', endDate: ''})

// 상세 모달: show(표시여부), item(클릭한 행 데이터), loading(삭제 처리 중)
const detailModal = ref({show: false, item: null, loading: false})

// 삭제 확인 모달: show(표시여부), loading(삭제 API 호출 중)
const confirmModal = ref({show: false, loading: false})

// 날짜 input의 min 속성에 사용 (오늘 이전 날짜 선택 불가)
const now = new Date()
const today = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

// ── 테이블 컬럼 정의
// key는 tableRows의 필드명과 일치해야 AdminTable이 올바르게 렌더링함
const columns = [
  {label: '차량번호', key: 'vehicleNumber'},
  {label: '방문자', key: 'visitorName'},
  {label: '방문 목적', key: 'purpose'},
  {label: '시작일', key: 'startDate'},
  {label: '종료일', key: 'endDate'},
  {label: '등록자', key: 'userName'},
  {label: '세대', key: 'unit'},
  {label: '상태', key: 'status'},  // isDeleted 값을 배지로 표시
]

// ── 통계 카드 배열 (computed)
// StatsCards 컴포넌트에 :stats로 전달
// ref 값이 바뀌면 자동으로 재계산됨
const statsData = computed(() => [
  {label: '전체 등록 건수', value: statTotal.value, unit: '건', desc: '전체 누적'},
  {label: '무기한 차량', value: statUnlimited.value, unit: '대', desc: '종료일 미설정'},
  {label: '이번 달 등록', value: statMonth.value, unit: '건', desc: '월간 누적'},
  {label: '활성 차량', value: statActive.value, unit: '대', desc: '오늘 기준'},
])

// ── 테이블 표시용 데이터 가공 (computed)
// list(원본)를 직접 수정하지 않고 화면 표시용으로 따로 가공
// list가 바뀌면 자동으로 재계산됨
const tableRows = computed(() =>
    list.value.map(item => ({
      ...item,
      // endDate가 null이면 '무기한'으로 표시
      endDate: item.endDate || '무기한',
      // dong + ho를 합쳐서 세대 컬럼으로 표시 (백엔드는 각각 내려줌)
      unit: item.dong && item.ho ? `${item.dong} ${item.ho}` : '-',
      // isDeleted가 1이면 삭제됨, 0이면 활성 (배지 표시용)
      status: item.isDeleted === 1 ? 'deleted' : 'active',
    }))
)

// API 호출

// 통계 조회
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

// 목록 조회
// 필터(vehicleNumber, dong)와 페이지 파라미터를 함께 전달
const fetchList = async () => {
  try {
    const params = {page: currentPage.value, size: size.value}
    // 값이 있을 때만 파라미터에 추가 (빈 문자열은 전송 안 함)
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

// 동 목록 조회 — 셀렉트박스 옵션을 동적으로 채워줌
// householdAPI를 공용으로 사용해서 코드 중복 없이 동 목록을 가져옴
const fetchDongs = async () => {
  try {
    const res = await householdAPI.getDongs()
    dongOptions.value = res.data.resultData
  } catch (e) {
    console.error('동 목록 조회 실패', e)
  }
}

// ── 검색 / 필터

// 검색 실행: 페이지를 1로 초기화 후 목록 재조회
const doSearch = () => {
  currentPage.value = 1
  fetchList()
}

// 필터 초기화: 모든 필터 값을 비우고 재조회
const resetFilters = () => {
  vehicleNumber.value = ''
  dong.value = ''
  doSearch()
}

// 페이지 이동
const goToPage = (page) => {
  currentPage.value = page
  fetchList()
}

// ── 등록 모달

// 모달 열기: 폼 초기화 후 표시
const openRegisterModal = () => {
  form.value = {vehicleNumber: '', visitorName: '', purpose: '', startDate: '', endDate: ''}
  registerModal.value.error = ''
  registerModal.value.loading = false
  registerModal.value.show = true
}

const closeRegisterModal = () => {
  registerModal.value.show = false
}

// 등록 제출 (입주민/관리자 공용 API)
// endDate가 빈 문자열이면 null로 변환 → 백엔드에서 무기한으로 처리
const submitRegister = async () => {
  if (!form.value.vehicleNumber || !form.value.startDate) {
    registerModal.value.error = '차량번호와 시작일은 필수입니다.'
    return
  }
  registerModal.value.loading = true
  try {
    await registerFixedVisitorVehicle({
      ...form.value,
      // 날짜 input이 비어있으면 빈 문자열("")이 오는데
      // 백엔드 LocalDate 타입은 null을 기대하므로 명시적으로 null 변환
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

// ── 상세 모달

// 행 클릭 시 해당 행 데이터(item)를 그대로 모달에 전달
// 별도 상세 API 호출 없음 — 목록 응답에 상세에 필요한 모든 데이터가 포함되어 있음
const openDetailModal = (item) => {
  detailModal.value.item = item
  detailModal.value.show = true
}

// 닫을 때 item도 초기화 — 이전 데이터가 남아있지 않도록
const closeDetailModal = () => {
  detailModal.value.show = false
  detailModal.value.item = null
}

// ── 삭제 처리

// 삭제 확인 모달에서 '삭제' 버튼 클릭 시 실행
// 소프트 삭제: DB에서 실제로 지우지 않고 is_deleted = 1 로 표시
// 관리자 삭제는 소유권 체크 없음 (입주민 삭제는 userId 일치 여부 확인)
const handleDelete = async () => {
  console.log('삭제할 fixedId:', detailModal.value.item.fixedId)  // ← 추가
  console.log('item 전체:', detailModal.value.item)
  confirmModal.value.loading = true
  try {
    await deleteAdminFixedVisitorVehicle(detailModal.value.item.fixedId)
    confirmModal.value.show = false
    closeDetailModal()  // 삭제 후 상세 모달도 함께 닫기 (삭제된 데이터가 화면에 남지 않도록)
    fetchList()         // 목록 갱신
    fetchStats()        // 통계 갱신
  } catch (e) {
    console.error('고정 방문차량 삭제 실패', e)
  } finally {
    confirmModal.value.loading = false
  }
}

// ── 초기화
// onMounted: 컴포넌트가 DOM에 마운트된 후 실행
onMounted(() => {
  // 탑바 버튼과 등록 모달 연결 (AdminLayout provide/inject 패턴)
  registerOpenModal(openRegisterModal)
  fetchDongs()   // 동 셀렉트박스 옵션 로드
  fetchStats()   // 통계 카드 데이터 로드
  fetchList()    // 테이블 목록 로드
})
</script>

<template>
  <div class="fixed-vehicle-admin">

    <!-- 통계 카드 4개: 전체/무기한/이번달/활성 -->
    <StatsCards :stats="statsData"/>

    <div class="table-section">

      <!-- 필터바: @reset은 FilterBar 내부 초기화 버튼 클릭 시 발생 -->
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
        <!-- 동 셀렉트박스: getDongs() API로 동적 로드 -->
        <select class="filter-select" v-model="dong" @change="doSearch">
          <option value="">전체 동</option>
          <option v-for="d in dongOptions" :key="d" :value="d">{{ d }}</option>
        </select>
      </FilterBar>

      <!-- 테이블: 행 클릭 시 openDetailModal 실행 -->
      <AdminTable :columns="columns" :rows="tableRows" @row-click="openDetailModal">
        <!-- 상태 배지 슬롯: isDeleted 값에 따라 활성/삭제됨 배지 표시 -->
        <template #cell-status="{ row }">
          <span :class="['status-badge', row.status === 'deleted' ? 'status-deleted' : 'status-active']">
            {{ row.status === 'deleted' ? '삭제됨' : '활성' }}
          </span>
        </template>
      </AdminTable>

      <Pagination
          :currentPage="currentPage"
          :maxPage="totalPages"
          :totalAll="totalCount"
          :totalFiltered="totalCount"
          unit="건"
          @change="goToPage"
      />

    </div>

    <!-- 등록 모달 -->
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
          <!-- :min="today" — 오늘 이전 날짜 선택 불가 (프론트 1차 검증) -->
          <input class="form-input" v-model="form.startDate" type="date" :min="today"/>
        </div>
        <div class="form-group">
          <label class="form-label">종료일 <span class="optional">(미입력 시 무기한)</span></label>
          <!-- :min="form.startDate" — 시작일 이전 날짜 선택 불가 -->
          <input class="form-input" v-model="form.endDate" type="date" :min="form.startDate || today"/>
        </div>
      </div>
      <p v-if="registerModal.error" class="form-error">{{ registerModal.error }}</p>
      <template #footer>
        <button class="btn-cancel" @click="closeRegisterModal">취소</button>
        <!-- :disabled로 등록 중 중복 클릭 방지 -->
        <button class="btn-submit" @click="submitRegister" :disabled="registerModal.loading">
          {{ registerModal.loading ? '등록 중...' : '등록하기' }}
        </button>
      </template>
    </Modal>

    <!-- 상세 모달: 행 클릭 시 열림, item에 행 데이터 그대로 전달 -->
    <Modal v-if="detailModal.show" title="고정 방문차량 상세"
           :subtitle="'ID #' + detailModal.item?.fixedId" @close="closeDetailModal">

      <div class="detail-hero">
        <h2 class="detail-title">{{ detailModal.item?.vehicleNumber }}</h2>
        <p class="detail-sub">{{ detailModal.item?.visitorName }}</p>
      </div>
      <div class="detail-divider"></div>

      <!-- 2열 그리드로 상세 정보 표시 -->
      <div class="detail-grid">
        <div class="detail-cell">
          <span class="detail-cell-label">차량번호</span>
          <span class="detail-cell-value">{{ detailModal.item?.vehicleNumber }}</span>
        </div>
        <div class="detail-cell">
          <span class="detail-cell-label">방문자</span>
          <span class="detail-cell-value">{{ detailModal.item?.visitorName || '-' }}</span>
        </div>
        <div class="detail-cell">
          <span class="detail-cell-label">방문 목적</span>
          <span class="detail-cell-value">{{ detailModal.item?.purpose || '-' }}</span>
        </div>
        <div class="detail-cell">
          <span class="detail-cell-label">세대</span>
          <!-- tableRows computed에서 dong+ho를 합쳐 unit으로 만들었음 -->
          <span class="detail-cell-value">{{ detailModal.item?.unit || '-' }}</span>
        </div>
        <div class="detail-cell">
          <span class="detail-cell-label">시작일</span>
          <span class="detail-cell-value">{{ detailModal.item?.startDate }}</span>
        </div>
        <div class="detail-cell">
          <span class="detail-cell-label">종료일</span>
          <!-- tableRows computed에서 null → '무기한'으로 변환했음 -->
          <span class="detail-cell-value">{{ detailModal.item?.endDate || '무기한' }}</span>
        </div>
        <div class="detail-cell">
          <span class="detail-cell-label">등록자</span>
          <span class="detail-cell-value">{{ detailModal.item?.userName || '-' }}</span>
        </div>
        <div class="detail-cell">
          <span class="detail-cell-label">등록일</span>
          <span class="detail-cell-value">{{ detailModal.item?.createdAt || '-' }}</span>
        </div>
      </div>

      <template #footer>
        <button class="btn-danger"
                @click="confirmModal.show = true"
                :disabled="detailModal.item?.isDeleted === 1">
          {{ detailModal.item?.isDeleted === 1 ? '이미 삭제됨' : '삭제' }}
        </button>
        <button class="btn-cancel" @click="closeDetailModal">닫기</button>
      </template>
    </Modal>

    <!-- 삭제 확인 모달: 상세 모달 밖에 형제로 위치해야 함 (중첩 금지) -->
    <Modal v-if="confirmModal.show" title="고정 방문차량 삭제"
           subtitle="삭제된 데이터는 복구할 수 없습니다." @close="confirmModal.show = false">

      <!-- 삭제 대상 정보 카드: detailModal.item에서 데이터 참조 -->
      <div class="confirm-target-card">
        <div class="confirm-target-info">
          <span class="confirm-target-name">{{ detailModal.item?.vehicleNumber }}</span>
          <span class="confirm-target-sub">
            {{ detailModal.item?.visitorName || '-' }} · {{ detailModal.item?.unit || '-' }}
          </span>
        </div>
      </div>

      <p class="confirm-warn">
        <span class="confirm-warn-icon">⚠</span>
        삭제 시 해당 고정 방문차량 데이터가 함께 삭제됩니다.
      </p>

      <template #footer>
        <button class="btn-cancel" @click="confirmModal.show = false">취소</button>
        <!-- :disabled로 삭제 중 중복 클릭 방지 -->
        <button class="btn-danger" @click="handleDelete" :disabled="confirmModal.loading">
          {{ confirmModal.loading ? '삭제 중...' : '삭제' }}
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

/* appearance: none으로 기본 셀렉트 화살표 제거 후 SVG 화살표로 교체 */
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

/* 상태 배지 공통 스타일 */
.status-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
}

/* 활성 상태 — 초록 */
.status-active {
  background: #EBF5EE;
  color: #4D8B5A;
}

/* 삭제됨 상태 — 빨강 */
.status-deleted {
  background: #FEE2E2;
  color: #E53E3E;
}

/* 등록 모달 폼 */
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

/* 상세 모달 */
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
  color: #A0AEC0;
}

.detail-divider {
  height: 1px;
  background: #E2E8F0;
  margin: 14px 0;
}

/* 2열 그리드로 상세 정보 표시 */
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
  color: #A0AEC0;
}

.detail-cell-value {
  font-size: 14px;
  font-weight: 600;
  color: #1A202C;
}

/* 버튼 */
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

/* 삭제 확인 모달 */
.confirm-target-card {
  border: 1px solid #FECACA;
  border-radius: 10px;
  background: #FFF5F5;
  padding: 14px 16px;
  margin-bottom: 14px;
}

.confirm-target-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.confirm-target-name {
  font-size: 15px;
  font-weight: 700;
  color: #1A202C;
}

.confirm-target-sub {
  font-size: 12px;
  color: #718096;
}

.confirm-warn {
  font-size: 12px;
  color: #E53E3E;
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 4px;
}

.confirm-warn-icon {
  font-size: 13px;
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