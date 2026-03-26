import { defineStore } from 'pinia'
import facilityAPI from '@/api/facility.js'

export const FACILITY_TYPE_IDS = [1, 2, 3]
export const GX_TYPE_ID        = 4

export const useFacilityStore = defineStore('facility', {
  state: () => ({
    // 관리자용 
    list:     [],
    total:    0,
    inactive: 0,

    // 사용자용
    facilityList: [],
    gxList:       [],

    // 공용 
    types: [],
  }),

  getters: {
    activeCount:  (state) => state.total - state.inactive,
    byType:       (state) => (typeId) => state.list.filter(f => f.typeId === typeId),
    findById:     (state) => (id)     => state.list.find(f => f.facilityId === id) ?? null,
    findTypeById: (state) => (id) => state.types.find(t => t.typeId === id) ?? null,
    // getCached 제거
  },

  actions: {
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