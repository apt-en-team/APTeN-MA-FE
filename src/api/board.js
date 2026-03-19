import api from './axios'

// ── 게시글 목록 조회 ─────────────────────────────────────────
// GET /api/boards?category=FREE&page=1&size=10&keyword=검색어
export const getPostList = ({ category = 'FREE', page = 1, size = 10, keyword = '' } = {}) => {
  const params = { category, page, size }
  if (keyword) params.keyword = keyword   // 키워드 있을 때만 추가
  return api.get('/boards', { params })
}

// ── 게시글 상세 조회 ─────────────────────────────────────────
export const getPostDetail = (id) =>
  api.get(`/boards/${id}`)

// ── 인기글 목록 조회 ─────────────────────────────────────────
export const getPopularPosts = () =>
  api.get('/boards/popular')

// ── 내가 쓴 글 목록 조회 ────────────────────────────────────
export const getMyPosts = ({ size = 3 } = {}) =>
  api.get('/boards/my', { params: { size } })

// ── 게시글 등록 ──────────────────────────────────────────────
export const createPost = (payload) =>
  api.post('/boards', payload)

// ── 게시글 수정 ──────────────────────────────────────────────
export const updatePost = (id, payload) =>
  api.put(`/boards/${id}`, payload)

// ── 게시글 삭제 ──────────────────────────────────────────────
export const removePost = (id) =>
  api.delete(`/boards/${id}`)

// ── 좋아요 토글 ──────────────────────────────────────────────
export const toggleLike = (id) =>
  api.post(`/boards/${id}/like`)

// ── 이미지 업로드 ────────────────────────────────────────────
export const uploadBoardImage = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/boards/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}