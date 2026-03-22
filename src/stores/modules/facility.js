import { defineStore } from 'pinia'
import facilityAPI from '@/api/facility.js'

// ── 타입 ID 상수 (뷰·스토어 공용) ───────────────────────────────
export const FACILITY_TYPE_IDS = [1, 2, 3]   // 편의 시설
export const GX_TYPE_ID        = 4            // GX강습

export const useFacilityStore = defineStore('facility', {
  state: () => ({
    // ── 관리자용 ──────────────────────────────
    list:     [],  // 전체 시설 목록 (관리자)
    total:    0,
    inactive: 0,

    // ── 사용자용 ──────────────────────────────
    facilityList: [],   // 편의 시설 탭 목록
    gxList:       [],   // GX 탭 목록
    detailCache:  {},   // { [facilityId]: facilityObject }

    // ── 공용 ──────────────────────────────────
    types: [],
  }),

  getters: {
    // 관리자
    activeCount:  (state) => state.total - state.inactive,
    byType:       (state) => (typeId) => state.list.filter(f => f.typeId === typeId),
    findById:     (state) => (id)     => state.list.find(f => f.facilityId === id) ?? null,

    // 사용자 단건 (캐시)
    getCached:    (state) => (id) => state.detailCache[id] ?? null,

    // 타입
    findTypeById: (state) => (id) => state.types.find(t => t.typeId === id) ?? null,
  },

  actions: {
    // ── 관리자: 전체 목록 ──────────────────────────────────────
    async fetchFacilities() {
      try {
        const { data } = await facilityAPI.getFacilities()
        const list = data.resultData ?? []
        this.list     = list
        this.total    = list.length
        this.inactive = list.filter(f => !f.isActive).length
      } catch (e) {
        console.error('시설 목록 조회 실패', e)
      }
    },

    // ── 사용자: 편의 시설 탭 ──────────────────────────────────
    async fetchFacilityList() {
      try {
        const results = await Promise.all(
          FACILITY_TYPE_IDS.map(id =>
            facilityAPI.getFacilities({ typeId: id, page: 1, size: 100 })
          )
        )
        this.facilityList = results.flatMap(r => r.data.resultData ?? [])
      } catch (e) {
        console.error('편의 시설 목록 조회 실패', e)
      }
    },

    // ── 사용자: GX 탭 ─────────────────────────────────────────
    async fetchGxList() {
      try {
        const { data } = await facilityAPI.getFacilities({
          typeId: GX_TYPE_ID, page: 1, size: 100,
        })
        this.gxList = data.resultData?.content ?? data.resultData ?? []
      } catch (e) {
        console.error('GX 목록 조회 실패', e)
      }
    },

    // ── 사용자: 단건 조회 (캐시 우선) ─────────────────────────
    async fetchFacilityDetail(id) {
      if (this.detailCache[id]) return this.detailCache[id]
      try {
        const { data } = await facilityAPI.getFacility(id)
        const facility = data.resultData
        this.detailCache[id] = facility
        return facility
      } catch (e) {
        console.error('시설 상세 조회 실패', e)
        return null
      }
    },

    // ── 타입 CRUD ─────────────────────────────────────────────
    async fetchTypes() {
      try {
        const { data } = await facilityAPI.getTypes()
        this.types = data.resultData ?? []
      } catch (e) {
        console.error('타입 목록 조회 실패', e)
      }
    },

    async createType(payload) {
      const { data } = await facilityAPI.createType(payload)
      await this.fetchTypes()
      return data
    },

    async updateType(typeId, payload) {
      const { data } = await facilityAPI.updateType(typeId, payload)
      await this.fetchTypes()
      return data
    },

    async deleteType(typeId) {
      await facilityAPI.deleteType(typeId)
      await this.fetchTypes()
    },
  },
})