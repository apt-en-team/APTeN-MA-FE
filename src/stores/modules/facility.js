import { defineStore } from 'pinia'
import facilityAPI from '@/api/facility.js'

export const useFacilityStore = defineStore('facility', {
  state: () => ({
    total:    0,   // 전체 시설
    today:    0,   // 오늘 예약
    inUse:    0,   // 현재 이용 중
    inactive: 0,   // 운영 중단
  }),
  actions: {
    async fetchStats() {
      try {
        const { data } = await facilityAPI.getFacilities()
        const list = data.resultData ?? []
        this.total    = list.length
        this.inactive = list.filter(f => !f.isActive).length
      } catch (e) {
        console.error('시설 통계 조회 실패', e)
      }
    }
  }
})