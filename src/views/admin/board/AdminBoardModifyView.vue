<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/modules/auth'
import { useBoardStore } from '@/stores/modules/board'
import { getPostDetail } from '@/api/board'
import BoardEditor from '@/components/board/BoardEditor.vue'

const route      = useRoute()
const router     = useRouter()
const auth       = useAuthStore()
const boardStore = useBoardStore()

const postId   = route.params.id
const category = ref('NOTICE')
const title    = ref('')
const content  = ref('')
const createdAt = ref(null)

onMounted(async () => {
  try {
    const res = await getPostDetail(postId)
    const post = res.data
    category.value  = post.category
    title.value     = post.title
    content.value   = post.content
    createdAt.value = post.createdAt
  } catch {
    alert('게시글을 불러올 수 없습니다.')
    router.replace('/admin/board')
  }
})

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return dateStr.replace('T', ' ').slice(0, 16)
}

async function handleSubmit() {
  if (!title.value.trim())   return alert('제목을 입력해주세요.')
  if (!content.value.trim()) return alert('내용을 입력해주세요.')
  try {
    await boardStore.updatePost(postId, { category: category.value, title: title.value, content: content.value })
    router.push(`/admin/boards/${postId}`)
  } catch {
    alert('수정 중 오류가 발생했습니다.')
  }
}

function handleCancel() {
  router.push(`/admin/boards/${postId}`)
}
</script>

<template>
  <div class="admin-board-modify">
    <div class="write-layout">

      <!-- 메인 폼 -->
      <div class="write-main">
        <div class="write-card">
          <h2 class="write-title">공지사항 수정</h2>

          <!-- 카테고리 (고정) -->
          <div class="form-group">
            <label class="form-label">카테고리</label>
            <div class="category-fixed">{{ category }}</div>
          </div>

          <!-- 제목 -->
          <div class="form-group">
            <label class="form-label">제목 <span class="required">*</span></label>
            <input
              v-model="title"
              class="form-input"
              placeholder="제목을 입력해주세요."
              maxlength="200"
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
              <span class="edit-dot" />
              <span class="edit-date">{{ formatDate(createdAt) }}</span>
              <span class="edit-label">최초 작성</span>
            </div>
          </div>

          <!-- 하단 버튼 -->
          <div class="form-actions">
            <div class="form-actions-right">
              <button class="btn-cancel" @click="handleCancel">취소</button>
              <button class="btn-submit" @click="handleSubmit">수정 완료</button>
            </div>
          </div>

        </div>
      </div>

      <!-- 우측 사이드바 -->
      <div class="write-sidebar">

        <!-- 발행 설정 -->
        <div class="sidebar-card">
          <p class="sidebar-title">발행 설정</p>

          <p class="sidebar-label">작성자</p>
          <div class="author-box">
            <div class="author-avatar">관</div>
            <div>
              <p class="author-name">{{ auth.user?.name || '관리사무소' }}</p>
              <p class="author-role">관리자</p>
            </div>
          </div>

          <p class="sidebar-label" style="margin-top: 16px;">최초 작성일</p>
          <p class="sidebar-value">{{ formatDate(createdAt) }}</p>

          <p class="sidebar-label" style="margin-top: 12px;">수정일</p>
          <p class="sidebar-value muted">수정 시 자동 업데이트</p>
        </div>

        <!-- 수정 주의사항 -->
        <div class="sidebar-card">
          <p class="sidebar-title">수정 주의사항</p>
          <ul class="notice-list">
            <li>수정 후 즉시 반영됩니다.</li>
            <li>수정 된 내용이 자동 업데이트됩니다.</li>
            <li>댓글은 수정 시 영향 없습니다.</li>
            <li>삭제는 목록 페이지에서 가능합니다.</li>
          </ul>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-board-modify { width: 100%;  }

.write-layout {
  display: grid;
  grid-template-columns: 1fr 260px;
  gap: 24px;
  align-items: start;
}

.write-card {
  background: #fff;
  border-radius: 10px;
  border: 1px solid #E2E8F0;
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.write-title { font-size: 16px; font-weight: 700; color: #1A202C; }

.form-group { display: flex; flex-direction: column; gap: 8px; }
.form-label { font-size: 13px; font-weight: 600; color: #374151; }
.required { color: #E53E3E; }

.category-fixed {
  display: inline-block;
  padding: 8px 20px; border-radius: 8px;
  background: #2B3A55; color: #fff;
  font-size: 13px; font-weight: 600;
  width: fit-content;
}

.form-input {
  width: 100%; padding: 11px 14px;
  border: 1px solid #E2E8F0; border-radius: 8px;
  font-size: 14px; color: #1A202C; outline: none;
  transition: border-color 0.15s; box-sizing: border-box;

}
.form-input:focus { border-color: #2B3A55; }

.char-count { text-align: right; font-size: 11px; color: #687282; margin-top: 4px; }

/* 수정 이력 */
.edit-history { padding-top: 8px; border-top: 1px solid #F0F2F6; }
.edit-history-title { font-size: 12px; font-weight: 600; color: #687282; margin-bottom: 8px; }
.edit-history-item { display: flex; align-items: center; gap: 8px; }
.edit-dot { width: 6px; height: 6px; border-radius: 50%; background: #2B3A55; flex-shrink: 0; }
.edit-date { font-size: 12px; color: #6b7280; }
.edit-label { font-size: 12px; color: #687282; }

.form-actions {
  display: flex; justify-content: flex-end;
  padding-top: 8px; border-top: 1px solid #F0F2F6;
}
.form-actions-right { display: flex; gap: 8px; }
.btn-cancel {
  padding: 10px 20px; border-radius: 8px;
  border: 1px solid #E2E8F0; background: #fff;
  font-size: 13px; color: #555;
  cursor: pointer; transition: background 0.15s;

}
.btn-cancel:hover { background: #F5F6F8; }
.btn-submit {
  padding: 10px 24px; border-radius: 8px;
  border: none; background: #2B3A55;
  color: #fff; font-size: 13px; font-weight: 700;
  cursor: pointer; transition: background 0.15s;

}
.btn-submit:hover { background: #1E2A3E; }

.sidebar-card {
  background: #fff; border-radius: 10px;
  border: 1px solid #E2E8F0; padding: 18px;
  margin-bottom: 16px;
}
.sidebar-title { font-size: 13px; font-weight: 700; color: #1A202C; margin-bottom: 14px; }
.sidebar-label { font-size: 11px; font-weight: 600; color: #687282; margin-bottom: 6px; }
.sidebar-value { font-size: 13px; color: #374151; }
.sidebar-value.muted { color: #687282; }

.author-box {
  display: flex; align-items: center; gap: 10px;
  background: #F5F6F8; border-radius: 8px; padding: 10px 12px;
}
.author-avatar {
  width: 32px; height: 32px; border-radius: 50%;
  background: #2B3A55; color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700; flex-shrink: 0;
}
.author-name { font-size: 13px; font-weight: 600; color: #1A202C; }
.author-role { font-size: 11px; color: #687282; margin-top: 2px; }

.notice-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
.notice-list li {
  font-size: 12px; color: #6b7280; line-height: 1.5;
  padding-left: 12px; position: relative;
}
.notice-list li::before {
  content: '•'; color: #E53E3E;
  position: absolute; left: 0;
}
</style>