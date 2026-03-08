// src/api/household.js
// 세대 관리 관련 API 호출 모듈
// 백엔드: HouseholdController (/api/admin/households)

import axios from './axios'

export default {

    // ── API-014: 세대 목록 조회 (페이징) ─────────────────────────
    // GET /api/admin/households?page=0&size=10
    // 반환: { content, page, size, totalElements, totalPages }
    getHouseholds(page = 0, size = 10) {
        return axios.get('/admin/households', { params: { page, size } })
    },

    // ── 통계 조회 (프론트 상단 카드용) ───────────────────────────
    // GET /api/admin/households/stats
    // 반환: { total, occupied, empty, moveIn, moveOut, monthNew }
    getStats() {
        return axios.get('/admin/households/stats')
    },

    // ── API-015: 세대 등록 ────────────────────────────────────────
    // POST /api/admin/households
    // Body: { dong, ho }
    createHousehold(data) {
        return axios.post('/admin/households', data)
    },

    // ── API-016: 세대 수정 ────────────────────────────────────────
    // PUT /api/admin/households/:id
    // Body: { dong, ho }
    updateHousehold(id, data) {
        return axios.put(`/admin/households/${id}`, data)
    },

    // ── API-017: 세대 삭제 ────────────────────────────────────────
    // DELETE /api/admin/households/:id
    deleteHousehold(id) {
        return axios.delete(`/admin/households/${id}`)
    },

    // ── API-018: 입주/퇴거 이력 등록 ─────────────────────────────
    // POST /api/admin/households/:id/history
    // Body: { userId, status("입주" | "퇴거") }
    createHistory(id, data) {
        return axios.post(`/admin/households/${id}/history`, data)
    },

    // ── API-019: 입주/퇴거 이력 조회 ─────────────────────────────
    // GET /api/admin/households/:id/history
    getHistory(id) {
        return axios.get(`/admin/households/${id}/history`)
    },
}