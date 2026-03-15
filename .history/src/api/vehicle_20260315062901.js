// src/api/vehicle.js
// 차량 관련 API 호출 모듈
// 백엔드: VehicleController (/api/vehicles, /api/admin/vehicles)

import axios from './axios'

export default {

  // API-038 | 내 차량 목록 조회
  // GET /api/vehicles/my
  // 반환: [{ vehicleId, licensePlate, carModel, status, createdAt }]
  getMyVehicles() {
    return axios.get('/vehicles/my')
  },

  // API-039 | 차량 등록
  // POST /api/vehicles
  // Body: { licensePlate, carModel }
  registerVehicle(data) {
    return axios.post('/vehicles', data)
  },

  // API-040 | 차량 수정
  // PUT /api/vehicles/:id
  // Body: { carModel }
  updateVehicle(id, data) {
    return axios.put(`/vehicles/${id}`, data)
  },

  // API-041 | 차량 삭제
  // DELETE /api/vehicles/:id
  deleteVehicle(id) {
    return axios.delete(`/vehicles/${id}`)
  },

  // API-042 | 전체 차량 목록 조회 (관리자) - 페이징
  getAllVehicles({ householdId = null, page = 0, size = 10 } = {}) {
    return axios.get('/admin/vehicles', {
      params: {
        householdId: householdId || undefined, // null/빈값이면 파라미터 제외
        page,
        size,
      }
    })
  },

  // API-042 | 차량 통계 조회 (관리자)
  getVehicleStats() {
    return axios.get('/admin/vehicles/stats')
  },

  // API-042 | 차량 승인 (관리자)
  approveVehicle(id) {
    return axios.patch(`/admin/vehicles/${id}/approve`)
  },

  // API-042 | 차량 거부 (관리자)
  rejectVehicle(id) {
    return axios.patch(`/admin/vehicles/${id}/reject`)
  },

  // API-043 | 내 차량 입출차 기록 조회
  getMyVehicleLogs() {
    return axios.get('/vehicles/my-logs')
  },
}