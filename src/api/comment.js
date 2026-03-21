import api from './axios'

// 댓글 목록 조회
export const getComments = (boardId) =>
  api.get(`/boards/${boardId}/comments`).then(res => ({ ...res, data: res.data.resultData }))

// 댓글 등록
export const createComment = (boardId, payload) =>
  api.post(`/boards/${boardId}/comments`, payload).then(res => ({ ...res, data: res.data.resultData }))

// 댓글 수정
export const updateComment = (commentId, payload) =>
  api.put(`/comments/${commentId}`, payload).then(res => ({ ...res, data: res.data.resultData }))

// 댓글 삭제
export const deleteComment = (commentId) =>
  api.delete(`/comments/${commentId}`).then(res => ({ ...res, data: res.data.resultData }))