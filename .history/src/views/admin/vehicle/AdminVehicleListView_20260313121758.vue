<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import vehicleAPI from '@/api/vehicle.js'

import StatsCards from '@/components/admin/StatsCards.vue'
import FilterBar  from '@/components/admin/FilterBar.vue'
import AdminTable from '@/components/admin/AdminTable.vue'
import Pagination from '@/components/admin/Pagination.vue'

const state = reactive({
  list: [],
  householdOptions: [],

  // 필터
  searchQuery:     '',
  filterStatus:    '',
  filterHousehold: '',
  filterType:      '',

  // 페이지네이션
  size:          10,
  currentPage:   1,
  maxPage:       0,
  totalFiltered: 0,
})

const stats = ref({ total: 0, pending: 0, approved: 0, rejected: 0 })
const selectedIds = ref([])
const selectAll   = ref(false)

// ── 테이블 컬럼 ──
const columns = [
  { label: '',        key: 'checkbox' },
  { label: 'ID',      key: 'vehicleId' },
  { label: '차량번호', key: 'licensePlate' },
  { label: '차종',     key: 'carModel' },
  { label: '승인 상태', key: 'status' },
  { label: '등록일',   key: 'createdAt' },
]

// ── 통계 카드 데이터 ──
const statsCards = computed(() => [
  { label: '전체 등록 차량', value: stats.value.total,    unit: '대', desc: '승인 완료 기준' },
  { label: '승인 대기',      value: stats.value.pending,  unit: '대', desc: '즉시 처리 필요', descClass: 'urgent' },
  { label: '승인 완료',      value: stats.value.approved, unit: '대', desc: '정상 등록' },
  { label: '거부',           value: stats.value.rejected, unit: '대', desc: '재신청 가능' },
])

// ── 유틸 ──
const statusLabel = (s) => ({ APPROVED: '승인', PENDING: '대기', REJECTED: '거부' }[s] ?? s)
const statusClass = (s) => ({ APPROVED: 'approved', PENDING: 'pending', REJECTED: 'rejected' }[s] ?? '')

const toggleSelectAll = () => {
  selectedIds.value = selectAll.value ? state.list.map(v => v.vehicleId) : []
}

// ── API 호출 ──