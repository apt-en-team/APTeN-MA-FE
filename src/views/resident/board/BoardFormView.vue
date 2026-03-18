<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/modules/auth'
import { useBoardStore } from '@/stores/modules/board'
import { getPostDetail } from '@/api/board'
import BoardEditor from '@/components/board/BoardEditor.vue'

const route  = useRoute()
const router = useRouter()
const auth   = useAuthStore()
const boardStore = useBoardStore()

// ─── 작성 vs 수정 모드 ────────────────────────────────────────
const isEdit = computed(() => !!route.query.id)
const postId = computed(() => route.query.id ? Number(route.query.id) : null)

// ─── 폼 데이터 ────────────────────────────────────────────────
const category = ref('FREE')
const title    = ref('')
const content  = ref('')
const createdAt = ref(null)

// ─── 권한 체크 ────────────────────────────────────────────────
const isOwner = ref(false)

onMounted(async () => {
  if (isEdit.value && postId.value) {
    try {
      const res = await getPostDetail(postId.value)
      const post = res.data

      if (post.userId !== auth.user?.userId) {
        alert('수정 권한이 없습니다.')
        router.replace('/resident/board')
        return
      }

      isOwner.value   = true
      category.value  = post.category  // 수정 시엔 기존 카테고리
      title.value     = post.title
      content.value   = post.content
      createdAt.value = post.createdAt
    } catch {
      alert('게시글을 불러올 수 없습니다.')
      router.replace('/resident/board')
    }
  } else {
    // 작성 모드일 때만 쿼리 카테고리 반영
    if (route.query.category) {
      category.value = route.query.category
    }
  }
})

// ─── 등록 / 수정 완료 ─────────────────────────────────────────
async function handleSubmit() {
  if (!title.value.trim())   return alert('제목을 입력해주세요.')
  if (!content.value.trim()) return alert('내용을 입력해주세요.')

  try {
    if (isEdit.value) {
      await boardStore.updatePost(postId.value, { category: category.value, title: title.value, content: content.value })
      router.push(`/resident/board/${postId.value}`)
    } else {
      await boardStore.createPost({ category: category.value, title: title.value, content: content.value })
      router.push('/resident/board')
    }
  } catch {
    alert('처리 중 오류가 발생했습니다.')
  }
}

// ─── 삭제 ─────────────────────────────────────────────────────
async function handleDelete() {
  if (!confirm('정말 삭제하시겠습니까?')) return
  try {
    await boardStore.deletePost(postId.value)
    router.push('/resident/board')
  } catch {
    alert('삭제 중 오류가 발생했습니다.')
  }
}

// ─── 취소 ─────────────────────────────────────────────────────
function handleCancel() {
  if (isEdit.value) {
    router.push(`/resident/board/${postId.value}`)
  } else {
    router.push('/resident/board')
  }
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return dateStr.replace('T', ' ').slice(0, 16)
}

const avatarColors = ['#4973E5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']
function getAvatarColor(name) {
  const idx = (name?.charCodeAt(0) ?? 0) % avatarColors.length
  return avatarColors[idx]
}
</script>

<template>
  <div class="board-form">
    <div class="form-layout">

      <!-- 메인 폼 -->
      <div class="form-main">
        <div class="form-card">
          <h2 class="form-card-title">내 게시글 작성</h2>

          <!-- 카테고리 -->
          <div class="form-group">
            <label class="form-label">카테고리</label>
            <div class="category-btns">
              <button
                class="category-btn"
                :class="{ active: category === 'FREE' }"
                @click="category = 'FREE'"
              >자유</button>
              <button
                class="category-btn"
                :class="{ active: category === 'INQUIRY' }"
                @click="category = 'INQUIRY'"
              >문의사항</button>
            </div>
          </div>

          <!-- 제목 -->
          <div class="form-group">
            <label class="form-label">제목 <span class="required">*</span></label>
            <input
              v-model="title"
              class="form-input"
              placeholder="제목을 입력해주세요."
              maxlength="100"
            />
          </div>

          <!-- 내용 -->
          <div class="form-group">
            <label class="form-label">내용 <span class="required">*</span></label>
            <BoardEditor v-model="content" />
            <div class="char-count">{{ content.length }} / 5000자</div>
          </div>

          <!-- 수정 이력 -->
          <div class="edit-history">
            <p class="edit-history-title">수정 이력</p>
            <div class="edit-history-item">
              <span class="edit-dot"/>
              <span class="edit-date">{{ formatDate(createdAt) || '─' }}</span>
              <span class="edit-label">최초 작성</span>
            </div>
          </div>

          <!-- 하단 버튼 -->
          <div class="form-actions">
            <button v-if="isEdit" class="btn-delete" @click="handleDelete">삭제</button>
            <div class="form-actions-right">
              <button class="btn-cancel" @click="handleCancel">취소</button>
              <button class="btn-submit" @click="handleSubmit">
                {{ isEdit ? '수정 완료' : '등록' }}
              </button>
            </div>
          </div>

        </div>
      </div>

      <!-- 우측 사이드바 -->
      <div class="form-sidebar">

        <!-- 발행 설정 -->
        <div class="sidebar-card">
          <p class="sidebar-title">발행 설정</p>
          <div class="author-box">
            <div class="author-info">
              <div class="avatar" :style="{ background: getAvatarColor(auth.user?.name) }">
                {{ auth.user?.name?.[0] }}
              </div>
              <div class="author-detail">
                <span class="author-name">{{ auth.user?.name }}</span>
                <span class="author-unit">{{ auth.user?.unit }}</span>
              </div>
            </div>
          </div>
          <div class="meta-row">
            <span class="meta-label">최초 작성일</span>
            <span class="meta-value">{{ formatDate(createdAt) || '─' }}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">수정일</span>
            <span class="meta-value">수정 시 자동 업데이트</span>
          </div>
        </div>

        <!-- 주의사항 -->
        <div class="sidebar-card">
          <p class="sidebar-title">{{ isEdit ? '수정 주의사항' : '작성 주의사항' }}</p>
          <ul class="notice-list">
            <template v-if="isEdit">
              <li>수정 후 즉시 반영됩니다.</li>
              <li>수정 된 내용이 자동 업데이트됩니다.</li>
              <li>댓글은 수정 시 영향 없습니다.</li>
              <li>삭제는 목록 페이지에서도 가능합니다.</li>
            </template>
            <template v-else>
              <li>카테고리를 확인해 주세요.</li>
              <li>타인을 비방하는 게시물, 유해한 게시물은 삭제될 수 있습니다.</li>
              <li>같은 내용의 글을 여러 번 게시하는 경우 글 등록이 제한됩니다.</li>
              <li>삭제는 '내가 쓴 글'에서 가능합니다.</li>
            </template>
          </ul>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.board-form { width: 100%; font-family: 'Noto  KR'; }

.form-layout {
  display: grid;
  grid-template-columns: 1fr 268px;
  gap: 24px;
  align-items: start;
}

/* 메인 카드 */
.form-card {
  background: #fff;
  border-radius: 16px;
  border: 1px solid #E8EBF0;
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.form-card-title { font-size: 16px; font-weight: 700; color: #1A1A2E; }

/* 폼 그룹 */
.form-group { display: flex; flex-direction: column; gap: 8px; }
.form-label { font-size: 13px; font-weight: 600; color: #374151; }
.required { color: #ef4444; }

/* 카테고리 버튼 */
.category-btns { display: flex; gap: 8px; }
.category-btn {
  padding: 8px 20px; border-radius: 8px;
  border: 1px solid #E0E3EB; background: #fff;
  font-size: 13px; font-weight: 500; color: #6b7280;
  cursor: pointer; transition: all 0.15s;
}
.category-btn.active {
  background: #4973E5; color: #fff;
  border-color: #4973E5; font-weight: 700;
}

/* 입력 */
.form-input {
  width: 100%; padding: 11px 14px;
  border: 1px solid #E0E3EB; border-radius: 10px;
  font-size: 14px; color: #1A1A2E; outline: none;
  transition: border-color 0.15s; box-sizing: border-box;
}
.form-input:focus { border-color: #4973E5; }

/* 에디터 */
.editor-wrap {
  border: 1px solid #E0E3EB; border-radius: 10px; overflow: hidden;
}
.editor-toolbar {
  display: flex; align-items: center; gap: 2px;
  padding: 8px 10px; border-bottom: 1px solid #E8EBF0;
  background: #F8F9FC;
}
.toolbar-btn {
  padding: 4px 8px; border: none; background: transparent;
  font-size: 12px; font-weight: 600; color: #555;
  border-radius: 4px; cursor: pointer; transition: background 0.12s;
}
.toolbar-btn:hover { background: #E8EBF0; }
.toolbar-btn.italic { font-style: italic; }
.toolbar-btn.underline { text-decoration: underline; }
.toolbar-divider { width: 1px; height: 16px; background: #E0E3EB; margin: 0 4px; }
.form-textarea {
  width: 100%; min-height: 280px; padding: 14px;
  border: none; outline: none; resize: none;
  font-size: 14px; line-height: 1.7; color: #1A1A2E;
  font-family: 'Noto  KR'; box-sizing: border-box;
}
.char-count {
  text-align: right; padding: 6px 12px;
  font-size: 11px; color: #9ca3af;
  border-top: 1px solid #F0F0F0;
}

/* 수정 이력 */
.edit-history { padding-top: 8px; border-top: 1px solid #F0F0F0; }
.edit-history-title { font-size: 12px; font-weight: 600; color: #9ca3af; margin-bottom: 8px; }
.edit-history-item { display: flex; align-items: center; gap: 8px; }
.edit-dot { width: 6px; height: 6px; border-radius: 50%; background: #4973E5; flex-shrink: 0; }
.edit-date { font-size: 12px; color: #6b7280; }
.edit-label { font-size: 12px; color: #9ca3af; }

/* 하단 버튼 */
.form-actions {
  display: flex; justify-content: space-between; align-items: center;
  padding-top: 8px; border-top: 1px solid #F0F0F0;
}
.form-actions-right { display: flex; gap: 8px; margin-left: auto; }
.btn-delete {
  padding: 10px 20px; border-radius: 10px;
  border: 1px solid #fecaca; background: #fff;
  color: #dc2626; font-size: 14px; font-weight: 600;
  cursor: pointer; transition: background 0.15s;
}
.btn-delete:hover { background: #fee2e2; }
.btn-cancel {
  padding: 10px 20px; border-radius: 10px;
  border: 1px solid #E0E3EB; background: #fff;
  color: #555; font-size: 14px; font-weight: 600;
  cursor: pointer; transition: background 0.15s;
}
.btn-cancel:hover { background: #F5F6FA; }
.btn-submit {
  padding: 10px 24px; border-radius: 10px;
  border: none; background: #4973E5;
  color: #fff; font-size: 14px; font-weight: 700;
  cursor: pointer; transition: background 0.15s;
}
.btn-submit:hover { background: #3860CC; }

/* 사이드바 */
.sidebar-card {
  background: #fff; border-radius: 16px;
  border: 1px solid #E8EBF0; padding: 16px;
  margin-bottom: 16px;
}
.sidebar-title { font-size: 14px; font-weight: 700; color: #1A1A2E; margin-bottom: 12px; }

/* 작성자 */
.author-box {
  background: #F8F9FC; border-radius: 10px;
  padding: 12px; margin-bottom: 14px;
}
.author-info { display: flex; align-items: center; gap: 10px; }
.avatar {
  width: 34px; height: 34px; border-radius: 50%;
  color: #fff; display: flex; align-items: center;
  justify-content: center; font-size: 14px; font-weight: 700; flex-shrink: 0;
}
.author-detail { display: flex; flex-direction: column; }
.author-name { font-size: 13px; font-weight: 600; color: #1A1A2E; }
.author-unit { font-size: 11px; color: #9ca3af; }

/* 메타 */
.meta-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid #F0F0F0; }
.meta-row:last-child { border-bottom: none; }
.meta-label { font-size: 12px; color: #9ca3af; }
.meta-value { font-size: 12px; color: #374151; font-weight: 500; }

/* 주의사항 */
.notice-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
.notice-list li {
  font-size: 12px; color: #6b7280; line-height: 1.5;
  padding-left: 12px; position: relative;
}
.notice-list li::before {
  content: '•'; color: #F5A623;
  position: absolute; left: 0;
}

@media (max-width: 768px) {
  .form-layout { grid-template-columns: 1fr; }
}
</style>