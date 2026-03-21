import { ref } from 'vue'
import { getComments, createComment, updateComment, deleteComment } from '@/api/comment'

/* useComment.js
  댓글 등록/수정/삭제 공통 컴포저블
*/

export function useComment(boardId) {
  const comments     = ref([])
  const newComment   = ref('')
  const isSubmitting = ref(false)

  // ── 모달 상태 ────────────────────────────────────────────────
  const modalState = ref({
    visible:   false,
    title:     '',
    message:   '',
    type:      'alert',   // 'alert' | 'confirm'
    onConfirm: null,
  })

  function showAlert(title, message) {
    modalState.value = { visible: true, title, message, type: 'alert', onConfirm: null }
  }

  function showConfirm(title, message, onConfirm) {
    modalState.value = { visible: true, title, message, type: 'confirm', onConfirm }
  }

  function closeModal() {
    modalState.value = { ...modalState.value, visible: false, onConfirm: null }
  }

  // ── 댓글 목록 조회 ───────────────────────────────────────────
  async function fetchComments() {
    const res = await getComments(boardId)
    comments.value = res.data
  }

  // ── 댓글 등록 ────────────────────────────────────────────────
  async function submitComment() {
    const content = newComment.value.trim()
    if (!content) {
      showAlert('알림', '댓글 내용을 입력해주세요.')
      return
    }
    if (isSubmitting.value) return

    isSubmitting.value = true
    try {
      await createComment(boardId, { content })
      newComment.value = ''
      await fetchComments()
    } catch {
      showAlert('오류', '댓글 등록에 실패했습니다.')
    } finally {
      isSubmitting.value = false
    }
  }

  // ── 댓글 수정 ────────────────────────────────────────────────
  async function editComment({ commentId, content }) {
    if (!content.trim()) {
      showAlert('알림', '댓글 내용을 입력해주세요.')
      return
    }
    try {
      await updateComment(commentId, { content })
      await fetchComments()
    } catch {
      showAlert('오류', '댓글 수정에 실패했습니다.')
    }
  }

  // ── 댓글 삭제 ────────────────────────────────────────────────
  function removeComment(commentId) {
    showConfirm(
      '댓글 삭제',
      '댓글을 삭제하시겠습니까?',
      async () => {
        try {
          await deleteComment(commentId)
          await fetchComments()
        } catch {
          showAlert('오류', '댓글 삭제에 실패했습니다.')
        }
      }
    )
  }

  return {
    comments,
    newComment,
    isSubmitting,
    modalState,
    closeModal,
    fetchComments,
    submitComment,
    editComment,
    removeComment,
  }
}