// src/stores/modules/vehicle.js
// 차량 통계 상태 관리 (관리자 대시보드용)

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
    // 차량 통계 조회 | GET /api/admin/vehicles/stats
    async fetchStats() {
      try {
        const result = await vehicleAPI.getVehicleStats()
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