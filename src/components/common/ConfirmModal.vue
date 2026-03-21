<!-- components/common/ConfirmModal.vue -->
<script setup>
import BaseModal from '@/components/common/BeseModel.vue'

defineProps({
  // 질문 제목 (예: "시설을 삭제하시겠습니까?")
  title: { type: String, default: '' },
  // 보조 설명 (예: "이 작업은 되돌릴 수 없습니다.")
  subtitle: { type: String, default: '' },
  // 경고 문구 (예: "삭제 시 모든 예약 데이터도 함께 삭제됩니다.")
  warnText: { type: String, default: '' },
  // 취소 버튼 문구
  cancelText: { type: String, default: '취소' },
  // 확인 버튼 문구
  confirmText: { type: String, default: '확인' },
  // 버튼 타입: 'danger' | 'admin' | 'resident'
  type: { type: String, default: 'danger' },
})

const emit = defineEmits(['close', 'confirm'])
</script>

<template>
  <BaseModal :title="''" @close="emit('close')">
    <div class="confirm-wrap">

      <!-- 경고 아이콘 -->
      <div class="confirm-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 8V12" stroke="#E53E3E" stroke-width="2.2" stroke-linecap="round"/>
          <circle cx="12" cy="16" r="1" fill="#E53E3E"/>
          <circle cx="12" cy="12" r="9" stroke="#E53E3E" stroke-width="2"/>
        </svg>
      </div>

      <!-- 제목/설명 -->
      <h3 class="confirm-title">{{ title }}</h3>
      <p v-if="subtitle" class="confirm-subtitle">{{ subtitle }}</p>

      <!-- 슬롯: 항목 정보 카드 (선택) -->
      <div v-if="$slots.default" class="confirm-slot">
        <slot />
      </div>

      <!-- 경고 문구 -->
      <p v-if="warnText" class="confirm-warn">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style="flex-shrink:0">
          <path d="M12 8V12" stroke="#E53E3E" stroke-width="2.2" stroke-linecap="round"/>
          <circle cx="12" cy="16" r="1" fill="#E53E3E"/>
          <circle cx="12" cy="12" r="9" stroke="#E53E3E" stroke-width="2"/>
        </svg>
        {{ warnText }}
      </p>

    </div>

    <!-- 하단 버튼 -->
    <template #footer>
      <button class="btn-cancel" @click="emit('close')">{{ cancelText }}</button>
      <button
        class="btn-confirm"
        :class="{
          'btn-danger':   type === 'danger',
          'btn-admin':    type === 'admin',
          'btn-resident': type === 'resident',
        }"
        @click="emit('confirm')"
      >{{ confirmText }}</button>
    </template>
  </BaseModal>
</template>

<style scoped>
.confirm-wrap {
  padding: 12px 0 4px;
  text-align: center;
  font-family: 'Noto Sans KR', sans-serif;
}

/* 아이콘 */
.confirm-icon {
  width: 52px; height: 52px;
  margin: 0 auto 14px;
  border-radius: 50%;
  background: rgba(229, 62, 62, 0.1);
  display: flex; align-items: center; justify-content: center;
}

/* 제목/설명 */
.confirm-title {
  font-size: 17px; font-weight: 700;
  color: #1A202C; margin-bottom: 6px;
}
.confirm-subtitle {
  font-size: 13px; color: #757575;
  margin-bottom: 16px;
}

/* 슬롯 영역 */
.confirm-slot {
  background: #FFF5F5;
  border: 1px solid #FED7D7;
  border-left: 3px solid #E53E3E;
  border-radius: 8px;
  padding: 12px 14px;
  text-align: left;
  margin-bottom: 12px;
  font-size: 13px;
  color: #1A202C;
}

/* 경고 문구 */
.confirm-warn {
  display: flex; align-items: center; gap: 5px;
  font-size: 12px; color: #E53E3E;
  margin-top: 4px;
}

/* 취소 버튼 */
.btn-cancel {
  padding: 9px 20px;
  border: 1px solid #E2E8F0; border-radius: 7px;
  background: #fff; color: #718096;
  font-size: 13px; cursor: pointer;
  font-family: 'Noto Sans KR', sans-serif;
}
.btn-cancel:hover { background: #F5F6F8; }

/* 확인 버튼 공통 */
.btn-confirm {
  padding: 9px 24px;
  border: none; border-radius: 7px;
  color: #fff; font-size: 13px; font-weight: 600;
  cursor: pointer;
  font-family: 'Noto Sans KR', sans-serif;
}

/* 타입별 색상 */
.btn-danger   { background: #E53E3E; }
.btn-danger:hover   { background: #C53030; }
.btn-admin    { background: #2B3A55; }
.btn-admin:hover    { background: #1E2A3E; }
.btn-resident { background: #4973E5; }
.btn-resident:hover { background: #3860CC; }
</style>