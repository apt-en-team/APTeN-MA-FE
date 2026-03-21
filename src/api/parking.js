import api from '@/api/axios.js'

// API-037 | 주차 통계 조회 (관리자)
export const getParkingStats = ({startDate, endDate, type}) => {
    return api.get('/admin/parking/stats', {
        params: {startDate, endDate, type}
    })
}

// ADMIN | 주차장 현황 조회 (도넛 차트용)
export const getAdminParkingStatus = () => {
    return api.get('/parking/status')
}

// ADMIN | 주차장 수정
export const updateParkingLot = (id, data) => {
    return api.put(`/admin/parking/lots/${id}`, data)
}

// ADMIN | 입출차 기록 통계 조회
export const getParkingLogStats = () => {
    return api.get('/parking/logs/stats')
}

// ADMIN | 입출차 기록 목록 조회
export const getParkingLogs = (params) => {
    return api.get('/parking/logs', {params})
}

// ADMIN | 입출차 기록 수동 등록
export const createParkingLog = (data) => {
    return api.post('/parking/logs', data)
}

// RESIDENT | 주차 현황 조회
export const getParkingStatus = () => {
    return api.get('/parking/status')
}