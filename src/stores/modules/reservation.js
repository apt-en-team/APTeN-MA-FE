import { defineStore } from 'pinia'
import reservationAPI from '@/api/reservation'

export const useReservationStore = defineStore('reservation', {
  state: () => ({
    // 대시보드 상단 카드용
    gxPendingCount: 0,
    residentPendingCount: 0,

    todayTotal: 0,
    todayConfirmed: 0,
    todayCancelled: 0,
    todayPending: 0,
    monthTotal: 0,
    totalCount: 0,

    // 대시보드 오늘 시설 예약 현황용
    facilitySummaryList: [],
  }),

  getters: {
    totalPendingCount: (state) => state.gxPendingCount + state.residentPendingCount,
  },

  actions: {
    // GX 승인 대기 건수
    async fetchGxPendingCount() {
      try {
        const res = await reservationAPI.getGxPendingCount()
        this.gxPendingCount = res.data.resultData?.pendingCount || 0
      } catch (e) {
        console.error('GX 대기 건수 조회 실패', e)
        this.gxPendingCount = 0
      }
    },

    // 오늘 예약 통계
    async fetchTodayStats() {
      try {
        const res = await reservationAPI.TodayStats()
        const data = res.data.resultData || {}

        this.todayTotal = data.todayTotal || 0
        this.todayConfirmed = data.todayConfirmed || 0
        this.todayCancelled = data.todayCancelled || 0
        this.todayPending = data.todayPending || 0
        this.monthTotal = data.monthTotal || 0
        this.totalCount = data.totalCount || 0
      } catch (e) {
        console.error('오늘 예약 통계 조회 실패', e)
        this.todayTotal = 0
        this.todayConfirmed = 0
        this.todayCancelled = 0
        this.todayPending = 0
        this.monthTotal = 0
        this.totalCount = 0
      }
    },

    async fetchDashboardFacilitySummary() {
      try {
        const res = await reservationAPI.getDashboardFacilitySummary()
        const list = res.data.resultData || []

        this.facilitySummaryList = list.map(item => ({
          name: item.facilityName,
          hours: item.hours,
          current: item.currentCount,
          total: item.totalCount,
          percent: item.percent,
          barColor: item.barColor,
          isFull: item.isFull,
        }))
      } catch (e) {
        console.error('대시보드 시설 예약 현황 조회 실패', e)
        this.facilitySummaryList = []
      }
    },

    // 상단 카드 먼저 한 번에 조회
    async fetchDashboardStats() {
      await Promise.all([
        this.fetchGxPendingCount(),
        this.fetchTodayStats(),
        this.fetchDashboardFacilitySummary(),
      ])
    },
  },
})