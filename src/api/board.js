import api from './axios'

// ── 입주자 게시글 목록 조회
export const getPostList = ({ category = 'FREE', page = 1, size = 10, keyword = '' } = {}) => {
  const params = { category, page, size }
  if (keyword) params.keyword = keyword
  return api.get('/boards', { params }).then(res => ({ ...res, data: res.data.resultData }))
}

// ── 입주민 게시글 상세 조회
export const getPostDetail = (id) =>
  api.get(`/boards/${id}`).then(res => ({ ...res, data: res.data.resultData }))

// ── 관리자 게시글 상세 조회
export const getAdminPostDetail = (id) =>
  api.get(`/admin/boards/${id}`).then(res => ({ ...res, data: res.data.resultData }))

// ── 관리자 게시판 통계
export const getAdminBoardStats = () =>
  api.get('/admin/boards/stats').then(res => ({ ...res, data: res.data.resultData }))

// ── 관리자 게시글 목록 조회
export const getAdminPostList = ({ category = '', page = 1, size = 9, isDeleted = null } = {}) => {
  const params = { page, size }
  if (category) params.category = category
  if (isDeleted !== null) params.isDeleted = isDeleted
  return api.get('/admin/boards', { params }).then(res => ({ ...res, data: res.data.resultData }))
}

// ── 인기글 목록 조회
export const getPopularPosts = () =>
  api.get('/boards/popular').then(res => ({ ...res, data: res.data.resultData }))

// ── 내가 쓴 글 목록 조회
export const getMyPosts = ({ size = 3 } = {}) =>
  api.get('/boards/my', { params: { size } }).then(res => ({ ...res, data: res.data.resultData }))

// ── 게시글 등록
export const createPost = (payload) =>
  api.post('/boards', payload).then(res => ({ ...res, data: res.data.resultData }))

// ── 게시글 수정
export const updatePost = (id, payload) =>
  api.put(`/boards/${id}`, payload).then(res => ({ ...res, data: res.data.resultData }))

// ── 게시글 삭제
export const removePost = (id) =>
  api.delete(`/boards/${id}`).then(res => ({ ...res, data: res.data.resultData }))

// ── 좋아요 토글
export const toggleLike = (id) =>
  api.post(`/boards/${id}/like`).then(res => ({ ...res, data: res.data.resultData }))

// ── 이미지 업로드
export const uploadBoardImage = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/boards/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(res => ({ ...res, data: res.data.resultData }))
}

// ── 파일 업로드
export const uploadBoardFile = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/boards/file', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(res => ({ ...res, data: res.data.resultData }))
}

// ── 관리자 게시글 삭제
export const removePostByAdmin = (id) =>
  api.delete(`/admin/boards/${id}`).then(res => ({ ...res, data: res.data.resultData }))