import axios from 'axios'

export default {

  /** 관리자 전체 예약 목록 조회 */
  getAdminReservations: (params) =>
    axios.get('/api/admin/reservations', { params }),

  /** 관리자 예약 상세 조회 */
  getAdminReservationDetail: (reservationId) =>
    axios.get(`/api/admin/reservations/${reservationId}`),

  /** 관리자 강제 취소 (단건) */
  forceCancel: (reservationId) =>
    axios.delete(`/api/admin/reservations/${reservationId}`),

  /** GX 일괄 승인 */
  approveGx: (programId) =>
    axios.patch(`/api/admin/reservations/approve/${programId}`),

  /** 예약 가능 시간대 조회 */
  getAvailableSlots: (params) =>
    axios.get('/api/reservations/available', { params }),

  /** 예약 생성 */
  createReservation: (data) =>
    axios.post('/api/reservations', data),

  /** 내 예약 목록 조회 */
  getMyReservations: (params) =>
    axios.get('/api/reservations/my', { params }),

  /** 예약 상세 조회 */
  getReservationDetail: (reservationId) =>
    axios.get(`/api/reservations/${reservationId}`),

  /** 예약 취소 */
  cancelReservation: (reservationId) =>
    axios.delete(`/api/reservations/${reservationId}`),

  /** 운영 중인 시설 목록 조회 */
  getFacilities: () =>
    axios.get('/api/facilities'),

  /** 시설 타입 목록 조회 */
  getFacilityTypes: () =>
    axios.get('/api/facilities/types'),

  /** 최대 페이지 수 조회 */
  getMaxPage: (params) =>
    axios.get('/api/admin/reservations/count', { params }),

  /** GX 대기 건수 조회 */
  getGxPendingCount: () =>
    axios.get('/api/admin/reservations/gx-pending-count'),

  /** 관리자 예약현황 통계 */
  TodayStats: () =>
    axios.get('/api/admin/reservations/today-stats'),

  /** 관리자 예약현황 시설 리스트 조회 */
  getFacilityList: () =>
    axios.get('/api/admin/reservations/facilitylist'),

  /** 관리자 캘린더 raw 데이터 조회 (기존 API) */
  getReservationsByFacility: (params) =>
    axios.get('/api/admin/reservations/facility', { params }),

  /** GX 프로그램별 카운트 조회 */
  getGxPrograms: (params) =>
    axios.get('/api/admin/reservations/gx-programs', { params }),

  /** 독서실 날짜별 좌석 현황 조회 */
  getStudyRoomDetail: (params) =>
    axios.get('/api/admin/reservations/study-room', { params }),

  /** 헬스장 날짜별 이용자 목록 조회 */
  getGymDetail: (params) =>
    axios.get('/api/admin/reservations/gym', { params }),

  /** 골프 날짜별 타석 현황 조회 */
  getGolfDetail: (params) =>
    axios.get('/api/admin/reservations/golf', { params }),

  /** GX 프로그램별 사용자 목록 조회 */
  getGxUsersByProgram: (params) =>
    axios.get('/api/admin/reservations/gx-users', { params }),

  /** 대시보드 오늘 시설 예약 현황 */
  getDashboardFacilitySummary: () =>
  axios.get('/api/admin/reservations/dashboard-facility-summary'),

}