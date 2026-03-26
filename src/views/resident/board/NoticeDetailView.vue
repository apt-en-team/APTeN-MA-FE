<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPostDetail } from '@/api/board'
import { useAuthStore } from '@/stores/modules/auth'
import { useComment } from '@/composables/useComment'
import CommentItem from '@/components/board/CommentItem.vue'
import BoardCard from '@/components/board/BoardCard.vue'
import BeseModel from '@/components/common/BeseModel.vue'
import ActionResultModal from '@/components/common/ActionResultModal.vue'

const route  = useRoute()
const router = useRouter()
const auth   = useAuthStore()

const notice  = ref(null)
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const res = await getPostDetail(route.params.id)
    notice.value = res.data
    await fetchComments()
  } finally {
    loading.value = false
  }
})

function goBack() {
  router.push('/resident/board/notice')
}


// 댓글
const {
  comments,
  newComment,
  isSubmitting,
  modalState,
  closeModal,
  fetchComments,
  submitComment,
  editComment,
  removeComment,
} = useComment(route.params.id)

</script>

<template>
  <div class="notice-detail">
    <div v-if="loading" class="loading">불러오는 중...</div>

    <div v-else-if="notice" class="detail-layout">

      <!-- 메인 본문 -->
      <div class="detail-main">
        <BoardCard
          :title="notice.title"
          :content="notice.content"
          :author-name="notice.authorName"
          :created-at="notice.createdAt"
          :view-count="notice.viewCount"
        >
          <template #badge>
            <span class="badge-gong">공지</span>
          </template>
          <template #author-extra>
            <span class="badge-admin">관리자</span>
          </template>
        </BoardCard>
      </div>

      <!-- 우측 사이드바 -->
      <div class="detail-sidebar">

        <!-- 메뉴 -->
        <div class="sidebar-card">
          <p class="sidebar-title">메뉴</p>
          <button class="btn-back" @click="goBack">목록으로 돌아가기</button>
        </div>

        <div class="sidebar-card">
          <p class="sidebar-title">
            댓글
            <!-- 댓글 수 -->
            <span class="comment-badge">
              {{ comments.filter(c => c.isDeleted !== 1).length }}
            </span>
          </p>

          <!-- 댓글 목록 -->
          <div class="comment-list">
            <template v-if="comments.length > 0">
              <CommentItem
                v-for="comment in comments"
                :key="comment.commentId"
                :comment="comment"
                mode="resident"
                :current-user-id="auth.user?.userId"
                @delete="removeComment"
                @edit="editComment"
              />
            </template>

            <!-- 댓글 없음 -->
            <div v-else class="no-comments">등록된 댓글이 없습니다.</div>
          </div>
          
          <!-- 댓글 입력 -->
          <div class="comment-input-wrap">
            <input
              v-model="newComment"
              class="comment-input"
              placeholder="댓글을 입력해주세요..."
              @keyup.enter="submitComment"
            />
            <button class="comment-submit" :disabled="isSubmitting" @click="submitComment">
              등록
            </button>
          </div>
        </div>

      </div>
    </div>
  </div>

  <BeseModel
    v-if="modalState.visible && modalState.type === 'confirm'"
    title="댓글 삭제"
    @close="closeModal"
  >
    <p style="font-size:14px; color:#444;">댓글을 삭제하시겠습니까?</p>
    <template #footer>
      <button class="modal-btn-cancel" @click="closeModal">취소</button>
      <button class="modal-btn-confirm" @click="() => { modalState.onConfirm?.(); closeModal() }">삭제</button>
    </template>
  </BeseModel>
  <ActionResultModal
    v-if="modalState.visible && modalState.type === 'alert'"
    :title="modalState.title"
    :desc="modalState.message"
    type="warning"
    @close="closeModal"
  />

</template>

<style scoped>
.notice-detail { width: 100%; }

.detail-layout {
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 24px;
  align-items: start;
}

.detail-card {
  background: #fff;
  border-radius: 16px;
  border: 1px solid #E8EBF0;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.badge-gong {
  display: inline-block;
  background: #4973E5; color: #fff;
  font-size: 11px; font-weight: 700;
  padding: 3px 8px; border-radius: 4px;
  width: fit-content;
}

.detail-title { font-size: 22px; font-weight: 700; color: #1A1A2E; line-height: 1.4; margin: 6px 0; }

.detail-meta { display: flex; justify-content: space-between; align-items: center; }
.author-info { display: flex; align-items: center; gap: 10px; }
.avatar {
  width: 38px; height: 38px; border-radius: 50%;
  color: #fff; display: flex; align-items: center;
  justify-content: center; font-size: 15px;
  font-weight: 700; flex-shrink: 0;
}
.author-name-wrap { display: flex; align-items: center; gap: 6px; }
.author-name { font-size: 14px; font-weight: 600; color: #333; }
.badge-admin {
  font-size: 10px; font-weight: 700;
  background: #4973E5; color: #fff;
  padding: 2px 6px; border-radius: 4px;
}
.author-sub {
  display: flex;
  align-items: center;
  color: #999;
  font-size: 12px;
  white-space: nowrap;
}
.author-unit { font-size: 12px; color: #999; }
.view-count { font-size: 12px; color: #999; }

.divider { height: 1px; background: #E8EBF0; }

.detail-body {
  font-size: 15px; line-height: 1.9;
  color: #444; white-space: pre-wrap;
  min-height: 100px;
}

.sidebar-card {
  background: #fff;
  border-radius: 16px;
  border: 1px solid #E8EBF0;
  padding: 16px;
  margin-bottom: 16px;
}

.sidebar-title {
  font-size: 14px; font-weight: 700;
  color: #1A1A2E; margin-top: 0px; margin-bottom: 12px;
  display: flex; align-items: center; gap: 6px;
}

.comment-badge {
  background: #4973E5; color: #fff;
  font-size: 11px; font-weight: 700;
  padding: 1px 7px; border-radius: 99px;
}

.btn-back {
  width: 100%; padding: 10px;
  border: 1px solid #E0E3EB; border-radius: 8px;
  background: #fff; font-size: 13px; color: #555;
  cursor: pointer; transition: background 0.15s;
}
.btn-back:hover { background: #F5F6FA; }

/* 댓글 목록 */
.comment-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 12px; max-height: 400px; overflow-y: auto; scrollbar-width: none; }
.comment-list::-webkit-scrollbar { display: none; }
.no-comments {
  text-align: center;
  padding: 32px 0;
  color: #9ca3af;
  font-size: 13px;
}

/* 댓글 입력 */
.comment-input-wrap { display: flex; gap: 8px; margin-top: 4px; width: 100%; }
.comment-input {
  flex: 1; min-width: 0; padding: 9px 12px;
  border: 1px solid #E0E3EB; border-radius: 8px;
  font-size: 13px; outline: none;
}
.comment-input:focus { border-color: #4973E5; }
.comment-submit {
  padding: 9px 16px; background: #4973E5;
  color: #fff; border: none; border-radius: 8px;
  font-size: 13px; font-weight: 600; cursor: pointer;
  white-space: nowrap; flex-shrink: 0;
}
.comment-submit:hover { background: #3860CC; }

.loading { text-align: center; padding: 60px; color: #999; }
</style>