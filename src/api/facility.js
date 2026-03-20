import axios from './axios'

export default {

  // API-044 | 시설 타입 목록 조회
  getTypes() {
    return axios.get('/admin/facility-types')
  },

    /** 시설 타입 카테고리별 조회 */
  getFacilityTypesCategory: () =>
    axios.get('/facilities/type/category'),

  /** 운영 중인 시설 타입 목록 조회 */
  getFacilityTypes: () =>
    axios.get('/facilities/all'),

  // API-045 | 시설 타입 등록
  createType(data) {
    return axios.post('/admin/facility-types', data)
  },

  // API-046 | 시설 타입 수정
  updateType(id, data) {
    return axios.put(`/admin/facility-types/${id}`, data)
  },

  // API-047 | 시설 타입 삭제
  deleteType(id) {
    return axios.delete(`/admin/facility-types/${id}`)
  },

  // API-048 | 시설 목록 조회 (타입 필터)
  getFacilities(typeId = null) {
    return axios.get('/facilities', {
      params: { typeId: typeId || undefined }
    })
  },

  // API-049 | 시설 상세 조회
  getFacility(id) {
    return axios.get(`/facilities/${id}`)
  },

  // API-050 | 시설 등록
  createFacility(data) {
    return axios.post('/admin/facilities', data)
  },

  // API-051 | 시설 수정
  updateFacility(id, data) {
    return axios.put(`/admin/facilities/${id}`, data)
  },

  // API-052 | 시설 삭제
  deleteFacility(id) {
    return axios.delete(`/admin/facilities/${id}`)
  },
}