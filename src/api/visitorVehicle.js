import api from '@/api/axios.js'

// API-030 | 방문차량 사전등록
export const registerVisitorVehicle = (data) => {
    return api.post('/visitor-vehicles', data)
        .then(res => ({ ...res, data: res.data.resultData }))
}

// API-031 | 내 방문차량 목록 조회
export const getMyVisitorVehicles = (params) => {
    return api.get('/visitor-vehicles/my', {params})
        .then(res => ({ ...res, data: res.data.resultData }))
}

// API-032 | 방문차량 상세 조회
export const getVisitorVehicleDetail = (id) => {
    return api.get(`/visitor-vehicles/${id}`)
        .then(res => ({ ...res, data: res.data.resultData }))
}

// API-033 | 방문차량 재사용 등록
export const reuseVisitorVehicle = (id, data) => {
    return api.post(`/visitor-vehicles/${id}/reuse`, data)
        .then(res => ({ ...res, data: res.data.resultData }))
}

// API-034 | 방문차량 수정
export const updateVisitorVehicle = (id, data) => {
    return api.put(`/visitor-vehicles/${id}`, data)
        .then(res => ({ ...res, data: res.data.resultData }))
}

// API-035 | 방문차량 삭제
export const deleteVisitorVehicle = (id) => {
    return api.delete(`/visitor-vehicles/${id}`)
        .then(res => ({ ...res, data: res.data.resultData }))
}

// API-036 | 등록 취소
export const cancelVisitorVehicle = (id) => {
    return api.patch(`/visitor-vehicles/${id}/cancel`)
        .then(res => ({ ...res, data: res.data.resultData }))
}

// API-069 | 관리자 방문 예정 현황 조회
export const getAdminVisitorVehicles = (params) => {
    return api.get('/admin/visitor-vehicles', {params})
        .then(res => ({ ...res, data: res.data.resultData }))
}

// API-070 | 관리자 방문차량 통계 조회
export const getAdminVisitorVehicleStats = () => {
    return api.get('/admin/visitor-vehicles/stats')
        .then(res => ({ ...res, data: res.data.resultData }))
}

// API-062 | 고정 방문차량 등록
export const registerFixedVisitorVehicle = (data) => {
    return api.post('/visitor-vehicles/fixed', data)
        .then(res => ({ ...res, data: res.data.resultData }))
}

// API-063 | 내 고정 방문차량 목록 조회
export const getMyFixedVisitorVehicles = (params) => {
    return api.get('/visitor-vehicles/fixed/my', { params })
        .then(res => ({ ...res, data: res.data.resultData }))
}

// API-065 | 고정 방문차량 삭제
export const deleteFixedVisitorVehicle = (id) => {
    return api.delete(`/visitor-vehicles/fixed/${id}`)
        .then(res => ({ ...res, data: res.data.resultData }))
}

// 관리자 고정 방문차량 목록 조회
export const getAdminFixedVisitorVehicles = (params) => {
    return api.get('/admin/visitor-vehicles/fixed', { params })
        .then(res => ({ ...res, data: res.data.resultData }))
}

// 관리자 고정 방문차량 통계
export const getAdminFixedVisitorVehicleStats = () => {
    return api.get('/admin/visitor-vehicles/fixed/stats')
        .then(res => ({ ...res, data: res.data.resultData }))
}

// 관리자 고정 방문차량 삭제
export const deleteAdminFixedVisitorVehicle = (fixedId) => {
    return api.delete(`/admin/visitor-vehicles/fixed/${fixedId}`)
        .then(res => ({ ...res, data: res.data.resultData }))
}

// 관리자 고정 방문차량 등록
export const adminRegisterFixedVisitorVehicle = (data) => {
    return api.post('/admin/visitor-vehicles/fixed', data)
        .then(res => ({ ...res, data: res.data.resultData }))
}