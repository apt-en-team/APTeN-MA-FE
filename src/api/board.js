import api from './axios'

// ── 게시글 목록 조회 ─────────────────────────────────────────
// GET /api/board?type=free&page=1&size=10
export const getPostList = ({ type = 'FREE', page = 1, size = 10 } = {}) =>
  api.get('/board', { params: { type, page, size } })

// ── 게시글 상세 조회 ─────────────────────────────────────────
// GET /api/board/:id
export const getPostDetail = (id) =>
  api.get(`/board/${id}`)

// ── 인기글 목록 조회 (좋아요 상위 5개) ──────────────────────
// GET /api/board/popular
export const getPopularPosts = () =>
  api.get('/board/popular')

// ── 내가 쓴 글 목록 조회 ────────────────────────────────────
// GET /api/board/my?type=free&page=1&size=10
export const getMyPosts = ({ size = 3 } = {}) =>
  api.get('/board/my', { params: { size } })

// ── 게시글 등록 ──────────────────────────────────────────────
// POST /api/board
export const createPost = (payload) =>
  api.post('/board', payload)

// ── 게시글 수정 ──────────────────────────────────────────────
// PUT /api/board/:id
export const updatePost = (id, payload) =>
  api.put(`/board/${id}`, payload)

// ── 게시글 삭제 ──────────────────────────────────────────────
// DELETE /api/board/:id
export const removePost = (id) =>
  api.delete(`/board/${id}`)

// ── 좋아요 토글 ──────────────────────────────────────────────
// POST /api/board/:id/like
export const toggleLike = (id) =>
  api.post(`/board/${id}/like`)