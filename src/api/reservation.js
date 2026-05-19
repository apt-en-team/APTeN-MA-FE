import axios from './axios'

export default {

  /** 관리자 전체 예약 목록 조회 */
  getAdminReservations: (params) =>
    axios.get('/admin/reservations', { params }),

  /** 관리자 예약 상세 조회 */
  getAdminReservationDetail: (reservationId) =>
    axios.get(`/admin/reservations/${reservationId}`),

  /** 관리자 강제 취소 (단건) */
  forceCancel: (reservationId) =>
    axios.delete(`/admin/reservations/${reservationId}`),

  /** GX 일괄 승인 */
  approveGx: (programId) =>
    axios.patch(`/admin/reservations/approve/${programId}`),

  /** 예약 가능 시간대 조회 */
  getAvailableSlots: (params) =>
    axios.get('/reservations/available', { params }),

  /** 예약 생성 */
  createReservation: (data) =>
    axios.post('/reservations', data),

  /** 내 예약 목록 조회 */
  getMyReservations: (params) =>
    axios.get('/reservations/my', { params }),

  /** 예약 상세 조회 */
  getReservationDetail: (reservationId) =>
    axios.get(`/reservations/${reservationId}`),

  /** 예약 취소 */
  cancelReservation: (reservationId) =>
    axios.delete(`/reservations/${reservationId}`),

  /** 최대 페이지 수 조회 */
  getMaxPage: (params) =>
    axios.get('/admin/reservations/count', { params }),
    
  /** 최대 페이지 수 조회 */
  getMyMaxPage: (params) =>
    axios.get('/reservations/count', { params }),

  /** GX 대기 건수 조회 */
  getGxPendingCount: () =>
    axios.get('/admin/reservations/gx-pending-count'),

  /** 관리자 예약현황 통계 */
  TodayStats: () =>
    axios.get('/admin/reservations/today-stats'),

  /** 관리자 예약현황 시설 리스트 조회 */
  getFacilityList: () =>
    axios.get('/admin/reservations/facilitylist'),

  /** 관리자 캘린더 raw 데이터 조회 (기존 API) */
  getReservationsByFacility: (params) =>
    axios.get('/admin/reservations/facility', { params }),

  /** GX 프로그램별 카운트 조회 */
  getGxPrograms: (params) =>
    axios.get('/admin/reservations/gx-programs', { params }),

  /** 독서실 날짜별 좌석 현황 조회 */
  getStudyRoomDetail: (params) =>
    axios.get('/admin/reservations/study-room', { params }),

  /** 헬스장 날짜별 이용자 목록 조회 */
  getGymDetail: (params) =>
    axios.get('/admin/reservations/gym', { params }),

  /** 골프 날짜별 타석 현황 조회 */
  getGolfDetail: (params) =>
    axios.get('/admin/reservations/golf', { params }),

  /** GX 프로그램별 사용자 목록 조회 */
  getGxUsersByProgram: (params) =>
    axios.get('/admin/reservations/gx-users', { params }),

  /** 대시보드 오늘 시설 예약 현황 */
  getDashboardFacilitySummary: () =>
  axios.get('/admin/reservations/dashboard-facility-summary'),

  //독서실 좌석 상태 조회
  getStudyRoomSeatStatus: (params) =>
    axios.get('/reservations/study-room/seats', { params }),

  //골프 타석 상태 조회
  getGolfSeatStatus: (params) =>
    axios.get('/reservations/golf/seats', { params }),

}
