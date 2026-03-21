<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/modules/auth'
import { getPostDetail } from '@/api/board'
import { useBoardStore } from '@/stores/modules/board'
import 'quill/dist/quill.snow.css'
import CommentItem from '@/components/board/CommentItem.vue'
import BoardCard from '@/components/board/BoardCard.vue'
import BeseModel from '@/components/common/BeseModel.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import ActionResultModal from '@/components/common/ActionResultModal.vue'
import { useComment } from '@/composables/useComment'

const route  = useRoute()
const router = useRouter()
const auth   = useAuthStore()
const boardStore = useBoardStore()

const post    = ref(null)
const loading = ref(false)
const liked   = ref(false)

const showDeleteConfirm = ref(false)

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
    const res = await getPostDetail(route.params.id)
    post.value = res.data
    await fetchComments()
  } finally {
    loading.value = false
  }
})

// 내 글인지 확인
const isMyPost = computed(() => post.value?.userId === auth.user?.userId)

// 카테고리 라벨
function getCategoryLabel(category) {
  if (category === 'FREE')    return '자유'
  if (category === 'INQUIRY') return '문의'
  return category
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return dateStr.replace('T', ' ').slice(0, 16)
}

function goBack() {
  router.push('/resident/board')
}

function editPost() {
  router.push(`/resident/board/form?id=${route.params.id}`)
}

function deletePost() {
  showDeleteConfirm.value = true
}

async function confirmDeletePost() {
  showDeleteConfirm.value = false
  await boardStore.deletePost(route.params.id)
  router.push('/resident/board')
}

function toggleLike() {
  liked.value = !liked.value
  // TODO: 좋아요 API 연동
}

const avatarColors = ['#4973E5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']
function getAvatarColor(name) {
  const idx = (name?.charCodeAt(0) ?? 0) % avatarColors.length
  return avatarColors[idx]
}
</script>

<template>
  <div class="board-detail">
    <div v-if="loading" class="loading">불러오는 중...</div>

    <div v-else-if="post" class="detail-layout">

      <!-- 메인 본문 -->
      <div class="detail-main">
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
            <span class="badge-category">{{ getCategoryLabel(post.category) }}</span>
          </template>
        </BoardCard>
      </div>

      <!-- 우측 사이드바 -->
      <div class="detail-sidebar">

        <!-- 메뉴 -->
        <div class="sidebar-card">
          <p class="sidebar-title">메뉴</p>
          <div class="menu-btns">
            <button class="btn-menu" @click="goBack">목록으로 돌아가기</button>

            <!-- 내 글일 때 -->
            <template v-if="isMyPost">
              <button class="btn-menu" @click="editPost">글 수정하기</button>
              <button class="btn-menu danger" @click="deletePost">글 삭제하기</button>
            </template>

            <!-- 남의 글일 때 -->
            <button v-else class="btn-like" :class="{ liked }" @click="toggleLike">
              <!-- 클릭 후: solid red -->
              <svg v-if="liked" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z"/>
              </svg>
              <!-- 클릭 전: outline grey, 호버: red -->
              <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="16" height="16">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"/>
              </svg>
              {{ liked ? '좋아요 취소' : '좋아요' }}
            </button>
          </div>
        </div>

        <!-- 댓글 -->
        <div class="sidebar-card">
          <p class="sidebar-title">
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
                :comment="{ ...comment, isPostAuthor: comment.userId === post.userId }"
                mode="resident"
                :current-user-id="auth.user?.userId"
                @delete="removeComment"
                @edit="editComment"
              />
            </template>
            <div v-else class="no-comments">등록된 댓글이 없습니다.</div>
          </div>

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

  <ConfirmModal
    v-if="showDeleteConfirm"
    title="게시글을 삭제하시겠습니까?"
    subtitle="이 작업은 되돌릴 수 없습니다."
    confirm-text="삭제"
    type="danger"
    @close="showDeleteConfirm = false"
    @confirm="confirmDeletePost"
  />

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
.board-detail { width: 100%; }

.detail-layout {
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 24px;
  align-items: start;
}

/* 메인 카드 */
.detail-card {
  background: #fff;
  border-radius: 16px;
  border: 1px solid #E8EBF0;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.badge-category {
  display: inline-block;
  background: #f3f4f6; color: #555;
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
  color: #444;
  min-height: 100px;
}

/* 사이드바 */
.sidebar-card {
  background: #fff;
  border-radius: 16px;
  border: 1px solid #E8EBF0;
  padding: 16px;
  margin-bottom: 16px;
}

.sidebar-title {
  font-size: 14px; font-weight: 700;
  color: #1A1A2E; margin-bottom: 12px;
  display: flex; align-items: center; gap: 6px;
}

.comment-badge {
  background: #4973E5; color: #fff;
  font-size: 11px; font-weight: 700;
  padding: 1px 7px; border-radius: 99px;
}

/* 메뉴 버튼들 */
.menu-btns { display: flex; flex-direction: column; gap: 8px; }
.btn-menu {
  width: 100%; padding: 10px;
  border: 1px solid #E0E3EB; border-radius: 8px;
  background: #fff; font-size: 13px; color: #555;
  cursor: pointer; transition: background 0.15s;
}
.btn-menu:hover { background: #F5F6FA; }
.btn-menu.danger {
  border-color: #fecaca; color: #dc2626;
}
.btn-menu.danger:hover { background: #fee2e2; }

/* 좋아요 버튼 */
.btn-like {
  width: 100%; padding: 10px;
  border: 1px solid #E0E3EB; border-radius: 8px;
  background: #fff; font-size: 13px; color: #9ca3af;
  cursor: pointer; transition: all 0.15s;
  display: flex; align-items: center; justify-content: center; gap: 6px;
}
.btn-like:hover { background: #fee2e2; border-color: #fecaca; color: #ef4444; }
.btn-like.liked { background: #fee2e2; border-color: #fecaca; color: #ef4444; }

/* 댓글 */
.comment-list {
  display: flex; flex-direction: column; gap: 10px;
  margin-bottom: 12px; max-height: 400px; overflow-y: auto;
  scrollbar-width: none;
}
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