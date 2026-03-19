<script setup>
// 모달 공통 props
defineProps({
  // 상단 제목
  title: {
    type: String,
    required: true
  },
  // 상단 보조 제목
  subtitle: {
    type: String,
    default: ''
  },
  // 헤더 숨김 여부
  hideHeader: {
    type: Boolean,
    default: false
  },
  // footer 숨김 여부
  hideFooter: {
    type: Boolean,
    default: false
  }
})

// 닫기 이벤트 (x버튼 또는 외부 클릭 시)
const emit = defineEmits(['close'])
</script>

<template>
  <!-- 오버레이 -->
  <div class="modal-overlay">
    <div class="modal-box">

      <!-- 헤더 -->
      <div v-if="!hideHeader" class="modal-header">
        <div>
          <h5 class="modal-title">{{ title }}</h5>
          <p v-if="subtitle" class="modal-subtitle">{{ subtitle }}</p>
        </div>
        <!-- X 버튼 -->
        <button class="btn-close" @click="emit('close')">✕</button>
      </div>

      <!-- 내용 슬롯 -->
      <div class="modal-body">
        <slot />
      </div>

      <!-- 버튼 슬롯 -->
      <div v-if="!hideFooter" class="modal-footer">
        <slot name="footer" />
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
  border-radius: 16px;
  padding: 30px;
  width: 420px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  border: none;
  padding: 0;
}
.modal-title {
  font-size: 18px;
  font-weight: 700;
  color: #1E2533;
  margin: 0 0 6px;
}
.modal-subtitle {
  font-size: 13px;
  color: #888;
  margin: 0;
}
.btn-close {
  background: none;
  border: none;
  font-size: 16px;
  color: #999;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}
.btn-close:hover { color: #333; }
.modal-body {
  padding: 0;
  margin-bottom: 24px;
}
.modal-footer {
  padding: 0;
  border: none;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
</style>