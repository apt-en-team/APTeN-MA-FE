<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/modules/auth'
import { useBoardStore } from '@/stores/modules/board'
import BoardEditor from '@/components/board/BoardEditor.vue'
import { uploadBoardFile } from '@/api/board'
import ActionResultModal from '@/components/common/ActionResultModal.vue'

const router     = useRouter()
const auth       = useAuthStore()
const boardStore = useBoardStore()

const category = ref('NOTICE')
const title    = ref('')
const content  = ref('')

const alertModal = ref({ visible: false, title: '', message: '' })

function showAlert(title, message) {
  alertModal.value = { visible: true, title, message }
}

const today = new Date().toLocaleDateString('ko-KR', {
  year: 'numeric', month: '2-digit', day: '2-digit'
}).replace(/\. /g, '.').replace(/\.$/, '')

async function handleSubmit() {
  if (!title.value.trim())   return showAlert('알림', '제목을 입력해주세요.')
  if (!content.value.trim()) return showAlert('알림', '내용을 입력해주세요.')
  try {
    await boardStore.createPost({ category: category.value, title: title.value, content: content.value })
    router.push('/admin/board')
  } catch {
    showAlert('오류', '등록 중 오류가 발생했습니다.')
  }
}

function handleCancel() {
  router.push('/admin/board')
}

// 파일 업로드 핸들러
function handleFileUpload() {
  const input = document.createElement('input')
  input.setAttribute('type', 'file')
  input.setAttribute('accept', '.pdf,.doc,.docx,.xls,.xlsx,.hwp,.hwpx,.ppt,.pptx')
  input.click()
  input.onchange = async () => {
    const file = input.files?.[0]
    if (!file) return
    try {
      const res = await uploadBoardFile(file)
      const { fileUrl, fileName } = res.data
      content.value += `<a href="http://localhost:8080${fileUrl}">${fileName}</a>`
    } catch (e) {
      showAlert('오류', '파일 업로드에 실패했습니다.')
    }
  }
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
            <!-- <button class="btn-draft">임시 저장</button> -->
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

      </div>
    </div>
  </div>

  <ActionResultModal
    v-if="alertModal.visible"
    :title="alertModal.title"
    :desc="alertModal.message"
    type="warning"
    @close="alertModal.value = { visible: false, title: '', message: '' }"
  />

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
  display: flex; justify-content: flex-end; align-items: center;
  padding-top: 8px; border-top: 1px solid #F0F2F6;
}
.form-actions-right { display: flex; gap: 8px; }
/* 임시저장 */
/* .btn-draft {
  padding: 10px 20px; border-radius: 8px;
  border: 1px solid #E2E8F0; background: #fff;
  font-size: 13px; color: #687282;
  cursor: pointer; transition: background 0.15s;

}
.btn-draft:hover { background: #F5F6F8; } */
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
</style>