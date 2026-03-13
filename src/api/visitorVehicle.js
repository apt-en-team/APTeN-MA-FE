import api from '@/api/axios.js'

// API-030 | 방문차량 사전등록
export const registerVisitorVehicle = (data) => {
    return api.post('/visitor-vehicles', data)
}

// API-031 | 내 방문차량 목록 조회
export const getMyVisitorVehicles = (params) => {
    return api.get('/visitor-vehicles/my', {params})
}

// API-032 | 방문차량 상세 조회
export const getVisitorVehicleDetail = (id) => {
    return api.get(`/visitor-vehicles/${id}`)
}

// API-033 | 방문차량 재사용 등록
export const reuseVisitorVehicle = (id, data) => {
    return api.post(`/visitor-vehicles/${id}/reuse`, data)
}

// API-034 | 방문차량 수정
export const updateVisitorVehicle = (id, data) => {
    return api.put(`/visitor-vehicles/${id}`, data)
}

// API-035 | 방문차량 삭제
export const deleteVisitorVehicle = (id) => {
    return api.delete(`/visitor-vehicles/${id}`)
}

// API-036 | 등록 취소 (승인된 차량)
export const cancelVisitorVehicle = (id) => {
    return api.patch(`/visitor-vehicles/${id}/cancel`)
}