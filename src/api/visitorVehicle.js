import api from '@/api/axios.js'

// API-030 | 방문차량 사전등록
export const registerVisitorVehicle = (data) => {
    return api.post('/visitor-vehicles', data)
}

// API-031 | 내 방문차량 목록 조회
export const getMyVisitorVehicles = (params) => {
    return api.get('/visitor-vehicles/my', { params })
}