<script setup>
import {ref, watch} from 'vue'
import BaseModal from '@/components/common/BeseModel.vue'
// 삭제/취소 확인 모달 → ConfirmModal
import ConfirmModal from '@/components/common/ConfirmModal.vue'
// 처리 결과 모달 → ActionResultModal
import ActionResultModal from '@/components/common/ActionResultModal.vue'

const props = defineProps({
  activeModal:  {type: String, default: null},
  selectedItem: {type: Object, default: null},
  today:        {type: String, required: true}
})

const emit = defineEmits([
  'close',
  'open-reuse', 'open-edit', 'open-delete', 'open-cancel',
  'reuse-submit', 'edit-submit', 'delete-submit', 'cancel-submit'
])

// 재사용 폼
const reuseDate    = ref('')
const reuseLoading = ref(false)
const reuseError   = ref('')

// 수정 폼
const editForm    = ref({licensePlate: '', visitorName: '', visitPurpose: '', visitDate: ''})
const editLoading = ref(false)
const editError   = ref('')

// 삭제/취소 공통
const actionLoading = ref(false)
const actionError   = ref('')

// 모달 열릴 때마다 폼 초기화
watch(() => props.activeModal, (val) => {
  if (val === 'reuse') {
    reuseDate.value  = ''
    reuseError.value = ''
  }
  if (val === 'edit' && props.selectedItem) {
    editForm.value = {
      licensePlate: props.selectedItem.licensePlate || '',
      visitorName:  props.selectedItem.visitorName  || '',
      visitPurpose: props.selectedItem.visitPurpose || '',
      visitDate:    props.selectedItem.visitDate    || '',
    }
    editError.value = ''
  }
  if (val === 'delete' || val === 'cancel') {
    actionError.value = ''
  }
})

const handleReuseSubmit = () => {
  if (!reuseDate.value) return
  emit('reuse-submit', reuseDate.value,
      (err) => { reuseError.value   = err },
      (v)   => { reuseLoading.value = v   }
  )
}

const handleEditSubmit = () => {
  if (!editForm.value.licensePlate || !editForm.value.visitDate) {
    editError.value = '차량번호와 방문 예정일은 필수입니다.'
    return
  }
  emit('edit-submit', {...editForm.value},
      (err) => { editError.value   = err },
      (v)   => { editLoading.value = v   }
  )
}

const handleDeleteSubmit = () => {
  emit('delete-submit',
      (err) => { actionError.value   = err },
      (v)   => { actionLoading.value = v   }
  )
}

const handleCancelSubmit = () => {
  emit('cancel-submit',
      (err) => { actionError.value   = err },
      (v)   => { actionLoading.value = v   }
  )
}

const formatDate     = (d)  => d  ? d.replaceAll('-', '.') : '-'
const formatDateTime = (dt) => dt ? dt.replace('T', ' ').substring(0, 16) : '-'
</script>

<template>

  <!-- ========== 상세 모달: BaseModal ========== -->
  <BaseModal v-if="activeModal === 'detail'" title="방문차량 상세" @close="emit('close')">
    <div class="detail-info" v-if="selectedItem">
      <div class="detail-row"><span class="detail-label">차량번호</span><span class="detail-value bold">{{ selectedItem.licensePlate }}</span></div>
      <div class="detail-row"><span class="detail-label">방문자</span><span class="detail-value">{{ selectedItem.visitorName || '-' }}</span></div>
      <div class="detail-row"><span class="detail-label">방문 목적</span><span class="detail-value">{{ selectedItem.visitPurpose || '-' }}</span></div>
      <div class="detail-row"><span class="detail-label">방문 예정일</span><span class="detail-value">{{ formatDate(selectedItem.visitDate) }}</span></div>
      <div class="detail-row">
        <span class="detail-label">승인 상태</span>
        <span class="badge" :class="selectedItem.status === 'APPROVED' ? 'badge-approved' : 'badge-rejected'">
          {{ selectedItem.status === 'APPROVED' ? '승인' : '거부' }}
        </span>
      </div>
      <div class="detail-row"><span class="detail-label">등록일시</span><span class="detail-value">{{ formatDateTime(selectedItem.createdAt) }}</span></div>
    </div>
    <template #footer>
      <button class="btn-modal-cancel" @click="emit('close')">닫기</button>
      <button class="btn-modal-action" @click="emit('open-reuse')">재사용 등록</button>
    </template>
  </BaseModal>

  <!-- ========== 재사용 모달: BaseModal ========== -->
  <BaseModal v-if="activeModal === 'reuse'" title="방문차량 재사용 등록" subtitle="동일 차량 정보로 새 방문일만 선택합니다." @close="emit('close')">
    <p class="reuse-info">{{ selectedItem?.licensePlate }} ({{ selectedItem?.visitorName || '-' }})</p>
    <div class="field">
      <label>새 방문 예정일 <span class="required">*</span></label>
      <input v-model="reuseDate" type="date" :min="today"/>
    </div>
    <p v-if="reuseError" class="error">{{ reuseError }}</p>
    <template #footer>
      <button class="btn-modal-cancel" @click="emit('close')">취소</button>
      <button class="btn-modal-confirm" @click="handleReuseSubmit" :disabled="reuseLoading || !reuseDate">
        {{ reuseLoading ? '등록 중...' : '재등록' }}
      </button>
    </template>
  </BaseModal>

  <!-- ========== 수정 모달: BaseModal ========== -->
  <BaseModal v-if="activeModal === 'edit'" title="방문차량 수정" @close="emit('close')">
    <div class="field">
      <label>차량번호 <span class="required">*</span></label>
      <input v-model="editForm.licensePlate" type="text" placeholder="12가 3456"/>
    </div>
    <div class="field">
      <label>방문자 이름</label>
      <input v-model="editForm.visitorName" type="text" placeholder="홍길동"/>
    </div>
    <div class="field">
      <label>방문 목적</label>
      <input v-model="editForm.visitPurpose" type="text" placeholder="업무 방문"/>
    </div>
    <div class="field">
      <label>방문 예정일 <span class="required">*</span></label>
      <input v-model="editForm.visitDate" type="date" :min="today"/>
    </div>
    <p v-if="editError" class="error">{{ editError }}</p>
    <template #footer>
      <button class="btn-modal-cancel" @click="emit('close')">취소</button>
      <button class="btn-modal-confirm" @click="handleEditSubmit" :disabled="editLoading">
        {{ editLoading ? '저장 중...' : '수정 저장' }}
      </button>
    </template>
  </BaseModal>

  <!-- ========== 삭제 확인 모달: ConfirmModal (입주민 → theme="resident") ========== -->
  <ConfirmModal
      v-if="activeModal === 'delete'"
      title="방문차량을 삭제하시겠습니까?"
      subtitle="이 작업은 되돌릴 수 없습니다."
      item-label="차량번호"
      action-text="방문자"
      :item-name="selectedItem?.licensePlate"
      :action-label="selectedItem?.visitorName || '-'"
      confirm-text="삭제"
      confirm-type="danger"
      theme="resident"
      :loading="actionLoading"
      @confirm="handleDeleteSubmit"
      @cancel="emit('close')"
  />

  <!-- ========== 등록 취소 확인 모달: ConfirmModal (입주민 → theme="resident") ========== -->
  <ConfirmModal
      v-if="activeModal === 'cancel'"
      title="등록을 취소하시겠습니까?"
      item-label="차량번호"
      action-text="방문자"
      :item-name="selectedItem?.licensePlate"
      :action-label="selectedItem?.visitorName || '-'"
      confirm-text="등록 취소"
      confirm-type="danger"
      theme="resident"
      :loading="actionLoading"
      @confirm="handleCancelSubmit"
      @cancel="emit('close')"
  />

  <!-- ========== 성공 모달: ActionResultModal (입주민 → theme="resident") ========== -->
  <ActionResultModal
      v-if="activeModal === 'success'"
      type="success"
      :title="selectedItem?._successMsg || '처리 완료'"
      confirm-text="확인"
      theme="resident"
      @close="emit('close')"
  />

</template>

<style scoped>
.detail-info { display: flex; flex-direction: column; gap: 4px; }
.detail-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #F0F1F5; }
.detail-row:last-child { border-bottom: none; }
.detail-label { font-size: 13px; font-weight: 600; color: #555; }
.detail-value { font-size: 14px; color: #1A1A2E; }
.detail-value.bold { font-weight: 700; font-size: 16px; }
.badge { font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 20px; }
.badge-approved { background: #E6F9EE; color: #2EAD5C; }
.badge-rejected { background: #FFF0F0; color: #E05555; }
.field { margin-bottom: 14px; }
.field label { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: #555; margin-bottom: 8px; }
.field input { width: 100%; padding: 11px 14px; border: 1px solid #E0E3EB; border-radius: 10px; font-size: 14px; color: #1A1A2E; box-sizing: border-box; }
.field input:focus { outline: none; border-color: #4973E5; }
.required { color: #E05555; }
.reuse-info { font-size: 14px; font-weight: 600; color: #1A1A2E; margin: 0 0 16px; }
.error { color: #E05555; font-size: 13px; margin: 4px 0 0; }
.btn-modal-cancel { flex: 1; padding: 10px; border: 1px solid #E0E3EB; border-radius: 8px; background: #fff; color: #555; font-size: 14px; font-weight: 600; cursor: pointer; }
.btn-modal-cancel:hover { background: #F5F6FA; }
.btn-modal-confirm { flex: 1; padding: 10px; background: #4973E5; color: #fff; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }
.btn-modal-confirm:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-modal-action { flex: 1; padding: 10px; background: #4973E5; color: #fff; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }
</style>