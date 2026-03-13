// src/api/vehicle.js
// 차량 관련 API 호출 모듈
// 백엔드: VehicleController (/api/vehicles, /api/admin/vehicles)

import axios from './axios'

export default {

  // ── API-038: 내 차량 목록 조회 ────────────────────────────────
  // GET /api/vehicles/my
  // 반환: [ { vehicleId, userId, licensePlate, carModel, status, approvedAt, createdAt } ]
  getMyVehicles() {
    return axios.get('/vehicles/my')
  },

  // ── API-039: 차량 등록 ────────────────────────────────────────
  // POST /api/vehicles
  // Body: { licensePlate, carModel }
  registerVehicle(data) {
    return axios.post('/vehicles', data)
  },

  // ── API-040: 차량 수정 ────────────────────────────────────────
  // PUT /api/vehicles/:id
  // Body: { licensePlate, carModel }
  updateVehicle(id, data) {
    return axios.put(`/vehicles/${id}`, data)
  },

  // ── API-041: 차량 삭제 ────────────────────────────────────────
  // DELETE /api/vehicles/:id
  deleteVehicle(id) {
    return axios.delete(`/vehicles/${id}`)
  },

  // ── API-042: 전체 차량 목록 조회 (관리자) ─────────────────────
  // GET /api/admin/vehicles
  // 반환: [ { vehicleId, userId, licensePlate, carModel, status, approvedAt, createdAt } ]
  getAllVehicles() {
    return axios.get('/admin/vehicles')
  },

  // ── API-043: 내 차량 입출차 기록 조회 ────────────────────────
  // GET /api/vehicles/my-logs
  // 반환: [ { logId, licensePlate, entryType, loggedAt } ]
  getMyVehicleLogs() {
    return axios.get('/vehicles/my-logs')
  },
  // 차량 승인 (관리자)
approveVehicle(id) {
  return axios.patch(`/admin/vehicles/${id}/approve`)
},

// 차량 거부 (관리자)
rejectVehicle(id) {
  return axios.patch(`/admin/vehicles/${id}/reject`)
},

}