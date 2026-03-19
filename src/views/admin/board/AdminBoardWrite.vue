<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/modules/auth'
import { useBoardStore } from '@/stores/modules/board'
import BoardEditor from '@/components/board/BoardEditor.vue'

const router     = useRouter()
const auth       = useAuthStore()
const boardStore = useBoardStore()

const category = ref('NOTICE')
const title    = ref('')
const content  = ref('')

const today = new Date().toLocaleDateString('ko-KR', {
  year: 'numeric', month: '2-digit', day: '2-digit'
}).replace(/\. /g, '.').replace('.', '')

async function handleSubmit() {
  if (!title.value.trim())   return alert('제목을 입력해주세요.')
  if (!content.value.trim()) return alert('내용을 입력해주세요.')
  try {
    await boardStore.createPost({ category: category.value, title: title.value, content: content.value })
    router.push('/admin/board')
  } catch {
    alert('등록 중 오류가 발생했습니다.')
  }
}

function handleCancel() {
  router.push('/admin/board')
}
</script>

<template>
  <div class="admin-board-write">
    <div class="write-layout">

      <!-- 메인 폼 -->
      <div class="write-main">
        <div class="write-card">
          <h2 class="write-title">공지사항 작성</h2>

          <!-- 카테고리는 NOTICE로 고정 -->

          <!-- 제목 -->
          <div class="form-group">
            <label class="form-label">제목 <span class="required">*</span></label>
            <input
              v-model="title"
              class="form-input"
              placeholder="공지사항 제목을 입력해주세요."
              maxlength="200"
            />
          </div>

          <!-- 내용 -->
          <div class="form-group">
            <label class="form-label">내용 <span class="required">*</span></label>
            <BoardEditor v-model="content" />
            <div class="char-count">{{ content.length }} / 5000자</div>
          </div>

          <!-- 하단 버튼 -->
          <div class="form-actions">
            <button class="btn-draft">임시 저장</button>
            <div class="form-actions-right">
              <button class="btn-cancel" @click="handleCancel">취소</button>
              <button class="btn-submit" @click="handleSubmit">등록하기</button>
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

          <p class="sidebar-label" style="margin-top: 16px;">게시 상태</p>
          <div class="status-box">
            <div class="status-check">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <span class="status-text">즉시 게시</span>
          </div>

          <p class="sidebar-label" style="margin-top: 16px;">작성일</p>
          <p class="sidebar-value">{{ today }}</p>
        </div>

        <!-- 첨부 파일 -->
        <div class="sidebar-card">
          <p class="sidebar-title">첨부 파일</p>
          <div class="upload-box">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#687282" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"/>
            </svg>
            <p class="upload-text">클릭하여 파일 업로드</p>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-board-write { width: 100%;  }

.write-layout {
  display: grid;
  grid-template-columns: 1fr 260px;
  gap: 24px;
  align-items: start;
}

/* 메인 카드 */
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

/* 폼 그룹 */
.form-group { display: flex; flex-direction: column; gap: 8px; }
.form-label { font-size: 13px; font-weight: 600; color: #374151; }
.required { color: #E53E3E; }

/* 입력 */
.form-input {
  width: 100%; padding: 11px 14px;
  border: 1px solid #E2E8F0; border-radius: 8px;
  font-size: 14px; color: #1A202C; outline: none;
  transition: border-color 0.15s; box-sizing: border-box;

}
.form-input:focus { border-color: #2B3A55; }
.form-input::placeholder { color: #687282; }

/* 글자수 */
.char-count {
  text-align: right; font-size: 11px; color: #687282;
  margin-top: 4px;
}

/* 하단 버튼 */
.form-actions {
  display: flex; justify-content: space-between; align-items: center;
  padding-top: 8px; border-top: 1px solid #F0F2F6;
}
.form-actions-right { display: flex; gap: 8px; }
.btn-draft {
  padding: 10px 20px; border-radius: 8px;
  border: 1px solid #E2E8F0; background: #fff;
  font-size: 13px; color: #687282;
  cursor: pointer; transition: background 0.15s;

}
.btn-draft:hover { background: #F5F6F8; }
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

/* 사이드바 */
.sidebar-card {
  background: #fff; border-radius: 10px;
  border: 1px solid #E2E8F0; padding: 18px;
  margin-bottom: 16px;
}
.sidebar-title { font-size: 13px; font-weight: 700; color: #1A202C; margin-bottom: 14px; }
.sidebar-label { font-size: 11px; font-weight: 600; color: #687282; margin-bottom: 8px; }
.sidebar-value { font-size: 13px; color: #374151; }

/* 작성자 */
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

/* 게시 상태 */
.status-box {
  display: flex; align-items: center; gap: 8px;
  background: #F5F6F8; border-radius: 8px; padding: 10px 12px;
}
.status-check {
  width: 20px; height: 20px; border-radius: 4px;
  background: #2B3A55;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.status-text { font-size: 13px; font-weight: 600; color: #1A202C; }

/* 첨부 파일 */
.upload-box {
  border: 1.5px dashed #E2E8F0; border-radius: 8px;
  padding: 28px; display: flex; flex-direction: column;
  align-items: center; gap: 8px; cursor: pointer;
  transition: border-color 0.15s;
}
.upload-box:hover { border-color: #2B3A55; }
.upload-text { font-size: 12px; color: #687282; }
</style>