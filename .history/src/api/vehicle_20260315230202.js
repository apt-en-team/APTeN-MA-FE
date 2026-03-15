import axios from './axios'

export default {

  // API-038 | 내 차량 목록 조회
  getMyVehicles() {
    return axios.get('/vehicles/my')
  },

  // API-039 | 차량 등록
  registerVehicle(data) {
    return axios.post('/vehicles', data)
  },

  // API-040 | 차량 수정
  updateVehicle(id, data) {
    return axios.put(`/vehicles/${id}`, data)
  },

  // API-041 | 차량 삭제
  deleteVehicle(id) {
    return axios.delete(`/vehicles/${id}`)
  },

  // API-042 | 전체 차량 목록 조회 (관리자)
  getAllVehicles({ householdId = null, status = null, carType = null, dong = null, page = 0, size = 10 } = {}) {
    return axios.get('/admin/vehicles', {
      params: {
        householdId: householdId || undefined,
        status:      status      || undefined,
        carType:     carType     || undefined,
        dong:        dong        || undefined,
        search:      search      || undefined, 
        page,
        size,
      }
    })
  },

  // ADMIN | 차량 통계 조회
  getVehicleStats() {
    return axios.get('/admin/vehicles/stats')
  },

  // ADMIN | 동 목록 조회 ← 추가
  getDongs() {
    return axios.get('/admin/vehicles/dongs')
  },

  // ADMIN | 차량 승인
  approveVehicle(id) {
    return axios.patch(`/admin/vehicles/${id}/approve`)
  },

  // ADMIN | 차량 거부
  rejectVehicle(id) {
    return axios.patch(`/admin/vehicles/${id}/reject`)
  },

  // API-043 | 내 차량 입출차 기록 조회
  getMyVehicleLogs() {
    return axios.get('/vehicles/my-logs')
  },
}