<!-- components/board/CommentItem.vue -->
<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  comment: { type: Object, required: true },
  mode: { type: String, default: 'resident' }, // 'resident' | 'admin'
  currentUserId: { type: Number, default: null },
})

const emit = defineEmits(['delete', 'edit'])

const avatarColors = ['#4973E5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']
function getAvatarColor(name) {
  const idx = (name?.charCodeAt(0) ?? 0) % avatarColors.length
  return avatarColors[idx]
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return dateStr.replace('T', ' ').slice(0, 16)
}

// 수정 버튼 표시 여부
const showEdit = computed(() => {
  if (props.mode === 'admin')    return props.comment.role === 'ADMIN'
  if (props.mode === 'resident') return props.comment.userId === props.currentUserId
  return false
})

// 삭제 버튼 표시 여부
const showDelete = computed(() => {
  if (props.mode === 'admin')    return true  // 관리자는 모든 댓글 삭제 가능
  if (props.mode === 'resident') return props.comment.userId === props.currentUserId
  return false
})

// 인라인 수정
const editing        = ref(false)
const editingContent = ref('')

function startEdit() {
  editing.value        = true
  editingContent.value = props.comment.content
}
function cancelEdit() {
  editing.value = false
}
function saveEdit() {
  emit('edit', { commentId: props.comment.commentId, content: editingContent.value })
  editing.value = false
}
</script>

<template>
  <div class="comment-item" v-if="comment.isDeleted !== 1">
    <div class="comment-header">
      <div class="comment-author-wrap">
        <div class="comment-avatar" :style="{ background: getAvatarColor(comment.authorName) }">
          {{ comment.authorName?.[0] }}
        </div>
        <span class="comment-author">{{ comment.authorName }}</span>

        <!-- 입주자: 글 작성자 배지 -->
        <span v-if="mode === 'resident' && comment.isPostAuthor" class="badge-writer">작성자</span>
        <!-- 관리자: 관리자 배지 -->
        <span v-if="comment.role === 'ADMIN'" class="badge-admin">관리자</span>
      </div>

      <div class="comment-right">
        <span class="comment-date">{{ formatDate(comment.createdAt) }}</span>
        <button v-if="showEdit"   class="btn-edit-comment"   @click="startEdit">수정</button>
        <button v-if="showDelete" class="btn-delete-comment" @click="emit('delete', comment.commentId)">삭제</button>
      </div>
    </div>

    <!-- 수정 모드 -->
    <div v-if="editing" class="comment-edit-wrap">
      <input v-model="editingContent" class="comment-edit-input" />
      <div class="comment-edit-btns">
        <button class="btn-edit-save"   @click="saveEdit">저장</button>
        <button class="btn-edit-cancel" @click="cancelEdit">취소</button>
      </div>
    </div>
    <p v-else class="comment-content">{{ comment.content }}</p>

  </div>
  <div v-else class="comment-item">
    <p class="comment-deleted">(삭제된 댓글입니다.)</p>
  </div>
</template>

<style scoped>
.comment-item { padding: 10px; border-radius: 8px; background: #F8F9FC; }
.comment-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; flex-wrap: nowrap; gap: 6px; }
.comment-author-wrap { display: flex; align-items: center; gap: 6px; min-width: 0; flex-shrink: 1; }
.comment-avatar {
  width: 24px; height: 24px; border-radius: 50%;
  color: #fff; font-size: 11px; font-weight: 700;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.comment-author { font-size: 12px; font-weight: 600; color: #333; white-space: nowrap; }
.badge-writer {
  font-size: 10px; font-weight: 700;
  background: #EEF3FB; color: #4973E5;
  padding: 2px 6px; border-radius: 4px; white-space: nowrap;
}
.badge-admin {
  font-size: 10px; font-weight: 700;
  background: #2B3A55; color: #fff;
  padding: 2px 6px; border-radius: 4px; white-space: nowrap;
}
.comment-right { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
.comment-date { font-size: 11px; color: #bbb; white-space: nowrap; }
.btn-edit-comment {
  font-size: 11px; padding: 2px 8px;
  border: 1px solid #E2E8F0; border-radius: 4px;
  background: #fff; color: #718096;
  cursor: pointer; transition: background 0.12s;
}
.btn-edit-comment:hover { background: #F5F6F8; }
.btn-delete-comment {
  font-size: 11px; padding: 2px 8px;
  border: 1px solid #fecaca; border-radius: 4px;
  background: #fff; color: #dc2626;
  cursor: pointer; transition: background 0.12s;
}
.btn-delete-comment:hover { background: #fee2e2; }
.comment-content { font-size: 13px; color: #444; line-height: 1.5; }
.comment-deleted { font-size: 13px; color: #bbb; font-style: italic; text-align: center; padding: 4px 0; }

.comment-edit-wrap { display: flex; flex-direction: column; gap: 6px; margin-top: 4px; }
.comment-edit-input {
  width: 100%; padding: 7px 10px;
  border: 1px solid #4973E5; border-radius: 6px;
  font-size: 13px; outline: none;

  box-sizing: border-box;
}
.comment-edit-btns { display: flex; gap: 6px; justify-content: flex-end; }
.btn-edit-save {
  padding: 5px 12px; background: #4973E5; color: #fff;
  border: none; border-radius: 6px; font-size: 12px;
  cursor: pointer;
}
.btn-edit-save:hover { background: #3860CC; }
.btn-edit-cancel {
  padding: 5px 12px; background: #fff; color: #718096;
  border: 1px solid #E2E8F0; border-radius: 6px; font-size: 12px;
  cursor: pointer;
}
.btn-edit-cancel:hover { background: #F5F6F8; }
</style>