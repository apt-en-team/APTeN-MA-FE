import api from '@/api/axios'

// 댓글 목록 조회
export const getComments = (boardId) => api.get(`/board/${boardId}/comments`)

// 댓글 등록
export const createComment = (boardId, data) => api.post(`/board/${boardId}/comments`, data)

// 댓글 삭제
export const deleteComment = (commentId) => api.delete(`/comment/${commentId}`)