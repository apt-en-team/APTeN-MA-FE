<script setup>
import {ref, onMounted} from 'vue'
import {useRouter} from 'vue-router'
import {getMyFixedVisitorVehicles, deleteFixedVisitorVehicle} from '@/api/visitorVehicle.js'

import Pagination from '@/components/layout/Pagination.vue'
import FilterBar from '@/components/layout/FilterBar.vue'
import BaseModal from '@/components/Modal.vue'

const router = useRouter()

// 목록 데이터
const list = ref([])
const loading = ref(false)
const currentPage = ref(1)
const totalPages = ref(0)
const totalCount = ref(0)

// 검색 필터
const filter = ref({
  vehicleNumber: '',
})

// 삭제 모달
const showDeleteModal = ref(false)
const selectedFixedId = ref(null)
const deleteLoading = ref(false)
const deleteError = ref('')

// 사이드 카드 통계 (필터 무관)
const allCount = ref(0)
const unlimitedCount = ref(0)

// 목록 조회 (API-063)
const fetchList = async () => {
  loading.value = true
  try {
    const res = await getMyFixedVisitorVehicles({
      page: currentPage.value,
      size: 10,
      vehicleNumber: filter.value.vehicleNumber || undefined,
    })
    const data = res.data
    list.value = data.content ?? []
    totalPages.value = data.totalPages ?? 1
    totalCount.value = data.totalCount ?? 0
    // 필터 무관 통계 (사이드 카드용)
    allCount.value = data.allCount ?? 0
    unlimitedCount.value = data.unlimitedCount ?? 0
  } catch (e) {
    console.error('고정 방문차량 목록 조회 실패', e)
  } finally {
    loading.value = false
  }
}

// 페이지 변경
const handlePageChange = (page) => {
  currentPage.value = page
  fetchList()
}

// 검색
const handleSearch = () => {
  currentPage.value = 1
  fetchList()
}

// 초기화
const handleReset = () => {
  filter.value = {vehicleNumber: ''}
  currentPage.value = 1
  fetchList()
}

// 삭제 모달 열기
const openDeleteModal = (fixedId) => {
  selectedFixedId.value = fixedId
  deleteError.value = ''
  showDeleteModal.value = true
}

// 삭제 모달 닫기
const closeDeleteModal = () => {
  selectedFixedId.value = null
  showDeleteModal.value = false
}

// 삭제 확인 (API-065)
const confirmDelete = async () => {
  deleteLoading.value = true
  try {
    await deleteFixedVisitorVehicle(selectedFixedId.value)
    closeDeleteModal()
    fetchList()
  } catch (e) {
    deleteError.value = '삭제에 실패했습니다.'
  } finally {
    deleteLoading.value = false
  }
}

// 종료일 표시 (null이면 무기한)
const formatEndDate = (endDate) => endDate ? endDate.replaceAll('-', '.') : '무기한'

onMounted(() => fetchList())
</script>

<template>
  <div class="fixed-vehicle-list">
    <div class="content-wrapper">

      <!-- 왼쪽: 목록 영역 -->
      <div class="list-card">

        <!-- 헤더 -->
        <div class="card-header">
          <div class="card-title">
            <h3>고정 방문차량 목록</h3>
            <p class="subtitle">등록한 고정 방문차량 내역을 확인할 수 있습니다.</p>
          </div>
          <button class="btn-register" @click="router.push('/resident/visitor-vehicles/fixed/register')">
            + 고정 방문차량 등록
          </button>
        </div>

        <!-- 필터바 -->
        <FilterBar @reset="handleReset">
          <input
              v-model="filter.vehicleNumber"
              type="text"
              placeholder="차량번호 검색"
              class="filter-input"
              @keyup.enter="handleSearch"
          />
          <button class="btn-search" @click="handleSearch">검색</button>
        </FilterBar>

        <!-- 로딩 -->
        <div v-if="loading" class="empty-state">불러오는 중...</div>

        <!-- 데이터 없을 때 -->
        <div v-else-if="list.length === 0" class="empty-state">
          {{ filter.vehicleNumber ? '검색 결과가 없습니다.' : '등록된 고정 방문차량이 없습니다.' }}
        </div>

        <!-- 테이블 -->
        <div v-else class="vehicle-table-wrap">
          <table class="vehicle-table">
            <thead>
            <tr>
              <th style="width: 60px">번호</th>
              <th>차량번호</th>
              <th>방문자</th>
              <th>방문 목적</th>
              <th>시작일</th>
              <th>종료일</th>
              <th style="width: 80px"></th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="(item, index) in list" :key="item.fixedId" class="table-row">
              <td>#{{ (currentPage - 1) * 10 + index + 1 }}</td>
              <td class="fw-bold">{{ item.vehicleNumber }}</td>
              <td>{{ item.visitorName || '-' }}</td>
              <td class="text-gray">{{ item.purpose || '-' }}</td>
              <td class="text-gray">{{ item.startDate?.replaceAll('-', '.') }}</td>
              <td>
                <span :class="['end-date', { unlimited: !item.endDate }]">
                  {{ formatEndDate(item.endDate) }}
                </span>
              </td>
              <td>
                <button class="btn-act btn-act-delete" @click="openDeleteModal(item.fixedId)">
                  삭제
                </button>
              </td>
            </tr>
            </tbody>
          </table>
        </div>

        <!-- 페이지네이션 -->
        <Pagination
            v-if="list.length > 0"
            :currentPage="currentPage"
            :maxPage="totalPages"
            :totalAll="totalCount"
            :totalFiltered="list.length"
            unit="건"
            @change="handlePageChange"
        />

      </div>

      <!-- 오른쪽: 사이드 통계 카드 (필터 무관) -->
      <div class="side-panel">
        <div class="stat-card">
          <div class="stat-label">전체 등록 차량</div>
          <div class="stat-value">{{ allCount }} <span class="stat-unit">대</span></div>
          <div class="stat-sub">누적 등록</div>
          <div class="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4973E5" stroke-width="1.5">
              <path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1l2-3h10l2 3h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2"/>
              <circle cx="7.5" cy="17.5" r="2.5"/>
              <circle cx="16.5" cy="17.5" r="2.5"/>
            </svg>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-label">무기한 차량</div>
          <div class="stat-value">{{ unlimitedCount }} <span class="stat-unit">대</span></div>
          <div class="stat-sub">종료일 미설정</div>
          <div class="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4973E5" stroke-width="1.5">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
        </div>
      </div>

    </div>

    <!-- 삭제 확인 모달 (BaseModal 직접 사용) -->
    <BaseModal v-if="showDeleteModal" title="고정 방문차량 삭제" @close="closeDeleteModal">
      <p class="confirm-msg">
        해당 차량을 고정 방문차량에서 삭제하시겠습니까?<br/>
        <span class="confirm-sub">이 작업은 되돌릴 수 없습니다.</span>
      </p>
      <p v-if="deleteError" class="error">{{ deleteError }}</p>
      <template #footer>
        <button class="btn-modal-cancel" @click="closeDeleteModal">취소</button>
        <button class="btn-modal-danger" @click="confirmDelete" :disabled="deleteLoading">
          {{ deleteLoading ? '삭제 중...' : '삭제 확인' }}
        </button>
      </template>
    </BaseModal>

  </div>
</template>

<style scoped>
.fixed-vehicle-list {
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
  font-family: 'Noto Sans KR', sans-serif;
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
  font-family: 'Noto Sans KR', sans-serif;
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
  font-family: 'Noto Sans KR', sans-serif;
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

.text-gray {
  color: #687282;
}

.end-date {
  color: #687282;
}

.end-date.unlimited {
  color: #4973E5;
  font-weight: 600;
}

.btn-act {
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  white-space: nowrap;
  font-family: 'Noto Sans KR', sans-serif;
}

.btn-act-delete {
  border: 1px solid #E74C3C;
  background: #fff;
  color: #E74C3C;
  padding: 6px 12px;
}

.btn-act-delete:hover {
  background: #FFE4E4;
}

/* 사이드 패널 */
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

/* 모달 버튼 */
.confirm-msg {
  font-size: 14px;
  line-height: 1.7;
  color: #333;
  margin: 0;
}

.confirm-sub {
  font-size: 12px;
  color: #E05555;
}

.error {
  color: #E05555;
  font-size: 13px;
  margin-top: 8px;
}

.btn-modal-cancel {
  flex: 1;
  padding: 10px;
  border: 1px solid #E0E3EB;
  border-radius: 8px;
  background: #fff;
  color: #555;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  font-family: 'Noto Sans KR', sans-serif;
}

.btn-modal-cancel:hover {
  background: #F5F6FA;
}

.btn-modal-danger {
  flex: 1;
  padding: 10px;
  background: #E05555;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  font-family: 'Noto Sans KR', sans-serif;
}

.btn-modal-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>