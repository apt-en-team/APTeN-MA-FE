<script setup>
import {ref, onMounted} from 'vue'
import {useRouter} from 'vue-router'
import {
  getMyVisitorVehicles,    // 내 방문차량 목록 조회 API
  getVisitorVehicleDetail, // 방문차량 상세 조회 API
  reuseVisitorVehicle,     // 방문차량 재사용 등록 API
  updateVisitorVehicle,    // 방문차량 수정 API
  deleteVisitorVehicle,    // 방문차량 삭제 API
  cancelVisitorVehicle     // 방문차량 등록 취소 API
} from '@/api/visitorVehicle.js'
import Pagination from '@/components/layout/Pagination.vue' // 페이징 공통 컴포넌트
import FilterBar from '@/components/layout/FilterBar.vue'  // 필터바 공통 컴포넌트
import VisitorVehicleModals from '@/components/vehicle/Visitorvehiclemodal.vue' // 방문차량 모달 모음 컴포넌트

const router = useRouter() // 페이지 이동에 사용 (등록 페이지로 이동 등)

// 목록 데이터
const list = ref([]) // API에서 받아온 방문차량 목록 배열
const loading = ref(false)  // true면 "불러오는 중..." 표시
const currentPage = ref(1) // 현재 보고 있는 페이지 번호
const totalPages = ref(0) // 전체 페이지 수 (백엔드에서 계산해서 내려줌)
const totalCount = ref(0) // 필터 적용된 건수 (페이징 "총 N건 중 N건 조회"에 사용)

// 검색 필터 (입력값이 없으면 전체 조회)
const filter = ref({
  licensePlate: '', // 차량번호 검색어
  visitorName: '',  // 방문자 이름 검색어
  visitDate: ''     // 방문 예정일 (날짜 선택)
})

// 모달 상태 관리
// activeModal 값에 따라 어떤 모달을 보여줄지 결정
// null이면 모달 안 보임, 'detail'이면 상세 모달, 'reuse'면 재사용 모달 등
const activeModal = ref(null)
const selectedItem = ref(null)  // 현재 선택된 방문차량 데이터 (모달에 표시할 내용)

// 오늘 날짜 문자열 (2026-03-13 형태, 과거 날짜 차단 + 사이드 카드 비교용)
const today = new Date().toISOString().split('T')[0]

// 사이드 카드 통계 (백엔드에서 필터 무관하게 전체 기준으로 내려줌)
const todayCount = ref(0)       // 오늘 방문 예정 차량 수
const upcomingCount = ref(0)    // 미래 방문 예정 차량 수
const allCount = ref(0)         // 전체 누적 등록 건수

// 목록 조회 함수 (API-031 호출)
// 페이지 진입, 검색, 페이지 변경, 초기화 시 실행됨
const fetchList = async () => {
  loading.value = true // 데이터 불러오는 동안 화면에 "불러오는 중..."표시
  try {

    // GET /api/visitor-vehicles/my?page=1&size=10&licensePlate=... 형태로 요청
    const res = await getMyVisitorVehicles({
      page: currentPage.value,
      size: 10,
      licensePlate: filter.value.licensePlate || undefined, // 빈 문자열이면 undefined로 → 파라미터 안 보냄
      visitorName: filter.value.visitorName || undefined,
      visitDate: filter.value.visitDate || undefined
    })
    const data = res.data // axios 응답에서 실제 데이터만 꺼냄.

    // 백엔드 응답 형태에 따라 분기 (배열이면 페이징 없는 응답, 객체면 페이징 응답)
    list.value = Array.isArray(data) ? data : Array.isArray(data?.content) ? data.content : [] // 방어 코드
    totalCount.value = data?.totalCount ?? list.value.length
    totalPages.value = data?.totalPages ?? 1

    // 사이드 카드 통계 (백엔드에서 같이 내려줌, 필터 무관)
    todayCount.value = data?.todayCount ?? 0
    upcomingCount.value = data?.upcomingCount ?? 0
    allCount.value = data?.allCount ?? 0
  } catch (e) {
    console.error('목록 조회 실패', e)
  } finally {
    loading.value = false // 성공이든 실패든 로딩 해제
  }
}

// 페이징 컴포넌트에서 페이지 번호 클릭 시 호출
const handlePageChange = (page) => {
  currentPage.value = page
  fetchList()
}
// 검색 버튼 클릭 또는 엔터키 시 1페이지부터 다시 조회
const handleSearch = () => {
  currentPage.value = 1
  fetchList()
}
// 초기화 버튼 클릭 시 필터 비우고 1페이지부터 다시 조회
const handleReset = () => {
  filter.value = {licensePlate: '', visitorName: '', visitDate: ''}
  currentPage.value = 1
  fetchList()
}

// 테이블 행 클릭 → 상세 조회 API 호출 → 상세 모달 열기
const openDetail = async (id) => {
  try {
    const res = await getVisitorVehicleDetail(id) // GET /api/visitor-vehicles/{id}
    selectedItem.value = res.data
    activeModal.value = 'detail' // 상세 모달 표시
  } catch (e) {
    alert('상세 조회에 실패했습니다.')
  }
}

// 모달 닫기 (어떤 모달이든 null로 바꾸면 닫힘)
const closeModal = () => {
  activeModal.value = null
}

// 재사용 등록 처리 (API-033)
// 모달 컴포넌트에서 emit으로 호출됨, setError/setLoading은 모달 내부 상태 제어 함수
const handleReuseSubmit = async (date, setError, setLoading) => {
  setLoading(true)
  try {
    await reuseVisitorVehicle(selectedItem.value.visitorVehicleId, {visitDate: date})
    selectedItem.value = {...selectedItem.value, _successMsg: '방문차량이 재등록되었습니다.'}
    activeModal.value = 'success' // 성공 모달로 전환
    fetchList() // 목록 새로고침
  } catch (e) {
    setError(e.response?.status === 400 ? '과거 날짜는 선택할 수 없습니다.' : '재등록에 실패했습니다.')
  } finally {
    setLoading(false)
  }
}

// 수정 처리 (API-034)
const handleEditSubmit = async (form, setError, setLoading) => {
  setLoading(true)
  try {
    await updateVisitorVehicle(selectedItem.value.visitorVehicleId, form)
    selectedItem.value = {...selectedItem.value, _successMsg: '차량 정보가 수정되었습니다.'}
    activeModal.value = 'success'
    fetchList()
  } catch (e) {
    setError(e.response?.status === 400 ? '입력 정보를 확인해주세요.' : '수정에 실패했습니다.')
  } finally {
    setLoading(false)
  }
}

// 삭제 처리 (API-035)
const handleDeleteSubmit = async (setError, setLoading) => {
  setLoading(true)
  try {
    await deleteVisitorVehicle(selectedItem.value.visitorVehicleId)
    selectedItem.value = {...selectedItem.value, _successMsg: '차량이 삭제되었습니다.'}
    activeModal.value = 'success'
    fetchList()
  } catch (e) {
    setError('삭제에 실패했습니다.')
  } finally {
    setLoading(false)
  }
}

// 등록 취소 처리 (API-036) - APPROVED → REJECTED로 상태 변경
const handleCancelSubmit = async (setError, setLoading) => {
  setLoading(true)
  try {
    await cancelVisitorVehicle(selectedItem.value.visitorVehicleId)
    selectedItem.value = {...selectedItem.value, _successMsg: '등록이 취소되었습니다.'}
    activeModal.value = 'success'
    fetchList()
  } catch (e) {
    setError('등록 취소에 실패했습니다.')
  } finally {
    setLoading(false)
  }
}

// 날짜 포맷 변환 (2026-03-20 → 2026.03.20)
const formatDate = (date) => date ? date.replaceAll('-', '.') : '-'

// 페이지 처음 열릴 때 목록 조회
onMounted(() => fetchList())
</script>

<template>
  <div class="visitor-vehicle-list">
    <div class="content-wrapper">

      <!-- 왼쪽: 목록 영역 -->
      <div class="list-card">

        <!-- 헤더: 제목 + 등록 버튼 -->
        <div class="card-header">
          <div class="card-title">
            <h3>내 방문차량 목록</h3>
            <p class="subtitle">등록한 방문차량 내역을 확인할 수 있습니다.</p>
          </div>
          <button class="btn-register" @click="router.push({ name: 'VisitorVehicles' })">
            + 방문차량 등록
          </button>
        </div>

        <!-- 필터바: 차량번호/방문자/날짜 검색 + 초기화 -->
        <!-- @reset은 FilterBar 컴포넌트 내 초기화 버튼 클릭 시 발생 -->
        <!-- @keyup.enter는 input에서 엔터 누르면 바로 검색 실행 -->
        <FilterBar @reset="handleReset">
          <input v-model="filter.licensePlate" type="text" placeholder="차량번호 검색"
                 class="filter-input" @keyup.enter="handleSearch"/>
          <input v-model="filter.visitorName" type="text" placeholder="방문자 이름"
                 class="filter-input" @keyup.enter="handleSearch"/>
          <input v-model="filter.visitDate" type="date" class="filter-input"/>
          <button class="btn-search" @click="handleSearch">검색</button>
        </FilterBar>

        <!-- 로딩 중 표시 -->
        <div v-if="loading" class="empty-state">불러오는 중...</div>

        <!-- 데이터 없을 때 (필터 여부에 따라 메시지 다르게) -->
        <div v-else-if="list.length === 0" class="empty-state">
          {{
            filter.licensePlate || filter.visitorName || filter.visitDate
                ? '검색 결과가 없습니다.' : '등록된 방문차량이 없습니다.'
          }}
        </div>
        <!-- 테이블 목록 -->
        <div v-else class="vehicle-table-wrap">
          <table class="vehicle-table">
            <thead>
            <tr>
              <th style="width: 60px">번호</th>
              <th>차량번호</th>
              <th>방문자</th>
              <th>방문 예정일</th>
              <th>방문 목적</th>
              <th style="width: 80px">상태</th>
              <th style="width: 200px"></th>
            </tr>
            </thead>
            <tbody>

            <!-- 행 클릭 시 상세 모달 열림, @click.stop은 버튼 영역 클릭 시 행 클릭 방지 -->
            <tr v-for="(item, index) in list" :key="item.visitorVehicleId"
                class="table-row" @click="openDetail(item.visitorVehicleId)">

              <!-- 페이지에 맞춘 순번 (1페이지: 1~10, 2페이지: 11~20) -->
              <td>#{{ (currentPage - 1) * 10 + index + 1 }}</td>
              <td class="fw-bold">{{ item.licensePlate }}</td>
              <td>{{ item.visitorName || '-' }}</td>
              <td class="text-gray">{{ formatDate(item.visitDate) }}</td>
              <td class="text-gray">{{ item.visitPurpose || '-' }}</td>
              <td>
                <span class="badge" :class="item.status === 'APPROVED' ? 'badge-approved' : 'badge-rejected'">
                  {{ item.status === 'APPROVED' ? '승인' : '거부' }}
                </span>
              </td>

              <!-- 액션 버튼 영역 (@click.stop으로 행 클릭 이벤트 전파 차단) -->
              <td @click.stop>

                <!-- 승인 상태: 수정 + 취소 버튼 -->
                <template v-if="item.status === 'APPROVED'">
                  <div class="action-btns">
                    <button class="btn-act btn-act-edit"
                            @click="selectedItem = item; activeModal = 'edit'">등록 수정
                    </button>
                    <button class="btn-act btn-act-cancel"
                            @click="selectedItem = item; activeModal = 'cancel'">등록 취소
                    </button>
                  </div>
                </template>

                <!-- 거부/취소 상태: 재등록 + 삭제 버튼 -->
                <template v-else>
                  <div class="action-btns">
                    <button class="btn-act btn-act-reuse"
                            @click="selectedItem = item; activeModal = 'reuse'">재등록
                    </button>
                    <button class="btn-act btn-act-delete"
                            @click="selectedItem = item; activeModal = 'delete'">삭제
                    </button>
                  </div>
                </template>
              </td>
            </tr>
            </tbody>
          </table>
        </div>

        <!-- 페이징 (totalAll: 전체, totalFiltered: 필터 적용 건수) -->
        <Pagination
            v-if="list.length > 0"
            :currentPage="currentPage"
            :maxPage="totalPages"
            :totalAll="allCount"
            :totalFiltered="list.length"
            unit="건"
            @change="handlePageChange"/>
      </div>

      <!-- 오른쪽: 사이드 통계 카드 (필터 무관, 전체 기준) -->
      <div class="side-panel">
        <div class="stat-card">
          <div class="stat-label">오늘 방문 차량</div>
          <div class="stat-value">{{ todayCount }} <span class="stat-unit">대</span></div>
          <div class="stat-sub">승인 완료</div>
          <div class="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4973E5" stroke-width="1.5">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-label">예비 방문 차량</div>
          <div class="stat-value">{{ upcomingCount }} <span class="stat-unit">대</span></div>
          <div class="stat-sub">승인 완료</div>
          <div class="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4973E5" stroke-width="1.5">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-label">전체 등록 건수</div>
          <div class="stat-value">{{ allCount }} <span class="stat-unit">건</span></div>
          <div class="stat-sub">누적 등록</div>
          <div class="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4973E5" stroke-width="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
    <!-- 모달 컴포넌트 (상세/재사용/수정/삭제/취소/성공 모달을 하나의 컴포넌트에서 관리)
         activeModal 값에 따라 내부에서 어떤 모달을 보여줄지 분기
         @close: 모달 닫기, @open-*: 모달 전환, @*-submit: 각 기능 실행 -->
    <VisitorVehicleModals
        :activeModal="activeModal"
        :selectedItem="selectedItem"
        :today="today"
        @close="closeModal"
        @open-reuse="activeModal = 'reuse'"
        @open-edit="activeModal = 'edit'"
        @open-delete="activeModal = 'delete'"
        @open-cancel="activeModal = 'cancel'"
        @reuse-submit="handleReuseSubmit"
        @edit-submit="handleEditSubmit"
        @delete-submit="handleDeleteSubmit"
        @cancel-submit="handleCancelSubmit"/>
  </div>
</template>

<style scoped>
.visitor-vehicle-list {
  padding: 0;
  min-height: 100vh;
}

.content-wrapper {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.list-card {
  flex: 1;
  background: #fff;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.card-title h3 {
  font-size: 20px;
  font-weight: 700;
  color: #1A1A2E;
  margin: 0 0 4px;
}

.subtitle {
  font-size: 13px;
  color: #aaa;
  margin: 0;
}

.btn-register {
  padding: 10px 20px;
  background: #4973E5;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.btn-register:hover {
  background: #3a5bd9;
}

.filter-input {
  padding: 7px 12px;
  border: 1px solid #E2E8F0;
  border-radius: 7px;
  font-size: 12px;
  color: #1A1A2E;
  outline: none;

}

.filter-input:focus {
  border-color: #4973E5;
}

.btn-search {
  padding: 7px 22px;
  background: #4973E5;
  color: #fff;
  border: none;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;

}

.btn-search:hover {
  background: #3a5bd9;
}

:deep(.filter-bar) {
  padding: 14px 0;
  border-bottom: none;
  border-top: none;
}

:deep(.pagination-wrap) {
  border-top: none;
  padding-top: 32px;
}

:deep(.pagination-wrap .page-btn.active) {
  background-color: #4973E5;
  color: #fff;
  border: none;
}

.text-gray {
  color: #687282;
}

.empty-state {
  text-align: center;
  padding: 60px 0;
  color: #aaa;
  font-size: 14px;
}

.vehicle-table-wrap {
  margin-top: 16px;
}

.vehicle-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 14px;
}

.vehicle-table thead th {
  padding: 14px 16px;
  background-color: #F8FAFC;
  color: #687282;
  font-weight: 500;
  border-bottom: 1px solid #E2E8F0;
}

.vehicle-table tbody tr {
  border-bottom: 1px solid #F1F3F5;
  transition: background-color 0.15s;
}

.vehicle-table tbody tr:hover {
  background-color: #F8FAFC;
}

.vehicle-table tbody td {
  padding: 16px;
}

.fw-bold {
  font-weight: 700;
}

.action-btns {
  display: flex;
  gap: 10px;
}

.btn-act {
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  white-space: nowrap;
}

.btn-act-edit {
  background: #fff;
  border-color: #D0D5DD;
  color: #444;
  padding: 6px 12px;
}

.btn-act-edit:hover {
  background: #F4F5F7;
}

.btn-act-cancel {
  background: #fff;
  border-color: #E74C3C;
  color: #E74C3C;
  padding: 6px 12px;
}

.btn-act-cancel:hover {
  background: #FFE4E4;
}

.btn-act-reuse {
  background: #fff;
  border: 1px solid #4973E5;
  color: #4973E5;
  width: 73px;
  padding: 6px 12px;
}

.btn-act-reuse:hover {
  background: #E0E9FF;
}

.btn-act-delete {
  border: 1px solid #E74C3C;
  background: #fff;
  color: #E74C3C;
  width: 73px;
  padding: 6px 12px;
}

.btn-act-delete:hover {
  background: #FFE4E4;
}

.table-row {
  cursor: pointer;
}

.badge {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 20px;
}

.badge-approved {
  background: #E6F9EE;
  color: #2EAD5C;
}

.badge-rejected {
  background: #FFF0F0;
  color: #E05555;
}

.side-panel {
  width: 220px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stat-card {
  background: #fff;
  border-radius: 14px;
  padding: 20px;
  border: 1px solid #ECEEF3;
  position: relative;
}

.stat-label {
  font-size: 12px;
  color: #999;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1A1A2E;
}

.stat-unit {
  font-size: 14px;
  font-weight: 400;
  color: #999;
}

.stat-sub {
  font-size: 11px;
  color: #2EAD5C;
  margin-top: 4px;
}

.stat-icon {
  position: absolute;
  right: 20px;
  top: 20px;
  opacity: 0.6;
}
</style>