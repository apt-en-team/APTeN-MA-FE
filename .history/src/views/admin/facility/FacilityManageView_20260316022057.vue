<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import facilityAPI from '@/api/facility.js'

import StatsCards from '@/components/admin/StatsCards.vue'
import FilterBar  from '@/components/admin/FilterBar.vue'
import BaseModal  from '@/components/common/BeseModel.vue'

const router = useRouter()

const state = reactive({
  list:          [],
  types:         [],
  filterStatus:  '',
  filterSlot:    '',
  searchQuery:   '',
})

// 통계
const stats = reactive({ total: 0, today: 0, inUse: 0, inactive: 0 })

const statsCards = [
  { label: '전체 시설',   value: stats.total,    unit: '개', desc: '운영 중 5개' },
  { label: '오늘 예약',   value: stats.today,    unit: '건', desc: '전일 대비 +5' },
  { label: '현재 이용 중', value: stats.inUse,   unit: '명', desc: '피크 타임 진행' },
  { label: '운영 중단',   value: stats.inactive, unit: '개', desc: '점검 중', descClass: 'warning' },
]

// 모달
const detailModal = reactive({ show: false, facility: null })
const deleteModal = reactive({ show: false, facility: null, loading: false })

// 유틸
const statusLabel = (f) => f.isActive ? '운영 중' : '중단'
const statusClass = (f) => f.isActive ? 'active' : 'inactive'
const formatTime  = (t) => t ? t.slice(0, 5) : '-'

// 필터된 목록
const filteredList = () => {
  return state.list.filter(f => {
    const matchStatus = !state.filterStatus ||
      (state.filterStatus === 'active' && f.isActive) ||
      (state.filterStatus === 'inactive' && !f.isActive)
    const matchSlot = !state.filterSlot || String(f.slotDuration) === state.filterSlot
    const matchSearch = !state.searchQuery ||
      f.name.includes(state.searchQuery) ||
      f.typeName?.includes(state.searchQuery)
    return matchStatus && matchSlot && matchSearch
  })
}

// 예약 현황 프로그레스 색상
const progressColor = (ratio) => {
  if (ratio >= 0.9) return '#E53E3E'
  if (ratio >= 0.6) return '#C08B2D'
  return '#4D8B5A'
}

// API
const fetchFacilities = async () => {
  try {
    const { data } = await facilityAPI.getFacilities()
    state.list      = data.resultData ?? []
    stats.total     = state.list.length
    stats.inactive  = state.list.filter(f => !f.isActive).length
  } catch (e) { console.error('시설 목록 조회 실패', e) }
}

const fetchTypes = async () => {
  try {
    const { data } = await facilityAPI.getTypes()
    state.types = data.resultData ?? []
  } catch (e) { console.error('타입 목록 조회 실패', e) }
}

// 상세 모달
const openDetail  = (f) => { detailModal.facility = f; detailModal.show = true }
const closeDetail = () => { detailModal.show = false; detailModal.facility = null }

// 수정 페이지 이동
const goEdit = (id) => {
  closeDetail()
  router.push(`/admin/facilities/${id}/edit`)
}

// 삭제 모달
const openDelete  = (f) => { deleteModal.facility = f; deleteModal.show = true }
const closeDelete = () => { deleteModal.show = false; deleteModal.facility = null }

const handleDelete = async () => {
  deleteModal.loading = true
  try {
    await facilityAPI.deleteFacility(deleteModal.facility.facilityId)
    closeDelete()
    await fetchFacilities()
  } catch (e) { console.error('삭제 실패', e) }
  finally { deleteModal.loading = false }
}

// 필터 초기화
const resetFilters = () => {
  state.filterStatus = ''
  state.filterSlot   = ''
  state.searchQuery  = ''
}

let searchTimer = null
const onSearch = () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {}, 300)
}

onMounted(() => { fetchFacilities(); fetchTypes() })
</script>

<template>
  <div class="facility-manage-view">

    <!-- 통계 카드 -->
    <StatsCards :stats="statsCards" />

    <div class="table-section">

      <!-- 필터 -->
      <FilterBar @reset="resetFilters">
        <div class="search-wrap">
          <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input v-model="state.searchQuery" class="search-input" placeholder="시설명 검색" @input="onSearch" />
        </div>
        <select v-model="state.filterStatus" class="filter-select">
          <option value="">운영 상태</option>
          <option value="active">운영 중</option>
          <option value="inactive">중단</option>
        </select>
        <select v-model="state.filterSlot" class="filter-select">
          <option value="">예약 단위</option>
          <option value="30">30분</option>
          <option value="60">60분</option>
          <option value="90">90분</option>
          <option value="120">120분</option>
        </select>
      </FilterBar>

      <!-- 카드 그리드 -->
      <div class="facility-grid">
        <div
          v-for="f in filteredList()"
          :key="f.facilityId"
          class="facility-card"
          :class="{ inactive: !f.isActive }"
        >
          <div class="card-header">
            <div class="card-title-wrap">
              <div class="card-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
                </svg>
              </div>
              <div>
                <div class="card-name">{{ f.name }}</div>
                <div class="card-id">ID #{{ f.facilityId }}</div>
              </div>
            </div>
            <span :class="['status-badge', statusClass(f)]">{{ statusLabel(f) }}</span>
          </div>

          <div class="card-body">
            <div class="card-info-row">
              <div class="card-info">
                <span class="info-label">최대 인원</span>
                <span class="info-value">{{ f.maxCapacity }}명</span>
              </div>
              <div class="card-info">
                <span class="info-label">예약 단위</span>
                <span class="info-value">{{ f.slotDuration }}분</span>
              </div>
            </div>
            <div class="card-info-row">
              <div class="card-info">
                <span class="info-label">운영 시간</span>
                <span class="info-value">{{ formatTime(f.openTime) }} ~ {{ formatTime(f.closeTime) }}</span>
              </div>
              <div class="card-info">
                <span class="info-label">오늘 예약</span>
                <span class="info-value">{{ f.isActive ? '- / -' : '운영 중단' }}</span>
              </div>
            </div>
            <!-- 프로그레스 바 -->
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: f.isActive ? '50%' : '0%', background: progressColor(0.5) }"></div>
            </div>
          </div>

          <div class="card-footer">
            <button class="btn-detail" @click="openDetail(f)">상세</button>
            <button class="btn-edit"   @click="goEdit(f.facilityId)">수정</button>
            <button class="btn-delete" @click="openDelete(f)">삭제</button>
          </div>
        </div>
      </div>

    </div>

    <!-- 상세 모달 -->
    <BaseModal v-if="detailModal.show" title="시설 상세 정보" :subtitle="'ID #' + detailModal.facility?.facilityId" @close="closeDetail">
      <div class="detail-hero">
        <span :class="['detail-status-badge', statusClass(detailModal.facility)]">{{ statusLabel(detailModal.facility) }}</span>
        <h2 class="detail-title">{{ detailModal.facility?.name }}</h2>
        <p class="detail-sub">{{ detailModal.facility?.description ?? '-' }}</p>
      </div>
      <div class="detail-divider"></div>
      <div class="detail-grid">
        <div class="detail-cell"><span class="detail-label">시설 ID</span><span class="detail-value">#{{ detailModal.facility?.facilityId }}</span></div>
        <div class="detail-cell"><span class="detail-label">시설명</span><span class="detail-value">{{ detailModal.facility?.name }}</span></div>
        <div class="detail-cell"><span class="detail-label">최대 인원</span><span class="detail-value">{{ detailModal.facility?.maxCapacity }}명</span></div>
        <div class="detail-cell"><span class="detail-label">예약 단위</span><span class="detail-value">{{ detailModal.facility?.slotDuration }}분</span></div>
        <div class="detail-cell"><span class="detail-label">운영 시작</span><span class="detail-value">{{ formatTime(detailModal.facility?.openTime) }}</span></div>
        <div class="detail-cell"><span class="detail-label">운영 종료</span><span class="detail-value">{{ formatTime(detailModal.facility?.closeTime) }}</span></div>
        <div class="detail-cell"><span class="detail-label">운영 여부</span><span :class="['detail-status-badge', statusClass(detailModal.facility)]">{{ statusLabel(detailModal.facility) }}</span></div>
        <div class="detail-cell"><span class="detail-label">등록일</span><span class="detail-value">{{ detailModal.facility?.createdAt?.slice(0,10) ?? '-' }}</span></div>
      </div>
      <template #footer>
        <button class="btn-cancel" @click="closeDetail">닫기</button>
        <button class="btn-submit" @click="goEdit(detailModal.facility?.facilityId)">수정하기</button>
      </template>
    </BaseModal>

    <!-- 삭제 확인 모달 -->
    <BaseModal v-if="deleteModal.show" title="시설을 삭제하시겠습니까?" @close="closeDelete">
      <p class="delete-warning">이 작업은 되돌릴 수 없습니다.</p>
      <div class="delete-card">
        <div class="card-icon-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
          </svg>
        </div>
        <div>
          <div class="delete-name">{{ deleteModal.facility?.name }}</div>
          <div class="delete-info">최대 {{ deleteModal.facility?.maxCapacity }}명 · {{ formatTime(deleteModal.facility?.openTime) }} ~ {{ formatTime(deleteModal.facility?.closeTime) }} · 예약 {{ deleteModal.facility?.slotDuration }}분 단위</div>
        </div>
      </div>
      <p class="delete-hint">⚠ 삭제 시 해당 시설의 모든 예약 데이터도 함께 삭제됩니다.</p>
      <template #footer>
        <button class="btn-cancel" @click="closeDelete">취소</button>
        <button class="btn-delete-confirm" @click="handleDelete" :disabled="deleteModal.loading">
          {{ deleteModal.loading ? '삭제 중...' : '삭제' }}
        </button>
      </template>
    </BaseModal>

  </div>
</template>

<style scoped>
* { box-sizing: border-box; margin: 0; padding: 0; }
.facility-manage-view { display: flex; flex-direction: column; font-family: 'Noto Sans KR', sans-serif; color: #333; }
.table-section { background: #fff; border-radius: 10px; border: 1px solid #E2E8F0; overflow: hidden; }

/* 검색 */
.search-wrap { display: flex; align-items: center; border: 1px solid #E2E8F0; border-radius: 7px; padding: 7px 12px; gap: 6px; background: #F5F6F8; }
.search-icon { color: #A0AEC0; flex-shrink: 0; }
.search-input { border: none; background: transparent; font-size: 13px; outline: none; color: #333; width: 150px; font-family: 'Noto Sans KR', sans-serif; }
.search-input::placeholder { color: #CBD5E0; }
.filter-select { border: 1px solid #E2E8F0; border-radius: 7px; padding: 7px 28px 7px 12px; font-size: 13px; color: #333; background: #fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23A0AEC0' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat right 10px center; appearance: none; cursor: pointer; outline: none; font-family: 'Noto Sans KR', sans-serif; }

/* 카드 그리드 */
.facility-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; padding: 20px; }
.facility-card { border: 1px solid #E2E8F0; border-radius: 10px; padding: 18px; display: flex; flex-direction: column; gap: 14px; background: #fff; transition: box-shadow 0.15s; }
.facility-card:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
.facility-card.inactive { background: #FAFAFA; opacity: 0.85; }

.card-header { display: flex; justify-content: space-between; align-items: flex-start; }
.card-title-wrap { display: flex; align-items: center; gap: 10px; }
.card-icon { width: 36px; height: 36px; background: #F0F4FF; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #2B3A55; flex-shrink: 0; }
.card-name { font-size: 15px; font-weight: 700; color: #1A202C; }
.card-id   { font-size: 11px; color: #A0AEC0; margin-top: 2px; }

.status-badge        { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
.status-badge.active   { background: #EBF5EE; color: #4D8B5A; }
.status-badge.inactive { background: #F5F5F5; color: #718096; }

.card-body { display: flex; flex-direction: column; gap: 10px; }
.card-info-row { display: flex; gap: 24px; }
.card-info { display: flex; flex-direction: column; gap: 2px; }
.info-label { font-size: 11px; color: #A0AEC0; }
.info-value { font-size: 14px; font-weight: 600; color: #1A202C; }

.progress-bar { height: 6px; background: #E2E8F0; border-radius: 3px; overflow: hidden; }
.progress-fill { height: 100%; border-radius: 3px; transition: width 0.4s ease; }

.card-footer { display: flex; gap: 6px; }
.btn-detail { flex: 1; padding: 7px; border: 1px solid #E2E8F0; border-radius: 6px; background: #fff; font-size: 12px; color: #718096; cursor: pointer; font-family: 'Noto Sans KR', sans-serif; }
.btn-detail:hover { background: #F5F6F8; }
.btn-edit   { flex: 1; padding: 7px; border: 1px solid #E2E8F0; border-radius: 6px; background: #fff; font-size: 12px; color: #2B3A55; cursor: pointer; font-family: 'Noto Sans KR', sans-serif; }
.btn-edit:hover { background: #F0F4FF; }
.btn-delete { flex: 1; padding: 7px; border: 1px solid #FECACA; border-radius: 6px; background: #fff; font-size: 12px; color: #E53E3E; cursor: pointer; font-family: 'Noto Sans KR', sans-serif; }
.btn-delete:hover { background: #FEE2E2; }

/* 상세 모달 */
.detail-hero { margin-bottom: 14px; }
.detail-status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 8px; }
.detail-status-badge.active   { background: #EBF5EE; color: #4D8B5A; }
.detail-status-badge.inactive { background: #F5F5F5; color: #718096; }
.detail-title { font-size: 26px; font-weight: 700; color: #1A202C; margin-bottom: 2px; margin-top: 8px; }
.detail-sub   { font-size: 13px; color: #A0AEC0; }
.detail-divider { height: 1px; background: #E2E8F0; margin: 14px 0; }
.detail-grid  { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.detail-cell  { display: flex; flex-direction: column; gap: 4px; }
.detail-label { font-size: 12px; color: #A0AEC0; }
.detail-value { font-size: 14px; font-weight: 600; color: #1A202C; }

/* 삭제 모달 */
.delete-warning { font-size: 13px; color: #718096; margin-bottom: 12px; text-align: center; }
.delete-card { display: flex; align-items: center; gap: 12px; background: #F5F6F8; border-radius: 8px; padding: 12px 16px; margin-bottom: 12px; }
.card-icon-sm { width: 32px; height: 32px; background: #E2E8F0; border-radius: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.delete-name { font-size: 14px; font-weight: 700; color: #1A202C; }
.delete-info { font-size: 12px; color: #718096; margin-top: 2px; }
.delete-hint { font-size: 12px; color: #E53E3E; text-align: center; }

/* 버튼 */
.btn-cancel { padding: 9px 20px; border: 1px solid #E2E8F0; border-radius: 7px; background: #fff; font-size: 13px; color: #718096; cursor: pointer; font-family: 'Noto Sans KR', sans-serif; }
.btn-cancel:hover { background: #F5F6F8; }
.btn-submit { padding: 9px 24px; background: #2B3A55; color: #fff; border: none; border-radius: 7px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'Noto Sans KR', sans-serif; }
.btn-submit:hover { background: #1E2A3E; }
.btn-delete-confirm { padding: 9px 24px; background: #E53E3E; color: #fff; border: none; border-radius: 7px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'Noto Sans KR', sans-serif; }
.btn-delete-confirm:hover:not(:disabled) { background: #c53030; }
.btn-delete-confirm:disabled { opacity: 0.5; cursor: default; }
</style>