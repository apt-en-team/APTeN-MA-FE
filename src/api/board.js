import api from './axios'

// ── 게시글 목록 조회 ─────────────────────────────────────────
// GET /api/boards?category=free&page=1&size=10
export const getPostList = ({ category = 'FREE', page = 1, size = 10 } = {}) =>
  api.get('/boards', { params: { category, page, size } })

// ── 게시글 상세 조회 ─────────────────────────────────────────
// GET /api/boards/:id
export const getPostDetail = (id) =>
  api.get(`/boards/${id}`)

// ── 인기글 목록 조회 (좋아요 상위 5개) ──────────────────────
// GET /api/boards/popular
export const getPopularPosts = () =>
  api.get('/boards/popular')

// ── 내가 쓴 글 목록 조회 ────────────────────────────────────
// GET /api/boards/my?category=free&page=1&size=10
export const getMyPosts = ({ size = 3 } = {}) =>
  api.get('/boards/my', { params: { size } })

// ── 게시글 등록 ──────────────────────────────────────────────
// POST /api/boards
export const createPost = (payload) =>
  api.post('/boards', payload)

// ── 게시글 수정 ──────────────────────────────────────────────
// PUT /api/boards/:id
export const updatePost = (id, payload) =>
  api.put(`/boards/${id}`, payload)

// ── 게시글 삭제 ──────────────────────────────────────────────
// DELETE /api/boards/:id
export const removePost = (id) =>
  api.delete(`/boards/${id}`)

// ── 좋아요 토글 ──────────────────────────────────────────────
// POST /api/boards/:id/like
export const toggleLike = (id) =>
  api.post(`/boards/${id}/like`)

// ── 이미지 업로드 ────────────────────────────────────────────
// POST /api/boards/image
// Content-Type: multipart/form-data
// 글 등록/수정 전에 먼저 이미지를 올리고 imageUrl을 받아온 뒤 createPost/updatePost에 포함
/* export const uploadBoardImage = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/boards/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
} */