import { defineStore } from 'pinia'
import householdAPI from '@/api/household.js'

export const useHouseholdStore = defineStore('household', {
  state: () => ({
    residentPendingCount: 0,
    total:    0,
    occupied: 0,
    empty:    0,
    needCare: 0,
    moveIn:   0,
    moveOut:  0,
    monthNew: 0,
  }),
  actions: {
    async fetchStats() {
      try {
        const result = await householdAPI.getStats()
        const d = result.data.resultData
        this.total    = d.total    ?? 0
        this.residentPendingCount = d.residentPendingCount ?? 0
        this.occupied = d.occupied ?? 0
        this.empty    = d.empty    ?? 0
        this.needCare = d.needCare ?? 0
        this.moveIn   = d.moveIn   ?? 0
        this.moveOut  = d.moveOut  ?? 0
        this.monthNew = this.moveIn + this.moveOut
      } catch (e) {
        console.error('세대 통계 조회 실패', e)
      }
    },

    async fetchResidentPendingCount() {
      try {
        const result = await householdAPI.getPendingResidentCount()
        this.residentPendingCount = result.data.resultData ?? 0
      } catch (e) {
        console.error('입주민 승인 대기 건수 조회 실패', e)
        this.residentPendingCount = 0
      }
    }
  }
})