import { defineStore } from 'pinia'
import vehicleAPI from '@/api/vehicle.js'

export const useVehicleStore = defineStore('vehicle', {
  state: () => ({
    total:    0,
    pending:  0,
    approved: 0,
    rejected: 0,
  }),
  actions: {
    async fetchStats() {
      try {
        const result = await vehicleAPI.getVehicleStats()  // ← 연결
        const d = result.data.resultData
        this.total    = d.total    ?? 0
        this.pending  = d.pending  ?? 0
        this.approved = d.approved ?? 0
        this.rejected = d.rejected ?? 0
      } catch (e) {
        console.error('차량 통계 조회 실패', e)
      }
    }
  }
})