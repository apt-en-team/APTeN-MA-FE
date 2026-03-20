<script setup>
/**
 * ConfirmModal.vue
 * 재사용 가능한 확인 모달 컴포넌트
 *
 * Props:
 *   title         - 모달 제목
 *   subtitle      - 모달 부제목
 *   subtitleColor - 부제목 색상 (기본: '#757575')
 *   itemName      - 1열 값
 *   itemLabel     - 1열 레이블 (기본: '처리 항목')
 *   actionLabel   - 2열 값
 *   actionText    - 2열 레이블 (기본: '처리 내용')
 *   extraValue    - 3열 값 (없으면 행 미표시)
 *   extraLabel    - 3열 레이블 (기본: '')
 *   confirmText   - 확인 버튼 텍스트 (기본: '확인')
 *   cancelText    - 취소 버튼 텍스트 (기본: '취소')
 *   confirmType   - 확인 버튼 색상: 'danger'(빨간) | 'success'(초록) | 'primary'(파란) (기본: 'danger')
 *   loading       - 로딩 상태
 *
 * Events:
 *   @confirm - 확인 버튼 클릭
 *   @cancel  - 취소 버튼 또는 오버레이 클릭
 */
defineProps({
  title: { type: String, default: "확인하시겠습니까?" },
  subtitle: { type: String, default: "" },
  subtitleColor: { type: String, default: "#757575" },
  itemName: { type: String, default: "" },
  itemLabel: { type: String, default: "처리 항목" },
  actionLabel: { type: String, default: "" },
  actionText: { type: String, default: "처리 내용" },
  extraValue: { type: String, default: "" },
  extraLabel: { type: String, default: "" },
  confirmText: { type: String, default: "확인" },
  cancelText: { type: String, default: "취소" },
  confirmType: { type: String, default: "danger" },
  loading: { type: Boolean, default: false },
});

defineEmits(["confirm", "cancel"]);
</script>

<template>
  <div class="modal-overlay" @click.self="$emit('cancel')">
    <div class="modal-box">
      <!-- Warning 아이콘 -->
      <div class="confirm-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 8V12" stroke="#C08B2D" stroke-width="2.2" stroke-linecap="round" />
          <circle cx="12" cy="16" r="1" fill="#C08B2D" />
          <circle cx="12" cy="12" r="9" stroke="#C08B2D" stroke-width="2" />
        </svg>
      </div>

      <!-- 제목 / 부제목 -->
      <h3 class="confirm-title">{{ title }}</h3>
      <p v-if="subtitle" class="confirm-subtitle" :style="{ color: subtitleColor }">
        {{ subtitle }}
      </p>

      <!-- 처리 정보 (최대 3열) -->
      <div v-if="itemName || actionLabel || extraValue" class="confirm-info-box">
        <!-- 1열 -->
        <div v-if="itemName" class="confirm-info-row">
          <span class="confirm-info-label">{{ itemLabel }}</span>
          <span class="confirm-info-value">{{ itemName }}</span>
        </div>
        <!-- 2열 -->
        <div v-if="actionLabel" class="confirm-info-row">
          <span class="confirm-info-label">{{ actionText }}</span>
          <span class="confirm-info-value">{{ actionLabel }}</span>
        </div>
        <!-- 3열 -->
        <div v-if="extraValue" class="confirm-info-row">
          <span class="confirm-info-label">{{ extraLabel }}</span>
          <span class="confirm-info-value">{{ extraValue }}</span>
        </div>
      </div>

      <!-- 슬롯: 거부 사유 등 추가 컨텐츠 -->
      <slot />

      <!-- 버튼 -->
      <div class="confirm-footer">
        <button class="btn-cancel" @click="$emit('cancel')">{{ cancelText }}</button>
        <button
          :class="['btn-confirm', `btn-confirm--${confirmType}`]"
          @click="$emit('confirm')"
          :disabled="loading"
        >
          {{ loading ? "처리 중..." : confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-box {
  background: #fff;
  border-radius: 14px;
  padding: 32px 28px 24px;
  width: 420px;
  max-width: 90vw;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
}

.confirm-icon {
  width: 56px;
  height: 56px;
  margin: 0 auto 16px;
  border-radius: 50%;
  background: rgba(192, 139, 45, 0.14);
  display: flex;
  align-items: center;
  justify-content: center;
}
.confirm-title {
  font-size: 17px;
  font-weight: 700;
  color: #1a202c;
  margin-bottom: 6px;
  font-family: "Noto Sans KR", sans-serif;
}
.confirm-subtitle {
  font-size: 13px;
  margin-bottom: 20px;
  font-family: "Noto Sans KR", sans-serif;
}

.confirm-info-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  text-align: left;
  margin-bottom: 20px;
}
.confirm-info-row {
  display: grid;
  grid-template-columns: 88px 1fr;
  gap: 12px;
  padding: 12px 14px;
  border-bottom: 1px solid #e2e8f0;
}
.confirm-info-row:last-child {
  border-bottom: none;
}
.confirm-info-label {
  font-size: 12px;
  color: #94a3b8;
  font-family: "Noto Sans KR", sans-serif;
}
.confirm-info-value {
  font-size: 13px;
  font-weight: 600;
  color: #1a202c;
  text-align: right;
  font-family: "Noto Sans KR", sans-serif;
}

.confirm-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
}

.btn-cancel {
  padding: 9px 20px;
  border: 1px solid #e2e8f0;
  border-radius: 7px;
  background: #fff;
  font-size: 13px;
  color: #718096;
  cursor: pointer;
  font-family: "Noto Sans KR", sans-serif;
}
.btn-cancel:hover {
  background: #f5f6f8;
}

.btn-confirm {
  padding: 9px 24px;
  border: none;
  border-radius: 7px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: "Noto Sans KR", sans-serif;
}
.btn-confirm:disabled {
  opacity: 0.5;
  cursor: default;
}

.btn-confirm--danger {
  background: #e53e3e;
  color: #fff;
}
.btn-confirm--danger:hover:not(:disabled) {
  background: #c53030;
}
.btn-confirm--success {
  background: #4d8b5a;
  color: #fff;
}
.btn-confirm--success:hover:not(:disabled) {
  background: #3a6e46;
}
.btn-confirm--primary {
  background: #4973e5;
  color: #fff;
}
.btn-confirm--primary:hover:not(:disabled) {
  background: #1962e0;
}
</style>
