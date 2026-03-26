import { defineStore } from 'pinia'
import vehicleAPI from '@/api/vehicle.js'

export const useVehicleStore = defineStore('vehicle', {
  state: () => ({
    // ── 통계 ──────────────────────────────────
    total:    0,
    pending:  0,
    approved: 0,
    rejected: 0,

    // ── 관리자: 차량 목록 (페이지네이션) ──────
    list:          [],
    maxPage:       0,
    totalFiltered: 0,
    dongs:         [],   // 필터용 동 목록

    // ── 사용자: 내 차량 + 로그 ────────────────
    myList: [],
    logs:   [],
  }),

  getters: {
    findById:    (state) => (id) => state.list.find(v => v.vehicleId === id) ?? null,
    findMyById:  (state) => (id) => state.myList.find(v => v.vehicleId === id) ?? null,

    // 세대 차량 수 (householdId 기준)
    countByHousehold: (state) => (householdId) =>
      state.list.filter(v => v.household?.householdId === householdId).length,
  },

  actions: {
    // ── 통계 ──────────────────────────────────────────────────────
    async fetchStats() {
      try {
        const { data } = await vehicleAPI.getVehicleStats()
        const d = data.resultData
        this.total    = d.total    ?? 0
        this.pending  = d.pending  ?? 0
        this.approved = d.approved ?? 0
        this.rejected = d.rejected ?? 0
      } catch (e) {
        console.error('차량 통계 조회 실패', e)
      }
    },

    // ── 관리자: 차량 목록 ─────────────────────────────────────────
    async fetchVehicles(params = {}) {
      try {
        const { data } = await vehicleAPI.getAllVehicles({
          search:      params.search      || null,
          status:      params.status      || null,
          householdId: params.householdId || null,
          carType:     params.carType     || null,
          dong:        params.dong        || null,
          page:        (params.page ?? 1) - 1,   // 뷰는 1-based
          size:        params.size        ?? 10,
        })
        const result  = data.resultData
        const raw     = result.content ?? []
        // 대기 차량 우선 정렬
        this.list = [...raw].sort((a, b) => {
          if (a.status === 'PENDING' && b.status !== 'PENDING') return -1
          if (a.status !== 'PENDING' && b.status === 'PENDING') return 1
          return 0
        })
        this.maxPage       = result.totalPages ?? 0
        this.totalFiltered = raw.length
      } catch (e) {
        console.error('차량 목록 조회 실패', e)
      }
    },

    // ── 관리자: 필터용 동 목록 ────────────────────────────────────
    async fetchDongs() {
      if (this.dongs.length) return   // 이미 로드됐으면 재사용
      try {
        const { data } = await vehicleAPI.getDongs()
        this.dongs = data.resultData ?? []
      } catch (e) {
        console.error('동 목록 조회 실패', e)
      }
    },

    // ── 관리자: 승인 ──────────────────────────────────────────────
    async approveVehicle(vehicleId, params) {
      await vehicleAPI.approveVehicle(vehicleId)
      await Promise.all([this.fetchVehicles(params), this.fetchStats()])
    },

    // ── 관리자: 거부 ──────────────────────────────────────────────
    async rejectVehicle(vehicleId, params) {
      await vehicleAPI.rejectVehicle(vehicleId)
      await Promise.all([this.fetchVehicles(params), this.fetchStats()])
    },

    // ── 관리자: 삭제 ──────────────────────────────────────────────
    async deleteVehicle(vehicleId, params) {
      await vehicleAPI.deleteVehicle(vehicleId)
      await Promise.all([this.fetchVehicles(params), this.fetchStats()])
    },

    // ── 사용자: 내 차량 목록 ──────────────────────────────────────
    async fetchMyVehicles() {
      try {
        const { data } = await vehicleAPI.getMyVehicles()
        this.myList = data.resultData ?? []
      } catch (e) {
        console.error('내 차량 조회 실패', e)
      }
    },

    // ── 사용자: 입출차 로그 ───────────────────────────────────────
    async fetchLogs() {
      try {
        const { data } = await vehicleAPI.getMyVehicleLogs()
        this.logs = data.resultData ?? []
      } catch (e) {
        console.error('입출차 기록 조회 실패', e)
      }
    },

    // ── 사용자: 차량 등록 ─────────────────────────────────────────
    async registerVehicle(payload) {
      await vehicleAPI.registerVehicle(payload)
      await this.fetchMyVehicles()
    },

    // ── 사용자: 차량 수정 ─────────────────────────────────────────
    async updateVehicle(vehicleId, payload) {
      await vehicleAPI.updateVehicle(vehicleId, payload)
      await this.fetchMyVehicles()
    },

    // ── 사용자: 차량 삭제 ─────────────────────────────────────────
    async deleteMyVehicle(vehicleId) {
      await vehicleAPI.deleteVehicle(vehicleId)
      await this.fetchMyVehicles()
    },
  },
})