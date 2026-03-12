<script setup>
import {ref, onMounted} from 'vue'
import {useRouter} from 'vue-router'
import {getMyVisitorVehicles} from '@/api/visitorVehicle.js'
import Pagination from '@/components/layout/Pagination.vue'
import FilterBar from '@/components/layout/FilterBar.vue'

const router = useRouter()
const list = ref([])           // 방문차량 목록
const loading = ref(false)     // 로딩 상태
const currentPage = ref(1)     // 현재 페이지
const totalPages = ref(0)      // 전체 페이지 수
const totalCount = ref(0)      // 전체 건수

// 필터 조건
const filter = ref({
  licensePlate: '', // 차량번호 검색
  visitorName: '', // 방문자 이름 검색
  visitDate: '' // 방문 예정일 필터
})

// 목록 조회 함수
const fetchList = async () => {
  loading.value = true
  try {
    const res = await getMyVisitorVehicles({
      page: currentPage.value,
      size: 10,
      licensePlate: filter.value.licensePlate || undefined,
      visitorName: filter.value.visitorName || undefined,
      visitDate: filter.value.visitDate || undefined
    })
    if (Array.isArray(res.data)) {
      list.value = res.data
      totalCount.value = res.data.length
      totalPages.value = 1
    } else {
      list.value = res.data.content
      totalCount.value = res.data.totalCount
      totalPages.value = res.data.totalPages
    }
  } catch (e) {
    console.error('목록 조회 실패', e)
  } finally {
    loading.value = false
  }
}

// 페이지 변경 시 재조회
const handlePageChange = (page) => {
  currentPage.value = page
  fetchList()
}

// 검색 (1페이지로 리셋 후 조회
const handleSearch = () => {
  currentPage.value = 1
  fetchList()
}

// 필터 초기화
const handleReset = () => {
  filter.value = {licensePlate: '', visitorName: '', visitDate: ''}
  currentPage.value = 1
  fetchList()
}

// 날짜 포맷 (2026-03-20 → 2026.03.20)
const formatDate = (date) => {
  if (!date) return '-'
  return date.replaceAll('-', '.')
}

// 페이지 진입 시 조회
onMounted(() => fetchList())
</script>

<template>
  <div class="visitor-vehicle-list">
    <div class="list-card">
      <!-- 헤더 -->
      <div class="card-header">
        <div class="card-title">
          <h3>내 방문차량 목록</h3>
          <p class="subtitle">등록한 방문차량 내역을 확인할 수 있습니다.</p>
        </div>
        <button class="btn-register" @click="router.push({ name: 'VisitorVehicles' })">
          + 방문차량 등록
        </button>
      </div>

      <!-- 필터 영역 -->
      <FilterBar @reset="handleReset">
        <input v-model="filter.licensePlate" type="text" placeholder="차량번호 검색" class="filter-input"
               @keyup.enter="handleSearch"/>
        <input v-model="filter.visitorName" type="text" placeholder="방문자 이름" class="filter-input"
               @keyup.enter="handleSearch"/>
        <input v-model="filter.visitDate" type="date" class="filter-input"/>
        <button class="btn-search" @click="handleSearch">검색</button>
      </FilterBar>

      <!-- 로딩 -->
      <div v-if="loading" class="empty-state">불러오는 중...</div>

      <!-- 목록 없을 때 -->
      <div v-else-if="list.length === 0" class="empty-state">
        {{
          filter.licensePlate || filter.visitorName || filter.visitDate
              ? '검색 결과가 없습니다.'
              : '등록된 방문차량이 없습니다.'
        }}
      </div>

      <!-- ✅ 테이블 형식 목록 -->
      <div v-else class="vehicle-table-wrap">
        <table class="vehicle-table">
          <thead>
          <tr>
            <th style="width: 70px">번호</th>
            <th>차량번호</th>
            <th>방문자</th>
            <th>방문 예정일</th>
            <th style="width: 100px">승인상태</th>
            <!-- <th style="width: 80px">관리</th> 필요시 상세보기 버튼 컬럼 추가 -->
          </tr>
          </thead>
          <tbody>
          <tr v-for="(item, index) in list" :key="item.visitorVehicleId">
            <!-- 페이지에 맞춘 자동 순번 (1페이지 1~10, 2페이지 11~20 ... -->
            <td>#{{ (currentPage - 1) * 10 + index + 1 }}</td>
            <td class="fw-bold">{{ item.licensePlate }}</td>
            <td>{{ item.visitorName || '-' }}</td>
            <td>{{ formatDate(item.visitDate) }}</td>
            <td>
                <span class="badge" :class="item.status === 'APPROVED' ? 'badge-approved' : 'badge-rejected'">
                  {{ item.status === 'APPROVED' ? '승인' : '거부' }}
                </span>
            </td>
            <!-- <td><button class="btn-small">상세</button></td> -->
          </tr>
          </tbody>
        </table>
      </div>

      <!-- 페이징 -->
      <Pagination
          v-if="list.length > 0"
          :currentPage="currentPage"
          :maxPage="totalPages"
          :totalAll="totalCount"
          :totalFiltered="totalCount"
          unit="건"
          @change="handlePageChange"
      />
    </div>
  </div>
</template>

<style scoped>
.visitor-vehicle-list {
  padding: 0px;
  min-height: 100vh;
}

.list-card {
  background: #fff;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* 헤더 */
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

/* 필터 */
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
  padding: 7px 14px;
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

/* FilterBar 스타일 덮어쓰기: border-top 제거, 패딩 조정 */
:deep(.filter-bar) {
  padding: 14px 0;
  border-bottom: none;
  border-top: none;
}

/* Pagination border-top 제거 */
:deep(.pagination-wrap) {
  border-top: none;
  padding-top: 32px;
}

/* 현재 페이지(active) 버튼 색상만 #4973E5로 변경 */
:deep(.pagination-wrap .page-btn.active) {
  background-color: #4973E5;
  color: #fff; /* 글자색 흰색으로 강제 적용 */
  border: none;
}

/* 빈 상태 */
.empty-state {
  text-align: center;
  padding: 60px 0;
  color: #aaa;
  font-size: 14px;
}

/* ✅ 테이블 스타일 */
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
  color: #888;
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
  padding: 16px 16px;
  color: #333;
}

.fw-bold {
  font-weight: 700;
  color: #1A1A2E;
}

/* 상태 뱃지 */
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
</style>