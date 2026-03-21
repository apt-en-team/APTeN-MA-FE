<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/modules/auth'
import { useBoardStore } from '@/stores/modules/board'
import { getAdminPostDetail } from '@/api/board'
import 'quill/dist/quill.snow.css'
import CommentItem from '@/components/board/CommentItem.vue'
import BoardCard from '@/components/board/BoardCard.vue'
import BaseModal from '@/components/common/BeseModel.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import { useComment } from '@/composables/useComment'

const route      = useRoute()
const router     = useRouter()
const auth       = useAuthStore()
const boardStore = useBoardStore()

// confirm() 대신 모달 상태
const showDeleteConfirm = ref(false)

const post    = ref(null)
const loading = ref(false)

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

onMounted(async () => {
  loading.value = true
  try {
    const res = await getAdminPostDetail(route.params.id)
    post.value = res.data
    await fetchComments()
  } finally {
    loading.value = false
  }
})

function formatDate(dateStr) {
  if (!dateStr) return ''
  return dateStr.replace('T', ' ').slice(0, 16)
}

function getCategoryLabel(category) {
  if (category === 'FREE')    return '자유게시판'
  if (category === 'NOTICE')  return '공지사항'
  if (category === 'INQUIRY') return '문의'
  return category
}

function goBack()  { router.push('/admin/board') }
function editPost() { router.push(`/admin/boards/modify/${route.params.id}`) }

// 버튼 클릭 시 모달 열기
function openDeleteConfirm() {
  showDeleteConfirm.value = true
}

// 실제 삭제 처리
async function deletePost() {
  showDeleteConfirm.value = false
  await boardStore.deletePostByAdmin(route.params.id)
  router.push('/admin/board')
}

</script>

<template>
  <div class="admin-board-detail">
    <div v-if="loading" class="loading">불러오는 중...</div>

    <div v-else-if="post" class="detail-layout">

      <!-- 메인 본문 -->
      <div class="detail-main">

        <!-- 게시글 카드 -->
        <BoardCard
          :title="post.title"
          :content="post.content"
          :author-name="post.authorName"
          :author-unit="post.authorUnit"
          :created-at="post.createdAt"
          :view-count="post.viewCount"
          :image-url="post.imageUrl"
        >
          <template #badge>
            <span v-if="post.category === 'NOTICE'" class="badge-gong">공지</span>
            <span v-else class="badge-category">{{ getCategoryLabel(post.category) }}</span>
          </template>
          <template #author-extra>
            <span v-if="post.category === 'NOTICE'" class="badge-admin-label">관리자</span>
          </template>
        </BoardCard>

        <!-- 댓글 카드 -->
        <div class="comment-card">
          <p class="comment-title">
            댓글
            <span class="comment-badge">
              {{ comments.filter(c => c.isDeleted !== 1).length }}
            </span>
          </p>

          <div class="comment-list">
            <template v-if="comments.length > 0">
              <CommentItem
                v-for="comment in comments"
                :key="comment.commentId"
                :comment="comment"
                mode="admin"
                :current-user-id="auth.user?.userId"
                @delete="removeComment"
                @edit="editComment"
              />
            </template>
            <div v-else class="comment-empty">등록된 댓글이 없습니다.</div>
          </div>

          <div class="comment-input-wrap">
            <input
              v-model="newComment"
              class="comment-input"
              placeholder="관리자 댓글을 입력해주세요..."
              @keyup.enter="submitComment"
            />
            <button
              class="comment-submit"
              :disabled="isSubmitting"
              @click="submitComment"
            >
              등록
            </button>
          </div>
        </div>

      </div>

      <!-- 우측 사이드바 -->
      <div class="detail-sidebar">

        <!-- 게시글 정보 -->
        <div class="sidebar-card">
          <p class="sidebar-title">게시글 정보</p>
          <div class="info-row">
            <span class="info-label">게시글 ID</span>
            <span class="info-value">#{{ post.boardId }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">카테고리</span>
            <span class="info-value">{{ getCategoryLabel(post.category) }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">작성자</span>
            <span class="info-value">{{ post.authorName }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">소속 세대</span>
            <span class="info-value">{{ post.authorUnit ?? '-' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">조회수</span>
            <span class="info-value">{{ post.viewCount }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">댓글 수</span>
            <span class="info-value">{{ comments.filter(c => c.isDeleted !== 1).length }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">작성일</span>
            <span class="info-value">{{ formatDate(post.createdAt) }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">삭제 여부</span>
            <span class="info-value">
              <span class="status-badge" :class="post.isDeleted ? 'status-deleted' : 'status-normal'">
                {{ post.isDeleted ? '삭제' : '정상' }}
              </span>
            </span>
          </div>
        </div>

        <!-- 관리 버튼 -->
        <div class="sidebar-card">
          <p class="sidebar-title">관리</p>
          <div class="manage-btns">
            <button class="btn-back" @click="goBack">목록으로 돌아가기</button>
            <button v-if="post.category === 'NOTICE'" class="btn-edit" @click="editPost">게시글 수정</button>
            <button class="btn-delete" @click="openDeleteConfirm">게시글 삭제</button>
          </div>
        </div>

      </div>
    </div>
    <!-- 게시글 삭제 확인 모달 -->
    <ConfirmModal
      v-if="showDeleteConfirm"
      title="게시글을 삭제하시겠습니까?"
      subtitle="이 작업은 되돌릴 수 없습니다."
      warn-text="삭제 시 해당 게시글의 댓글도 함께 삭제됩니다."
      confirm-text="삭제"
      type="danger"
      @close="showDeleteConfirm = false"
      @confirm="deletePost"
    >
      <div style="font-weight:600">{{ post?.title }}</div>
      <div style="font-size:12px; color:#999; margin-top:4px">
        {{ getCategoryLabel(post?.category) }} · {{ post?.authorName }}
      </div>
    </ConfirmModal>

    <!-- 댓글 공통 모달 -->
    <BaseModal
      v-if="modalState.visible"
      :title="modalState.title"
      @close="closeModal"
    >
      <p style="font-size:14px; color:#444;">{{ modalState.message }}</p>
      <template #footer>
        <template v-if="modalState.type === 'confirm'">
          <button class="modal-btn-cancel" @click="closeModal">취소</button>
          <button class="modal-btn-confirm" @click="() => { modalState.onConfirm?.(); closeModal() }">확인</button>
        </template>
        <template v-else>
          <button class="modal-btn-confirm" @click="closeModal">확인</button>
        </template>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
.admin-board-detail { width: 100%; }

.detail-layout {
  display: grid;
  grid-template-columns: 1fr 260px;
  gap: 24px;
  align-items: start;
}

.detail-main { display: flex; flex-direction: column; gap: 16px; }

/* 배지 */
.badge-gong {
  display: inline-block;
  background: #4973E5; color: #fff;
  font-size: 11px; font-weight: 700;
  padding: 3px 8px; border-radius: 4px; width: fit-content;
}
.badge-category {
  display: inline-block;
  background: #EEF2FF; color: #4338CA;
  font-size: 11px; font-weight: 700;
  padding: 3px 8px; border-radius: 4px; width: fit-content;
}
.badge-admin-label {
  font-size: 10px; font-weight: 700;
  background: #4973E5; color: #fff;
  padding: 2px 6px; border-radius: 4px;
}

/* 댓글 카드 */
.comment-card {
  background: #fff;
  border-radius: 10px;
  border: 1px solid #E2E8F0;
  padding: 24px;
}
.comment-title {
  font-size: 14px; font-weight: 700; color: #1A202C;
  margin-bottom: 14px;
  display: flex; align-items: center; gap: 6px;
}
.comment-badge {
  background: #2B3A55; color: #fff;
  font-size: 11px; font-weight: 700;
  padding: 1px 7px; border-radius: 99px;
}
.comment-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 14px; }
.comment-empty { font-size: 13px; color: #A0AEC0; text-align: center; padding: 10px 0; }
.comment-input-wrap { display: flex; gap: 8px; }
.comment-input {
  flex: 1; padding: 9px 12px;
  border: 1px solid #E2E8F0; border-radius: 8px;
  font-size: 13px; outline: none;
  font-family: 'Noto Sans KR', sans-serif;
}
.comment-input:focus { border-color: #2B3A55; }
.comment-submit {
  padding: 9px 18px; background: #2B3A55;
  color: #fff; border: none; border-radius: 8px;
  font-size: 13px; font-weight: 600; cursor: pointer;
  font-family: 'Noto Sans KR', sans-serif;
}
.comment-submit:hover:not(:disabled) { background: #1E2A3E; }
.comment-submit:disabled { opacity: 0.6; cursor: not-allowed; }

/* 사이드바 */
.sidebar-card {
  background: #fff; border-radius: 10px;
  border: 1px solid #E2E8F0; padding: 18px;
  margin-bottom: 16px;
}
.sidebar-title { font-size: 13px; font-weight: 700; color: #1A202C; margin-bottom: 12px; }

.info-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 7px 0; border-bottom: 1px solid #F0F2F6; font-size: 12px;
}
.info-row:last-child { border-bottom: none; }
.info-label { color: #718096; }
.info-value { color: #1A202C; font-weight: 500; text-align: right; }

.status-badge { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 99px; }
.status-normal  { background: #C6F6D5; color: #276749; }
.status-deleted { background: #FED7D7; color: #9B2C2C; }

.manage-btns { display: flex; flex-direction: column; gap: 8px; }
.btn-back {
  width: 100%; padding: 10px;
  border: 1px solid #E2E8F0; border-radius: 8px;
  background: #fff; font-size: 13px; color: #555;
  cursor: pointer; transition: background 0.15s;
  font-family: 'Noto Sans KR', sans-serif;
}
.btn-back:hover { background: #F5F6F8; }
.btn-edit {
  width: 100%; padding: 10px;
  border: none; border-radius: 8px;
  background: #2B3A55; color: #fff;
  font-size: 13px; font-weight: 600;
  cursor: pointer; transition: background 0.15s;
  font-family: 'Noto Sans KR', sans-serif;
}
.btn-edit:hover { background: #1E2A3E; }
.btn-delete {
  width: 100%; padding: 10px;
  border: 1px solid #FEB2B2; border-radius: 8px;
  background: #fff; color: #E53E3E;
  font-size: 13px; font-weight: 600;
  cursor: pointer; transition: background 0.15s;
  font-family: 'Noto Sans KR', sans-serif;
}
.btn-delete:hover { background: #FFF5F5; }

.modal-btn-cancel {
  padding: 8px 20px;
  border: 1px solid #E2E8F0; border-radius: 8px;
  background: #fff; color: #718096;
  font-size: 13px; cursor: pointer;
}
.modal-btn-cancel:hover { background: #F5F6F8; }
.modal-btn-confirm {
  padding: 8px 20px;
  border: none; border-radius: 8px;
  background: #2B3A55; color: #fff;
  font-size: 13px; font-weight: 600; cursor: pointer;
}
.modal-btn-confirm:hover { background: #1E2A3E; }

.loading { text-align: center; padding: 60px; color: #999; }
</style>