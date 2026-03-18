<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/modules/auth'
import { useBoardStore } from '@/stores/modules/board'
import 'quill/dist/quill.snow.css'
import CommentItem from '@/components/board/CommentItem.vue'

const route      = useRoute()
const router     = useRouter()
const auth       = useAuthStore()
const boardStore = useBoardStore()

const post    = ref(null)
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const res = await import('@/api/board').then(m => m.getPostDetail(route.params.id))
    post.value = res.data
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

function goBack() {
  router.push('/admin/board')
}

async function editPost() {
  router.push(`/admin/boards/modify/${route.params.id}`)
}

async function deletePost() {
  if (!confirm('정말 삭제하시겠습니까?')) return
  await boardStore.deletePost(route.params.id)
  router.push('/admin/board')
}

const avatarColors = ['#4973E5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']
function getAvatarColor(name) {
  const idx = (name?.charCodeAt(0) ?? 0) % avatarColors.length
  return avatarColors[idx]
}

const comments = ref([]) // TODO: API 연동
const newComment = ref('')

function deleteComment(commentId) {
  // TODO: API 연동
  console.log('delete', commentId)
}
function editComment({ commentId, content }) {
  // TODO: API 연동
  console.log('edit', commentId, content)
}
</script>

<template>
  <div class="admin-board-detail">
    <div v-if="loading" class="loading">불러오는 중...</div>

    <div v-else-if="post" class="detail-layout">

      <!-- 메인 본문 -->
      <div class="detail-main">
        <div class="detail-card">

          <!-- 카테고리 + 제목 -->
          <span class="badge-category">{{ getCategoryLabel(post.category) }}</span>
          <h1 class="detail-title">{{ post.title }}</h1>

          <!-- 작성자 -->
          <div class="detail-meta">
            <div class="author-info">
              <div class="avatar" :style="{ background: getAvatarColor(post.authorName) }">
                {{ post.authorName?.[0] }}
              </div>
              <div class="author-detail">
                <span class="author-name">{{ post.authorName }}</span>
                <span class="author-unit">{{ post.authorUnit }} · {{ formatDate(post.createdAt) }}</span>
              </div>
            </div>
            <span class="view-count">조회 {{ post.viewCount }}</span>
          </div>

          <div class="divider" />

          <!-- 본문 -->
          <div class="detail-body ql-editor" v-html="post.content" />

          <!-- 댓글 -->
          <div class="comment-section">
            <p class="comment-title">
              댓글
              <span class="comment-badge">{{ comments.filter(c => c.isDeleted === 0).length }}</span>
            </p>

            <div class="comment-list">
              <div v-if="comments.length === 0" class="comment-empty">
                등록된 댓글이 없습니다.
              </div>
              <CommentItem
                v-for="comment in comments"
                :key="comment.commentId"
                :comment="comment"
                mode="admin"
                @delete="deleteComment"
                @edit="editComment"
              />
            </div>

            <!-- 댓글 입력 -->
            <div class="comment-input-wrap">
              <input v-model="newComment" class="comment-input" placeholder="관리자 댓글을 입력해주세요..." />
              <button class="comment-submit">등록</button>
            </div>
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
            <span class="info-value">{{ post.commentCount }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">작성일</span>
            <span class="info-value">{{ formatDate(post.createdAt) }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">삭제 여부</span>
            <span class="info-value">
              <span class="status-badge" :class="post.isDeleted ? 'status-deleted' : 'status-normal'">
                {{ post.isDeleted ? '삭제' : '정상 (0)' }}
              </span>
            </span>
          </div>
        </div>

        <!-- 관리 버튼 -->
        <div class="sidebar-card">
          <p class="sidebar-title">관리</p>
          <!-- 관리 버튼 -->
          <div class="manage-btns">
            <button class="btn-back" @click="goBack">목록으로 돌아가기</button>
            <!-- NOTICE일 때만 수정 버튼 표시 -->
            <button v-if="post.category === 'NOTICE'" class="btn-edit" @click="editPost">게시글 수정</button>
            <button class="btn-delete" @click="deletePost">게시글 삭제</button>
          </div>
        </div>

      </div>
    </div>
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

/* 메인 카드 */
.detail-card {
  background: #fff;
  border-radius: 10px;
  border: 1px solid #E2E8F0;
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.badge-category {
  display: inline-block;
  background: #EEF2FF; color: #4338CA;
  font-size: 11px; font-weight: 700;
  padding: 3px 8px; border-radius: 4px;
  width: fit-content;
}

.detail-title { font-size: 22px; font-weight: 700; color: #1A202C; line-height: 1.4; }

.detail-meta { display: flex; justify-content: space-between; align-items: center; }
.author-info { display: flex; align-items: center; gap: 10px; }
.avatar {
  width: 38px; height: 38px; border-radius: 50%;
  color: #fff; display: flex; align-items: center;
  justify-content: center; font-size: 15px; font-weight: 700; flex-shrink: 0;
}
.author-detail { display: flex; flex-direction: column; }
.author-name { font-size: 14px; font-weight: 600; color: #333; }
.author-unit { font-size: 12px; color: #999; }
.view-count { font-size: 12px; color: #999; }

.divider { height: 1px; background: #E2E8F0; }

.detail-body {
  font-size: 15px; line-height: 1.9;
  color: #444; min-height: 100px;
  /* quill 스타일 오버라이드 */
  border: none !important;
  padding: 0 !important;
}

/* 댓글 */
.comment-section { border-top: 1px solid #E2E8F0; padding-top: 20px; }
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

/* 댓글 입력 */
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
.comment-submit:hover { background: #1E2A3E; }

/* 사이드바 */
.sidebar-card {
  background: #fff;
  border-radius: 10px;
  border: 1px solid #E2E8F0;
  padding: 18px;
  margin-bottom: 16px;
}
.sidebar-title {
  font-size: 13px; font-weight: 700;
  color: #1A202C; margin-bottom: 12px;
}

/* 게시글 정보 */
.info-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 7px 0; border-bottom: 1px solid #F0F2F6;
  font-size: 12px;
}
.info-row:last-child { border-bottom: none; }
.info-label { color: #718096; }
.info-value { color: #1A202C; font-weight: 500; text-align: right; }

/* 상태 배지 */
.status-badge {
  font-size: 11px; font-weight: 600;
  padding: 2px 8px; border-radius: 99px;
}
.status-normal  { background: #C6F6D5; color: #276749; }
.status-deleted { background: #FED7D7; color: #9B2C2C; }

/* 관리 버튼 */
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

.comment-empty { font-size: 13px; color: #A0AEC0; text-align: center; padding: 10px 0; }
.loading { text-align: center; padding: 60px; color: #999; }
</style>